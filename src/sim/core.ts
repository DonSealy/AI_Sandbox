import { RNG } from '../rng';
import { hybridCheck, logisticProbability } from '../action';

export type HybridSimResult = {
  iterations: number;
  successes: number;
  successRate: number;
  avgMargin: number;
  crits: number;
  fumbles: number;
};

export function simulateHybrid(rng: RNG, iterations: number, skill: number, modifiers: number, DC: number): HybridSimResult {
  let successes = 0;
  let totalMargin = 0;
  let crits = 0;
  let fumbles = 0;
  for (let i = 0; i < iterations; i++) {
    const o = hybridCheck(rng, skill, modifiers, DC);
    if (o.success) successes++;
    totalMargin += o.margin;
    if (o.critical) crits++;
    if (o.fumble) fumbles++;
  }
  return { iterations, successes, successRate: successes / iterations, avgMargin: totalMargin / iterations, crits, fumbles };
}

export type LogisticSimResult = {
  iterations: number;
  successes: number;
  successRate: number;
  avgP: number;
};

export function simulateLogistic(rng: RNG, iterations: number, skill: number, modifiers: number, DC: number, k = 0.5): LogisticSimResult {
  let successes = 0;
  let totalP = 0;
  for (let i = 0; i < iterations; i++) {
    const diff = skill + modifiers - DC;
    const p = logisticProbability(diff, k, 0);
    totalP += p;
    const sampled = rng.float() < p;
    if (sampled) successes++;
  }
  return { iterations, successes, successRate: successes / iterations, avgP: totalP / iterations };
}

export type OpposedSimResult = {
  iterations: number;
  attWins: number;
  winRate: number;
  avgMargin: number;
};

export function simulateOpposed(rng: RNG, iterations: number, attSkill: number, attMods: number, defSkill: number, defMods: number): OpposedSimResult {
  let attWins = 0;
  let totalMargin = 0;
  for (let i = 0; i < iterations; i++) {
    const aRoll = rng.int(1, 20) + attSkill + attMods;
    const dRoll = rng.int(1, 20) + defSkill + defMods;
    if (aRoll > dRoll) attWins++;
    totalMargin += aRoll - dRoll;
  }
  return { iterations, attWins, winRate: attWins / iterations, avgMargin: totalMargin / iterations };
}
