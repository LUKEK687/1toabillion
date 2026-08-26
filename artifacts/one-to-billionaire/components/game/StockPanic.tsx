import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { BaseGameProps } from '../../types/gameplay';
import { Button } from '../Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;
const CHART_HEIGHT = 200;

export const StockPanic: React.FC<BaseGameProps> = ({ onComplete, testID }) => {
  const [dataPoints, setDataPoints] = useState<number[]>([100]);
  const [timeLeft, setTimeLeft] = useState(6);
  const [decision, setDecision] = useState<'buy' | 'sell' | 'hold' | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Store dataPoints reference to avoid stale closures in handleEnd if called by timeout
  const dataPointsRef = useRef(dataPoints);
  useEffect(() => {
    dataPointsRef.current = dataPoints;
  }, [dataPoints]);

  useEffect(() => {
    let currentVal = 100;
    
    dataTimerRef.current = setInterval(() => {
      currentVal = currentVal + (Math.random() * 20 - 10);
      setDataPoints(prev => {
        const next = [...prev, currentVal];
        if (next.length > 30) return next.slice(next.length - 30);
        return next;
      });
    }, 200);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(dataTimerRef.current!);
          handleEnd(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (dataTimerRef.current) clearInterval(dataTimerRef.current);
    };
  }, []);

  const handleEnd = (choice: 'buy' | 'sell' | 'hold' | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (dataTimerRef.current) clearInterval(dataTimerRef.current);
    
    const points = dataPointsRef.current;
    const startVal = points[0] || 100;
    const endVal = points[points.length - 1] || 100;
    const diff = endVal - startVal;
    
    let outcome: 'success' | 'failure' | 'neutral' = 'neutral';
    let score = 0;

    if (choice === 'buy') {
      outcome = diff > 0 ? 'success' : 'failure';
      score = diff > 0 ? 300 : -200;
    } else if (choice === 'sell') {
      outcome = diff < 0 ? 'success' : 'failure';
      score = diff < 0 ? 300 : -200;
    } else {
      score = 50;
      outcome = 'neutral';
    }

    onComplete({ score, multiplier: 1, bonus: 0, outcome });
  };

  const handleChoice = (choice: 'buy' | 'sell' | 'hold') => {
    setDecision(choice);
    handleEnd(choice);
  };

  const getPath = () => {
    if (dataPoints.length === 0) return '';
    const min = Math.min(...dataPoints) - 10;
    const max = Math.max(...dataPoints) + 10;
    const range = max - min || 1;
    
    const stepX = CHART_WIDTH / 30; // Max 30 points
    
    return dataPoints.reduce((acc, point, index) => {
      const x = index * stepX;
      const y = CHART_HEIGHT - ((point - min) / range) * CHART_HEIGHT;
      return acc + (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>Stock Panic!</Text>
        <Text style={styles.timer}>{timeLeft}s</Text>
      </View>
      
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Path
            d={getPath()}
            stroke={colors.primary}
            strokeWidth={3}
            fill="none"
          />
        </Svg>
      </View>

      <Text style={styles.currentValue}>
        Current: ${dataPoints[dataPoints.length - 1]?.toFixed(2) || '0.00'}
      </Text>

      <View style={styles.actions}>
        <Button 
          title="BUY" 
          variant="primary" 
          onPress={() => handleChoice('buy')} 
          disabled={decision !== null}
          style={styles.actionBtn}
        />
        <Button 
          title="HOLD" 
          variant="secondary" 
          onPress={() => handleChoice('hold')} 
          disabled={decision !== null}
          style={styles.actionBtn}
        />
        <Button 
          title="SELL" 
          variant="danger" 
          onPress={() => handleChoice('sell')} 
          disabled={decision !== null}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: colors.text,
  },
  timer: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: colors.danger,
  },
  chartContainer: {
    height: CHART_HEIGHT,
    backgroundColor: colors.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  currentValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
});
