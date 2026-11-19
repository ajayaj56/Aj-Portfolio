import type { Box3 } from "three";

export interface ClickInfo {
  isDoubleTap?: boolean;
  isTouch?: boolean;
  event?: MouseEvent | TouchEvent;
}

export type ClickableBox3 = Box3 & {
  onClick?: (info?: ClickInfo) => void;
  onHover?: () => void;
  onHoverLeave?: () => void;
  hoverSound?: string;
};
