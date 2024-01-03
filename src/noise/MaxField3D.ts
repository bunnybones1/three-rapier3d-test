import IField3D from "./IField3D";

export default class MaxField3D implements IField3D {
  constructor(private _a: IField3D,private _b: IField3D) {
    //
  }
  sample(x: number, y: number, z: number) {
    return Math.max(this._a.sample(x, y, z), this._b.sample(x, y, z));
  }
}
