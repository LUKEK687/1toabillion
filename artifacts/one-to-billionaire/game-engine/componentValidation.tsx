import Module from 'node:module';
import React from 'react';
import FakeTimers from '@sinonjs/fake-timers';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import type { GameResult, SpecialGameDescriptor } from '../types/gameplay';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const host = (name: string) => ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) =>
  React.createElement(name, props, children);
const View = host('View');
const Text = host('Text');
const AnimatedView = host('AnimatedView');
const moduleWithLoader = Module as typeof Module & {
  _load: (request: string, parent: NodeModule | null, isMain: boolean) => unknown;
};
const originalLoad = moduleWithLoader._load;
moduleWithLoader._load = function mockedLoad(request: string, parent: NodeModule | null, isMain: boolean) {
  if (request === 'react-native') {
    return {
      View, Text, Modal: host('Modal'), TouchableOpacity: host('TouchableOpacity'),
      TouchableWithoutFeedback: host('TouchableWithoutFeedback'),
      StyleSheet: { create: (styles: unknown) => styles, absoluteFillObject: {} },
      Dimensions: { get: () => ({ width: 400, height: 720 }) },
      PanResponder: { create: (handlers: Record<string, unknown>) => ({ panHandlers: handlers }) },
    };
  }
  if (request === 'react-native-reanimated') {
    return {
      __esModule: true,
      default: { View: AnimatedView },
      useSharedValue: (value: unknown) => ({ value }),
      useAnimatedStyle: (factory: () => unknown) => factory(),
      withTiming: (value: unknown, _config?: unknown, callback?: (finished: boolean) => void) => {
        callback?.(true);
        return value;
      },
      withRepeat: (value: unknown) => value,
      withSequence: (...values: unknown[]) => values[values.length - 1],
      withSpring: (value: unknown) => value,
      runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
      cancelAnimation: () => undefined,
      Easing: { linear: 'linear', ease: 'ease', inOut: (value: unknown) => value, out: (value: unknown) => value, cubic: 'cubic' },
    };
  }
  if (request === 'react-native-svg') {
    return { __esModule: true, default: host('Svg'), Svg: host('Svg'), Circle: host('Circle'), Path: host('Path'), G: host('G'), Text: host('SvgText') };
  }
  if (request === '@expo/vector-icons') return { Ionicons: host('Ionicons') };
  if (request === 'expo-haptics') {
    return {
      impactAsync: () => Promise.resolve(), notificationAsync: () => Promise.resolve(),
      ImpactFeedbackStyle: { Light: 'Light', Heavy: 'Heavy' }, NotificationFeedbackType: { Success: 'Success' },
    };
  }
  if (request.includes('SettingsContext')) {
    return { useSettings: () => ({ settings: { haptics: false, reducedMotion: true, music: false, sounds: false } }) };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const assertEqual = (actual: unknown, expected: unknown, message: string) => {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}.`);
};
const textOf = (node: ReactTestInstance): string =>
  node.children.map((child) => typeof child === 'string' ? child : textOf(child)).join('');
const press = (root: ReactTestInstance, title: string) => {
  const button = root.findAllByType('TouchableOpacity' as React.ElementType).find((node) => textOf(node).includes(title));
  if (!button) throw new Error(`Button not found: ${title}`);
  button.props.onPress();
};
const swipe = (root: ReactTestInstance, dy: number, dx = 0) => {
  const target = root.findAll((node) => typeof node.props.onPanResponderRelease === 'function')[0];
  if (!target) throw new Error('Swipe target not found.');
  target.props.onPanResponderRelease({}, { dy, dx });
};

const main = async () => {
  const [
    { SpecialGameOverlay }, { allMiniGameFixtures },
    { MoneyDrop }, { PerfectDeal }, { SafeCrack }, { StockPanic }, { FlipIt },
    { MysteryReveal }, { LuckyWheel }, { Negotiation }, { SwipeDecisionCard }, { PassiveIncomeBurst },
  ] = await Promise.all([
    import('../components/game/SpecialGameOverlay'), import('./miniGameLogic'),
    import('../components/game/MoneyDrop'), import('../components/game/PerfectDeal'),
    import('../components/game/SafeCrack'), import('../components/game/StockPanic'),
    import('../components/game/FlipIt'), import('../components/game/MysteryReveal'),
    import('../components/game/LuckyWheel'), import('../components/game/Negotiation'),
    import('../components/game/SwipeDecisionCard'), import('../components/game/PassiveIncomeBurst'),
  ]);
  const componentByType = {
    moneyDrop: MoneyDrop, perfectDeal: PerfectDeal, safeCrack: SafeCrack, stockPanic: StockPanic,
    flipIt: FlipIt, mysteryReveal: MysteryReveal, luckyWheel: LuckyWheel, negotiation: Negotiation,
    swipeDecision: SwipeDecisionCard, passiveIncomeBurst: PassiveIncomeBurst,
  };

  for (const game of allMiniGameFixtures()) {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<SpecialGameOverlay visible game={game} onComplete={() => undefined} />);
    });
    assertEqual(renderer.root.findAllByType(componentByType[game.type]).length, 1, `${game.type} overlay routing`);
    await act(async () => renderer.unmount());
  }

  const run = async (
    game: SpecialGameDescriptor,
    interaction: (
      root: ReactTestInstance,
      clock: ReturnType<typeof FakeTimers.install>,
      step: (callback: () => void) => Promise<void>,
    ) => void | Promise<void>,
  ): Promise<GameResult[]> => {
    const results: GameResult[] = [];
    const clock = FakeTimers.install();
    let renderer!: TestRenderer.ReactTestRenderer;
    const previousRandom = Math.random;
    Math.random = () => 0;
    try {
      await act(async () => {
        renderer = TestRenderer.create(<SpecialGameOverlay visible game={game} onComplete={(result) => results.push(result)} />);
      });
      const step = async (callback: () => void) => {
        await act(async () => callback());
      };
      await interaction(renderer.root, clock, step);
      await act(async () => renderer.unmount());
      return results;
    } finally {
      Math.random = previousRandom;
      clock.uninstall();
    }
  };

  let results = await run({ type: 'moneyDrop', durationMs: 10 }, (_root, clock, step) => step(() => { clock.tick(10); }));
  assertEqual(results.length, 1, 'Money Drop timeout completion');
  assertEqual(results[0].outcome, 'failure', 'Money Drop timeout result');

  results = await run({ type: 'perfectDeal' }, (root, clock, step) => step(() => {
    press(root, 'STOP'); press(root, 'STOP'); clock.tick(1500);
  }));
  assertEqual(results.length, 1, 'Perfect Deal rapid stop');

  results = await run({ type: 'safeCrack', difficulty: 0.5 }, async (root, clock, step) => {
    await step(() => { press(root, 'TAP'); press(root, 'TAP'); });
    await step(() => { press(root, 'TAP'); press(root, 'TAP'); });
    await step(() => { press(root, 'TAP'); press(root, 'TAP'); });
    await step(() => { clock.tick(1000); });
  });
  assertEqual(results.length, 1, 'Safe Crack rapid tap');
  assertEqual(results[0].outcome, 'success', 'Safe Crack completion');

  results = await run({ type: 'stockPanic' }, (root, clock, step) => step(() => {
    press(root, 'BUY'); press(root, 'BUY'); clock.tick(6000);
  }));
  assertEqual(results.length, 1, 'Stock Panic choice-timeout race');

  results = await run({ type: 'stockPanic' }, (_root, clock, step) => step(() => { clock.tick(6000); }));
  assertEqual(results[0].outcome, 'neutral', 'Stock Panic timeout');

  results = await run({ type: 'flipIt', rounds: 3 }, async (root, clock, step) => {
    for (let index = 0; index < 3; index += 1) {
      await step(() => { swipe(root, -150); swipe(root, -150); clock.tick(300); });
    }
  });
  assertEqual(results.length, 1, 'Flip It rapid swipe');

  for (const itemRarity of ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'] as const) {
    results = await run({ type: 'mysteryReveal', itemRarity }, (root, clock, step) => step(() => {
      const box = root.findByType('TouchableWithoutFeedback' as React.ElementType);
      box.props.onPress(); box.props.onPress(); clock.tick(2000);
    }));
    assertEqual(results.length, 1, `${itemRarity} mystery one-shot`);
  }

  results = await run({ type: 'luckyWheel', options: [{ label: 'BANKRUPT', value: -999 }] }, (root, clock, step) => step(() => {
    press(root, 'SPIN'); press(root, 'SPIN'); clock.tick(1000);
  }));
  assertEqual(results[0].score, -999, 'Wheel bankruptcy');

  results = await run({ type: 'negotiation', startingPrice: 1400, targetPrice: 700 }, (root, clock, step) => step(() => {
    press(root, 'Make Offer'); press(root, 'Make Offer'); clock.tick(3000);
  }));
  assertEqual(results.length, 1, 'Negotiation rapid submit');
  assertEqual(results[0].outcome, 'success', 'Negotiation accepted');

  results = await run({ type: 'negotiation', startingPrice: 1000, targetPrice: 700 }, (root, clock, step) => step(() => {
    press(root, 'Make Offer'); clock.tick(3000);
  }));
  assertEqual(results[0].outcome, 'failure', 'Negotiation rejected');

  results = await run({ type: 'swipeDecision', title: 'Test', text: 'Choose', leftValue: -1, rightValue: 1 }, (root, clock, step) => step(() => {
    swipe(root, 0, 150); swipe(root, 0, 150); clock.tick(300);
  }));
  assertEqual(results.length, 1, 'Swipe Decision rapid swipe');

  results = await run({ type: 'passiveIncomeBurst', durationMs: 10 }, (root, clock, step) => step(() => {
    const tapArea = root.findByType('TouchableWithoutFeedback' as React.ElementType);
    for (let index = 0; index < 21; index += 1) tapArea.props.onPress();
    clock.tick(10);
  }));
  assertEqual(results.length, 1, 'Passive burst deadline');
  assertEqual(results[0].outcome, 'success', 'Passive burst success');

  console.log('Actual mini-game component interaction suite passed.');
};

void main();
