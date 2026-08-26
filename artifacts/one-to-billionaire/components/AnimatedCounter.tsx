import React, { useEffect, useRef, useState } from 'react';
import { Text, TextProps } from 'react-native';
import { formatMoney, formatCompactMoney } from '../lib/utils';
import { useSettings } from '../context/SettingsContext';

interface AnimatedCounterProps extends TextProps {
  value: number;
  format?: 'money' | 'compact' | 'number';
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, format = 'money', ...props }) => {
  const { settings } = useSettings();
  const [displayValue, setDisplayValue] = useState(value);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (settings.reducedMotion) {
      setDisplayValue(value);
      return;
    }

    if (animRef.current) clearInterval(animRef.current);
    
    let current = displayValue;
    const diff = value - current;
    if (Math.abs(diff) < 1) {
      setDisplayValue(value);
      return;
    }

    const step = diff / 20; 

    animRef.current = setInterval(() => {
      current += step;
      if ((step > 0 && current >= value) || (step < 0 && current <= value)) {
        current = value;
        if (animRef.current) clearInterval(animRef.current);
      }
      setDisplayValue(current);
    }, 16);

    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [value, settings.reducedMotion]);

  let formatted = '';
  if (format === 'money') formatted = formatMoney(displayValue);
  else if (format === 'compact') formatted = formatCompactMoney(displayValue);
  else formatted = Math.floor(displayValue).toString();

  return <Text {...props}>{formatted}</Text>;
};
