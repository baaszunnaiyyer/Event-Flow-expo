import { Text, View, StyleSheet, FlatList, Animated } from "react-native";
import type {ViewToken} from "react-native"
import { Link, router } from "expo-router";
import slides from "./slides";
import OnboardingItem from "./OnboardingItem";
import {useState, useRef} from "react";
import Paginator from "./Paginator";
import NextButtton from "./NextButton";
import AsyncStorage from "@react-native-async-storage/async-storage";


const completeOnboarding = async () => {
  await AsyncStorage.setItem("hasOnboarded", "true");
  router.replace("/(auth)");
};


export default function OnBoarding() {

  const [currentIndex, setCurrentIndex] = useState(0)

  const scrollx = useRef(new Animated.Value(0)).current;

  const slidesRef = useRef<FlatList>(null);

   const viewableItemsChanged = useRef(({ viewableItems } : {viewableItems: ViewToken[]}) => {
    setCurrentIndex(viewableItems[0]?.index ?? 0);
   }).current;

   const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50}).current;

   const scrollTo = () => {
      if(slidesRef.current && currentIndex < slides.length - 1 ){
        slidesRef.current.scrollToIndex({index:currentIndex + 1})
      }else {
        completeOnboarding();
      }
   }

  return (
    <View style={styles.view}>

      <View style={{flex:3}}>
        <FlatList 
        ref={slidesRef}
        data={slides} 
        renderItem={({item}) => <OnboardingItem item={item}/>}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{nativeEvent : {contentOffset : {x : scrollx}}}],{
          useNativeDriver: false
        })}
        scrollEventThrottle={32}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        />
      </View>
      <Paginator data={slides}  scrollx={scrollx}/>
      <NextButtton scrollTo={scrollTo} percentage={(currentIndex + 1) * (100 / slides.length)}/>
    </View>
  );
}


const styles = StyleSheet.create({
  view: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
  },
})