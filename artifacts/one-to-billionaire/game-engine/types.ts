import type { Choice, Outcome } from '../constants/scenarios';

export type RNG = () => number;
export type GameStatus = 'ongoing' | 'bankrupt' | 'victory';

export interface BusinessHolding {
  id: string;
  level: number;
}

export interface TemporaryWorldEvent {
  id: string;
  name: string;
  description: string;
  incomeMultiplier: number;
  riskDelta: number;
  remainingDays: number;
}

export interface MilestoneNotice {
  id: string;
  netWorth: number;
  title: string;
}

export interface EngineRunStats {
  peakNetWorth: number;
  biggestWin: number;
  biggestLoss: number;
  businessesPurchased: number;
  decisionsMade: number;
}

export interface EngineGameState {
  version: number;
  cash: number;
  day: number;
  risk: number;
  /** Kept for legacy screen compatibility. */
  businesses: string[];
  holdings: Record<string, BusinessHolding>;
  debt: number;
  runStats: EngineRunStats;
  achievements: string[];
  combo: number;
  bestCombo: number;
  milestoneQueue: MilestoneNotice[];
  activeWorldEvents: TemporaryWorldEvent[];
  lastActionId?: string;
}

export interface ChoiceResolution {
  outcome: Outcome;
  actualChange: number;
  costCharged: number;
  passiveIncome: number;
  riskPenalty: number;
  status: GameStatus;
  state: EngineGameState;
}

export type BonusResult = {
  id?: string;
  cashChange?: number;
  cashPercent?: number;
  riskChange?: number;
  text?: string;
  businessUnlocked?: string;
  businessLost?: string;
};

export type { Choice };