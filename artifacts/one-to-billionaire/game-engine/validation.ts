import { WORLD_EVENTS } from '../constants/worldEvents';
import type { Rarity } from '../types/gameplay';
import { addHolding, applyWorldEvent, defaultEngineState, getPassiveIncome, resolveChoice, upgradeHolding } from './index';
import {
  allMiniGameFixtures, circularDistance, createCompletionGate, createDeterministicMiniGameSession, flipResult, flipRoundScore,
  moneyDropResult, MYSTERY_ITEMS, mysteryResult, negotiationOutcome, negotiationResult,
  passiveBurstResult, perfectDealResult, safeCrackHit, stockPanicResult, swipeDirection,
  wheelIndex, wheelResult,
} from './miniGameLogic';
import { runEngineSimulation } from './simulation';

const assertEqual = (actual: unknown, expected: unknown, message?: string) => {
  if (actual !== expected) throw new Error(message || `Expected ${String(expected)}, received ${String(actual)}.`);
};
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const assertThrows = (callback: () => void) => {
  try {
    callback();
  } catch {
    return;
  }
  throw new Error('Expected callback to throw.');
};

const runMiniGameRegressionSuite = (): true => {
  const launched = new Set(allMiniGameFixtures().map((game) => game.type));
  assertEqual(JSON.stringify([...launched].sort()), JSON.stringify([
    'flipIt', 'luckyWheel', 'moneyDrop', 'mysteryReveal', 'negotiation',
    'passiveIncomeBurst', 'perfectDeal', 'safeCrack', 'stockPanic', 'swipeDecision',
  ]));

  assertEqual(moneyDropResult(100).outcome, 'success');
  assertEqual(moneyDropResult(-50).outcome, 'failure');
  assertEqual(moneyDropResult(0).outcome, 'failure');

  assertEqual(perfectDealResult(0.5).outcome, 'perfect');
  assertEqual(perfectDealResult(0.55, 0).outcome, 'success');
  assertEqual(perfectDealResult(0.9).outcome, 'failure');

  assertEqual(circularDistance(359, 1), 2);
  assertEqual(safeCrackHit(359, 1, 1), true);
  assertEqual(safeCrackHit(180, 1, 1), false);

  assertEqual(stockPanicResult('buy', 100, 110).outcome, 'success');
  assertEqual(stockPanicResult('buy', 100, 90).outcome, 'failure');
  assertEqual(stockPanicResult('sell', 100, 90).outcome, 'success');
  assertEqual(stockPanicResult('sell', 100, 110).outcome, 'failure');
  assertEqual(stockPanicResult(null, 100, 200).outcome, 'neutral');

  assertEqual(flipRoundScore(0, true), 300);
  assertEqual(flipRoundScore(1, true), -900);
  assertEqual(flipRoundScore(2, false), 0);
  assertEqual(flipResult(300).outcome, 'success');
  assertEqual(flipResult(-1).outcome, 'failure');

  for (const rarity of Object.keys(MYSTERY_ITEMS) as Rarity[]) {
    const result = mysteryResult(rarity);
    assertEqual(result.outcome, 'success');
    assertEqual(result.bonus, Math.round(MYSTERY_ITEMS[rarity].score * 0.25));
  }

  assertEqual(wheelIndex(2, () => 0), 0);
  assertEqual(wheelIndex(2, () => 0.999), 1);
  assertThrows(() => wheelIndex(0, () => 0));
  assertEqual(wheelResult(100).outcome, 'success');
  assertEqual(wheelResult(0).outcome, 'failure');
  assertEqual(wheelResult(-1_000).outcome, 'failure');

  assertEqual(negotiationOutcome(700, 700), 'accepted');
  assertEqual(negotiationOutcome(560, 700), 'counter');
  assertEqual(negotiationOutcome(559, 700), 'rejected');
  assertEqual(negotiationResult('accepted', 700).score, -700);
  assertEqual(negotiationResult('rejected', 500).outcome, 'failure');

  assertEqual(passiveBurstResult(21).outcome, 'success');
  assertEqual(passiveBurstResult(20).outcome, 'neutral');
  assertEqual(passiveBurstResult(0).score, 0);

  assertEqual(swipeDirection(101, 400), 'right');
  assertEqual(swipeDirection(-101, 400), 'left');
  assertEqual(swipeDirection(100, 400), null);

  const gate = createCompletionGate();
  let completions = 0;
  for (let index = 0; index < 100; index += 1) gate.tryComplete(() => { completions += 1; });
  assertEqual(completions, 1, 'Rapid input must complete exactly once.');

  const runSession = (game: ReturnType<typeof allMiniGameFixtures>[number], actions: Parameters<ReturnType<typeof createDeterministicMiniGameSession>['act']>[0][]) => {
    const results: ReturnType<typeof moneyDropResult>[] = [];
    const session = createDeterministicMiniGameSession(game, (result) => results.push(result));
    for (const action of actions) session.act(action);
    for (const action of actions) session.act(action);
    assertEqual(results.length, 1, `${game.type} must complete exactly once under duplicate rapid input.`);
    return results[0];
  };

  const fixtures = allMiniGameFixtures();
  assertEqual(runSession(fixtures.find((game) => game.type === 'moneyDrop')!, [
    { type: 'score', value: 100 }, { type: 'timeout' },
  ]).outcome, 'success');
  assertEqual(runSession({ type: 'moneyDrop' }, [{ type: 'timeout' }]).outcome, 'failure');
  assertEqual(runSession({ type: 'perfectDeal' }, [{ type: 'tap', position: 0.5 }]).outcome, 'perfect');
  assertEqual(runSession({ type: 'safeCrack' }, [{ type: 'tap', position: 10 }, { type: 'tap', position: 120 }, { type: 'tap', position: 250 }]).outcome, 'success');
  assertEqual(runSession({ type: 'safeCrack' }, [{ type: 'tap', position: 180 }]).outcome, 'failure');
  assertEqual(runSession({ type: 'stockPanic' }, [{ type: 'choose', choice: 'buy', start: 100, end: 110 }, { type: 'timeout' }]).outcome, 'success');
  assertEqual(runSession({ type: 'stockPanic' }, [{ type: 'timeout' }, { type: 'choose', choice: 'buy', start: 100, end: 110 }]).outcome, 'neutral');
  assertEqual(runSession({ type: 'flipIt', rounds: 3 }, [{ type: 'swipe', distance: -150 }, { type: 'swipe', distance: 150 }, { type: 'swipe', distance: -150 }]).outcome, 'success');
  for (const rarity of Object.keys(MYSTERY_ITEMS) as Rarity[]) {
    assertEqual(runSession({ type: 'mysteryReveal', itemRarity: rarity }, [{ type: 'tap' }]).score, MYSTERY_ITEMS[rarity].score);
  }
  assertEqual(runSession({ type: 'luckyWheel', options: [{ label: 'win', value: 10 }, { label: 'BANKRUPT', value: -999 }] }, [{ type: 'spin', rng: () => 0.99 }]).score, -999);
  assertEqual(runSession({ type: 'negotiation', startingPrice: 1000, targetPrice: 700 }, [{ type: 'choose', choice: null, offer: 700 }]).outcome, 'success');
  assertEqual(runSession({ type: 'negotiation', startingPrice: 1000, targetPrice: 700 }, [{ type: 'choose', choice: null, offer: 500 }]).outcome, 'failure');
  assertEqual(runSession({ type: 'negotiation', startingPrice: 1000, targetPrice: 700 }, [{ type: 'walkAway' }]).outcome, 'walked');
  assertEqual(runSession({ type: 'swipeDecision', title: 'Test', text: 'Test', leftValue: -1, rightValue: 1 }, [{ type: 'swipe', distance: 150 }]).score, 1);
  assertEqual(runSession({ type: 'passiveIncomeBurst' }, [{ type: 'tap', count: 21 }, { type: 'timeout' }]).outcome, 'success');
  assertEqual(runSession({ type: 'passiveIncomeBurst' }, [{ type: 'tap', count: 20 }, { type: 'timeout' }]).outcome, 'neutral');
  return true;
};

const runReleaseRegressions = (): true => {
  let state = addHolding({ ...defaultEngineState(), cash: 100_000 }, 'vending_machine');
  const beforeIncome = getPassiveIncome(state);
  const upgraded = upgradeHolding(state, 'vending_machine');
  assertEqual(upgraded.upgraded, true);
  assertEqual(getPassiveIncome(upgraded.state), beforeIncome * 2);

  const event = { ...WORLD_EVENTS[0], remainingDays: 1 };
  state = applyWorldEvent(upgraded.state, event);
  const resolved = resolveChoice(state, {
    id: 'expire-event', text: 'Wait', cost: 0,
    outcomes: [{ weight: 1, text: 'waited', cashChange: 0, riskChange: 0 }],
  }, () => 0.5, 'expire-event');
  assert(resolved, 'Choice should resolve.');
  assertEqual(resolved.state.activeWorldEvents.length, 0, 'World event must expire at its deadline.');
  return true;
};

runEngineSimulation();
runMiniGameRegressionSuite();
runReleaseRegressions();
console.log('Engine simulation and deterministic mini-game regression suite passed.');
