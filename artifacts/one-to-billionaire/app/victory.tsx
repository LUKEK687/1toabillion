import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Share, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { colors } from '../constants/colors';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Confetti } from '../components/Confetti';
import { formatMoney } from '../lib/utils';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import * as Haptics from 'expo-haptics';

export default function VictoryScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, endGame } = useGame();
  const { settings } = useSettings();

  useEffect(() => {
    if (settings.haptics) {
      const interval = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [settings.haptics]);

  if (!gameState) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just beat $1 to Billionaire in ${gameState.day} days! Think you can do it faster?`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const AnimatedView = settings.reducedMotion ? View : Animated.View;
  const animProps = settings.reducedMotion ? {} : { entering: FadeInDown.delay(300).springify() };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      {!settings.reducedMotion && <Confetti />}
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Ionicons name="trophy" size={80} color={colors.gold} />
          <Text style={styles.title}>BILLIONAIRE</Text>
          <Text style={styles.subtitle}>You actually did it.</Text>
        </View>

        <AnimatedView {...animProps}>
          <Card style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Days to 1B</Text>
              <Text style={styles.statValue}>{gameState.day}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Biggest Win</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>+{formatMoney(gameState.runStats.biggestWin)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Businesses Owned</Text>
              <Text style={styles.statValue}>{gameState.businesses.length}</Text>
            </View>
          </Card>
        </AnimatedView>

        <View style={styles.actions}>
          <Button
            title="Share Victory"
            icon="share-social"
            onPress={handleShare}
            style={styles.mainBtn}
          />
          <Button
            title="Retire (Main Menu)"
            icon="home"
            variant="secondary"
            onPress={() => endGame(true)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: colors.gold,
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    marginTop: 16,
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.text,
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    marginTop: 8,
  },
  statsCard: {
    padding: 24,
    marginBottom: 40,
    borderColor: colors.gold,
    borderWidth: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  statValue: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  actions: {
    gap: 16,
  },
  mainBtn: {
    height: 64,
    backgroundColor: colors.gold,
  },
});