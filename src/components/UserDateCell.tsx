import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import React, { FC, useEffect, useState } from 'react'
import { UserDateProps } from '@/components/interface/props'
import { Photo } from '@/utils/TagUtils'
import { UserUtils } from '@/utils/UserUtils'

const pStyle = {
  height: '18px',
  lineHeight: '18px',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#966'
}

const UserDateCell: FC<UserDateProps> = ({ ...props }) => {
  const [photo, setPhoto] = useState<Photo | null>()
  const [dateStr, setDateStr] = useState<string>('')

  useEffect(() => {
    loadImage()
  }, [props.user])

  useEffect(() => {
    if (props.date) {
      const str =
        '' +
        props.date.getFullYear() +
        '/' +
        (props.date.getMonth() + 1) +
        '/' +
        props.date.getDate()
      setDateStr(str)
    }
  }, [props.date])

  const loadImage = async () => {
    if (photo === null) {
      const p = await UserUtils.getProfileImage(props.user)
      setPhoto(p)
    }
  }

  return (
    <Box sx={{ display: 'flex', width: '120px', height: '36px', ma: '6px' }}>
      {/* <img src={props.imgurl} style={imgStyle} /> */}
      <Avatar
        alt={props.user.displayName ? props.user.displayName : 'user'}
        src={UserUtils.getAavatorSrc(photo)}
        sx={{ m: 'auto', width: '24px', height: '24px', borderRadius: '12px' }}
      />
      <Box sx={{ display: 'block', width: '72px', my: 'auto' }}>
        <p style={pStyle}>{dateStr}</p>
        <p style={pStyle}>{props.user.displayName}</p>
      </Box>
    </Box>
  )
}
export default UserDateCell
