import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const NUM_CONFETTI = 50;

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#FFFFFF'];

const ConfettiPiece = ({ index }: { index: number }) => {
  const y = useSharedValue(-50);
  const x = useSharedValue(Math.random() * width);
  const rotation = useSharedValue(Math.random() * 360);
  
  const color = COLORS[index % COLORS.length];
  const size = Math.random() * 8 + 6;
  const duration = Math.random() * 2000 + 2000;
  const delay = Math.random() * 1000;

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withTiming(height + 50, { duration, easing: Easing.linear }),
        -1, // infinite
        false
      )
    );
    x.value = withDelay(
      delay,
      withRepeat(
        withTiming(x.value + (Math.random() * 100 - 50), { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(rotation.value + 360, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: y.value },
        { translateX: x.value },
        { rotate: `${rotation.value}deg` }
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        style,
        { backgroundColor: color, width: size, height: size }
      ]}
    />
  );
};

export const Confetti = () => {
  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: NUM_CONFETTI }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 2,
  },
});
