import { Euler, EulerOrder, Object3D, Quaternion } from "three";
import RAPIER from "@dimforge/rapier3d";
import { matchTransform } from "./utils";

const __euler = new Euler();
const __quat = new Quaternion();

export default class VisicalRigid {
  constructor(public visual: Object3D, public physical: RAPIER.RigidBody) {
    //
  }
  matchTransform() {
    matchTransform(this.visual, this.physical);
  }
  setPosition(x: number, y: number, z: number) {
    this.physical.setTranslation(new RAPIER.Vector3(x, y, z), false);
  }
  setEuler(x: number, y: number, z: number, order?: EulerOrder) {
    __euler.set(x, y, z, order);
    __quat.setFromEuler(__euler);
    this.physical.setRotation(__quat, false);
  }
}
