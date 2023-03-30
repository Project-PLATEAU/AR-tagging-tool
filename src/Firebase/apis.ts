import {
  GeoPoint,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  limit,
  QueryDocumentSnapshot,
  deleteDoc
} from 'firebase/firestore'
import {
  httpsCallable
  //  , connectFunctionsEmulator
} from 'firebase/functions'
import { ref, uploadBytes, getBlob } from 'firebase/storage'
import * as geofire from 'geofire-common'

import {
  // app,
  db,
  auth,
  storage,
  functions
} from '@/Firebase/init'
import { GeolocationCoordinates } from '@/utils/GpsUtils'
import {
  Building,
  Tag,
  Comment,
  Photo,
  Tran,
  Poly,
  Frn
} from '@/utils/TagUtils'

// connectFunctionsEmulator(functions, 'localhost', 5001)

const COLLECTIONS = {
  TAGS: 'tags',
  USERS: 'users',
  COMMENTS: 'comments',
  BUILDINGS: 'buildings',
  TRANS: 'trans',
  POLYS: 'polygons',
  FRNS: 'frns'
}

// client側のlocationとgoogleのgeopointの変換
const getGeoPoint = (lat: number, lon: number) => {
  return new GeoPoint(lat, lon)
}

//Geohashの補助とか
const HALF_EARTH = 20037508.34

const lonToSphMerc = (lon: number) => {
  return (lon / 180) * HALF_EARTH
}

const latToSphMerc = (lat: number) => {
  var y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)
  return (y * HALF_EARTH) / 180.0
}

const getGeoHash = (lat: number, lon: number) => {
  return geofire.geohashForLocation([lat, lon])
}

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

// DocumentSnapshotから基本オブジェクトへの変換
const createBuildingFromSnapshot = (doc: QueryDocumentSnapshot): Building => {
  const data = doc.data()
  const center = {
    latitude: data.geoPoint.latitude,
    longitude: data.geoPoint.longitude,
    altitude: data.altitude
  }
  const radius = calculateFootprintRadius(data.footprint, center)
  const created = data.created.toDate()
  const modified = data.modified.toDate()

  const item: Building = {
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

const createTagFromSnapshot = (doc: QueryDocumentSnapshot): Tag => {
  const data = doc.data()
  const center = {
    latitude: data.geopoint.latitude,
    longitude: data.geopoint.longitude,
    altitude: data.altitude
  }
  const created = data.created.toDate()
  const modified = data.modified.toDate()
  const commented = data.commented.toDate()
  const obj: Tag = {
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

const createCommentFromSnapshot = (doc: QueryDocumentSnapshot): Comment => {
  const data = doc.data()
  const created = data.created.toDate()
  const modified = data.modified.toDate()
  const obj: Comment = {
    commentId: doc.id,
    comment: data.comment,
    createdBy: data.createdby,
    editors: data.allowedtoedit,
    created: created,
    modified: modified
  }
  return obj
}

const createFrnFromSnapshot = (doc: QueryDocumentSnapshot): Frn => {
  const data = doc.data()
  const center = {
    latitude: data.geoPoint.latitude,
    longitude: data.geoPoint.longitude,
    altitude: data.altitude
  }
  const created = data.created.toDate()
  const modified = data.modified.toDate()
  const item: Frn = {
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

export const getUserID = () => {
  return auth.currentUser?.uid ?? null
}

export const getPlateauBuildings = async (
  coord: GeolocationCoordinates,
  radius: number
) => {
  const uid = getUserID()
  if (uid) {
    const colRef = collection(db, COLLECTIONS.BUILDINGS)
    const bounds = getGeoBounds(coord, radius)
    const boundsSnaps = await Promise.all(
      bounds.map((b) => {
        const q = query(colRef, orderBy('geoHash'), startAt(b[0]), endAt(b[1]))
        return getDocs(q)
      })
    )
    const items: Building[] = []
    for (const bSnap of boundsSnaps) {
      bSnap.docs.forEach((doc) => {
        // 一応重複チェック
        if (
          items.filter((item) => {
            return item.gmlID === doc.id
          }).length > 0
        ) {
          return
        }
        const item = createBuildingFromSnapshot(doc)
        items.push(item)
      })
    }
    return items
  } else {
    throw new Error('Authentification failed.')
  }
}

const getTagFromFirestore = async (bldgID: string, comment: number) => {
  const uid = getUserID()
  if (uid) {
    const colRef = collection(db, COLLECTIONS.TAGS)
    const q = query(colRef, where('subject', '==', bldgID))
    const snapShots = await getDocs(q)
    if (snapShots.docs.length === 0) {
      return null
    } else {
      const list: Tag[] = []
      snapShots.docs.forEach((doc) => {
        const obj = createTagFromSnapshot(doc)
        list.push(obj)
      })
      // 最新コメント
      // for (const tag of list) {
      //   tag.comments = await getCommentsFromFirestore(tag.tagID, comment)
      // }
      return list
    }
  } else {
    return null
  }
}

export const getCommentsFromFirestore = async (
  tagId: string,
  counts: number
) => {
  const commentRef = collection(
    doc(collection(db, COLLECTIONS.TAGS), tagId),
    COLLECTIONS.COMMENTS
  )
  const q = query(commentRef, orderBy('created', 'desc'), limit(counts))
  const snapShots = await getDocs(q)
  if (snapShots.docs.length === 0) {
    return []
  } else {
    const comments: Comment[] = []
    snapShots.docs.forEach((doc) => {
      const obj: Comment = createCommentFromSnapshot(doc)
      comments.push(obj)
    })
    return comments
  }
}

const uploadImageToStorage = async (docId: string, file: File) => {
  const storageRef = ref(storage, 'tags/' + docId + '/' + file.name)
  const snapShot = await uploadBytes(storageRef, file)
  return snapShot.ref.name
}

export const downloadImageFromStorage = async (
  docId: string,
  filename: string
) => {
  const storageRef = ref(storage, 'tags/' + docId + '/' + filename)
  try {
    const blob = await getBlob(storageRef)
    if (blob) {
      return new File([blob], filename)
    } else {
      console.log('download blob is null:' + filename)
    }
  } catch (e: any) {
    console.log('download image err:' + filename)
  }
  return null
}

export const downloadProfileImageFromStorage = async (
  userId: string,
  filename: string
) => {
  const storageRef = ref(storage, 'users/' + userId + '/' + filename)
  try {
    const blob = await getBlob(storageRef)
    if (blob) {
      return new File([blob], filename)
    } else {
      console.log('download blob is null:' + filename)
    }
  } catch (e: any) {
    console.log('download profile image err:' + filename)
  }
  return null
}

export const getTagsFromGeoLocation = async (
  coord: GeolocationCoordinates,
  radius: number
) => {
  const uid = getUserID()
  if (uid) {
    const colRef = collection(db, COLLECTIONS.TAGS)
    const bounds = getGeoBounds(coord, radius)
    const boundsSnaps = await Promise.all(
      bounds.map((b) => {
        const q = query(colRef, orderBy('geohash'), startAt(b[0]), endAt(b[1]))
        return getDocs(q)
      })
    )
    const items: Tag[] = []
    for (const bSnap of boundsSnaps) {
      bSnap.docs.forEach((doc) => {
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
    // 最新コメント
    // for (const tag of items) {
    //   tag.comments = await getCommentsFromFirestore(tag.tagID, 5)
    // }
    return items
  } else {
    throw new Error('Authentification failed.')
  }
}

export const getTagsFromFirestore = async (buildings: Building[]) => {
  const uid = getUserID()
  if (uid) {
    const temp = await Promise.all(
      buildings.map(async (building: Building) => {
        return await getTagFromFirestore(building.bldgID, 5)
      })
    )
    const tags: Tag[] = []
    for (const items of temp) {
      if (items == null) {
        continue
      }
      const nonNullList = items!
      for (const tag of nonNullList) {
        // 重複チェック
        if (
          tags.filter((oneTag) => {
            return oneTag.tagID === tag.tagID
          }).length > 0
        ) {
          continue
        }
        tags.push(tag)
      }
    }
    return tags
  } else {
    throw new Error('Authentification failed.')
  }
}

// const getTagList = async (coords: GeolocationCoordinates) => {}

export const createTag = async (
  target: any,
  info: any,
  photos: Array<Photo>
) => {
  const uid = getUserID()
  if (uid) {
    const l1: string[] = []
    const l2: string[] = []
    const dict: any = {
      label: info.label,
      category: info.category,
      hashtag: info.hashtag,
      description: info.description,
      group: info.group,
      offset: info.offset,
      like: l1,
      createdby: uid,
      allowedtoedit: [uid],
      geopoint: getGeoPoint(target.center.latitude, target.center.longitude),
      geohash: getGeoHash(target.center.latitude, target.center.longitude),
      altitude: target.center.altitude,
      gmlID: target.gmlID,
      created: serverTimestamp(),
      modified: serverTimestamp(),
      commented: serverTimestamp(),
      counts: info.comment && info.comment !== '' ? 1 : 0,
      photo: l2
    }
    if (target.bldgID) {
      dict.subject = target.bldgID
      // dict.gmlID = target.gmlID
    } else {
      dict.subject = target.gmlID
    }
    if (target.triangle) {
      // dict.gmlID = target.id
      if (target.trafficID) {
        dict.subject = target.trafficID
      } else if (target.bridID) {
        dict.subject = target.bridID
      } else if (target.frnID) {
        dict.subject = target.frnID
      }
    }

    const col = collection(db, COLLECTIONS.TAGS)
    const newDoc = doc(col)

    const nameList = await Promise.all(
      photos.map(async (aPhoto) => {
        const name = await uploadImageToStorage(newDoc.id, aPhoto.file)
        return name
      })
    )
    dict.photo = nameList

    await setDoc(newDoc, dict)
    if (info.comment && info.comment !== '') {
      const commentCol = collection(newDoc, COLLECTIONS.COMMENTS)
      const commentDoc = doc(commentCol)
      const commentDict = {
        comment: info.comment,
        createdby: uid,
        allowedtoedit: [uid],
        hide: false,
        created: serverTimestamp(),
        modified: serverTimestamp()
      }
      await setDoc(commentDoc, commentDict)
    }
    return true
  }
  return false
}

export const updateTag = async (tag: Tag, info: any, photos: Photo[]) => {
  const uid = getUserID()
  if (uid) {
    const l2: string[] = []
    const dict = {
      label: info.label,
      category: info.category,
      hashtag: info.hashtag,
      description: info.description,
      modified: serverTimestamp(),
      photo: l2
    }
    const col = collection(db, COLLECTIONS.TAGS)
    const tagRef = doc(col, tag.tagID)

    const nameList = await Promise.all(
      photos.map(async (aPhoto: Photo) => {
        if (!aPhoto.isStorage) {
          const name = await uploadImageToStorage(tagRef.id, aPhoto.file)
          return name
        } else {
          return aPhoto.file.name
        }
      })
    )
    dict.photo = nameList
    await updateDoc(tagRef, dict)
    return true
  }
  return false
}

export const doLike = async (tag: Tag) => {
  const uid = getUserID()
  if (uid) {
    const col = collection(db, COLLECTIONS.TAGS)
    const docRef = doc(col, tag.tagID)
    const l = tag.like.filter((u: string) => {
      return u === uid
    })
    if (l.length > 0) {
      return false
    }
    const newList = tag.like.concat([uid])
    const dict = {
      modified: serverTimestamp(),
      like: newList
    }
    try {
      await updateDoc(docRef, dict)
    } catch (e) {
      console.log(e)
      return false
    }
    tag.like.push(uid)
    return true
  }
  return false
}

// タグが編集可能か否か
export const isEditableTag = (tag: Tag) => {
  const uid = getUserID()
  if (uid) {
    const result = tag.editors.filter((u) => {
      return u === uid
    })
    if (result.length > 0) {
      return true
    }
  }
  return false
}

export const getUserData = async (userId: string) => {
  const uid = getUserID()
  if (uid) {
    const col = collection(db, COLLECTIONS.USERS)
    const docRef = doc(col, userId)
    try {
      const snapShot = await getDoc(docRef)
      if (snapShot.exists()) {
        const data = snapShot.data()
        return {
          displayName: data.displayName,
          profile: data.profile,
          group: data.group,
          uid: userId
        }
      }
    } catch (e: any) {
      console.log('Api Error: get user data failed, ' + userId)
    }
  }
  return {
    displayName: '',
    profile: '',
    group: '',
    uid: ''
  }
}

export const deleteTag = async (tag: Tag) => {
  const uid = getUserID()
  if (uid) {
    const col = collection(db, COLLECTIONS.TAGS)
    const docRef = doc(col, tag.tagID)
    await deleteDoc(docRef)
    return true
  }
  return false
}

export const postComment = async (tag: Tag, comment: string) => {
  const uid = getUserID()
  if (uid) {
    const col = collection(db, COLLECTIONS.TAGS)
    const tagRef = doc(col, tag.tagID)
    const commentCol = collection(tagRef, COLLECTIONS.COMMENTS)
    const commentDoc = doc(commentCol)
    const commentDict = {
      comment: comment,
      createdby: uid,
      allowedtoedit: [uid],
      hide: false,
      created: serverTimestamp(),
      modified: serverTimestamp()
    }
    await setDoc(commentDoc, commentDict)
    await updateDoc(tagRef, {
      commented: serverTimestamp(),
      counts: tag.commentCounts + 1
    })
    return true
  }
  return false
}

export const updateUserData = async (
  displayName: string,
  group: string,
  photo: Photo | null
) => {
  const uid = getUserID()
  if (uid) {
    const data: any = {
      displayName: displayName,
      group: group,
      modified: serverTimestamp()
    }
    if (photo && !photo.isStorage) {
      const storageRef = ref(storage, 'users/' + uid + '/' + photo.file.name)
      const snapShot = await uploadBytes(storageRef, photo.file)
      data.profile = snapShot.ref.name
    }

    const col = collection(db, COLLECTIONS.USERS)
    const uRef = doc(col, uid)
    const snap = await getDoc(uRef)
    if (snap.exists()) {
      await updateDoc(uRef, data)
    } else {
      data.created = serverTimestamp()
      await setDoc(uRef, data)
    }
    return true
  }
  return false
}

export const getPlateauTrans = async (
  coord: GeolocationCoordinates,
  radius: number
) => {
  const uid = getUserID()
  if (uid) {
    const colRef = collection(db, COLLECTIONS.TRANS)
    const bounds = getGeoBounds(coord, radius)
    const boundsSnaps = await Promise.all(
      bounds.map((b) => {
        const q = query(colRef, orderBy('geoHash'), startAt(b[0]), endAt(b[1]))
        return getDocs(q)
      })
    )
    const items: Tran[] = []
    for (const bSnap of boundsSnaps) {
      bSnap.docs.forEach((doc) => {
        // 一応重複チェック
        if (
          items.filter((item) => {
            return item.id === doc.id
          }).length > 0
        ) {
          return
        }
        const item = createTranFromSnapshot(doc)
        items.push(item)
      })
    }
    return items
  } else {
    throw new Error('Authentification failed.')
  }
}

// DocumentSnapshotから基本オブジェクトへの変換
const createTranFromSnapshot = (doc: QueryDocumentSnapshot): Tran => {
  const data = doc.data()
  const center = {
    latitude: data.geoPoint.latitude,
    longitude: data.geoPoint.longitude,
    altitude: data.altitude
  }
  const created = data.created.toDate()
  const modified = data.modified.toDate()
  const item: Tran = {
    gmlID: data.gmlID,
    id: doc.id,
    roadmap: data.roadmap,
    center: center,
    created: created,
    modified: modified
  }
  return item
}

export const getPlateauPolygons = async (
  coord: GeolocationCoordinates,
  radius: number
) => {
  const uid = getUserID()
  if (uid) {
    const colRef = collection(db, COLLECTIONS.POLYS)
    const bounds = getGeoBounds(coord, radius)
    const boundsSnaps = await Promise.all(
      bounds.map((b) => {
        const q = query(colRef, orderBy('geoHash'), startAt(b[0]), endAt(b[1]))
        return getDocs(q)
      })
    )
    const items: Poly[] = []
    for (const bSnap of boundsSnaps) {
      bSnap.docs.forEach((doc) => {
        // 一応重複チェック
        if (
          items.filter((item) => {
            return item.id === doc.id
          }).length > 0
        ) {
          return
        }
        const item = createPolyFromSnapshot(doc)
        items.push(item)
      })
    }
    return items
  } else {
    throw new Error('Authentification failed.')
  }
}

// DocumentSnapshotから基本オブジェクトへの変換
const createPolyFromSnapshot = (doc: QueryDocumentSnapshot): Poly => {
  const data = doc.data()
  const center = {
    latitude: data.geoPoint.latitude,
    longitude: data.geoPoint.longitude,
    altitude: data.altitude
  }
  const created = data.created.toDate()
  const modified = data.modified.toDate()
  const item: Poly = {
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

export const getPlateauFrns = async (
  coord: GeolocationCoordinates,
  radius: number
) => {
  const uid = getUserID()
  if (uid) {
    const colRef = collection(db, COLLECTIONS.FRNS)
    const bounds = getGeoBounds(coord, radius)
    // const boundsSnaps = []
    // for (const b of bounds) {
    //   const q = query(colRef, orderBy('geoHash'), startAt(b[0]), endAt(b[1]))
    //     console.log('f1: st: ' + b)
    //     try {
    //     const snap =  await getDocs(q)
    //     console.log('f1: en: ' + b)
    //     boundsSnaps.push(snap)
    //   } catch (e) {
    //     console.error(e)
    //   }
    // }
    const boundsSnaps = await Promise.all(
      bounds.map(async (b) => {
        const q = query(colRef, orderBy('geoHash'), startAt(b[0]), endAt(b[1]))
        console.log('f1: st: ' + b)
        try {
          const snap = await getDocs(q)
          console.log('f1: en: ' + b)
          return snap
        } catch (e: any) {
          console.error(e)
        }

        return null
      })
    )
    const items: Frn[] = []
    for (const bSnap of boundsSnaps) {
      if (bSnap === null) {
        continue
      }
      bSnap.docs.forEach((doc) => {
        // 一応重複チェック
        if (
          items.filter((item) => {
            return item.gmlID === doc.id
          }).length > 0
        ) {
          return
        }
        const item = createFrnFromSnapshot(doc)
        items.push(item)
      })
    }
    return items
  } else {
    throw new Error('Authentification failed.')
  }
}

export const getDataFromGeoLocation = async (coords: any, radius: number) => {
  const func = httpsCallable(functions, 'getDataFromGeoLocation')
  const data = {
    coords: coords,
    radius: radius
  }
  const res = await func(data)
  // console.log(res)
  return res
}

export const getAllTag = async () => {
  const colT = collection(db, COLLECTIONS.TAGS)
  const t = Timestamp.fromDate(new Date('2022/12/02 00:00:00'))
  const q = query(colT, orderBy('created', 'desc'), endAt(t))
  const tags = await getDocs(q)
  const items: Tag[] = []
  tags.docs.forEach((item: QueryDocumentSnapshot) => {
    const tag = createTagFromSnapshot(item)
    items.push(tag)
  })
  return items
}
