import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from '../lib/storage';
import { BUSINESSES } from '../constants/businesses';
import { Choice, Outcome } from '../constants/scenarios';
import { ACHIEVEMENTS } from '../constants/achievements';
import { clamp } from '../lib/utils';
import { router } from 'expo-router';

export interface GameState {
  cash: number;
  day: number;
  risk: number;
  businesses: string[];
  debt: number;
  runStats: {
    peakNetWorth: number;
    biggestWin: number;
    biggestLoss: number;
    businessesPurchased: number;
    decisionsMade: number;
  };
  achievements: string[];
}

export interface GlobalStats {
  gamesPlayed: number;
  bankruptcies: number;
  victories: number;
  highestNetWorth: number;
  totalDaysPlayed: number;
  fastestBillion: number | null;
  largestGain: number;
  largestLoss: number;
  businessesPurchased: number;
  lifetimeEarnings: number;
  decisionsMade: number;
}

export type GameStatus = 'ongoing' | 'bankrupt' | 'victory';

interface GameContextType {
  gameState: GameState | null;
  globalStats: GlobalStats;
  netWorth: number;
  passiveIncome: number;
  startGame: () => void;
  makeChoice: (choice: Choice) => { outcome: Outcome, status: GameStatus, actualChange: number } | void;
  useSecondChance: () => void;
  endGame: (victory: boolean) => void;
  resetProgress: () => void;
}

const defaultGameState: GameState = {
  cash: 1,
  day: 1,
  risk: 0,
  businesses: [],
  debt: 0,
  runStats: {
    peakNetWorth: 1,
    biggestWin: 0,
    biggestLoss: 0,
    businessesPurchased: 0,
    decisionsMade: 0,
  },
  achievements: [],
};

const defaultGlobalStats: GlobalStats = {
  gamesPlayed: 0,
  bankruptcies: 0,
  victories: 0,
  highestNetWorth: 1,
  totalDaysPlayed: 0,
  fastestBillion: null,
  largestGain: 0,
  largestLoss: 0,
  businessesPurchased: 0,
  lifetimeEarnings: 0,
  decisionsMade: 0,
};

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats>(defaultGlobalStats);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [stateRaw, statsRaw] = await Promise.all([
        AsyncStorage.getItem(KEYS.GAME_STATE),
        AsyncStorage.getItem(KEYS.GLOBAL_STATS),
      ]);
      
      if (statsRaw) {
        setGlobalStats({ ...defaultGlobalStats, ...JSON.parse(statsRaw) });
      }
      if (stateRaw) {
        const parsed = JSON.parse(stateRaw);
        setGameState({
          ...defaultGameState,
          ...parsed,
          runStats: { ...defaultGameState.runStats, ...(parsed.runStats || {}) }
        });
      }
      setLoaded(true);
    };
    load();
  }, []);

  const saveState = async (state: GameState, stats: GlobalStats) => {
    await Promise.all([
      AsyncStorage.setItem(KEYS.GAME_STATE, JSON.stringify(state)),
      AsyncStorage.setItem(KEYS.GLOBAL_STATS, JSON.stringify(stats)),
    ]);
  };

  const startGame = () => {
    const freshState = {
      ...defaultGameState,
      achievements: gameState?.achievements || [],
    };
    const newStats = { ...globalStats, gamesPlayed: globalStats.gamesPlayed + 1 };
    setGameState(freshState);
    setGlobalStats(newStats);
    saveState(freshState, newStats);
    router.replace('/game');
  };

  const getNetWorth = (state: GameState) => {
    const businessesValue = state.businesses.reduce((acc, id) => {
      return acc + (BUSINESSES[id]?.dailyIncome * 100 || 0);
    }, 0);
    return state.cash + businessesValue - state.debt;
  };

  const getPassiveIncome = (state: GameState) => {
    return state.businesses.reduce((acc, id) => acc + (BUSINESSES[id]?.dailyIncome || 0), 0);
  };

  const unlockAchievement = (state: GameState, id: string): GameState => {
    if (!state.achievements.includes(id)) {
      return { ...state, achievements: [...state.achievements, id] };
    }
    return state;
  };

  const checkAchievements = (state: GameState, currentNetWorth: number, currentPassive: number, justBankrupted: boolean = false, secondChanceUsed: boolean = false): GameState => {
    let s = { ...state };
    if (currentNetWorth >= 100) s = unlockAchievement(s, 'first_100');
    if (currentNetWorth >= 1000) s = unlockAchievement(s, 'first_1k');
    if (currentNetWorth >= 10000) s = unlockAchievement(s, 'first_10k');
    if (currentNetWorth >= 100000) s = unlockAchievement(s, 'six_figures');
    if (currentNetWorth >= 1000000) s = unlockAchievement(s, 'millionaire');
    if (currentNetWorth >= 10000000) s = unlockAchievement(s, 'ten_million');
    if (currentNetWorth >= 100000000) s = unlockAchievement(s, 'hundred_million');
    if (currentNetWorth >= 1000000000) s = unlockAchievement(s, 'billionaire');
    
    if (s.risk >= 100) s = unlockAchievement(s, 'risk_taker');
    if (s.businesses.length >= 1) s = unlockAchievement(s, 'first_business');
    if (s.businesses.length >= 5) s = unlockAchievement(s, 'own_5');
    if (s.businesses.length >= 10) s = unlockAchievement(s, 'own_10');
    if (currentPassive >= 10000) s = unlockAchievement(s, 'passive_income');
    if (s.runStats.biggestLoss <= -1000000) s = unlockAchievement(s, 'high_roller');
    if (s.day >= 365) s = unlockAchievement(s, 'survivor');
    if (justBankrupted) s = unlockAchievement(s, 'bankrupt');
    if (secondChanceUsed) s = unlockAchievement(s, 'comeback');

    if (justBankrupted && globalStats.bankruptcies + 1 >= 5) s = unlockAchievement(s, 'stubborn');
    
    return s;
  };

  const makeChoice = (choice: Choice) => {
    if (!gameState) return;

    const totalWeight = choice.outcomes.reduce((acc, o) => acc + o.weight, 0);
    let rand = Math.random() * totalWeight;
    let selectedOutcome: Outcome = choice.outcomes[0];

    for (const o of choice.outcomes) {
      if (rand < o.weight) {
        selectedOutcome = o;
        break;
      }
      rand -= o.weight;
    }

    const isRare = (selectedOutcome.weight / totalWeight) <= 0.1;

    let s = { ...gameState };
    const nwBefore = getNetWorth(s);
    
    s.cash -= choice.cost;
    let change = selectedOutcome.cashChange;
    s.cash += change;
    
    if (change > s.runStats.biggestWin) s.runStats.biggestWin = change;
    if (change < s.runStats.biggestLoss) s.runStats.biggestLoss = change;
    
    s.risk = clamp(s.risk + selectedOutcome.riskChange, 0, 100);
    
    let stats = { ...globalStats };

    if (selectedOutcome.businessUnlocked && !s.businesses.includes(selectedOutcome.businessUnlocked)) {
      s.businesses = [...s.businesses, selectedOutcome.businessUnlocked];
      s.runStats.businessesPurchased += 1;
      stats.businessesPurchased += 1;
    }
    
    const passive = getPassiveIncome(s);
    s.cash += passive;
    
    s.day += 1;
    
    const nwAfter = getNetWorth(s);
    if (nwAfter > s.runStats.peakNetWorth) {
      s.runStats.peakNetWorth = nwAfter;
    }

    s.runStats.decisionsMade += 1;
    stats.decisionsMade += 1;
    if (change > 0) stats.lifetimeEarnings += change;
    if (change > stats.largestGain) stats.largestGain = change;
    if (change < stats.largestLoss) stats.largestLoss = change;

    if (s.risk >= 80 && Math.random() < 0.1) {
      const penalty = Math.floor(s.cash * 0.5);
      s.cash -= penalty;
      if (-penalty < s.runStats.biggestLoss) s.runStats.biggestLoss = -penalty;
    }

    stats.totalDaysPlayed += 1;
    if (nwAfter > stats.highestNetWorth) {
      stats.highestNetWorth = nwAfter;
    }

    if (change < 0 && Math.abs(change) >= nwBefore * 0.9) {
      s = unlockAchievement(s, 'lose_90');
    }
    if (isRare && change > 0) {
      s = unlockAchievement(s, 'rare_jackpot');
    }

    if (nwAfter >= 1000000000) {
      if (!stats.fastestBillion || s.day < stats.fastestBillion) {
         stats.fastestBillion = s.day;
      }
    }

    s = checkAchievements(s, nwAfter, passive);
    
    let status: GameStatus = 'ongoing';
    if (s.cash < 0) {
      status = 'bankrupt';
      stats.bankruptcies += 1;
      s = checkAchievements(s, nwAfter, passive, true, false);
    } else if (nwAfter >= 1000000000) {
      // Trigger victory once hitting 1B threshold
      status = 'victory';
      stats.victories += 1;
    }

    setGameState(s);
    setGlobalStats(stats);
    saveState(s, stats);

    return { outcome: selectedOutcome, status, actualChange: change };
  };

  const useSecondChance = () => {
    if (!gameState) return;
    let s = { ...gameState };
    s.cash = Math.max(100, s.runStats.peakNetWorth * 0.1);
    s.risk = 0;
    
    const nw = getNetWorth(s);
    s = checkAchievements(s, nw, getPassiveIncome(s), false, true);

    setGameState(s);
    saveState(s, globalStats);
    router.replace('/game');
  };

  const endGame = (victory: boolean) => {
    if (!gameState) return;
    AsyncStorage.removeItem(KEYS.GAME_STATE);
    setGameState({ ...defaultGameState, achievements: gameState.achievements });
    router.replace('/');
  };

  const resetProgress = () => {
    setGameState(null);
    setGlobalStats(defaultGlobalStats);
    AsyncStorage.clear();
    router.replace('/');
  };

  if (!loaded) return null;

  return (
    <GameContext.Provider value={{
      gameState,
      globalStats,
      netWorth: gameState ? getNetWorth(gameState) : 0,
      passiveIncome: gameState ? getPassiveIncome(gameState) : 0,
      startGame,
      makeChoice,
      useSecondChance,
      endGame,
      resetProgress,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};