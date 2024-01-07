import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class MaxScalarField3D implements IField3D {
  sample: (x: number, y: number, z: number) => number;
  hash: string;
  args: IArguments;
  constructor(core: IField3D, max = 0) {
    this.args = arguments
    this.sample = function sample(x: number, y: number, z: number) {
      return Math.max(max, core.sample(x, y, z));
    };
    this.hash = hashField(this);
  }
}
