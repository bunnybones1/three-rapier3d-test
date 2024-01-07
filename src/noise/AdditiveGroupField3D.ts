import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class AdditiveGroupField3D implements IField3D {
  sample: (x: number, y: number, z: number) => number;
  hash: string;
  args: IArguments;
  constructor(layers: IField3D[]) {
    this.args = arguments;
    this.sample = function sample(x: number, y: number, z: number) {
      let val = 0;
      for (const noise of layers) {
        val += noise.sample(x, y, z);
      }
      return val;
    };
    this.hash = hashField(this);
  }
}
