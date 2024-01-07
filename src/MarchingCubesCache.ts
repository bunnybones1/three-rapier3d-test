import { BufferGeometry } from "three";
import MarchingCubes from "./MarchingCubes";

/**
 * Port of http://webglsamples.org/blob/blob.html
 */

export default class MarchingCubesCache {
  field: Float32Array;
  geometry?: BufferGeometry;
  setCell: (x: number, y: number, z: number, value: number) => void;
  reset: () => void;
  getCell: (x: number, y: number, z: number) => number;

  constructor(public mold: MarchingCubes) {
    const size = mold.size;
    const size2 = size * size;
    const size3 = size * size * size;
    const field = new Float32Array(size3);
    this.field = field;

    this.setCell = function setCell(
      x: number,
      y: number,
      z: number,
      value: number
    ) {
      const index = size2 * z + size * y + x;
      field[index] = value;
    };

    this.getCell = function getCell(x: number, y: number, z: number) {
      const index = size2 * z + size * y + x;
      return field[index];
    };

    this.reset = function reset() {
      for (let i = 0; i < size3; i++) {
        field[i] = 0.0;
      }
    };
  }
}
