import * as Notifications from 'expo-notifications'

import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { WebView, WebViewNavigation } from 'react-native-webview'
import {
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions'

import Config from './config'
import Constants from 'expo-constants'
import { getBottomSpace } from 'react-native-iphone-x-helper'
import { oneAPIClient } from '@payw/eodiro-one-api'
import { useDarkMode } from 'react-native-dark-mode'

type NotificationsStatus = 'unavailable' | 'denied' | 'blocked' | 'granted'

export default function App() {
  let webView: WebView

  const [navState, setNavState] = useState<WebViewNavigation>()

  const [isNotificationsGranted, setIsNotificationsGranted] = useState(false)

  const isDarkMode = useDarkMode()

  useEffect(() => {
    console.log(`isDarkMode: ${isDarkMode}`)
    if (isDarkMode) {
      StatusBar.setBarStyle('dark-content', true)
    } else {
      StatusBar.setBarStyle('light-content', true)
    }
  }, [isDarkMode])

  useEffect(() => {
    async function init() {
      // Programmatically set the status bar style to white text
      if (isDarkMode) {
        StatusBar.setBarStyle('dark-content')
      } else {
        StatusBar.setBarStyle('light-content')
      }

      let finalStatus: NotificationsStatus

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
        setIsNotificationsGranted(true)
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
        backgroundColor: isDarkMode ? '#000' : '#fff',
      }}
    >
      <WebView
        ref={(wv) => (webView = wv as WebView)}
        source={{
          // uri: 'http://localhost:3020',
          uri: 'https://eodiro.com',
        }}
        decelerationRate="normal"
        onLoad={() => {}}
        onMessage={async ({ nativeEvent }) => {
          let data: {
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
          }
          try {
            data = JSON.parse(nativeEvent.data)
          } catch (error) {
            return
          }

          console.log(data)

          const { key, authProps, apiHost } = data

          if (key === 'auth') {
            if (authProps?.isSigned) {
              const deviceId = Constants.deviceId
              if (!deviceId) {
                Alert.alert('Error: Could not get Device ID')
                return
              }

              let pushToken = ''

              if (Constants.isDevice) {
                pushToken = ((await Notifications.getExpoPushTokenAsync({
                  experienceId: Config.experienceId,
                })) as unknown) as string
              }

              if (!pushToken) {
                Alert.alert('에러', '푸시 알림 토큰을 가져올 수 없습니다.')
                return
              }

              const result = await oneAPIClient(apiHost, {
                action: 'addDevice',
                data: {
                  userId: 1,
                  deviceId,
                  pushToken,
                },
              })

              if (result.err) {
                Alert.alert('기기 등록에 문제가 발생했습니다.')
              }
            }
          }
        }}
        onNavigationStateChange={(e) => {
          setNavState(e)
        }}
      />

      <View
        style={{
          borderTopColor: isDarkMode ? '#222' : '#f0f0f3',
          borderTopWidth: 1,
          backgroundColor: isDarkMode ? '#000' : '#fff',
          bottom: 0,
          paddingBottom: getBottomSpace(),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <TouchableOpacity
          style={style.arrowContainer}
          onPress={() => {
            webView.goBack()
          }}
        >
          <Text
            style={{
              ...style.arrow,
              opacity: navState?.canGoBack ? 1 : 0.3,
              color: isDarkMode ? '#fff' : '#000',
            }}
          >
            &lsaquo;
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={style.arrowContainer}
          onPress={() => {
            webView.goForward()
          }}
        >
          <Text
            style={{
              ...style.arrow,
              opacity: navState?.canGoForward ? 1 : 0.3,
              color: isDarkMode ? '#fff' : '#000',
            }}
          >
            &rsaquo;
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const arrowSize = 35

const style = StyleSheet.create({
  arrowContainer: {
    width: 60,
    height: 45,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: arrowSize,
    lineHeight: arrowSize,
  },
})
