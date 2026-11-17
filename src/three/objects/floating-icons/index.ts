import {
  Group,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  CanvasTexture,
  TextureLoader,
  SRGBColorSpace,
  Vector3,
  DoubleSide,
} from "three";
import gsap from "gsap";
import { renderTarget } from "../../core/renderTarget";
import { lab } from "../lab";
import { sceneWeights } from "../../../animations/scenes";
import { aboutProgress } from "../../../animations/transitions/about";
import { sizes } from "../../../utils/sizes";

interface FloatingIcon {
  mesh: Mesh;
  glowMesh: Mesh;
  basePosition: Vector3;
  desktopPosition: Vector3;
  mobilePosition: Vector3;
  floatOffset: number;
  floatSpeed: number;
  floatAmplitude: number;
  rotationSpeed: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitOffset: number;
  label: string;
}

interface IconConfig {
  label: string;
  path: string;
  desktopPosition: Vector3;
  mobilePosition: Vector3;
  floatSpeed: number;
  floatAmplitude: number;
  orbitRadius: number;
  orbitSpeed: number;
}

const group = new Group();
let icons: FloatingIcon[] = [];

// All 7 icons with distinct desktop and mobile coordinates
// On mobile portrait, horizontal FOV is narrower, so coordinates are tightened
const ICON_CONFIGS: IconConfig[] = [
  // --- Left Side ---
  {
    label: "Figma",
    path: "/icons/figma.png",
    desktopPosition: new Vector3(-2.6, 4.3, 0.2),
    mobilePosition: new Vector3(-1.3, 4.5, 0.3),
    floatSpeed: 0.65,
    floatAmplitude: 0.14,
    orbitRadius: 0.05,
    orbitSpeed: 0.32,
  },
  {
    label: "Claude",
    path: "/icons/cluade.png",
    desktopPosition: new Vector3(-3.5, 2.5, 0.3),
    mobilePosition: new Vector3(-1.4, 3.1, 0.3),
    floatSpeed: 0.75,
    floatAmplitude: 0.12,
    orbitRadius: 0.05,
    orbitSpeed: 0.28,
  },
  {
    label: "Excel",
    path: "/icons/excel.png",
    desktopPosition: new Vector3(-3.2, 0.8, 0.2),
    mobilePosition: new Vector3(-1.35, 1.7, 0.3),
    floatSpeed: 0.58,
    floatAmplitude: 0.13,
    orbitRadius: 0.05,
    orbitSpeed: 0.35,
  },
  {
    label: "Website",
    path: "/icons/website.png",
    desktopPosition: new Vector3(-1.9, -0.5, 0.4),
    mobilePosition: new Vector3(-1.25, 0.3, 0.4),
    floatSpeed: 0.7,
    floatAmplitude: 0.12,
    orbitRadius: 0.04,
    orbitSpeed: 0.3,
  },

  // --- Right Side ---
  {
    label: "ChatGPT",
    path: "/icons/chatgpt.png",
    desktopPosition: new Vector3(2.8, 4.3, 0.2),
    mobilePosition: new Vector3(1.3, 4.5, 0.3),
    floatSpeed: 0.62,
    floatAmplitude: 0.14,
    orbitRadius: 0.05,
    orbitSpeed: 0.3,
  },
  {
    label: "Canva",
    path: "/icons/canva.png",
    desktopPosition: new Vector3(4.45, 2.6, 0.3),
    mobilePosition: new Vector3(1.4, 3.1, 0.3),
    floatSpeed: 0.72,
    floatAmplitude: 0.13,
    orbitRadius: 0.05,
    orbitSpeed: 0.36,
  },
  {
    label: "CapCut",
    path: "/icons/capcut.png",
    desktopPosition: new Vector3(3.65, 0.7, 0.2),
    mobilePosition: new Vector3(1.35, 1.7, 0.3),
    floatSpeed: 0.68,
    floatAmplitude: 0.12,
    orbitRadius: 0.05,
    orbitSpeed: 0.33,
  },
];

// --- Glow canvas texture for base holographic light ---
function createGlowCanvas(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  grad.addColorStop(0, "rgba(45, 192, 235, 0.45)");
  grad.addColorStop(0.4, "rgba(45, 192, 235, 0.15)");
  grad.addColorStop(1, "rgba(45, 192, 235, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// --- Shaders for clean transparency and fade control ---
const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec4 texColor = texture2D(uTexture, vUv);
  if (texColor.a < 0.01) discard;
  gl_FragColor = vec4(texColor.rgb, texColor.a * uOpacity);
}
`;

const glowFragmentShader = `
uniform sampler2D uTexture;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec4 texColor = texture2D(uTexture, vUv);
  gl_FragColor = vec4(texColor.rgb, texColor.a * uOpacity);
}
`;

// --- Init / Tick / Destroy ---
const init = () => {
  if (icons.length > 0) return;

  const textureLoader = new TextureLoader();
  const glowTexture = createGlowCanvas();
  const isLandscape = sizes.isLandscape;

  for (let i = 0; i < ICON_CONFIGS.length; i++) {
    const config = ICON_CONFIGS[i]!;

    // Initial position based on orientation
    const initialPos = isLandscape ? config.desktopPosition.clone() : config.mobilePosition.clone();

    // Load authentic application icon PNG texture from public/icons
    const iconTexture = textureLoader.load(config.path);
    iconTexture.colorSpace = SRGBColorSpace;

    // Icon mesh (crisp square tile)
    const iconGeo = new PlaneGeometry(0.65, 0.65);
    const iconMat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: iconTexture },
        uOpacity: { value: 1.0 },
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    });

    const iconMesh = new Mesh(iconGeo, iconMat);
    iconMesh.renderOrder = 26;
    iconMesh.frustumCulled = false;
    iconMesh.position.copy(initialPos);

    // Cyan holographic glow mesh beneath the floating icon
    const glowGeo = new PlaneGeometry(0.85, 0.35);
    const glowMat = new ShaderMaterial({
      vertexShader,
      fragmentShader: glowFragmentShader,
      uniforms: {
        uTexture: { value: glowTexture },
        uOpacity: { value: 0.6 },
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    });

    const glowMesh = new Mesh(glowGeo, glowMat);
    glowMesh.renderOrder = 25;
    glowMesh.frustumCulled = false;
    glowMesh.position.copy(initialPos);
    glowMesh.position.y -= 0.4;
    glowMesh.rotation.x = -Math.PI / 2;

    group.add(iconMesh);
    group.add(glowMesh);

    icons.push({
      mesh: iconMesh,
      glowMesh,
      basePosition: initialPos,
      desktopPosition: config.desktopPosition.clone(),
      mobilePosition: config.mobilePosition.clone(),
      floatOffset: (i * (Math.PI * 2)) / ICON_CONFIGS.length,
      floatSpeed: config.floatSpeed,
      floatAmplitude: config.floatAmplitude,
      rotationSpeed: 0.2 + (i % 3) * 0.08,
      orbitRadius: config.orbitRadius,
      orbitSpeed: config.orbitSpeed,
      orbitOffset: (i * Math.PI) / 3,
      label: config.label,
    });
  }

  renderTarget.scene.add(group);
  gsap.ticker.add(tick);
};

const tick = () => {
  const time = gsap.ticker.time;
  const aboutWeight = sceneWeights.about;
  const progress = aboutProgress.value;

  // Only visible during the about/hologram section
  const opacity = Math.min(aboutWeight * 2, 1.0) * Math.min(progress * 3, 1.0);
  group.visible = opacity > 0.01;

  if (!group.visible) return;

  // Follow lab group position
  group.position.copy(lab.group.position);

  const isLandscape = sizes.isLandscape;
  const targetScale = isLandscape ? 1.0 : 0.82;

  for (const icon of icons) {
    const {
      mesh,
      glowMesh,
      basePosition,
      desktopPosition,
      mobilePosition,
      floatOffset,
      floatSpeed,
      floatAmplitude,
      orbitRadius,
      orbitSpeed,
      orbitOffset,
    } = icon;

    // Smoothly adapt base position to screen orientation/size
    const targetBase = isLandscape ? desktopPosition : mobilePosition;
    basePosition.lerp(targetBase, 0.08);

    // Responsive scaling for mobile vs desktop
    mesh.scale.setScalar(targetScale);
    glowMesh.scale.setScalar(targetScale);

    // Smooth vertical floating
    const floatY = Math.sin(time * floatSpeed + floatOffset) * floatAmplitude;

    // Gentle orbital drift
    const orbX = Math.sin(time * orbitSpeed + orbitOffset) * orbitRadius;
    const orbZ = Math.cos(time * orbitSpeed + orbitOffset) * orbitRadius;

    mesh.position.set(
      basePosition.x + orbX,
      basePosition.y + floatY,
      basePosition.z + orbZ,
    );

    // Subtle 3D tilt & rotation
    mesh.rotation.y = Math.sin(time * 0.35 + floatOffset) * 0.16;
    mesh.rotation.z = Math.cos(time * 0.25 + floatOffset) * 0.05;

    // Update glow position beneath icon
    glowMesh.position.set(
      mesh.position.x,
      mesh.position.y - 0.4 * targetScale,
      mesh.position.z,
    );

    // Synchronize opacity with section visibility
    const mat = mesh.material as ShaderMaterial;
    mat.uniforms.uOpacity!.value = opacity;

    const glowMat = glowMesh.material as ShaderMaterial;
    glowMat.uniforms.uOpacity!.value = opacity * 0.55;
  }
};

const destroy = () => {
  gsap.ticker.remove(tick);

  for (const icon of icons) {
    icon.mesh.geometry.dispose();
    (icon.mesh.material as ShaderMaterial).dispose();
    icon.glowMesh.geometry.dispose();
    (icon.glowMesh.material as ShaderMaterial).dispose();
  }

  icons = [];
  group.clear();
};

export const floatingIcons = { init, destroy, group };
