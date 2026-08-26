export type GameOutcome = 'success' | 'failure' | 'neutral' | 'perfect' | 'walked';

export interface GameResult {
  score: number;
  multiplier: number;
  bonus: number;
  outcome: GameOutcome;
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface BaseGameProps {
  onComplete: (result: GameResult) => void;
  difficulty?: number;
  durationMs?: number;
  testID?: string;
}

export type SpecialGameDescriptor = 
  | { type: 'moneyDrop'; durationMs?: number }
  | { type: 'perfectDeal' }
  | { type: 'safeCrack'; difficulty?: number }
  | { type: 'stockPanic' }
  | { type: 'flipIt'; rounds?: number }
  | { type: 'mysteryReveal'; itemRarity?: Rarity }
  | { type: 'luckyWheel'; options: Array<{ label: string; value: number }> }
  | { type: 'negotiation'; startingPrice: number; targetPrice: number }
  | { type: 'swipeDecision'; title: string; text: string; leftValue: number; rightValue: number }
  | { type: 'passiveIncomeBurst'; durationMs?: number };
