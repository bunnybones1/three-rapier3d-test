import IField3D from "./IField3D";

export default class AdditiveGroupField3D implements IField3D {
  constructor(private _layers: IField3D[]) {
    //
  }
  sample(x: number, y: number, z: number) {
    let val = 0;
    for (const noise of this._layers) {
      val += noise.sample(x, y, z);
    }
    return val;
  }
}
