import type { TemporaryWorldEvent } from '../game-engine/types';
export const WORLD_EVENTS: TemporaryWorldEvent[] = [
  { id: 'market-crash', name: 'MARKET CRASH', description: 'Panic selling cuts daily receipts across the economy.', incomeMultiplier: 0.62, riskDelta: 22, remainingDays: 4 },
  { id: 'real-estate-boom', name: 'REAL ESTATE BOOM', description: 'Lease demand and property traffic surge.', incomeMultiplier: 1.32, riskDelta: 6, remainingDays: 5 },
  { id: 'tech-boom', name: 'TECH BOOM', description: 'Digital spending accelerates faster than forecasts.', incomeMultiplier: 1.48, riskDelta: 13, remainingDays: 3 },
  { id: 'recession', name: 'RECESSION', description: 'Customers delay spending and credit tightens.', incomeMultiplier: 0.73, riskDelta: 17, remainingDays: 6 },
  { id: 'collectible-craze', name: 'COLLECTIBLE CRAZE', description: 'Scarcity fever sends niche assets and merchandise flying.', incomeMultiplier: 1.21, riskDelta: 10, remainingDays: 2 },
  { id: 'supply-shortage', name: 'SUPPLY SHORTAGE', description: 'Inventory is expensive and unreliable.', incomeMultiplier: 0.81, riskDelta: 15, remainingDays: 3 },
  { id: 'business-boom', name: 'BUSINESS BOOM', description: 'A broad expansion lifts commercial demand.', incomeMultiplier: 1.38, riskDelta: 8, remainingDays: 4 },
];