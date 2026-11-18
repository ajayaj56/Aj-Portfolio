import { Howl } from "howler";

import trackBGM from "../../../assets/sounds/BGM.mp3";
import trackAbout from "../../../assets/music/ambient-pads.ogg";

export const BASE_VOLUMES = {
  bgm: 0.25,
  about: 0.3,
} as const;

export const musicTracks = {
  bgm: new Howl({ src: [trackBGM], loop: true, volume: 0.25, preload: true }),
  about: new Howl({ src: [trackAbout], loop: true, volume: 0, preload: true }),
} as const;
