#include ../includes/avatar-progress/fragment.glsl;

varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uFrame;
uniform vec2 uEyeOffset;

#define ROWS 4.
#define COLUMNS 4.

const vec2 LEFT_EYE_CENTER = vec2(0.298828, 0.603516);
const vec2 RIGHT_EYE_CENTER = vec2(0.697266, 0.603516);
const float EYE_RADIUS = 0.098;
const vec2 MAX_EYE_SHIFT = vec2(0.024, 0.018);

void main() {
  // Calculate tile position
  float column = mod(uFrame, COLUMNS);
  float row = floor(uFrame / COLUMNS);

  // Flip Y because texture atlases often start from top-left
  row = (ROWS - 1.0) - row;

  vec2 sampleTileUv = vUv;
  bool inEyeArea = false;
  bool outsideAfterShift = false;

  float dLeft = distance(vUv, LEFT_EYE_CENTER);
  float dRight = distance(vUv, RIGHT_EYE_CENTER);

  if (dLeft <= EYE_RADIUS || dRight <= EYE_RADIUS) {
    inEyeArea = true;
    if (length(uEyeOffset) > 0.0005) {
      vec2 center = (dLeft <= EYE_RADIUS) ? LEFT_EYE_CENTER : RIGHT_EYE_CENTER;
      vec2 shift = clamp(uEyeOffset, vec2(-1.0), vec2(1.0)) * MAX_EYE_SHIFT;
      
      // Limit diagonal movement to keep pupil neatly within eyeball boundaries
      if (length(shift) > MAX_EYE_SHIFT.x) {
        shift = normalize(shift) * MAX_EYE_SHIFT.x;
      }

      vec2 shiftedUv = vUv - shift;
      if (distance(shiftedUv, center) <= EYE_RADIUS) {
        sampleTileUv = shiftedUv;
      } else {
        outsideAfterShift = true;
      }
    }
  }

  // Scale UVs to a single tile
  vec2 uv = sampleTileUv;
  uv.x = (uv.x + column) / COLUMNS;
  uv.y = (uv.y + row) / ROWS;

  vec4 textureColor = texture2D(uTexture, uv);

  // If eye tracking shifted the sample outside the eyeball or onto transparent padding,
  // maintain solid white sclera for natural appearance
  if (inEyeArea && length(uEyeOffset) > 0.0005) {
    if (outsideAfterShift || textureColor.a < 0.5) {
      textureColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  }

  float progress = getProgress();

  gl_FragColor = vec4(textureColor.rgb, progress * textureColor.a);
}