import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class MinField3D implements IField3D {
  hash: string;
  args: IArguments;
  sample: (x: number, y: number, z: number) => number;
  constructor(a: IField3D, b: IField3D) {
    this.args = arguments;
    this.sample = function sample(x: number, y: number, z: number) {
      return Math.min(a.sample(x, y, z), b.sample(x, y, z));
    };
    this.hash = hashField(this);
  }
}
