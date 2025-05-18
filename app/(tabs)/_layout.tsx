import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';

// Определяем тип для допустимых имен иконок
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName: MaterialIconName;

          if (route.name === "index") {
            iconName = "home";
          } else if (route.name === "explore") {
            iconName = "search";
          } else if (route.name === "ProfileScreen") {
            iconName = "person";
          } else {
            iconName = "help-outline"; // дефолтная иконка
          }

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
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
  },
});