import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

const STitle = styled('h1')`
  width: 100%;
  padding: 4px 0 12px 0;
  font-size: 18px;
  font-weight: bold;
  color: #369;
`

const OKBtn = {
  my: 1,
  mx: '10%',
  width: '80%',
  border: 6,
  borderRadius: 4,
  borderColor: '#f0f4c2',
  fontSize: 18,
  fontWeight: 'bold'
}

const ScBox = styled(Box)`
  width: 100%;
  height: 100%;
  padding: 60px 0;
  overflow: scroll;
  background: #ffffff;
`

const SCWrapper = styled(Box)`
  position: fixed;
  height: 100%;
  width: 100%;
  margin: 0;
`

const SVWrapper = styled(Box)`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  z-index: 1;
`

const StackBtm = {
  position: 'absolute',
  bottom: '4px',
  zIndex: 100,
  width: '100%',
  p: '20px'
}

export const StyledUI = {
  STitle,
  ScBox,
  SCWrapper,
  SVWrapper
}

export const StyledSX = {
  OKBtn,
  StackBtm
}
