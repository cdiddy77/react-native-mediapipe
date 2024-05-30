import * as React from "react";
import { CameraStream } from "./CameraStream";
import { Photo } from "./Photo";
import { Settings } from "./Settings";
import { NavigationContainer, type RouteProp } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { type RootTabParamList } from "./navigation";
import Ionicons from "react-native-vector-icons/Ionicons";
import type { AppSettings } from "./app-settings";
import { Delegate } from "react-native-mediapipe";
import { SettingsContext } from "./app-settings";
import { CustomColors } from "./colors";

const Tab = createBottomTabNavigator<RootTabParamList>();

type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
  route: RouteProp<RootTabParamList, keyof RootTabParamList>;
};

const RenderTabBarIcon: React.FC<TabBarIconProps> = ({
  focused,
  color,
  size,
  route,
}) => {
  let iconName;

  if (route.name === "CameraStream") {
    iconName = focused ? "camera" : "camera-outline";
  } else if (route.name === "Photo") {
    iconName = focused ? "document" : "document-outline";
  } else {
    // if (route.name === "Settings")
    iconName = focused ? "cog" : "cog-outline";
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

function App() {
  const [settings, setSettings] = React.useState<AppSettings>({
    maxResults: 5,
    threshold: 20,
    processor: Delegate.GPU,
    model: "efficientdet-lite0",
  });

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="CameraStream"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              return RenderTabBarIcon({ focused, color, size, route });
            },
            tabBarActiveTintColor: CustomColors.elecBlue,
            tabBarInactiveTintColor: CustomColors.teal,
          })}
        >
          <Tab.Screen
            name="CameraStream"
            component={CameraStream}
            options={{ title: "Camera" }}
          />
          <Tab.Screen
            name="Photo"
            component={Photo}
            options={{ title: "Photos" }}
          />
          <Tab.Screen
            name="Settings"
            component={Settings}
            options={{ title: "Settings" }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SettingsContext.Provider>
  );
}

export default App;
