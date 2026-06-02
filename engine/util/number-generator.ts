const MASK_256 = (1n << 256n) - 1n;

export function mulberry32(seed: number): number {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function getRandFromSeeds(a: bigint, b?: bigint, c?: bigint): number {
    const mergedSeed = mergeSeeds(a, b, c);
    return mulberry32(bigintToSeed(mergedSeed));
}

export function mergeSeeds(a: bigint, b: bigint = 0n, c: bigint = 0n): bigint {
    return mix(a ^ rotl(b, 17n) ^ (c * 0x9e3779b97f4a7c15n));
}

function bigintToSeed(x: bigint): number {
  return Number(x & 0xffffffffn);
}

function rotl(x: bigint, k: bigint): bigint {
  k = k % 256n;
  return ((x << k) | (x >> (256n - k))) & MASK_256;
}

function mix(x: bigint): bigint {
  x ^= x >> 33n;
  x *= 0xff51afd7ed558ccdn;
  x ^= x >> 33n;
  x *= 0xc4ceb9fe1a85ec53n;
  x ^= x >> 33n;

  return x;
}