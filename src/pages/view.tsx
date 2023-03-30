import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import PinDropIcon from '@mui/icons-material/PinDrop'
import SearchIcon from '@mui/icons-material/Search'

import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Fab from '@mui/material/Fab'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'

import type { NextPage } from 'next'
import { useState, useEffect } from 'react'
import { useRecoilState } from 'recoil'

import { getUserID, getDataFromGeoLocation } from '@/Firebase/apis'
import Header from '@/components/Header'
import TagCreate from '@/components/TagCreate'
import TagDetail from '@/components/TagDetail'
import TagEdit from '@/components/TagEdit'
import ViewAR from '@/components/ViewAR'
import {
  ViewFilter,
  ViewFilterChips,
  filteringTags
} from '@/components/ViewFilter'
// import ViewList from '@/components/ViewList'
import ViewMap from '@/components/ViewMap'
import { StyledUI, StyledSX } from '@/components/interface/CommonChips'

import { ApiQuene } from '@/utils/ApiQuene'
import { DeviceOrientationPermitter } from '@/utils/DeviceOrientationPermitter'
import { MapUtils, GeolocationCoordinates } from '@/utils/GpsUtils'

import {
  TagUtils,
  Building,
  Tag,
  Frn,
  Veg,
  TargetAtom,
  TagAtom,
  OffsetAtom,
  CameraOffsetAtom
} from '@/utils/TagUtils'

const SBox = styled(Box)`
  margin: 1rem;
  position: absolute;
  top: 58px;
  z-index: 2;
  width: 100%;
`

const BLeft = {
  display: 'inline-flex',
  width: '47%',
  border: 6,
  borderRadius: 4,
  borderColor: '#f0f4c2',
  fontSize: 18,
  fontWeight: 'bold',
  zindex: 1000
}

const stackTopStyle = {
  position: 'absolute',
  top: '138px',
  zIndex: 100,
  width: '180px',
  p: '20px'
}

const categoryStyle = {
  width: '60px',
  height: '60px',
  bgcolor: '#fff',
  border: 4,
  borderColor: '#f0f4c2'
}

const cancelAvatarStyle = {
  width: '40px',
  height: '40px',
  bgcolor: '#e63b43',
  borderColor: '#f0f4c2',
  color: '#fff'
}

const phones = [
  { name: 'iPhone 5, 6, SE', fov: 73 },
  { name: 'iPhone 7, 8, X', fov: 75 },
  { name: 'iPhone XS ~ 13', fov: 80 },
  { name: 'iPhone 14 pro', fov: 84 },
  { name: 'iPad mini', fov: 70 },
  { name: 'iPad pro', fov: 75 },
  { name: 'Pixel 4, 5', fov: 77 },
  { name: 'Pixel 6, 7', fov: 82 },
  { name: 'Galaxy S10', fov: 77 },
  { name: 'Galaxy A41, A51', fov: 80 },
  { name: 'Galaxy A52', fov: 81 },
  { name: 'Xperia 1, 5 series', fov: 84 },
  { name: 'Arrows NX9', fov: 79 },
  { name: 'Aquos sense3', fov: 76 }
]

const MainPage: NextPage = () => {
  const [backBtnVisible, setBackBtnVisible] = useState(false)

  const [viewPage, setViewPage] = useState('Map')
  const [beforePage, setBeforePage] = useState('Map')
  const [viewPageSel, setViewPageSel] = useState('Map')
  const [viewMode, setViewMode] = useState(0)
  const [headerTitle, setHeaderTitle] = useState('View')

  const [watchID, setWatchID] = useState(-1)
  const [coords, setCoords] = useState<GeolocationCoordinates>(
    MapUtils.SAMPLE_COODS(MapUtils.LOCATION.TAKANAWA)
  )
  const [lastCoords, setLastCoords] = useState<GeolocationCoordinates>(
    MapUtils.NEW_COORDS()
  )
  const [gpsPrepared, setGpsPrepated] = useState<boolean>(false)

  const [buildings, setBuildings] = useState<Array<Building>>([])
  const [tags, setTags] = useState<Array<Tag>>([])
  const [filteredTags, setFilteredTags] = useState<Array<Tag>>([])
  const [frns, setFrns] = useState<Array<Frn>>([])
  const [vegs, setVegs] = useState<Array<Veg>>([])

  const [addMode, setAddMode] = useState<boolean>(false)
  const [showCreateBtn, setShowCreateBtn] = useState<boolean>(false)
  const [showSelectTaggingMode, setShowSelectTaggingMode] =
    useState<boolean>(false)

  const [selectedTarget, setSelectedTarget] = useRecoilState(TargetAtom)
  const [cameraOffset, setCameraOffset] = useRecoilState(CameraOffsetAtom)
  const [selectedTag, setSelectedTag] = useRecoilState(TagAtom)
  const [selectedOffset, setSelectedOffset] = useRecoilState(OffsetAtom)

  const [selectedCategory, setSelectedCategory] = useState('GOOD')

  const [arOpt, setArOpt] = useState(0)

  const [filters, setFilters] = useState({
    category: 'None',
    group: '',
    hashTags: [] as string[],
    own: false
  })

  // menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const [openDialog, setOpenDialog] = useState<boolean>(false)

  const [orientationPermitter, setOrientationPermitter] = useState<any>(null)
  const [availableOrientation, setAvailableOrientation] =
    useState<boolean>(false)

  const [quene, setQuene] = useState<ApiQuene>(new ApiQuene())
  // const quene = useRef(new ApiQuene())

  useEffect(() => {
    setUpGPS()
    setQuene(quene)
    return () => {
      clearGPS()
    }
  }, [])

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
    if (viewPage === 'AR') {
      setHeaderTitle('AIRNOTATION(AR)')
      setViewMode(0)
      setBackBtnVisible(false)
      setViewPageSel('AR')
    }
    if (viewPage === 'Map') {
      setHeaderTitle('AIRNOTATION(MAP)')
      setViewMode(0)
      setBackBtnVisible(false)
      setViewPageSel('Map')
    }
    if (viewPage === 'List') {
      setHeaderTitle('AIRNOTATION(LIST)')
      setViewMode(0)
      setBackBtnVisible(false)
      setViewPageSel('List')
      clearParams()
      setShowCreateBtn(false)
      setAddMode(false)
    }
    if (viewPage === 'Tag') {
      setHeaderTitle('詳細情報')
      setViewMode(1)
      setBackBtnVisible(true)
    }
    if (viewPage === 'Create') {
      setHeaderTitle('新規作成')
      setViewMode(1)
      setBackBtnVisible(true)
      setArOpt(0)
    }
    if (viewPage === 'Edit') {
      setHeaderTitle('編集')
      setViewMode(1)
      setBackBtnVisible(true)
    }
  }, [viewPage])

  useEffect(() => {
    // console.log(coords)
    // 距離が一定以上（移動した）ならタグリスト更新
    if (
      gpsPrepared &&
      MapUtils.GetDistance(coords, lastCoords) > MapUtils.MinDistance
    ) {
      setLastCoords(coords)
      console.log(coords)
      addQue(coords)
      // refreshBuildings(coords)
    }
  }, [coords])

  const handleChange = (event: SelectChangeEvent) => {
    setArOpt(0)
    setBeforePage(viewPage)
    setViewPage(event.target.value)
  }

  // GPSの監視開始
  const setUpGPS = () => {
    console.log('setUpGPS id:' + watchID)
    if (watchID === -1) {
      const wID = window.navigator.geolocation.watchPosition(
        (position) => {
          setCoords(position.coords)
          // setCoords(
          //   MapUtils.SAMPLE_COODS(MapUtils.LOCATION.TAKANAWA4, position.coords)
          // )
        },
        (error) => {
          alert(`GPS error: code ${error.code}`)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0
        }
      )
      console.log('watch id:' + wID)
      setWatchID(wID)
      setGpsPrepated(true)
      setOrientationPermitter(new DeviceOrientationPermitter())
    }
  }

  const clearGPS = () => {
    console.log('clearGPS ' + watchID)
    window.navigator.geolocation.clearWatch(watchID)
    setWatchID(-1)
  }

  const setUpOrientation = () => {
    console.log('setuporientation')
    const setup = () => {
      orientationPermitter.connect()
      window.removeEventListener('click', setup)
    }
    window.addEventListener('click', setup)
    orientationPermitter.on('granted', (ev: any) => {
      console.log('granted')
      setAvailableOrientation(true)
    })
  }

  const addQue = async (newCoods: GeolocationCoordinates) => {
    console.log('addQue ' + quene.on)
    const rc = MapUtils.REDUCE_COORDS(newCoods)
    quene.setNextJob({ coords: rc })
    runQue()
  }

  const runQue = async () => {
    console.log('runque ' + quene.on)
    if (quene.isWorking()) {
      return
    }
    const job = quene.getJob()
    if (job === null) {
      return
    }
    quene.startWorking()
    console.log('start job ' + JSON.stringify(quene.nowJob))
    await refreshBuildings(job.coords)
    console.log('finish job ' + JSON.stringify(quene.nowJob))
    quene.finishWorking()
    runQue()
  }

  const refreshBuildings = async (newCoods: GeolocationCoordinates) => {
    console.log('refreshBuildings ' + watchID)
    try {
      if (!newCoods.longitude || !newCoods.latitude) {
        return
      }
      const result = await getDataFromGeoLocation(newCoods, 60)
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
      console.log('Main: refreshBuildings failed.')
    }
  }

  // Filter
  const refreshFilteredTags = (newTags: Array<Tag>, fs: any) => {
    const filtered = filteringTags(newTags, fs, getUserID())
    setFilteredTags(filtered)
  }

  const clearParams = () => {
    // setSelectedBuilding(null)
    setShowSelectTaggingMode(false)
    setSelectedTarget(null)
    setSelectedOffset({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    })
  }

  // AR, Map画面からのコールバック（マップ、リストと共通仕様でも構わない）
  const viewCallback = async (event: any) => {
    console.log(event)
    if (event.type === 'clear') {
      clearParams()
      setShowCreateBtn(false)
      return
    }
    // console.log(event)
    if (event.type === 'visible') {
      if (event.target === 'create') {
        const v = event.value
        setShowCreateBtn(v)
      }
    }
    if (event.type === 'create') {
      if (event.objtype === 'building') {
        // setSelectedBuilding(event.building)
        setSelectedTarget(event.building)
      } else if (event.objtype === 'poly') {
        setSelectedTarget(event.poly)
      } else if (event.objtype === 'frn') {
        setSelectedTarget(event.frn)
      } else if (event.objtype === 'veg') {
        setSelectedTarget(event.veg)
      }
      setSelectedOffset({
        position: event.offset,
        rotation: event.rotation
      })
      if (viewPage === 'Map') {
        setShowSelectTaggingMode(true)
        // setBeforePage(viewPage)
        // setViewPage('AR')
      } else if (viewPage === 'AR') {
        setShowCreateBtn(true)
      }
      // setShowCreateBtn(true)
    } else if (event.tag) {
      if (event.type === 'edit') {
        setSelectedTag(event.tag)
        setBeforePage(viewPage)
        setViewPage('Edit')
      } else if (event.type === 'comment') {
        setSelectedTag(event.tag)
        setBeforePage(viewPage)
        setViewPage('Tag')
      }
    }
  }

  const selectTaggingBtnClicked = (num: number) => {
    setShowSelectTaggingMode(false)
    if (num === 0) {
      // AR
      setArOpt(1)
      setBeforePage('Map')
      setViewPage('AR')
    } else if (num === 1) {
      // Create
      setArOpt(0)
      createBtnClicked(2)
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
  }

  const filterChipsCallback = (newFilters: any) => {
    setFilters(newFilters)
    refreshFilteredTags(tags, newFilters)
  }

  const addBldgBtnClicked = () => {
    setAddMode(true)
  }

  const addBldgCancelBtnClicked = () => {
    // setSelectedBuilding(null)
    setSelectedTarget(null)
    setShowCreateBtn(false)
    setAddMode(false)
    if (arOpt !== 0) {
      if (viewPage === 'AR') {
        setBeforePage('Map')
        setViewPage('Map')
      }
    }
    setArOpt(0)
  }

  // const lodBtnClicked = () => {
  //   setLodMode(!lodMode)
  // }

  const filterBtnClicked = () => {
    setOpenDialog(true)
  }

  const createBtnClicked = (num: number) => {
    console.log(selectedTarget)
    if (selectedTarget) {
      if (num === 0) {
        setSelectedCategory('GOOD')
      } else if (num === 1) {
        setSelectedCategory('BAD')
      } else {
        setSelectedCategory('IDEA')
      }
      setBeforePage('Map')
      setViewPage('Create')
      setShowCreateBtn(false)
      setAddMode(false)
    }
  }

  // menu

  const handleClickFovBtn = (event: any) => {
    setAnchorEl(event.currentTarget)
  }
  const handleMenuItemClick = (event: any, index: number) => {
    const newParam = {
      ...cameraOffset
    }
    try {
      console.log(index)
      const phone = phones[index]
      if (cameraOffset.fov !== phone.fov) {
        newParam.fov = phone.fov
        setCameraOffset(newParam)
      }
      // setFov(phone.fov)

      // newParam.fov = phone.fov
      // setCameraOffset(newParam)
    } catch (e) {
      // newParam.fov = 75
      // setCameraOffset(newParam)
      console.log(e)
    }
    setAnchorEl(null)
  }

  // tagCreateCallback
  const tagCreateCallback = (event: any) => {
    if (event.type) {
      if (event.type === 'cancel') {
        setViewPage(beforePage)
        setAddMode(false)
        clearParams()
      }
      if (event.type === 'created') {
        setViewPage(beforePage)
        setAddMode(false)
        clearParams()
        addQue(coords)
        // refreshBuildings(coords)
      }
    }
  }

  // tagEdit
  const tagEditCallback = (event: any) => {
    if (event.type) {
      if (event.type === 'cancel') {
        setViewPage(beforePage)
        setAddMode(false)
        setSelectedTag(null)
      } else if (event.type === 'update') {
        setViewPage(beforePage)
        setAddMode(false)
        setSelectedTag(null)
        addQue(coords)
        // refreshBuildings(coords)
      } else if (event.type === 'delete') {
        setViewPage(beforePage)
        setAddMode(false)
        setSelectedTag(null)
        addQue(coords)
        // refreshBuildings(coords)
      }
    }
  }

  // tagDetal
  const tagDetailCallback = (event: any) => {
    console.log(event)
    if (event.type) {
      if (event.type === 'refresh') {
        addQue(coords)
        // refreshBuildings(coords)
      }
      if (event.type === 'close') {
        setViewPage(beforePage)
        setAddMode(false)
      }
    }
  }

  const backBtnPressed = () => {
    setViewPage(beforePage)
    setAddMode(false)
    setShowCreateBtn(false)
    if (viewPage === 'Tag') {
      setSelectedTag(null)
    }
    if (viewPage === 'Create') {
      clearParams()
    }
    if (viewPage === 'Edit') {
      setSelectedTag(null)
    }
  }

  const dialogOnClose = () => {
    setOpenDialog(false)
  }

  return (
    <>
      <Header showBackBtn={backBtnVisible} backBtnCallback={backBtnPressed}>
        {headerTitle}
      </Header>
      {viewMode === 0 ? (
        <StyledUI.SCWrapper>
          {/* タブ切り替えで各々のViewを表示させる */}
          <StyledUI.SVWrapper>
            {viewPage === 'AR' && (
              <ViewAR
                coords={coords}
                buildings={buildings}
                tags={filteredTags}
                frns={frns}
                vegs={vegs}
                orientation={availableOrientation}
                itemcallback={viewCallback}
                addMode={addMode}
                lod1Mode={false}
                fov={cameraOffset.fov}
              />
            )}
            {/* {viewPage === 'List' && (
              <ViewList
                coords={coords}
                buildings={buildings}
                frns={frns}
                vegs={vegs}
                tags={filteredTags}
                orientation={availableOrientation}
                itemcallback={viewCallback}
              />
            )} */}
            {viewPage === 'Map' && (
              <ViewMap
                coords={coords}
                buildings={buildings}
                frns={frns}
                vegs={vegs}
                tags={filteredTags}
                orientation={availableOrientation}
                itemcallback={viewCallback}
                addMode={addMode}
              />
            )}
          </StyledUI.SVWrapper>
          {!showCreateBtn && (
            <SBox sx={{ maxWidth: 120 }}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">View Item</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={viewPageSel}
                  label="View"
                  onChange={handleChange}
                >
                  <MenuItem value={'AR'}>AR</MenuItem>
                  {/* <MenuItem value={'List'}>List</MenuItem> */}
                  <MenuItem value={'Map'}>Map</MenuItem>
                </Select>
              </FormControl>
            </SBox>
          )}
          {addMode ? (
            <>
              {showCreateBtn ? (
                <Stack
                  sx={StyledSX.StackBtm}
                  direction="row"
                  justifyContent="space-around"
                  alignItems="center"
                  spacing={'20px'}
                >
                  <Fab onClick={() => createBtnClicked(0)} sx={{ p: 0 }}>
                    <Avatar src="/images/GOOD_300.png" sx={categoryStyle} />
                  </Fab>
                  <Fab onClick={() => createBtnClicked(1)} sx={{ p: 0 }}>
                    <Avatar src="/images/BAD_300.png" sx={categoryStyle} />
                  </Fab>
                  <Fab onClick={() => createBtnClicked(2)} sx={{ p: 0 }}>
                    <Avatar src="/images/POSSIBLE_300.png" sx={categoryStyle} />
                  </Fab>
                  <Fab onClick={() => addBldgCancelBtnClicked()} sx={{ p: 0 }}>
                    <Avatar
                      sx={{
                        ...categoryStyle,
                        bgcolor: '#e63b43',
                        borderColor: '#f0f4c2',
                        color: '#fff'
                      }}
                    >
                      ✕
                    </Avatar>
                  </Fab>
                </Stack>
              ) : (
                <Stack
                  sx={StyledSX.StackBtm}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={'20px'}
                >
                  {showSelectTaggingMode ? (
                    <>
                      <Button
                        color="secondary"
                        variant="contained"
                        sx={BLeft}
                        onClick={() => {
                          selectTaggingBtnClicked(0)
                        }}
                      >
                        AR起動
                      </Button>
                      <Button
                        color="secondary"
                        variant="contained"
                        sx={BLeft}
                        onClick={() => {
                          selectTaggingBtnClicked(1)
                        }}
                      >
                        タグ付け
                      </Button>
                    </>
                  ) : (
                    <Box sx={{ width: '20px' }}></Box>
                  )}
                  <Fab
                    onClick={() => addBldgCancelBtnClicked()}
                    sx={{ p: 0 }}
                    size="small"
                  >
                    <Avatar sx={cancelAvatarStyle}>✕</Avatar>
                  </Fab>
                </Stack>
              )}
            </>
          ) : (
            <>
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
                  size="small"
                  aria-label="search"
                  onClick={filterBtnClicked}
                >
                  <SearchIcon />
                </Fab>
                {viewPage === 'AR' && (
                  // <Fab
                  //   color={lodMode ? 'error' : 'info'}
                  //   size="small"
                  //   onClick={lodBtnClicked}
                  //   sx={
                  //     lodMode
                  //       ? { bgcolor: '#e63b43', color: '#ffffff' }
                  //       : { bgcolor: '#ffffff', color: '#e63b43' }
                  //   }
                  // >
                  <Fab
                    color={addMode ? 'error' : 'info'}
                    size="small"
                    onClick={
                      addMode ? addBldgCancelBtnClicked : addBldgBtnClicked
                    }
                    sx={
                      addMode
                        ? { bgcolor: '#e63b43', color: '#ffffff' }
                        : {
                            border: 6,
                            borderColor: '#f0f4c2',
                            bgcolor: '#ffffff',
                            color: '#e63b43'
                          }
                    }
                  >
                    {/* <ApartmentIcon /> */}
                    {addMode ? (
                      <Avatar sx={cancelAvatarStyle}>✕</Avatar>
                    ) : (
                      <PinDropIcon />
                    )}
                  </Fab>
                )}
                {viewPage === 'Map' && (
                  <Fab
                    color="error"
                    size="small"
                    aria-label="add"
                    onClick={addBldgBtnClicked}
                    sx={{
                      border: 6,
                      borderColor: '#f0f4c2',
                      bgcolor: '#ffffff',
                      color: '#e63b43'
                    }}
                  >
                    <PinDropIcon />
                  </Fab>
                )}
              </Stack>
            </>
          )}
          {viewPage === 'AR' && (
            <Stack
              sx={stackTopStyle}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={'20px'}
            >
              <>
                <Button
                  id="fov-button"
                  size="small"
                  variant="contained"
                  color="info"
                  onClick={handleClickFovBtn}
                  aria-controls={menuOpen ? 'fov-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={menuOpen ? true : undefined}
                  endIcon={<KeyboardArrowDownIcon />}
                >
                  {'FOV:　' + cameraOffset.fov}
                </Button>
                <Menu
                  id="fov-menu"
                  open={menuOpen}
                  onClose={() => {
                    setAnchorEl(null)
                  }}
                  MenuListProps={{
                    'aria-labelledby': 'fov-button',
                    role: 'listbox'
                  }}
                  anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'left'
                  }}
                >
                  {phones.map((phone, index) => {
                    return (
                      <MenuItem
                        key={phone.name}
                        onClick={(event) => handleMenuItemClick(event, index)}
                      >
                        {phone.name}
                      </MenuItem>
                    )
                  })}
                </Menu>
                <Box sx={{ width: '10px' }}></Box>
              </>
            </Stack>
          )}
        </StyledUI.SCWrapper>
      ) : (
        <StyledUI.SCWrapper>
          <StyledUI.SVWrapper>
            {viewPage === 'Tag' && (
              <TagDetail
                tag={selectedTag!}
                comment={true}
                description={true}
                cellcallback={tagDetailCallback}
              />
            )}
            {viewPage === 'Create' && (
              <TagCreate
                target={selectedTarget!}
                offset={selectedOffset!}
                category={selectedCategory}
                callback={tagCreateCallback}
              />
            )}
            {viewPage === 'Edit' && (
              <TagEdit tag={selectedTag!} callback={tagEditCallback} />
            )}
          </StyledUI.SVWrapper>
        </StyledUI.SCWrapper>
      )}
      <Dialog
        open={openDialog}
        sx={{ p: 0, width: '100%' }}
        onClose={dialogOnClose}
      >
        <ViewFilter
          category={filters.category}
          hashTags={filters.hashTags}
          own={filters.own}
          group={filters.group}
          callback={filterViewCallback}
        />
      </Dialog>
    </>
  )
}

export default MainPage
