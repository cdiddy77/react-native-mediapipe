import * as React from "react";
import CameraStream from "./CameraStream";
import StillPhoto from "./StillPhoto";
import Settings from "./Settings";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Button } from "react-native";

type RootTabParamList = {
  CameraStream: undefined;
  StillPhoto: undefined;
  Settings: undefined;
};
const Tab = createBottomTabNavigator<RootTabParamList>();

function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName="CameraStream">
        <Tab.Screen
          name="CameraStream"
          component={CameraStream}
          options={{ title: "Camera Streaming" }}
        />
        <Tab.Screen
          name="StillPhoto"
          component={StillPhoto}
          options={{ title: "Still Photo" }}
        />
        <Tab.Screen
          name="Settings"
          component={Settings}
          options={{ title: "Settings" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default App;
