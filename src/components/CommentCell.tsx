import Box from '@mui/material/Box'
import React, { FC, useEffect, useState } from 'react'
import { getUserData } from '@/Firebase/apis'
import UserDateCell from '@/components/UserDateCell'
import { CommentProps } from '@/components/interface/props'
import { UserUtils, UserData } from '@/utils/UserUtils'

const CommentCell: FC<CommentProps> = ({ ...props }) => {
  const [userData, setUserData] = useState<UserData>(UserUtils.initUserData())

  useEffect(() => {
    if (props.comment) {
      loadUserData()
    }
  }, [])

  const loadUserData = async () => {
    const uid = props.comment.createdBy
    const data = await getUserData(uid)
    setUserData(data)
  }

  return (
    <Box>
      <p>{props.comment.comment}</p>
      <UserDateCell date={props.comment.modified} user={userData} />
    </Box>
  )
}
export default CommentCell
