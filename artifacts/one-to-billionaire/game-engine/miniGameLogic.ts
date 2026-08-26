import type { GameResult, Rarity, SpecialGameDescriptor } from '../types/gameplay';

export type StockChoice = 'buy' | 'sell' | 'hold' | null;
export type NegotiationOutcome = 'accepted' | 'counter' | 'rejected';

export const MYSTERY_ITEMS: Record<Rarity, { name: string; score: number; multiplier: number }> = {
  common: { name: 'Antique Watch', score: 120, multiplier: 1 },
  uncommon: { name: 'Signed Collectible', score: 300, multiplier: 1 },
  rare: { name: 'Rare Trading Card', score: 750, multiplier: 1.1 },
  epic: { name: 'Estate Ring', score: 1_800, multiplier: 1.25 },
  legendary: { name: 'Small Gold Bar', score: 4_000, multiplier: 1.5 },
  mythic: { name: 'Mystery USB Wallet', score: 10_000, multiplier: 2 },
};

export const FLIP_PRODUCTS = [
  { id: 1, name: 'Vintage Watch', price: 500, realValue: 800 },
  { id: 2, name: 'Fake Art', price: 1000, realValue: 100 },
  { id: 3, name: 'Rare Coin', price: 200, realValue: 600 },
  { id: 4, name: 'Broken Laptop', price: 150, realValue: 50 },
  { id: 5, name: 'Gold Ring', price: 300, realValue: 400 },
] as const;

export const allMiniGameFixtures = (): SpecialGameDescriptor[] => [
  { type: 'moneyDrop', durationMs: 10 },
  { type: 'perfectDeal' },
  { type: 'safeCrack', difficulty: 0.5 },
  { type: 'stockPanic' },
  { type: 'flipIt', rounds: 3 },
  ...Object.keys(MYSTERY_ITEMS).map((itemRarity) => ({ type: 'mysteryReveal', itemRarity: itemRarity as Rarity }) as const),
  { type: 'luckyWheel', options: [{ label: 'WIN', value: 100 }, { label: 'BANKRUPT', value: -1_000 }] },
  { type: 'negotiation', startingPrice: 1_000, targetPrice: 700 },
  { type: 'swipeDecision', title: 'Test', text: 'Choose', leftValue: -10, rightValue: 20 },
  { type: 'passiveIncomeBurst', durationMs: 10 },
];

export const createCompletionGate = () => {
  let completed = false;
  return {
    tryComplete: (complete: () => void): boolean => {
      if (completed) return false;
      completed = true;
      complete();
      return true;
    },
    get completed() { return completed; },
  };
};

export const moneyDropResult = (score: number): GameResult => ({
  score, multiplier: 1, bonus: 0, outcome: score > 0 ? 'success' : 'failure',
});

export const passiveBurstResult = (taps: number): GameResult => ({
  score: taps * 10, multiplier: 1, bonus: taps * 10, outcome: taps > 20 ? 'success' : 'neutral',
});

export const perfectDealResult = (position: number, difficulty = 0.5): GameResult => {
  const targetWidth = Math.max(0.05, 0.2 - difficulty * 0.15);
  const targetStart = 0.5 - targetWidth / 2;
  if (Math.abs(position - 0.5) < targetWidth / 4) {
    return { score: 500, multiplier: 2, bonus: 0, outcome: 'perfect' };
  }
  if (position >= targetStart && position <= targetStart + targetWidth) {
    return { score: 200, multiplier: 1.2, bonus: 0, outcome: 'success' };
  }
  return { score: 0, multiplier: 0.5, bonus: 0, outcome: 'failure' };
};

export const circularDistance = (left: number, right: number): number => {
  const distance = Math.abs((left % 360) - (right % 360));
  return Math.min(distance, 360 - distance);
};

export const safeCrackHit = (rotation: number, target: number, difficulty = 0.5): boolean =>
  circularDistance(rotation, target) <= Math.max(10, 30 - difficulty * 20);

export const stockPanicResult = (choice: StockChoice, start: number, end: number): GameResult => {
  const diff = end - start;
  if (choice === 'buy') return { score: diff > 0 ? 300 : -200, multiplier: 1, bonus: 0, outcome: diff > 0 ? 'success' : 'failure' };
  if (choice === 'sell') return { score: diff < 0 ? 300 : -200, multiplier: 1, bonus: 0, outcome: diff < 0 ? 'success' : 'failure' };
  return { score: 50, multiplier: 1, bonus: 0, outcome: 'neutral' };
};

export const flipRoundScore = (round: number, buy: boolean): number => {
  const product = FLIP_PRODUCTS[round % FLIP_PRODUCTS.length];
  return buy ? product.realValue - product.price : 0;
};

export const flipResult = (score: number): GameResult => ({
  score, multiplier: 1, bonus: 0, outcome: score > 0 ? 'success' : 'failure',
});

export const mysteryResult = (rarity: Rarity): GameResult => {
  const item = MYSTERY_ITEMS[rarity];
  return { score: item.score, multiplier: item.multiplier, bonus: Math.round(item.score * 0.25), outcome: 'success' };
};

export const wheelResult = (value: number): GameResult => ({
  score: value, multiplier: 1, bonus: 0, outcome: value > 0 ? 'success' : 'failure',
});

export const wheelIndex = (optionCount: number, rng: () => number = Math.random): number => {
  if (optionCount <= 0) throw new Error('Lucky Wheel requires at least one option.');
  return Math.min(optionCount - 1, Math.floor(rng() * optionCount));
};

export const negotiationOutcome = (offer: number, targetPrice: number): NegotiationOutcome =>
  offer >= targetPrice ? 'accepted' : offer >= targetPrice * 0.8 ? 'counter' : 'rejected';

export const negotiationResult = (outcome: Exclude<NegotiationOutcome, 'counter'>, offer: number): GameResult =>
  outcome === 'accepted'
    ? { score: -offer, multiplier: 1, bonus: 0, outcome: 'success' }
    : { score: 0, multiplier: 1, bonus: 0, outcome: 'failure' };

export const swipeDirection = (distance: number, screenWidth: number): 'left' | 'right' | null =>
  distance > screenWidth * 0.25 ? 'right' : distance < -screenWidth * 0.25 ? 'left' : null;

type TestAction =
  | { type: 'score'; value: number }
  | { type: 'tap'; count?: number; position?: number }
  | { type: 'swipe'; distance: number }
  | { type: 'choose'; choice: StockChoice; start?: number; end?: number; offer?: number }
  | { type: 'spin'; rng: () => number }
  | { type: 'timeout' }
  | { type: 'walkAway' };

export const createDeterministicMiniGameSession = (
  game: SpecialGameDescriptor,
  onComplete: (result: GameResult) => void,
) => {
  const gate = createCompletionGate();
  let score = 0;
  let taps = 0;
  let round = 0;
  let safeLevel = 0;
  const safeTargets = [10, 120, 250];
  const complete = (result: GameResult) => gate.tryComplete(() => onComplete(result));

  return {
    game,
    get completed() { return gate.completed; },
    act(action: TestAction): boolean {
      if (gate.completed) return false;
      if (game.type === 'moneyDrop') {
        if (action.type === 'score') score += action.value;
        if (action.type === 'timeout') return complete(moneyDropResult(score));
      } else if (game.type === 'perfectDeal' && action.type === 'tap') {
        return complete(perfectDealResult(action.position ?? 0, 0.5));
      } else if (game.type === 'safeCrack' && action.type === 'tap') {
        if (!safeCrackHit(action.position ?? 0, safeTargets[safeLevel], game.difficulty)) {
          return complete({ score: 0, multiplier: 1, bonus: 0, outcome: 'failure' });
        }
        safeLevel += 1;
        if (safeLevel === safeTargets.length) return complete({ score: 1000, multiplier: 2, bonus: 500, outcome: 'success' });
      } else if (game.type === 'stockPanic' && (action.type === 'choose' || action.type === 'timeout')) {
        return complete(stockPanicResult(action.type === 'timeout' ? null : action.choice, action.type === 'choose' ? action.start ?? 100 : 100, action.type === 'choose' ? action.end ?? 100 : 100));
      } else if (game.type === 'flipIt' && action.type === 'swipe') {
        score += flipRoundScore(round, action.distance < -100);
        round += 1;
        if (round >= (game.rounds ?? 3)) return complete(flipResult(score));
      } else if (game.type === 'mysteryReveal' && action.type === 'tap') {
        return complete(mysteryResult(game.itemRarity ?? 'rare'));
      } else if (game.type === 'luckyWheel' && action.type === 'spin') {
        return complete(wheelResult(game.options[wheelIndex(game.options.length, action.rng)].value));
      } else if (game.type === 'negotiation') {
        if (action.type === 'walkAway') return complete({ score: 0, multiplier: 1, bonus: 0, outcome: 'walked' });
        if (action.type === 'choose') {
          const offer = action.offer ?? 0;
          const outcome = negotiationOutcome(offer, game.targetPrice);
          if (outcome !== 'counter') return complete(negotiationResult(outcome, offer));
        }
      } else if (game.type === 'swipeDecision' && action.type === 'swipe') {
        const direction = swipeDirection(action.distance, 400);
        if (direction) return complete({ score: direction === 'left' ? game.leftValue : game.rightValue, multiplier: 1, bonus: 0, outcome: 'neutral' });
      } else if (game.type === 'passiveIncomeBurst') {
        if (action.type === 'tap') taps += action.count ?? 1;
        if (action.type === 'timeout') return complete(passiveBurstResult(taps));
      }
      return false;
    },
  };
};
