import assert = require('assert');
import { RNG } from '../rng';
import { simulateHybrid, simulateLogistic, simulateOpposed } from '../sim/core';

function test_simulate_hybrid_deterministic() {
  // stub RNG that always returns roll 10
  const stub: any = { int: () => 10, float: () => 0.5 };
  const res = simulateHybrid(stub, 10, 4, 1, 14); // each total = 10+4+1=15 -> success
  assert.strictEqual(res.successes, 10, 'All trials should succeed with deterministic roll');
  assert.strictEqual(res.crits, 0);
}

function test_simulate_logistic_deterministic() {
  // stub RNG where float always 0 (always sample if p>0)
  const stub: any = { int: () => 1, float: () => 0 };
  const res = simulateLogistic(stub, 100, 5, 0, -100, 1); // DC extremely low => p ~1
  assert(res.successRate > 0.9, 'Expected high success rate when DC is very low');
}

function test_simulate_opposed_deterministic() {
  // deterministic sequence: attacker roll always 12, defender 8
  const seq: any = { idx: 0, values: [12, 8], int: function(min:number,max:number){ return this.values[(this.idx++ % this.values.length)]; }, float: () => 0 };
  const res = simulateOpposed(seq, 5, 3, 0, 2, 0);
  // each trial attacker 12+3=15, defender 8+2=10 -> attacker wins
  assert.strictEqual(res.attWins, 5);
}

export function runSimTests() {
  test_simulate_hybrid_deterministic();
  console.log(' Simulate hybrid OK');
  test_simulate_logistic_deterministic();
  console.log(' Simulate logistic OK');
  test_simulate_opposed_deterministic();
  console.log(' Simulate opposed OK');
}
