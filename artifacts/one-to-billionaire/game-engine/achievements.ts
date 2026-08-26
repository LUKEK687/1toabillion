import type { EngineGameState } from './types';

export interface AchievementSignals {
  bankrupt?: boolean;
  comeback?: boolean;
  rareJackpot?: boolean;
  lostNinetyPercent?: boolean;
  lifetimeBankruptcies?: number;
}

export const applyAchievementRules = (
  state: EngineGameState,
  netWorth: number,
  passiveIncome: number,
  signals: AchievementSignals = {},
): EngineGameState => {
  const earned = new Set(state.achievements);
  ([[100, 'first_100'], [1_000, 'first_1k'], [10_000, 'first_10k'], [100_000, 'six_figures'], [1_000_000, 'millionaire'], [10_000_000, 'ten_million'], [100_000_000, 'hundred_million'], [1_000_000_000, 'billionaire']] as Array<[number, string]>)
    .forEach(([amount, id]) => { if (netWorth >= amount) earned.add(id); });
  if (state.businesses.length) earned.add('first_business');
  if (state.businesses.length >= 5) earned.add('own_5');
  if (state.businesses.length >= 10) earned.add('own_10');
  if (passiveIncome >= 10_000) earned.add('passive_income');
  if (state.risk >= 100) earned.add('risk_taker');
  if (state.day >= 365) earned.add('survivor');
  if (state.runStats.biggestLoss <= -1_000_000) earned.add('high_roller');
  if (signals.bankrupt) earned.add('bankrupt');
  if (signals.comeback) earned.add('comeback');
  if (signals.rareJackpot) earned.add('rare_jackpot');
  if (signals.lostNinetyPercent) earned.add('lose_90');
  if ((signals.lifetimeBankruptcies ?? 0) >= 5) earned.add('stubborn');
  return { ...state, achievements: [...earned] };
};