export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_100', title: 'First 100', description: 'Reach $100 net worth.', icon: 'cash-outline' },
  { id: 'first_1k', title: 'First 1k', description: 'Reach $1,000 net worth.', icon: 'cash-outline' },
  { id: 'first_10k', title: 'First 10k', description: 'Reach $10,000 net worth.', icon: 'cash-outline' },
  { id: 'six_figures', title: 'Six Figures', description: 'Reach $100,000 net worth.', icon: 'trending-up-outline' },
  { id: 'millionaire', title: 'Millionaire', description: 'Reach $1,000,000 net worth.', icon: 'star-outline' },
  { id: 'ten_million', title: 'Ten Million', description: 'Reach $10,000,000 net worth.', icon: 'star-half-outline' },
  { id: 'hundred_million', title: '100 Million', description: 'Reach $100,000,000 net worth.', icon: 'planet-outline' },
  { id: 'billionaire', title: 'Billionaire', description: 'Reach $1,000,000,000 net worth. You won!', icon: 'trophy-outline' },
  { id: 'comeback', title: 'Comeback', description: 'Use a second chance after bankruptcy.', icon: 'refresh-outline' },
  { id: 'own_5', title: 'Own 5', description: 'Own 5 businesses at once.', icon: 'business-outline' },
  { id: 'own_10', title: 'Own 10', description: 'Own 10 businesses at once.', icon: 'business-outline' },
  { id: 'rare_jackpot', title: 'Rare Jackpot', description: 'Hit a rare outcome (<10% probability).', icon: 'dice-outline' },
  { id: 'lose_90', title: 'Lose 90%', description: 'Lose 90% of your net worth in one decision.', icon: 'alert-circle-outline' },
  { id: 'high_roller', title: 'High Roller', description: 'Lose $1,000,000 in a single day and survive.', icon: 'skull-outline' },
  { id: 'risk_taker', title: 'Adrenaline Junkie', description: 'Reach 100% Risk without going bankrupt.', icon: 'warning-outline' },
  { id: 'first_business', title: 'Entrepreneur', description: 'Buy your first business.', icon: 'briefcase-outline' },
  { id: 'bankrupt', title: 'Down to Zero', description: 'Go bankrupt for the first time.', icon: 'trending-down-outline' },
  { id: 'passive_income', title: 'Money While You Sleep', description: 'Reach $10,000/day in passive income.', icon: 'moon-outline' },
  { id: 'survivor', title: 'Survivor', description: 'Survive 365 days in a single run.', icon: 'calendar-outline' },
  { id: 'stubborn', title: 'Stubborn', description: 'Go bankrupt 5 times.', icon: 'repeat-outline' },
];