import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Router from 'next/router'
import React, { FC, useState, useEffect } from 'react'
import { useRecoilValue } from 'recoil'
import { logout } from '@/components/functional/Authenticator'
import { HeaderProps } from '@/components/interface/props'
import { Photo } from '@/utils/TagUtils'
import { UserDataAtom, UserUtils } from '@/utils/UserUtils'

const ResponsiveAppBar: FC<HeaderProps> = ({ children, ...props }) => {
  const [settings, setSettings] = useState([] as string[])
  const userData = useRecoilValue(UserDataAtom)
  const [photo, setPhoto] = useState<Photo | null>(null)

  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  )

  useEffect(() => {
    loadUserData()
    checkSettings()
  }, [])

  const loadUserData = async () => {
    if (photo === null) {
      const p = await UserUtils.getProfileImage(userData)
      setPhoto(p)
    }
  }

  const checkSettings = () => {
    const path = Router.pathname
    const newS = []
    if (path !== '/' && path !== '/registration') {
      if (path === '/browse') {
        newS.push('街歩きモード')
      } else {
        newS.push('タグ確認モード')
      }
      if (path !== '/profile') {
        newS.push('ユーザー情報編集')
      }
      newS.push('ログアウト')
    }
    setSettings(newS)
  }

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget)
  }

  const handleCloseUserMenu = (
    event: React.MouseEvent<HTMLElement>,
    setting: string
  ) => {
    if (setting === 'ユーザー情報編集') {
      Router.push('/profile')
    } else if (setting === 'ログアウト') {
      logout().catch((error) => console.error(error))
      Router.push('/')
    } else if (setting === '街歩きモード') {
      Router.push('/')
    } else if (setting === 'タグ確認モード') {
      Router.push('/browse')
    }
    setAnchorElUser(null)
  }

  return (
    <AppBar position="fixed">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {props.showBackBtn && (
            <IconButton
              sx={{ mr: '20px', bgcolor: '#E9F200' }}
              onClick={props.backBtnCallback}
            >
              <ArrowBackIcon color="inherit" />
            </IconButton>
          )}
          <Typography
            variant="h5"
            noWrap
            component="a"
            href=""
            align="center"
            sx={{
              mr: 2,
              display: { xs: 'flex' },
              flexGrow: 1,
              fontFamily: 'Oswald',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'white',
              textDecoration: 'none'
            }}
          >
            {children}
          </Typography>

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                {photo ? (
                  <Avatar
                    alt={
                      userData.displayName !== ''
                        ? userData.displayName
                        : 'user'
                    }
                    src={UserUtils.getAavatorSrc(photo)}
                    sx={{ width: 40, height: 40 }}
                  />
                ) : (
                  <Avatar
                    {...UserUtils.stringAvatar(
                      userData.displayName !== '' ? userData.displayName : 'u',
                      40
                    )}
                  />
                )}
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem
                  key={setting}
                  onClick={(e) => handleCloseUserMenu(e, setting)}
                >
                  <Typography textAlign="center">{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
export default ResponsiveAppBar
