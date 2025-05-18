import { Tabs } from "expo-router";
import { Image, View, StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let icon;
          if (route.name === "index") icon = require("../../assets/icons/home.png");
          if (route.name === "explore") icon = require("../../assets/icons/search.png");
          if (route.name === "ProfileScreen") icon = require("../../assets/icons/Profile.png");

          return (
            <View style={styles.iconWrapper}>
              <Image
                source={icon}
                style={{
                  width: 28,
                  height: 28,
                  tintColor: focused ? "#FF6347" : "#4E4E4E",
                }}
                resizeMode="contain"
              />
            </View>
          );
        },
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem, // Добавлено для центрирования
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
  },
  tabItem: { // Новый стиль для элементов вкладок
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    width: '100%', // Занимает всю ширину родителя
    height: '100%', // Занимает всю высоту родителя
    justifyContent: "center",
    alignItems: "center",
  },
});