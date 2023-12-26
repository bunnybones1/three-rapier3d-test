import {
  BoxGeometry,
  BufferGeometry,
  Mesh,
  MeshPhongMaterial,
  Scene,
  SphereGeometry,
} from "three";
import RAPIER from "@dimforge/rapier3d";
import VisicalRigid from "./VisicalRigid";

export function makeSphere(
  scene: Scene,
  world: RAPIER.World,
  radius: number,
  type = RAPIER.RigidBodyType.Fixed,
  color = 0xffffff
) {
  const geometry = new SphereGeometry(radius, 32, 16);

  const colliderDesc = RAPIER.ColliderDesc.ball(radius);

  return makeVisical(scene, world, geometry, colliderDesc, type, color);
}

export function makeCuboid(
  scene: Scene,
  world: RAPIER.World,
  width: number,
  height: number,
  depth: number,
  type = RAPIER.RigidBodyType.Fixed,
  color = 0xffffff
) {
  const geometry = new BoxGeometry(width, height, depth, 1, 1);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(
    width * 0.5,
    height * 0.5,
    depth * 0.5
  );

  return makeVisical(scene, world, geometry, colliderDesc, type, color);
}

export function makeVisical(
  scene: Scene,
  world: RAPIER.World,
  geometry: BufferGeometry,
  colliderDesc: RAPIER.ColliderDesc,
  type = RAPIER.RigidBodyType.Fixed,
  color = 0xffffff
) {
  const material = new MeshPhongMaterial({ color });

  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);

  const bodyDesc = new RAPIER.RigidBodyDesc(type);
  colliderDesc.setRestitution(0.8);
  const body = world.createRigidBody(bodyDesc);
  world.createCollider(colliderDesc, body);

  return new VisicalRigid(mesh, body);
}
