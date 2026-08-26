import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, PanResponder } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { BaseGameProps } from '../../types/gameplay';
import { Ionicons } from '@expo/vector-icons';
import { FLIP_PRODUCTS, flipResult, flipRoundScore } from '../../game-engine/miniGameLogic';

export const FlipIt: React.FC<BaseGameProps & { rounds?: number }> = ({ onComplete, rounds = 3, testID }) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const roundRef = useRef(0);
  const scoreRef = useRef(0);
  const swipeLockedRef = useRef(false);
  const completedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const product = FLIP_PRODUCTS[currentRound % FLIP_PRODUCTS.length];

  const handleSwipe = (direction: 'up' | 'down') => {
    if (completedRef.current) return;
    const round = roundRef.current;
    const isBuy = direction === 'up'; // swipe up to buy
    const roundScore = flipRoundScore(round, isBuy);
    const nextScore = scoreRef.current + roundScore;
    scoreRef.current = nextScore;
    setScore(nextScore);

    if (round + 1 >= rounds) {
      completedRef.current = true;
      onComplete(flipResult(nextScore));
    } else {
      roundRef.current = round + 1;
      setCurrentRound(roundRef.current);
      translateY.value = 0;
      opacity.value = 1;
      swipeLockedRef.current = false;
    }
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      translateY.value = gestureState.dy;
    },
    onPanResponderRelease: (_, gestureState) => {
      if (swipeLockedRef.current || completedRef.current) return;
      if (gestureState.dy < -100) {
        swipeLockedRef.current = true;
        translateY.value = withSpring(-500);
        opacity.value = withSpring(0);
        timeoutRef.current = setTimeout(() => handleSwipe('up'), 300);
      } else if (gestureState.dy > 100) {
        swipeLockedRef.current = true;
        translateY.value = withSpring(500);
        opacity.value = withSpring(0);
        timeoutRef.current = setTimeout(() => handleSwipe('down'), 300);
      } else {
        translateY.value = withSpring(0);
      }
    }
  })).current;

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.headerText}>Round {currentRound + 1} of {rounds}</Text>
      <Text style={styles.subText}>Swipe UP to Buy, DOWN to Pass</Text>

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, animatedStyle]}
        testID={testID ? `${testID}-card` : undefined}
      >
        <Ionicons name="pricetag-outline" size={64} color={colors.primary} />
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>Asking: ${product.price}</Text>
      </Animated.View>
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
  headerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 8,
  },
  subText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.muted,
    marginBottom: 64,
  },
  card: {
    width: '100%',
    aspectRatio: 3/4,
    backgroundColor: colors.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  productName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  productPrice: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: colors.primary,
  },
});
