import { Box3, Mesh } from "three";
import { raycast } from "../../utils/raycast";
import { isFeatureEnabled } from "../../../utils/features";
import { room } from ".";
import { soundsEnabled, howlerUnlocked } from "../../../features/sounds/composables/useHowler";
import { notes } from "./notes";
import { playSound } from "../../../features/sounds/utils/sounds";
import { musicTracks, BASE_VOLUMES } from "../../../features/sounds/definitions/music";
import { Howler } from "howler";

import type { ClickableBox3 } from "../../types";

let mesh: Mesh | null = null;
let box3: ClickableBox3 | null = null;

const handleClick = () => {
  soundsEnabled.value = !soundsEnabled.value;
  playSound("click");
};

const handleHover = () => {
  if (Howler.ctx && Howler.ctx.state === "suspended") {
    Howler.ctx.resume();
  }
  if (!howlerUnlocked.value) {
    howlerUnlocked.value = true;
  }
  if (!soundsEnabled.value) {
    soundsEnabled.value = true;
    localStorage.setItem("portfolio-soundsEnabled", "true");
  }

  const track = musicTracks.bgm;
  if (!track.playing()) {
    track.load();
    track.play();
  }
  track.fade(track.volume(), BASE_VOLUMES.bgm, 500);
};

const init = (_mesh: Mesh) => {
  mesh = _mesh;
  room.group.add(mesh);

  if (isFeatureEnabled("sounds")) {
    box3 = new Box3().setFromObject(mesh);
    box3.onClick = handleClick;
    box3.onHover = handleHover;
    box3.hoverSound = "hover";
    raycast.boxesToCheck.push(box3);
  }

  // Initialize notes positioned relative to music box
  notes.init({
    x: mesh.position.x,
    y: mesh.position.y,
    z: mesh.position.z,
  });
};

const tick = () => {
  if (!mesh || !box3) return;

  box3.setFromObject(mesh);
  box3.expandByScalar(0.15);
};

const destroy = () => {
  if (box3) {
    raycast.boxesToCheck.splice(raycast.boxesToCheck.indexOf(box3), 1);
  }
  box3 = null;
  if (musicTracks.bgm.playing()) {
    musicTracks.bgm.stop();
  }
  notes.destroy();
};

export const music = {
  init,
  tick,
  destroy,
};
