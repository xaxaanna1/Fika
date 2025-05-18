import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          // Убираем дефолтную иконку - оставляем только явные случаи
          const iconMap: Record<string, MaterialIconName> = {
            "index": "home",
            "explore": "search",
            "ProfileScreen": "person"
          };

          const iconName = iconMap[route.name];
          
          if (!iconName) return null; // Не отображаем иконку для неизвестных роутов

          return (
            <View style={styles.iconWrapper}>
              <MaterialIcons 
                name={iconName} 
                size={35} 
                color={focused ? "#FF6347" : "#4E4E4E"} 
              />
            </View>
          );
        },
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="ProfileScreen" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,
    elevation: 10,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // Добавляем фиксированную ширину для таб-бара
    width: '100%',
    alignSelf: 'center'
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // Добавляем максимальную ширину для элементов
    maxWidth: '33.33%' // Для 3 иконок
  },
  iconWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
  },
});