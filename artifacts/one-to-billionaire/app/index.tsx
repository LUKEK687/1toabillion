import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { formatCompactMoney } from '../lib/utils';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, startGame, netWorth } = useGame();
  const { settings } = useSettings();

  const handleStart = () => {
    if (gameState) {
      router.push('/game');
    } else {
      startGame();
    }
  };

  const TopView = settings.reducedMotion ? View : Animated.View;
  const bottomProps = settings.reducedMotion ? {} : { entering: FadeInDown.delay(200).springify() };
  const topProps = settings.reducedMotion ? {} : { entering: FadeInUp.springify() };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <TopView {...topProps} style={styles.titleContainer}>
          <Text style={styles.superTitle}>$1 TO</Text>
          <Text style={styles.title}>BILLIONAIRE</Text>
        </TopView>
        <Image 
          source={require('../assets/images/icon_2.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </View>

      <TopView {...bottomProps} style={styles.actions}>
        {gameState ? (
          <View style={styles.continueContainer}>
            <Text style={styles.continueText}>Current Net Worth: {formatCompactMoney(netWorth)}</Text>
            <Button
              title="Continue Empire"
              onPress={handleStart}
              icon="play"
              style={styles.mainButton}
            />
            <Button
              title="Start Over"
              variant="secondary"
              onPress={startGame}
              icon="refresh"
              style={{ marginTop: 12 }}
            />
          </View>
        ) : (
          <Button
            title="Start Your Journey"
            onPress={handleStart}
            icon="play"
            style={styles.mainButton}
          />
        )}

        <View style={styles.grid}>
          <Button
            title="Stats"
            variant="secondary"
            onPress={() => router.push('/profile')}
            icon="stats-chart"
            style={styles.gridButton}
          />
          <Button
            title="Trophies"
            variant="secondary"
            onPress={() => router.push('/achievements')}
            icon="trophy"
            style={styles.gridButton}
          />
        </View>

        <Button
          title="Settings"
          variant="ghost"
          onPress={() => router.push('/settings')}
          icon="settings-outline"
        />
      </TopView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  superTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: -8,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
    color: colors.text,
    letterSpacing: -1,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 40,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  mainButton: {
    height: 64,
  },
  continueContainer: {
    marginBottom: 8,
  },
  continueText: {
    color: colors.muted,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  gridButton: {
    flex: 1,
  },
});
