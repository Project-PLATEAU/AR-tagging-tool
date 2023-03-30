import PhotoIcon from '@mui/icons-material/Photo'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
// import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'

import React, { FC, useRef } from 'react'

import { ImagePickerProps } from '@/components/interface/props'

const sxStyle = {
  width: 64,
  height: 64,
  bgcolor: 'white',
  borderRadius: 4
}

const ImagePicker: FC<ImagePickerProps> = ({ ...props }) => {
  const inputRef = useRef(null)

  const btnPressed = () => {
    if (inputRef) {
      const iRef: any = inputRef.current!
      iRef.click()
    }
  }

  const inputChange = (event: any) => {
    const file = event.target.files[0]
    console.log(file)
    if (props.callback) {
      props.callback(file)
    }
  }

  return (
    <IconButton onClick={btnPressed} sx={sxStyle}>
      {props.mode === 'album' ? (
        <>
          <PhotoIcon fontSize="large" color="primary" />
          <input
            type="file"
            accept="image/png, image/jpeg"
            hidden
            ref={inputRef}
            onChange={inputChange}
          />
        </>
      ) : (
        <>
          <PhotoCameraIcon fontSize="large" color="primary" />
          <input
            type="file"
            accept="image/png, image/jpeg"
            hidden
            capture="environment"
            ref={inputRef}
            onChange={inputChange}
          />
        </>
      )}
    </IconButton>
  )
}
export default ImagePicker
