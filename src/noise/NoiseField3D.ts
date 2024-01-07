import { makeNoise3D } from "fast-simplex-noise";
import { sfc32 } from "../random";
import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class NoiseField3D implements IField3D {
  sample: (x: number, y: number, z: number) => number;
  hash: string;
  args: IArguments;
  constructor(scale: number, strength = 1, seed = 0, offset = 0) {
    this.args = arguments
    const randGenerator = sfc32(100 + seed, 200 + seed, 300 + seed, 444 + seed);
    const noise = makeNoise3D(randGenerator);
    this.sample = function sample(x: number, y: number, z: number) {
      return noise(x * scale, y * scale, z * scale) * strength + offset;
    };
    this.hash = hashField(this);
  }
}
