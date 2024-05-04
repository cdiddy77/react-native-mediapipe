import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import type { RootTabParamList } from "./navigation";
import ImagePicker from 'react-native-image-crop-picker';

type Props = BottomTabScreenProps<RootTabParamList, "Photo">;

export const Photo: React.FC<Props> = () => {
  const [screenState, setScreenState] = React.useState<
  'initial'|'selecting'|"inferring"|"completed"|"error"
  >("initial");
  const [imagePath, setImagePath] = React.useState<string>();
  const onClickSelectPhoto = () => {
    setScreenState("selecting");
    ImagePicker.openPicker({
      mediaType: "photo",
      width: 300,
      height: 400,
    }).then(image => {
      //TODO: run objectdetection on image
      setImagePath(image.path);
      setScreenState("completed");
      console.log(image);
    });
    //TODO: Catch error here and send user to error screen
  };
  return (
    <View style={ styles.root }>
      {screenState === "initial" && (
        <Pressable
        style={styles.selectButton}
        onPress={onClickSelectPhoto}>
            <Text style={styles.selectButtonText}>Select a photo</Text>
          </Pressable>
      )}
       {screenState==='completed'&& (
      <Image source={{uri:imagePath}} style={styles.photo}/>
    )}
    </View>
  );
};

const styles = StyleSheet.create({
  root:{ flex: 1, alignItems: "center", justifyContent: "center"},
  selectButton: {backgroundColor: "blue", padding: 10, borderRadius: 5 },
  selectButtonText: {fontSize: 20, color:"white"},
  photo: {width:300,height:400}
});


