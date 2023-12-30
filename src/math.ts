export function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

export function clamp01(val: number) {
  return Math.min(1, Math.max(0, val))
}

export function wrap(val: number, min: number, max: number) {
  const range = max - min
  return ((((val - min) % range) + range) % range) + min
}

export function pingPong(val: number, min: number, max: number) {
  const range = max - min
  const normalized = (val - min) / range
  const pinged = 1 - Math.abs((normalized % 2) - 1)
  return pinged * range + min
}

export function absFloor(val: number) {
  return Math.floor(Math.abs(val)) * (val < 0 ? -1 : 1)
}

export function fract(val: number, denom: number) {
  const temp = val / denom
  return temp - ~~temp
}

const tiny = 0.00001
export function closeEnough(val: number, val2: number) {
  return Math.abs(val - val2) < tiny
}

export const DEGREES_TO_RADIANS = Math.PI / 180

export function lerp(a: number, b: number, dt: number) {
  const out = a + dt * (b - a)
  return Math.abs(b - out) > 0.00001 ? out : b
}

export function makeLerp(a: number, b: number): (v: number) => number {
  return lerp.bind(null, a, b)
}

export function unlerp(min: number, max: number, value: number) {
  return (value - min) / (max - min)
}

export function unlerpClamped(min: number, max: number, value: number) {
  return clamp(unlerp(min, max, value), 0, 1)
}

const tau = Math.PI * 2
const tauAndHalf = Math.PI * 3
export function radiansDifference(a: number, b: number) {
  return ((((a - b) % tau) + tauAndHalf) % tau) - Math.PI
}

export function rand(min: number = 0, max: number = 1) {
  return Math.random() * (max - min) + min
}

export function rand2(scale: number = 1, offset: number = 0) {
  return (Math.random() * 2 - 1) * scale + offset
}

export function sqr(v: number) {
  return v * v
}

function roundTo(value: number, step: number = 1) {
  if (step === 0) {
    return value
  }
  const inv = 1.0 / step
  return Math.round(value * inv) / inv
}

export function makeSteppedClampCleaner(
  step: number,
  minValue: number,
  maxValue: number
) {
  return (val: number) => {
    return clamp(roundTo(val, step), minValue, maxValue)
  }
}

export function middleOut(idx: number) {
  const n = idx + 1
  return 0.25 * Math.pow(-1, n) * (2 * n + Math.pow(-1, n) - 1)
}
export function middleOut2(idx: number, rows: number): [number, number] {
  const x = middleOut(~~(idx / rows))
  const y = middleOut(idx % rows)
  return [x, y]
}

export function getIntRange(length: number, offset = 0) {
  const arr = new Array<number>(length)
  for (let i = 0; i < length; i++) {
    arr[i] = i + offset
  }
  return arr
}

export function getUInt32Range(length: number, offset = 0) {
  const arr = new Uint32Array(length)
  for (let i = 0; i < length; i++) {
    arr[i] = i + offset
  }
  return arr
}
