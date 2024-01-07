import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class Average6Field3D implements IField3D {
  sample: (x: number, y: number, z: number) => number;
  hash: string;
  args: IArguments;
  constructor(core: IField3D, xRange = 0.125, yRange = 0.125, zRange = 0.125) {
    this.args = arguments;
    this.sample = function sample(x: number, y: number, z: number) {
      const sum =
        core.sample(x - xRange, y, z) +
        core.sample(x + xRange, y, z) +
        core.sample(x, y - yRange, z) +
        core.sample(x, y + yRange, z) +
        core.sample(x, y, z - zRange) +
        core.sample(x, y, z + zRange) +
        core.sample(x, y, z);
      return sum / 7;
    };
    this.hash = hashField(this);
  }
}
