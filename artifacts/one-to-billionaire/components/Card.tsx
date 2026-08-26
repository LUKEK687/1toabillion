import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors } from '../constants/colors';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: colors.radius,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
