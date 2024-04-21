import * as React from "react";
import CameraStream from "./CameraStream";
import StillPhoto from "./StillPhoto";
import Settings from "./Settings";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Button } from "react-native";

type RootStackParamList = {
  CameraStream: undefined;
  StillPhoto: undefined;
  Settings: undefined;
};
const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="CameraStream"
        screenOptions={{
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <Button
              onPress={() => navigationRef.current?.navigate("Settings")}
              title="Settings"
            />
          ),
        }}
      >
        <Stack.Screen
          name="CameraStream"
          component={CameraStream}
          options={{ title: "Camera Streaming" }}
        />
        <Stack.Screen
          name="StillPhoto"
          component={StillPhoto}
          options={{ title: "Still Photo" }}
        />
        <Stack.Screen
          name="Settings"
          component={Settings}
          options={{ title: "Settings" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
