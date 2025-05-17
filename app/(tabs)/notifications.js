import * as Notifications from 'expo-notifications';

export const scheduleNotification = async (product) => {
const daysLeft = Math.floor(product.remaining / product.dailyUsage);

if (daysLeft <= 3) {
await Notifications.scheduleNotificationAsync({
    content: {
    title: `Заканчивается ${product.name}`,
    body: `Осталось примерно на ${daysLeft} дней. Пора пополнить запасы!`,
    data: { productId: product.id },
    },
    trigger: { seconds: 1 }, // Можно настроить на определенное время
});
}
};

export const setupNotifications = async () => {
await Notifications.requestPermissionsAsync();

Notifications.setNotificationHandler({
handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
}),
});
};