import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlipIt } from '../components/game/FlipIt';
import { MoneyDrop } from '../components/game/MoneyDrop';
import { MysteryReveal } from '../components/game/MysteryReveal';
import { SwipeDecisionCard } from '../components/game/SwipeDecisionCard';
import { colors } from '../constants/colors';
import type { GameResult } from '../types/gameplay';

type Stage = 'tap' | 'horizontal' | 'vertical' | 'timer' | 'complete';

const MIN_DELAYS: Partial<Record<Stage, number>> = {
  tap: 1800,
  horizontal: 250,
  vertical: 250,
  timer: 900,
};

export default function AndroidSmokeScreen() {
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>('tap');
  const [status, setStatus] = useState('running');
  const startedAt = useRef(Date.now());

  const begin = useCallback((next: Stage) => {
    startedAt.current = Date.now();
    setStatus('running');
    setStage(next);
  }, []);

  const complete = useCallback((current: Stage, next: Stage) => (_result: GameResult) => {
    const elapsed = Date.now() - startedAt.current;
    const minimum = MIN_DELAYS[current] ?? 0;
    if (elapsed < minimum) {
      setStatus(`failed-delay-${current}-${elapsed}ms`);
      return;
    }
    setStatus(`passed-${current}`);
    setTimeout(() => begin(next), 150);
  }, [begin]);

  if (stage === 'complete') {
    return (
      <View
        style={[styles.result, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        testID="android-smoke-complete"
      >
        <Text style={styles.resultTitle}>ANDROID SMOKE PASSED</Text>
        <Text style={styles.resultBody}>Tap, swipe thresholds, delayed animations, and timer completion passed.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.status} pointerEvents="none">
        <Text style={styles.statusText} testID="android-smoke-stage">
          {stage}:{status}
        </Text>
      </View>

      {stage === 'tap' && (
        <MysteryReveal
          itemRarity="rare"
          onComplete={complete('tap', 'horizontal')}
          testID="android-smoke-tap"
        />
      )}
      {stage === 'horizontal' && (
        <SwipeDecisionCard
          title="Android Swipe Threshold"
          text="A short swipe must reset. A long swipe must complete after its animation."
          leftValue={-1}
          rightValue={1}
          onComplete={complete('horizontal', 'vertical')}
          testID="android-smoke-horizontal"
        />
      )}
      {stage === 'vertical' && (
        <FlipIt
          rounds={1}
          onComplete={complete('vertical', 'timer')}
          testID="android-smoke-vertical"
        />
      )}
      {stage === 'timer' && (
        <MoneyDrop
          durationMs={1000}
          onComplete={complete('timer', 'complete')}
          testID="android-smoke-timer"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  status: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
    paddingTop: 4,
  },
  statusText: {
    color: colors.muted,
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  result: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.background,
  },
  resultTitle: {
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    textAlign: 'center',
  },
  resultBody: {
    marginTop: 16,
    color: colors.text,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});