import { Mesh, MeshPhysicalMaterial } from "three";
import MarchingCubes from "./MarchingCubes";
import {
  VisicalPresetName,
  getVisicalPreset,
} from "./physicalMaterialParameterLib";
import IHelper3D from "./noise/IHelper3D";

export function makeMarchingBlock(
  noiseHelper: IHelper3D,
  x: number,
  y: number,
  z: number,
  sizeInMetres: number,
  cellsPerMetre: number,
  material: VisicalPresetName
) {
  const resolution = sizeInMetres * cellsPerMetre;
  //marchingcube space is from -1 to 1, EXCEPT the meshifier omits 3 cells of row/column/stack
  const scaleFix = resolution / (resolution - 3);
  const scale = sizeInMetres * 0.5 * scaleFix;
  const scaleCompensator = scaleFix / cellsPerMetre;
  const marchingCubes = new MarchingCubes(
    resolution,
    scale,
    scaleCompensator * 1.5
  );
  for (let iz = 0; iz < resolution; iz++) {
    for (let iy = 0; iy < resolution; iy++) {
      for (let ix = 0; ix < resolution; ix++) {
        const gy = y + iy * scaleCompensator;
        const v = noiseHelper.getValue(
          x + ix * scaleCompensator,
          gy,
          z + iz * scaleCompensator
        );
        marchingCubes.setCell(ix, iy, iz, v * 100);
      }
    }
  }
  marchingCubes.update();
  if (marchingCubes.geometry) {
    const vp = getVisicalPreset(material);
    const mesh = new Mesh(
      marchingCubes.geometry,
      new MeshPhysicalMaterial(vp.materialParams)
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
