// import Image from 'next/image'
import Backdrop from '@mui/material/Backdrop'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'

import React, { FC, useEffect, useState } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import { doLike } from '@/Firebase/apis'
import TagCell from '@/components/TagCell'
import { GeoProps } from '@/components/interface/props'
import { GeolocationCoordinates } from '@/utils/GpsUtils'
import {
  Building,
  Tag,
  CameraOffsetAtom,
  TargetAtom,
  Frn,
  Veg
} from '@/utils/TagUtils'

import { ARController } from 'src/ar/ar-control'

const ViewAR: FC<GeoProps> = ({ ...props }) => {
  const [checker, setChecker] = useState(Date.now())
  const [initializer, setInitializer] = useState<boolean>(false)
  const [arController, setARController] = useState<ARController | null>(null)
  const [selTag, setSelTag] = useState<Tag | null>(null)
  const [cameraOffset, setCameraOffset] = useRecoilState(CameraOffsetAtom)
  const selectedTarget = useRecoilValue(TargetAtom)
  const [dialogFlag, setDialogFlag] = useState<boolean>(false)
  const [backdropFlag, setBackDropFlag] = useState<boolean>(true)
  // const [trans, setTrans] = useState<Array<Tran>>([])
  // const [polys, setPolys] = useState<Array<Poly>>([])

  useEffect(() => {
    return function () {
      console.log('finish VR ')
      // if (arController) {
      //   arController.stop()
      // }
    }
  }, [])

  // FCではなくPageの場合に必要。FCの場合はPageの初期化段階でwindowは存在している？
  useEffect(() => {
    console.log('use effect ' + checker)
    if (typeof window !== 'undefined') {
      console.log('window exist')
      setInitializer(true)
    } else {
      console.log('window is null')
      setChecker(Date.now())
    }
  }, [checker])

  // 一度だけ初期化してくれる。
  useEffect(() => {
    console.log('use effect initializer: ' + initializer)
    if (initializer) {
      console.log('load render')
      if (arController !== null) {
        return
      }
      console.log('initialize ar')
      if (document.getElementById('root') == null) return
      // arControllerのuseEffect発火
      setARController(new ARController('root'))
    }
  }, [initializer])

  useEffect(() => {
    console.log('use effect arcontroller')
    if (arController) {
      console.log('loaded ar')
      setUpController()
    } else {
      console.log('arController is null')
    }
    return function () {
      // Threeのレンダリング停止
      console.log('finish VR2 ' + (arController ? 'alive' : 'null'))
      if (arController) {
        arController.stop()
      }
    }
  }, [arController])

  useEffect(() => {
    if (props.orientation) {
      if (arController && arController.orientationControls.enabled === false) {
        onClickBackDrop(null)
      }
    }
  }, [props.orientation])

  useEffect(() => {
    updateGPS(props.coords)
  }, [props.coords])

  useEffect(() => {
    updateBuildings(props.buildings)
  }, [props.buildings])

  useEffect(() => {
    updateTags(props.tags)
  }, [props.tags])

  useEffect(() => {
    updateFrns(props.frns)
  }, [props.frns])

  useEffect(() => {
    updateVegs(props.vegs)
  }, [props.vegs])

  useEffect(() => {
    updateMode()
  }, [props.addMode, props.lod1Mode])

  useEffect(() => {
    if (arController && props.fov) {
      console.log('fov: ' + props.fov)
      arController.camera.fov = props.fov
      // setCameraOffset({
      //   ...arController.calibration,
      //   fov: arController.camera.fov
      // })
    }
  }, [props.fov])

  useEffect(() => {
    if (!dialogFlag) {
      setSelTag(null)
    }
  }, [dialogFlag])

  // useEffect(() => {
  //   if (arController) {
  //     arController.refreshTransMesh(trans)
  //   }
  // }, [trans])

  // useEffect(() => {
  //   if (arController) {
  //     arController.updatePolyMesh(polys)
  //   }
  // }, [polys])

  const onClickBackDrop = (e: any) => {
    if (arController) {
      if (!arController.orientationControls.enabled) {
        return
      }
      setBackDropFlag(false)
      updateMode()
      arController.setUpCaribration(cameraOffset)
      if (props.addMode && selectedTarget) {
        arController.setupTarget(selectedTarget)
        if (props.itemcallback) {
          const callbackobj: any = {
            type: 'visible',
            target: 'create',
            value: true
          }
          props.itemcallback(callbackobj)
        }
      }
    }
  }

  const setUpController = async () => {
    console.log('setupController')
    // stateにセットし終わった後じゃないと、中のオブジェクトが保持されない。別インスタンスとして扱われるので注意
    if (!arController) {
      return
    }

    if (props.itemcallback) {
      const callbackobj: any = {
        type: 'visible',
        target: 'create',
        value: false
      }
      props.itemcallback(callbackobj)
    }

    arController.setup()
    arController.on('gpsinitialized', (pos: any, dist: any) => {
      console.log('arcontroller gpsinitialized ' + dist)
      arController.startRendering()
      updateBuildings(props.buildings)
      updateTags(props.tags)
      updateFrns(props.frns)
      updateVegs(props.vegs)
    })
    arController.on('gpsupdate', (pos: any, dist: any) => {
      console.log('arcontroller gpsupdate ' + dist)
    })
    arController.on('offsetupdate', () => {
      setCameraOffset({
        ...arController.calibration,
        fov: arController.camera.fov
      })
    })
    arController.on('raycastobject', (event: any) => {
      console.log('raycastobject: ' + event.key + ', ' + event.distance)
      if (event.key === 'select_object') {
        setDialogFlag(false)
        const callbackobj: any = {
          type: 'create',
          offset: event.offset,
          rotation: event.rotation,
          objtype: event.objtype
        }
        if (event.objtype === 'building') {
          callbackobj.building = event.object
        } else if (event.objtype === 'poly') {
          callbackobj.poly = event.object
        } else if (event.objtype === 'frn') {
          callbackobj.frn = event.object
        } else if (event.objtype === 'veg') {
          callbackobj.veg = event.object
        }
        if (props.itemcallback) {
          props.itemcallback(callbackobj)
        }
      } else if (event.key === 'update_building') {
        setDialogFlag(false)
        console.log(event)
        const callbackobj: any = {
          type: 'create',
          offset: event.offset,
          rotation: event.rotation,
          objtype: event.objtype
        }
        if (event.objtype === 'building') {
          callbackobj.building = event.object
        } else if (event.objtype === 'poly') {
          callbackobj.poly = event.object
        } else if (event.objtype === 'frn') {
          callbackobj.frn = event.object
        } else if (event.objtype === 'veg') {
          callbackobj.veg = event.object
        }
        if (props.itemcallback) {
          props.itemcallback(callbackobj)
        }
      } else if (event.key === 'tag') {
        setSelTag(event.object)
        setDialogFlag(true)
      }
    })
    // arController.startRendering();
    updateGPS(props.coords)
    if (props.orientation) {
      arController.orientationControls.connect()
      // onClickBackDrop(null)
    }
  }

  const updateGPS = (coords: GeolocationCoordinates) => {
    console.log('Update GPS')
    console.log(coords)
    if (arController) {
      if (coords.latitude && coords.latitude !== 0) {
        arController.updateGps(coords)
      }
    }
  }

  const updateBuildings = (buildings: Array<Building>) => {
    console.log('Update Buildings')
    if (arController) {
      arController.addQuene('update_building', buildings)
    }
  }

  const updateTags = (tags: Array<Tag>) => {
    console.log('Update Tags')
    if (arController) {
      arController.addQuene('update_tag', tags)
      // arController.updateTagList(tags)
    }
  }

  const updateFrns = (frns: Array<Frn>) => {
    console.log('Update Frns')
    if (arController) {
      arController.addQuene('update_frn', frns)
    }
  }

  const updateVegs = (vegs: Array<Veg>) => {
    console.log('Update Vegs ' + vegs.length)
    if (arController) {
      arController.addQuene('update_veg', vegs)
    }
  }

  // const refreshOtherPlateauObjects = async () => {
  //   console.log('refreshOtherPlateauObjects')
  //   // tranデータ（高輪オンリー）
  //   getPlateauTrans(props.coords, 100)
  //     .then((items) => {
  //       setTrans(items)
  //     })
  //     .catch((e) => {
  //       console.error(e)
  //     })

  //   // LOD3のpolyデータ。typeでtranやvegは見分けよう
  //   getPlateauPolygons(props.coords, 100)
  //     .then((items) => {
  //       setPolys(items)
  //     })
  //     .catch((e) => {
  //       console.error(e)
  //     })
  // }

  const updateMode = () => {
    console.log(props.addMode)
    if (arController) {
      if (props.addMode) {
        arController.changeMode('select_object')
      } else {
        if (props.lod1Mode) {
          arController.changeMode('with_building')
        } else {
          arController.changeMode('normal')
        }
      }
    }
  }

  const cellCallback = async (event: any) => {
    console.log(event)
    if (event.type === 'like') {
      // like api
      if (await doLike(event.tag)) {
        setSelTag(event.tag)
      }
    } else if (event.type === 'edit') {
      if (props.itemcallback) {
        props.itemcallback(event)
      }
    } else if (event.type === 'comment') {
      // comment api
      if (props.itemcallback) {
        props.itemcallback(event)
      }
    }
  }

  return (
    <>
      <div id="root"></div>
      <Backdrop
        open={backdropFlag}
        onClick={onClickBackDrop}
        sx={{ p: '12px' }}
      >
        <Typography
          variant="h1"
          noWrap
          component="a"
          align="center"
          color="secondary"
          sx={{
            textAlign: 'center',
            fontFamily: 'Oswald',
            fontWeight: 700,
            fontSize: '3rem',
            letterSpacing: '.7rem',
            textDecoration: 'none'
          }}
        >
          Start AR!
        </Typography>
      </Backdrop>
      <Dialog
        open={dialogFlag}
        sx={{ p: '12px' }}
        onClose={() => {
          setDialogFlag(false)
        }}
      >
        {selTag && (
          <DialogContent>
            <TagCell
              tag={selTag!}
              comment={false}
              description={true}
              cellcallback={cellCallback}
            />
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
export default ViewAR
