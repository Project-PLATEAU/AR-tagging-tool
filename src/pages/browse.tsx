// import ApartmentIcon from '@mui/icons-material/Apartment'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import SearchIcon from '@mui/icons-material/Search'

import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import Fab from '@mui/material/Fab'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'

import type { NextPage } from 'next'
import { useState, useEffect } from 'react'

import { useRecoilState } from 'recoil'

import { getTagsFromGeoLocation, getUserID } from '@/Firebase/apis'

import ViewMap from '@/components/BrowseMap'
import Header from '@/components/Header'
import TagDetail from '@/components/TagDetail'
import TagEdit from '@/components/TagEdit'
import {
  ViewFilter,
  ViewFilterChips,
  filteringTags
} from '@/components/ViewFilter'
import ViewList from '@/components/ViewList'
import { StyledUI, StyledSX } from '@/components/interface/CommonChips'

import { ApiQuene } from '@/utils/ApiQuene'
import { MapUtils, GeolocationCoordinates } from '@/utils/GpsUtils'
import { Tag, TagAtom } from '@/utils/TagUtils'

const SBox = styled(Box)`
  margin: 1rem;
  position: absolute;
  top: 58px;
  z-index: 2;
  width: 100%;
`

const BrowsePage: NextPage = () => {
  const [backBtnVisible, setBackBtnVisible] = useState(false)

  const [viewPage, setViewPage] = useState('Map')
  const [beforePage, setBeforePage] = useState('Map')
  const [viewPageSel, setViewPageSel] = useState('Map')
  const [viewMode, setViewMode] = useState(0)
  const [headerTitle, setHeaderTitle] = useState('View')

  const [watchID, setWatchID] = useState(-1)
  const [coords, setCoords] = useState<GeolocationCoordinates>(
    MapUtils.SAMPLE_COODS(MapUtils.LOCATION.TAKANAWA4)
  )
  const [gpsPrepared, setGpsPrepated] = useState<boolean>(false)

  const [tags, setTags] = useState<Array<Tag>>([])
  const [filteredTags, setFilteredTags] = useState<Array<Tag>>([])

  const [addMode, setAddMode] = useState<boolean>(false)
  const [selectedTag, setSelectedTag] = useRecoilState(TagAtom)

  const [pointCoords, setPointCoords] = useState<GeolocationCoordinates>(
    // MapUtils.NEW_COORDS()
    MapUtils.SAMPLE_COODS(MapUtils.LOCATION.TAKANAWA4)
  )

  const [filters, setFilters] = useState({
    category: 'None',
    group: '',
    hashTags: [] as string[],
    own: false
  })

  // menu
  const [openDialog, setOpenDialog] = useState<boolean>(false)

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
    if (coords) {
      if (!gpsPrepared) {
        setPointCoords(coords)
        addQue(coords)
        setGpsPrepated(true)
      }
    }
  }, [coords])

  useEffect(() => {
    if (viewPage === 'Map') {
      setHeaderTitle('BROWSING(MAP)')
      setViewMode(0)
      setBackBtnVisible(false)
      setViewPageSel('Map')
    }
    if (viewPage === 'List') {
      setHeaderTitle('BROWSING(LIST)')
      setViewMode(0)
      setBackBtnVisible(false)
      setViewPageSel('List')
      clearParams()
      setAddMode(false)
    }
    if (viewPage === 'Tag') {
      setHeaderTitle('詳細情報')
      setViewMode(1)
      setBackBtnVisible(true)
    }
    if (viewPage === 'Edit') {
      setHeaderTitle('編集')
      setViewMode(1)
      setBackBtnVisible(true)
    }
  }, [viewPage])

  const handleChange = (event: SelectChangeEvent) => {
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
    }
  }

  const clearGPS = () => {
    console.log('clearGPS ' + watchID)
    window.navigator.geolocation.clearWatch(watchID)
    setWatchID(-1)
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
      const newTags = await getTagsFromGeoLocation(newCoods, 50)
      setTags(newTags)
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

  const filterChipsCallback = (newFilters: any) => {
    // console.log('filterChipsCallback')
    // console.log(newFilters)
    setFilters(newFilters)
    refreshFilteredTags(tags, newFilters)
  }

  const clearParams = () => {
    // setSelectedBuilding(null)
    // setSelectedTarget(null)
    setSelectedTag(null)
  }

  // AR, Map画面からのコールバック（マップ、リストと共通仕様でも構わない）
  const viewCallback = async (event: any) => {
    console.log(event)
    if (event.type === 'clear') {
      clearParams()
      return
    }
    // console.log(event)
    if (event.type === 'position') {
      addQue(event.coords)
      setAddMode(false)
      setPointCoords(event.coords)
      return
    }

    if (event.tag) {
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

  const addBldgBtnClicked = () => {
    setAddMode(true)
  }

  const filterBtnClicked = () => {
    setOpenDialog(true)
  }

  // tagEdit
  const tagEditCallback = (event: any) => {
    if (event.type) {
      if (event.type === 'cancel') {
        setViewPage(beforePage)
        setAddMode(false)
        setSelectedTag(null)
        console.log(pointCoords)
      } else if (event.type === 'update') {
        setViewPage(beforePage)
        setAddMode(false)
        setSelectedTag(null)
        addQue(pointCoords)
        // refreshBuildings(coords)
      } else if (event.type === 'delete') {
        setViewPage(beforePage)
        setAddMode(false)
        setSelectedTag(null)
        addQue(pointCoords)
        // refreshBuildings(coords)
      }
    }
  }

  // tagDetal
  const tagDetailCallback = (event: any) => {
    console.log(event)
    if (event.type) {
      if (event.type === 'refresh') {
        addQue(pointCoords)
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
            {viewPage === 'List' && (
              <ViewList
                coords={coords}
                buildings={[]}
                frns={[]}
                vegs={[]}
                tags={filteredTags}
                orientation={false}
                itemcallback={viewCallback}
              />
            )}
            {viewPage === 'Map' && (
              <ViewMap
                coords={coords}
                buildings={[]}
                frns={[]}
                vegs={[]}
                tags={filteredTags}
                orientation={false}
                itemcallback={viewCallback}
                addMode={addMode}
              />
            )}
          </StyledUI.SVWrapper>
          <SBox sx={{ maxWidth: 120 }}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">View Item</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={viewPageSel}
                label="Browse"
                onChange={handleChange}
              >
                <MenuItem value={'Map'}>Map</MenuItem>
                <MenuItem value={'List'}>List</MenuItem>
              </Select>
            </FormControl>
          </SBox>
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
                <GpsFixedIcon />
              </Fab>
            )}
          </Stack>
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

export default BrowsePage
