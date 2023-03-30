import * as geofire from 'geofire-common'
const admin = require('firebase-admin')

type GeolocationCoordinates = {
  longitude: number
  latitude: number
  accuracy: number
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
}

const COLLECTIONS = {
  TAGS: 'tags',
  USERS: 'users',
  COMMENTS: 'comments',
  BUILDINGS: 'buildings',
  TRANS: 'trans',
  POLYS: 'polygons',
  FRNS: 'frns',
  VEGS: 'vegs'
}

// Geohashの補助とか
const HALF_EARTH = 20037508.34

const lonToSphMerc = (lon: number) => {
  return (lon / 180) * HALF_EARTH
}

const latToSphMerc = (lat: number) => {
  var y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)
  return (y * HALF_EARTH) / 180.0
}

// const getGeoHash = (lat: number, lon: number) => {
//   return geofire.geohashForLocation([lat, lon])
// }

const getGeoBounds = (coord: GeolocationCoordinates, radius: number) => {
  return geofire.geohashQueryBounds([coord.latitude, coord.longitude], radius)
}

const calculateFootprintRadius = (footprint: any[], center: any) => {
  if (footprint.length === 0) {
    return 0
  }
  let distanceSum = 0
  for (const point of footprint) {
    const latDif = latToSphMerc(point.latitude) - latToSphMerc(center.latitude)
    const lonDif =
      lonToSphMerc(point.longitude) - lonToSphMerc(center.longitude)
    distanceSum = distanceSum + Math.sqrt(latDif * latDif + lonDif * lonDif)
  }
  return distanceSum / footprint.length
}

const createCenterPoint = (data: any) => {
  if (data.geoPoint) {
    return {
      latitude: data.geoPoint.latitude,
      longitude: data.geoPoint.longitude,
      altitude: data.altitude
    }
  }
  if (data.geopoint) {
    return {
      latitude: data.geopoint.latitude,
      longitude: data.geopoint.longitude,
      altitude: data.altitude
    }
  }
  return {
    latitude: 0,
    longitude: 0,
    altitude: data.altitude
  }
}

const documentListFromBoundsSnaps = (boundsSnaps: any[]) => {
  const items: any[] = []
  for (const bSnap of boundsSnaps) {
    if (bSnap === null) {
      continue
    }
    bSnap.docs.forEach((doc: any) => {
      // 一応重複チェック
      if (
        items.filter((item) => {
          return item.id === doc.id
        }).length > 0
      ) {
        return
      }
      items.push(doc)
    })
  }
  return items
}

// DocumentSnapshotから基本オブジェクトへの変換
const createBuildingFromSnapshot = (doc: any) => {
  const data = doc.data()
  const center = createCenterPoint(data)
  const radius = calculateFootprintRadius(data.footprint, center)
  const created = data.created
  const modified = data.modified
  const item = {
    gmlID: doc.id,
    footprint: data.footprint,
    center: center,
    bldgID: data.bldgID,
    created: created,
    modified: modified,
    height: data.height,
    radius: radius
  }
  return item
}

const createTagFromSnapshot = (doc: any) => {
  const data = doc.data()
  const center = createCenterPoint(data)
  const created = data.created
  const modified = data.modified
  const commented = data.commented
  const obj = {
    tagID: doc.id,
    gmlID: data.gmlID,
    subject: data.subject,
    label: data.label,
    description: data.description,
    createdBy: data.createdby,
    editors: data.allowedtoedit,
    hashtag: data.hashtag,
    category: data.category,
    group: data.group,
    hide: data.hide,
    like: data.like,
    offset: data.offset,
    center: center,
    created: created,
    modified: modified,
    photo: data.photo,
    commented: commented,
    commentCounts: data.counts,
    comments: []
  }
  return obj
}

const createCommentFromSnapshot = (doc: any) => {
  const data = doc.data()
  const created = data.created
  const modified = data.modified
  const obj = {
    commentId: doc.id,
    comment: data.comment,
    createdBy: data.createdby,
    editors: data.allowedtoedit,
    created: created,
    modified: modified
  }
  return obj
}

const createFrnFromSnapshot = (doc: any) => {
  const data = doc.data()
  const center = createCenterPoint(data)
  const created = data.created
  const modified = data.modified
  const item = {
    gmlID: doc.id,
    footprint: data.footprint,
    center: center,
    frnID: data.frnID,
    created: created,
    modified: modified,
    height: data.height,
    attributes: data.attributes,
    type: data.type
  }
  return item
}

const createVegFromSnapshot = (doc: any) => {
  const data = doc.data()
  const center = createCenterPoint(data)
  const created = data.created
  const modified = data.modified
  const item = {
    gmlID: doc.id,
    footprint: data.footprint,
    center: center,
    vegID: data.vegID,
    created: created,
    modified: modified,
    height: data.height,
    attributes: data.attributes,
    type: data.type
  }
  return item
}

// DocumentSnapshotから基本オブジェクトへの変換
const createPolyFromSnapshot = (doc: any) => {
  const data = doc.data()
  const center = createCenterPoint(data)
  const created = data.created
  const modified = data.modified
  const item: any = {
    id: doc.id,
    type: data.type,
    triangle: data.polygon,
    center: center,
    created: created,
    modified: modified
  }
  if (item.type === 'tran') {
    item.roadID = data.roadID
    item.trafficID = data.trafficID
  }
  if (item.type === 'brid') {
    item.bridID = data.bridID
  }
  return item
}

// DocumentSnapshotから基本オブジェクトへの変換
const createTranFromSnapshot = (doc: any) => {
  const data = doc.data()
  const center = createCenterPoint(data)
  const created = data.created
  const modified = data.modified
  const item = {
    gmlID: data.gmlID,
    id: doc.id,
    roadmap: data.roadmap,
    center: center,
    created: created,
    modified: modified
  }
  return item
}

// geohashからdocumentを取得し、１つのリストにまとめる所（共通）
const getGeoHashDocuments = async (
  colName: string,
  hashName: string,
  coord: any,
  radius: number
) => {
  const colRef = admin.firestore().collection(colName)
  const bounds = getGeoBounds(coord, radius)
  const boundsSnaps = await Promise.all(
    bounds.map((b) => {
      const q = colRef.orderBy(hashName).startAt(b[0]).endAt(b[1])
      return q.get()
    })
  )
  const dList = documentListFromBoundsSnaps(boundsSnaps)
  return dList
}

export const getBuildings = async (
  coord: GeolocationCoordinates,
  radius: number
) => {
  const dList = await getGeoHashDocuments(
    COLLECTIONS.BUILDINGS,
    'geoHash',
    coord,
    radius
  )
  const items = dList.map((doc) => {
    return createBuildingFromSnapshot(doc)
  })
  return items
}

export const getCommentsFromFirestore = async (
  tagId: string,
  counts: number
) => {
  const commentRef = admin
    .firestore()
    .collection(COLLECTIONS.TAGS)
    .doc(tagId)
    .collection(COLLECTIONS.COMMENTS)
  const q = commentRef.orderBy('created', 'desc').limit(counts)
  const snapShots = await q.get()
  if (snapShots.docs.length === 0) {
    return []
  } else {
    const comments: any[] = []
    snapShots.docs.forEach((doc) => {
      const obj = createCommentFromSnapshot(doc)
      comments.push(obj)
    })
    return comments
  }
}

export const getTags = async (
  coord: GeolocationCoordinates,
  radius: number
) => {
  const dList = await getGeoHashDocuments(
    COLLECTIONS.TAGS,
    'geohash',
    coord,
    radius
  )
  const items = dList.map((doc) => {
    return createTagFromSnapshot(doc)
  })
  return items
}

export const getTrans = async (
  coord: GeolocationCoordinates,
  radius: number
) => {
  const dList = await getGeoHashDocuments(
    COLLECTIONS.TRANS,
    'geoHash',
    coord,
    radius
  )
  const items = dList.map((doc) => {
    return createTranFromSnapshot(doc)
  })
  return items
}

export const getPolygons = async (
  coord: GeolocationCoordinates,
  radius: number
) => {
  const dList = await getGeoHashDocuments(
    COLLECTIONS.POLYS,
    'geoHash',
    coord,
    radius
  )
  const items = dList.map((doc) => {
    return createPolyFromSnapshot(doc)
  })
  return items
}

export const getFrns = async (
  coord: GeolocationCoordinates,
  radius: number
) => {
  const dList = await getGeoHashDocuments(
    COLLECTIONS.FRNS,
    'geoHash',
    coord,
    radius
  )
  const items = dList.map((doc) => {
    return createFrnFromSnapshot(doc)
  })
  return items
}

export const getVegs = async (
  coord: GeolocationCoordinates,
  radius: number
) => {
  const dList = await getGeoHashDocuments(
    COLLECTIONS.VEGS,
    'geoHash',
    coord,
    radius
  )
  const items = dList.map((doc) => {
    return createVegFromSnapshot(doc)
  })
  return items
}
