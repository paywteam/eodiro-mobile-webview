import * as Notifications from 'expo-notifications'

import { ActivityIndicator, Alert, View } from 'react-native'
import { useEffect, useState } from 'react'

import Config from '../../config'
import Constants from 'expo-constants'
import DeviceInfo from 'react-native-device-info'
import { MessageData } from '../types'
import React from 'react'
import { RootStackParamList } from '../../App'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import WebView from 'react-native-webview'
import { oneAPIClient } from '@payw/eodiro-one-api'
import { useDarkMode } from 'react-native-dark-mode'

type WebViewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EodiroWebView'
>

type WebViewScreenRouteProp = RouteProp<RootStackParamList, 'EodiroWebView'>

type WebViewScreenProps = {
  navigation: WebViewScreenNavigationProp
  route: WebViewScreenRouteProp
}

const EodiroWebViewScreen: React.FC<WebViewScreenProps> = ({
  navigation,
  route,
}) => {
  const isDarkMode = useDarkMode()

  let webView: WebView
  const { url } = route.params
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPushed, setIsPushed] = useState(false)

  const [isNavScrolled, setIsNavScrolled] = useState(false)

  useEffect(() => {
    function focusHandler() {
      setIsPushed(false)
    }

    navigation.addListener('focus', focusHandler)

    return () => {
      navigation.removeListener('focus', focusHandler)
    }
  }, [])

  return (
    <>
      <View
        style={{
          height: Constants.statusBarHeight,
          backgroundColor:
            isDarkMode && isNavScrolled
              ? '#1f1f1f'
              : isDarkMode && !isNavScrolled
              ? '#000'
              : isNavScrolled
              ? '#fff'
              : '#f0f2f3',
        }}
      />
      <WebView
        ref={(wv) => (webView = wv as WebView)}
        source={{
          uri: url,
        }}
        decelerationRate="normal"
        style={{
          opacity: isLoaded ? 1 : 0,
          marginTop: -1,
        }}
        onMessage={async ({ nativeEvent }) => {
          let data: MessageData
          try {
            data = JSON.parse(nativeEvent.data)
          } catch (error) {
            return
          }

          const { key, authProps, apiHost } = data

          if (key === 'auth') {
            if (authProps?.isSigned) {
              const deviceId = DeviceInfo.getUniqueId()

              let pushToken = ''

              if (Constants.isDevice) {
                const { data } = await Notifications.getExpoPushTokenAsync({
                  experienceId: Config.experienceId,
                })

                pushToken = data
              }

              if (!pushToken) {
                Alert.alert('에러', '푸시 알림 토큰을 가져올 수 없습니다.')
                return
              }

              const result = await oneAPIClient(apiHost, {
                action: 'addDevice',
                data: {
                  userId: authProps.userId,
                  deviceId,
                  pushToken,
                },
              })

              if (result.err) {
                Alert.alert('기기 등록에 문제가 발생했습니다.')
              }
            }
          } else if (key === 'goBack') {
            if (navigation.canGoBack()) {
              navigation.goBack()
            }
          } else if (key === 'fontsReady') {
            setTimeout(() => {
              setIsLoaded(true)
            }, 100)
          } else if (key === 'navScroll') {
            const value = data.value
            setIsNavScrolled(value)
          }
        }}
        // On click a link
        onNavigationStateChange={(e) => {
          if (!webView) return

          if (isPushed) {
            webView.stopLoading()
            return
          }

          if (isLoaded) {
            webView.stopLoading()

            navigation.push('EodiroWebView', {
              url: e.url,
            })

            setIsPushed(true)
          }
        }}
      />

      {!isLoaded && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator />
        </View>
      )}
    </>
  )
}

export default EodiroWebViewScreen
