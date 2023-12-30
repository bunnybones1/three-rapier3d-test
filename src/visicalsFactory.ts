import {
  BoxGeometry,
  BufferGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Scene,
  SphereGeometry,
} from "three";
import RAPIER from "@dimforge/rapier3d";
import VisicalRigid from "./VisicalRigid";
import {
  VisicalPresetName,
  getVisicalPreset,
} from "./physicalMaterialParameterLib";

let sharedBoxGeometry: BoxGeometry | undefined;
function getSharedBoxGeometry() {
  if (!sharedBoxGeometry) {
    sharedBoxGeometry = new BoxGeometry(1, 1, 1, 1, 1);
  }
  return sharedBoxGeometry!;
}

let sharedSphereGeometry: SphereGeometry | undefined;
function getSharedSphereGeometry() {
  if (!sharedSphereGeometry) {
    sharedSphereGeometry = new SphereGeometry(1, 32, 16);
  }
  return sharedSphereGeometry!;
}

export function makeSphere(
  scene: Scene,
  world: RAPIER.World,
  radius: number,
  type = RAPIER.RigidBodyType.Fixed,
  matParams: VisicalPresetName = "default"
) {
  const geometry = getSharedSphereGeometry();

  const colliderDesc = RAPIER.ColliderDesc.ball(radius);

  const v = makeVisical(scene, world, geometry, colliderDesc, type, matParams);
  v.visual.scale.setScalar(radius);
  return v;
}

export function makeCuboid(
  scene: Scene,
  world: RAPIER.World,
  width: number,
  height: number,
  depth: number,
  type = RAPIER.RigidBodyType.Fixed,
  matParams: VisicalPresetName = "default"
) {
  const geometry = getSharedBoxGeometry();

  const colliderDesc = RAPIER.ColliderDesc.cuboid(
    width * 0.5,
    height * 0.5,
    depth * 0.5
  );

  const v = makeVisical(scene, world, geometry, colliderDesc, type, matParams);
  v.visual.scale.set(width, height, depth)
  return v;
}

export function makeVisical(
  scene: Scene,
  world: RAPIER.World,
  geometry: BufferGeometry,
  colliderDesc: RAPIER.ColliderDesc,
  type = RAPIER.RigidBodyType.Fixed,
  matParams: VisicalPresetName = "default"
) {
  const preset = getVisicalPreset(matParams);
  const material = new MeshPhysicalMaterial(preset.materialParams);

  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);

  const bodyDesc = new RAPIER.RigidBodyDesc(type);
  colliderDesc.setDensity(preset.density);
  colliderDesc.setRestitution(preset.restitution);
  const body = world.createRigidBody(bodyDesc);
  world.createCollider(colliderDesc, body);

  return new VisicalRigid(mesh, body);
}
