import * as Notifications from 'expo-notifications'

import React, { useEffect, useState } from 'react'
import { StatusBar, View } from 'react-native'
import {
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions'

import Config from './config'
import Constants from 'expo-constants'
import { WebView } from 'react-native-webview'

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('')

  const sendPushNotification = async () => {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: 'Original Title',
      body: 'And here is the body!',
      data: { data: 'goes here' },
      _displayInForeground: true,
    }

    const response = await fetch(Config.pushApiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })
  }

  useEffect(() => {
    async function init() {
      let finalStatus: 'unavailable' | 'denied' | 'blocked' | 'granted'

      const { status: existingStatus } = await checkNotifications()

      finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await requestNotifications([
          'alert',
          'sound',
          'badge',
        ])

        finalStatus = status
      }

      if (finalStatus === 'granted') {
        const { data: token } = await Notifications.getExpoPushTokenAsync({
          experienceId: Config.experienceId,
        })

        setExpoPushToken(token)
      }
    }

    init()
  }, [])

  return (
    <View
      style={{
        display: 'flex',
        height: '100%',
        paddingTop: Constants.statusBarHeight,
        backgroundColor: '#000',
      }}
    >
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <WebView
        source={{
          uri: 'https://eodiro.com',
        }}
        decelerationRate="normal"
        onNavigationStateChange={(e) => {
          console.log(e.url)
        }}
      />
    </View>
  )
}
