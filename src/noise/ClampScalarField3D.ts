import { clamp } from "../math";
import IField3D from "./IField3D";

export default class ClampScalarField3D implements IField3D {
  constructor(private _core: IField3D, private _min = 0, private _max = 1) {
    //
  }
  sample(x: number, y: number, z: number) {
    return clamp(this._core.sample(x, y, z), this._min, this._max);
  }
}
