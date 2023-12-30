import Stats from "three/examples/jsm/libs/stats.module";
import RAPIER from "@dimforge/rapier3d";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Color,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import VisicalRigid from "./VisicalRigid";
import { makeCuboid, makeSphere } from "./visicalsFactory";
import WrappedIntersection from "./WrappedIntersection";
import { getUrlFlag } from "./location";
import Player from "./Player";
import Animator from "./Animator";
import { getVisicalPreset } from "./physicalMaterialParameterLib";
import NoiseHelper3D from "./noise/NoiseHelper3D";
import MarchingCubes from "./MarchingCubes";

const __rayCaster = new Raycaster();

const ORIGIN = new Vector3();
const WATER_LEVEL = -0.5;
const FOG_FAR_BELOW_WATER = 10;
const FOG_FAR_ABOVE_WATER = 100;

const CELLS_PER_METRE = 4;
const BLOCK_SIZE_METRES = 4;
const HALF_BLOCK_SIZE_METRES = BLOCK_SIZE_METRES * 0.5;
const BLOCK_RES = CELLS_PER_METRE * BLOCK_SIZE_METRES;

export default class GameClient {
  private renderer!: WebGLRenderer;
  private scene!: Scene;
  private camera!: PerspectiveCamera;

  private controls!: OrbitControls;
  private stats!: any;

  private visicals: VisicalRigid[] = [];

  private link: Mesh | undefined;
  private closestOnMouseDown: WrappedIntersection | undefined;
  private closestOnMouseMove: WrappedIntersection | undefined;
  private lastMouseMoveX: number = -1;
  private lastMouseMoveY: number = -1;

  world!: RAPIER.World;
  player?: Player;
  animator!: Animator;
  private _pointerLocked: boolean = false;
  skyColor!: Color;
  waterColorShallow!: Color;
  waterColorDeep!: Color;
  waterColor!: Color;
  fog!: Fog;
  private noiseHelper = new NoiseHelper3D(0.2, 0);
  private noiseBlockKeysSeen = new Set<string>();
  lastX: number = 0;
  lastY: number = 0;
  lastZ: number = 0;

  constructor() {
    this.initScene();
    this.initStats();
    this.initListeners();
    this.animate();
  }

  initStats() {
    this.stats = new (Stats as any)();
    document.body.appendChild(this.stats.dom);
  }

  initScene() {
    const world = new RAPIER.World(new RAPIER.Vector3(0, -9.8, 0));
    // const world = new RAPIER.World(new RAPIER.Vector3(-1, -7, 0));
    const frameDuration = 1 / 60;
    world.timestep = frameDuration;
    this.animator = new Animator(frameDuration);

    this.world = world;

    const skyColor = new Color(0.5, 0.7, 0.9);
    const waterColorShallow = new Color(0, 0.3, 0.8);
    const waterColorDeep = new Color(-0.3, 0.1, 0.6);

    const scene = new Scene();
    const fog = new Fog(skyColor, 0, FOG_FAR_ABOVE_WATER);
    scene.fog = fog;
    this.fog = fog;
    this.scene = scene;

    scene.background = skyColor;

    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.scene.add(this.camera);

    this.renderer = new WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.renderer.domElement);

    if (getUrlFlag("fps")) {
      this.camera.position.y = 1;
      this.camera.position.z = 7;
      const player = new Player(world, scene, this.camera, this.renderer);
      this.visicals.push(player.visical);
      this.player = player;
    } else {
      this.camera.position.y = 1;
      this.camera.position.z = 5;
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    }

    this.skyColor = skyColor;
    this.waterColorDeep = waterColorDeep;
    this.waterColorShallow = waterColorShallow;
    this.waterColor = waterColorShallow.clone();

    const lightAmbient = new HemisphereLight(
      skyColor,
      new Color(0.5, 0.4, 0.3),
      2
    );
    scene.add(lightAmbient);

    const sunLight = new DirectionalLight(new Color(0.8, 0.7, 0.6), 5);
    sunLight.shadow.camera.left -= 5;
    sunLight.shadow.camera.right += 5;
    sunLight.shadow.camera.bottom -= 5;
    sunLight.shadow.camera.top += 5;
    sunLight.shadow.camera.updateProjectionMatrix();
    // this.lightPoint.position.set(0, 1, 0).normalize();
    sunLight.position.set(-0.5, 2.5, 4).normalize().multiplyScalar(10);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const mapSize = 1024; // Default 512
    const cameraNear = 0.5; // Default 0.5
    const cameraFar = 50; // Default 500
    sunLight.shadow.mapSize.width = mapSize;
    sunLight.shadow.mapSize.height = mapSize;
    sunLight.shadow.camera.near = cameraNear;
    sunLight.shadow.camera.far = cameraFar;

    const island = makeSphere(scene, world, 24, undefined, "sand");
    island.setPosition(0, -24, 0);
    this.visicals.push(island);

    const ground = makeCuboid(scene, world, 6, 2, 12, undefined, "concrete");
    ground.setPosition(2, -1, 0);
    this.visicals.push(ground);

    const ground2 = makeCuboid(scene, world, 100, 2, 100, undefined, "sand");
    ground2.setPosition(0, -8, 0);
    this.visicals.push(ground2);

    const waterSurface = new Mesh(
      new PlaneGeometry(1000, 1000, 8, 8),
      new MeshPhysicalMaterial(getVisicalPreset("water").materialParams)
    );
    this.scene.add(waterSurface);
    waterSurface.receiveShadow = true;
    waterSurface.rotation.x = Math.PI * 0.5;
    waterSurface.position.y = WATER_LEVEL;

    const total = 8;
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2;
      const platform = makeCuboid(scene, world, 2, 0.1, 2.5, undefined, "wood");
      platform.setPosition(Math.cos(angle) * 2, 0.2, Math.sin(angle) * 2);
      platform.setEuler(0, -angle, 0.25);
      this.visicals.push(platform);

      // const wall = makeCuboid(scene, world, 2, 0.1, 2.5, undefined, 0x7fff7f);
      // wall.setPosition(Math.cos(angle) * 3, 1.5, Math.sin(angle) * 3);
      // wall.setEuler(0, -angle, Math.PI * 0.5);
      // this.visicals.push(wall);
    }
    const total2 = 16;
    for (let i = 0; i < total2; i++) {
      const angle = (i / total2) * Math.PI * 2;
      const platform = makeCuboid(
        scene,
        world,
        1,
        0.3,
        1,
        RAPIER.RigidBodyType.Dynamic,
        i % 2 === 0 ? "wood" : "concrete"
      );
      platform.setPosition(Math.cos(angle) * 7, 0.05, Math.sin(angle) * 5);
      platform.setEuler(0, -angle, 0);
      this.visicals.push(platform);

      // const wall = makeCuboid(scene, world, 2, 0.1, 2.5, undefined, 0x7fff7f);
      // wall.setPosition(Math.cos(angle) * 3, 1.5, Math.sin(angle) * 3);
      // wall.setEuler(0, -angle, Math.PI * 0.5);
      // this.visicals.push(wall);
    }

    const type = RAPIER.RigidBodyType.Dynamic;

    for (let i = 0; i < 5; i++) {
      const box = makeCuboid(scene, world, 0.5, 0.5, 0.5, type, "plastic");
      box.setPosition(0, 2 + i * 0.5, 0);
      this.visicals.push(box);

      const ball = makeSphere(scene, world, 0.25, type, "plastic");
      ball.setPosition(0.1, 2 + i * 0.5, 0);
      this.visicals.push(ball);
    }
  }

  makeBlock(x: number, y: number, z: number) {
    const mc = new MarchingCubes(
      BLOCK_RES,
      new MeshPhysicalMaterial(getVisicalPreset("sand").materialParams)
    );
    mc.castShadow = mc.receiveShadow = true;
    const scale = BLOCK_RES / (BLOCK_RES - 3);
    // const t = unlerp(-3/4, 7/8, 0)
    mc.scale.setScalar(BLOCK_SIZE_METRES * 0.5 * scale);
    mc.position.set(x, y, z);
    mc.position.addScalar(BLOCK_SIZE_METRES * 0.5);
    const scaleCompensator = scale / CELLS_PER_METRE;
    for (let iz = 0; iz < BLOCK_RES; iz++) {
      for (let iy = 0; iy < BLOCK_RES; iy++) {
        for (let ix = 0; ix < BLOCK_RES; ix++) {
          const gy = y + iy * scaleCompensator;
          const v = this.noiseHelper.getValue(
            x + ix * scaleCompensator,
            gy,
            z + iz * scaleCompensator
          );
          mc.setCell(ix, iy, iz, v * 1000 - gy * 300);
        }
      }
    }
    mc.update();
    mc.geometry.computeBoundingBox();
    this.scene.add(mc);
    return mc;
  }

  getClosest = (x: number, y: number) => {
    __rayCaster.setFromCamera(
      new Vector2(
        (x / window.innerWidth) * 2 - 1,
        -((y / window.innerHeight) * 2 - 1)
      ),
      this.camera
    );
    const intersections = __rayCaster.intersectObjects(
      this.visicals
        .filter((v) => v !== this.player?.visical)
        .map((v) => v.visual)
    );
    if (intersections.length > 0) {
      return new WrappedIntersection(intersections[0], x, y);
    } else {
      return undefined;
    }
  };

  initListeners() {
    window.addEventListener("resize", this.onWindowResize.bind(this), false);

    window.addEventListener("keydown", (event) => {
      const { key } = event;

      switch (key) {
        case "e":
          const win = window.open("", "Canvas Image");

          const { domElement } = this.renderer;

          // Makse sure scene is rendered.
          this.renderer.render(this.scene, this.camera);

          const src = domElement.toDataURL();

          if (!win) return;

          win.document.write(
            `<img src='${src}' width='${domElement.width}' height='${domElement.height}'>`
          );
          break;

        default:
          break;
      }
    });

    const mouseDownPos = new Vector2();
    const mouseDelta = new Vector2();

    const showLink = (from: WrappedIntersection) => {
      if (!this.link) {
        const geo = new CylinderGeometry(0.05, 0.05, 1, 8, 1);
        const posAttrBuffer = geo.getAttribute("position").array;
        for (let i = 1; i < posAttrBuffer.length; i += 3) {
          posAttrBuffer[i] += 0.5;
        }
        this.link = new Mesh(geo, new MeshBasicMaterial({ color: 0x00ff00 }));
        this.scene.add(this.link);
      }
      this.link.position.copy(from.intersection.point);
    };

    const clearLink = () => {
      if (this.link) {
        this.scene.remove(this.link);
        this.link = undefined;
      }
    };

    document.addEventListener(
      "pointerlockchange",
      () => {
        this._pointerLocked =
          document.pointerLockElement === this.renderer.domElement;
      },
      false
    );

    window.addEventListener("mousedown", (e) => {
      const x = this._pointerLocked ? window.innerWidth * 0.5 : e.x;
      const y = this._pointerLocked ? window.innerHeight * 0.5 : e.y;
      this.closestOnMouseDown = this.getClosest(x, y);
      mouseDownPos.set(e.x, e.y);
    });
    window.addEventListener("mousemove", (e) => {
      const x = this._pointerLocked ? window.innerWidth * 0.5 : e.x;
      const y = this._pointerLocked ? window.innerHeight * 0.5 : e.y;
      this.lastMouseMoveX = x;
      this.lastMouseMoveY = y;
      mouseDelta.set(x, y).sub(mouseDownPos);
      if (this.closestOnMouseDown && mouseDelta.length() > 10) {
        this.closestOnMouseMove = this.getClosest(x, y);
        if (
          this.closestOnMouseMove &&
          this.closestOnMouseDown.intersection.object !==
            this.closestOnMouseMove.intersection.object
        ) {
          showLink(this.closestOnMouseDown);
        }
      }
    });
    window.addEventListener("mouseup", (e) => {
      const x = this._pointerLocked ? window.innerWidth * 0.5 : e.x;
      const y = this._pointerLocked ? window.innerHeight * 0.5 : e.y;
      clearLink();
      if (
        this.closestOnMouseDown &&
        this.closestOnMouseMove &&
        this.closestOnMouseDown.intersection.object !==
          this.closestOnMouseMove.intersection.object
      ) {
        const wi1 = this.closestOnMouseDown;
        const wi2 = this.closestOnMouseMove;
        const obj1 = wi1.intersection.object;
        const obj2 = wi2.intersection.object;
        const v1 = this.visicals.find((v) => obj1 === v.visual);
        const v2 = this.visicals.find((v) => obj2 === v.visual);

        if (v1 && v2) {
          const v1e = wi1.relativePoint.clone();
          const v2e = wi2.relativePoint.clone();
          const jd = RAPIER.JointData.spherical(v1e, v2e);

          // const jd = RAPIER.JointData.revolute(
          //   this.closestOnMouseDown.relativePoint,
          //   this.closestOnMouseMove.relativePoint,
          //   new RAPIER.Vector3(0, 1, 0)
          // );

          // const jd = RAPIER.JointData.prismatic(
          //   this.closestOnMouseDown.relativePoint,
          //   this.closestOnMouseMove.relativePoint,
          //   new RAPIER.Vector3(0, 1, 0)
          // );
          // jd.limits = [0.25, 0.4]
          // jd.limitsEnabled = true

          // const jd = RAPIER.JointData.fixed(
          //   this.closestOnMouseDown.relativePoint,
          //   getNormalRotation(this.closestOnMouseDown.intersection.normal!),
          //   this.closestOnMouseMove.relativePoint,
          //   getNormalRotation(this.closestOnMouseMove.intersection.normal!),
          // );

          const joint = this.world.createImpulseJoint(
            jd,
            v1.physical,
            v2.physical,
            true
          );
          const h = joint.handle;

          //This joint animates from the initial distance to basically zero distance
          const abs1 = v1e.clone().applyMatrix4(obj1.matrixWorld);
          const abs2 = v2e.clone().applyMatrix4(obj2.matrixWorld);
          const absMid = abs1.clone().lerp(abs2, 0.5);
          const invMat1 = obj1.matrixWorld.clone().invert();
          const invMat2 = obj2.matrixWorld.clone().invert();
          const v1s = absMid.clone().applyMatrix4(invMat1);
          const v2s = absMid.clone().applyMatrix4(invMat2);

          this.animator.animate(1, (p) => {
            const j = this.world.getImpulseJoint(h);
            j.setAnchor1(v1s.clone().lerp(v1e, p));
            j.setAnchor2(v2s.clone().lerp(v2e, p));
          });
        }
      } else {
        const closest = this.getClosest(x, y);
        if (closest) {
          const visical = this.visicals.find(
            (v) => closest?.intersection.object === v.visual
          );
          if (
            visical &&
            visical.physical.bodyType() === RAPIER.RigidBodyType.Fixed
          ) {
            const ball = makeSphere(
              this.scene,
              this.world,
              0.5,
              RAPIER.RigidBodyType.Fixed,
              "concrete"
            );
            const p = closest.intersection.point;
            ball.setPosition(p.x, p.y, p.z);
            this.visicals.push(ball);
          }
        }
      }
      this.closestOnMouseDown = undefined;
      this.closestOnMouseMove = undefined;
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  submerged = new Set();
  animate = () => {
    requestAnimationFrame(this.animate);

    //land
    const noiseCenter2 = this.player
      ? this.player.visical.physical.translation()
      : ORIGIN;
    const x2 =
      Math.round(noiseCenter2.x / BLOCK_SIZE_METRES) * BLOCK_SIZE_METRES -
      HALF_BLOCK_SIZE_METRES;
    const y2 =
      Math.round(noiseCenter2.y / BLOCK_SIZE_METRES) * BLOCK_SIZE_METRES -
      HALF_BLOCK_SIZE_METRES;
    const z2 =
      Math.round(noiseCenter2.z / BLOCK_SIZE_METRES) * BLOCK_SIZE_METRES -
      HALF_BLOCK_SIZE_METRES;

    const r = 4;

    for (let iz = -r; iz < r; iz++) {
      for (let iy = -r; iy < r; iy++) {
        for (let ix = -r; ix < r; ix++) {
          const ixr = ix * BLOCK_SIZE_METRES;
          const iyr = iy * BLOCK_SIZE_METRES;
          const izr = iz * BLOCK_SIZE_METRES;
          const key = `${x2 + ixr};${y2 + iyr};${z2 + izr}`;
          if (!this.noiseBlockKeysSeen.has(key)) {
            this.noiseBlockKeysSeen.add(key);
            this.makeBlock(x2 + ixr, y2 + iyr, z2 + izr);
          }
        }
      }
    }

    this.animator.update();

    this.world.bodies.forEach((b) => {
      const y = b.translation().y;
      const h = b.handle;
      if (y < WATER_LEVEL && !this.submerged.has(h)) {
        this.submerged.add(h);
        b.addForce(new RAPIER.Vector3(0, 5, 0), true);
        b.setLinearDamping(2);
      } else if (y >= WATER_LEVEL && this.submerged.has(h)) {
        b.resetForces(true);
        this.submerged.delete(h);
        b.setLinearDamping(0);
      }
    });

    const isUnderWater = this.camera.position.y < WATER_LEVEL;
    const waterDepth = -(this.camera.position.y - WATER_LEVEL);
    this.waterColor
      .copy(this.waterColorShallow)
      .lerp(this.waterColorDeep, waterDepth * 0.5);
    this.fog.color = isUnderWater ? this.waterColor : this.skyColor;
    this.scene.background = isUnderWater ? this.waterColor : this.skyColor;
    this.fog.far = isUnderWater ? FOG_FAR_BELOW_WATER : FOG_FAR_ABOVE_WATER;

    if (this.player) this.player.update();

    this.world.step();

    for (const visical of this.visicals) {
      visical.matchTransform();
    }

    if (this.stats) this.stats.update();

    if (this.controls) this.controls.update();

    if (
      this.link &&
      this.closestOnMouseDown &&
      this.closestOnMouseMove &&
      this.closestOnMouseDown.intersection.object !==
        this.closestOnMouseMove.intersection.object
    ) {
      const p = this.closestOnMouseDown.relativePoint
        .clone()
        .applyMatrix4(this.closestOnMouseDown.intersection.object.matrixWorld);
      this.link!.position.copy(p);

      this.closestOnMouseMove = this.getClosest(
        this.lastMouseMoveX,
        this.lastMouseMoveY
      );

      if (this.closestOnMouseMove) {
        const p2 = this.closestOnMouseMove.relativePoint
          .clone()
          .applyMatrix4(
            this.closestOnMouseMove.intersection.object.matrixWorld
          );

        this.link.scale.y = p.distanceTo(p2);
        this.link.lookAt(p2);
        this.link.rotateX(Math.PI * 0.5);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };
}
