import CancelIcon from '@mui/icons-material/Cancel'
import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'

import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'
import React, { FC, useState, useEffect } from 'react'
import { useRecoilValue } from 'recoil'

import { createTag } from '@/Firebase/apis'
import HashTagField from '@/components/HashTagField'
import ImagePicker from '@/components/ImagePicker'
import { StyledUI, StyledSX } from '@/components/interface/CommonChips'
import { TagCreateProps } from '@/components/interface/props'

import { Photo, TagCategory } from '@/utils/TagUtils'
import { UserDataAtom } from '@/utils/UserUtils'

const containerStyle = {
  width: '100%',
  height: '100%'
}

const mapOptions = {
  fullscreenControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  zoomControl: false,
  gestureHandling: 'none'
}

const TagCreate: FC<TagCreateProps> = ({ ...props }) => {
  const [photos, setPhotos] = useState<Array<Photo>>([])
  const [formComment, setFormComment] = useState<string>('')
  const [formHashTag, setFormHashTag] = useState<Array<string>>([])
  const [formDescription, setFormDescription] = useState<string>('')
  const [formCategory, setFormCategory] = useState<string>('')
  const [formLabel, setFormLabel] = useState<string>('')
  const [dialog, setDialog] = useState<boolean>(false)
  const [errMode, setErrMode] = useState({ flag: false, message: '' })
  const userData = useRecoilValue(UserDataAtom)

  const [mapCoords, setMapCoords] = useState<any>({
    lat: 35.546726768142385,
    lng: 139.5738634957431
  })

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!
  })

  useEffect(() => {
    setFormCategory(props.category)
  }, [props.category])

  useEffect(() => {
    if (props.target) {
      setMapCoords({
        lat: props.target.center.latitude,
        lng: props.target.center.longitude
      })
    }
  }, [props.target])

  const submitBtnPressed = async (data: any) => {
    console.log(data)
    if (formLabel === '') {
      const m = {
        flag: true,
        message: 'タグのラベル（タイトル）は必須です'
      }
      setErrMode(m)
      return
    }
    if (formDescription === '') {
      const m = {
        flag: true,
        message: 'タグの説明を記入してください'
      }
      setErrMode(m)
      return
    }
    if (formCategory === '') {
      const m = {
        flag: true,
        message: 'カテゴリを選んでください'
      }
      setErrMode(m)
      return
    }
    setDialog(true)
    const info: any = {
      label: formLabel,
      category: formCategory,
      hashtag: formHashTag,
      like: [],
      description: formDescription,
      group: userData.group,
      offset: props.offset,
      comment: formComment
    }
    try {
      const result: any = await createTag(props.target, info, photos)
      console.log(result)
      if (result) {
        setDialog(false)
        if (props.callback) {
          props.callback({
            type: 'created'
          })
        }
      }
    } catch (e: any) {
      console.log(e)
      const m = {
        flag: true,
        message: e.message
      }
      setErrMode(m)
      setDialog(false)
    }
  }

  const formChange = (type: string, value: any) => {
    if (type === 'label') {
      setFormLabel(value as string)
    } else if (type === 'category') {
      setFormCategory(value as string)
    } else if (type === 'comment') {
      setFormComment(value as string)
    } else if (type === 'description') {
      setFormDescription(value as string)
    }
  }

  const hashTagCallback = (values: any) => {
    setFormHashTag(values)
  }

  const imagePickerCallback = (file: any) => {
    console.log(file)
    if (file) {
      const aPhoto: Photo = {
        file: file,
        isStorage: false
      }
      const nowP = photos.concat([aPhoto])
      setPhotos(nowP)
    }
  }

  const imageCancelBtnPressed = (event: any, filename: string) => {
    const newList = photos.filter((aphoto) => {
      return aphoto.file.name !== filename
    })
    setPhotos(newList)
  }

  return (
    <StyledUI.ScBox>
      <Box>
        <Box
          component="form"
          sx={{ p: '12px', background: '#ededed', height: '100%' }}
        >
          <StyledUI.STitle>タグの新規作成</StyledUI.STitle>
          <TextField
            required
            sx={{ mb: '24px' }}
            fullWidth
            select
            value={formCategory}
            variant="standard"
            label="カテゴリ"
            onChange={(e) => formChange('category', e.target.value)}
          >
            {TagCategory.map((catg: string) => {
              return (
                <MenuItem key={catg} value={catg}>
                  {catg}
                </MenuItem>
              )
            })}
          </TextField>
          <TextField
            required
            sx={{ mb: '24px' }}
            fullWidth
            variant="standard"
            label="タイトル"
            placeholder="タグタイトル"
            value={formLabel}
            onChange={(e) => {
              formChange('label', e.target.value)
            }}
          ></TextField>
          <TextField
            sx={{ mb: '24px' }}
            fullWidth
            required
            label="説明"
            placeholder="タグの説明"
            onChange={(e) => {
              formChange('description', e.target.value)
            }}
            value={formDescription}
            rows={4}
            multiline
          ></TextField>
          <HashTagField
            hashtags={formHashTag}
            callback={hashTagCallback}
          ></HashTagField>
          <ImageList cols={4} rowHeight={72}>
            {photos.map((aPhoto) => {
              const src = window.URL.createObjectURL(aPhoto.file)
              return (
                <ImageListItem
                  key={aPhoto.file.name}
                  sx={{ alignItems: 'center' }}
                >
                  <div>
                    <img
                      src={src}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px'
                      }}
                    />
                    <IconButton
                      sx={{
                        color: 'white',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        m: 0,
                        p: 0
                      }}
                      onClick={(event) =>
                        imageCancelBtnPressed(event, aPhoto.file.name)
                      }
                    >
                      <CancelIcon color="error" />
                    </IconButton>
                  </div>
                </ImageListItem>
              )
            })}
            <ImagePicker mode="album" callback={imagePickerCallback} />
          </ImageList>
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
          {/* <TextField
            sx={{ mb: '24px', bgcolor: 'white' }}
            fullWidth
            label="コメント"
            onChange={(e) => {
              formChange('comment', e.target.value)
            }}
            value={formComment}
            rows={4}
            multiline
          ></TextField> */}

          {errMode.flag && (
            <Box sx={{ m: '20px' }} color="error">
              <p
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#e63b43',
                  textAlign: 'center'
                }}
              >
                {errMode.message}
              </p>
            </Box>
          )}
          <Button
            color="secondary"
            variant="contained"
            sx={StyledSX.OKBtn}
            onClick={submitBtnPressed}
          >
            登録
          </Button>
        </Box>
      </Box>
      <Backdrop open={dialog} sx={{ p: '12px' }}>
        <CircularProgress color="success" />
      </Backdrop>
    </StyledUI.ScBox>
  )
}

export default TagCreate
