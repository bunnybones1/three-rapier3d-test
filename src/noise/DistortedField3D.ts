import IField3D from "./IField3D";

export default class DistortedField3D implements IField3D {
  constructor(
    private _core: IField3D,
    private _xOffset?: IField3D,
    private _yOffset?: IField3D,
    private _zOffset?: IField3D
  ) {
    //
  }
  sample(x: number, y: number, z: number) {
    const x2 = this._xOffset ? x + this._xOffset.sample(x, y, z) : x;
    const y2 = this._yOffset ? y + this._yOffset.sample(x, y, z) : y;
    const z2 = this._zOffset ? z + this._zOffset.sample(x, y, z) : z;
    return this._core.sample(x2, y2, z2);
  }
}
