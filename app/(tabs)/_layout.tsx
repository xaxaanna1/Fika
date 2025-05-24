import { Tabs } from "expo-router";
import { Image, View, StyleSheet, Platform, Dimensions } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let icon;
          if (route.name === "index") icon = require("../../assets/icons/home.png");
          if (route.name === "explore") icon = require("../../assets/icons/search.png");
          if (route.name === "ProfileScreen") icon = require("../../assets/icons/Profile.png");

          // Use a completely different approach with fixed positioning
          return (
            <View style={styles.tabBarItemContainer}>
              <Image
                source={icon}
                style={[
                  styles.tabIcon,
                  { tintColor: focused ? "#FF6347" : "#4E4E4E" }
                ]}
                resizeMode="contain"
              />
            </View>
          );
        },
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: styles.tabBar,
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
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 10,
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tabBarItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
    minWidth: 40,
    backgroundColor: 'transparent',
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
});