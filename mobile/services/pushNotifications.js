// Registro de notificaciones push con Expo.
//
// Este modulo pide permisos nativos, obtiene el Expo Push Token y lo devuelve
// para que authStore lo envie al backend. En simuladores puede no haber token.
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import logger from './logger';

Notifications.setNotificationHandler({
  // Define como se comporta una notificacion cuando la app esta abierta.
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    // Android necesita un canal para controlar sonido, vibracion e importancia.
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    // Expo solo puede emitir push tokens confiables en dispositivos fisicos.
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      logger.warn('No se obtuvo permiso nativo para notificaciones push.');
      return;
    }
    try {
      // EAS projectId identifica el proyecto ante Expo Push Service.
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      token = pushTokenString;
    } catch (e) {
      logger.warn('No se pudo obtener el Expo Push Token:', e);
    }
  } else {
    logger.info('Se necesita un dispositivo fisico para habilitar Push Notifications.');
  }

  return token;
}
