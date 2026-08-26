import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { BaseGameProps } from '../../types/gameplay';
import { Button } from '../Button';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';

interface WheelOption {
  label: string;
  value: number;
}

export const LuckyWheel: React.FC<BaseGameProps & { options: WheelOption[] }> = ({ onComplete, options, testID }) => {
  const [spinning, setSpinning] = useState(false);
  const rotation = useSharedValue(0);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);

    const segmentAngle = 360 / options.length;
    const targetIndex = Math.floor(Math.random() * options.length);
    const targetAngle = 360 - (targetIndex * segmentAngle) - (segmentAngle / 2);
    
    // Spin 5 times + target
    const finalRotation = 360 * 5 + targetAngle;

    rotation.value = withTiming(finalRotation, {
      duration: 3000,
      easing: Easing.out(Easing.cubic)
    }, (finished) => {
      if (finished) {
        runOnJS(finishSpin)(options[targetIndex]);
      }
    });
  };

  const finishSpin = (selected: WheelOption) => {
    finishTimer.current = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete({
        score: selected.value,
        multiplier: 1,
        bonus: 0,
        outcome: selected.value > 0 ? 'success' : 'failure'
      });
    }, 1000);
  };

  useEffect(() => () => {
    if (finishTimer.current) clearTimeout(finishTimer.current);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  const renderWheel = () => {
    const radius = 140;
    const center = 150;
    const numSegments = options.length;
    const angle = 360 / numSegments;
    
    return options.map((opt, i) => {
      const startAngle = i * angle;
      const endAngle = startAngle + angle;
      
      const x1 = center + radius * Math.cos((Math.PI * startAngle) / 180);
      const y1 = center + radius * Math.sin((Math.PI * startAngle) / 180);
      const x2 = center + radius * Math.cos((Math.PI * endAngle) / 180);
      const y2 = center + radius * Math.sin((Math.PI * endAngle) / 180);

      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
      const color = i % 2 === 0 ? colors.primary : colors.cardSecondary;
      
      const textAngle = startAngle + angle / 2;
      const textR = radius * 0.6;
      const tx = center + textR * Math.cos((Math.PI * textAngle) / 180);
      const ty = center + textR * Math.sin((Math.PI * textAngle) / 180);

      return (
        <G key={i}>
          <Path d={pathData} fill={color} stroke={colors.border} strokeWidth="2" />
          <SvgText
            x={tx}
            y={ty}
            fill={i % 2 === 0 ? '#000' : '#fff'}
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            transform={`rotate(${textAngle + 90}, ${tx}, ${ty})`}
          >
            {opt.label}
          </SvgText>
        </G>
      );
    });
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>Spin the Wheel!</Text>
      
      <View style={styles.wheelWrapper}>
        <View style={styles.pointer} />
        <Animated.View style={[styles.wheelContainer, animatedStyle]}>
          <Svg width="300" height="300">
            {renderWheel()}
            <Circle cx="150" cy="150" r="15" fill={colors.text} stroke={colors.border} strokeWidth="4" />
          </Svg>
        </Animated.View>
      </View>

      <Button 
        title={spinning ? "SPINNING..." : "SPIN"} 
        onPress={handleSpin}
        disabled={spinning}
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
    fontSize: 32,
    color: colors.text,
    marginBottom: 40,
  },
  wheelWrapper: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
    position: 'relative',
  },
  wheelContainer: {
    width: 300,
    height: 300,
  },
  pointer: {
    position: 'absolute',
    top: -10,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.danger,
    transform: [{ rotate: '180deg' }],
    zIndex: 10,
  },
});
