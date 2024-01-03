import IField3D from "./IField3D";

export default class MaxScalarField3D implements IField3D {
  constructor(private _core: IField3D, private _max = 0) {
    //
  }
  sample(x: number, y: number, z: number) {
    return Math.max(this._max, this._core.sample(x, y, z));
  }
}
