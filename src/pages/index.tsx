// signinページ
import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// Google, facebook, Twitterを有効にするにはfirebase側の設定が必要
import { signInWithEmailAndPassword } from 'firebase/auth'
import type { NextPage } from 'next'
import React, { useState } from 'react'

import { auth } from '@/Firebase/init'
// import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'
import Header from '@/components/Header'

// const uiConfig: auth.Config = {
//   signInFlow: 'popup',
//   signInOptions: [
//     EmailAuthProvider.PROVIDER_ID,
//     FacebookAuthProvider.PROVIDER_ID,
//     GoogleAuthProvider.PROVIDER_ID,
//     TwitterAuthProvider.PROVIDER_ID
//   ],
//   signInSuccessUrl: '/view'
// }

const SignIn: NextPage = () => {
  const [formEmail, setFormEmail] = useState<string>('')
  const [formPassword, setFormPassword] = useState<string>('')
  const [progress, setProgress] = useState(false)
  const [errMode, setErrMode] = useState({ flag: false, message: '' })

  const submitBtnPressed = async () => {
    if (!progress) {
      setProgress(true)
      try {
        await signInWithEmailAndPassword(auth, formEmail, formPassword)
        setErrMode({
          flag: false,
          message: ''
        })
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
    if (type === 'email') {
      setFormEmail(value as string)
    } else if (type === 'password') {
      setFormPassword(value as string)
    }
  }

  return (
    <>
      <Header>SignIn</Header>
      {/* <div style={{ margin: '1rem', padding: '60px 0' }}>
        <StyledFirebaseAuth firebaseAuth={getAuth()} uiConfig={uiConfig} />
      </div> */}
      <Box
        sx={{
          width: 300,
          maxWidth: '80%',
          mt: '80px',
          mx: 'auto'
        }}
      >
        <Box
          sx={{
            pt: '20px',
            my: '60px',
            mx: 'auto',
            textAlign: 'center'
          }}
        >
          <Typography
            variant="h1"
            noWrap
            component="a"
            href=""
            align="center"
            color="primary"
            sx={{
              textAlign: 'center',
              fontFamily: 'Oswald',
              fontWeight: 700,
              fontSize: '3rem',
              letterSpacing: '.7rem',
              textDecoration: 'none'
            }}
          >
            LOGIN
          </Typography>
        </Box>
        <TextField
          fullWidth
          type="email"
          label="Email"
          value={formEmail}
          onChange={(e) => formChange('email', e.target.value)}
          helperText="Email入力"
        />
        <TextField
          sx={{ my: '20px' }}
          fullWidth
          type="password"
          label="password"
          value={formPassword}
          onChange={(e) => formChange('password', e.target.value)}
          helperText="パスワード入力"
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
          color="info"
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
          LOGIN
        </Button>
        <Box
          sx={{
            ml: 'auto',
            mr: '20px',
            textAlign: 'right'
          }}
        >
          <Typography
            variant="subtitle1"
            noWrap
            component="a"
            href="/registration"
            sx={{
              fontFamily: 'Oswald',
              fontWeight: 100,
              fontSize: '0.7rem',
              letterSpacing: '.1rem',
              color: 'black',
              textDecoration: 'none'
            }}
          >
            ユーザー新規作成
          </Typography>
        </Box>
      </Box>
      <Backdrop open={progress} sx={{ p: '12px' }}>
        <CircularProgress color="success" />
      </Backdrop>
    </>
  )
}

export default SignIn
