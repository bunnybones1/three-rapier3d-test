import { Color, DoubleSide, MeshPhysicalMaterialParameters } from "three";

export type VisicalPresetName =
  | "concrete"
  | "debugWire"
  | "default"
  | "dirt"
  | "meat"
  | "plastic"
  | "plasticWater"
  | "redRocks"
  | "sand"
  | "snow"
  | "water"
  | "wood";

type VisicalPreset = {
  materialParams: MeshPhysicalMaterialParameters;
  restitution: number;
  density: number;
  friction: number;
};

export function getVisicalPreset(name: VisicalPresetName) {
  return visicalPresetLib[name];
}
const visicalPresetLib: {
  [K in VisicalPresetName]: VisicalPreset;
} = {
  default: {
    restitution: 0.5,
    density: 0.5,
    friction: 0.5,
    materialParams: {
      // clearcoat?: number | undefined;
      // clearcoatMap?: Texture | null | undefined;
      // clearcoatRoughness?: number | undefined;
      // clearcoatRoughnessMap?: Texture | null | undefined;
      // clearcoatNormalScale?: Vector2 | undefined;
      // clearcoatNormalMap?: Texture | null | undefined;
      // reflectivity?: number | undefined;
      // ior?: number | undefined;
      // sheen?: number | undefined;
      // sheenColor?: ColorRepresentation | undefined;
      // sheenColorMap?: Texture | null | undefined;
      // sheenRoughness?: number | undefined;
      // sheenRoughnessMap?: Texture | null | undefined;
      // transmission?: number | undefined;
      // transmissionMap?: Texture | null | undefined;
      // thickness?: number | undefined;
      // thicknessMap?: Texture | null | undefined;
      // attenuationDistance?: number | undefined;
      // attenuationColor?: ColorRepresentation | undefined;
      // specularIntensity?: number | undefined;
      // specularColor?: ColorRepresentation | undefined;
      // specularIntensityMap?: Texture | null | undefined;
      // specularColorMap?: Texture | null | undefined;
      // iridescenceMap?: Texture | null | undefined;
      // iridescenceIOR?: number | undefined;
      // iridescence?: number | undefined;
      // iridescenceThicknessRange?: [number, number] | undefined;
      // iridescenceThicknessMap?: Texture | null | undefined;
      // anisotropy?: number | undefined;
      // anisotropyRotation?: number | undefined;
      // anisotropyMap?: Texture | null | undefined;
      // color?: ColorRepresentation | undefined;
      // roughness?: number | undefined;
      // metalness?: number | undefined;
      // map?: Texture | null | undefined;
      // lightMap?: Texture | null | undefined;
      // lightMapIntensity?: number | undefined;
      // aoMap?: Texture | null | undefined;
      // aoMapIntensity?: number | undefined;
      // emissive?: ColorRepresentation | undefined;
      // emissiveIntensity?: number | undefined;
      // emissiveMap?: Texture | null | undefined;
      // bumpMap?: Texture | null | undefined;
      // bumpScale?: number | undefined;
      // normalMap?: Texture | null | undefined;
      // normalMapType?: NormalMapTypes | undefined;
      // normalScale?: Vector2 | undefined;
      // displacementMap?: Texture | null | undefined;
      // displacementScale?: number | undefined;
      // displacementBias?: number | undefined;
      // roughnessMap?: Texture | null | undefined;
      // metalnessMap?: Texture | null | undefined;
      // alphaMap?: Texture | null | undefined;
      // envMap?: Texture | null | undefined;
      // envMapIntensity?: number | undefined;
      // wireframe?: boolean | undefined;
      // wireframeLinewidth?: number | undefined;
      // fog?: boolean | undefined;
      // flatShading?: boolean | undefined;
    },
  },
  sand: {
    restitution: 0,
    density: 3,
    friction: 0.8,
    materialParams: {
      color: new Color(0.9, 0.85, 0.6),
      roughness: 0.7,
    },
  },
  redRocks: {
    restitution: 0.1,
    density: 2.6,
    friction: 0.9,
    materialParams: {
      color: new Color(0.75, 0.3, 0.1),
      metalness: 0.25,
      roughness: 0.8,
    },
  },
  dirt: {
    restitution: 0.1,
    density: 2.6,
    friction: 0.9,
    materialParams: {
      color: new Color(0.35, 0.25, 0.15),
      metalness: 0.5,
      roughness: 0.8,
    },
  },
  debugWire: {
    restitution: 0,
    density: 3,
    friction: 0.8,
    materialParams: {
      color: new Color(0, 0, 0),
      roughness: 0.8,
      emissive: new Color(0, 0, 0),
      wireframe: true,
    },
  },
  plastic: {
    restitution: 0.8,
    density: 0.9,
    friction: 0.5,
    materialParams: {
      color: 0xff55ff,
      roughness: 0.8,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
    },
  },
  concrete: {
    restitution: 0.7,
    density: 4,
    friction: 0.9,
    materialParams: { color: new Color(0.9, 0.9, 0.9), roughness: 1 },
  },
  snow: {
    restitution: 0.1,
    density: 1,
    friction: 0.2,
    materialParams: { color: new Color(0.9, 0.95, 1.1), roughness: 0.7 },
  },
  meat: {
    restitution: 0.2,
    density: 4,
    friction: 0.2,
    materialParams: { color: 0xffaaaa, roughness: 0.5 },
  },
  water: {
    restitution: 0.8,
    density: 0.9,
    friction: 0,
    materialParams: {
      color: new Color(0.15, 0.26, 1.75),
      ior: 1.5,
      metalness: 0.5,
      opacity: 0.4,
      roughness: 0.3,
      specularColor: new Color(0.25, 0.6, 0.75),
      specularIntensity: 3,
      // thickness: 0.01,
      // transmission: 0,
      side: DoubleSide,
      transparent: true
    },
  },
  plasticWater: {
    restitution: 0.8,
    density: 0.9,
    friction: 0,
    materialParams: {
      color: new Color(0.1, 0.4, 1),
      ior: 1.5,
      metalness: 0,
      opacity: 1,
      roughness: 0.3,
      specularColor: new Color(0.25, 0.6, 0.75),
      specularIntensity: 1,
      thickness: 0.01,
      transmission: 0.8,
      side: DoubleSide,
    },
  },
  wood: {
    restitution: 0.8,
    density: 0.5,
    friction: 0.7,
    materialParams: {
      color: new Color(0.5, 0.35, 0.1),
      roughness: 0.7,
      clearcoat: 0.1,
      clearcoatRoughness: 0.3,
    },
  },
} as const;
