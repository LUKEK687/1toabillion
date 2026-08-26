import React, { useState } from 'react';
import { View, StyleSheet, Text, Share, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { colors } from '../constants/colors';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { formatMoney } from '../lib/utils';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';
import { AdService } from '../services/AdService';

export default function BankruptcyScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, useSecondChance, endGame } = useGame();
  const { settings } = useSettings();
  const [loadingAd, setLoadingAd] = useState(false);

  if (!gameState) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I survived ${gameState.day} days and reached a peak net worth of ${formatMoney(gameState.runStats.peakNetWorth)} before going bankrupt in $1 to Billionaire! Can you do better?`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleSecondChance = async () => {
    setLoadingAd(true);
    const success = await AdService.showRewardedAd();
    setLoadingAd(false);
    if (success) {
      useSecondChance();
    }
  };

  const AnimatedView = settings.reducedMotion ? View : Animated.View;
  const animProps = settings.reducedMotion ? {} : { entering: FadeInDown.delay(300).springify() };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Ionicons name="skull" size={64} color={colors.danger} />
          <Text style={styles.title}>BANKRUPT</Text>
          <Text style={styles.subtitle}>You ran out of cash.</Text>
        </View>

        <AnimatedView {...animProps}>
          <Card style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Days Survived</Text>
              <Text style={styles.statValue}>{gameState.day}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Peak Net Worth</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{formatMoney(gameState.runStats.peakNetWorth)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Biggest Win</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>+{formatMoney(gameState.runStats.biggestWin)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Biggest Loss</Text>
              <Text style={[styles.statValue, { color: colors.danger }]}>{formatMoney(gameState.runStats.biggestLoss)}</Text>
            </View>
          </Card>
        </AnimatedView>

        <View style={styles.actions}>
          <Button
            title={loadingAd ? "Watching Ad..." : "Second Chance (Watch Ad)"}
            icon={loadingAd ? "time-outline" : "play-circle-outline"}
            onPress={handleSecondChance}
            disabled={loadingAd}
            style={styles.mainBtn}
          />
          <View style={styles.row}>
            <Button
              title="Share"
              icon="share-social"
              variant="secondary"
              onPress={handleShare}
              style={styles.halfBtn}
            />
            <Button
              title="Give Up"
              icon="close"
              variant="danger"
              onPress={() => endGame(false)}
              style={styles.halfBtn}
            />
          </View>
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
    color: colors.danger,
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    marginTop: 16,
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    marginTop: 8,
  },
  statsCard: {
    padding: 24,
    marginBottom: 40,
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
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfBtn: {
    flex: 1,
  },
});