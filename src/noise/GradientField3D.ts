import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class GradientField3D implements IField3D {
  sample: (x: number, y: number, z: number) => number;
  hash: string;
  args: IArguments;
  constructor(xScale = 0, yScale = 0, zScale = 0, offset = 0) {
    this.args = arguments;
    this.sample = function sample(x: number, y: number, z: number) {
      return x * xScale + y * yScale + z * zScale + offset;
    };
    this.hash = hashField(this);
  }
}
