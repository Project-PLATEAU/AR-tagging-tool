import Avatar from '@mui/material/Avatar'
import Backdrop from '@mui/material/Backdrop'
// import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'

import React, { useRef, useState, useEffect } from 'react'
import { useRecoilState } from 'recoil'

import { updateUserData } from '@/Firebase/apis'
import Header from '@/components/Header'
import { useUser } from '@/components/functional/Authenticator'

import { Photo } from '@/utils/TagUtils'
import { UserDataAtom, UserUtils, refreshUserData } from '@/utils/UserUtils'

const Profile: NextPage = () => {
  const router = useRouter()
  const user = useUser()
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [userData, setUserData] = useRecoilState(UserDataAtom)

  const [formDisplayName, setFormDisplayName] = useState<string>('')
  const [formGroup, setFormGroup] = useState<string>('')
  const [progress, setProgress] = useState(false)
  const [errMode, setErrMode] = useState({ flag: false, message: '' })

  useEffect(() => {
    loadUserData()
  }, [userData])

  const backBtnPressed = () => {
    router.back()
  }

  const inputRef = useRef(null)

  const btnPressed = () => {
    if (inputRef) {
      const iRef: any = inputRef.current!
      iRef.click()
    }
  }

  const loadUserData = async () => {
    if (photo === null) {
      const p = await UserUtils.getProfileImage(userData)
      setPhoto(p)
    }
    setFormGroup(userData.group)
    setFormDisplayName(userData.displayName)
  }

  const inputChange = (event: any) => {
    const file = event.target.files[0]
    const aPhoto: Photo = {
      file: file,
      isStorage: false
    }
    setPhoto(aPhoto)
  }

  const submitBtnPressed = async () => {
    if (!progress) {
      setProgress(true)
      try {
        if (await updateUserData(formDisplayName, formGroup, photo)) {
          setErrMode({
            flag: false,
            message: ''
          })
          refreshUserData().then((value) => {
            console.log(value)
            setUserData(value)
          })
        } else {
          setErrMode({
            flag: true,
            message: '不明なエラーが発生しました。後ほどやり直してください。'
          })
        }
      } catch (e: any) {
        console.log(e)
        setErrMode({
          flag: true,
          message: e.message
        })
      }
      setProgress(false)
    }
  }

  const formChange = (type: string, value: any) => {
    if (type === 'name') {
      setFormDisplayName(value as string)
    } else if (type === 'group') {
      setFormGroup(value as string)
    }
  }

  return (
    <>
      <Header showBackBtn={true} backBtnCallback={backBtnPressed}>
        ユーザー情報編集
      </Header>
      <Container
        sx={{
          display: 'flex',
          justifyContent: 'center',
          p: 1,
          my: 0,
          pt: '100px',
          mx: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 1
        }}
      >
        <IconButton
          onClick={btnPressed}
          sx={{
            my: 5,
            width: 80,
            height: 80
          }}
        >
          {photo ? (
            <Avatar
              alt={userData.displayName !== '' ? userData.displayName : 'user'}
              src={UserUtils.getAavatorSrc(photo)}
              sx={{ width: 80, height: 80 }}
            />
          ) : (
            <Avatar
              {...UserUtils.stringAvatar(
                userData.displayName !== '' ? userData.displayName : 'u',
                80
              )}
            />
          )}
        </IconButton>
        <input
          type="file"
          accept="image/png, image/jpeg"
          hidden
          ref={inputRef}
          onChange={inputChange}
        />
      </Container>
      <Box
        sx={{
          width: 300,
          maxWidth: '80%',
          mx: 'auto'
        }}
      >
        <TextField
          fullWidth
          sx={{ mb: '20px' }}
          label="E-mail"
          defaultValue={user?.email}
          InputProps={{ readOnly: true }}
          variant="standard"
        />
        <TextField
          fullWidth
          sx={{ my: '20px' }}
          label="表示名"
          defaultValue={userData.displayName}
          value={formDisplayName}
          onChange={(e) => formChange('name', e.target.value)}
        />
        <TextField
          sx={{ my: '20px' }}
          fullWidth
          label="グループ"
          defaultValue={userData.group}
          value={formGroup}
          onChange={(e) => formChange('group', e.target.value)}
        />
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
          sx={{
            mt: 3,
            mb: 1,
            width: '100%',
            border: 6,
            borderRadius: 4,
            borderColor: '#f0f4c2',
            fontSize: 18,
            fontWeight: 'bold'
          }}
          onClick={submitBtnPressed}
        >
          更新
        </Button>
      </Box>
      <Backdrop open={progress} sx={{ p: '12px' }}>
        <CircularProgress color="success" />
      </Backdrop>
    </>
  )
}

export default Profile
