import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { BaseGameProps } from '../../types/gameplay';
import { Button } from '../Button';

export const PerfectDeal: React.FC<BaseGameProps> = ({ onComplete, difficulty = 0.5, testID }) => {
  const [stopped, setStopped] = useState(false);
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
    return () => cancelAnimation(position);
  }, [difficulty, position]);

  const handleStop = () => {
    if (stopped) return;
    setStopped(true);
    cancelAnimation(position);
    
    const pos = position.value;
    const isHit = pos >= targetStartPos && pos <= targetStartPos + targetWidth;
    const distance = Math.abs(pos - 0.5); // 0 is perfect center
    
    let outcome: 'perfect' | 'success' | 'failure' = 'failure';
    let multiplier = 1;
    let score = 0;
    
    if (distance < targetWidth / 4) {
      outcome = 'perfect';
      multiplier = 2;
      score = 500;
    } else if (isHit) {
      outcome = 'success';
      multiplier = 1.2;
      score = 200;
    } else {
      outcome = 'failure';
      multiplier = 0.5;
      score = 0;
    }

    setTimeout(() => {
      onComplete({
        score,
        multiplier,
        bonus: 0,
        outcome
      });
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
