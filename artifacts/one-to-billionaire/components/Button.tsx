import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({ onPress, title, variant = 'primary', style, textStyle, icon, disabled, testID }) => {
  const { settings } = useSettings();

  const handlePress = () => {
    if (disabled) return;
    if (settings.haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const getBgColor = () => {
    if (disabled) return colors.cardSecondary;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'danger': return colors.danger;
      case 'secondary': return colors.cardSecondary;
      case 'ghost': return 'transparent';
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.muted;
    switch (variant) {
      case 'primary': return '#000000';
      case 'danger': return '#FFFFFF';
      case 'secondary': return colors.text;
      case 'ghost': return colors.primary;
      default: return '#000000';
    }
  };

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: getBgColor() },
        style
      ]}
    >
      {icon && <Ionicons name={icon} size={20} color={getTextColor()} style={{ marginRight: 8 }} />}
      <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: colors.radius,
    minHeight: 56,
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
});
