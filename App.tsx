import 'react-native-gesture-handler'

import * as Notifications from 'expo-notifications'

import { Keyboard, Linking, StatusBar, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import {
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions'

import { AppStatus } from './src/modules/app-status'
import EodiroWebViewScreen from './src/screens/EodiroWebViewScreen'
import ModalWebViewScreen from './src/screens/ModalWebViewScreen'
import { NavigationContainer } from '@react-navigation/native'
import { NotificationsStatus } from './src/types'
import { WebViewNavigation } from 'react-native-webview'
import { createNativeStackNavigator } from 'react-native-screens/native-stack'
import { enableScreens } from 'react-native-screens'
import { useDarkMode } from 'react-native-dark-mode'

enableScreens()

function setNavBarTextColor(isDarkMode: boolean) {
  if (isDarkMode) {
    StatusBar.setBarStyle('light-content', true)
    AppStatus.currentStatusBarStyle = 'light-content'
  } else {
    StatusBar.setBarStyle('dark-content', true)
    AppStatus.currentStatusBarStyle = 'dark-content'
  }
}

export type RootStackParamList = {
  EodiroWebView: { url: string }
  ModalWebView: { url: string }
}

// const RootStack = createStackNavigator<RootStackParamList>()
const RootStack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  const [navState, setNavState] = useState<WebViewNavigation>()

  const [isNotificationsGranted, setIsNotificationsGranted] = useState(false)

  const [isWebViewPageLoaded, setIsWebViewPageLoaded] = useState(false)

  // const [url, setUrl] = useState('https://eodiro.com')
  // const [url, setUrl] = useState('http://10.0.1.4:3020/')
  const [url, setUrl] = useState('http://192.168.0.105:3020/')

  const isDarkMode = useDarkMode()

  useEffect(() => {
    setTimeout(() => {
      setNavBarTextColor(isDarkMode)
    }, 1200)
  }, [isDarkMode])

  useEffect(() => {
    async function init() {
      // Programmatically set the status bar style to white text
      setNavBarTextColor(isDarkMode)

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

      // Foreground notifications
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      })

      // On tap an notification
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data
        const body = data.body as Record<string, any>

        if (body.type === 'notice') {
          console.log(body.url)
          Linking.openURL(body.url)
        }
      })

      Keyboard.addListener('keyboardWillShow', () => {
        StatusBar.setBarStyle(AppStatus.currentStatusBarStyle)
      })

      Keyboard.addListener('keyboardDidHide', () => {
        StatusBar.setBarStyle(AppStatus.currentStatusBarStyle)
      })
    }

    init()
  }, [])

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <RootStack.Screen
          name="EodiroWebView"
          component={EodiroWebViewScreen}
          initialParams={{
            url,
          }}
          options={{
            contentStyle: {
              backgroundColor: isDarkMode ? '#000' : '#f0f2f3',
            },
            stackPresentation: 'push',
          }}
        />
        <RootStack.Screen
          name="ModalWebView"
          component={ModalWebViewScreen}
          options={{
            contentStyle: {
              backgroundColor: isDarkMode ? '#000' : '#f0f2f3',
            },
            stackPresentation: 'modal',
          }}
        />
      </RootStack.Navigator>

      {/* <View
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
      </View> */}
    </NavigationContainer>
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
