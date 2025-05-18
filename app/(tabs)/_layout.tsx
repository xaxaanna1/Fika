import { Tabs } from "expo-router";
import { Image, View, StyleSheet, ImageSourcePropType } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon={require("../../assets/icons/home.png")} 
              focused={focused} 
            />
          ),
        }}
      />
      <Tabs.Screen 
        name="explore" 
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon={require("../../assets/icons/search.png")} 
              focused={focused} 
            />
          ),
        }}
      />
      <Tabs.Screen 
        name="ProfileScreen" 
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon={require("../../assets/icons/Profile.png")} 
              focused={focused} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

interface TabIconProps {
  icon: ImageSourcePropType;
  focused: boolean;
}

const TabIcon = ({ icon, focused }: TabIconProps) => (
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

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 10,
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    width: 28,
    height: 28,
    marginBottom: 4,
  },
});