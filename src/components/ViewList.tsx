import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import React, { FC, useEffect, useState } from 'react'

import { doLike } from '@/Firebase/apis'
import TagCell from '@/components/TagCell'
import { GeoProps } from '@/components/interface/props'
import { Tag } from '@/utils/TagUtils'

const MBox = styled(Box)`
  width: 100%;
  height: 100%;
  padding: 80px 0;
  overflow: scroll;
  background: #ededed;
`

const CBox = styled(Box)`
  width: 90%;
  padding: 0;
  margin: 16px auto;
  z-index: 1;
  background-color: white;
  -webkit-border-radius: 12px;
  -moz-border-radius: 12px;
  border-radius: 12px;
  border: none;
`

const ViewList: FC<GeoProps> = ({ ...props }) => {
  const [markerTags, setMarkerTags] = useState<Array<Tag>>([])

  useEffect(() => {
    updateTags(props.tags)
  }, [props.tags])

  const updateTags = (tags: Tag[]) => {
    setMarkerTags(tags)
  }

  const cellCallback = async (event: any) => {
    console.log(event)
    if (event.tag) {
      if (event.type === 'like') {
        // like api
        if (await doLike(event.tag)) {
          console.log('liked!')
        }
      } else if (event.type === 'comment') {
        // favorite api
        if (props.itemcallback) {
          props.itemcallback(event)
        }
      } else if (event.type === 'edit') {
        // edit a tag
        if (props.itemcallback) {
          props.itemcallback(event)
        }
      }
    }
  }

  return (
    <>
      <MBox>
        {markerTags.map((tag) => {
          return (
            <CBox key={tag.tagID}>
              <TagCell
                tag={tag}
                comment={true}
                description={true}
                cellcallback={cellCallback}
              />
            </CBox>
          )
        })}
      </MBox>
    </>
  )
}
export default ViewList
