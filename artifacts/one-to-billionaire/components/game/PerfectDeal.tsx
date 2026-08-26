import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { BaseGameProps } from '../../types/gameplay';
import { Button } from '../Button';
import { createCompletionGate, perfectDealResult } from '../../game-engine/miniGameLogic';

export const PerfectDeal: React.FC<BaseGameProps> = ({ onComplete, difficulty = 0.5, testID }) => {
  const [stopped, setStopped] = useState(false);
  const stopLockedRef = useRef(false);
  const completionGate = useRef(createCompletionGate()).current;
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const position = useSharedValue(0);
  const targetWidth = Math.max(0.05, 0.2 - (difficulty * 0.15)); // 5% to 20% width
  const targetStartPos = 0.5 - targetWidth / 2;

  useEffect(() => {
    const speed = 1000 - (difficulty * 600); // 400ms to 1000ms
    position.value = withRepeat(
      withTiming(1, { duration: speed, easing: Easing.inOut(Easing.ease) }),
      -1,
      true // reverse
    );
    return () => {
      cancelAnimation(position);
      if (completionTimer.current) clearTimeout(completionTimer.current);
    };
  }, [difficulty, position]);

  const handleStop = () => {
    if (stopLockedRef.current) return;
    stopLockedRef.current = true;
    setStopped(true);
    cancelAnimation(position);
    
    const result = perfectDealResult(position.value, difficulty);

    completionTimer.current = setTimeout(() => {
      completionGate.tryComplete(() => onComplete(result));
    }, 1500);
  };

  const cursorStyle = useAnimatedStyle(() => ({
    left: `${position.value * 100}%`
  }));

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>Timing is Everything</Text>
      <Text style={styles.subtitle}>Stop the marker in the green zone to close the deal!</Text>
      
      <View style={styles.meterContainer}>
        <View style={styles.meterBg}>
          <View style={[
            styles.targetZone, 
            { left: `${targetStartPos * 100}%`, width: `${targetWidth * 100}%` }
          ]} />
          <Animated.View style={[styles.cursor, cursorStyle]} />
        </View>
      </View>
      
      <Button 
        title={stopped ? "Deal Closed" : "STOP"} 
        onPress={handleStop} 
        disabled={stopped}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
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
    textAlign: 'center',
  },
  meterContainer: {
    width: '100%',
    height: 40,
    marginBottom: 64,
  },
  meterBg: {
    flex: 1,
    backgroundColor: colors.cardSecondary,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  targetZone: {
    position: 'absolute',
    height: '100%',
    backgroundColor: colors.primary,
  },
  cursor: {
    position: 'absolute',
    width: 6,
    height: '100%',
    backgroundColor: colors.text,
    marginLeft: -3,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  button: {
    width: 200,
  },
});
