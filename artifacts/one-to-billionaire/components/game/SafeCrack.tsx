import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { BaseGameProps } from '../../types/gameplay';
import { Button } from '../Button';
import { Ionicons } from '@expo/vector-icons';
import { createCompletionGate, safeCrackHit } from '../../game-engine/miniGameLogic';

export const SafeCrack: React.FC<BaseGameProps> = ({ onComplete, difficulty = 0.5, testID }) => {
  const [level, setLevel] = useState(0); // 0, 1, 2
  const levelRef = useRef(0);
  const [failed, setFailed] = useState(false);
  const tapLockedRef = useRef(false);
  const completionGate = useRef(createCompletionGate()).current;
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotation = useSharedValue(0);
  const targets = useRef([Math.random() * 360, Math.random() * 360, Math.random() * 360]).current;

  const startAnimation = useCallback(() => {
    const speed = 2000 - (difficulty * 1000) - (level * 200);
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: speed, easing: Easing.linear }),
      -1,
      false
    );
  }, [difficulty, level, rotation]);

  useEffect(() => {
    startAnimation();
    return () => cancelAnimation(rotation);
  }, [level, difficulty, startAnimation, rotation]);

  useEffect(() => () => {
    if (completionTimer.current) clearTimeout(completionTimer.current);
  }, []);

  const handleTap = () => {
    if (tapLockedRef.current || failed || level >= 3) return;
    tapLockedRef.current = true;
    
    // Convert current value to 0-360
    const currentRot = rotation.value % 360;
    const currentLevel = levelRef.current;
    const target = targets[currentLevel];
    
    if (safeCrackHit(currentRot, target, difficulty)) {
      if (currentLevel === 2) {
        cancelAnimation(rotation);
        levelRef.current = 3;
        setLevel(3);
        completionTimer.current = setTimeout(() => {
          completionGate.tryComplete(() => onComplete({ score: 1000, multiplier: 2, bonus: 500, outcome: 'success' }));
        }, 1000);
      } else {
        levelRef.current = currentLevel + 1;
        setLevel(levelRef.current);
      }
    } else {
      setFailed(true);
      cancelAnimation(rotation);
      completionTimer.current = setTimeout(() => {
        completionGate.tryComplete(() => onComplete({ score: 0, multiplier: 1, bonus: 0, outcome: 'failure' }));
      }, 1500);
    }
  };

  useEffect(() => {
    tapLockedRef.current = false;
  }, [level]);

  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>Crack the Safe</Text>
      <Text style={styles.subtitle}>Stop the dial on the green markers ({level}/3)</Text>
      
      <View style={styles.safeContainer}>
        {/* Targets */}
        {targets.map((target, idx) => (
          <View 
            key={idx}
            style={[
              styles.targetLine, 
              { transform: [{ rotate: `${target}deg` }] },
              idx < level && { opacity: 0 } // hide completed targets
            ]}
          >
            <View style={[
              styles.targetDot, 
              idx === level ? { backgroundColor: colors.primary } : { backgroundColor: colors.muted }
            ]} />
          </View>
        ))}
        
        {/* Dial */}
        <Animated.View style={[styles.dial, dialStyle]}>
          <View style={styles.dialIndicator} />
        </Animated.View>
        
        {/* Center lock core */}
        <View style={[
          styles.lockCore, 
          failed && { backgroundColor: colors.danger },
          level === 3 && { backgroundColor: colors.primary }
        ]}>
          <Ionicons name={level === 3 ? "lock-open" : "lock-closed"} size={32} color={colors.background} />
        </View>
      </View>
      
      <Button 
        title={failed ? "FAILED" : level === 3 ? "UNLOCKED!" : "TAP"} 
        onPress={handleTap}
        disabled={failed || level === 3}
        variant={failed ? 'danger' : 'primary'}
        style={{ width: 200 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.muted,
    marginBottom: 64,
  },
  safeContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.cardSecondary,
    borderWidth: 4,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 64,
    position: 'relative',
  },
  targetLine: {
    position: 'absolute',
    width: 4,
    height: 240,
    alignItems: 'center',
  },
  targetDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: -8,
  },
  dial: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
  },
  dialIndicator: {
    width: 6,
    height: 24,
    backgroundColor: colors.text,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  lockCore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
