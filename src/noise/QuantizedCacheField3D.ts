import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class QuantizedCacheField3D implements IField3D {
  sample: (x: number, y: number, z: number) => number;
  args: IArguments;
  hash: string;
  constructor(core: IField3D, subDivisions = 4) {
    const cacheXYZ: number[][][] = [];
    let reusedCount = 0;
    let newCount = 0;
    this.args = arguments;
    this.sample = function sample(x: number, y: number, z: number) {
      const ix = Math.round(x * subDivisions);
      const iy = Math.round(y * subDivisions);
      const iz = Math.round(z * subDivisions);
      if (cacheXYZ[iz] === undefined) {
        cacheXYZ[iz] = [];
      }
      const cxy = cacheXYZ[iz];
      if (cxy[iy] === undefined) {
        cxy[iy] = [];
      }
      const cx = cxy[iy];
      let reused = true;
      if (cx[ix] === undefined) {
        cx[ix] = core.sample(x, y, z);
        reused = false;
      }
      if (reused) {
        reusedCount++;
      } else {
        newCount++;
      }
      return cx[ix];
    };
    this.hash = hashField(this);
  }
}
