import { Object3D, Quaternion, Vector3 } from "three";
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