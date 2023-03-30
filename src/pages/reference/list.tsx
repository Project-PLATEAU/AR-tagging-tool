import SearchIcon from '@mui/icons-material/Search'

import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Fab from '@mui/material/Fab'
import Pagination from '@mui/material/Pagination'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'

import type { NextPage } from 'next'
import { useState, useEffect, useRef } from 'react'

import { useRecoilState } from 'recoil'

import { getAllTag, getUserID } from '@/Firebase/apis'

import Header from '@/components/Header'
import TagDetail from '@/components/TagDetail'
import TagDetailCell from '@/components/TagDetailCell'
import TagEdit from '@/components/TagEdit'
import {
  ViewFilter,
  ViewFilterChips,
  filteringTags
} from '@/components/ViewFilter'
import { StyledUI, StyledSX } from '@/components/interface/CommonChips'

import { ApiQuene } from '@/utils/ApiQuene'
import { Tag, TagAtom } from '@/utils/TagUtils'

const CBox = styled(Box)`
  width: 90%;
  padding: 0;
  margin: 16px auto;
  z-index: 1;
  background-color: white;
  -webkit-border-radius: 12px;
  -moz-border-radius: 12px;
  border-radius: 12px;
  border: none;
`
const MBox = styled(Box)`
  width: 100%;
  height: 100%;
  padding: 80px 0;
  overflow: scroll;
  background: #ededed;
`

const arrayChunk = ([...array], size = 1) => {
  return array.reduce(
    (acc, value, index) =>
      index % size ? acc : [...acc, array.slice(index, index + size)],
    []
  )
}

const AllTagPage: NextPage = () => {
  const [viewMode, setViewMode] = useState(0)

  const [tags, setTags] = useState<Array<Tag>>([])
  const [filterMode, setFilterMode] = useState<boolean>(false)
  const [selectedTag, setSelectedTag] = useRecoilState(TagAtom)

  const [indexPage, setIndexPage] = useState(-1)
  const [pageTags, setPageTags] = useState<Array<Tag>>([])
  const [chunkedTags, setChunkedTags] = useState<Array<Array<Tag>>>([[]])

  const [filters, setFilters] = useState({
    category: 'None',
    group: '',
    hashTags: [] as string[],
    own: false
  })

  // menu
  const [openDialog, setOpenDialog] = useState<boolean>(false)

  const [quene, setQuene] = useState<ApiQuene>(new ApiQuene())

  const listRef = useRef()
  // const quene = useRef(new ApiQuene())

  useEffect(() => {
    setQuene(quene)
    addQue()
  }, [])

  useEffect(() => {
    updatePageTags()
  }, [indexPage])

  const updatePageTags = () => {
    console.log(indexPage + ', ' + chunkedTags.length)
    if (indexPage === -1) {
      return
    }
    if (chunkedTags.length > indexPage) {
      setPageTags(chunkedTags[indexPage])
    }
  }

  const addQue = async () => {
    console.log('addQue ' + quene.on)
    quene.setNextJob({ coords: 'all' })
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
    await refreshBuildings()
    quene.finishWorking()
    runQue()
  }

  const refreshBuildings = async () => {
    try {
      const newTags = await getAllTag()
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
    // setFilteredTags(filtered)
    const chunks = arrayChunk(filtered, 10)
    setChunkedTags(chunks)
    setIndexPage(0)
  }

  const filterChipsCallback = (newFilters: any) => {
    setFilters(newFilters)
    refreshFilteredTags(tags, newFilters)
  }

  const clearParams = () => {
    setOpenDialog(false)
    setFilterMode(false)
    setSelectedTag(null)
    setViewMode(0)
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
    clearParams()
  }

  const filterBtnClicked = () => {
    // clearParams()
    setFilterMode(true)
    setOpenDialog(true)
    setSelectedTag(null)
    setViewMode(0)
  }

  // tagEdit
  const tagEditCallback = (event: any) => {
    if (event.type) {
      if (event.type === 'cancel') {
        clearParams()
      } else if (event.type === 'update') {
        clearParams()
        addQue()
      } else if (event.type === 'delete') {
        clearParams()
        addQue()
      }
    }
  }

  // tagDetal
  const tagDetailCallback = (event: any) => {
    console.log(event)
    if (event.type) {
      clearParams()
    }
  }

  const dialogOnClose = () => {
    clearParams()
  }

  const cellCallback = async (event: any) => {
    console.log(event)
    if (event.tag) {
      if (event.type === 'like') {
        // like api
        setSelectedTag(event.tag)
        setViewMode(1)
        setOpenDialog(true)
      } else if (event.type === 'comment') {
        setSelectedTag(event.tag)
        setViewMode(1)
        setOpenDialog(true)
      } else if (event.type === 'edit') {
        // edit a tag
        setSelectedTag(event.tag)
        setViewMode(2)
        setOpenDialog(true)
      }
    }
  }

  const indexPageChange = (event: any, page: number) => {
    let newIndex = page - 1
    if (newIndex > chunkedTags.length) {
      newIndex = chunkedTags.length - 1
    }
    if (newIndex < 0) {
      newIndex = 0
    }
    setIndexPage(newIndex)

    if (listRef && listRef.current) {
      const mapBox: any = listRef.current
      mapBox.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  return (
    <>
      <Header showBackBtn={false}>ALL TAGS</Header>
      <StyledUI.SCWrapper>
        {/* タブ切り替えで各々のViewを表示させる */}
        <StyledUI.SVWrapper>
          <MBox ref={listRef}>
            {pageTags.map((tag: Tag) => {
              return (
                <CBox key={tag.tagID}>
                  <TagDetailCell
                    tag={tag}
                    comment={true}
                    description={true}
                    cellcallback={cellCallback}
                  />
                </CBox>
              )
            })}
          </MBox>
        </StyledUI.SVWrapper>
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
          <Pagination
            sx={{ mx: 'auto' }}
            color="secondary"
            size="small"
            page={indexPage + 1}
            count={chunkedTags.length}
            onChange={indexPageChange}
          />
          <Box sx={{ width: '20px' }}></Box>
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
          {selectedTag && viewMode === 1 && (
            <TagDetail
              tag={selectedTag!}
              comment={false}
              description={true}
              cellcallback={tagDetailCallback}
            />
          )}
          {selectedTag && viewMode === 2 && (
            <TagEdit tag={selectedTag!} callback={tagEditCallback} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AllTagPage
