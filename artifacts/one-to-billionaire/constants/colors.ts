export const colors = {
  background: '#050A05',
  card: '#0D1A12',
  cardSecondary: '#142519',
  text: '#FFFFFF',
  muted: '#8A998F',
  primary: '#10B981', // Bright money green
  primaryMuted: 'rgba(16, 185, 129, 0.15)',
  gold: '#F59E0B',
  goldMuted: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.15)',
  border: '#1E3324',
  radius: 20, // Large rounded corners
};

export default {
  light: {
    ...colors,
    foreground: colors.text,
    cardForeground: colors.text,
    primaryForeground: colors.background,
    secondary: colors.cardSecondary,
    secondaryForeground: colors.text,
    mutedForeground: colors.muted,
    accent: colors.gold,
    accentForeground: colors.background,
    destructive: colors.danger,
    destructiveForeground: colors.text,
    input: colors.border,
  },
  radius: colors.radius,
};
