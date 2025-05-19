import { Tabs } from "expo-router";
import { Image, View } from "react-native";

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
            <View
              style={{
                width: 50,
                height: 50,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
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
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="ProfileScreen" />
    </Tabs>
  );
}
