import {
  CircleGeometry,
  CylinderGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { getKeyboard } from "./keyboardSingleton";
import RAPIER from "@dimforge/rapier3d";
import { makeSphere } from "./visicalsFactory";
import VisicalRigid from "./VisicalRigid";
import { getNormalRotation, vec3RtoT } from "./utils";
import { lerp } from "./math";

const TICKS_TOTAL = 5;
const SPEED_RUNNING = 0.08;
const SPEED_WALKING = 0.04;
const SPEED_CROUCHING = 0.02;
const LEG_LENGTH_STANDING = 1;
const LEG_LENGTH_CROUCHING = 0.2;
const PLAYER_RADIUS = 0.4;
const STEP_DOWN_REACH = 1;
const ROTATION_SPEED = 0.005;

const __direction = new Vector2();
const ORIGIN2 = new Vector2();

export default class Player {
  keyboard = getKeyboard();
  visical: VisicalRigid;
  legs: number[] = [];
  tick = TICKS_TOTAL;
  legLength: number = LEG_LENGTH_STANDING;
  speed: number = SPEED_WALKING;
  private _rotateActive: boolean = false;
  cameraAngle: number = 0;
  legShadowCaster!: Mesh;
  constructor(
    private world: RAPIER.World,
    scene: Scene,
    private camera: PerspectiveCamera,
    renderer: WebGLRenderer
  ) {
    const visical = makeSphere(
      scene,
      world,
      PLAYER_RADIUS,
      RAPIER.RigidBodyType.Dynamic,
      "meat"
    );
    visical.physical.collider(0).setRestitution(0);
    visical.physical.lockRotations(true, false);
    visical.setPosition(0, 0.8, 5);
    // visical.visual.add(camera);
    // camera.position.set(0, 0, 0);

    const legShadowCasterGeo = new CylinderGeometry(0.2, 0.3, 1);
    const posAttrBuffer = legShadowCasterGeo.getAttribute("position").array;
    for (let i = 1; i < posAttrBuffer.length; i += 3) {
      posAttrBuffer[i] += 0.5;
    }

    const shadowMat = new MeshBasicMaterial();
    shadowMat.colorWrite = false;
    shadowMat.depthWrite = false;
    const legShadowCaster = new Mesh(legShadowCasterGeo, shadowMat);
    legShadowCaster.castShadow = true;
    legShadowCaster.position.y = -PLAYER_RADIUS;
    legShadowCaster.rotation.x = Math.PI;
    visical.visual.add(legShadowCaster);

    this.visical = visical;
    this.legShadowCaster = legShadowCaster;

    document.addEventListener(
      "pointerlockchange",
      () => {
        this._rotateActive =
          document.pointerLockElement === renderer.domElement;
      },
      false
    );

    document.addEventListener("click", function () {
      if (!document.pointerLockElement) {
        renderer.domElement.requestPointerLock();
      }
    });
    window.addEventListener("keypress", (e) => {
      if (e.code === "Escape") {
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      }
    });

    const crosshair = new Mesh(
      new CircleGeometry(0.01, 3, Math.PI * -0.5),
      new MeshBasicMaterial({ wireframe: true })
    );
    camera.add(crosshair);
    crosshair.position.z = -0.2;

    const lookAtTarget = new Object3D();
    // camera.parent!.add(lookAtTarget);

    document.addEventListener(
      "mousemove",
      (e) => {
        if (this._rotateActive) {
          camera.rotateY(e.movementX * -ROTATION_SPEED);
          camera.rotateX(e.movementY * -ROTATION_SPEED);
          lookAtTarget.position.copy(camera.position);
          lookAtTarget.rotation.copy(camera.rotation);
          lookAtTarget.translateZ(-1);
          this.cameraAngle =
            Math.PI * 0.5 -
            Math.atan2(
              camera.position.z - lookAtTarget.position.z,
              camera.position.x - lookAtTarget.position.x
            );
          camera.lookAt(lookAtTarget.position);
        }
      },
      false
    );
  }
  update() {
    const isRunning = this.keyboard.isPressed("ShiftLeft");
    this.camera.position.copy(this.visical.visual.position);
    const isCrouched = this.keyboard.isPressed("ControlLeft");
    this.legLength = isCrouched ? LEG_LENGTH_CROUCHING : LEG_LENGTH_STANDING;
    this.speed = isCrouched
      ? SPEED_CROUCHING
      : isRunning
      ? SPEED_RUNNING
      : SPEED_WALKING;
    this.tick--;
    if (this.tick === 0) {
      this.tick = TICKS_TOTAL;
      if (this.legs.length > 0) {
        const j = this.world.getImpulseJoint(this.legs[0]);
        this.world.removeImpulseJoint(j, true);
        this.legs.length = 0;
      }
    }
    if (this.legs.length === 0) {
      let closestIntersection: RAPIER.RayColliderIntersection | undefined;
      const origin = vec3RtoT(this.visical.physical.translation());
      const down = vec3RtoT(this.world.gravity).normalize();
      const bottom = down.clone().multiplyScalar(PLAYER_RADIUS);
      origin.add(bottom);

      this.world.intersectionsWithRay(
        new RAPIER.Ray(origin, down),
        this.legLength + STEP_DOWN_REACH,
        false,
        (intersection) => {
          if (
            !closestIntersection ||
            closestIntersection.toi > intersection.toi
          ) {
            closestIntersection = intersection;
          }
          return true;
        },
        undefined,
        undefined,
        this.visical.physical.collider(0),
        this.visical.physical
      );
      if (closestIntersection) {
        const hitPos = origin;
        const offset = down.clone().multiplyScalar(closestIntersection.toi);
        hitPos.add(offset);
        const destObjCol = closestIntersection.collider;
        const destObj = destObjCol.parent()!;
        const hitVec = new Vector3(hitPos.x, hitPos.y, hitPos.z);
        const destPos = destObj.translation();
        const destQuat = destObj.rotation();
        const destMat = new Matrix4();
        const qq = new Quaternion(
          destQuat.x,
          destQuat.y,
          destQuat.z,
          destQuat.w
        );
        destMat.compose(
          new Vector3(destPos.x, destPos.y, destPos.z),
          qq,
          new Vector3(1, 1, 1)
        );
        destMat.invert();
        hitVec.applyMatrix4(destMat);

        // this.visical.physical.collider(0).
        // p.y = 1;
        const jd = RAPIER.JointData.fixed(
          // new RAPIER.Vector3(0, -0.4, 0),
          bottom.clone().add(offset),
          getNormalRotation(down.clone().multiplyScalar(-1)),
          // new RAPIER.Vector3(0, 0.2, 0),
          hitVec,
          qq.invert()
        );
        const j = this.world.createImpulseJoint(
          jd,
          this.visical.physical,
          closestIntersection.collider.parent()!,
          true
        );
        this.legs.push(j.handle);
      }
    }
    if (this.legs.length > 0) {
      let deltaZ = 0;
      if (this.keyboard.isPressed("KeyW")) {
        deltaZ = this.speed;
        // this.visical.physical.applyImpulse(new RAPIER.Vector3(0, 0, 3), true)
      } else if (this.keyboard.isPressed("KeyS")) {
        deltaZ = -this.speed;
        //
      }
      let deltaX = 0;
      if (this.keyboard.isPressed("KeyA")) {
        deltaX = this.speed;
        //
      } else if (this.keyboard.isPressed("KeyD")) {
        deltaX = -this.speed;
        //
      }
      const j = this.world.getImpulseJoint(this.legs[0]);
      const a = j.anchor1();
      __direction.set(deltaX, deltaZ);
      __direction.rotateAround(ORIGIN2, -this.cameraAngle);
      const y = lerp(a.y, -(PLAYER_RADIUS + this.legLength), 0.1);
      j.setAnchor1(
        new RAPIER.Vector3(a.x + __direction.x, y, a.z + __direction.y)
      );
      j.body1().wakeUp();
      this.legShadowCaster.scale.y = -y - PLAYER_RADIUS - 0.05;
    }
  }
}
