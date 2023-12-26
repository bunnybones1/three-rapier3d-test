import { Intersection, Matrix4, Vector3 } from "three";

const __mat4 = new Matrix4();
export default class WrappedIntersection {
  public relativePoint: Vector3;
  constructor(
    public intersection: Intersection,
    public x: number,
    public y: number
  ) {
    __mat4.copy(intersection.object.matrixWorld);
    __mat4.invert();
    this.relativePoint = intersection.point.clone().applyMatrix4(__mat4);
  }
}
