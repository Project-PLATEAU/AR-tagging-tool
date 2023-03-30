import { atom } from 'recoil'

export type GeolocationCoordinates = {
  longitude: number
  latitude: number
  accuracy: number
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
}

const NEW_COORDS = (
  longitude: number = 0,
  latitude: number = 0
): GeolocationCoordinates => {
  return {
    longitude: longitude,
    latitude: latitude,
    altitude: 0,
    accuracy: 0,
    altitudeAccuracy: 0,
    heading: 0,
    speed: 0
  }
}

const LOCATION = {
  KANNAI2: '弁天橋',
  KANNAI: '桜木町郵便局',
  KANNAI3: 'オーク関内ビル',
  KANNAI4: '山手総研側',
  KANNAI5: '市役所前',
  TAKANAWA: '高輪１',
  TAKANAWA2: '高輪２',
  TAKANAWA3: '高輪歯科',
  TAKANAWA4: '高松中学校',
  OFFICE: 'オフィス'
}

const DEFAULT_LATLNG = {
  lat: 35.44983922,
  lng: 139.63342982
}

const SAMPLE_COODS = (
  location: string = LOCATION.OFFICE,
  coods?: GeolocationCoordinates
) => {
  const loc = { longitude: 139.5738634957431, latitude: 35.546726768142385 } // OFFICE
  if (location === LOCATION.KANNAI) {
    //桜木町郵便局
    loc.longitude = 139.6324895
    loc.latitude = 35.449919
  } else if (location === LOCATION.KANNAI2) {
    // 弁天橋
    loc.longitude = 139.63342982
    loc.latitude = 35.44983922
  } else if (location === LOCATION.KANNAI3) {
    // オーク関内
    loc.longitude = 139.63412037
    loc.latitude = 35.44683123
  } else if (location === LOCATION.KANNAI4) {
    // 山手総研側
    loc.longitude = 139.63347994
    loc.latitude = 35.4461507
  } else if (location === LOCATION.KANNAI5) {
    loc.latitude = 35.44975242
    loc.longitude = 139.63497953
  } else if (location === LOCATION.TAKANAWA) {
    loc.longitude = 139.738
    loc.latitude = 35.6389785
  } else if (location === LOCATION.TAKANAWA2) {
    loc.longitude = 139.73922934
    loc.latitude = 35.63641878
  } else if (location === LOCATION.TAKANAWA3) {
    // 高輪歯科
    loc.longitude = 139.73876019
    loc.latitude = 35.63958655
  } else if (location === LOCATION.TAKANAWA4) {
    // 高松中学校
    loc.latitude = 35.6407664
    loc.longitude = 139.73377705
  }
  const c = NEW_COORDS(loc.longitude, loc.latitude)
  c.altitude = coods?.altitude ? coods.altitude : 0
  c.accuracy = coods?.accuracy ? coods.accuracy : 0
  c.altitudeAccuracy = coods?.altitudeAccuracy ? coods.altitudeAccuracy : 0
  c.heading = coods?.heading ? coods.heading : 0
  c.speed = coods?.speed ? coods.speed : 0
  return c
}

const REDUCE_COORDS = (coods: GeolocationCoordinates) => {
  const c = NEW_COORDS(coods.longitude, coods.latitude)
  c.altitude = coods.altitude ? coods.altitude : 0
  c.accuracy = coods.accuracy ? coods.accuracy : 0
  c.altitudeAccuracy = coods.altitudeAccuracy ? coods.altitudeAccuracy : 0
  c.heading = coods.heading ? coods.heading : 0
  c.speed = coods.speed ? coods.speed : 0
  return c
}

const MinDistance = 5

const RADIAN: number = Math.PI / 180.0
const DegToRad = (degree: number): number => {
  return degree * RADIAN
}

// const EARTH = 40075016.68;
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

// coordsとlastCoordsの距離を計算。
const GetDistance = (
  to: GeolocationCoordinates,
  from: GeolocationCoordinates
): number => {
  const dlongitude = DegToRad(to.longitude - from.longitude)
  const dlatitude = DegToRad(to.latitude - from.latitude)

  const a =
    Math.sin(dlatitude / 2) * Math.sin(dlatitude / 2) +
    Math.cos(DegToRad(from.latitude)) *
      Math.cos(DegToRad(to.latitude)) *
      (Math.sin(dlongitude / 2) * Math.sin(dlongitude / 2))
  const angle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.abs(angle * 6371000)
}

// GoogleApi用に変換
const transformToGMapCoords = (geoCoords: any) => {
  return {
    lat: geoCoords.latitude,
    lng: geoCoords.longitude
  }
}

const transformFromGMapCoords = (googleCoords: any) => {
  return {
    latitude: googleCoords.lat,
    longitude: googleCoords.lng
  }
}

// x(lat)のoffsetはマイナス値なので注意
const transformToGMapCoordsWithOffset = (geoCoords: any, offset: any) => {
  // const sx1 = latToSphMerc(geoCoords.latitude)
  // const sz1 = lonToSphMerc(geoCoords.longitude)
  // console.log('1:' + sz1 + ' ' + sx1)
  const sx = lonToSphMerc(geoCoords.longitude) + offset.position.x
  const sz = latToSphMerc(geoCoords.latitude) - offset.position.z
  return {
    lat: sphMercToLat(sz),
    lng: sphMercToLon(sx)
  }
}

export const ZoomAtom = atom({
  key: 'g-map-zoom',
  default: 17
})

export const GpsAtom = atom({
  key: 'g-map-gps',
  // default: {
  //   lat: 35.44983922,
  //   lng: 139.63342982
  // } as any
  default: {
    lat: 35.6407664,
    lng: 139.73377705
  } as any
})

export const MapUtils = {
  NEW_COORDS,
  GetDistance,
  MinDistance,
  transformFromGMapCoords,
  transformToGMapCoords,
  transformToGMapCoordsWithOffset,
  SAMPLE_COODS,
  LOCATION,
  REDUCE_COORDS,
  DEFAULT_LATLNG
  // KANNAI_COORDS,
  // TAKANAWA_COORDS,
  // KANNAI2_COORDS,
  // OFFICE_COORDS
}
