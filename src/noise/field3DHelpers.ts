import Average6Field3D from "./Average6Field3D";
import DistortedField3D from "./DistortedField3D";
import GradientField3D from "./GradientField3D";
import IField3D from "./IField3D";
import MaxField3D from "./MaxField3D";
import MinField3D from "./MinField3D";
import NoiseField3D from "./NoiseField3D";
import QuantizedCacheField3D from "./QuantizedCacheField3D";
import TranslateField3D from "./TranslateField3D";

export function flattenTop(core: IField3D, altitude: number, sharpness = 1) {
  return new MinField3D(core, new GradientField3D(0, -sharpness, 0, altitude));
}

export function flattenBottom(core: IField3D, altitude: number, sharpness = 1) {
  return new MaxField3D(core, new GradientField3D(0, -sharpness, 0, altitude));
}

export function makeDistortedNoise(
  scale: number,
  strength: number,
  distortionStrength: number,
  seed = 0
) {
  return new DistortedField3D(
    new NoiseField3D(scale, strength, seed),
    new NoiseField3D(scale, distortionStrength, seed + 1),
    new NoiseField3D(scale, distortionStrength, seed + 2),
    new NoiseField3D(scale, distortionStrength, seed + 3)
  );
}
export function makeTwiceDistortedNoise(
  scale: number,
  strength: number,
  distortionStrength: number,
  seed = 0
) {
  return new DistortedField3D(
    makeDistortedNoise(scale, strength, distortionStrength, seed + 4),
    new NoiseField3D(scale, distortionStrength * 2, seed + 5),
    new NoiseField3D(scale, distortionStrength * 2, seed + 6),
    new NoiseField3D(scale, distortionStrength * 2, seed + 7)
  );
}

export function makeDeepDownDistortedNoise(
  scale: number,
  strength: number,
  distortionStrength: number,
  iterations: number,
  seed = 0
) {
  let lastOne: IField3D = new NoiseField3D(scale, strength, seed);
  for (let i = 0; i < iterations; i++) {
    seed += 4;
    scale *= 2;
    strength *= 0.5;
    distortionStrength *= 0.5;
    lastOne = new DistortedField3D(
      lastOne,
      new NoiseField3D(scale, distortionStrength, seed + 1),
      new NoiseField3D(scale, distortionStrength, seed + 2),
      new NoiseField3D(scale, distortionStrength, seed + 3)
    );
  }
  return lastOne;
}

export function makeDeepAverage6(
  core: IField3D,
  xRange = 0.125,
  yRange = 0.125,
  zRange = 0.125,
  iterations: number
) {
  let lastOne: IField3D = new Average6Field3D(core, xRange, yRange, zRange);
  for (let i = 0; i < iterations; i++) {
    xRange *= 2;
    yRange *= 2;
    zRange *= 2;
    lastOne = new Average6Field3D(lastOne, xRange, yRange, zRange);
  }
  return lastOne;
}

export function makeDeepTranslatedAverage6(
  core: IField3D,
  xRange = 0.125,
  yRange = 0.125,
  zRange = 0.125,
  xBias = 0,
  yBias = 0,
  zBias = 0,
  iterations: number,
  cacheSubdivisions = 0
) {
  let lastOne: IField3D = new TranslateField3D(
    new Average6Field3D(core, xRange, yRange, zRange),
    xRange * xBias,
    yRange * yBias,
    zRange * zBias
  );
  if (cacheSubdivisions > 0) {
    lastOne = new QuantizedCacheField3D(lastOne, cacheSubdivisions);
  }
  for (let i = 0; i < iterations; i++) {
    xRange *= 2;
    yRange *= 2;
    zRange *= 2;
    lastOne = new TranslateField3D(
      new Average6Field3D(lastOne, xRange, yRange, zRange),
      xRange * xBias,
      yRange * yBias,
      zRange * zBias
    );
    if (cacheSubdivisions > 0) {
      lastOne = new QuantizedCacheField3D(lastOne, cacheSubdivisions);
    }
  }
  return lastOne;
}
