import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import React, { FC } from 'react'

interface Props {
  children: React.ReactNode
}

const SWrapper = styled('div')`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background-color: #00c1c0;
`

const STypography = styled(Typography)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60%;
  min-width: 300px;
  height: 80px;
  margin: 0 auto;
  text-align: center;
  z-index: 2;
`

const Splash: FC<Props> = ({ children, ...props }) => {
  return (
    <SWrapper>
      <STypography
        variant="h3"
        noWrap
        sx={{
          mr: 2,
          display: { xs: 'flex', md: 'none' },
          flexGrow: 1,
          fontFamily: 'Oswald',
          fontWeight: 500,
          letterSpacing: '.3rem',
          color: 'white',
          textDecoration: 'none'
        }}
      >
        AIRNOTATION
      </STypography>
    </SWrapper>
  )
}
export default Splash
