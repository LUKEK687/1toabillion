import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withSpring, runOnJS } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { BaseGameProps, Rarity } from '../../types/gameplay';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../../context/SettingsContext';
import { MYSTERY_ITEMS, mysteryResult } from '../../game-engine/miniGameLogic';

const RARITY_COLORS: Record<Rarity, string> = {
  common: colors.muted,
  uncommon: '#10B981', // green
  rare: '#3B82F6', // blue
  epic: '#8B5CF6', // purple
  legendary: '#F59E0B', // gold
  mythic: '#EF4444', // red
};

export const MysteryReveal: React.FC<BaseGameProps & { itemRarity?: Rarity }> = ({ 
  onComplete, 
  itemRarity = 'rare', 
  testID 
}) => {
  const { settings } = useSettings();
  const [step, setStep] = useState<'idle' | 'shaking' | 'revealed'>('idle');
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);
  
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0); // for reveal flash

  const handleTap = () => {
    if (step !== 'idle') return;
    setStep('shaking');
    
    if (settings.haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    if (settings.reducedMotion) {
      doReveal();
    } else {
      rotate.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withRepeat(withTiming(10, { duration: 100 }), 5, true),
        withTiming(0, { duration: 50 }, () => {
          runOnJS(doReveal)();
        })
      );
    }
  };

  const doReveal = () => {
    setStep('revealed');
    if (settings.haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (!settings.reducedMotion) {
      scale.value = withSpring(1.5, { damping: 10, stiffness: 100 });
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 500 })
      );
    } else {
      scale.value = 1.5;
    }

    completionTimer.current = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete(mysteryResult(itemRarity));
    }, 2000);
  };

  useEffect(() => () => {
    if (completionTimer.current) clearTimeout(completionTimer.current);
  }, []);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` }
    ]
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  return (
    <View style={styles.container} testID={testID}>
      <Animated.View style={[styles.flash, flashStyle, { backgroundColor: RARITY_COLORS[itemRarity] }]} pointerEvents="none" />
      
      <Text style={styles.title}>
        {step === 'revealed' ? itemRarity.toUpperCase() + ' ITEM!' : 'Mystery Box'}
      </Text>
      {step === 'revealed' && <Text style={styles.itemName}>{MYSTERY_ITEMS[itemRarity].name}</Text>}

      <TouchableWithoutFeedback onPress={handleTap}>
        <Animated.View style={[styles.boxContainer, boxStyle]}>
          {step === 'revealed' ? (
            <Ionicons name="diamond" size={80} color={RARITY_COLORS[itemRarity]} />
          ) : (
            <Ionicons name="cube" size={100} color={colors.text} />
          )}
        </Animated.View>
      </TouchableWithoutFeedback>

      {step === 'idle' && <Text style={styles.tapText}>Tap to Open</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: colors.text,
    marginBottom: 64,
    zIndex: 10,
  },
  boxContainer: {
    width: 200,
    height: 200,
    backgroundColor: colors.card,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    zIndex: 10,
  },
  tapText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.muted,
    marginTop: 32,
    zIndex: 10,
  },
  itemName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 18,
    zIndex: 10,
  },
});
