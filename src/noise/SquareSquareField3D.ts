import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class SquareSquareField3D implements IField3D {
  sample: (x: number, y: number, z: number) => number;
  hash: string;
  args: IArguments;
  constructor(core: IField3D) {
    this.args = arguments;
    this.sample = function sample(x: number, y: number, z: number) {
      const v = core.sample(x, y, z);
      return v * v * v * v;
    };
    this.hash = hashField(this);
  }
}
