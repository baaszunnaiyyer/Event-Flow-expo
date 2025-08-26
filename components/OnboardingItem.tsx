import { Text, View, StyleSheet, Image, ImageSourcePropType , useWindowDimensions  } from "react-native";
import { Link } from "expo-router";

type Slide = {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
};

export default function OnboardingItem({item} : {item : Slide}) {
    console.log(item);
    
    const {width} = useWindowDimensions();

  return (
    <View style={[styles.view, {width}]}>
        <Image source={item.image} style={[styles.image, {width, resizeMode: 'contain'}]}/>
        <View style={{flex: 0.3 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>
    </View>
  );
}


const styles = StyleSheet.create({
  view: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",

  },
  image: {
    flex : 0.7,
    width: 0.7,
    justifyContent: "center"
  },
  title:{
    fontWeight : 800,
    fontSize : 20,
    marginBottom : 10,
    color : "#090040",
    textAlign : "center",
    paddingLeft : "10%",
    paddingRight : "10%",
    paddingTop : "10%",
    fontFamily : "Roboto_400Regular"
  },
  description :{
    fontWeight : '500',
    color : '#090040',
    opacity : 0.4,
    textAlign: 'center',
    paddingHorizontal : 64,
  }
})