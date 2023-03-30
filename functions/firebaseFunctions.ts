import { PromisePool } from '@supercharge/promise-pool'
import * as functions from 'firebase-functions'
import next from 'next'
import { getBuildings, getTags, getFrns, getVegs } from './appapi'
import {
  getTagsComments,
  getTagsFromGeoLocation,
  filterTags,
  getTagFromFirestoreWithTagID,
  getTagsFromFirestoreWithBldgID,
  getTagsFromFirestoreWithGmlID,
  translateTagToGeoJson,
  createPublicUrlOfTagImages,
  updateTagUserData,
  getTagCounts
} from './tags'

const express = require('express')
const admin = require('firebase-admin')
admin.initializeApp()

const nextjsServer = next({
  dev: false,
  conf: {
    distDir: '.next',
    future: {},
    experimental: {}
  }
})
const nextjsHandle = nextjsServer.getRequestHandler()

// @see https://firebase.google.com/docs/hosting/full-config?hl=ja#rewrite-functions
const getFn = () => {
  const region = 'asia-northeast1'
  return functions.region(region)
}

export const nextApp = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    await nextjsServer.prepare()
    return nextjsHandle(req, res)
  })

const bodyHasKeyValue = (body: any, key: string) => {
  if (isUorNull(body)) {
    return false
  }
  if (isUorNull(body[key])) {
    return false
  }
  return true
}

const isNumValue = (value: any) => {
  if (isUorNull(value)) {
    return false
  }
  return value.replace(/[ ]/g, '') !== '' && !isNaN(value)
}

const isUorNull = (value: any) => {
  if (typeof value === 'undefined' || value == null) {
    return true
  }
  return false
}

const reqToken = '' // tokenを入れて下さい

const authorizeCheck = (req: any) => {
  // 認証情報なし
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer ')
  ) {
    return {
      access: false,
      message: 'Bearer realm="token_required"'
    }
  }

  const idToken = req.headers.authorization.split('Bearer ')[1]
  if (idToken === reqToken) {
    return {
      access: true,
      message: ''
    }
  }
  return {
    access: false,
    message: 'token wrong'
  }
}

const app = express()
app.get('/', (req: any, res: any) => res.status(200).send('Hey there!'))

app.get('/tags', async (req: any, res: any) => {
  // const tagData = new Set<string>()
  if (bodyHasKeyValue(req.query, 'export') && req.query.export) {
    if (bodyHasKeyValue(req.query, 'token') && req.query.token) {
      if (req.query.token !== reqToken) {
        res.status(401).json({ error: 'token wrong.' })
      }
      res.setHeader('Access-Control-Allow-Origin', '*')
    } else {
      res.status(401).json({ error: 'Token is required.' })
    }
  } else {
    const authorize = authorizeCheck(req)
    if (!authorize.access) {
      res.status(401).json({ error: authorize.message })
    }
  }
  console.log(req.query)
  const q = {
    lat: 0,
    lon: 0,
    r: 200,
    c: 5,
    fC: 'None',
    group: '',
    fH: [] as string[]
  }
  if (bodyHasKeyValue(req.query, 'lat') && bodyHasKeyValue(req.query, 'lon')) {
    if (isNumValue(req.query.lat) && isNumValue(req.query.lon)) {
      q.lat = Number(req.query.lat)
      q.lon = Number(req.query.lon)
    } else {
      res.status(402).json({ error: 'Incorrect geocode parameters.' })
    }
  } else {
    res
      .status(402)
      .json({ error: 'Geocode parameters [lat] [lon] are required.' })
  }

  if (bodyHasKeyValue(req.query, 'radius') && isNumValue(req.query.radius)) {
    q.r = Number(req.query.radius)
    if (q.r > 500) {
      q.r = 500
    }
  }

  if (bodyHasKeyValue(req.query, 'comment') && isNumValue(req.query.comment)) {
    q.c = Number(req.query.comment)
  }

  if (bodyHasKeyValue(req.query, 'category')) {
    q.fC = req.query.category
  }
  if (bodyHasKeyValue(req.query, 'group')) {
    q.group = req.query.group
  }
  if (bodyHasKeyValue(req.query, 'hash')) {
    try {
      const fH = JSON.parse(req.query.hash)
      console.log(fH)
      if (Array.isArray(fH)) {
        q.fH = fH
      }
    } catch (e) {
      console.error(e)
    }
  } else {
    console.log('not hash array')
  }

  console.log(q)

  try {
    const gTags = await getTagsFromGeoLocation(q.lat, q.lon, q.r)
    console.log('g')
    // console.log(gTags)
    const fTags = filterTags(gTags, q.fC, q.group, q.fH)
    await PromisePool.for(fTags)
      .withConcurrency(10)
      .process(async (aTag) => {
        await createPublicUrlOfTagImages(aTag)
        await updateTagUserData(aTag)
        return null
      })
    if (bodyHasKeyValue(req.query, 'export') && req.query.export) {
      const geoTags = fTags.map((tag) => {
        return translateTagToGeoJson(tag)
      })
      const geoJson = {
        type: 'FeatureCollection',
        features: geoTags
      }
      res.status(200).send(geoJson)
    } else {
      const cTags = await getTagsComments(fTags, q.c)
      res.status(200).send(cTags)
    }
  } catch (e: any) {
    console.error(e)
    res.status(404).json({ error: e.message })
  }
})

app.get('/tags/:id', async (req: any, res: any) => {
  const authorize = authorizeCheck(req)
  if (!authorize.access) {
    res.status(401).json({ error: authorize.message })
  }
  const tagId = req.params.id
  if (tagId === 'count') {
    try {
      const counts = await getTagCounts()
      res.status(200).send({ count: counts })
      return
    } catch (e) {
      console.error(e)
      res.status(404).json({ error: e.message })
    }
  } else {
    try {
      const tag = await getTagFromFirestoreWithTagID(tagId, 100)
      if (tag === null) {
        res.status(403).json({ error: 'No tag found.' })
      } else {
        await createPublicUrlOfTagImages(tag)
        await updateTagUserData(tag)
        res.status(200).send(tag)
      }
    } catch (e) {
      console.error(e)
      res.status(404).json({ error: e.message })
    }
  }
})

app.get('/buildings/:id/tags', async (req: any, res: any) => {
  const authorize = authorizeCheck(req)
  if (!authorize.access) {
    res.status(401).json({ error: authorize.message })
  }
  const buildingId = req.params.id
  try {
    const tags = await getTagsFromFirestoreWithBldgID(buildingId, 5)
    if (tags) {
      await PromisePool.for(tags)
        .withConcurrency(10)
        .process(async (aTag) => {
          await createPublicUrlOfTagImages(aTag)
          await updateTagUserData(aTag)
          return null
        })
    }
    res.status(200).send(tags)
  } catch (e) {
    console.error(e)
    res.status(404).json({ error: e.message })
  }
})

app.get('/target/:id/tags', async (req: any, res: any) => {
  const authorize = authorizeCheck(req)
  if (!authorize.access) {
    res.status(401).json({ error: authorize.message })
  }
  const gmlID = req.params.id
  try {
    const tags = await getTagsFromFirestoreWithGmlID(gmlID, 5)
    if (tags) {
      await PromisePool.for(tags)
        .withConcurrency(10)
        .process(async (aTag) => {
          await createPublicUrlOfTagImages(aTag)
          await updateTagUserData(aTag)
          return null
        })
    }
    res.status(200).send(tags)
  } catch (e) {
    console.error(e)
    res.status(404).json({ error: e.message })
  }
})

exports.rest = getFn().runWith({ memory: '1GB' }).https.onRequest(app)

const getDataFromGeoLocation = async (data, context) => {
  if (context.auth === null || context.auth === undefined) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You are not authorized.'
    )
  }
  if (!data.coords || !data.radius) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'coord and radius are required.'
    )
  }
  try {
    const newBuildings = await getBuildings(data.coords, data.radius)
    const newTags = await getTags(data.coords, data.radius)
    const newFrns = await getFrns(data.coords, data.radius)
    const newVegs = await getVegs(data.coords, data.radius)
    return {
      buildings: newBuildings,
      frns: newFrns,
      tags: newTags,
      vegs: newVegs
    }
  } catch (e) {
    console.log(e)
  }
  return {
    buildings: [],
    frns: [],
    tags: []
  }
}

exports.getDataFromGeoLocation = getFn()
  .runWith({ memory: '1GB' })
  .https.onCall(getDataFromGeoLocation)
