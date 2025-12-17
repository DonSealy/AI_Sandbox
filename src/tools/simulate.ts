#!/usr/bin/env node
import { RNG } from '../rng';
import { simulateHybrid, simulateLogistic, simulateOpposed } from '../sim/core';

type SimConfig = {
  algorithm: 'hybrid' | 'logistic' | 'opposed';
  iterations: number;
  seed?: number;
  skill?: number;
  modifiers?: number;
  DC?: number;
  attSkill?: number;
  attMods?: number;
  defSkill?: number;
  defMods?: number;
  k?: number;
};

function parseArgs(): SimConfig {
  const argv = process.argv.slice(2);
  const cfg: any = { algorithm: 'hybrid', iterations: 100000 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--algorithm' || a === '-a') cfg.algorithm = argv[++i];
    else if (a === '--iterations' || a === '-n') cfg.iterations = Number(argv[++i]);
    else if (a === '--seed' || a === '-s') cfg.seed = Number(argv[++i]);
    else if (a === '--skill') cfg.skill = Number(argv[++i]);
    else if (a === '--mods') cfg.modifiers = Number(argv[++i]);
    else if (a === '--DC') cfg.DC = Number(argv[++i]);
    else if (a === '--attSkill') cfg.attSkill = Number(argv[++i]);
    else if (a === '--attMods') cfg.attMods = Number(argv[++i]);
    else if (a === '--defSkill') cfg.defSkill = Number(argv[++i]);
    else if (a === '--defMods') cfg.defMods = Number(argv[++i]);
    else if (a === '--k') cfg.k = Number(argv[++i]);
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: simulate [options]\n
Options:\n  -a,--algorithm <hybrid|logistic|opposed>  Algorithm to simulate (default hybrid)\n  -n,--iterations <N>    Number of Monte Carlo trials (default 100000)\n  -s,--seed <N>          RNG seed (optional)\n  --skill <N>            Skill value for single checks\n  --mods <N>             Modifiers applied to skill\n  --DC <N>               Difficulty Class for single checks\n  --attSkill --attMods --defSkill --defMods  For opposed checks\n  --k <float>            Logistic steepness parameter (default 0.5)\n`);
      process.exit(0);
    }
  }
  return cfg as SimConfig;
}

 

async function main() {
  const cfg = parseArgs();
  const seed = cfg.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = new RNG(seed);
  console.log('Sim config:', { ...cfg, seed });
  if (cfg.algorithm === 'hybrid') {
    const skill = cfg.skill ?? 5;
    const mods = cfg.modifiers ?? 0;
    const DC = cfg.DC ?? 15;
    const res = simulateHybrid(rng, cfg.iterations, skill, mods, DC);
    console.log(JSON.stringify(res, null, 2));
  } else if (cfg.algorithm === 'logistic') {
    const skill = cfg.skill ?? 5;
    const mods = cfg.modifiers ?? 0;
    const DC = cfg.DC ?? 15;
    const k = cfg.k ?? 0.5;
    const res = simulateLogistic(rng, cfg.iterations, skill, mods, DC, k);
    console.log(JSON.stringify(res, null, 2));
  } else if (cfg.algorithm === 'opposed') {
    const attSkill = cfg.attSkill ?? cfg.skill ?? 5;
    const attMods = cfg.attMods ?? cfg.modifiers ?? 0;
    const defSkill = cfg.defSkill ?? 4;
    const defMods = cfg.defMods ?? 0;
    const res = simulateOpposed(rng, cfg.iterations, attSkill, attMods, defSkill, defMods);
    console.log(JSON.stringify(res, null, 2));
  } else {
    console.error('Unknown algorithm', cfg.algorithm);
    process.exit(2);
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
