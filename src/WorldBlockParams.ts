import { Plane } from "three";

export default class WorldBlockParams {
  updatePriority(seen: boolean, distanceFromCamera: number) {
    if (seen) {
      this.priorityScore =
        this.scaleRatio + (distanceFromCamera / this.scaleRatio) * 0.1;
    } else {
      this.priorityScore = 1000 + this.scaleRatio;
    }
  }
  priorityScore: number;
  constructor(
    public x: number,
    public y: number,
    public z: number,
    public scaleRatio: number,
    public makePhysicsMesh: boolean,
    public clippingPlanes?: Plane[]
  ) {
    this.priorityScore = scaleRatio;
  }
}
