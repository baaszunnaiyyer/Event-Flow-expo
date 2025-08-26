import {  View, StyleSheet, Animated, useWindowDimensions } from "react-native";


type Slide = {
  id: string;
  title: string;
  image: string;
};

type PaginatorProps = {
  data: Slide[];
  scrollx: Animated.Value;
};

export default function Paginator({data, scrollx} : PaginatorProps) {

    const {width} = useWindowDimensions()

  return (
    <View style={{flexDirection : "row", height : 64, }}>
        {
            data.map((_, i) =>{
                const inputRange = [(i-1) * width, i * width, (i+1) * width]

                const dotWidth = scrollx.interpolate({
                    inputRange,
                    outputRange : [10, 20, 10],
                    // extrapolate : 'clamp'
                })

                const opacity  = scrollx.interpolate({
                    inputRange,
                    outputRange : [0.3, 1 , 0.3],
                    // extrapolate : "clamp"
                })

                return <Animated.View style={[styles.dot, {width: dotWidth, opacity}]} key={i.toString()}/>
            })
        }
    </View>
  );
}


const styles = StyleSheet.create({
  dot : {
    height : 10,
    borderRadius : 5,
    backgroundColor : "#090040",
    marginHorizontal : 8 
  }
})