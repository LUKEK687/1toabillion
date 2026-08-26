import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, PanResponder, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { BaseGameProps } from '../../types/gameplay';
import { Button } from '../Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeProps extends BaseGameProps {
  title: string;
  text: string;
  leftValue: number;
  rightValue: number;
}

export const SwipeDecisionCard: React.FC<SwipeProps> = ({ 
  onComplete, 
  title, 
  text, 
  leftValue, 
  rightValue, 
  testID 
}) => {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const resolvedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [resolved, setResolved] = useState(false);

  const handleDecision = (direction: 'left' | 'right') => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setResolved(true);
    translateX.value = withSpring(direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH, {
      damping: 20,
      stiffness: 100
    });
    
    timeoutRef.current = setTimeout(() => {
      onComplete({
        score: direction === 'left' ? leftValue : rightValue,
        multiplier: 1,
        bonus: 0,
        outcome: 'neutral'
      });
    }, 300);
  };

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      translateX.value = gs.dx;
      rotate.value = gs.dx / 20; // max ~15 degrees
    },
    onPanResponderRelease: (_, gs) => {
      if (gs.dx > SWIPE_THRESHOLD) {
        runOnJS(handleDecision)('right');
      } else if (gs.dx < -SWIPE_THRESHOLD) {
        runOnJS(handleDecision)('left');
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    }
  })).current;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` }
    ]
  }));

  return (
    <View style={styles.container} testID={testID}>
      <Animated.View {...panResponder.panHandlers} style={[styles.card, animatedStyle]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </Animated.View>

      <View style={styles.buttons}>
        <Button 
          title="Decline" 
          variant="danger" 
          onPress={() => handleDecision('left')} 
          disabled={resolved}
          style={styles.btn}
        />
        <Button 
          title="Accept" 
          variant="primary" 
          onPress={() => handleDecision('right')} 
          disabled={resolved}
          style={styles.btn}
        />
      </View>
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
  card: {
    width: '100%',
    aspectRatio: 3/4,
    backgroundColor: colors.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 40,
    zIndex: 10,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  text: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 28,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    paddingHorizontal: 20,
  },
  btn: {
    flex: 1,
  },
});
