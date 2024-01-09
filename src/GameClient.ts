import Stats from "three/examples/jsm/libs/stats.module";
import RAPIER from "@dimforge/rapier3d";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  BackSide,
  Box3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  FogExp2,
  Frustum,
  HemisphereLight,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  Scene,
  ShaderChunk,
  SphereGeometry,
  SpotLight,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import VisicalRigid from "./VisicalRigid";
import {
  makeCuboid,
  makeMesh as makeTriMesh,
  makeSphere,
} from "./visicalsFactory";
import WrappedIntersection from "./WrappedIntersection";
import { getUrlFlag, getUrlInt, getUrlParam } from "./location";
import Player from "./Player";
import Animator from "./Animator";
import {
  VisicalPresetName,
  getVisicalPreset,
} from "./physicalMaterialParameterLib";
import {
  BLOCK_SIZE_METRES,
  CELLS_PER_METRE,
  CELLS_PER_METRE_PHYSICS,
} from "./blockConstants";
import { makeMarchingBlock } from "./marchingBlockFactory";
import IField3D from "./noise/IField3D";
import { flattenBottom } from "./noise/field3DHelpers";
import QuantizedCacheField3D from "./noise/QuantizedCacheField3D";
import GPUField3DGenerator from "./GPUField3DGenerator";
import { worldGenerators } from "./worldGenerators";
import WorldBlockParams from "./WorldBlockParams";
import { getDBManager } from "./dbManager";
import GPUFlashlightTextureGenerator from "./GPUFlashlightTextureGenerator";

const MAX_SCALE_LEVELS = getUrlInt("scaleLevels", 5, 1, 8);
const MAX_BLOCK_RANGE = getUrlInt("blockRange", 2, 0, 8);
const AMBIENT_SHADOW_REACH = 25;
const SHADOW_RANGE = 100;

const __rayCaster = new Raycaster();

const MAX_CONCURRENT_BLOCK_MAKERS = 4;

const ORIGIN = new Vector3();
const WATER_LEVEL = -7;

const _projScreenMatrix = new Matrix4();

const _frustum = new Frustum();
const _box = new Box3();
const _point = new Vector3();
const _size = new Vector3();

export default class GameClient {
  private renderer!: WebGLRenderer;
  private scene!: Scene;
  private camera!: PerspectiveCamera;

  private controls!: OrbitControls;
  private stats!: any;

  private visicalsDynamic: VisicalRigid[] = [];
  private visicalsAll: VisicalRigid[] = [];
  private collidables: Object3D[] = [];

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
  fog!: FogExp2;
  private fieldDirt!: IField3D;
  // private fieldSnow!: IField3D;
  // private fieldSand!: IField3D;
  private requestedBlockKeys = new Set<string>();
  lastX: number = 0;
  lastY: number = 0;
  lastZ: number = 0;
  blockCount: number = 0;
  clippingPlanesForward!: Plane[];
  clippingPlanesBack!: Plane[];
  clippingPlanes!: Plane[][];
  sunLight!: DirectionalLight;
  gpuField3DGenerator!: GPUField3DGenerator;
  gpuFlashlightTextureGenerator!: GPUFlashlightTextureGenerator;
  preview!: Mesh;
  waterSurface!: Mesh;
  startTime = new Date().getTime() * 0.001;
  flashLight!: SpotLight;

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
    const islands = worldGenerators.redRocks();
    // const islands = worldGenerators.rottenLumps();
    // const fieldSandSrc = islands;
    const fieldDirtSrc = new QuantizedCacheField3D(
      flattenBottom(islands, -50, 0.5),
      CELLS_PER_METRE
    );
    // const fieldSandSrc = flattenBottom(flattenTop(islands, 4, 0.5), -50, 0.5);
    this.fieldDirt = fieldDirtSrc;

    // const fieldSnowCast = new ClampScalarField3D(fieldDirtSrc, 0, 2);

    // this.fieldSnow = new ScaleField3D(
    //   new DifferenceField3D(
    //     new TranslateField3D(fieldSnowCast, 0, 0.25),
    //     new TranslateField3D(fieldSnowCast, 0, -0.5)
    //   ),
    //   new ClampScalarField3D(new GradientField3D(0, 0.5, 0, -2), 0, 1)
    // );
    // this.fieldSand = new AdditiveField3D(
    //   makeDeepTranslatedAverage6(
    //     new TranslateField3D(fieldDirtSrc, 0, 0.25),
    //     0.25,
    //     0.25,
    //     0.25,
    //     0,
    //     0,
    //     0,
    //     2,
    //     CELLS_PER_METRE
    //   ),
    //   new GradientField3D(0, -0.1, 0, 10.4)
    // );
    // this.fieldDirt = new GradientField3D(0, -25, 0, -12)
    // this.fieldSnow = new GradientField3D(0, -25, 0, -15)

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
    const fog = new FogExp2(skyColor, 0.01);
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

    this.renderer = new WebGLRenderer({
      antialias: false,
      logarithmicDepthBuffer: true,
      powerPreference: "high-performance",
    });
    this.renderer.localClippingEnabled = true;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    // this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setPixelRatio(0.5);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.renderer.domElement);
    for (const v of [
      "-moz-crisp-edges",
      "-webkit-crisp-edges",
      "crisp-edges",
      "pixelated",
    ]) {
      this.renderer.domElement.style.setProperty("image-rendering", v);
    }

    const basePosition = new Vector3(0, 2, 6);
    const startingPosition = basePosition.clone();
    startingPosition.y += 0.8;
    startingPosition.z += 5;
    const startingRotation = new Quaternion(0, 0, 0, 1);

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (getUrlFlag("orbit") || isMobile) {
      this.camera.position.set(
        basePosition.x,
        basePosition.y + 1,
        basePosition.z + 7
      );
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    } else {
      this.camera.position.y = 1;
      this.camera.position.z = 7;
      const player = new Player(world, scene, this.camera, this.renderer);
      this.visicalsDynamic.push(player.visical);

      const ppStr = getUrlFlag("resetPos")
        ? null
        : getUrlParam("playerPos") || localStorage.getItem("playerPos");
      if (ppStr) {
        const pp = ppStr.split(";").map(parseFloat);
        if (pp.length === 3) {
          startingPosition.fromArray(pp);
        }
      }
      player.visical.setPosition(
        startingPosition.x,
        startingPosition.y + 1,
        startingPosition.z
      );
      const prStr = getUrlFlag("resetPos")
        ? null
        : localStorage.getItem("playerRot");
      if (prStr) {
        const pr = prStr.split(";").map(parseFloat);
        if (pr.length === 4) {
          startingRotation.fromArray(pr);
        }
      }
      this.camera.quaternion.copy(startingRotation);

      const startingPlatform = makeCuboid(
        scene,
        world,
        1,
        0.1,
        1,
        undefined,
        "concrete"
      );
      startingPlatform.setPosition(
        startingPosition.x,
        startingPosition.y - 0.125,
        startingPosition.z
      );
      this.visicalsAll.push(startingPlatform);
      this.collidables.push(startingPlatform.visual);

      setInterval(() => {
        const vp = player.visical.physical.translation();
        localStorage.setItem("playerPos", `${vp.x};${vp.y};${vp.z}`);
        const rp = this.camera.quaternion;
        localStorage.setItem("playerRot", `${rp.x};${rp.y};${rp.z};${rp.w}`);
      }, 1000);
      this.player = player;
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
    sunLight.shadow.camera.left -= AMBIENT_SHADOW_REACH;
    sunLight.shadow.camera.right += AMBIENT_SHADOW_REACH;
    sunLight.shadow.camera.bottom -= AMBIENT_SHADOW_REACH;
    sunLight.shadow.camera.top += AMBIENT_SHADOW_REACH;
    sunLight.shadow.camera.updateProjectionMatrix();
    // this.lightPoint.position.set(0, 1, 0).normalize();
    sunLight.position
      .set(-0.5, 2.5, 4)
      .normalize()
      .multiplyScalar(SHADOW_RANGE * 0.5);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const mapSize = 2048; // Default 512
    const cameraNear = 0.5; // Default 0.5
    const cameraFar = SHADOW_RANGE; // Default 500
    sunLight.shadow.mapSize.width = mapSize;
    sunLight.shadow.mapSize.height = mapSize;
    sunLight.shadow.camera.near = cameraNear;
    sunLight.shadow.camera.far = cameraFar;
    this.sunLight = sunLight;

    const clippingPlanesForward: Plane[] = [];
    const clippingPlanesBack: Plane[] = [];
    for (let i = 0; i < MAX_SCALE_LEVELS; i++) {
      clippingPlanesBack.push(new Plane(new Vector3(0, 0, -1), 0));
      clippingPlanesForward.push(new Plane(new Vector3(0, 0, -1), 0));
    }
    this.clippingPlanesForward = clippingPlanesForward;
    this.clippingPlanesBack = clippingPlanesBack;

    const clippingPlanes: Plane[][] = [];
    clippingPlanes.push([clippingPlanesBack[0]]);
    for (let i = 1; i < MAX_SCALE_LEVELS - 1; i++) {
      clippingPlanes.push([
        clippingPlanesForward[i - 1],
        clippingPlanesBack[i],
      ]);
    }
    clippingPlanes.push([clippingPlanesForward[MAX_SCALE_LEVELS - 2]]);
    this.clippingPlanes = clippingPlanes;
    // const island = makeSphere(scene, world, 24, undefined, "sand");
    // island.setPosition(basePosition.x, basePosition.y - 24, basePosition.z);
    // this.visicals.push(island);

    const ground = makeCuboid(scene, world, 2, 0.25, 24, undefined, "concrete");
    ground.setPosition(basePosition.x, basePosition.y - 0.125, basePosition.z);
    this.visicalsAll.push(ground);
    this.collidables.push(ground.visual);

    ShaderChunk.fog_pars_vertex = `
#ifdef USE_FOG
	varying float vFogDepth;
  varying vec2 vWaterDepth;
#endif
`;

    ShaderChunk.fog_vertex = `
#ifdef USE_FOG
	vFogDepth = -mvPosition.z;
  vWaterDepth = vec2(worldPosition.y, cameraPosition.y);
#endif
`;

    ShaderChunk.fog_pars_fragment = `
#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
  varying vec2 vWaterDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif
`;

    ShaderChunk.fog_fragment = `
#ifdef USE_FOG
	#ifdef FOG_EXP2
    float camY = vWaterDepth.y;
    float waterY = fogDensity;
    float rockY = vWaterDepth.x;
    float dry = 0.0;
    float wet = 0.0;
    if(camY < waterY) {
      dry = max(0.0, rockY - waterY);
      wet = waterY - camY;
    } else {
      wet = max(0.0, waterY - rockY);
      dry = camY - waterY;
    }
    float amt = max(0.0, min(1.0, wet/(wet+dry)));
    float fd = mix(0.01, 0.2, amt);
		float fogFactor = 1.0 - exp( - fd * fd * vFogDepth * vFogDepth );
    float amtInv = 1.0 - amt;
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, mix(fogColor, vec3(0.0, 0.5, 0.3), 1.0 - amtInv * amtInv * amtInv), fogFactor );
  gl_FragColor.a += fogFactor;
#endif
`;

    const waterSurface = new Mesh(
      new PlaneGeometry(2000, 2000, 8, 8),
      new MeshPhysicalMaterial({
        ...getVisicalPreset("water").materialParams,
        // clipIntersection: true,
        // clippingPlanes: this.clippingPlanes[1],
      })
    );
    this.waterSurface = waterSurface;
    this.scene.add(waterSurface);
    waterSurface.receiveShadow = true;
    waterSurface.rotation.x = Math.PI * 0.5;
    waterSurface.position.y = WATER_LEVEL;
    // waterSurface.visible = false;

    const waterBowl = new Mesh(
      new SphereGeometry(1000, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new MeshBasicMaterial({ fog: true, side: BackSide })
    );
    waterBowl.renderOrder = 10;
    waterBowl.rotateX(Math.PI * 0.5);
    waterSurface.add(waterBowl);

    const total = 8;
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2;
      const platform = makeCuboid(scene, world, 2, 0.1, 2.5, undefined, "wood");
      platform.setPosition(
        basePosition.x + Math.cos(angle) * 2,
        basePosition.y + 0.2,
        basePosition.z + Math.sin(angle) * 2
      );
      platform.setEuler(0, -angle, 0.25);
      this.visicalsAll.push(platform);
      platform.matchTransform();
      this.collidables.push(platform.visual);

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
      platform.setPosition(
        basePosition.x + Math.cos(angle) * 7,
        basePosition.y + 0.05,
        basePosition.z + Math.sin(angle) * 5
      );
      platform.setEuler(0, -angle, 0);
      this.visicalsDynamic.push(platform);
      this.visicalsAll.push(platform);
      this.collidables.push(platform.visual);

      // const wall = makeCuboid(scene, world, 2, 0.1, 2.5, undefined, 0x7fff7f);
      // wall.setPosition(Math.cos(angle) * 3, 1.5, Math.sin(angle) * 3);
      // wall.setEuler(0, -angle, Math.PI * 0.5);
      // this.visicals.push(wall);
    }

    const type = RAPIER.RigidBodyType.Dynamic;

    for (let i = 0; i < 5; i++) {
      const box = makeCuboid(scene, world, 0.5, 0.5, 0.5, type, "plastic");
      box.setPosition(
        basePosition.x,
        basePosition.y + 2 + i * 0.5,
        basePosition.z
      );
      this.visicalsDynamic.push(box);
      this.visicalsAll.push(box);
      this.collidables.push(box.visual);

      const ball = makeSphere(scene, world, 0.25, type, "plastic");
      ball.setPosition(
        basePosition.x + 0.1,
        basePosition.y + 2 + i * 0.5,
        basePosition.z
      );
      this.visicalsDynamic.push(ball);
      this.visicalsAll.push(ball);
      this.collidables.push(ball.visual);
    }

    const gpuField3DGenerator = new GPUField3DGenerator();
    this.gpuField3DGenerator = gpuField3DGenerator;

    const gpuFlashlightTextureGenerator = new GPUFlashlightTextureGenerator();
    this.gpuFlashlightTextureGenerator = gpuFlashlightTextureGenerator;

    const preview = new Mesh(
      new PlaneGeometry(1, 1, 1, 1),
      new MeshBasicMaterial({
        map: gpuField3DGenerator.renderTarget.texture,
        side: DoubleSide,
      })
    );
    preview.scale.setScalar(0.5);
    this.preview = preview;
    if (getUrlFlag("previewTexture")) {
      scene.add(preview);
    }

    const flashLight = new SpotLight(new Color(1, 1, 1), 15);
    flashLight.penumbra = 1
    flashLight.angle = Math.PI / 4
    flashLight.decay = 1
    flashLight.castShadow = true
    this.scene.add(flashLight);
    this.flashLight = flashLight;
  }
  currentlyRetrievingBlocks = 0;
  blockRequestQueue: WorldBlockParams[] = [];
  requestBlock(br: WorldBlockParams) {
    this.blockRequestQueue.push(br);
    this.attemptToRetrieveBlocks();
  }
  async attemptToRetrieveBlocks() {
    if (
      this.blockRequestQueue.length > 0 &&
      this.currentlyRetrievingBlocks < MAX_CONCURRENT_BLOCK_MAKERS
    ) {
      this.blockRequestQueue.sort((a, b) => a.priorityScore - b.priorityScore);
      this.currentlyRetrievingBlocks++;
      const br = this.blockRequestQueue.shift()!;
      await this.generateBlock(br);
      this.currentlyRetrievingBlocks--;
      this.attemptToRetrieveBlocks();
    }
  }
  async generateBlock(br: WorldBlockParams) {
    const dirt = await this.generateBlockLayer(
      this.fieldDirt,
      br.x,
      br.y,
      br.z,
      "redRocks",
      br.clippingPlanes,
      br.scaleRatio,
      br.makePhysicsMesh
    );
    if (dirt instanceof VisicalRigid) {
      this.visicalsAll.push(dirt);
      this.collidables.push(dirt.visual);
    } else if (dirt) {
      this.collidables.push(dirt);
    }
    // const snow = await this.generateBlockLayer(
    //   this.fieldSnow,
    //   // this.gpuField3DGenerator,
    //   br.x,
    //   br.y,
    //   br.z,
    //   "snow",
    //   br.clippingPlanes,
    //   br.scaleRatio,
    //   false
    // );
    // const sand = await this.generateBlockLayer(
    //   this.fieldSand,
    //   // this.gpuField3DGenerator,
    //   br.x,
    //   br.y,
    //   br.z,
    //   "sand",
    //   br.clippingPlanes,
    //   br.scaleRatio,
    //   true
    // );
    // if (sand instanceof VisicalRigid) {
    //   this.visicalsAll.push(sand);
    //   this.collidables.push(sand.visual);
    // } else if (sand) {
    //   this.collidables.push(sand);
    // }
    // console.log(this.blockCount);
    return [dirt];
    // return [dirt, snow, sand];
    // return [dirt, snow];
  }
  async generateBlockLayer(
    densityFieldSrc: IField3D,
    x: number,
    y: number,
    z: number,
    materialName: VisicalPresetName,
    clippingPlanes?: Plane[],
    scaleRatio = 1,
    makePhysicsMesh = true
  ) {
    const bsm = BLOCK_SIZE_METRES * scaleRatio;
    const cpm = CELLS_PER_METRE / scaleRatio;
    const cpmp = CELLS_PER_METRE_PHYSICS / scaleRatio;
    const layerMC = await makeMarchingBlock(
      densityFieldSrc,
      x,
      y,
      z,
      bsm,
      cpm,
      materialName,
      clippingPlanes
    );
    if (layerMC) {
      const layerMCP = makePhysicsMesh
        ? await makeMarchingBlock(
            densityFieldSrc,
            x,
            y,
            z,
            bsm,
            cpmp,
            materialName
          )
        : undefined;
      if (layerMCP) {
        const layerVisical = makeTriMesh(
          this.scene,
          this.world,
          layerMC.geometry,
          undefined,
          materialName,
          layerMCP.geometry
        );
        const v = layerVisical.visual as Mesh;
        v.renderOrder = scaleRatio - 1;
        if (clippingPlanes) {
          const m = v.material as MeshPhysicalMaterial;
          // m.clipIntersection = true;
          m.clippingPlanes = clippingPlanes;
        }
        layerVisical.physical.setTranslation(layerMC.position, true);
        v.position.copy(layerMC.position);
        return layerVisical;
      } else {
        this.scene.add(layerMC);
        return layerMC;
      }
    }
    return undefined;
  }

  getClosest = (x: number, y: number) => {
    __rayCaster.setFromCamera(
      new Vector2(
        (x / window.innerWidth) * 2 - 1,
        -((y / window.innerHeight) * 2 - 1)
      ),
      this.camera
    );
    const intersections = __rayCaster.intersectObjects(this.collidables);
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
        const v1 = this.visicalsAll.find((v) => obj1 === v.visual);
        const v2 = this.visicalsAll.find((v) => obj2 === v.visual);

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
          const obj = closest.intersection.object;
          const visical = this.visicalsAll.find((v) => obj === v.visual);
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
            this.visicalsAll.push(ball);
            this.collidables.push(ball.visual);
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
    if (!getDBManager().ready) {
      return;
    }

    if (!this.flashLight.map) {
      this.gpuFlashlightTextureGenerator.render(this.renderer);
      this.flashLight.map = this.gpuFlashlightTextureGenerator.renderTarget.texture;
    }
    this.flashLight.position.copy(this.camera.position)
    this.flashLight.quaternion.copy(this.camera.quaternion)
    this.flashLight.translateX(0.3)
    this.flashLight.translateY(-0.3)
    this.flashLight.translateZ(-0.3)
    this.flashLight.target.position.copy(this.flashLight.position)
    this.flashLight.target.quaternion.copy(this.flashLight.quaternion)
    this.flashLight.target.translateZ(-2)
    // this.flashLight.target.position.x += Math.random() * 2 -1
    // this.flashLight.target.position.y += Math.random() * 2 -1
    // this.flashLight.target.position.z += Math.random() * 2 -1
    this.flashLight.target.updateMatrix()
    this.flashLight.target.updateMatrixWorld()

    //land
    const playerPos = this.player
      ? this.player.visical.physical.translation()
      : ORIGIN;

    const n = new Vector3(-1, 1, 1)
      .normalize()
      .multiplyScalar(SHADOW_RANGE * 0.5);
    this.sunLight.target.position.copy(this.camera.position);
    this.sunLight.position.copy(this.sunLight.target.position);
    this.sunLight.position.add(n);
    this.sunLight.target.updateMatrixWorld(true);
    this.sunLight.updateMatrixWorld(true);

    _projScreenMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    _frustum.setFromProjectionMatrix(_projScreenMatrix);
    for (const br of this.blockRequestQueue) {
      _point.set(br.x, br.y, br.z);
      _size.setScalar(br.scaleRatio * BLOCK_SIZE_METRES);
      _box.setFromCenterAndSize(_point, _size);
      const seen = _frustum.intersectsBox(_box);
      const d = seen ? _point.distanceTo(this.camera.position) : 100000;
      br.updatePriority(seen, d);
    }

    let blockRequestsPerFrameCap = 8;
    for (let iSR = 0; iSR < MAX_SCALE_LEVELS; iSR++) {
      const scaleRatio = Math.pow(2, iSR);

      const cpb = this.clippingPlanesBack[iSR];
      cpb.normal.set(0, 0, 1).applyQuaternion(this.camera.quaternion);
      cpb.setFromNormalAndCoplanarPoint(cpb.normal, this.camera.position);
      cpb.constant += scaleRatio * BLOCK_SIZE_METRES * (MAX_BLOCK_RANGE - 0.5);

      const cpf = this.clippingPlanesForward[iSR];
      cpf.normal.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
      cpf.setFromNormalAndCoplanarPoint(cpf.normal, this.camera.position);
      cpf.constant -=
        scaleRatio * BLOCK_SIZE_METRES * (MAX_BLOCK_RANGE - 0.5) * 0.9;

      const bsm = BLOCK_SIZE_METRES * scaleRatio;
      const hbsm = bsm * 0.5;
      const qx = Math.round(playerPos.x / bsm) * bsm - hbsm;
      const qy = Math.round(playerPos.y / bsm) * bsm - hbsm;
      const qz = Math.round(playerPos.z / bsm) * bsm - hbsm;

      const r = MAX_BLOCK_RANGE;
      for (let iz = -r; iz <= r; iz++) {
        for (let iy = -r; iy <= r; iy++) {
          for (let ix = -r; ix <= r; ix++) {
            const ixr = ix * bsm;
            const iyr = iy * bsm;
            const izr = iz * bsm;
            const key = `${qx + ixr};${qy + iyr};${qz + izr};${iSR}`;
            if (!this.requestedBlockKeys.has(key)) {
              if (blockRequestsPerFrameCap > 0) {
                blockRequestsPerFrameCap--;
                this.requestedBlockKeys.add(key);
                this.requestBlock(
                  new WorldBlockParams(
                    qx + ixr,
                    qy + iyr,
                    qz + izr,
                    scaleRatio,
                    iSR === 0,
                    this.clippingPlanes[iSR]
                  )
                );
              }
            }
          }
        }
      }
    }

    this.animator.update();

    const now = performance.now() * 0.001;
    const waterLevel =
      WATER_LEVEL +
      Math.sin(
        now * Math.PI * 2 * 2 + Math.sin(now * Math.PI * 2 * 0.5) * 0.75
      ) *
        0.03 +
      Math.sin((this.startTime + now) * Math.PI * 2 * 0.002) * 3;

    this.world.bodies.forEach((b) => {
      const y = b.translation().y;
      const h = b.handle;
      if (y < waterLevel && !this.submerged.has(h)) {
        this.submerged.add(h);
        b.addForce(new RAPIER.Vector3(0, 5, 0), true);
        b.setLinearDamping(2);
      } else if (y >= waterLevel && this.submerged.has(h)) {
        b.resetForces(true);
        this.submerged.delete(h);
        b.setLinearDamping(0);
      }
    });

    // const isUnderWater = this.camera.position.y < waterLevel;
    // const waterDepth = -(this.camera.position.y - waterLevel);
    // this.waterColor
    //   .copy(this.waterColorShallow)
    //   .lerp(this.waterColorDeep, waterDepth * 0.5);
    // this.fog.color = isUnderWater ? this.waterColor : this.skyColor;
    // this.scene.background = isUnderWater ? this.waterColor : this.skyColor;
    this.waterSurface.position.y = waterLevel;
    this.fog.density = waterLevel;
    //   ? FOG_DENSITY_BELOW_WATER
    //   : FOG_DENSITY_ABOVE_WATER;

    if (this.player) {
      this.waterSurface.position.x = this.player.visical.visual.position.x;
      this.waterSurface.position.z = this.player.visical.visual.position.z;

      this.player.update();
      this.preview.position.copy(this.player.visical.visual.position);
      this.preview.quaternion.copy(this.camera.quaternion);
      this.preview.translateZ(-1);
    }

    this.world.step();

    for (const visical of this.visicalsDynamic) {
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
