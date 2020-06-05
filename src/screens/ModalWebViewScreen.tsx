import { ActivityIndicator, StatusBar, View } from 'react-native'
import React, { useEffect, useState } from 'react'

import { AppStatus } from '../modules/app-status'
import { MessageData } from '../types'
import { RootStackParamList } from '../../App'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import WebView from 'react-native-webview'
import { useDarkMode } from 'react-native-dark-mode'

type ModalWebViewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ModalWebView'
>

type ModalWebViewScreenRouteProp = RouteProp<RootStackParamList, 'ModalWebView'>

type ModalWebViewScreenProps = {
  navigation: ModalWebViewScreenNavigationProp
  route: ModalWebViewScreenRouteProp
}

const ModalWebViewScreen: React.FC<ModalWebViewScreenProps> = ({
  navigation,
  route,
}) => {
  const { url } = route.params
  const [isLoaded, setIsLoaded] = useState(false)

  const isDarkMode = useDarkMode()

  useEffect(() => {
    StatusBar.setBarStyle('light-content', true)
    AppStatus.currentStatusBarStyle = 'light-content'
    return () => {
      StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true)
      AppStatus.currentStatusBarStyle = isDarkMode
        ? 'light-content'
        : 'dark-content'
    }
  }, [])

  return (
    <>
      <WebView
        source={{
          uri: url,
        }}
        decelerationRate="normal"
        style={{
          opacity: isLoaded ? 1 : 0,
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
            if (!authProps?.isSigned) return

            navigation.goBack()
          } else if (key === 'goBack') {
            navigation.goBack()
          } else if (key === 'fontsReady') {
            setTimeout(() => {
              setIsLoaded(true)
            }, 100)
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

export default ModalWebViewScreen
