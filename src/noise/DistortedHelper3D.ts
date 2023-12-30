import IHelper3D from "./IHelper3D";

export default class DistortedHelper3D implements IHelper3D {
  constructor(
    private _core: IHelper3D,
    private _xOffset?: IHelper3D,
    private _yOffset?: IHelper3D,
    private _zOffset?: IHelper3D
  ) {
    //
  }
  getValue(x: number, y: number, z: number) {
    const x2 = this._xOffset ? x + this._xOffset.getValue(x, y, z) : x;
    const y2 = this._yOffset ? y + this._yOffset.getValue(x, y, z) : y;
    const z2 = this._zOffset ? z + this._zOffset.getValue(x, y, z) : z;
    return this._core.getValue(x2, y2, z2);
  }
}
