import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, Easing, runOnJS } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { useSettings } from '../../context/SettingsContext';

interface Props {
  amount: number;
  x: number;
  y: number;
  onComplete?: () => void;
}

export const FloatingMoneyFeedback: React.FC<Props> = ({ amount, x, y, onComplete }) => {
  const { settings } = useSettings();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (settings.reducedMotion) {
      opacity.value = 1;
      const t = setTimeout(() => {
        opacity.value = 0;
        if (onComplete) onComplete();
      }, 1000);
      return () => clearTimeout(t);
    }

    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(600, withTiming(0, { duration: 300 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      }))
    );

    translateY.value = withTiming(-50, {
      duration: 1100,
      easing: Easing.out(Easing.ease),
    });
  }, [onComplete, opacity, settings.reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const isPositive = amount >= 0;
  
  return (
    <Animated.View style={[styles.container, { left: x, top: y }, animatedStyle]} pointerEvents="none">
      <Text style={[styles.text, { color: isPositive ? colors.primary : colors.danger }]}>
        {isPositive ? '+' : '-'}${Math.abs(amount).toLocaleString()}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  text: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
