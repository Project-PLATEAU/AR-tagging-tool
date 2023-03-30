import * as geofire from 'geofire-common'
const admin = require('firebase-admin')

const COLLECTIONS = {
  TAGS: 'tags',
  USERS: 'users',
  COMMENTS: 'comments',
  BUILDINGS: 'buildings'
}

const STORAGE_ROOT = 'https://firebasestorage.googleapis.com/v0/b'
const bucketName = '*** project-name ***.appspot.com'

const getGeoBounds = (latitude: number, longitude: number, radius: number) => {
  return geofire.geohashQueryBounds([latitude, longitude], radius)
}

const createTagFromSnapshot = (doc: any) => {
  const data = doc.data()
  const center = {
    latitude: data.geopoint.latitude,
    longitude: data.geopoint.longitude,
    altitude: data.altitude
  }
  const created = data.created.toDate()
  const modified = data.modified.toDate()
  const commented = data.commented.toDate()
  const obj = {
    tagID: doc.id,
    gmlID: doc.gmlID,
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
  const created = data.created.toDate()
  const modified = data.modified.toDate()
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

const getCommentsFromFirestore = async (tagId: string, counts: number) => {
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
    snapShots.docs.forEach((doc: any) => {
      const obj = createCommentFromSnapshot(doc)
      comments.push(obj)
    })
    return comments
  }
}

export const getUserData = async (userId: string) => {
  const userRef = admin.firestore().collection(COLLECTIONS.USERS).doc(userId)
  const doc = await userRef.get()
  const userData: any = {
    displayName: ''
  }
  if (doc.exists) {
    const data = doc.data()
    userData.displayName = data.displayName
    if (data.profile) {
      const profileUrl = await createPublicUrlOfProfileImage(
        userId,
        data.profile
      )
      userData.profile = profileUrl
    }
  }
  return userData
}

const createPublicUrlOfProfileImage = async (
  userId: string,
  profile: string
) => {
  const storageBucket = admin.storage().bucket(bucketName)
  const refPath = 'users/' + userId + '/' + profile
  const storageRef = storageBucket.file(refPath)
  const [result] = await storageRef.getMetadata()
  if (result.metadata && result.metadata.firebaseStorageDownloadTokens) {
    const token = result.metadata.firebaseStorageDownloadTokens
    const path = encodeURIComponent(refPath)
    const url =
      STORAGE_ROOT +
      '/' +
      bucketName +
      '/o/' +
      path +
      '?alt=media&token=' +
      token
    return url
  }
  return profile
}

export const updateTagUserData = async (tag: any) => {
  const userData = await getUserData(tag.createdBy)
  tag.createdBy = {
    id: tag.createdBy,
    ...userData
  }
}

export const createPublicUrlOfTagImages = async (tag: any) => {
  const photos = tag.photo
  const storageBucket = admin.storage().bucket(bucketName)
  const prefix = 'tags/' + tag.tagID + '/'
  const newPhotos = await Promise.all(
    photos.map(async (aPhoto) => {
      const storageRef = storageBucket.file(prefix + aPhoto)
      const [result] = await storageRef.getMetadata()
      if (result.metadata && result.metadata.firebaseStorageDownloadTokens) {
        const token = result.metadata.firebaseStorageDownloadTokens
        const path = encodeURIComponent(prefix + aPhoto)
        const url =
          STORAGE_ROOT +
          '/' +
          bucketName +
          '/o/' +
          path +
          '?alt=media&token=' +
          token
        return url
      }
      return aPhoto
    })
  )
  tag.photo = newPhotos
  return true
}

export const getTagsFromFirestoreWithBldgID = async (
  bldgID: string,
  comment: number
) => {
  const colRef = admin.firestore().collection(COLLECTIONS.TAGS)
  const q = colRef.where('subject', '==', bldgID)
  const snapShots = await q.get()
  if (snapShots.docs.length === 0) {
    return null
  } else {
    const list: any[] = []
    snapShots.docs.forEach((doc: any) => {
      const obj = createTagFromSnapshot(doc)
      list.push(obj)
    })
    // 最新コメント
    for (const tag of list) {
      tag.comments = await getCommentsFromFirestore(tag.tagID, comment)
    }
    return list
  }
}

export const getTagsFromFirestoreWithGmlID = async (
  gmlID: string,
  comment: number
) => {
  const colRef = admin.firestore().collection(COLLECTIONS.TAGS)
  const q = colRef.where('gmlID', '==', gmlID)
  const snapShots = await q.get()
  if (snapShots.docs.length === 0) {
    return null
  } else {
    const list: any[] = []
    snapShots.docs.forEach((doc: any) => {
      const obj = createTagFromSnapshot(doc)
      list.push(obj)
    })
    // 最新コメント
    for (const tag of list) {
      tag.comments = await getCommentsFromFirestore(tag.tagID, comment)
    }
    return list
  }
}

export const getTagCounts = async () => {
  const colRef = admin.firestore().collection(COLLECTIONS.TAGS)
  const snapShots = await colRef.get()
  return snapShots.docs.length
}

export const getTagFromFirestoreWithTagID = async (
  tagID: string,
  comment: number
) => {
  const docRef = admin.firestore().collection(COLLECTIONS.TAGS).doc(tagID)
  const doc = await docRef.get()
  if (doc.exists) {
    const obj: any = createTagFromSnapshot(doc)
    obj.comments = await getCommentsFromFirestore(obj.tagID, comment)
    return obj
  }
  return null
}

export const getTagsFromGeoLocation = async (
  latitude: number,
  longitude: number,
  radius: number
) => {
  const colRef = admin.firestore().collection(COLLECTIONS.TAGS)
  const bounds = getGeoBounds(latitude, longitude, radius)
  const boundsSnaps = await Promise.all(
    bounds.map((b) => {
      const q = colRef.orderBy('geohash').startAt(b[0]).endAt(b[1])
      return q.get()
    })
  )
  const items: any[] = []
  for (const bSnap of boundsSnaps) {
    bSnap.docs.forEach((doc: any) => {
      // 一応重複チェック
      if (
        items.filter((item) => {
          return item.tagID === doc.id
        }).length > 0
      ) {
        return
      }
      const obj = createTagFromSnapshot(doc)
      items.push(obj)
    })
  }
  // コメントはあとで
  return items
}

export const filterTags = (
  tags: any[],
  category: string,
  group: string,
  hashTags: string[]
) => {
  const filtered = tags.filter((tag: any) => {
    if (category !== 'None') {
      if (tag.category !== category) {
        return false
      }
    }
    if (group !== '') {
      if (tag.group !== group) {
        return false
      }
    }
    const r = hashTags.filter((fHash: string) => {
      return (
        tag.hashtag.filter((tHash: string) => {
          return tHash === fHash
        }).length > 0
      )
    })
    if (r.length < hashTags.length) {
      return false
    }
    return true
  })
  return filtered
}

export const getTagsComments = async (tags: any[], limit: number) => {
  const newTags = await Promise.all(
    tags.map(async (tag) => {
      const comments = await getCommentsFromFirestore(tag.tagID, limit)
      tag.comments = comments
      return tag
    })
  )
  return newTags
}

export const translateTagToGeoJson = (tag: any) => {
  const feature: any = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: changeGeoJsonCoodsFromCenterWithOffset(
        tag.center,
        tag.offset
      )
    },
    properties: {
      title: tag.label,
      id: tag.tagID,
      description: tag.description,
      bldgID: tag.subject,
      gmlID: tag.gmlID,
      hashtag: tag.hashtag,
      category: tag.category,
      created: tag.created,
      modified: tag.modified,
      createdBy: tag.createdBy,
      group: tag.group,
      photo: tag.photo
    }
  }
  if (tag.category === 'GOOD') {
    feature.properties.markerUrl =
      'https://*** project-name ***.web.app/images/GOOD_300.png'
  } else if (tag.category === 'BAD') {
    feature.properties.markerUrl =
      'https://*** project-name ***.web.app/images/BAD_300.png'
  } else if (tag.category === 'IDEA') {
    feature.properties.markerUrl =
      'https://*** project-name ***.web.app/images/POSSIBLE_300.png'
  }
  return feature
}

export const translateBuildingToGeoJson = (bldg: any) => {
  const feature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: changeGeoJsonCoodsFromCenter(bldg.center)
    },
    properties: {
      title: bldg.gmlID,
      bldgID: bldg.bldgID,
      'marker-color': '#33cc66'
    }
  }
  return feature
}

const HALF_EARTH = 20037508.34

const lonToSphMerc = (lon: number) => {
  return (lon / 180) * HALF_EARTH
}

const latToSphMerc = (lat: number) => {
  var y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)
  return (y * HALF_EARTH) / 180.0
}

const sphMercToLon = (x: number) => {
  return (x / HALF_EARTH) * 180.0
}

const sphMercToLat = (y: number) => {
  var lat = (y / HALF_EARTH) * 180.0
  lat =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2)
  return lat
}

const changeGeoJsonCoodsFromCenter = (center: any) => {
  return [center.longitude, center.latitude, center.altitude]
}

const changeGeoJsonCoodsFromCenterWithOffset = (center: any, offset: any) => {
  const sx = lonToSphMerc(center.longitude) + offset.position.x
  const sz = latToSphMerc(center.latitude) - offset.position.z
  return [sphMercToLon(sx), sphMercToLat(sz), 0 + offset.position.y]
}
