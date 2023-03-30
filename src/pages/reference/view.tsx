import ApartmentIcon from '@mui/icons-material/Apartment'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import SearchIcon from '@mui/icons-material/Search'

import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import Fab from '@mui/material/Fab'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'

import type { NextPage } from 'next'
import { useState, useEffect, useRef } from 'react'

import { getUserID, getDataFromGeoLocation } from '@/Firebase/apis'
import Header from '@/components/Header'
import ViewMap from '@/components/ReferenceMap'
import TagDetail from '@/components/TagDetail'
import ViewAR from '@/components/ViewAR'
import {
  ViewFilter,
  ViewFilterChips,
  filteringTags
} from '@/components/ViewFilter'
import ViewList from '@/components/ViewList'
import { StyledUI, StyledSX } from '@/components/interface/CommonChips'

import { ApiQuene } from '@/utils/ApiQuene'
import { DeviceOrientationPermitter } from '@/utils/DeviceOrientationPermitter'
import { MapUtils, GeolocationCoordinates } from '@/utils/GpsUtils'
import { Building, Tag, Frn, Veg, TagUtils } from '@/utils/TagUtils'

const SVWrapper = styled(Box)`
  width: 80%;
  height: 100%;
  position: absolute;
  top: 0;
  z-index: 1;
`

const SLWrapper = styled(Box)`
  width: 400px;
  max-width: 50%;
  height: 100%;
  position: absolute;
  right: 0;
  z-index: 1;
`

const menuBox = {
  m: '30px',
  position: 'absolute',
  top: '58px',
  bgcolor: '#ffffff'
}

const locations = [
  MapUtils.LOCATION.KANNAI2,
  MapUtils.LOCATION.KANNAI,
  MapUtils.LOCATION.KANNAI3,
  MapUtils.LOCATION.KANNAI4,
  MapUtils.LOCATION.TAKANAWA,
  MapUtils.LOCATION.TAKANAWA2,
  MapUtils.LOCATION.TAKANAWA3,
  MapUtils.LOCATION.TAKANAWA4
]

const ReferenceView: NextPage = () => {
  const [coords, setCoords] = useState<GeolocationCoordinates>(
    MapUtils.SAMPLE_COODS(MapUtils.LOCATION.TAKANAWA4)
  )
  const [gpsPrepared, setGpsPrepated] = useState<boolean>(false)

  const [buildings, setBuildings] = useState<Array<Building>>([])
  const [tags, setTags] = useState<Array<Tag>>([])
  const [filteredTags, setFilteredTags] = useState<Array<Tag>>([])
  const [frns, setFrns] = useState<Array<Frn>>([])
  const [vegs, setVegs] = useState<Array<Veg>>([])

  const [filterMode, setFilterMode] = useState<boolean>(false)
  const [addMode, setAddMode] = useState<boolean>(false)
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [arMode, setArMode] = useState<boolean>(false)

  const [orientationPermitter, setOrientationPermitter] = useState<any>(null)
  const [availableOrientation, setAvailableOrientation] =
    useState<boolean>(false)

  const [filters, setFilters] = useState({
    category: 'None',
    hashTags: [] as string[],
    group: '',
    own: false
  })

  const [openDialog, setOpenDialog] = useState<boolean>(false)
  const [viewRadius, setViewRadius] = useState<number>(100)
  const quene = useRef(new ApiQuene())

  useEffect(() => {
    // setItem('Map')
    setUpGPS()
    return () => {
      clearGPS()
    }
  }, [])

  useEffect(() => {
    console.log(coords)
    // 距離が一定以上（移動した）ならタグリスト更新
    if (gpsPrepared) {
      addQue(coords, viewRadius)
    }
  }, [coords])

  useEffect(() => {
    if (orientationPermitter) {
      setUpOrientation()
    }
    return () => {
      if (orientationPermitter) {
        orientationPermitter.disconnect()
      }
    }
  }, [orientationPermitter])

  useEffect(() => {
    if (selectedTag !== null) {
      setOpenDialog(true)
    }
  }, [selectedTag])

  const handleChange = (event: SelectChangeEvent) => {
    setCoords(MapUtils.SAMPLE_COODS(event.target.value))
  }

  const handleChange2 = (event: SelectChangeEvent) => {
    const newR = Number(event.target.value)
    if (newR >= 50) {
      setViewRadius(newR)
      addQue(coords, newR)
    }
  }

  // GPSの監視開始
  const setUpGPS = () => {
    console.log('setUpGPS ')
    setCoords(MapUtils.SAMPLE_COODS(MapUtils.LOCATION.TAKANAWA4))
    addQue(coords, viewRadius)
    setGpsPrepated(true)
    setOrientationPermitter(new DeviceOrientationPermitter())
  }

  const clearGPS = () => {
    console.log('clearGPS ')
    // if (watchID !== -1) {
  }

  const setUpOrientation = () => {
    const setup = () => {
      orientationPermitter.connect()
      window.removeEventListener('pointerdown', setup)
    }
    window.addEventListener('pointerdown', setup)
    orientationPermitter.on('granted', (ev: any) => {
      setAvailableOrientation(true)
    })
  }

  const addQue = async (newCoods: GeolocationCoordinates, radius: number) => {
    console.log('addQue ' + quene.current.on)
    console.log(JSON.stringify(quene.current.nowJob))
    console.log(JSON.stringify(quene.current.nextJob))
    quene.current.setNextJob({ coords: newCoods, radius: radius } as any)
    runQue()
  }

  const runQue = async () => {
    console.log('runque ' + quene.current.on)
    console.log(JSON.stringify(quene.current.nowJob))
    console.log(JSON.stringify(quene.current.nextJob))

    if (quene.current.isWorking()) {
      return
    }
    const job = quene.current.getJob()
    if (job === null) {
      return
    }
    quene.current.startWorking()
    console.log('start job ' + JSON.stringify(quene.current.nowJob))
    await refreshBuildings(job.coords, job.radius)
    console.log('finish job ' + JSON.stringify(quene.current.nowJob))
    quene.current.finishWorking()
    runQue()
  }

  const refreshBuildings = async (
    newCoods: GeolocationCoordinates,
    radius: number
  ) => {
    console.log('refreshBuildings ')
    try {
      const result = await getDataFromGeoLocation(newCoods, radius)
      let newBuildings = []
      let newTags = []
      let newFrns = []
      let newVegs = []
      if (result.data) {
        const data: any = result.data
        newBuildings = data.buildings ? data.buildings : []
        newTags = data.tags ? data.tags : []
        newFrns = data.frns ? data.frns : []
        newVegs = data.vegs ? data.vegs : []
        newBuildings = newBuildings.map((aBldg: any) => {
          return TagUtils.convertCallableApiObjToBuilding(aBldg)
        })
        newFrns = newFrns.map((aFrn: any) => {
          return TagUtils.convertCallableApiObjToFrn(aFrn)
        })
        newTags = newTags.map((aTag: any) => {
          return TagUtils.convertCallableApiObjToTag(aTag)
        })
        newVegs = newVegs.map((aVeg: any) => {
          return TagUtils.convertCallableApiObjToVeg(aVeg)
        })
      }
      setBuildings(newBuildings)
      setFrns(newFrns)
      setTags(newTags)
      setVegs(newVegs)
      console.log(
        'b: ' +
          newBuildings.length +
          ', f: ' +
          newFrns.length +
          ', v: ' +
          newVegs.length +
          ', t:' +
          newTags.length
      )
      refreshFilteredTags(newTags, filters)
    } catch (e: any) {
      console.error(e)
      console.log('MainErr: refreshBuildings')
    }
  }

  //   // 新たなソート順
  // }

  // FIlter
  const refreshFilteredTags = (newTags: Array<Tag>, fs: any) => {
    const filtered = filteringTags(newTags, fs, getUserID())
    setFilteredTags(filtered)
  }

  // AR, Map画面からのコールバック（マップ、リストと共通仕様でも構わない）
  const viewCallback = async (event: any) => {
    if (event.type === 'position') {
      setCoords(event.coords)
    }
    if (event.tag) {
      if (event.type === 'comment') {
        setSelectedTag(event.tag)
      }
    }
  }

  const filterViewCallback = (event: any) => {
    if (event.type === 'update') {
      const f = {
        category: event.category,
        hashTags: event.hashTags,
        group: event.group,
        own: event.own
      }
      setFilters(f)
      refreshFilteredTags(tags, f)
    }
    setOpenDialog(false)
    setFilterMode(false)
  }

  const filterChipsCallback = (newFilters: any) => {
    console.log('filterChipsCallback')
    console.log(newFilters)
    setFilters(newFilters)
    refreshFilteredTags(tags, newFilters)
  }

  const bldgBtnClicked = () => {
    setAddMode(true)
  }

  const bldgCancelBtnClicked = () => {
    setAddMode(false)
  }

  const filterBtnClicked = () => {
    console.log(filterMode)
    setFilterMode(!filterMode)
    setOpenDialog(true)
  }

  // tagDetal
  const tagDetailCallback = (event: any) => {
    console.log(event)
    if (event.type) {
      if (event.type === 'close') {
        setOpenDialog(false)
        setSelectedTag(null)
      }
    }
  }

  const dialogOnClose = () => {
    setOpenDialog(false)
    setFilterMode(false)
    setSelectedTag(null)
  }

  return (
    <>
      <Header>REFERENCE</Header>
      <StyledUI.SCWrapper>
        <SVWrapper>
          {arMode ? (
            <ViewAR
              coords={coords}
              buildings={buildings}
              tags={filteredTags}
              frns={frns}
              vegs={vegs}
              itemcallback={viewCallback}
              addMode={false}
              lod1Mode={addMode}
              orientation={availableOrientation}
              fov={75}
            />
          ) : (
            <ViewMap
              coords={coords}
              buildings={buildings}
              frns={frns}
              vegs={vegs}
              tags={filteredTags}
              itemcallback={viewCallback}
              addMode={addMode}
              orientation={availableOrientation}
            />
          )}
        </SVWrapper>
        {!arMode && (
          <SLWrapper>
            <ViewList
              coords={coords}
              buildings={buildings}
              frns={frns}
              vegs={vegs}
              tags={filteredTags}
              itemcallback={viewCallback}
              orientation={availableOrientation}
            />
          </SLWrapper>
        )}
        <Box
          sx={{
            ...menuBox,
            zIndex: 2,
            width: 160
          }}
        >
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">登録場所</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              label="Location"
              onChange={handleChange}
              defaultValue={locations[0]}
            >
              {locations.map((pos) => {
                return (
                  <MenuItem value={pos} key={pos}>
                    {pos}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
        </Box>
        <Box
          sx={{
            ...menuBox,
            width: 100,
            left: '170px',
            zIndex: 4
          }}
        >
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label2">検索半径</InputLabel>
            <Select
              labelId="demo-simple-select-label2"
              id="demo-simple-select2"
              label="Radius"
              value={'' + viewRadius}
              onChange={handleChange2}
            >
              <MenuItem value={'50'}>50</MenuItem>
              <MenuItem value={'100'}>100</MenuItem>
              <MenuItem value={'150'}>150</MenuItem>
              <MenuItem value={'200'}>200</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <ViewFilterChips
          category={filters.category}
          hashTags={filters.hashTags}
          own={filters.own}
          callback={filterChipsCallback}
          group={filters.group}
        />
        <Stack
          sx={StyledSX.StackBtm}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={'20px'}
        >
          <Fab
            color="primary"
            aria-label="search"
            size="small"
            onClick={filterBtnClicked}
          >
            <SearchIcon />
          </Fab>
          <Fab
            color="secondary"
            size="small"
            aria-label="search"
            onClick={() => {
              setArMode(!arMode)
            }}
          >
            <CameraAltIcon />
          </Fab>
          {addMode ? (
            <Fab
              color="error"
              size="small"
              aria-label="add"
              onClick={bldgCancelBtnClicked}
              sx={{
                border: 6,
                borderColor: '#e63b43',
                color: '#ffffff',
                bgcolor: '#e63b43'
              }}
            >
              <ApartmentIcon />
            </Fab>
          ) : (
            <Fab
              color="error"
              size="small"
              aria-label="add"
              onClick={bldgBtnClicked}
              sx={{
                border: 6,
                borderColor: '#f0f4c2',
                bgcolor: '#ffffff',
                color: '#e63b43'
              }}
            >
              <ApartmentIcon />
            </Fab>
          )}
        </Stack>
      </StyledUI.SCWrapper>
      <Dialog open={openDialog} sx={{ p: '12px' }} onClose={dialogOnClose}>
        <DialogContent sx={{ width: '500px' }}>
          {filterMode && (
            <ViewFilter
              category={filters.category}
              hashTags={filters.hashTags}
              own={filters.own}
              callback={filterViewCallback}
              group={filters.group}
            />
          )}
          {selectedTag && (
            <TagDetail
              tag={selectedTag!}
              comment={false}
              description={true}
              cellcallback={tagDetailCallback}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ReferenceView
