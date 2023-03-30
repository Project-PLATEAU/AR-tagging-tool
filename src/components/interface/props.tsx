import React from 'react'
import { GeolocationCoordinates } from '@/utils/GpsUtils'
import { Building, Tag, Comment, Frn, Veg } from '@/utils/TagUtils'
import { UserData } from '@/utils/UserUtils'

export interface GeoProps {
  coords: GeolocationCoordinates
  buildings: Array<Building>
  frns: Array<Frn>
  vegs: Array<Veg>
  tags: Array<Tag>
  orientation: boolean
  itemcallback?: (event: any) => void
  addMode?: boolean
  lod1Mode?: boolean
  fov?: number
}

export interface CellProps {
  tag?: Tag
  building?: Building
  cellcallback?: (event: any) => void
}

export interface TagCellProps {
  tag: Tag
  comment: boolean
  description: boolean
  cellcallback?: (event: any) => void
}

export interface TagCreateProps {
  target: any
  offset: any
  category: string
  callback?: (event: any) => void
}

export interface TagEditProps {
  tag: Tag
  callback?: (event: any) => void
}

export interface ImagePickerProps {
  mode: string | 'album'
  callback?: (event: any) => void
}

export interface UserDateProps {
  date: Date
  user: UserData
}

export interface CommentProps {
  comment: Comment
}

export interface HashTagProps {
  hashtags: Array<string>
  callback?: (event: any) => void
}

export interface FilterProps {
  category: string
  hashTags: Array<string>
  own: boolean
  group: string
  callback?: (event: any) => void
  // children: React.ReactNode
}

export interface HeaderProps {
  children: React.ReactNode
  showBackBtn?: boolean
  backBtnCallback?: (event: any) => void
}
