import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { SlideInRight, SlideOutLeft, Layout } from 'react-native-reanimated';

import { useGame, GameStatus } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { colors } from '../constants/colors';
import { SCENARIOS, Scenario, Choice } from '../constants/scenarios';
import { WORLD_EVENTS } from '../constants/worldEvents';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ProgressBar } from '../components/ProgressBar';
import { formatMoney } from '../lib/utils';

import { SpecialGameOverlay } from '../components/game/SpecialGameOverlay';
import { FloatingMoneyFeedback } from '../components/game/FloatingMoneyFeedback';
import { MilestoneCelebration } from '../components/game/MilestoneCelebration';
import { WorldEventBanner } from '../components/game/WorldEventBanner';
import { SwipeDecisionCard } from '../components/game/SwipeDecisionCard';
import { SpecialGameDescriptor, GameResult } from '../types/gameplay';
import { SoundManager } from '../services/SoundManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, netWorth, passiveIncome, makeChoice, applyTemporaryWorldEvent, dismissMilestone } = useGame();
  const { settings } = useSettings();
  
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [lastOutcome, setLastOutcome] = useState<{
    text: string; change: number; riskChange: number; status: GameStatus; passiveIncome: number; riskPenalty: number;
  } | null>(null);

  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const [activeMiniGame, setActiveMiniGame] = useState<SpecialGameDescriptor | null>(null);
  const [floatingMoney, setFloatingMoney] = useState<{id: string, amount: number, x: number, y: number} | null>(null);
  const [worldEventBanner, setWorldEventBanner] = useState<{id: string, title: string, impact: string, type: 'positive' | 'negative' | 'neutral', duration: number} | null>(null);
  const [showBannerId, setShowBannerId] = useState<string | null>(null);
  const [surpriseLabel, setSurpriseLabel] = useState<string | null>(null);
  const [showSurpriseEntrance, setShowSurpriseEntrance] = useState(false);
  const [useSwipeCard, setUseSwipeCard] = useState<boolean>(false);
  const [isResolving, setIsResolving] = useState(false);

  const lastMiniGameDay = useRef<number>(-1);
  const choiceLockedRef = useRef(false);
  const miniCompletionRef = useRef(false);

  useEffect(() => {
    SoundManager.configure(settings);
    SoundManager.startMusic();
    return () => SoundManager.stopMusic();
  }, [settings]);

  useEffect(() => {
    if (worldEventBanner) {
      setShowBannerId(worldEventBanner.id);
    }
  }, [worldEventBanner]);

  useEffect(() => {
    if (!surpriseLabel) {
      setShowSurpriseEntrance(false);
      return;
    }
    setShowSurpriseEntrance(true);
    const timer = setTimeout(() => setShowSurpriseEntrance(false), settings.reducedMotion ? 350 : 950);
    return () => clearTimeout(timer);
  }, [settings.reducedMotion, surpriseLabel]);

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

      if (Math.random() < 0.15) {
        const SURPRISE_LABELS = ['PHONE CALL', 'BREAKING NEWS', 'MYSTERY OFFER', 'BUSINESS EMERGENCY', 'LUCKY FIND', 'CUSTOMER ALERT'];
        setSurpriseLabel(SURPRISE_LABELS[Math.floor(Math.random() * SURPRISE_LABELS.length)]);
      } else {
        setSurpriseLabel(null);
      }
      
      if (randomS.choices.length === 2 && randomS.choices[1].cost === 0 && gameState.cash >= randomS.choices[0].cost && Math.random() < 0.5) {
        setUseSwipeCard(true);
      } else {
        setUseSwipeCard(false);
      }
      
      if (gameState.activeWorldEvents.length === 0 && Math.random() < 0.1) {
        const event = WORLD_EVENTS[Math.floor(Math.random() * WORLD_EVENTS.length)];
        applyTemporaryWorldEvent(event);
        setWorldEventBanner({ 
          id: Date.now().toString(), 
          title: event.name, 
          impact: event.description, 
          type: event.incomeMultiplier > 1 ? 'positive' : 'negative',
          duration: event.remainingDays
        });
      } else if (gameState.activeWorldEvents.length === 0) {
        setWorldEventBanner(null);
      }
    } else {
      setCurrentScenario(SCENARIOS[0]);
    }
  }, [gameState?.day, netWorth]); 

  const executeChoice = (choice: Choice, extraCash: number = 0, extraText: string = '', extraRisk: number = 0) => {
    let modifiedChoice = choice;
    if (extraCash !== 0 || extraText !== '' || extraRisk !== 0) {
      modifiedChoice = {
        ...choice,
        outcomes: choice.outcomes.map((outcome) => ({
          ...outcome,
          text: (extraText ? `${extraText} ` : '') + outcome.text,
          cashChange: outcome.cashChange + extraCash,
          riskChange: outcome.riskChange + extraRisk,
        })),
      };
    }

    const result = makeChoice(modifiedChoice, `${gameState?.day}:${currentScenario?.id ?? 'event'}:${choice.id}`);
    if (result) {
      SoundManager.play(result.actualChange >= 0 ? 'gain' : 'loss');
      if ((gameState?.combo ?? 0) >= 1 && result.actualChange > 0) {
        setTimeout(() => SoundManager.play(gameState!.combo >= 4 ? 'jackpot' : 'coins'), 200);
      }
      setLastOutcome({
        text: result.outcome.text,
        change: result.actualChange,
        riskChange: result.outcome.riskChange,
        status: result.status,
        passiveIncome: result.passiveIncome,
        riskPenalty: result.riskPenalty
      });
      if (result.actualChange !== 0) {
        setFloatingMoney({
          id: Date.now().toString(),
          amount: result.actualChange,
          x: SCREEN_WIDTH / 2 - 60,
          y: SCREEN_HEIGHT / 2 - 50
        });
      }
    } else {
      choiceLockedRef.current = false;
      setIsResolving(false);
    }
  };

  const handleChoice = (choice: Choice) => {
    if (choiceLockedRef.current) return;
    choiceLockedRef.current = true;
    setIsResolving(true);
    SoundManager.play('tap');
    if (choice.id !== 'fallback_pass' && Math.random() < 0.20 && gameState!.day > lastMiniGameDay.current + 1) {
      let game: SpecialGameDescriptor | null = null;
      const rand = Math.random();
      
      if (passiveIncome > 0 && rand < 0.15) {
         game = { type: 'passiveIncomeBurst', durationMs: 5000 };
      } else if (choice.cost > 0 && rand < 0.4) {
         if (Math.random() < 0.5) {
            game = { type: 'negotiation', startingPrice: choice.cost, targetPrice: Math.floor(choice.cost * 0.7) };
         } else {
            game = { type: 'perfectDeal' };
         }
      } else if (currentScenario?.category === 'business') {
         game = { type: 'flipIt', rounds: 3 };
      } else if (currentScenario?.category === 'investment') {
         game = { type: 'stockPanic' };
      } else if (currentScenario?.category === 'random') {
          if (Math.random() < 0.5) {
            const roll = Math.random();
            const itemRarity = roll < .38 ? 'common' : roll < .65 ? 'uncommon' : roll < .82 ? 'rare' : roll < .93 ? 'epic' : roll < .985 ? 'legendary' : 'mythic';
            game = { type: 'mysteryReveal', itemRarity };
          }
         else game = { 
           type: 'luckyWheel', 
           options: [
              {label: '+10%', value: Math.max(10, Math.floor(netWorth * .10))},
              {label: '+25%', value: Math.max(25, Math.floor(netWorth * .25))},
              {label: '+50%', value: Math.max(50, Math.floor(netWorth * .50))},
              {label: '-15%', value: -Math.max(1, Math.floor(netWorth * .15))},
              {label: 'BANKRUPT', value: -Math.max(2, gameState!.cash + passiveIncome + 1)},
           ] 
         };
      } else if (currentScenario?.category === 'asset') {
         game = { type: 'safeCrack', difficulty: Math.min(0.9, netWorth / 10000000) };
      } else {
         game = { type: 'moneyDrop', durationMs: 5000 };
      }

      if (game) {
        SoundManager.play(game.type === 'luckyWheel' ? 'wheelSpin' : game.type === 'mysteryReveal' ? 'mysteryShake' : 'swipe');
        lastMiniGameDay.current = gameState!.day;
        miniCompletionRef.current = false;
        setPendingChoice(choice);
        setActiveMiniGame(game);
        return;
      }
    }

    executeChoice(choice);
  };

  const handleMiniGameComplete = (result: GameResult) => {
    if (miniCompletionRef.current) return;
    miniCompletionRef.current = true;
    const gameType = activeMiniGame?.type;
    setActiveMiniGame(null);
    
    let cashChange = 0;
    let text = '';
    
    if (gameType === 'luckyWheel') {
      cashChange = result.score;
      text = cashChange >= 0 ? '[Wheel Won]' : '[Wheel Lost]';
    } else if (gameType === 'negotiation') {
      if (result.outcome === 'success') {
         cashChange = pendingChoice!.cost - Math.abs(result.score);
         text = `[Negotiated Price: $${Math.abs(result.score)}]`;
      } else if (result.outcome === 'walked') {
         cashChange = 0;
         text = `[Walked Away]`;
      } else {
         cashChange = 0;
         text = `[Negotiation Failed]`;
      }
    } else {
      let fraction = 0;
      if (result.outcome === 'success' || result.outcome === 'perfect') {
        fraction = 0.02 + Math.min(0.1, result.score / 10000); 
      } else if (result.outcome === 'failure') {
        fraction = -0.05;
      }
      
      fraction *= result.multiplier;
      fraction = Math.max(-0.2, Math.min(0.2, fraction));
      
      cashChange = Math.floor(netWorth * fraction);
      if (cashChange > 0 && cashChange < 500) cashChange = 500 + result.score;
      if (cashChange < 0 && cashChange > -100) cashChange = -100 - result.score;
      
      if (result.outcome === 'success' || result.outcome === 'perfect') {
        text = `[Event Success]`;
      } else if (result.outcome === 'walked') {
        text = `[Walked Away]`;
        cashChange = 0;
      } else {
        text = `[Event Failed]`;
      }
    }

    if (pendingChoice) {
      if (result.outcome === 'walked') {
        executeChoice({
          id: `${pendingChoice.id}_walked`,
          text: 'Walk away',
          cost: 0,
          outcomes: [{ weight: 1, text: `${text} You keep your cash and move on.`, cashChange: 0, riskChange: -2 }],
        });
      } else {
        executeChoice(pendingChoice, cashChange, text, result.outcome === 'failure' ? 5 : 0);
      }
      setPendingChoice(null);
    } else {
      executeChoice({
        id: 'minigame_fallback',
        text: 'Event',
        cost: 0,
        outcomes: [{ weight: 1, text, cashChange, riskChange: 0 }]
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
      choiceLockedRef.current = false;
      miniCompletionRef.current = false;
      setIsResolving(false);
    }
  };

  if (!gameState || !currentScenario) return null;

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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} testID="game-screen">
      {floatingMoney && (
        <FloatingMoneyFeedback
          key={floatingMoney.id}
          amount={floatingMoney.amount}
          x={floatingMoney.x}
          y={floatingMoney.y}
          onComplete={() => setFloatingMoney(null)}
        />
      )}

      {worldEventBanner && showBannerId === worldEventBanner.id && (
        <WorldEventBanner
          key={worldEventBanner.id}
          title={worldEventBanner.title}
          impact={`${worldEventBanner.impact} (${worldEventBanner.duration} days left)`}
          type={worldEventBanner.type}
          onComplete={() => setShowBannerId(null)}
        />
      )}

      {showSurpriseEntrance && surpriseLabel && (
        <Animated.View
          entering={settings.reducedMotion ? undefined : SlideInRight.duration(240)}
          exiting={settings.reducedMotion ? undefined : SlideOutLeft.duration(220)}
          style={styles.surpriseEntrance}
          pointerEvents="none"
          testID="surprise-entrance"
        >
          <Text style={styles.surpriseKicker}>SURPRISE EVENT</Text>
          <Text style={styles.surpriseTitle}>{surpriseLabel}</Text>
        </Animated.View>
      )}

      {gameState.milestoneQueue.length > 0 && (
        <MilestoneCelebration 
          key={gameState.milestoneQueue[0].id}
          title={gameState.milestoneQueue[0].title}
          subtitle="Congratulations on reaching a new milestone!"
          onComplete={() => dismissMilestone()}
        />
      )}

      <SpecialGameOverlay 
        visible={!!activeMiniGame}
        game={activeMiniGame}
        onComplete={handleMiniGameComplete}
        testID="special-game-overlay"
      />

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
            testID="btn-empire"
          />
          <Button 
            title="" 
            icon="home" 
            variant="secondary" 
            style={styles.iconBtn} 
            onPress={() => router.replace('/')}
            testID="btn-home"
          />
        </View>
      </View>

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
                  <Text style={[styles.outcomeStat, styles.outcomeStatSub, { color: colors.gold }]}>
                    {lastOutcome.riskChange > 0 ? '+' : ''}{lastOutcome.riskChange}% Risk
                  </Text>
                )}
                {lastOutcome.passiveIncome > 0 && (
                  <Text style={[styles.outcomeStat, styles.outcomeStatSub, { color: colors.primary }]}>
                    +{formatMoney(lastOutcome.passiveIncome)} Passive/Day
                  </Text>
                )}
                {lastOutcome.riskPenalty > 0 && (
                  <Text style={[styles.outcomeStat, styles.outcomeStatSub, { color: colors.danger }]}>
                    -{formatMoney(lastOutcome.riskPenalty)} Risk Penalty
                  </Text>
                )}
                {(gameState?.combo || 0) > 1 && (
                  <Text style={[styles.outcomeStat, styles.outcomeCombo]}>
                    COMBO x{gameState.combo}!
                  </Text>
                )}
              </View>
            </Card>
            <Button title="Continue" onPress={handleNext} style={styles.choiceBtn} testID="btn-continue" />
          </AnimatedView>
        ) : useSwipeCard && !activeMiniGame ? (
          <AnimatedView key={currentScenario.id} {...slideProps} style={styles.cardWrapper}>
            {surpriseLabel && (
              <View style={[styles.categoryBadge, { backgroundColor: colors.gold, alignSelf: 'center' }]}>
                <Text style={[styles.categoryText, { color: colors.background }]}>{surpriseLabel}</Text>
              </View>
            )}
            <SwipeDecisionCard 
              title={currentScenario.title}
              text={currentScenario.description}
              leftValue={1}
              rightValue={0}
              onComplete={(res) => handleChoice(currentScenario.choices[res.score])}
              testID="swipe-decision-card"
            />
          </AnimatedView>
        ) : (
          <AnimatedView key={currentScenario.id} {...slideProps} style={styles.cardWrapper}>
            <Card style={styles.scenarioCard}>
              {surpriseLabel && (
                <View style={[styles.categoryBadge, { backgroundColor: colors.gold, marginBottom: 12 }]}>
                  <Text style={[styles.categoryText, { color: colors.background }]}>{surpriseLabel}</Text>
                </View>
              )}
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
                  disabled={gameState.cash < choice.cost || isResolving || !!activeMiniGame || !!pendingChoice}
                  variant={idx === 0 ? 'primary' : 'secondary'}
                  style={styles.choiceBtn}
                  testID={`btn-choice-${choice.id}`}
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
                  testID="btn-choice-fallback"
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
  surpriseEntrance: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1200,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  surpriseKicker: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.gold,
    letterSpacing: 3,
    marginBottom: 14,
  },
  surpriseTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 1,
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
  outcomeStatSub: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginTop: 4,
  },
  outcomeCombo: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginTop: 8,
    color: colors.gold,
  },
  choicesContainer: {
    gap: 12,
  },
  choiceBtn: {
    minHeight: 64,
  },
});