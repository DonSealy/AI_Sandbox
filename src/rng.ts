export function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  private randFunc: () => number;
  constructor(seed?: number) {
    if (seed == null) seed = Math.floor(Math.random() * 2 ** 31);
    this.randFunc = mulberry32(seed);
  }
  int(min: number, max: number) {
    return Math.floor(this.randFunc() * (max - min + 1)) + min;
  }
  float() {
    return this.randFunc();
  }
}
