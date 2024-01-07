import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class ScaleVectorField3D implements IField3D {
  sample: (x: number, y: number, z: number) => number;
  hash: string;
  args: IArguments;
  constructor(a: IField3D, xScale: number, yScale: number, zScale: number) {
    this.args = arguments;
    this.sample = function sample(x: number, y: number, z: number) {
      return a.sample(x * xScale, y * yScale, z * zScale);
    };
    this.hash = hashField(this);
  }
}
