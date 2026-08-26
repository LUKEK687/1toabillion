import { resolveChoice, defaultEngineState, addHolding, applyBonus, applyWorldEvent, getNetWorth, getPassiveIncome, upgradeHolding } from './index';
import { migrateSave } from '../lib/storage';
import type { Choice } from '../constants/scenarios';
import { WORLD_EVENTS } from '../constants/worldEvents';
import { applyAchievementRules } from './achievements';

const choice: Choice = { id: 'simulation-decision', text: 'Simulate', cost: 1, outcomes: [{ weight: 1, text: 'gain', cashChange: 3, riskChange: 0 }] };
/** Runnable pure smoke suite: call runEngineSimulation() from a TS runner. */
export const runEngineSimulation = (): true => {
  let state = addHolding({ ...defaultEngineState(), cash: 10_000 }, 'vending_machine');
  for (let index = 0; index < 55; index += 1) {
    const result = resolveChoice(state, choice, () => .5, `decision-${index}`);
    if (!result) throw new Error('A unique action must resolve.');
    state = result.state;
  }
  const duplicate = resolveChoice(state, choice, () => .5, 'decision-54');
  if (duplicate !== null) throw new Error('Action idempotency failed.');
  const upgrade = upgradeHolding(state, 'vending_machine');
  if (!upgrade.upgraded || upgrade.state.holdings.vending_machine.level !== 2) throw new Error('Holding upgrade failed.');
  if (migrateSave({ businesses: ['lemonade_stand'] }).holdings.lemonade_stand.level !== 1) throw new Error('Legacy migration failed.');
  const worldState = applyWorldEvent(upgrade.state, WORLD_EVENTS[0]);
  if (getPassiveIncome(worldState) >= getPassiveIncome(upgrade.state) || worldState.activeWorldEvents.length !== 1) throw new Error('World modifier failed.');
  const bonusState = applyBonus(worldState, { cashPercent: .1, businessUnlocked: 'lemonade_stand' });
  if (!bonusState.holdings.lemonade_stand || bonusState.cash <= worldState.cash) throw new Error('Bonus result failed.');
  const multiplier = resolveChoice(bonusState, { ...choice, cost: 0, outcomes: [{ weight: 1, text: 'half', cashChange: .5, isMultiplier: true, riskChange: 0 }] }, () => .5, 'multiplier');
  if (!multiplier || multiplier.actualChange !== Math.round(bonusState.cash * -.5) + getPassiveIncome(bonusState)) throw new Error('Multiplier handling failed.');
  const victory = applyBonus({ ...state, cash: 999_999_999 }, { cashChange: 2 });
  if (getNetWorth(victory) < 1_000_000_000) throw new Error('Victory threshold failed.');
  const bankruptcy = resolveChoice({ ...state, cash: 1 }, { ...choice, outcomes: [{ weight: 1, text: 'loss', cashChange: -100, riskChange: 0 }] }, () => .5);
  if (bankruptcy?.status !== 'bankrupt') throw new Error('Bankruptcy threshold failed.');
  const achievementState = applyAchievementRules(state, getNetWorth(state), getPassiveIncome(state), {
    rareJackpot: true,
    lostNinetyPercent: true,
    lifetimeBankruptcies: 5,
  });
  for (const id of ['rare_jackpot', 'lose_90', 'stubborn']) {
    if (!achievementState.achievements.includes(id)) throw new Error(`Achievement rule failed: ${id}`);
  }
  return true;
};