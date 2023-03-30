import { atom } from 'recoil'

import { getUserData, downloadProfileImageFromStorage } from '@/Firebase/apis'
import { auth } from '@/Firebase/init'
import { Photo } from '@/utils/TagUtils'

export const UserDataAtom = atom({
  key: 'userData',
  default: {
    displayName: '',
    group: '',
    profile: null as string | null,
    uid: ''
  }
})

export type UserData = {
  displayName: string
  profile: string | null
  group: string
  uid: string
}

export const refreshUserData = async () => {
  const uid = auth.currentUser?.uid ?? null
  if (uid) {
    try {
      const userData = await getUserData(uid)
      return {
        displayName: userData.displayName ? userData.displayName : '',
        group: userData.group ? userData.group! : '',
        profile: userData.profile ? userData.profile : null,
        uid: userData.uid
      }
    } catch (e: any) {
      console.error(e)
      console.log('load userDat error:' + uid)
    }
  }
  return {
    displayName: '',
    group: '',
    profile: null,
    uid: ''
  }
}

const initUserData = () => {
  return {
    displayName: '',
    profile: '',
    group: '',
    uid: ''
  }
}

const getAavatorSrc = (aPhoto: any) => {
  if (aPhoto && aPhoto.file) {
    return window.URL.createObjectURL(aPhoto.file)
  }
  return undefined
}

const getProfileImage = async (userData: UserData) => {
  if (userData.profile) {
    try {
      const file = await downloadProfileImageFromStorage(
        userData.uid,
        userData.profile
      )
      return {
        file: file,
        isStorage: true
      } as Photo
    } catch (e) {
      console.error(e)
      console.log('profile donload err:' + userData.profile)
    }
  }
  return null
}

// TODO: profileとappbarのユーザーの画像をrecoil化

const stringToColor = (string: string) => {
  let hash = 0
  let i

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash)
  }

  let color = '#'

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff
    color += `00${value.toString(16)}`.slice(-2)
  }
  /* eslint-enable no-bitwise */
  // console.log(color)
  // console.log(string)
  return color
}

const stringAvatar = (name: string, size: number) => {
  return {
    sx: {
      bgcolor: stringToColor(name),
      width: size,
      height: size
    },
    children: `${name.split(' ')[0][0]}`
  }
}

export const UserUtils = {
  getAavatorSrc,
  getProfileImage,
  stringAvatar,
  initUserData
}
