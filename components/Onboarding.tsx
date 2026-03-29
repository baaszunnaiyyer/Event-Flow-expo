import { AUTH_PAGINATOR_FOOTER_PADDING_BOTTOM } from "@/constants/constants";
import { View, StyleSheet, FlatList, Animated } from "react-native";
import type { ViewToken } from "react-native";
import { router } from "expo-router";
import slides from "./slides";
import OnboardingItem from "./OnboardingItem";
import { useState, useRef } from "react";
import Paginator from "./Paginator";
import NextButtton from "./NextButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const completeOnboarding = async () => {
  await AsyncStorage.setItem("hasOnboarded", "true");
  router.replace("/(auth)");
};


export default function OnBoarding() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);

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
      <View style={styles.slideArea}>
        <FlatList
          ref={slidesRef}
          data={slides}
          renderItem={({ item }) => <OnboardingItem item={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollx } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
        />
      </View>
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + AUTH_PAGINATOR_FOOTER_PADDING_BOTTOM },
        ]}
      >
        <Paginator data={slides} scrollx={scrollx} />
        <NextButtton
          scrollTo={scrollTo}
          percentage={(currentIndex + 1) * (100 / slides.length)}
          compact
        />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  view: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
    alignSelf: "stretch",
    width: "100%",
    backgroundColor: "rgba(247, 247, 247, 1)",
  },
  slideArea: {
    flex: 1,
    width: "100%",
  },
  flatList: {
    flex: 1,
  },
  footer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 8,
  },
});