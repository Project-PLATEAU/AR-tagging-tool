// import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import EditIcon from '@mui/icons-material/Edit'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'

import React, { FC, useEffect, useState } from 'react'

import {
  downloadImageFromStorage,
  isEditableTag,
  getUserData
} from '@/Firebase/apis'
import { TagCellProps } from '@/components/interface/props'
import { TagUtils, Photo } from '@/utils/TagUtils'
import { UserUtils, UserData } from '@/utils/UserUtils'

const SCellWrapper = styled(Box)`
  display: block;
  width: 100%;
  padding: 16px;
  z-index: 1;
  background-color: white;
  -webkit-border-radius: 12px;
  -moz-border-radius: 12px;
  border-radius: 12px;
  border: none;
`

const BoxUpper = styled(Box)`
  display: flex;
  width: 100%;
  height: 100%;
`

const BoxLeft = styled(Box)`
  display: block;
  margin-left: 5%;
  width: 65%;
  height: 100%;
  z-index: 1;
`

const BoxRight = styled(Box)`
  display: grid;
  justify-content: right;
  margin-right: 5%;
  width: 35%;
  height: 100%;
  z-index: 1;
`

const STagTitle = styled('h1')`
  width: 100%;
  padding: 2px 0;
  font-size: 18px;
  font-weight: bold;
  color: #483a67;
`

const SIconLine = styled(Box)`
  display: flex;
  width: 100%;
  height: 36px;
  padding: 2px 0;
`
const SIconCount = styled('span')`
  margin: 2px 4px;
  height: 32px;
  line-height: 32px;
  font-size: 16px;
  font-weight: bold;
  color: #069;
`

const SCommentWrapper = styled(Box)`
  margin: 0 5%;
  height: 100%;
  padding: 0;
`

// const SComment = styled('p')`
//   margin: 2px 0;
//   font-size: 16px;
//   font-weight: normal;
//   color: black;
// `

const SDescription = styled('p')`
  margin: 2px 0;
  font-size: 14px;
  font-weight: bold;
  color: #7c7c7c;
`

const imgStyle2 = {
  margin: 0,
  display: 'in-line',
  width: '32px',
  height: '32px',
  padding: '4px'
}

const pStyle = {
  height: '24px',
  lineHeight: '24px',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#7c7c7c'
}

const TagCell: FC<TagCellProps> = ({ ...props }) => {
  const [tagImage, setTagImage] = useState<any>(null)
  const [userData, setUserData] = useState<UserData>(UserUtils.initUserData())
  const [dateStr, setDateStr] = useState<string>('')
  const [photo, setPhoto] = useState<Photo | null>()

  useEffect(() => {
    if (props.tag) {
      loadImage()
      loadUserData()
      const date = props.tag!.commented
      const str =
        '' +
        date.getFullYear() +
        '/' +
        (date.getMonth() + 1) +
        '/' +
        date.getDate()
      setDateStr(str)
    }
  }, [props.tag])

  const loadUserData = async () => {
    const uid = props.tag.createdBy
    const data = await getUserData(uid)
    setUserData(data)
    if (photo === null) {
      const p = await UserUtils.getProfileImage(data)
      setPhoto(p)
    }
  }

  const loadImage = async () => {
    if (props.tag!.photo.length > 0) {
      const topname = props.tag!.photo[0]
      try {
        const file = await downloadImageFromStorage(props.tag!.tagID, topname)
        if (file) {
          setTagImage(window.URL.createObjectURL(file))
        } else {
          setTagImage(null)
        }
      } catch (e: any) {
        console.error(e)
      }
    }
  }

  const favoriteClicked = (e: any) => {
    if (props.cellcallback) {
      const callbackobj = {
        type: 'like',
        tag: props.tag
      }
      props.cellcallback(callbackobj)
    }
  }

  const commentClicked = (e: any) => {
    if (props.cellcallback) {
      const callbackobj = {
        type: 'comment',
        tag: props.tag
      }
      props.cellcallback(callbackobj)
    }
  }

  const editBtnClicked = (e: any) => {
    if (props.cellcallback) {
      const callbackobj = {
        type: 'edit',
        tag: props.tag
      }
      props.cellcallback(callbackobj)
    }
  }

  return (
    <SCellWrapper>
      <BoxUpper>
        <BoxLeft>
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              height: '24px',
              mb: '2px',
              verticalAlign: 'middle'
            }}
          >
            <Avatar
              alt={userData.displayName ? userData.displayName : 'user'}
              src={UserUtils.getAavatorSrc(photo)}
              sx={{
                width: '24px',
                height: '24px',
                borderRadius: '12px',
                mr: '8px'
              }}
            />
            <p style={pStyle}>{userData.displayName}</p>
            {isEditableTag(props.tag) && (
              <IconButton
                sx={{ mr: 0, ml: 'auto', p: '4px', height: '24px' }}
                onClick={editBtnClicked}
              >
                <EditIcon color="error" />
              </IconButton>
            )}
          </Box>
          <STagTitle onClick={commentClicked}>{props.tag.label}</STagTitle>
          <SIconLine>
            <img
              src={TagUtils.getTagCategoryImage(props.tag.category)}
              style={imgStyle2}
            />
            <IconButton sx={{ p: '4px' }} onClick={favoriteClicked}>
              <FavoriteBorderOutlinedIcon color="inherit" />
            </IconButton>
            <SIconCount>{props.tag.like.length}</SIconCount>
            {/* <IconButton style={{ padding: '4px' }} onClick={commentClicked}>
              <ChatBubbleOutlineIcon color="inherit" />
            </IconButton>
            <SIconCount>{props.tag.commentCounts}</SIconCount> */}
          </SIconLine>
          <p style={pStyle}>{props.tag.group}</p>
        </BoxLeft>
        <BoxRight>
          <p style={pStyle}>{dateStr}</p>
          {tagImage && (
            <img
              src={tagImage}
              style={{ width: '64px', height: '64px', borderRadius: '12px' }}
            />
          )}
        </BoxRight>
      </BoxUpper>

      {props.description && (
        <SCommentWrapper>
          <SDescription>{props.tag.description}</SDescription>
        </SCommentWrapper>
      )}
      {/* {props.comment && (
        <SCommentWrapper>
          {props.tag.comments.length > 0 ? (
            <SComment>{props.tag.comments[0].comment}</SComment>
          ) : (
            <SComment></SComment>
          )}
        </SCommentWrapper>
      )} */}
    </SCellWrapper>
  )
}
export default TagCell
