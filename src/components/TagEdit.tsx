import CancelIcon from '@mui/icons-material/Cancel'
import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

import React, { FC, useEffect, useState } from 'react'

import { deleteTag, downloadImageFromStorage, updateTag } from '@/Firebase/apis'
import HashTagField from '@/components/HashTagField'
import ImagePicker from '@/components/ImagePicker'
import { StyledUI } from '@/components/interface/CommonChips'
import { TagEditProps } from '@/components/interface/props'

import { Photo, TagCategory, Tag } from '@/utils/TagUtils'

const OKBtn = {
  m: 0,
  width: '50%',
  border: 6,
  borderRadius: 4,
  borderColor: '#f0f4c2',
  fontSize: 18,
  fontWeight: 'bold'
}

const DeleteBtn = {
  width: '30%',
  border: 6,
  borderRadius: 4,
  borderColor: '#f0f4c2',
  fontSize: 18,
  fontWeight: 'bold'
}

const TagEdit: FC<TagEditProps> = ({ ...props }) => {
  const [editTag, setEditTag] = useState<any>({})
  const [photos, setPhotos] = useState<Array<Photo>>([])

  const [formHashTag, setFormHashTag] = useState<Array<string>>([])
  const [formCategory, setFormCategory] = useState<string>('')
  const [formLabel, setFormLabel] = useState<string>('')
  const [formDescription, setFormDescription] = useState<string>('')
  const [dialog, setDialog] = useState<boolean>(false)
  const [alertDialog, setAlertDialog] = useState<boolean>(false)
  const [errMode, setErrMode] = useState({ flag: false, message: '' })

  useEffect(() => {
    if (props.tag) {
      setDefaultTagValue()
    }
  }, [props.tag])

  useEffect(() => {
    if (editTag.photo) {
      downloadImages()
    }
  }, [editTag])

  const setDefaultTagValue = () => {
    const eTag: Tag = props.tag
    setFormCategory(eTag.category)
    setFormHashTag(eTag.hashtag)
    setFormLabel(eTag.label)
    setFormDescription(eTag.description)
    setEditTag(eTag)
  }

  const downloadImages = async () => {
    if (editTag.photo) {
      const results = await Promise.all(
        editTag.photo.map(async (filename: any) => {
          const file = await downloadImageFromStorage(editTag.tagID, filename)
          return {
            file: file,
            isStorage: true
          } as Photo
        })
      )
      setPhotos(results)
    }
  }

  const submitBtnPressed = async (e: any) => {
    console.log(e)
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
    const info = {
      label: formLabel,
      category: formCategory,
      hashtag: formHashTag,
      description: formDescription
    }
    setDialog(true)
    try {
      if (await updateTag(editTag, info, photos)) {
        setDialog(false)
        if (props.callback) {
          props.callback({
            type: 'update'
          })
        }
      } else {
        setDialog(false)
        const m = {
          flag: true,
          message: 'エラーが発生しました'
        }
        setErrMode(m)
      }
    } catch (e: any) {
      console.log(e)
      const m = {
        flag: true,
        message: 'エラーが発生しました, ' + e.message
      }
      setErrMode(m)
      setDialog(false)
    }
  }

  const deleteBtnPressed = async (e: any) => {
    setAlertDialog(true)
  }

  const alertDialogAction = async (type: string) => {
    setAlertDialog(false)
    if (type === 'YES') {
      setDialog(true)
      try {
        if (await deleteTag(editTag)) {
          if (props.callback) {
            props.callback({
              type: 'delete'
            })
          }
        } else {
          const m = {
            flag: true,
            message: 'エラーが発生しました'
          }
          setErrMode(m)
        }
      } catch (e: any) {
        console.log(e)
        const m = {
          flag: true,
          message: 'エラーが発生しました, ' + e.message
        }
        setErrMode(m)
      }
      setDialog(false)
    }
  }

  const formChange = (type: string, value: any) => {
    if (type === 'label') {
      setFormLabel(value as string)
    } else if (type === 'category') {
      setFormCategory(value as string)
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
          <StyledUI.STitle>タグの編集</StyledUI.STitle>
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
            placeholder="タグのタイトル"
            value={formLabel}
            onChange={(e) => {
              formChange('label', e.target.value)
            }}
          ></TextField>
          <TextField
            sx={{ mb: '24px' }}
            fullWidth
            required
            label="詳細"
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
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={'20px'}
          >
            <Button
              color="secondary"
              variant="contained"
              sx={OKBtn}
              onClick={submitBtnPressed}
            >
              保存
            </Button>
            <Button
              color="error"
              variant="contained"
              sx={DeleteBtn}
              onClick={deleteBtnPressed}
            >
              削除
            </Button>
          </Stack>
        </Box>
      </Box>
      <Backdrop open={dialog} sx={{ p: '12px' }}>
        <CircularProgress color="success" />
      </Backdrop>

      <Dialog open={alertDialog} sx={{ p: '12px' }}>
        <DialogTitle>タグの削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            本当にタグを削除してよろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            onClick={() => {
              alertDialogAction('NO')
            }}
          >
            NO
          </Button>
          <Button
            onClick={() => {
              alertDialogAction('YES')
            }}
          >
            YES
          </Button>
        </DialogActions>
      </Dialog>
    </StyledUI.ScBox>
  )
}

export default TagEdit
