import Stats from "three/examples/jsm/libs/stats.module";
import RAPIER from "@dimforge/rapier3d";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Color,
  DirectionalLight,
  HemisphereLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import VisicalRigid from "./VisicalRigid";
import { makeCuboid, makeSphere } from "./visicalsFactory";

export default class GameClient {
  private renderer!: WebGLRenderer;
  private scene!: Scene;
  private camera!: PerspectiveCamera;

  private controls!: OrbitControls;
  private stats!: any;

  private visicals: VisicalRigid[] = [];

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
    sunLight.shadow.camera.left -= 15;
    sunLight.shadow.camera.right += 15;
    sunLight.shadow.camera.bottom -= 15;
    sunLight.shadow.camera.top += 15;
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

    const platform = makeCuboid(scene, world, 1, 0.1, 1, undefined, 0x7fff7f);
    platform.setPosition(0, 0.2, 0);
    platform.setEuler(0, 0, 0.05);
    this.visicals.push(platform);

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
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.world.step();

    for (const visical of this.visicals) {
      visical.matchTransform();
    }

    if (this.stats) this.stats.update();

    if (this.controls) this.controls.update();

    this.renderer.render(this.scene, this.camera);
  };
}
