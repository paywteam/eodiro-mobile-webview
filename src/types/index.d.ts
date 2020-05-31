export type MessageData = {
  apiHost: string
  key: string
  authProps?: {
    userId: number
    isSigned: boolean
    tokens: {
      accessToken?: string
      refreshToken?: string
    }
  }
  value?: any
}

export type NotificationsStatus =
  | 'unavailable'
  | 'denied'
  | 'blocked'
  | 'granted'
