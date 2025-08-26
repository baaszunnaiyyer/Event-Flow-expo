import {useEffect, useRef} from 'react'
import { Animated, View, StyleSheet, TouchableOpacity } from "react-native";
import Svg, {G, Circle} from 'react-native-svg'
import {AntDesign} from '@expo/vector-icons'

type PercentageProp = {
  percentage : number
  scrollTo : any
}

export default function NextButtton({percentage, scrollTo} : PercentageProp ) {

  const size = 128;
  const strokeWidth = 4;
  const center = size / 2;
  const radius = (size / 2) - (strokeWidth / 2); 
  const circumference = 2 * Math.PI * radius;

  const progressAnimation = useRef( new Animated.Value(0)).current;
  const progressRef = useRef<any>(null)

  const animation = (toValue : number) => {
    return Animated.timing(progressAnimation, {
      toValue,
      duration : 250,
      useNativeDriver : true
    }).start()
  }

  useEffect(()=>{
    animation(percentage)
  }, [percentage])

  useEffect(()=>{
    progressAnimation.addListener(
      (value) =>{
      const strokeDashoffset = circumference - (circumference * value.value)/ 100

      if (progressRef?.current) {
        progressRef.current.setNativeProps({
          strokeDashoffset,
        })
      }

    }
  );

  return () => {
    progressAnimation.removeAllListeners();
  }
  }, [])

  return (
    <View style={styles.view}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={center}>
        <Circle fill= "none" stroke="#E6E7E8" cx={center} cy={center} r={radius} strokeWidth={strokeWidth}/>
        <Circle
            ref={progressRef}
            stroke="#090040" 
            fill= "none"
            cx={center} 
            cy={center}
            r={radius} 
            strokeWidth={strokeWidth} 
            strokeDasharray={circumference} 
            />
        </G>
      </Svg>
      <TouchableOpacity onPress={scrollTo} style={styles.button} activeOpacity={0.6}>
            <AntDesign name="arrowright" size={32} color="#ffff"/>
      </TouchableOpacity>

    </View>
  );
}


const styles = StyleSheet.create({
  view: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor : "rgba(247, 247, 247, 1)"
  },
  button : {
    position : 'absolute',
    backgroundColor : "#090040",
    borderRadius : 100,
    padding : 30
  }
})