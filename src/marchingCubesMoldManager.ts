import MarchingCubes from "./MarchingCubes";

const molds = new Map<number, MarchingCubes>();
export function getMarchingCubes(resolution: number) {
  if (!molds.has(resolution)) {
    molds.set(resolution, new MarchingCubes(resolution));
  }
  return molds.get(resolution)!;
}
