import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'

import React, { FC, useEffect, useState } from 'react'
import { HashTagProps } from '@/components/interface/props'

const HashTagField: FC<HashTagProps> = ({ ...props }) => {
  const [hashes, setHashes] = useState<Array<string>>([])

  useEffect(() => {
    if (props.hashtags) {
      setup()
    }
  }, [props.hashtags])

  const setup = () => {
    // console.log(props.hashtags)
    setHashes(props.hashtags)
  }

  const onChanged = (e: any, value: any) => {
    if (props.callback) {
      // console.log(value)
      // setHashes(value)
      props.callback(value)
    }
  }

  return (
    <Autocomplete
      multiple
      id="tags-filled"
      options={hashes}
      value={hashes}
      freeSolo
      getOptionLabel={(option) => option}
      isOptionEqualToValue={(option, value) => option === value}
      onChange={onChanged}
      renderTags={(value, getTagProps) => {
        return value.map((option, index) => {
          return (
            <Chip
              variant="outlined"
              label={option}
              {...getTagProps({ index })}
              key={index}
            />
          )
        })
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="filled"
          label="ハッシュタグ"
          placeholder="決定ボタンでハッシュを確定させてください"
        />
      )}
    />
  )
}
export default HashTagField
