import IField3D from "./IField3D";

export default class MinScalarField3D implements IField3D {
  constructor(private _core: IField3D, private _min = 0) {
    //
  }
  sample(x: number, y: number, z: number) {
    return Math.min(this._min, this._core.sample(x, y, z));
  }
}
