import IField3D from "./IField3D";
import { hashField } from "./hashField";

export default class DistortedField3D implements IField3D {
  sample: (x: number, y: number, z: number) => number;
  hash: string;
  args: IArguments;
  constructor(
    core: IField3D,
    xOffset?: IField3D,
    yOffset?: IField3D,
    zOffset?: IField3D
  ) {
    this.args = arguments;
    this.sample = function sample(x: number, y: number, z: number) {
      const x2 = xOffset ? x + xOffset.sample(x, y, z) : x;
      const y2 = yOffset ? y + yOffset.sample(x, y, z) : y;
      const z2 = zOffset ? z + zOffset.sample(x, y, z) : z;
      return core.sample(x2, y2, z2);
    };
    this.hash = hashField(this);
  }
}
