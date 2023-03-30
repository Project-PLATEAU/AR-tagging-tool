import { User } from 'firebase/auth'
import { atom } from 'recoil'

export const userLoginState = atom<User | null>({
  key: 'userState',
  default: null,
  dangerouslyAllowMutability: true
})
