// import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
// import Button from '@mui/material/Button'
// import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Pagination from '@mui/material/Pagination'
import Stack from '@mui/material/Stack'
// import TextField from '@mui/material/TextField'
import { styled } from '@mui/material/styles'

import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'
import React, { FC, useEffect, useState } from 'react'

import {
  downloadImageFromStorage,
  doLike,
  getCommentsFromFirestore,
  getUserData
  //  , postComment
} from '@/Firebase/apis'
// import CommentCell from '@/components/CommentCell'
import { /* StyledSX, */ StyledUI } from '@/components/interface/CommonChips'
import { TagCellProps } from '@/components/interface/props'

import { MapUtils } from '@/utils/GpsUtils'
import { Tag, Photo, TagUtils } from '@/utils/TagUtils'
import { UserUtils, UserData } from '@/utils/UserUtils'

const SIconLine = styled('div')`
  display: in-line;
  width: 100%;
  height: 36px;
  padding: 2px 12px;
  z-index: 1;
`
const SIconCount = styled('span')`
  margin: 2px 4px;
  font-size: 16px;
  font-weight: normal;
  color: #069;
`

const pStyle = {
  height: '24px',
  lineHeight: '24px',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#7c7c7c'
}

const mapOptions = {
  fullscreenControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  zoomControl: false,
  gestureHandling: 'none'
}

const containerStyle = {
  width: '100%',
  height: '100%'
}

const TagDetail: FC<TagCellProps> = ({ ...props }) => {
  const [viewTag, setViewTag] = useState<any>({})
  const [photos, setPhotos] = useState<Array<Photo>>([])
  // const [comment, setComment] = useState<string>('')
  const [userData, setUserData] = useState<UserData>(UserUtils.initUserData())
  const [imageIndex, setImageIndex] = useState<number>(0)
  const [profilePhoto, setProfilePhoto] = useState<Photo | null>()

  const [mapCoords, setMapCoords] = useState<any>({
    lat: 35.546726768142385,
    lng: 139.5738634957431
  })

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!
  })

  useEffect(() => {
    if (props.tag) {
      const tag: Tag = props.tag!
      const pos = MapUtils.transformToGMapCoordsWithOffset(
        tag.center,
        tag.offset
      )
      setMapCoords(pos)
      reloadTag(tag)
    }
  }, [props.tag])

  const reloadTag = async (tag: Tag) => {
    const results = await getCommentsFromFirestore(tag.tagID, 1000)
    const rTag = TagUtils.copyTag(tag)
    rTag.comments = results
    rTag.commentCounts = rTag.comments.length
    setViewTag(rTag)

    const uid = rTag.createdBy
    const data = await getUserData(uid)
    setUserData(data)
    if (profilePhoto === null) {
      const p = await UserUtils.getProfileImage(data)
      setProfilePhoto(p)
    }

    const results2 = await Promise.all(
      tag.photo.map(async (filename: any) => {
        const file = await downloadImageFromStorage(tag.tagID, filename)
        return {
          file: file,
          isStorage: true
        } as Photo
      })
    )
    setPhotos(results2)
  }

  const getHashTagString = () => {
    if (viewTag.hashtag) {
      return viewTag.hashtag.join(' ')
    }
    return 'No Hash Tags'
  }

  const favoriteClicked = async (e: any) => {
    const rTag = TagUtils.copyTag(viewTag)
    if (await doLike(rTag)) {
      if (props.cellcallback) {
        props.cellcallback({
          type: 'refresh'
        })
      }
      setViewTag(rTag)
    }
  }

  // const commentChanged = (e: any) => {
  //   setComment(e.target.value)
  // }

  // const postBtnClicked = async (e: any) => {
  //   console.log(comment)
  //   if (await postComment(viewTag, comment)) {
  //     if (props.cellcallback) {
  //       props.cellcallback({
  //         type: 'refresh'
  //       })
  //     }
  //     reloadTag(viewTag)
  //   }
  // }

  // Pagination

  const pageChange = (event: any, page: number) => {
    let newIndex = page - 1
    if (newIndex > photos.length) {
      newIndex = photos.length - 1
    }
    if (newIndex < 0) {
      newIndex = 0
    }
    setImageIndex(newIndex)
  }

  return (
    <StyledUI.ScBox>
      <Box>
        <Box
          sx={{
            display: 'flex',
            p: '12px',
            mb: '20px',
            width: '100%',
            height: '48px',
            bgcolor: '#ededed'
          }}
        >
          <Avatar
            alt={userData.displayName ? userData.displayName : 'user'}
            src={UserUtils.getAavatorSrc(profilePhoto)}
            sx={{
              width: '24px',
              height: '24px',
              borderRadius: '12px',
              mr: '12px'
            }}
          />
          <p style={pStyle}>{userData.displayName}</p>
        </Box>
        {photos.length > 0 && (
          <Stack sx={{ mb: '20px', alignItems: 'center' }} spacing={'20px'}>
            <Box sx={{ mx: 'auto', height: '240px', textAlign: 'center' }}>
              {photos.map((photo: Photo, index: number) => {
                const style: any = { maxHeight: '240px', margin: '0 auto' }
                if (index !== imageIndex) {
                  style.display = 'none'
                }
                return (
                  <img
                    src={window.URL.createObjectURL(photo.file)}
                    style={style}
                    key={index}
                  />
                )
              })}
            </Box>
            <Pagination
              sx={{ mx: 'auto' }}
              color="secondary"
              size="small"
              page={imageIndex + 1}
              count={photos.length}
              onChange={pageChange}
            />
          </Stack>
        )}
        <SIconLine>
          <IconButton style={{ padding: '4px' }} onClick={favoriteClicked}>
            <FavoriteBorderOutlinedIcon color="inherit" />
          </IconButton>
          <SIconCount>{viewTag.like ? viewTag.like.length : 0}</SIconCount>
        </SIconLine>
        <Box sx={{ display: 'flex', p: '20px', height: '100%' }}>
          <img
            src={TagUtils.getTagCategoryImage(viewTag.category)}
            width="60px"
            height="60px"
          />
          <Box sx={{ mx: '20px', height: '60px' }}>
            <p
              style={{
                fontSize: '18px',
                color: '#483a67',
                fontWeight: 'bold'
              }}
            >
              {viewTag.label}
            </p>
            <p
              style={{
                fontSize: '14px',
                color: '#7c7c7c'
              }}
            >
              {getHashTagString()}
            </p>
          </Box>
        </Box>
        <p
          style={{
            padding: '20px',
            fontSize: '16px',
            color: '#333333'
          }}
        >
          {viewTag.description}
        </p>
        <Box
          sx={{
            m: '20px',
            height: '180px',
            borderRadius: '20px',
            overflow: 'hidden'
          }}
        >
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCoords}
              zoom={16}
              options={mapOptions}
            >
              <Marker position={mapCoords} key="mypos2" />
            </GoogleMap>
          )}
        </Box>
        {/* {props.comment && (
          <Box sx={{ p: '20px' }}>
            <Box sx={{ display: 'flex', verticalAlign: 'middle', mb: '8px' }}>
              <ChatBubbleOutlineIcon
                style={{ color: '#483a67' }}
                fontSize="large"
              />
              <p
                style={{
                  margin: 'auto 0',
                  paddingLeft: '12px',
                  fontSize: '18px',
                  color: '#483a67',
                  fontWeight: 'bold'
                }}
              >
                COMMENT
              </p>
            </Box>
            <TextField
              sx={{ mb: '24px' }}
              fullWidth
              label="コメント"
              onChange={commentChanged}
              rows={4}
              multiline
            ></TextField>
            <Button
              color="secondary"
              variant="contained"
              sx={StyledSX.OKBtn}
              onClick={postBtnClicked}
              disabled={comment === ''}
            >
              投稿
            </Button>
          </Box>
        )} */}
        {/* <Stack sx={{ p: '20px' }} spacing={'12px'} divider={<Divider />}>
          {viewTag.comments &&
            viewTag.comments.map((aComment: any) => {
              return <CommentCell comment={aComment} key={aComment.commentId} />
            })}
        </Stack> */}
      </Box>
    </StyledUI.ScBox>
  )
}

export default TagDetail
