import { makeNoise4D } from "fast-simplex-noise";
import { sfc32 } from "../random";

export default class NoiseField4D {
  sample: (x: number, y: number, z: number, w: number) => void;
  constructor(scale: number, seed = 0, strength = 1, offset = 0) {
    const randGenerator = sfc32(100 + seed, 200 + seed, 300 + seed, 444 + seed);
    const noise = makeNoise4D(randGenerator);
    this.sample = function sample(x: number, y: number, z: number, w: number) {
      return (
        noise(x * scale, y * scale, z * scale, w * scale) * strength + offset
      );
    };
  }
}
