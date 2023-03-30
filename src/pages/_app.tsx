import { ThemeProvider } from '@mui/material/styles'
import type { AppProps } from 'next/app'
import Router from 'next/router'
import NextNprogress from 'nextjs-progressbar'
import React, { useState, useEffect, FC } from 'react'
import { RecoilRoot } from 'recoil'
import Splash from '@/components/Splash'
import { useAuth, useUser } from '@/components/functional/Authenticator'
import { postUser } from '@/components/functional/user'
import theme from '@/style/mui'
import '@/Firebase/init'
import '@/style/reset.css'
import 'src/ar/ar.css'

type Props = {
  children: JSX.Element
}

interface AppInitProps {
  Component: AppProps['Component']
  pageProps: AppProps['pageProps']
}

const Auth = ({ children }: Props): JSX.Element => {
  return useAuth() ? <p>Loading...</p> : children
}

// useUser内で使っているuseRecoilValueは<RecoilRoot>の子コンポーネントで呼び出さないとエラーになる。
// →マウント後に処理を行うコンポーネントを作っている
/**
 * @param {AppInitProps} props
 * @return {JSX.Element}
 */
export const AppInit: FC<AppInitProps> = ({ Component, pageProps }) => {
  console.log('Path: ' + Router.pathname)
  const user = useUser()
  if (user) {
    // TODO:
    postUser(user)
    if (Router.pathname === '/') {
      // ログインできているのにサインインページにいる場合
      Router.push('/view')
      return null
    } else if (Router.pathname === '/registration') {
      // ログインできているのにレジストレーションページにいる場合
      // ユーザー情報登録時は遷移されたら困るのでページ内で繊維してもらう
      return <Component {...pageProps} />
    } else {
      // ログインできている場合
      return <Component {...pageProps} />
    }
  } else {
    if (Router.pathname === '/') {
      // ログインできていないけどサインインページにいる場合
      return <Component {...pageProps} />
    } else if (Router.pathname === '/registration') {
      // ログインできていないけどレジストレーションページにいる場合
      return <Component {...pageProps} />
    } else {
      // ログインできていないのに他のページにいる場合
      Router.push('/')
      return null
    }
  }
}

/**
 * @param {AppProps} props
 * @return {JSX.Element}
 */
function PlateauYokohamaApp({ Component, pageProps }: AppProps) {
  const [isShow, setIsShow] = useState(true)
  useEffect(() => {
    // console.log('Hoge ' + Router.pathname)
    setTimeout(() => {
      setIsShow(false)
    }, 1500)
  }, [])

  return (
    <React.Fragment>
      <ThemeProvider theme={theme}>
        <RecoilRoot>
          {isShow && <Splash>スプラッシュ画面</Splash>}
          <NextNprogress color="#29D" showOnShallow={true} />
          <Auth>
            <AppInit Component={Component} pageProps={pageProps} />
          </Auth>
        </RecoilRoot>
      </ThemeProvider>
    </React.Fragment>
  )
}
export default PlateauYokohamaApp
