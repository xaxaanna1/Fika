import * as Notifications from 'expo-notifications';

export const scheduleNotification = async (title: string, body: string, seconds: number) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { seconds },
  });
};
