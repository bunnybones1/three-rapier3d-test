import IField3D from "./IField3D";

export default class TranslateField3D implements IField3D {
  constructor(
    private _core: IField3D,
    private _x = 0,
    private _y = 0,
    private _z = 0
  ) {
    //
  }
  sample(x: number, y: number, z: number) {
    return this._core.sample(x - this._x, y - this._y, z - this._z);
  }
}
