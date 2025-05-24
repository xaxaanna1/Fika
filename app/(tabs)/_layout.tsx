import { Tabs } from "expo-router";
import { Image, View, StyleSheet, Platform } from "react-native";

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
            <View style={styles.tabIconContainer}>
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
  tabIconContainer: {
    alignItems: 'center',     
    justifyContent: 'center', 
    width: '100%',            
    height: '100%',
    // Add these properties to fix centering issues in production builds
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: Platform.OS === 'android' ? 4 : 0, // Adjust for Android specifically
  },
  tabIcon: {
    width: 24,
    height: 24,
    // Remove marginBottom and use position adjustments instead
  },
});