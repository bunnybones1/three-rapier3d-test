import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class TranslateField3D implements IField3D {
  sample: (x: number, y: number, z: number) => number;
  args: IArguments;
  hash: string;
  constructor(core: IField3D, tx = 0, ty = 0, tz = 0) {
    this.args = arguments;
    this.sample = function sample(x: number, y: number, z: number) {
      return core.sample(x - tx, y - ty, z - tz);
    };
    this.hash = hashField(this);
  }
}
