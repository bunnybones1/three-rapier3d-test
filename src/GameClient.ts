import Stats from "three/examples/jsm/libs/stats.module";
import RAPIER from "@dimforge/rapier3d";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Color,
  CylinderGeometry,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";
import VisicalRigid from "./VisicalRigid";
import { makeCuboid, makeSphere } from "./visicalsFactory";
import WrappedIntersection from "./WrappedIntersection";
import Anim from "./Anim";

const __rayCaster = new Raycaster();

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
    world.timestep = 1 / 60;
    this.world = world;

    const scene = new Scene();
    this.scene = scene;

    const skyColor = new Color(0.5, 0.7, 0.9);
    scene.background = skyColor;

    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.y = 1;
    this.camera.position.z = 5;

    this.renderer = new WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

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

    const ground = makeCuboid(scene, world, 100, 2, 100, undefined, 0xefefef);
    ground.setPosition(0, -1, 0);
    this.visicals.push(ground);

    const total = 8;
    for (let i = 0; i < total; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const platform = makeCuboid(
        scene,
        world,
        2,
        0.1,
        2.5,
        undefined,
        0x7fff7f
      );
      platform.setPosition(Math.cos(angle) * 2, 0.2, Math.sin(angle) * 2);
      platform.setEuler(0, -angle, 0.25);
      this.visicals.push(platform);

      // const wall = makeCuboid(scene, world, 2, 0.1, 2.5, undefined, 0x7fff7f);
      // wall.setPosition(Math.cos(angle) * 3, 1.5, Math.sin(angle) * 3);
      // wall.setEuler(0, -angle, Math.PI * 0.5);
      // this.visicals.push(wall);
    }

    const type = RAPIER.RigidBodyType.Dynamic;

    for (let i = 0; i < 5; i++) {
      const box = makeCuboid(scene, world, 0.5, 0.5, 0.5, type, 0xff7fff);
      box.setPosition(0, 2 + i * 0.5, 0);
      this.visicals.push(box);

      const ball = makeSphere(scene, world, 0.25, type, 0xff7fff);
      ball.setPosition(0.1, 2 + i * 0.5, 0);
      this.visicals.push(ball);
    }
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
      this.visicals.map((v) => v.visual)
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

    window.addEventListener("mousedown", (e) => {
      this.closestOnMouseDown = this.getClosest(e.x, e.y);
      mouseDownPos.set(e.x, e.y);
    });
    window.addEventListener("mousemove", (e) => {
      this.lastMouseMoveX = e.x;
      this.lastMouseMoveY = e.y;
      mouseDelta.set(e.x, e.y).sub(mouseDownPos);
      if (this.closestOnMouseDown && mouseDelta.length() > 10) {
        this.closestOnMouseMove = this.getClosest(e.x, e.y);
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

          this.anims.push(
            new Anim(this.time, 1, (p) => {
              const j = this.world.getImpulseJoint(h);
              j.setAnchor1(v1s.clone().lerp(v1e, p));
              j.setAnchor2(v2s.clone().lerp(v2e, p));
            })
          );
        }
      } else {
        const closest = this.getClosest(e.x, e.y);
        if (closest) {
          const ball = makeSphere(
            this.scene,
            this.world,
            0.5,
            RAPIER.RigidBodyType.Fixed,
            0xffffff
          );
          const p = closest.intersection.point;
          ball.setPosition(p.x, p.y, p.z);
          this.visicals.push(ball);
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

  time = 0;
  anims: Anim[] = [];
  animate = () => {
    requestAnimationFrame(this.animate);
    this.time += 1 / 60;
    for (let i = 0; i < this.anims.length; i++) {
      this.anims[i].update(this.time);
    }
    for (let i = this.anims.length - 1; i >= 0; i--) {
      if (this.anims[i].progress === 1) {
        this.anims.splice(i, 1);
      }
    }
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
