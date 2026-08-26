import type { BonusResult } from '../game-engine/types';
export type SurpriseType = 'PHONE CALL' | 'BREAKING NEWS' | 'MYSTERY OFFER' | 'BUSINESS EMERGENCY' | 'LUCKY FIND' | 'CUSTOMER ALERT';
export interface SpecialEventDescriptor { id: string; type: SurpriseType; kind: 'surprise' | 'special' | 'minigame'; title: string; description: string; result: BonusResult; }
export const SPECIAL_EVENTS: SpecialEventDescriptor[] = [
  { id: 'phone-call', type: 'PHONE CALL', kind: 'surprise', title: 'PHONE CALL', description: 'An old client calls with a rush contract.', result: { cashPercent: 0.03, riskChange: 2, text: 'The contract is signed.' } },
  { id: 'breaking-news', type: 'BREAKING NEWS', kind: 'special', title: 'BREAKING NEWS', description: 'A favorable headline boosts confidence in your ventures.', result: { cashPercent: 0.05, riskChange: 5, text: 'Demand rises overnight.' } },
  { id: 'mystery-offer', type: 'MYSTERY OFFER', kind: 'minigame', title: 'MYSTERY OFFER', description: 'A sealed offer asks you to decide quickly.', result: { cashChange: 5000, riskChange: 8, text: 'The offer clears.' } },
  { id: 'business-emergency', type: 'BUSINESS EMERGENCY', kind: 'surprise', title: 'BUSINESS EMERGENCY', description: 'A supplier needs immediate support to keep operations moving.', result: { cashChange: -2500, riskChange: 12, text: 'The emergency is contained.' } },
  { id: 'lucky-find', type: 'LUCKY FIND', kind: 'surprise', title: 'LUCKY FIND', description: 'You uncover a misfiled refundable deposit.', result: { cashChange: 1500, riskChange: -3, text: 'The refund lands.' } },
  { id: 'customer-alert', type: 'CUSTOMER ALERT', kind: 'special', title: 'CUSTOMER ALERT', description: 'A key customer flags a renewal before competitors can react.', result: { cashPercent: 0.02, riskChange: -4, text: 'The customer renews.' } },
];