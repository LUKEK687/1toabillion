import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { useSettings } from '../context/SettingsContext';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label, color = colors.primary }) => {
  const { settings } = useSettings();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = settings.reducedMotion ? progress : withTiming(progress, { duration: 500 });
  }, [progress, settings.reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${width.value}%`,
    };
  });

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{Math.round(progress)}%</Text>
        </View>
      )}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedStyle, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: colors.muted,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  value: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  track: {
    height: 8,
    backgroundColor: colors.cardSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
