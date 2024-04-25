import * as React from "react";
import { CameraStream } from "./CameraStream";
import { Photo } from "./Photo";
import { Settings } from "./Settings";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { type RootTabParamList } from "./navigation";

const Tab = createBottomTabNavigator<RootTabParamList>();

function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName="CameraStream">
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
  );
}

export default App;
