import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { KEYS, migrateSave } from '../lib/storage';
import type { Choice, Outcome } from '../constants/scenarios';
import type { BonusResult, EngineGameState, GameStatus, TemporaryWorldEvent } from '../game-engine/types';
import { applyBonus, applyWorldEvent, defaultEngineState, getNetWorth, getPassiveIncome, resolveChoice, upgradeHolding } from '../game-engine';
import { applyAchievementRules } from '../game-engine/achievements';

export interface GameState extends EngineGameState {}
export interface GlobalStats {
  gamesPlayed: number; bankruptcies: number; victories: number; highestNetWorth: number;
  totalDaysPlayed: number; fastestBillion: number | null; largestGain: number; largestLoss: number;
  businessesPurchased: number; lifetimeEarnings: number; decisionsMade: number;
}
const defaultGlobalStats: GlobalStats = { gamesPlayed: 0, bankruptcies: 0, victories: 0, highestNetWorth: 1, totalDaysPlayed: 0, fastestBillion: null, largestGain: 0, largestLoss: 0, businessesPurchased: 0, lifetimeEarnings: 0, decisionsMade: 0 };
export type { GameStatus };
export interface ChoiceResult { outcome: Outcome; status: GameStatus; actualChange: number; passiveIncome: number; riskPenalty: number; }

interface GameContextType {
  gameState: GameState | null; globalStats: GlobalStats; netWorth: number; passiveIncome: number;
  startGame: () => void; makeChoice: (choice: Choice, actionId?: string) => ChoiceResult | void;
  useSecondChance: () => void; endGame: (victory: boolean) => void; resetProgress: () => void;
  upgradeBusiness: (id: string) => { upgraded: boolean; cost: number };
  applyBonusResult: (result: BonusResult, actionId?: string) => boolean;
  applySpecialResult: (result: BonusResult, actionId?: string) => boolean;
  applyTemporaryWorldEvent: (event: TemporaryWorldEvent) => void;
  dismissMilestone: () => void;
}
const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats>(defaultGlobalStats);
  const [loaded, setLoaded] = useState(false);
  const busy = useRef(false);
  const processedAction = useRef<string | undefined>(undefined);
  const persistQueue = useRef<Promise<unknown>>(Promise.resolve());
  const persist = (state: GameState, stats: GlobalStats) => {
    const stateSnapshot = JSON.stringify(state);
    const statsSnapshot = JSON.stringify(stats);
    persistQueue.current = persistQueue.current
      .catch(() => undefined)
      .then(() => Promise.all([
        AsyncStorage.setItem(KEYS.GAME_STATE, stateSnapshot),
        AsyncStorage.setItem(KEYS.GLOBAL_STATS, statsSnapshot),
      ]));
  };
  useEffect(() => { void (async () => {
    try {
      const [stateRaw, statsRaw] = await Promise.all([AsyncStorage.getItem(KEYS.GAME_STATE), AsyncStorage.getItem(KEYS.GLOBAL_STATS)]);
      if (statsRaw) setGlobalStats({ ...defaultGlobalStats, ...JSON.parse(statsRaw) });
      if (stateRaw) {
        const parsed = JSON.parse(stateRaw);
        setGameState({ ...defaultEngineState(), ...migrateSave(parsed), runStats: { ...defaultEngineState().runStats, ...(parsed.runStats || {}) } });
      }
    } catch {
      setGameState(null);
      setGlobalStats(defaultGlobalStats);
    } finally { setLoaded(true); }
  })(); }, []);
  const commit = (state: GameState, stats = globalStats) => { setGameState(state); setGlobalStats(stats); persist(state, stats); };
  const startGame = () => { processedAction.current = undefined; const state: GameState = { ...defaultEngineState(), achievements: gameState?.achievements || [] }; const stats = { ...globalStats, gamesPlayed: globalStats.gamesPlayed + 1 }; commit(state, stats); router.replace('/game'); };
  const makeChoice = (choice: Choice, actionId?: string): ChoiceResult | void => {
    const key = actionId || `${gameState?.day}:${choice.id}`;
    if (!gameState || busy.current || processedAction.current === key) return;
    busy.current = true;
    try {
      const resolution = resolveChoice(gameState, choice, Math.random, key);
      if (!resolution) return;
      processedAction.current = key;
      const totalWeight = choice.outcomes.reduce((sum, outcome) => sum + Math.max(0, outcome.weight), 0);
      const rareJackpot = resolution.actualChange > 0 && totalWeight > 0 && resolution.outcome.weight / totalWeight < .1;
      const previousNetWorth = Math.max(1, getNetWorth(gameState));
      const lostNinetyPercent = resolution.actualChange <= -(previousNetWorth * .9);
      const lifetimeBankruptcies = globalStats.bankruptcies + (resolution.status === 'bankrupt' ? 1 : 0);
      let state = applyAchievementRules(resolution.state, getNetWorth(resolution.state), resolution.passiveIncome, {
        bankrupt: resolution.status === 'bankrupt',
        rareJackpot,
        lostNinetyPercent,
        lifetimeBankruptcies,
      });
      const stats: GlobalStats = { ...globalStats, totalDaysPlayed: globalStats.totalDaysPlayed + 1, decisionsMade: globalStats.decisionsMade + 1, businessesPurchased: globalStats.businessesPurchased + (state.runStats.businessesPurchased - gameState.runStats.businessesPurchased), lifetimeEarnings: globalStats.lifetimeEarnings + Math.max(0, resolution.actualChange), largestGain: Math.max(globalStats.largestGain, resolution.actualChange), largestLoss: Math.min(globalStats.largestLoss, resolution.actualChange), highestNetWorth: Math.max(globalStats.highestNetWorth, getNetWorth(state)), bankruptcies: globalStats.bankruptcies + (resolution.status === 'bankrupt' ? 1 : 0), victories: globalStats.victories + (resolution.status === 'victory' ? 1 : 0), fastestBillion: resolution.status === 'victory' && (!globalStats.fastestBillion || state.day < globalStats.fastestBillion) ? state.day : globalStats.fastestBillion };
      commit(state, stats);
      return { outcome: resolution.outcome, status: resolution.status, actualChange: resolution.actualChange, passiveIncome: resolution.passiveIncome, riskPenalty: resolution.riskPenalty };
    } finally { busy.current = false; }
  };
  const upgradeBusiness = (id: string) => {
    if (!gameState || busy.current) return { upgraded: false, cost: 0 };
    busy.current = true; try { const result = upgradeHolding(gameState, id); if (result.upgraded) commit(applyAchievementRules(result.state, getNetWorth(result.state), getPassiveIncome(result.state), { lifetimeBankruptcies: globalStats.bankruptcies })); return { upgraded: result.upgraded, cost: result.cost }; } finally { busy.current = false; }
  };
  const applyBonusResult = (result: BonusResult, actionId?: string) => {
    const key = actionId || `bonus:${result.id || result.text || result.cashChange || 0}:${gameState?.day}`;
    if (!gameState || busy.current || processedAction.current === key || gameState.lastActionId === key) return false;
    busy.current = true; try { const updated = applyBonus(gameState, result); const state = applyAchievementRules({ ...updated, lastActionId: key }, getNetWorth(updated), getPassiveIncome(updated), { lifetimeBankruptcies: globalStats.bankruptcies }); processedAction.current = key; commit(state); return true; } finally { busy.current = false; }
  };
  const useSecondChance = () => { if (!gameState) return; const revived = { ...gameState, cash: Math.max(100, gameState.runStats.peakNetWorth * .1), risk: 0 }; const state = applyAchievementRules(revived, getNetWorth(revived), getPassiveIncome(revived), { comeback: true, lifetimeBankruptcies: globalStats.bankruptcies }); commit(state); router.replace('/game'); };
  const endGame = () => { if (!gameState) return; void persistQueue.current.finally(() => AsyncStorage.removeItem(KEYS.GAME_STATE)); setGameState({ ...defaultEngineState(), achievements: gameState.achievements }); router.replace('/'); };
  const resetProgress = () => { setGameState(null); setGlobalStats(defaultGlobalStats); void persistQueue.current.finally(() => AsyncStorage.multiRemove([KEYS.GAME_STATE, KEYS.GLOBAL_STATS])); router.replace('/'); };
  const applyTemporaryWorldEvent = (event: TemporaryWorldEvent) => { if (gameState) commit(applyWorldEvent(gameState, event)); };
  const dismissMilestone = () => { if (gameState) commit({ ...gameState, milestoneQueue: gameState.milestoneQueue.slice(1) }); };
  if (!loaded) return null;
  return <GameContext.Provider value={{ gameState, globalStats, netWorth: gameState ? getNetWorth(gameState) : 0, passiveIncome: gameState ? getPassiveIncome(gameState) : 0, startGame, makeChoice, useSecondChance, endGame, resetProgress, upgradeBusiness, applyBonusResult, applySpecialResult: applyBonusResult, applyTemporaryWorldEvent, dismissMilestone }}>{children}</GameContext.Provider>;
};
export const useGame = () => { const context = useContext(GameContext); if (!context) throw new Error('useGame must be used within GameProvider'); return context; };