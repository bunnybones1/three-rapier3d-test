import IField3D from "./IField3D";

export default class QuantizedCacheField3D implements IField3D {
  private cacheXYZ: number[][][] = [];
  reusedCount = 0;
  newCount = 0;
  constructor(private _core: IField3D, private subDivisions = 4) {
    //
    setInterval(() => {
      console.log("new " + this.newCount, "reused " + this.reusedCount);
    }, 1000);
  }
  sample(x: number, y: number, z: number) {
    const ix = Math.round(x * this.subDivisions);
    const iy = Math.round(y * this.subDivisions);
    const iz = Math.round(z * this.subDivisions);
    if (this.cacheXYZ[iz] === undefined) {
      this.cacheXYZ[iz] = [];
    }
    const cxy = this.cacheXYZ[iz];
    if (cxy[iy] === undefined) {
      cxy[iy] = [];
    }
    const cx = cxy[iy];
    let reused = true;
    if (cx[ix] === undefined) {
      cx[ix] = this._core.sample(x, y, z);
      reused = false;
    }
    if (reused) {
      this.reusedCount++;
    } else {
      this.newCount++;
    }
    return cx[ix];
  }
}
