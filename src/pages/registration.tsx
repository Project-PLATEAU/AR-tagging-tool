import Avatar from '@mui/material/Avatar'
import Backdrop from '@mui/material/Backdrop'
// import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'

import React, { useRef, useState, useEffect } from 'react'
import { useSetRecoilState } from 'recoil'

import { updateUserData } from '@/Firebase/apis'
import { auth } from '@/Firebase/init'
import Header from '@/components/Header'
import { useUser } from '@/components/functional/Authenticator'

import { Photo } from '@/utils/TagUtils'
import {
  /* refreshUserData, */ UserDataAtom,
  UserUtils,
  refreshUserData
} from '@/utils/UserUtils'

const Registration: NextPage = () => {
  const router = useRouter()
  const user = useUser()
  const [photo, setPhoto] = useState<Photo | null>(null)
  const setUserData = useSetRecoilState(UserDataAtom)

  const [formEmail, setFormEmail] = useState<string>('')
  const [formPassword, setFormPassword] = useState<string>('')
  const [formDisplayName, setFormDisplayName] = useState<string>('')
  const [formGroup, setFormGroup] = useState<string>('')
  const [progress, setProgress] = useState(false)
  const [errMode, setErrMode] = useState({ flag: false, message: '' })
  const [disableFlag, setDisableFlag] = useState(true)

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        jumpToView()
      }, 1500)
    }
  }, [])

  const backBtnPressed = () => {
    router.push('/')
  }

  const jumpToView = () => {
    router.push('/view')
  }

  const inputRef = useRef(null)

  const btnPressed = () => {
    if (inputRef) {
      const iRef: any = inputRef.current!
      iRef.click()
    }
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
        await createUserWithEmailAndPassword(auth, formEmail, formPassword)
        if (await updateUserData(formDisplayName, formGroup, photo)) {
          setErrMode({
            flag: false,
            message: ''
          })
          refreshUserData().then((value) => {
            console.log(value)
            setUserData(value)
            router.push('/view')
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
    } else if (type === 'email') {
      setFormEmail(value as string)
    } else if (type === 'password') {
      setFormPassword(value as string)
    }
    validationCheck()
  }

  const validationCheck = () => {
    if (formEmail.split('@').length !== 2 || formEmail.split('.').length < 2) {
      setDisableFlag(true)
      return
    }
    if (formPassword.length < 8) {
      setDisableFlag(true)
      return
    }
    setDisableFlag(false)
  }

  return (
    <>
      <Header showBackBtn={true} backBtnCallback={backBtnPressed}>
        REGISTRATION
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
          <Avatar
            alt={formDisplayName}
            src={UserUtils.getAavatorSrc(photo)}
            sx={{ width: 80, height: 80 }}
          />
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
          type="email"
          label="E-mail"
          value={formEmail}
          onChange={(e) => formChange('email', e.target.value)}
        />
        <TextField
          sx={{ my: '20px' }}
          fullWidth
          type="password"
          label="password"
          value={formPassword}
          onChange={(e) => formChange('password', e.target.value)}
          helperText="８文字以上で設定してください"
        />
        <TextField
          fullWidth
          sx={{ my: '20px' }}
          label="表示名"
          value={formDisplayName}
          onChange={(e) => formChange('name', e.target.value)}
        />
        <TextField
          sx={{ my: '20px' }}
          fullWidth
          label="グループ"
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
          disabled={disableFlag}
        >
          ユーザー作成
        </Button>
      </Box>
      <Backdrop open={progress} sx={{ p: '12px' }}>
        <CircularProgress color="success" />
      </Backdrop>
    </>
  )
}

export default Registration
