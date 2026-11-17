import {
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";
import { resources } from "../../../utils/resources";

let frameMeshRef: Mesh | null = null;
let originalIndex: BufferAttribute | null = null;
let photoMesh: Mesh | null = null;
let photoGeometry: BufferGeometry | null = null;
let photoMaterial: MeshBasicMaterial | null = null;
let photoTexture: Texture | null = null;

const PHOTO_PATH = "/ajay%20frame.png?v=3";

let bounds: { yMin: number; yMax: number; zMin: number; zMax: number } | null = null;
let vertMapping: { oldToNew: Map<number, number>; posAttr: BufferAttribute } | null = null;

const updateCoverUVs = (tex: Texture) => {
  if (!photoGeometry || !bounds || !vertMapping) return;
  const img = tex.image as { width?: number; height?: number } | undefined;
  if (!img || !img.width || !img.height) return;

  const { yMin, yMax, zMin, zMax } = bounds;
  const { oldToNew, posAttr } = vertMapping;
  const frameW = zMax - zMin;
  const frameH = yMax - yMin;
  const frameAspect = frameW / frameH;
  const imgAspect = img.width / img.height;

  let sU = 1;
  let sV = 1;
  let cropU = 0;
  let cropV = 0;

  if (imgAspect > frameAspect) {
    sU = frameAspect / imgAspect;
    cropU = (1 - sU) / 2;
  } else {
    sV = imgAspect / frameAspect;
    cropV = (1 - sV) / 2;
  }

  const uvAttr = photoGeometry.getAttribute("uv") as BufferAttribute;
  for (const [oldIdx, newIdx] of oldToNew.entries()) {
    const y = posAttr.getY(oldIdx);
    const z = posAttr.getZ(oldIdx);
    const vNorm = (y - yMin) / frameH;
    const uNorm = (zMax - z) / frameW;
    const u = cropU + uNorm * sU;
    const v = cropV + vNorm * sV;
    uvAttr.setXY(newIdx, u, v);
  }
  uvAttr.needsUpdate = true;
};

const init = (frameMesh: Mesh) => {
  if (photoMesh) return;
  frameMeshRef = frameMesh;

  // 1. Get or load texture
  if (resources.items["frame-photo"]) {
    photoTexture = resources.items["frame-photo"];
  } else {
    const loader = new TextureLoader();
    photoTexture = loader.load(PHOTO_PATH, (tex) => {
      tex.colorSpace = SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = LinearMipmapLinearFilter;
      tex.magFilter = LinearFilter;
      tex.needsUpdate = true;
      updateCoverUVs(tex);
    });
  }

  if (photoTexture) {
    photoTexture.colorSpace = SRGBColorSpace;
  }

  // 2. Base geometry of frameMesh
  const baseGeo = frameMesh.geometry;
  const posAttr = baseGeo.getAttribute("position") as BufferAttribute | undefined;
  const indexAttr = baseGeo.getIndex();

  if (!posAttr || !indexAttr) return;

  originalIndex = indexAttr;
  const indexArray = indexAttr.array;

  const innerTriIndices: number[] = [];
  const borderTriIndices: number[] = [];

  // Partition the 330 triangles:
  // - Triangles 0..157: Left 3D Mountain & Sun (158 tris) -> REMOVED
  // - Triangles 158..239: Frame outer bevels and front border (82 tris) -> KEPT
  // - Triangles 240..257: Inner flat display surface (18 tris) -> KEPT FOR PHOTO
  // - Triangles 258..295: Frame inner border bevels (38 tris) -> KEPT
  // - Triangles 296..329: Right 3D Mountain (34 tris) -> REMOVED
  for (let tri = 0; tri < indexArray.length / 3; tri++) {
    const i0 = indexArray[tri * 3] as number;
    const i1 = indexArray[tri * 3 + 1] as number;
    const i2 = indexArray[tri * 3 + 2] as number;

    if (tri >= 240 && tri < 258) {
      // Inner flat surface for photo
      innerTriIndices.push(i0, i1, i2);
    } else if ((tri >= 158 && tri < 240) || (tri >= 258 && tri < 296)) {
      // Frame outer border, casing and inner bevels
      borderTriIndices.push(i0, i1, i2);
    }
    // Triangles < 158 and >= 296 are the 3D mountains & sun: completely stripped out!
  }

  // 3. Keep only the frame border on frameMesh (stripping all 192 mountain & sun triangles)
  frameMesh.geometry.setIndex(borderTriIndices);

  if (innerTriIndices.length === 0) {
    console.warn("[Frame] Could not locate inner frame face triangles");
    return;
  }

  // 4. Calculate bounds of inner photo display area
  let yMin = Infinity;
  let yMax = -Infinity;
  let zMin = Infinity;
  let zMax = -Infinity;

  const uniqueVerts = new Set(innerTriIndices);
  for (const vIdx of uniqueVerts) {
    const y = posAttr.getY(vIdx);
    const z = posAttr.getZ(vIdx);
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
    if (z < zMin) zMin = z;
    if (z > zMax) zMax = z;
  }

  bounds = { yMin, yMax, zMin, zMax };

  const oldToNew = new Map<number, number>();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const frameW = zMax - zMin;
  const frameH = yMax - yMin;
  const frameAspect = frameW / frameH;
  const img = photoTexture?.image as { width?: number; height?: number } | undefined;
  const imgAspect = img?.width && img?.height ? img.width / img.height : 1024 / 768;

  let sU = 1;
  let sV = 1;
  let cropU = 0;
  let cropV = 0;

  if (imgAspect > frameAspect) {
    sU = frameAspect / imgAspect;
    cropU = (1 - sU) / 2;
  } else {
    sV = imgAspect / frameAspect;
    cropV = (1 - sV) / 2;
  }

  for (const oldIdx of innerTriIndices) {
    if (!oldToNew.has(oldIdx)) {
      const newIdx = oldToNew.size;
      oldToNew.set(oldIdx, newIdx);

      const x = posAttr.getX(oldIdx) + 0.001;
      const y = posAttr.getY(oldIdx);
      const z = posAttr.getZ(oldIdx);
      positions.push(x, y, z);

      const vNorm = (y - yMin) / frameH;
      const uNorm = (zMax - z) / frameW;
      const u = cropU + uNorm * sU;
      const v = cropV + vNorm * sV;
      uvs.push(u, v);
    }
    indices.push(oldToNew.get(oldIdx)!);
  }

  vertMapping = { oldToNew, posAttr };

  photoGeometry = new BufferGeometry();
  photoGeometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  photoGeometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  photoGeometry.setIndex(indices);
  photoGeometry.computeVertexNormals();

  photoMaterial = new MeshBasicMaterial({
    map: photoTexture,
  });

  photoMesh = new Mesh(photoGeometry, photoMaterial);
  photoMesh.name = "personal-photo";
  frameMesh.add(photoMesh);
};

const destroy = () => {
  if (frameMeshRef && originalIndex) {
    frameMeshRef.geometry.setIndex(originalIndex);
    frameMeshRef = null;
    originalIndex = null;
  }
  if (photoMesh) {
    photoMesh.removeFromParent();
    photoMesh = null;
  }
  if (photoGeometry) {
    photoGeometry.dispose();
    photoGeometry = null;
  }
  if (photoMaterial) {
    photoMaterial.dispose();
    photoMaterial = null;
  }
  bounds = null;
  vertMapping = null;
};

export const frame = { init, destroy };
