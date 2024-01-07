import { Mesh, MeshPhysicalMaterial, Plane } from "three";
import {
  VisicalPresetName,
  getVisicalPreset,
} from "./physicalMaterialParameterLib";
import IField3D from "./noise/IField3D";
import { getMarchingCubes } from "./marchingCubesMoldManager";
import MarchingCubesCache from "./MarchingCubesCache";
import { getDBManager } from "./dbManager";

let id = 0;
export async function makeMarchingBlock(
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
  const marchingCubesMold = getMarchingCubes(paddedRes);
  const marchingCubes = new MarchingCubesCache(marchingCubesMold);
  const db = await getDBManager().db;
  const readTx = db.transaction("worldDensities", "readonly");
  const readStore = readTx.objectStore("worldDensities");
  // // debugger
  const key = `${noiseHelper.hash};${x};${y};${z};${sizeInMetres};${cellsPerMetre}`;
  const val = await readStore.get(key);
  await readTx.done;
  console.log(key, !!val);
  if (val) {
    const b = val as Blob;
    const data = await b.arrayBuffer();
    marchingCubes.field = new Float32Array(data);
    marchingCubesMold.updateGeometry(scale, 0.5 / cellsPerMetre, marchingCubes);
  } else {
    marchingCubesMold.sample(
      x,
      y,
      z,
      scale,
      0.5 / cellsPerMetre,
      noiseHelper,
      marchingCubes
    );
    const blob = new Blob([marchingCubes.field.buffer]);
    const writeTx = db.transaction("worldDensities", "readwrite");
    const writeStore = writeTx.objectStore("worldDensities");
    await writeStore.put(blob, key);
    await writeTx.done;
  }
  id++;
  if (marchingCubes.geometry) {
    const vp = getVisicalPreset(material);
    const mesh = new Mesh(
      marchingCubes.geometry,
      new MeshPhysicalMaterial({
        ...vp.materialParams,
        clippingPlanes,
        clipShadows: true,
        // clipIntersection: true,
      })
    );
    mesh.castShadow = mesh.receiveShadow = true;

    mesh.position.set(x, y, z);
    // mesh.position.addScalar(sizeInMetres * 0.5);
    return mesh;
  } else {
    return undefined;
  }
}
