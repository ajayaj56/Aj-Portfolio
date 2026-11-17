import {
  Group,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  CanvasTexture,
  Vector3,
  DoubleSide,
} from "three";
import gsap from "gsap";
import { renderTarget } from "../../core/renderTarget";
import { lab } from "../lab";
import { sceneWeights } from "../../../animations/scenes";
import { aboutProgress } from "../../../animations/transitions/about";

interface FloatingIcon {
  mesh: Mesh;
  glowMesh: Mesh;
  basePosition: Vector3;
  floatOffset: number;
  floatSpeed: number;
  rotationSpeed: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitOffset: number;
  label: string;
}

const group = new Group();
let icons: FloatingIcon[] = [];

const ICON_CONFIGS = [
  {
    label: "Figma",
    position: new Vector3(-2.6, 4.4, 0),
    color: "#A259FF",
    secondaryColor: "#1ABCFE",
    drawIcon: drawFigmaIcon,
  },
  {
    label: "Canva",
    position: new Vector3(2.8, 4.3, 0),
    color: "#00C4CC",
    secondaryColor: "#7D2AE8",
    drawIcon: drawCanvaIcon,
  },
  {
    label: "Excel",
    position: new Vector3(-3.8, 0.9, 0),
    color: "#217346",
    secondaryColor: "#185C37",
    drawIcon: drawExcelIcon,
  },
  {
    label: "Photoshop",
    position: new Vector3(2.8, 0.8, 0),
    color: "#31A8FF",
    secondaryColor: "#001E36",
    drawIcon: drawPhotoshopIcon,
  },
  {
    label: "Website",
    position: new Vector3(-2.0, 0.4, 0.3),
    color: "#2DC0EB",
    secondaryColor: "#03366E",
    drawIcon: drawWebsiteIcon,
  },
];

// --- Icon drawing functions ---

function createIconCanvas(
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void,
): CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  // Draw rounded rect background with glass effect
  const pad = 20;
  const radius = 48;
  ctx.save();
  roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, radius);
  ctx.clip();

  // Glass gradient background
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "rgba(10, 40, 80, 0.85)");
  grad.addColorStop(1, "rgba(5, 20, 50, 0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle glass highlight
  const highlight = ctx.createLinearGradient(0, 0, 0, size / 2);
  highlight.addColorStop(0, "rgba(45, 192, 235, 0.15)");
  highlight.addColorStop(1, "rgba(45, 192, 235, 0)");
  ctx.fillStyle = highlight;
  ctx.fillRect(0, 0, size, size);

  ctx.restore();

  // Border glow
  ctx.save();
  ctx.strokeStyle = "rgba(45, 192, 235, 0.5)";
  ctx.lineWidth = 2;
  roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, radius);
  ctx.stroke();
  ctx.restore();

  // Draw the icon
  drawFn(ctx, size);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawFigmaIcon(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.12;

  // Figma logo — 3 columns of rounded rects
  const colors = ["#F24E1E", "#FF7262", "#A259FF", "#1ABCFE", "#0ACF83"];

  // Top-left
  ctx.fillStyle = colors[0]!;
  roundRect(ctx, cx - s * 1.5, cy - s * 2.2, s * 1.4, s * 1.4, s * 0.7);
  ctx.fill();

  // Top-right
  ctx.fillStyle = colors[3]!;
  roundRect(ctx, cx + s * 0.1, cy - s * 2.2, s * 1.4, s * 1.4, s * 0.7);
  ctx.fill();

  // Mid-left
  ctx.fillStyle = colors[2]!;
  roundRect(ctx, cx - s * 1.5, cy - s * 0.6, s * 1.4, s * 1.4, s * 0.7);
  ctx.fill();

  // Mid-right (circle)
  ctx.fillStyle = colors[1]!;
  ctx.beginPath();
  ctx.arc(cx + s * 0.8, cy + s * 0.1, s * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Bottom-left
  ctx.fillStyle = colors[4]!;
  roundRect(ctx, cx - s * 1.5, cy + s * 1.0, s * 1.4, s * 1.4, s * 0.7);
  ctx.fill();
}

function drawCanvaIcon(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.22;

  // Canva — gradient circle with "C"
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, "#00C4CC");
  grad.addColorStop(0.5, "#7D2AE8");
  grad.addColorStop(1, "#FF6F61");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // "C" letter
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${r * 1.3}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("C", cx, cy + 2);
}

function drawExcelIcon(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const w = size * 0.4;
  const h = size * 0.45;

  // Green background
  ctx.fillStyle = "#217346";
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 8);
  ctx.fill();

  // "X" letter
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${h * 0.7}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("X", cx, cy + 2);

  // Small grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 + 4, cy);
  ctx.lineTo(cx + w / 2 - 4, cy);
  ctx.stroke();
}

function drawPhotoshopIcon(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const w = size * 0.4;
  const h = size * 0.45;

  // Dark blue background
  ctx.fillStyle = "#001E36";
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 8);
  ctx.fill();

  // Blue border
  ctx.strokeStyle = "#31A8FF";
  ctx.lineWidth = 2;
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 8);
  ctx.stroke();

  // "Ps" text
  ctx.fillStyle = "#31A8FF";
  ctx.font = `bold ${h * 0.5}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Ps", cx, cy + 2);
}

function drawWebsiteIcon(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.22;

  // Globe with gradient
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, "#2DC0EB");
  grad.addColorStop(1, "#03366E");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 3;

  // Outer circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.stroke();

  // Vertical ellipse
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.5, r, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Horizontal arcs
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.4, r * 0.85, r * 0.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.4, r * 0.85, r * 0.2, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// --- Glow canvas ---

function createGlowCanvas(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  grad.addColorStop(0, "rgba(45, 192, 235, 0.35)");
  grad.addColorStop(0.5, "rgba(45, 192, 235, 0.1)");
  grad.addColorStop(1, "rgba(45, 192, 235, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// --- Vertex / Fragment shaders ---

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
  gl_FragColor = vec4(texColor.rgb, texColor.a * uOpacity);
}
`;

// --- Init / Tick / Destroy ---

const init = () => {
  if (icons.length > 0) return;

  const glowTexture = createGlowCanvas();

  for (let i = 0; i < ICON_CONFIGS.length; i++) {
    const config = ICON_CONFIGS[i]!;
    const texture = createIconCanvas(config.drawIcon);

    // Icon mesh
    const iconGeo = new PlaneGeometry(0.55, 0.55);
    const iconMat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: texture },
        uOpacity: { value: 1.0 },
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    });

    const iconMesh = new Mesh(iconGeo, iconMat);
    iconMesh.renderOrder = 26;
    iconMesh.frustumCulled = false;
    iconMesh.position.copy(config.position);

    // Glow mesh beneath
    const glowGeo = new PlaneGeometry(0.8, 0.3);
    const glowMat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
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
    glowMesh.position.copy(config.position);
    glowMesh.position.y -= 0.35;
    glowMesh.rotation.x = -Math.PI / 2;

    group.add(iconMesh);
    group.add(glowMesh);

    icons.push({
      mesh: iconMesh,
      glowMesh,
      basePosition: config.position.clone(),
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.6 + Math.random() * 0.4,
      rotationSpeed: 0.15 + Math.random() * 0.2,
      orbitRadius: 0.05 + Math.random() * 0.05,
      orbitSpeed: 0.3 + Math.random() * 0.3,
      orbitOffset: Math.random() * Math.PI * 2,
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

  for (const icon of icons) {
    const { mesh, glowMesh, basePosition, floatOffset, floatSpeed, orbitRadius, orbitSpeed, orbitOffset } = icon;

    // Vertical floating
    const floatY = Math.sin(time * floatSpeed + floatOffset) * 0.12;

    // Subtle orbital movement
    const orbX = Math.sin(time * orbitSpeed + orbitOffset) * orbitRadius;
    const orbZ = Math.cos(time * orbitSpeed + orbitOffset) * orbitRadius;

    mesh.position.set(
      basePosition.x + orbX,
      basePosition.y + floatY,
      basePosition.z + orbZ,
    );

    // Subtle rotation
    mesh.rotation.y = Math.sin(time * 0.3 + floatOffset) * 0.15;

    // Update glow position
    glowMesh.position.set(
      mesh.position.x,
      mesh.position.y - 0.35,
      mesh.position.z,
    );

    // Set opacity
    const mat = mesh.material as ShaderMaterial;
    mat.uniforms.uOpacity!.value = opacity;

    const glowMat = glowMesh.material as ShaderMaterial;
    glowMat.uniforms.uOpacity!.value = opacity * 0.5;
  }
};

const destroy = () => {
  gsap.ticker.remove(tick);
  icons = [];
  group.clear();
};

export const floatingIcons = { init, destroy, group };
