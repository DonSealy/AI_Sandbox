import { RNG } from './rng';

export type CheckOutcome = {
  success: boolean;
  roll: number;
  total: number;
  margin: number;
  critical: boolean;
  fumble: boolean;
};

export function logisticProbability(diff: number, k = 0.5, x0 = 0) {
  const x = k * (diff - x0);
  return 1 / (1 + Math.exp(-x));
}

export function hybridCheck(rng: RNG, skill: number, modifiers: number, DC: number): CheckOutcome {
  const roll = rng.int(1, 20);
  const total = roll + skill + modifiers;
  const success = total >= DC;
  const margin = total - DC;
  const natural = roll;
  const outcome: CheckOutcome = { success, roll, total, margin, critical: false, fumble: false };
  if (natural === 20) {
    outcome.critical = true;
    outcome.success = true;
    outcome.margin = Math.max(outcome.margin, 10);
  }
  if (natural === 1) {
    outcome.fumble = true;
    outcome.success = false;
  }
  return outcome;
}

export function opposedCheck(rng: RNG, attSkill: number, attMods: number, defSkill: number, defMods: number) {
  const attacker = hybridCheck(rng, attSkill, attMods, 0);
  const defender = hybridCheck(rng, defSkill, defMods, 0);
  const attackerWins = attacker.total > defender.total;
  const margin = attacker.total - defender.total;
  return { attackerWins, margin, attacker, defender };
}
