import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'

import React, { FC } from 'react'

import { CellProps } from '@/components/interface/props'

const STitle = styled('h1')`
  width: 100%;
  padding: 2px 0;
  fontsize: 18px;
  fontweight: bold;
  color: #069;
`

const BuildingCell: FC<CellProps> = ({ ...props }) => {
  const createBtnClicked = (e: any) => {
    if (props.cellcallback) {
      const callbackobj = {
        type: 'create',
        building: props.building!
      }
      props.cellcallback(callbackobj)
    }
  }
  return (
    <Box>
      <STitle>{props.building!.bldgID}</STitle>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        onClick={createBtnClicked}
      >
        CREATE A TAG
      </Button>
    </Box>
  )
}
export default BuildingCell
