import React, { useEffect } from 'react'

import { AppStatus } from '../modules/app-status'
import { RootStackParamList } from '../../App'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { StatusBar } from 'react-native'
import WebView from 'react-native-webview'
import { useDarkMode } from 'react-native-dark-mode'

type GeneralWebViewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'GeneralWebView'
>

type GeneralWebViewScreenRouteProp = RouteProp<
  RootStackParamList,
  'GeneralWebView'
>

type GeneralWebViewScreenProps = {
  navigation: GeneralWebViewScreenNavigationProp
  route: GeneralWebViewScreenRouteProp
}

const GeneralWebViewScreen: React.FC<GeneralWebViewScreenProps> = ({
  navigation,
  route,
}) => {
  const { url } = route.params
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

  return <WebView source={{ uri: url }} decelerationRate="normal" />
}

export default GeneralWebViewScreen
