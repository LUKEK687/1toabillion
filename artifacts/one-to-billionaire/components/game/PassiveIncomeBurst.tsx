import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import { colors } from '../../constants/colors';
import { BaseGameProps } from '../../types/gameplay';
import { useSettings } from '../../context/SettingsContext';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withSpring } from 'react-native-reanimated';

export const PassiveIncomeBurst: React.FC<BaseGameProps> = ({ onComplete, durationMs = 5000, testID }) => {
  const { settings } = useSettings();
  const [timeLeft, setTimeLeft] = useState(durationMs / 1000);
  const [taps, setTaps] = useState(0);
  const tapsRef = useRef(0);
  const completedRef = useRef(false);
  const scale = useSharedValue(1);
  const progress = useSharedValue(1);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  useEffect(() => {
    progress.value = withTiming(0, { duration: durationMs, easing: Easing.linear });
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    
    const timeout = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete({
        score: tapsRef.current * 10,
        multiplier: 1,
        bonus: tapsRef.current * 10,
        outcome: tapsRef.current > 20 ? 'success' : 'neutral'
      });
    }, durationMs);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(timeout);
    };
  }, [durationMs, onComplete, progress]);

  const handleTap = () => {
    if (completedRef.current) return;
    tapsRef.current += 1;
    setTaps(tapsRef.current);
    if (settings.haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (!settings.reducedMotion) {
      scale.value = 0.9;
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }));

  const tapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>Tap Frenzy!</Text>
        <Text style={styles.timer}>{timeLeft.toFixed(1)}s</Text>
      </View>
      <View style={styles.progressBarBg}>
        <Animated.View style={[styles.progressBar, progressStyle]} />
      </View>
      
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.tapArea}>
          <Animated.View style={[styles.tapButton, tapStyle]}>
            <Text style={styles.tapText}>TAP!</Text>
            <Text style={styles.scoreText}>+{taps * 10}</Text>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: colors.primary,
  },
  timer: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: colors.text,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.cardSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 48,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  tapArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  tapButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  tapText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
    color: colors.background,
  },
  scoreText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: colors.background,
    marginTop: 8,
  },
});
