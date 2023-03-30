import { atom } from 'recoil'

export type Building = {
  gmlID: string
  footprint: {
    latitude: number
    longitude: number
    altitude: number
  }[]
  center: {
    latitude: number
    longitude: number
    altitude: number
  }
  height: number
  bldgID: string
  created: Date
  modified: Date
  radius: number
}

export type Tran = {
  gmlID: string
  id: string
  roadmap: {
    latitude: number
    longitude: number
    altitude: number
  }[]
  center: {
    latitude: number
    longitude: number
    altitude: number
  }
  created: Date
  modified: Date
}

export type Poly = {
  roadID?: string
  trafficID?: string
  bridID?: string
  frnID?: string
  id: string
  type: string
  triangle: {
    latitude: number
    longitude: number
    altitude: number
  }[]
  center: {
    latitude: number
    longitude: number
    altitude: number
  }
  created: Date
  modified: Date
}

export type Frn = {
  gmlID: string
  frnID: string
  footprint: {
    latitude: number
    longitude: number
    altitude: number
  }[]
  center: {
    latitude: number
    longitude: number
    altitude: number
  }
  attributes: any
  type: string
  height: number
  created: Date
  modified: Date
}

export type Veg = {
  gmlID: string
  vegID: string
  footprint: {
    latitude: number
    longitude: number
    altitude: number
  }[]
  center: {
    latitude: number
    longitude: number
    altitude: number
  }
  attributes: any
  type: string
  height: number
  created: Date
  modified: Date
}

export type Comment = {
  commentId: string
  comment: string
  createdBy: string
  editors: string[]
  created: Date
  modified: Date
}

export type Tag = {
  tagID: string
  gmlID: string
  subject: string
  label: string
  description: string
  createdBy: string
  editors: string[]
  hashtag: string[]
  category: string
  group: string
  hide: boolean
  center: {
    latitude: number
    longitude: number
    altitude: number
  }
  offset: {
    position: {
      x: number
      y: number
      z: number
    }
    rotation: {
      x: number
      y: number
      z: number
    }
  }
  like: string[]
  photo: string[]
  created: Date
  modified: Date
  commented: Date
  commentCounts: number
  comments: Comment[]
}

export type Photo = {
  file: File
  isStorage: boolean
}

export const TagAtom = atom({
  key: 'tag',
  default: null
})

export const TargetAtom = atom({
  key: 'SelectTarget',
  default: null
})

export const OffsetAtom = atom({
  key: 'offset',
  default: {
    position: {
      x: 0,
      y: 0,
      z: 0
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0
    }
  }
})

export const CameraOffsetAtom = atom({
  key: 'cameraoffset',
  default: {
    rotation: 0,
    height: 0,
    fov: 75
  }
})

export const FilterAtom = atom({
  key: 'filter',
  default: {
    category: 'None',
    hashtags: [] as string[]
  }
})

const convertCallableApiObjToTag = (obj: any) => {
  const temp = {
    ...obj
  }
  temp.created = new Date(obj.created._seconds * 1000)
  temp.modified = new Date(obj.modified._seconds * 1000)
  temp.commented = new Date(obj.commented._seconds * 1000)
  return temp as Tag
}

const convertCallableApiObjToBuilding = (obj: any) => {
  const temp = {
    ...obj
  }
  temp.created = new Date(obj.created._seconds * 1000)
  temp.modified = new Date(obj.modified._seconds * 1000)
  return temp as Building
}

const convertCallableApiObjToFrn = (obj: any) => {
  const temp = {
    ...obj
  }
  temp.created = new Date(obj.created._seconds * 1000)
  temp.modified = new Date(obj.modified._seconds * 1000)
  return temp as Frn
}

const convertCallableApiObjToVeg = (obj: any) => {
  const temp = {
    ...obj
  }
  temp.created = new Date(obj.created._seconds * 1000)
  temp.modified = new Date(obj.modified._seconds * 1000)
  return temp as Veg
}

const convertBuildingToTag = (bldg: Building): Tag => {
  return {
    tagID: bldg.bldgID,
    gmlID: bldg.gmlID,
    subject: bldg.bldgID,
    label: bldg.bldgID,
    description: bldg.gmlID,
    createdBy: 'user1',
    created: bldg.created,
    modified: bldg.modified,
    commented: bldg.modified,
    commentCounts: 0,
    center: bldg.center,
    offset: {
      position: {
        x: 0,
        y: bldg.height,
        z: 0
      },
      rotation: {
        x: 0,
        y: 1,
        z: 0
      }
    },
    category: 'category',
    editors: ['user1', 'user2'],
    hashtag: ['#hash1', '#hash2'],
    hide: false,
    like: [],
    photo: [],
    group: 'group',
    comments: []
  }
}

const copyTag = (rTag: Tag): Tag => {
  return {
    tagID: rTag.tagID,
    gmlID: rTag.gmlID,
    subject: rTag.subject,
    label: rTag.label,
    description: rTag.description,
    createdBy: rTag.createdBy,
    created: rTag.created,
    modified: rTag.modified,
    commented: rTag.commented,
    commentCounts: rTag.commentCounts,
    center: rTag.center,
    offset: rTag.offset,
    category: rTag.category,
    editors: rTag.editors,
    hashtag: rTag.hashtag,
    hide: rTag.hide,
    like: rTag.like,
    photo: rTag.photo,
    group: rTag.group,
    comments: rTag.comments
  }
}

const findTagFromBuildingID = (bldgID: string, taglist: Array<Tag>) => {
  const objList = taglist.filter((tag: Tag) => {
    return tag.subject === bldgID
  })
  if (objList.length > 0) {
    return objList
  } else {
    return null
  }
}

const findTagsFromSubject = (subject: string, taglist: Array<Tag>) => {
  const objList = taglist.filter((tag: Tag) => {
    return tag.subject === subject
  })
  if (objList.length > 0) {
    return objList
  } else {
    return []
  }
}

const findTagFromGmlID = (gmlID: string, taglist: Array<Tag>) => {
  const objList = taglist.filter((tag: Tag) => {
    return tag.gmlID === gmlID
  })
  if (objList.length > 0) {
    return objList[0]
  } else {
    return null
  }
}

const findTagFromTagID = (tagID: string, taglist: Array<Tag>) => {
  const objList = taglist.filter((tag: Tag) => {
    return tag.tagID === tagID
  })
  if (objList.length > 0) {
    return objList[0]
  } else {
    return null
  }
}

const findBuildingFromBuildingID = (
  bldgID: string,
  buildingList: Array<Building>
) => {
  const objList = buildingList.filter((building: Building) => {
    return building.bldgID === bldgID
  })
  if (objList.length > 0) {
    return objList[0]
  } else {
    return null
  }
}

const findBuildingFromGmlID = (
  gmlID: string,
  buildingList: Array<Building>
) => {
  const objList = buildingList.filter((building: Building) => {
    return building.gmlID === gmlID
  })
  if (objList.length > 0) {
    return objList[0]
  } else {
    return null
  }
}

const findFrnFromGmlID = (gmlID: string, frnList: Array<Frn>) => {
  const objList = frnList.filter((frn: Frn) => {
    return frn.gmlID === gmlID
  })
  if (objList.length > 0) {
    return objList[0]
  } else {
    return null
  }
}

const findFrnFromFrnID = (frnID: string, frnList: Array<Frn>) => {
  const objList = frnList.filter((frn: Frn) => {
    return frn.frnID === frnID
  })
  if (objList.length > 0) {
    return objList[0]
  } else {
    return null
  }
}

const findVegFromGmlID = (gmlID: string, vegList: Array<Veg>) => {
  const objList = vegList.filter((veg: Veg) => {
    return veg.gmlID === gmlID
  })
  if (objList.length > 0) {
    return objList[0]
  } else {
    return null
  }
}

const findVegFromVegID = (vegID: string, vegList: Array<Veg>) => {
  const objList = vegList.filter((veg: Veg) => {
    return veg.vegID === vegID
  })
  if (objList.length > 0) {
    return objList[0]
  } else {
    return null
  }
}

const getTagCategoryPinImage = (category: string) => {
  if (category === 'GOOD') {
    return '/images/pin_GOOD.png'
  } else if (category === 'BAD') {
    return '/images/pin_BAD.png'
  } else {
    return '/images/pin_POSSIBLE.png'
  }
}

const getTagCategoryImage = (category: string) => {
  if (category === 'GOOD') {
    return '/images/GOOD.png'
  } else if (category === 'BAD') {
    return '/images/BAD.png'
  } else {
    return '/images/POSSIBLE.png'
  }
}

export const TagCategory = ['GOOD', 'BAD', 'IDEA']

export const TagUtils = {
  findBuildingFromBuildingID,
  findBuildingFromGmlID,
  findFrnFromFrnID,
  findFrnFromGmlID,
  findVegFromVegID,
  findVegFromGmlID,
  findTagsFromSubject,
  // findTagFromBuildingID,
  findTagFromTagID,
  findTagFromGmlID,
  copyTag,
  convertBuildingToTag,
  getTagCategoryImage,
  getTagCategoryPinImage,
  convertCallableApiObjToBuilding,
  convertCallableApiObjToFrn,
  convertCallableApiObjToVeg,
  convertCallableApiObjToTag
}
