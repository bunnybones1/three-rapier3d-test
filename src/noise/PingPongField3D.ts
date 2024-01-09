import { pingPong } from "../math";
import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class PingPongField3D implements IField3D {
  sample: (x: number, y: number, z: number) => number;
  hash: string;
  args: IArguments;
  constructor(core: IField3D, min:number, max:number) {
    this.args = arguments;
    this.sample = function sample(x: number, y: number, z: number) {
      return pingPong(core.sample(x, y, z), min, max);
    };
    this.hash = hashField(this);
  }
}
