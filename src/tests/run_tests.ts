import assert = require('assert');
import { RNG } from '../rng';
import { logisticProbability, hybridCheck, opposedCheck } from '../action';

function approx(a: number, b: number, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

function test_rng_repeatability() {
  const r1 = new RNG(12345);
  const r2 = new RNG(12345);
  const a1 = Array.from({ length: 5 }, () => r1.int(1, 1000));
  const a2 = Array.from({ length: 5 }, () => r2.int(1, 1000));
  assert.deepStrictEqual(a1, a2, 'RNG with same seed should produce same sequence');
  const r3 = new RNG(54321);
  const a3 = Array.from({ length: 5 }, () => r3.int(1, 1000));
  let allEqual = true;
  for (let i = 0; i < a1.length; i++) if (a1[i] !== a3[i]) allEqual = false;
  assert.ok(!allEqual, 'RNG with different seed should (likely) produce different sequence');
}

function test_logistic() {
  const p0 = logisticProbability(0, 1, 0);
  assert.ok(approx(p0, 0.5), `logistic(0) expected 0.5, got ${p0}`);
  const p2 = logisticProbability(2, 0.5, 0);
  const expected = 1 / (1 + Math.exp(-0.5 * 2));
  assert.ok(approx(p2, expected), `logistic(2) expected ${expected}, got ${p2}`);
}

function test_hybrid_basic() {
  // stub RNG that always returns 10
  const stub: any = { int: () => 10 };
  const outcome = hybridCheck(stub, 4, 1, 14); // roll 10 + 4 + 1 = 15 >= 14
  assert.strictEqual(outcome.roll, 10);
  assert.strictEqual(outcome.total, 15);
  assert.ok(outcome.success, 'Expected success when total >= DC');
}

function test_hybrid_critical_fumble() {
  const seq = [20, 1];
  const seqRng: any = { idx: 0, int: function() { return seq[this.idx++ % seq.length]; } };
  const crit = hybridCheck(seqRng, 0, 0, 0);
  assert.ok(crit.critical, 'Expected critical on natural 20');
  const fumble = hybridCheck(seqRng, 0, 0, 1000); // next call returns 1
  assert.ok(fumble.fumble, 'Expected fumble on natural 1');
}

function test_opposed() {
  // Sequence RNG returning attacker roll 12 then defender roll 8
  const seq: any = { idx: 0, values: [12, 8], int: function(min:number,max:number){ return this.values[this.idx++]; } };
  const res = opposedCheck(seq, 3, 0, 2, 0);
  // attacker total = 12+3=15, defender total =8+2=10 -> attackerWins true
  assert.strictEqual(res.attackerWins, true, 'Expected attacker to win opposed check');
  assert.strictEqual(res.margin, 5, 'Expected margin 5');
}

function runAll() {
  console.log('Running tests...');
  test_rng_repeatability();
  console.log(' RNG repeatability OK');
  test_logistic();
  console.log(' Logistic OK');
  test_hybrid_basic();
  console.log(' Hybrid basic OK');
  test_hybrid_critical_fumble();
  console.log(' Hybrid crit/fumble OK');
  test_opposed();
  console.log(' Opposed OK');
  // simulate tests
  const sim = require('./simulate_tests');
  sim.runSimTests();
  console.log(' Simulation tests OK');
  console.log('All tests passed');
}

runAll();
