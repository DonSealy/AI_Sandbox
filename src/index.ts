import express from 'express';
import cors from 'cors';
import { RNG } from './rng';
import { hybridCheck, logisticProbability, opposedCheck } from './action';
import { simulateHybrid, simulateLogistic, simulateOpposed } from './sim/core';
import { authMiddleware, signToken, requireRole } from './middleware/auth';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// apply auth for all following routes
app.use(authMiddleware);

app.post('/check', requireRole('player'), (req, res) => {
  const { seed, skill, modifiers = 0, DC } = req.body;
  if (typeof skill !== 'number' || typeof DC !== 'number') {
    return res.status(400).json({ error: 'skill and DC must be numbers' });
  }
  const rng = new RNG(seed);
  const outcome = hybridCheck(rng, skill, modifiers, DC);
  res.json(outcome);
});

app.post('/logistic', requireRole('player'), (req, res) => {
  const { skill, modifiers = 0, DC, k = 0.5 } = req.body;
  if (typeof skill !== 'number' || typeof DC !== 'number') {
    return res.status(400).json({ error: 'skill and DC must be numbers' });
  }
  const diff = skill + modifiers - DC;
  const p = logisticProbability(diff, k, 0);
  res.json({ p, diff });
});

app.post('/opposed', requireRole('player'), (req, res) => {
  const { seed, attSkill, attMods = 0, defSkill, defMods = 0 } = req.body;
  if (typeof attSkill !== 'number' || typeof defSkill !== 'number') {
    return res.status(400).json({ error: 'attSkill and defSkill must be numbers' });
  }
  const rng = new RNG(seed);
  const result = opposedCheck(rng, attSkill, attMods, defSkill, defMods);
  res.json(result);
});

// optional token issuing endpoint (disabled unless ALLOW_TOKEN_ISSUE=true)
if (process.env.ALLOW_TOKEN_ISSUE === 'true') {
  app.post('/auth/token', (req, res) => {
    const { sub, role, expiresIn } = req.body || {};
    const token = signToken({ sub, role }, expiresIn ? { expiresIn } : undefined);
    res.json({ token });
  });
}

// simulate requires admin role
app.post('/simulate', requireRole('admin'), (req, res) => {
  // body handling is already implemented above, but relocated here to enforce role
  const body = req.body || {};
  const algorithm = body.algorithm || 'hybrid';
  const iterations = Math.min(Number(body.iterations) || 10000, 200000); // cap to protect server
  const seed = body.seed;
  const rng = new RNG(seed);

  try {
    if (algorithm === 'hybrid') {
      const skill = Number(body.skill ?? 5);
      const mods = Number(body.modifiers ?? 0);
      const DC = Number(body.DC ?? 15);
      const result = simulateHybrid(rng, iterations, skill, mods, DC);
      return res.json(result);
    }
    if (algorithm === 'logistic') {
      const skill = Number(body.skill ?? 5);
      const mods = Number(body.modifiers ?? 0);
      const DC = Number(body.DC ?? 15);
      const k = Number(body.k ?? 0.5);
      const result = simulateLogistic(rng, iterations, skill, mods, DC, k);
      return res.json(result);
    }
    if (algorithm === 'opposed') {
      const attSkill = Number(body.attSkill ?? body.skill ?? 5);
      const attMods = Number(body.attMods ?? body.modifiers ?? 0);
      const defSkill = Number(body.defSkill ?? 4);
      const defMods = Number(body.defMods ?? 0);
      const result = simulateOpposed(rng, iterations, attSkill, attMods, defSkill, defMods);
      return res.json(result);
    }
    return res.status(400).json({ error: 'unknown algorithm' });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return res.status(500).json({ error: 'simulation error' });
  }
});



const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`ActionResolver API listening on port ${port}`);
});
