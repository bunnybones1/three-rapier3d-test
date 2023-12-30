import { Matrix4, Object3D, Quaternion, Vector3 } from "three";
import RAPIER from "@dimforge/rapier3d";

export function matchTransform(obj: Object3D, objBody: RAPIER.RigidBody) {
  const p = objBody.translation();
  obj.position.set(p.x, p.y, p.z);
  const q = objBody.rotation();
  obj.quaternion.set(q.x, q.y, q.z, q.w);
}

export function getNormalRotation(normal: Vector3) {
  // set up direction
  let up = new Vector3(0, 1, 0);
  let axis: Vector3;
  // we want the vector to point in the direction of the face normal
  // determine an axis to rotate around
  // cross will not work if vec == +up or -up, so there is a special case
  if (normal.y == 1 || normal.y == -1) {
    axis = new Vector3(1, 0, 0);
  } else {
    axis = new Vector3().crossVectors(up, normal);
  }

  // determine the amount to rotate
  let radians = Math.acos(normal.dot(up));
  const quat = new Quaternion().setFromAxisAngle(axis, radians);

  return quat;
}

export function vec3RtoT(v: RAPIER.Vector3) {
  return new Vector3(v.x, v.y, v.z);
}

export function printNum(n: number) {
  return n.toFixed(2);
}

export function printVec(v: RAPIER.Vector3) {
  return `${printNum(v.x)}, ${printNum(v.y)}, ${printNum(v.z)}`;
}

export function getWorldPosition(p: RAPIER.Vector, obj: RAPIER.RigidBody) {
  const wp = new Vector3(p.x, p.y, p.z);
  const t = obj.translation();
  const q = obj.rotation();
  const mat = new Matrix4();
  mat.compose(
    new Vector3(t.x, t.y, t.z),
    new Quaternion(q.x, q.y, q.z, q.w),
    new Vector3(1, 1, 1)
  );
  mat.invert();
  wp.applyMatrix4(mat);
  return wp;
}
