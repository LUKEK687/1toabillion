import type { Outcome, Scenario } from './scenarios';

export interface MoneyEvent {
  id: string;
  tier: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  description: string;
  outcomes: [Outcome, Outcome];
}

const ranges: Record<MoneyEvent['tier'], [number, number]> = { 1: [8, 90], 2: [150, 900], 3: [1_500, 9_000], 4: [15_000, 90_000], 5: [150_000, 900_000], 6: [1_500_000, 9_000_000], 7: [15_000_000, 90_000_000] };
const stories = [
  ['Mira’s Midnight Market', 'Mira sells out before dawn', 'A freezer failure spoils the inventory'],
  ['Northstar Patent', 'Northstar licenses the clever design', 'A prior-art challenge drains the budget'],
  ['Cobalt Cartel Contract', 'Cobalt renews at a premium', 'Cobalt cancels after a compliance review'],
  ['Harborlight Auction', 'A collector starts a bidding war', 'The reserve is missed and storage fees mount'],
  ['Juniper Freight Route', 'Juniper route cuts delivery time', 'A bridge closure strands the shipment'],
  ['Velvet Byte Launch', 'Velvet Byte hits the featured page', 'A launch bug triggers refunds'],
  ['Orchid Orchard Lease', 'Orchid harvest beats forecasts', 'An early frost ruins the crop'],
  ['Saffron Signal Deal', 'Saffron signs a national client', 'A rival undercuts the proposal'],
  ['Atlas Arcade Revival', 'Atlas cabinets become a local craze', 'A power surge fries the machines'],
  ['Lumen Studio Rights', 'Lumen sells a streaming package', 'A contract dispute freezes payment'],
  ['Copper Kite Festival', 'Copper Kite draws record sponsors', 'Rain washes out the weekend'],
];

/** 77 additional fictional, structured win/loss events: eleven at every wealth tier. */
export const MONEY_EVENTS: MoneyEvent[] = ([1, 2, 3, 4, 5, 6, 7] as const).flatMap((tier) =>
  stories.map(([title, win, loss], index) => {
    const [low, high] = ranges[tier];
    const amount = Math.round(low + ((high - low) * (index + 1)) / stories.length);
    const scalable = index % 3 === 0;
    return {
      id: `money_t${tier}_${index + 1}`,
      tier,
      title,
      description: `A confidential opportunity involving ${title.toLowerCase()} lands on your desk.`,
      outcomes: [
        { weight: 58 - (index % 4) * 4, text: win, cashChange: scalable ? 1.04 + (index % 4) * .02 : amount, isMultiplier: scalable, riskChange: 4 + (index % 3) * 3 },
        { weight: 42 + (index % 4) * 4, text: loss, cashChange: scalable ? .92 - (index % 3) * .03 : -Math.round(amount * (0.55 + (index % 3) * 0.1)), isMultiplier: scalable, riskChange: 8 + (index % 4) * 3 },
      ],
    };
  }),
);

export const MONEY_EVENT_SCENARIOS: Scenario[] = MONEY_EVENTS.map((event) => {
  const bounds: Record<number, [number, number]> = { 1: [1, 100], 2: [100, 1_000], 3: [1_000, 10_000], 4: [10_000, 100_000], 5: [100_000, 1_000_000], 6: [1_000_000, 100_000_000], 7: [100_000_000, 1_000_000_000] };
  const [minNetWorth, maxNetWorth] = bounds[event.tier];
  return { id: event.id, title: event.title, description: event.description, minNetWorth, maxNetWorth, category: 'random', choices: [{ id: `${event.id}_take`, text: 'Take the deal', cost: 0, outcomes: event.outcomes }, { id: `${event.id}_decline`, text: 'Decline', cost: 0, outcomes: [{ weight: 1, text: 'You preserve optionality.', cashChange: 0, riskChange: -2 }] }] };
});