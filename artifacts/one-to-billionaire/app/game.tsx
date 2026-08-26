import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, SlideInRight, SlideOutLeft, Layout } from 'react-native-reanimated';

import { useGame, GameStatus } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { colors } from '../constants/colors';
import { SCENARIOS, Scenario, Choice } from '../constants/scenarios';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ProgressBar } from '../components/ProgressBar';
import { formatMoney } from '../lib/utils';

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, netWorth, passiveIncome, makeChoice } = useGame();
  const { settings } = useSettings();
  
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [lastOutcome, setLastOutcome] = useState<{
    text: string, change: number, riskChange: number, status: GameStatus
  } | null>(null);

  useEffect(() => {
    if (!gameState) {
      router.replace('/');
      return;
    }
    const validScenarios = SCENARIOS.filter(
      (s) => netWorth >= s.minNetWorth && netWorth <= s.maxNetWorth
    );
    
    if (validScenarios.length > 0) {
      const randomS = validScenarios[Math.floor(Math.random() * validScenarios.length)];
      setCurrentScenario(randomS);
    } else {
      setCurrentScenario(SCENARIOS[0]);
    }
  }, [gameState?.day, netWorth]); // include netWorth to ensure safe re-rolls

  if (!gameState || !currentScenario) return null;

  const handleChoice = (choice: Choice) => {
    const result = makeChoice(choice);
    if (result) {
      setLastOutcome({
        text: result.outcome.text,
        change: result.actualChange,
        riskChange: result.outcome.riskChange,
        status: result.status
      });
    }
  };

  const handleNext = () => {
    if (lastOutcome?.status === 'bankrupt') {
      router.replace('/bankruptcy');
    } else if (lastOutcome?.status === 'victory') {
      router.replace('/victory');
    } else {
      setLastOutcome(null);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk < 30) return colors.primary;
    if (risk < 70) return colors.gold;
    return colors.danger;
  };

  const AnimatedView = settings.reducedMotion ? View : Animated.View;
  const slideProps = settings.reducedMotion ? {} : { 
    entering: SlideInRight, 
    exiting: SlideOutLeft,
    layout: Layout.springify()
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dayText}>Day {gameState.day}</Text>
          <View style={styles.nwRow}>
            <Text style={styles.nwLabel}>Net Worth </Text>
            <AnimatedCounter style={styles.nwValue} value={netWorth} />
          </View>
        </View>
        <View style={styles.headerActions}>
          <Button 
            title="" 
            icon="business" 
            variant="secondary" 
            style={styles.iconBtn} 
            onPress={() => router.push('/empire')}
          />
          <Button 
            title="" 
            icon="home" 
            variant="secondary" 
            style={styles.iconBtn} 
            onPress={() => router.replace('/')}
          />
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Cash</Text>
          <AnimatedCounter style={styles.statValue} value={gameState.cash} format="compact" />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Passive/Day</Text>
          <AnimatedCounter style={[styles.statValue, { color: colors.primary }]} value={passiveIncome} format="compact" />
        </View>
      </View>

      <View style={styles.riskContainer}>
        <ProgressBar 
          progress={gameState.risk} 
          label={`Risk Level: ${gameState.risk < 30 ? 'Low' : gameState.risk < 70 ? 'Medium' : gameState.risk < 90 ? 'High' : 'Extreme'}`} 
          color={getRiskColor(gameState.risk)} 
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {lastOutcome ? (
          <AnimatedView key="outcome" {...slideProps} style={styles.cardWrapper}>
            <Card style={styles.scenarioCard}>
              <View style={[styles.categoryBadge, { backgroundColor: lastOutcome.change >= 0 ? colors.primaryMuted : colors.dangerMuted }]}>
                <Text style={[styles.categoryText, { color: lastOutcome.change >= 0 ? colors.primary : colors.danger }]}>OUTCOME</Text>
              </View>
              <Text style={styles.scenarioTitle}>{lastOutcome.change >= 0 ? 'Success!' : 'Ouch!'}</Text>
              <Text style={styles.scenarioDesc}>{lastOutcome.text}</Text>
              
              <View style={styles.outcomeStats}>
                <Text style={[styles.outcomeStat, { color: lastOutcome.change >= 0 ? colors.primary : colors.danger }]}>
                  {lastOutcome.change >= 0 ? '+' : ''}{formatMoney(lastOutcome.change)}
                </Text>
                {lastOutcome.riskChange !== 0 && (
                  <Text style={[styles.outcomeStat, { color: colors.gold, marginTop: 4 }]}>
                    {lastOutcome.riskChange > 0 ? '+' : ''}{lastOutcome.riskChange}% Risk
                  </Text>
                )}
              </View>
            </Card>
            <Button title="Continue" onPress={handleNext} style={styles.choiceBtn} />
          </AnimatedView>
        ) : (
          <AnimatedView key={currentScenario.id} {...slideProps} style={styles.cardWrapper}>
            <Card style={styles.scenarioCard}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{currentScenario.category.toUpperCase()}</Text>
              </View>
              <Text style={styles.scenarioTitle}>{currentScenario.title}</Text>
              <Text style={styles.scenarioDesc}>{currentScenario.description}</Text>
            </Card>

            <View style={styles.choicesContainer}>
              {currentScenario.choices.map((choice, idx) => (
                <Button
                  key={choice.id}
                  title={choice.text}
                  onPress={() => handleChoice(choice)}
                  disabled={gameState.cash < choice.cost}
                  variant={idx === 0 ? 'primary' : 'secondary'}
                  style={styles.choiceBtn}
                />
              ))}
              {currentScenario.choices.every(c => gameState.cash < c.cost) && (
                <Button
                  title="Can't afford anything (Pass day)"
                  onPress={() => handleChoice({
                    id: 'fallback_pass',
                    text: 'Pass',
                    cost: 0,
                    outcomes: [{ weight: 1, text: 'Passed the day.', cashChange: 0, riskChange: 0 }]
                  })}
                  variant="secondary"
                  style={styles.choiceBtn}
                />
              )}
            </View>
          </AnimatedView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dayText: {
    color: colors.muted,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  nwRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  nwLabel: {
    color: colors.text,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  nwValue: {
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 48,
    height: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 24,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
  riskContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardWrapper: {
    gap: 24,
  },
  scenarioCard: {
    padding: 32,
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoryText: {
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  scenarioTitle: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
  },
  scenarioDesc: {
    color: colors.muted,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  outcomeStats: {
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: colors.cardSecondary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
  },
  outcomeStat: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
  },
  choicesContainer: {
    gap: 12,
  },
  choiceBtn: {
    minHeight: 64,
  },
});