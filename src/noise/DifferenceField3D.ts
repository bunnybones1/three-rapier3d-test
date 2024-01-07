import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class DifferenceField3D implements IField3D {
  sample: (x: number, y: number, z: number) => number;
  hash: string;
  args: IArguments;
  constructor(a: IField3D, b: IField3D) {
    this.args = arguments;
    this.sample = function sample(x: number, y: number, z: number) {
      return a.sample(x, y, z) - b.sample(x, y, z);
    };
    this.hash = hashField(this);
  }
}
