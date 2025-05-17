import { Tabs } from "expo-router";
import { Image } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let icon;
          if (route.name === "index") icon = require("../../assets/icons/home.png");
          if (route.name === "explore") icon = require("../../assets/icons/search.png");
          if (route.name === "ProfileScreen") icon = require("../../assets/icons/Profile.png");

          return (
            <Image
              source={icon}
              style={{
                width: 35,
                height: 35,
                tintColor: focused ? "#FF6347" : "#4E4E4E",
              }}
              resizeMode="contain"
            />
          );
        },
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="ProfileScreen" />
    </Tabs>
  );
}