import { makeNoise3D } from "fast-simplex-noise";
import { sfc32 } from "../random";
import IField3D from "./IField3D";

export default class NoiseField3D implements IField3D {
  private _noise: (x: number, y: number, z: number) => number;
  constructor(
    private _scale: number,
    private _strength = 1,
    seed = 0,
    private _offset = 0
  ) {
    const randGenerator = sfc32(100 + seed, 200 + seed, 300 + seed, 444 + seed);
    this._noise = makeNoise3D(randGenerator);
  }
  sample(x: number, y: number, z: number) {
    return (
      this._noise(x * this._scale, y * this._scale, z * this._scale) *
        this._strength +
      this._offset
    );
  }
}
