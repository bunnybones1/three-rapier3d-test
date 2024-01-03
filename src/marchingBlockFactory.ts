import { Mesh, MeshPhysicalMaterial, Plane } from "three";
import MarchingCubes from "./MarchingCubes";
import {
  VisicalPresetName,
  getVisicalPreset,
} from "./physicalMaterialParameterLib";
import IField3D from "./noise/IField3D";

let id = 0;
export function makeMarchingBlock(
  noiseHelper: IField3D,
  x: number,
  y: number,
  z: number,
  sizeInMetres: number,
  cellsPerMetre: number,
  material: VisicalPresetName,
  clippingPlanes?: Plane[]
) {
  const resolution = sizeInMetres * cellsPerMetre;
  const paddedRes = resolution + 3;
  //marchingcube space is from -1 to 1, EXCEPT the meshifier omits 3 cells of row/column/stack
  const scaleFix = paddedRes / (paddedRes - 3);
  const scale = sizeInMetres * 0.5 * scaleFix;
  const marchingCubes = new MarchingCubes(
    paddedRes,
    scale,
    0.5 / cellsPerMetre
  );
  for (let iz = 0; iz < paddedRes; iz++) {
    for (let iy = 0; iy < paddedRes; iy++) {
      for (let ix = 0; ix < paddedRes; ix++) {
        const tx = x + ((ix + 0.25) / paddedRes - 0.5) * scale * 2;
        const ty = y + ((iy + 0.25) / paddedRes - 0.5) * scale * 2;
        const tz = z + ((iz + 0.25) / paddedRes - 0.5) * scale * 2;
        const v = noiseHelper.sample(tx, ty, tz);
        marchingCubes.setCell(ix, iy, iz, v * 100);
      }
    }
  }
  id++;
  marchingCubes.update();
  if (marchingCubes.geometry) {
    const vp = getVisicalPreset(material);
    const mesh = new Mesh(
      marchingCubes.geometry,
      new MeshPhysicalMaterial({
        ...vp.materialParams,
        clippingPlanes,
        clipShadows: true
        // clipIntersection: true,
      })
    );
    mesh.castShadow = mesh.receiveShadow = true;

    mesh.position.set(x, y, z);
    // mesh.position.addScalar(sizeInMetres * 0.5);
    mesh.geometry.boundingSphere!.radius *= scale;
    return mesh;
  } else {
    return undefined;
  }
}
