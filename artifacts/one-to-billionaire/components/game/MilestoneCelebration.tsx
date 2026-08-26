import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { useSettings } from '../../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
  title: string;
  subtitle: string;
  onComplete?: () => void;
}

export const MilestoneCelebration: React.FC<Props> = ({ title, subtitle, onComplete }) => {
  const { settings } = useSettings();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (settings.haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (settings.reducedMotion) {
      scale.value = 1;
      opacity.value = 1;
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 300 });
    }

    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      });
    }, 3000);

    return () => clearTimeout(t);
  }, [onComplete, opacity, scale, settings.haptics, settings.reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.iconContainer}>
          <Ionicons name="star" size={48} color={colors.gold} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: colors.radius,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.gold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
});
