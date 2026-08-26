import { BUSINESSES } from '../constants/businesses';
import type { Choice, Outcome } from '../constants/scenarios';
import { clamp } from '../lib/utils';
import type { BonusResult, ChoiceResolution, EngineGameState, GameStatus, RNG, TemporaryWorldEvent } from './types';

export const SAVE_VERSION = 2;
const milestones = [100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000];
export const defaultEngineState = (): EngineGameState => ({ version: SAVE_VERSION, cash: 1, day: 1, risk: 0, businesses: [], holdings: {}, debt: 0, runStats: { peakNetWorth: 1, biggestWin: 0, biggestLoss: 0, businessesPurchased: 0, decisionsMade: 0 }, achievements: [], combo: 0, bestCombo: 0, milestoneQueue: [], activeWorldEvents: [] });

export const chooseWeightedOutcome = (outcomes: Outcome[], rng: RNG = Math.random): Outcome => {
  if (!outcomes.length) throw new Error('A choice must contain at least one outcome.');
  const total = outcomes.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  let cursor = rng() * (total || outcomes.length);
  for (const outcome of outcomes) {
    cursor -= total ? Math.max(0, outcome.weight) : 1;
    if (cursor < 0) return outcome;
  }
  return outcomes[outcomes.length - 1];
};

export const normalizeChoiceChange = (choice: Choice, outcome: Outcome, cashBefore: number): number => {
  const raw = outcome.isMultiplier ? Math.round(cashBefore * (outcome.cashChange - 1)) : outcome.cashChange;
  // Old content encoded acquisition costs in both cost and cashChange. Charge it once.
  return choice.cost > 0 && raw === -choice.cost ? 0 : raw;
};

export const getPassiveIncome = (state: Pick<EngineGameState, 'businesses' | 'holdings' | 'activeWorldEvents'>): number => {
  const multiplier = state.activeWorldEvents.reduce((n, event) => n * event.incomeMultiplier, 1);
  return Math.floor(Object.values(state.holdings).reduce((total, holding) => total + (BUSINESSES[holding.id]?.dailyIncome || 0) * holding.level, 0) * multiplier);
};
export const getNetWorth = (state: EngineGameState): number => state.cash + Object.values(state.holdings).reduce((total, h) => total + (BUSINESSES[h.id]?.dailyIncome || 0) * h.level * 100, 0) - state.debt;

export const addHolding = (state: EngineGameState, id: string): EngineGameState => {
  if (!BUSINESSES[id] || state.holdings[id]) return state;
  return { ...state, businesses: [...state.businesses, id], holdings: { ...state.holdings, [id]: { id, level: 1 } }, runStats: { ...state.runStats, businessesPurchased: state.runStats.businessesPurchased + 1 } };
};
export const removeHolding = (state: EngineGameState, id: string): EngineGameState => {
  if (!state.holdings[id]) return state;
  const { [id]: removed, ...holdings } = state.holdings;
  return { ...state, businesses: state.businesses.filter((business) => business !== id), holdings };
};
export const upgradeCost = (id: string, level: number): number => Math.floor((BUSINESSES[id]?.dailyIncome || 0) * 100 * Math.pow(2, Math.max(0, level - 1)));
export const upgradeHolding = (state: EngineGameState, id: string): { state: EngineGameState; cost: number; upgraded: boolean } => {
  const holding = state.holdings[id];
  const cost = holding ? upgradeCost(id, holding.level) : 0;
  if (!holding || state.cash < cost) return { state, cost, upgraded: false };
  return { cost, upgraded: true, state: { ...state, cash: state.cash - cost, holdings: { ...state.holdings, [id]: { ...holding, level: holding.level + 1 } } } };
};

export const applyWorldEvent = (state: EngineGameState, event: TemporaryWorldEvent): EngineGameState => ({ ...state, activeWorldEvents: [...state.activeWorldEvents.filter((current) => current.id !== event.id), event], risk: clamp(state.risk + event.riskDelta, 0, 100) });
export const resolveChoice = (input: EngineGameState, choice: Choice, rng: RNG = Math.random, actionId?: string): ChoiceResolution | null => {
  if (actionId && input.lastActionId === actionId) return null;
  const outcome = chooseWeightedOutcome(choice.outcomes, rng);
  const cost = Math.max(0, choice.cost);
  const change = normalizeChoiceChange(choice, outcome, input.cash - cost);
  let state: EngineGameState = { ...input, runStats: { ...input.runStats }, cash: input.cash - cost + change, risk: clamp(input.risk + outcome.riskChange, 0, 100), lastActionId: actionId };
  if (outcome.businessUnlocked) state = addHolding(state, outcome.businessUnlocked);
  if (outcome.businessLost) state = removeHolding(state, outcome.businessLost);
  const passiveIncome = getPassiveIncome(state);
  state = { ...state, cash: state.cash + passiveIncome, day: state.day + 1, activeWorldEvents: state.activeWorldEvents.map((event) => ({ ...event, remainingDays: event.remainingDays - 1 })).filter((event) => event.remainingDays > 0) };
  const penalty = state.risk >= 80 && rng() < 0.1 ? Math.floor(Math.max(0, state.cash) * 0.5) : 0;
  state = { ...state, cash: state.cash - penalty };
  const actualChange = -cost + change + passiveIncome - penalty;
  const netWorth = getNetWorth(state);
  const newlyReached = milestones.filter((value) => value > getNetWorth(input) && value <= netWorth).map((netWorth) => ({ id: `networth_${netWorth}`, netWorth, title: `Net worth milestone: $${netWorth.toLocaleString()}` }));
  const combo = actualChange > 0 ? input.combo + 1 : 0;
  state = { ...state, combo, bestCombo: Math.max(input.bestCombo, combo), milestoneQueue: [...input.milestoneQueue, ...newlyReached], runStats: { ...state.runStats, decisionsMade: state.runStats.decisionsMade + 1, biggestWin: Math.max(state.runStats.biggestWin, actualChange), biggestLoss: Math.min(state.runStats.biggestLoss, actualChange), peakNetWorth: Math.max(state.runStats.peakNetWorth, netWorth) } };
  const status: GameStatus = state.cash < 0 ? 'bankrupt' : netWorth >= 1_000_000_000 ? 'victory' : 'ongoing';
  return { outcome, actualChange, costCharged: cost, passiveIncome, riskPenalty: penalty, status, state };
};
export const applyBonus = (state: EngineGameState, bonus: BonusResult): EngineGameState => {
  const percent = bonus.cashPercent ? Math.round(state.cash * bonus.cashPercent) : 0;
  let next = { ...state, cash: state.cash + (bonus.cashChange || 0) + percent, risk: clamp(state.risk + (bonus.riskChange || 0), 0, 100) };
  if (bonus.businessUnlocked) next = addHolding(next, bonus.businessUnlocked);
  if (bonus.businessLost) next = removeHolding(next, bonus.businessLost);
  return next;
};