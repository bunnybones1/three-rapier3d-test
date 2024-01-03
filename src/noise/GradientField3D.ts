import IField3D from "./IField3D";

export default class GradientField3D implements IField3D {
  constructor(
    private _xScale = 0,
    private _yScale = 0,
    private _zScale = 0,
    private _offset = 0
  ) {
    //
  }
  sample(x: number, y: number, z: number) {
    return (
      x * this._xScale + y * this._yScale + z * this._zScale + this._offset
    );
  }
}
