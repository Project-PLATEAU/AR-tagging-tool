import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'
import {
  GoogleMap,
  Marker,
  useLoadScript,
  InfoWindow
} from '@react-google-maps/api'
import React, { FC, useEffect, useState } from 'react'
import { useRecoilState } from 'recoil'
import { doLike } from '@/Firebase/apis'
import TagCell from '@/components/TagCell'
import { GeoProps } from '@/components/interface/props'
import {
  GeolocationCoordinates,
  MapUtils,
  ZoomAtom,
  GpsAtom
} from '@/utils/GpsUtils'
import { Tag, TagUtils } from '@/utils/TagUtils'

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

const ViewMap: FC<GeoProps> = ({ ...props }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!
  })

  // const [mapCoords, setMapCoords] = useState<any>({
  //   lat: 35.44983922,
  //   lng: 139.63342982
  // })
  const [mapCoords, setMapCoords] = useState<any>({
    lat: 35.6407664,
    lng: 139.73377705
  })

  const [markerTags, setMarkerTags] = useState<Array<Tag>>([])
  const [isItemSelected, setIsItemSelected] = useState<boolean>(false)
  const [selectedItem, setSelectedItem] = useState<any>({})
  const [assembleMode, setAssembleMode] = useState<boolean>(true)
  const [assembledTag, setAssembledTag] = useState<Array<any>>([])
  const [mapRef, setMapRef] = useState<any>(null)
  // const [refreshMapCenter, setRefreshMapCenter] = useState<boolean>(true)
  const [zoomState, setZoomState] = useRecoilState(ZoomAtom)
  const [gpsState, setGpsState] = useRecoilState(GpsAtom)

  useEffect(() => {
    updateGPS(props.coords)
  }, [props.coords])

  const updateGPS = (coords: GeolocationCoordinates) => {
    if (props.coords) {
      const gcoords = MapUtils.transformToGMapCoords(coords)
      setMapCoords(gcoords)
      // if (mapRef && refreshMapCenter) {
      //   // mapRef.setCenter(gcoords)
      //   console.log('hhhh')
      //   setPointed(gcoords)
      //   if (refreshMapCenter) {
      //     setRefreshMapCenter(false)
      //   }
      // }
    }
  }

  useEffect(() => {
    updateTags(props.tags)
  }, [props.tags])

  // useEffect(() => {
  //   if (mapRef && refreshMapCenter) {
  //     // mapRef.setCenter(pointed)
  //     if (refreshMapCenter) {
  //       setRefreshMapCenter(false)
  //     }
  //   }
  // }, [refreshMapCenter])

  useEffect(() => {
    console.log(' add mode ' + props.addMode)
    if (mapRef && props.addMode) {
      const gcoords = MapUtils.transformToGMapCoords(props.coords)
      setGpsState(gcoords)
      // setPointed(gcoords)
      if (props.itemcallback) {
        props.itemcallback({
          type: 'position',
          coords: props.coords
        })
      }
    }
  }, [props.addMode])

  useEffect(() => {
    if (zoomState > 19) {
      setAssembleMode(false)
    } else {
      setAssembleMode(true)
    }
  }, [zoomState])

  useEffect(() => {
    if (mapRef) {
      mapRef.panTo(gpsState)
    }
  }, [gpsState])

  const updateTags = (tags: Array<Tag>) => {
    console.log('Brouse: Update Tags ' + tags.length)
    setMarkerTags(tags)
    const hasObjects: any = {}
    for (const tag of tags) {
      if (hasObjects[tag.gmlID]) {
        const hObj = hasObjects[tag.gmlID]
        hObj.tags.push(tag)
      } else {
        let type = 'building'
        if (tag.gmlID.includes('frn_')) {
          type = 'frn'
        } else if (tag.gmlID.includes('veg_')) {
          type = 'veg'
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

  const clearSelectedItem = () => {
    setIsItemSelected(false)
    if (props.itemcallback) {
      props.itemcallback({ type: 'clear' })
    }
  }

  const onClickTag = (event: any, tagID: string) => {
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

  const mapClicked = (e: any) => {
    if (e.latLng) {
      if (props.itemcallback) {
        const coords = MapUtils.NEW_COORDS(e.latLng.lng(), e.latLng.lat())
        setGpsState({
          lng: e.latLng.lng(),
          lat: e.latLng.lat()
        })
        props.itemcallback({
          type: 'position',
          coords: coords
        })
      }
    }
  }

  return (
    <MBox>
      {isLoaded && (
        <GoogleMap
          mapContainerStyle={containerStyle}
          // center={MapUtils.DEFAULT_LATLNG}
          center={gpsState}
          zoom={zoomState}
          options={mapOptions}
          onZoomChanged={zoomChecker}
          onLoad={(map) => {
            setMapRef(map)
            map.setCenter(gpsState)
          }}
          onClick={mapClicked}
        >
          <Marker
            icon={{
              path: 0,
              scale: 6,
              strokeColor: '#6699cc',
              strokeWeight: 4,
              fillColor: '#99ccff',
              fillOpacity: 1
            }}
            position={mapCoords}
            key="mypos"
          />
          <Marker
            position={gpsState}
            icon={{
              path: 0,
              scale: 6,
              strokeColor: '#66cc99',
              strokeWeight: 4,
              fillColor: '#99ffcc',
              fillOpacity: 1
            }}
            key="mypos2"
          />
          {assembleMode
            ? assembledTag.map((hObj) => {
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
            : markerTags.map((tag: Tag) => {
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
              })}
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
