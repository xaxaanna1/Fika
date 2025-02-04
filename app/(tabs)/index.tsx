import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './HomeScreen';
import ExploreScreen from './explore';
import Profile from '../auth/Profile'; // Импорт экрана Профиля
import { Ionicons } from '@expo/vector-icons'; // Импорт иконок

const Tab = createBottomTabNavigator();

export default function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Главная') {
            iconName = 'home-outline'; // Иконка "домик"
          } else if (route.name === 'Обзор') {
            iconName = 'cafe-outline'; // Иконка "кофе"
          } else if (route.name === 'Профиль') {
            iconName = 'person-outline'; // Иконка "пользователь"
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Главная"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Обзор"
        component={ExploreScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Профиль"
        component={Profile}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
