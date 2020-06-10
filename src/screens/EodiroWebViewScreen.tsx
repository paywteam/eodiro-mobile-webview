import * as Notifications from 'expo-notifications'

import { ActivityIndicator, Alert, View } from 'react-native'
import { useEffect, useRef, useState } from 'react'

import { AppStatus } from '../modules/app-status'
import Config from '../../config'
import Constants from 'expo-constants'
import DeviceInfo from 'react-native-device-info'
import { MessageData } from '../types'
import React from 'react'
import { RootStackParamList } from '../../App'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import URL from 'url-parse'
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

  // let webView: WebView
  const webView = useRef<WebView>()
  const { url } = route.params
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPushed, setIsPushed] = useState(false)

  const [isNavScrolled, setIsNavScrolled] = useState(false)

  useEffect(() => {
    function focusHandler() {
      setIsPushed(false)

      webView.current?.injectJavaScript(`location.reload()`)
    }

    navigation.addListener('focus', focusHandler)
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
        ref={(wv) => {
          webView.current = wv as WebView
        }}
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
            if (new URL(url).pathname !== '/') return
            if (!authProps?.isSigned) return

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
                deviceId,
                pushToken,
                accessToken: authProps.tokens.accessToken as string,
              },
            })

            if (result.err) {
              console.log(result.err)
              Alert.alert(
                '기기 등록에 문제가 발생했습니다.',
                `ERR: ${result.err}`
              )
            }
          } else if (key === 'goBack') {
            // if (navigation.canGoBack()) {
            //   navigation.goBack()
            // }
            webView.current?.goBack()
          } else if (key === 'fontsReady') {
            setTimeout(() => {
              setIsLoaded(true)
            }, 100)
          } else if (key === 'navScroll') {
            const value = data.value
            setIsNavScrolled(value)
          }
        }}
        onLoadEnd={(e) => {
          // if (e.nativeEvent.loading) {
          //   setIsLoaded(true)
          // }
        }}
        onLoadStart={(e) => {
          // console.log('loading')
        }}
        // On click a link
        // onShouldStartLoadWithRequest={(e) => {
        //   if (isPushed) {
        //     return false
        //   }

        //   if (isLoaded) {
        //     if (url === e.url) {
        //       return true
        //     }

        //     const currentUrl = new URL(url)
        //     const nextUrl = new URL(e.url)

        //     if (currentUrl.hostname !== nextUrl.hostname) {
        //       console.log('open general modal window')
        //       navigation.push('GeneralWebView', {
        //         url: e.url,
        //       })
        //     } else if (nextUrl.pathname === '/signin') {
        //       navigation.push('ModalWebView', {
        //         url: e.url,
        //       })
        //     } else {
        //       navigation.push('EodiroWebView', {
        //         url: e.url,
        //       })
        //     }

        //     setIsPushed(true)
        //     return false
        //   }

        //   return true
        // }}
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
          <ActivityIndicator size="large" />
        </View>
      )}
    </>
  )
}

export default EodiroWebViewScreen
