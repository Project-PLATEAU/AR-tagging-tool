import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

import React, { FC, useEffect, useState } from 'react'

import HashTagField from '@/components/HashTagField'
import { StyledUI, StyledSX } from '@/components/interface/CommonChips'
import { FilterProps } from '@/components/interface/props'
import { TagCategory, Tag } from '@/utils/TagUtils'

const selectableCategory = ['None', ...TagCategory]

const stackFilterStyle = {
  width: '100%',
  px: '20px',
  py: '0',
  position: 'absolute',
  bottom: '80px',
  zIndex: 100
}

export const ViewFilter: FC<FilterProps> = ({ ...props }) => {
  const [hashTags, setHashTags] = useState<Array<string>>([])
  const [category, setCategory] = useState<string>(selectableCategory[0])
  const [ownFlag, setOwnFlag] = useState<boolean>(false)
  const [group, setGroup] = useState<string>('')

  useEffect(() => {
    setDefaultFilterValue()
  }, [])

  const setDefaultFilterValue = () => {
    setCategory(props.category)
    setHashTags(props.hashTags)
    setOwnFlag(props.own)
    setGroup(props.group)
  }

  const submitBtnPressed = async (e: any) => {
    if (props.callback) {
      props.callback({
        type: 'update',
        category: category,
        hashTags: hashTags,
        own: ownFlag,
        group: group
      })
    }
  }

  const categorySelected = (e: any) => {
    setCategory(e.target.value)
  }
  const hashTagCallback = (values: any) => {
    setHashTags(values)
  }

  const groupChanged = (value: string) => {
    setGroup(value)
  }

  const ownFlagChanged = (event: any) => {
    console.log(event.target)
    setOwnFlag(event.target.checked)
  }

  return (
    <Box
      component="form"
      sx={{
        my: 'auto',
        px: '24px',
        py: '12px',
        background: '#ededed',
        height: '100%'
      }}
    >
      <StyledUI.STitle>絞り込み</StyledUI.STitle>
      <TextField
        required
        sx={{ mb: '24px' }}
        fullWidth
        select
        value={category}
        variant="standard"
        label="カテゴリ"
        onChange={categorySelected}
      >
        {selectableCategory.map((catg: string) => {
          return (
            <MenuItem key={catg} value={catg}>
              {catg}
            </MenuItem>
          )
        })}
      </TextField>
      <TextField
        sx={{ mb: '24px' }}
        fullWidth
        variant="standard"
        label="グループ"
        placeholder="グループ名入力"
        value={group}
        onChange={(e) => {
          groupChanged(e.target.value)
        }}
      />
      <HashTagField hashtags={props.hashTags} callback={hashTagCallback} />
      <FormControlLabel
        sx={{ my: '8px' }}
        control={
          <Checkbox
            checked={ownFlag}
            onChange={ownFlagChanged}
            color="primary"
          />
        }
        label="自分で登録したタグのみ表示"
      />
      <Button
        color="secondary"
        variant="contained"
        sx={StyledSX.OKBtn}
        onClick={submitBtnPressed}
      >
        絞り込む
      </Button>
    </Box>
  )
}

// export default ViewFilter

export const ViewFilterChips: FC<FilterProps> = ({ ...props }) => {
  const chipDeletePressed = (event: any) => {
    console.log('chipDeletePressed')
    console.log(event)
    const f = {
      category: props.category,
      hashTags: props.hashTags,
      group: props.group,
      own: props.own
    }
    if (event.type === 'category') {
      f.category = 'None'
    } else if (event.type === 'own') {
      f.own = false
    } else if (event.type === 'hashtag') {
      const newHashes = props.hashTags.filter((hash: string) => {
        return hash !== event.name
      })
      f.hashTags = newHashes
    } else if (event.type === 'group') {
      f.group = ''
    }
    if (props.callback) {
      props.callback(f)
    }
  }

  return (
    <Stack
      sx={stackFilterStyle}
      direction="row"
      justifyContent="fix-start"
      alignItems="center"
      spacing={'20px'}
    >
      {props.own && (
        <Chip
          label="Own TAG"
          color="info"
          onDelete={() => {
            chipDeletePressed({ type: 'own' })
          }}
        />
      )}
      {props.category !== 'None' && (
        <Chip
          label={props.category}
          color="secondary"
          onDelete={() => {
            chipDeletePressed({ type: 'category' })
          }}
        />
      )}
      {props.group !== '' && (
        <Chip
          label={props.group}
          color="primary"
          onDelete={() => {
            chipDeletePressed({ type: 'group' })
          }}
        />
      )}
      {props.hashTags.map((hash: any) => {
        return (
          <Chip
            key={hash}
            label={hash}
            sx={{ bgcolor: '#ededed' }}
            onDelete={() => {
              chipDeletePressed({ type: 'hashtag', name: hash })
            }}
          />
        )
      })}
    </Stack>
  )
}

export const filteringTags = (
  newTags: Array<Tag>,
  filters: any,
  userID: string | null
) => {
  const filtered = newTags.filter((tag: Tag) => {
    return checkFilter(tag, filters, userID)
  })
  return filtered
}

const checkFilter = (tag: Tag, fs: any, userID: string | null) => {
  if (fs.own) {
    if (!userID) {
      return false
    }
    if (tag.createdBy !== userID) {
      return false
    }
  }
  if (fs.category !== 'None') {
    if (tag.category !== fs.category) {
      return false
    }
  }
  if (fs.group !== '') {
    if (tag.group !== fs.group) {
      return false
    }
  }
  const results = fs.hashTags.filter((fHash: string) => {
    return (
      tag.hashtag.filter((tHash) => {
        return tHash === fHash
      }).length > 0
    )
  })
  if (results.length < fs.hashTags.length) {
    return false
  }
  return true
}
// export default ViewFilterChips
