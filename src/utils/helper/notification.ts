import notifee, {AndroidImportance, AndroidStyle} from '@notifee/react-native';

export const displayNotification = async (time: string) => {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: `You haven't move for ${time}`,
    body: 'click here to stop collecting location',
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
      style: {
        type: AndroidStyle.BIGTEXT,
        text: 'click here to stop collecting location',
      },
    },
    ios: {
      foregroundPresentationOptions: {
        badge: true,
        sound: true,
        banner: true,
        list: true,
      },
    },
  });
};
