import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { useSettings } from '../../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  impact: string;
  type?: 'positive' | 'negative' | 'neutral';
  onComplete?: () => void;
}

export const WorldEventBanner: React.FC<Props> = ({ title, impact, type = 'neutral', onComplete }) => {
  const { settings } = useSettings();
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (settings.reducedMotion) {
      translateY.value = 0;
      opacity.value = 1;
    } else {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }

    const t = setTimeout(() => {
      translateY.value = withTiming(-150, { duration: 400 });
      opacity.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      });
    }, 4000);

    return () => clearTimeout(t);
  }, [onComplete, opacity, settings.reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getThemeColor = () => {
    switch (type) {
      case 'positive': return colors.primary;
      case 'negative': return colors.danger;
      default: return colors.gold;
    }
  };

  const themeColor = getThemeColor();

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.banner, { borderLeftColor: themeColor }, animatedStyle]}>
        <View style={styles.iconContainer}>
          <Ionicons name="globe-outline" size={24} color={themeColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.impact, { color: themeColor }]}>{impact}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // approximate safe area
    left: 16,
    right: 16,
    zIndex: 900,
  },
  banner: {
    backgroundColor: colors.card,
    borderRadius: colors.radius,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  impact: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
