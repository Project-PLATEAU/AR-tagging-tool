import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'
import {
  GoogleMap,
  Marker,
  useLoadScript,
  Polygon,
  InfoWindow
} from '@react-google-maps/api'
import React, { FC, useEffect, useState } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { doLike } from '@/Firebase/apis'
// import BuildingCell from '@/components/BuildingCell'
import TagCell from '@/components/TagCell'
import { GeoProps } from '@/components/interface/props'
import { GeolocationCoordinates, MapUtils, ZoomAtom } from '@/utils/GpsUtils'
import { MapHeadingController } from '@/utils/MapHeadingController'
import {
  Building,
  Tag,
  TagUtils,
  CameraOffsetAtom,
  Frn,
  Veg
} from '@/utils/TagUtils'
const MBox = styled(Box)`
  width: 100%;
  height: 100%;
`
const containerStyle = {
  width: '100%',
  height: '100%'
}

const mapOptions = {
  fullscreenControl: false,
  mapTypeControl: true,
  mapType: 'terrain',
  streetViewControl: false,
  zoomControl: false,
  gestureHandling: 'greedy'
}

const baseOption = {
  fillOpacity: 0.4,
  strokeOpacity: 1,
  strokeWeight: 2,
  draggable: false,
  geodesic: false,
  editable: false,
  zIndex: 1
}

const getPolyFillColor = (type: string) => {
  if (type === 'building') {
    return '#ccaa33'
  } else if (type === 'frn') {
    return '#33aacc'
  } else if (type === 'veg') {
    return '#339933'
  } else if (type === 'selected') {
    return '#aa3366'
  } else {
    return '#666666'
  }
}

const getPolyStrokeColor = (type: string) => {
  if (type === 'building') {
    return '#ffcc00'
  } else if (type === 'frn') {
    return '#00ccff'
  } else if (type === 'veg') {
    return '#00ffcc'
  } else if (type === 'selected') {
    return '#dd0033'
  } else {
    return '#333333'
  }
}
// const google = window.google;

const ViewMap: FC<GeoProps> = ({ ...props }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!
  })

  const [mapCoords, setMapCoords] = useState<any>({
    lat: 35.44983922,
    lng: 139.63342982
  })

  const [polyBldgs, setPolyBldgs] = useState<Array<Building>>([])
  const [polyFrns, setPolyFrns] = useState<Array<Frn>>([])
  const [polyVegs, setPolyVegs] = useState<Array<Veg>>([])
  const [markerTags, setMarkerTags] = useState<Array<Tag>>([])
  const [isItemSelected, setIsItemSelected] = useState<boolean>(false)
  const [selectedItem, setSelectedItem] = useState<any>({})
  const [assembleMode, setAssembleMode] = useState<boolean>(true)
  const [assembledTag, setAssembledTag] = useState<Array<any>>([])
  const [mapRef, setMapRef] = useState<any>(null)
  const [refreshMapCenter, setRefreshMapCenter] = useState<boolean>(true)
  const [zoomState, setZoomState] = useRecoilState(ZoomAtom)

  const [headingController, setHeadingController] = useState<any>(null)
  const [markerRotation, setMarkerRotation] = useState(0)
  const cameraOffset = useRecoilValue(CameraOffsetAtom)
  const [infoLabelObj, setInfoLabelObj] = useState<any>(null)

  // useEffect(() => {
  //   if(headingController === null) {
  //     setHeadingController(new MapHeadingController())
  //   }
  // }, [])

  useEffect(() => {
    if (headingController) {
      setUpHeadingController()
    }
    return () => {
      if (headingController) {
        headingController.disconnect()
      }
    }
  }, [headingController])

  useEffect(() => {
    updateGPS(props.coords)
  }, [props.coords])

  useEffect(() => {
    if (props.orientation) {
      if (!headingController) {
        setHeadingController(new MapHeadingController())
      }
    }
  }, [props.orientation])

  const updateGPS = (coords: GeolocationCoordinates) => {
    // console.log('update gps in map')
    if (props.coords) {
      const gcoords = MapUtils.transformToGMapCoords(coords)
      setMapCoords(gcoords)
      if (mapRef && refreshMapCenter) {
        mapRef.setCenter(gcoords)
        if (refreshMapCenter) {
          setRefreshMapCenter(false)
        }
      }
    }
  }

  useEffect(() => {
    updateBuildings(props.buildings)
  }, [props.buildings])

  useEffect(() => {
    updateFrns(props.frns)
  }, [props.frns])

  useEffect(() => {
    updateVegs(props.vegs)
  }, [props.vegs])

  useEffect(() => {
    updateTags(props.tags)
  }, [props.tags])

  useEffect(() => {
    // console.log('flagcheck ' + props.bldgMode + ' ' + refreshMapCenter)
    if (mapRef && (props.addMode || refreshMapCenter)) {
      mapRef.setCenter(mapCoords)
      if (refreshMapCenter) {
        setRefreshMapCenter(false)
      }
    }
  }, [props.addMode, refreshMapCenter])

  useEffect(() => {
    if (zoomState > 19) {
      setAssembleMode(false)
    } else {
      setAssembleMode(true)
    }
  }, [zoomState])

  const setUpHeadingController = () => {
    console.log(headingController)
    if (headingController) {
      if (headingController.enabled) {
        return
      }
      headingController.connect()
      headingController.on('change', (ev: any) => {
        updateCompassHeading()
      })
    }
  }

  const updateCompassHeading = () => {
    if (headingController) {
      const r = cameraOffset.rotation
      setMarkerRotation(headingController.getHeading(r))
    }
  }

  const updateBuildings = (buildings: Array<Building>) => {
    console.log('Map: Update Buildings ' + buildings.length)
    setPolyBldgs(buildings)
  }

  const updateFrns = (frns: Array<Frn>) => {
    console.log('Map: Update Frns ' + frns.length)
    setPolyFrns(frns)
  }

  const updateVegs = (vegs: Array<Veg>) => {
    console.log('Update Vegs ' + vegs.length)
    setPolyVegs(vegs)
  }

  const updateTags = (tags: Array<Tag>) => {
    console.log('Map: Update Tags ' + tags.length)
    setMarkerTags(tags)
    const buildings = [...props.buildings]
    const frns = [...props.frns]
    const vegs = [...props.vegs]
    const hasObjects: any = {}
    for (const tag of tags) {
      if (hasObjects[tag.gmlID]) {
        const hObj = hasObjects[tag.gmlID]
        hObj.tags.push(tag)
      } else {
        let type = 'building'
        if (TagUtils.findBuildingFromGmlID(tag.gmlID, buildings)) {
          type = 'building'
        } else if (TagUtils.findFrnFromGmlID(tag.gmlID, frns)) {
          type = 'frn'
        } else if (TagUtils.findVegFromGmlID(tag.gmlID, vegs)) {
          type = 'veg'
        } else {
          continue
        }
        const hObj = {
          gmlID: tag.gmlID,
          center: tag.center,
          type: type,
          tags: [tag]
        }
        hasObjects[tag.gmlID] = hObj
      }
    }
    const hasTags = Object.keys(hasObjects).map((key) => {
      return hasObjects[key]
    })
    const removeN = hasTags.filter((obj) => {
      return obj !== null && obj !== undefined
    })

    setAssembledTag(removeN)
  }

  const makePolyParams = (obj: any, type: string) => {
    const paths = obj.footprint.map((foot: any) => {
      return { lat: foot.latitude, lng: foot.longitude }
    })
    let fColor = getPolyFillColor(type)
    let sColor = getPolyStrokeColor(type)
    if (isItemSelected && obj.gmlID === selectedItem.item.gmlID) {
      fColor = getPolyFillColor('selected')
      sColor = getPolyStrokeColor('selected')
    }
    const opt = {
      ...baseOption,
      fillColor: fColor,
      strokeColor: sColor
    }
    return [paths, opt]
  }

  const clearSelectedItem = () => {
    setIsItemSelected(false)
    setInfoLabelObj(null)
    if (props.itemcallback) {
      props.itemcallback({ type: 'clear' })
    }
  }

  const onClickBuilding = (event: any, gmlID: string) => {
    setInfoLabelObj(null)
    console.log('click? ' + gmlID)
    if (isItemSelected) {
      clearSelectedItem()
      return
    }
    const buildings = [...polyBldgs]
    const obj = TagUtils.findBuildingFromGmlID(gmlID, buildings)
    if (obj) {
      const item = {
        type: 'building',
        item: obj
      }
      setSelectedItem(item)
      setIsItemSelected(true)
      if (props.itemcallback) {
        const callbackobj = {
          type: 'create',
          building: obj,
          objtype: 'building',
          offset: {
            x: 0,
            y: obj.height + 2,
            z: 0
          },
          rotation: {
            x: 0,
            y: 0,
            z: 0
          }
        }
        props.itemcallback(callbackobj)
      }
    } else {
      clearSelectedItem()
    }
  }

  const onClickFrn = (event: any, gmlID: string) => {
    console.log('click? ' + gmlID)
    if (isItemSelected) {
      clearSelectedItem()
      return
    }
    const frns = [...polyFrns]
    const obj = TagUtils.findFrnFromGmlID(gmlID, frns)
    if (obj) {
      const item = {
        type: 'frn',
        item: obj
      }
      setSelectedItem(item)
      setIsItemSelected(true)
      if (props.itemcallback) {
        const callbackobj = {
          type: 'create',
          frn: obj,
          objtype: 'frn',
          offset: {
            x: 0,
            y: obj.height + 1,
            z: 0
          },
          rotation: {
            x: 0,
            y: 0,
            z: 0
          }
        }
        props.itemcallback(callbackobj)
      }
      if (obj.attributes && obj.attributes.entitiy) {
        const infoObj: any = {
          lat: obj.center.latitude,
          lon: obj.center.longitude,
          label: obj.attributes.entitiy
        }
        setInfoLabelObj(infoObj)
      }
    } else {
      clearSelectedItem()
    }
  }

  const onClickVeg = (event: any, gmlID: string) => {
    console.log('click? ' + gmlID)
    if (isItemSelected) {
      clearSelectedItem()
      return
    }
    const vegs = [...polyVegs]
    const obj = TagUtils.findVegFromGmlID(gmlID, vegs)
    if (obj) {
      const item = {
        type: 'veg',
        item: obj
      }
      setSelectedItem(item)
      setIsItemSelected(true)
      if (props.itemcallback) {
        const callbackobj = {
          type: 'create',
          veg: obj,
          objtype: 'veg',
          offset: {
            x: 0,
            y: obj.height + 1,
            z: 0
          },
          rotation: {
            x: 0,
            y: 0,
            z: 0
          }
        }
        props.itemcallback(callbackobj)
      }
      if (obj.attributes && obj.attributes.entitiy) {
        const infoObj: any = {
          lat: obj.center.latitude,
          lon: obj.center.longitude,
          label: obj.attributes.entitiy
        }
        setInfoLabelObj(infoObj)
      }
    } else {
      clearSelectedItem()
    }
  }

  const onClickTag = (event: any, tagID: string) => {
    setInfoLabelObj(null)
    console.log('click tag ' + isItemSelected)
    if (isItemSelected) {
      clearSelectedItem()
      return
    }
    const obj = TagUtils.findTagFromTagID(tagID, markerTags)
    if (obj) {
      const item = {
        type: 'tag',
        item: obj
      }
      setSelectedItem(item)
      setIsItemSelected(true)
    } else {
      clearSelectedItem()
    }
  }

  const onClickAssembledBldg = (event: any, assembledObj: any) => {
    setInfoLabelObj(null)
    if (isItemSelected) {
      clearSelectedItem()
      return
    }
    const item = {
      type: 'assemble',
      item: assembledObj
    }
    setSelectedItem(item)
    setIsItemSelected(true)
  }

  const onClickInfoWindowClose = () => {
    clearSelectedItem()
  }

  const cellCallback = async (event: any) => {
    console.log(event)
    if (event.tag) {
      if (event.type === 'like') {
        // like api
        if (await doLike(event.tag)) {
          const item = {
            type: 'tag',
            item: event.tag
          }
          setSelectedItem(item)
        }
      } else if (event.type === 'comment') {
        // comment api
        if (props.itemcallback) {
          props.itemcallback(event)
          setIsItemSelected(false)
        }
      } else if (event.type === 'edit') {
        // edit a tag
        if (props.itemcallback) {
          props.itemcallback(event)
          setIsItemSelected(false)
        }
      }
    }
  }

  const zoomChecker = () => {
    if (mapRef) {
      // console.log(mapRef)
      const zoom = mapRef.getZoom()
      setZoomState(zoom)
    }
  }

  return (
    <MBox>
      {isLoaded && (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={MapUtils.DEFAULT_LATLNG}
          zoom={zoomState}
          options={mapOptions}
          onZoomChanged={zoomChecker}
          onLoad={(map) => {
            setMapRef(map)
            map.setCenter(mapCoords)
          }}
        >
          <Marker
            icon={{
              path: 1,
              scale: 6,
              strokeColor: '#6699cc',
              strokeWeight: 4,
              fillColor: '#99ccff',
              fillOpacity: 1,
              rotation: markerRotation
            }}
            position={mapCoords}
            key="mypos"
          />
          {props.addMode ? (
            <>
              {polyBldgs.map((bldg) => {
                const [paths, opt] = makePolyParams(bldg, 'building')
                return (
                  <Polygon
                    paths={paths}
                    options={opt}
                    key={bldg.gmlID}
                    onClick={(event) => onClickBuilding(event, bldg.gmlID)}
                  />
                )
              })}
              {polyFrns.map((frn) => {
                const [paths, opt] = makePolyParams(frn, 'frn')
                return (
                  <Polygon
                    paths={paths}
                    options={opt}
                    key={frn.gmlID}
                    onClick={(event) => onClickFrn(event, frn.gmlID)}
                  />
                )
              })}
              {polyVegs.map((veg) => {
                const [paths, opt] = makePolyParams(veg, 'veg')
                return (
                  <Polygon
                    paths={paths}
                    options={opt}
                    key={veg.gmlID}
                    onClick={(event) => onClickVeg(event, veg.gmlID)}
                  />
                )
              })}
            </>
          ) : assembleMode ? (
            assembledTag.map((hObj) => {
              const counts = hObj.tags.length
              const pos = {
                lat: hObj.center.latitude,
                lng: hObj.center.longitude
              }
              const lStr = '' + counts + ''
              // console.log(counts)
              return (
                <Marker
                  position={pos}
                  label={lStr}
                  key={hObj.gmlID}
                  onClick={(event) => onClickAssembledBldg(event, hObj)}
                />
              )
            })
          ) : (
            markerTags.map((tag: Tag) => {
              const pos = MapUtils.transformToGMapCoordsWithOffset(
                tag.center,
                tag.offset
              )
              const iconUrl = TagUtils.getTagCategoryPinImage(tag.category)
              return (
                <Marker
                  icon={iconUrl}
                  position={pos}
                  key={tag.tagID}
                  onClick={(event) => onClickTag(event, tag.tagID)}
                />
              )
            })
          )}
          {/* 建物の場合とタグの場合分け。タグの場合は最新コメントとか乗せられるView */}
          {isItemSelected && selectedItem.type === 'tag' && selectedItem.item && (
            <InfoWindow
              position={MapUtils.transformToGMapCoordsWithOffset(
                selectedItem.item.center,
                selectedItem.item.offset
              )}
              options={{ maxWidth: 300 }}
              onCloseClick={onClickInfoWindowClose}
            >
              <Box sx={{ width: '100%', m: 0 }}>
                <TagCell
                  tag={selectedItem.item}
                  comment={false}
                  description={true}
                  cellcallback={cellCallback}
                />
              </Box>
            </InfoWindow>
          )}
          {isItemSelected && infoLabelObj && (
            <InfoWindow
              position={{
                lat: infoLabelObj.lat,
                lng: infoLabelObj.lon
              }}
              options={{ maxWidth: 300 }}
              onCloseClick={onClickInfoWindowClose}
            >
              <Box sx={{ width: '100%', m: 0 }}>{infoLabelObj.label}</Box>
            </InfoWindow>
          )}
          {isItemSelected &&
            selectedItem.type === 'assemble' &&
            selectedItem.item && (
              <InfoWindow
                position={{
                  lat: selectedItem.item.center.latitude,
                  lng: selectedItem.item.center.longitude
                }}
                options={{ maxWidth: 360, minWidth: 300 }}
                onCloseClick={onClickInfoWindowClose}
              >
                <Stack spacing={'12px'} divider={<Divider />}>
                  {selectedItem.item.tags.map((tag: any) => {
                    return (
                      <TagCell
                        tag={tag}
                        comment={false}
                        description={false}
                        cellcallback={cellCallback}
                        key={tag.tagID}
                      />
                    )
                  })}
                </Stack>
              </InfoWindow>
            )}
        </GoogleMap>
      )}
    </MBox>
  )
}
export default ViewMap
