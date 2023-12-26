import { Object3D } from "three";
import RAPIER from "@dimforge/rapier3d";

export function matchTransform(obj: Object3D, objBody: RAPIER.RigidBody) {
  const p = objBody.translation();
  obj.position.set(p.x, p.y, p.z);
  const q = objBody.rotation();
  obj.quaternion.set(q.x, q.y, q.z, q.w);
}
