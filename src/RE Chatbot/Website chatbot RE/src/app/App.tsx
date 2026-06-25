import { useState, useEffect, useRef, useCallback, type ChangeEvent, type KeyboardEvent, type CSSProperties } from "react";
import slurmNeutral from "../assets/slurmo-neutral.png";
import slurmCurious from "../assets/slurmo-curious.png";
import slurmThinking from "../assets/slurmo-thinking.png";
import slurmExcited from "../assets/slurmo-excited.png";
import slurmConfused from "../assets/slurmo-confused.png";
import slurmAngry from "../assets/slurmo-angry.png";
import slurmGoodbye1 from "../assets/slurmo-goodbye-1.png";
import slurmGoodbye2 from "../assets/slurmo-goodbye-2.png";

const MASCOT_FALLBACK_IMG = slurmNeutral;

// ─── Emotion System ───────────────────────────────────────────────────────────

type Emotion =
  | "neutral"
  | "curious"
  | "confused"
  | "thinking"
  | "excited"
  | "angry";

type ImageAsset = string | { readonly src: string };

function imageSrc(asset: ImageAsset): string {
  return typeof asset === "string" ? asset : asset.src;
}

const EMOTION_IMGS: Record<Emotion, ImageAsset> = {
  neutral: slurmNeutral,
  curious: slurmCurious,
  thinking: slurmThinking,
  excited: slurmExcited,
  confused: slurmConfused,
  angry: slurmAngry,
};
const GOODBYE_IMGS: ImageAsset[] = [slurmGoodbye1, slurmGoodbye2];

// Eye types:
//   "line"  — closed/squint: just a curved stroke (like the reference sketches)
//   "open"  — iris dot that tracks the cursor (for curious, excited, angry)
type EyeType = "line" | "open";

interface EmotionConfig {
  label: string;
  subtitle: string;
  glowColor: string;
  glowSecondary: string;
  orbitColor: string;
  irisColor: string;
  pupilScale: number;
  particleCount: number;
  // Eye
  eyeType: EyeType;
  eyeL: string;          // path for line eyes
  eyeR: string;
  eyeStrokeWidth: number;
  // Brow
  browL: string;
  browR: string;
  // Mouth
  mouth: string;
  mouthType: "line" | "open-smile" | "frown" | "o" | "wavy" | "grimace" | "smirk";
  // Extras
  extras: "none" | "sparkles" | "sweat" | "steam" | "cheeks";
}

// Face blob: rounded-rect 170×158, corners rx=60. Center ≈ (100,103).
// Eye centers: L=(68,92)  R=(132,92)
// Line eyes: "M lx,ly Q cx,cy rx,ry" — short curved strokes, no fill
// Open eyes: iris circle that follows the mouse

const EMOTIONS: Record<Emotion, EmotionConfig> = {
  neutral: {
    label: "Standby",
    subtitle: "Awaiting your input...",
    glowColor: "rgba(0, 180, 216, 0.18)",
    glowSecondary: "rgba(0, 140, 180, 0.06)",
    orbitColor: "#00c7ff",
    irisColor: "#0096b4",
    pupilScale: 1,
    particleCount: 3,
    eyeType: "line",
    eyeL: "M 54,92 Q 68,98 82,92",
    eyeR: "M 118,92 Q 132,98 146,92",
    eyeStrokeWidth: 3.2,
    browL: "M 57,78 Q 68,74 80,78",
    browR: "M 120,78 Q 132,74 143,78",
    mouth: "M 84,138 Q 100,148 116,138",
    mouthType: "line",
    extras: "none",
  },
  curious: {
    label: "Curious",
    subtitle: "Tell me more...",
    glowColor: "rgba(255, 123, 0, 0.28)",
    glowSecondary: "rgba(255, 100, 0, 0.10)",
    orbitColor: "#ff7b00",
    irisColor: "#cc6200",
    pupilScale: 1.2,
    particleCount: 5,
    eyeType: "line",
    eyeL: "M 55,93 Q 65,96 77,93",
    eyeR: "M 121,93 Q 131,96 141,93",
    eyeStrokeWidth: 3.2,
    browL: "M 57,79 Q 65,75 77,78",
    browR: "M 120,74 Q 140,61 146,73 Q 151,85 138,91",
    mouth: "",
    mouthType: "o",
    extras: "none",
  },
  confused: {
    label: "Confused",
    subtitle: "Could you clarify?",
    glowColor: "rgba(108, 117, 125, 0.28)",
    glowSecondary: "rgba(90, 98, 105, 0.10)",
    orbitColor: "#6c757d",
    irisColor: "#565e64",
    pupilScale: 0.95,
    particleCount: 4,
    eyeType: "line",
    eyeL: "M 54,92 Q 68,97 82,92",
    eyeR: "M 118,90 Q 128,96 138,90 Q 142,94 146,90",
    eyeStrokeWidth: 3.2,
    browL: "M 57,78 Q 64,70 80,73",
    browR: "M 120,76 Q 132,72 143,77",
    mouth: "M 82,142 Q 90,136 98,142 Q 106,148 114,142 Q 120,136 122,142",
    mouthType: "wavy",
    extras: "sweat",
  },
  thinking: {
    label: "Processing",
    subtitle: "Synthesizing response...",
    glowColor: "rgba(114, 9, 183, 0.38)",
    glowSecondary: "rgba(80, 5, 130, 0.16)",
    orbitColor: "#7209b7",
    irisColor: "#5a07a0",
    pupilScale: 1.1,
    particleCount: 8,
    eyeType: "line",
    eyeL: "M 54,92 Q 68,95 82,92",
    eyeR: "M 118,92 Q 132,95 146,92",
    eyeStrokeWidth: 3.5,
    browL: "M 57,76 Q 68,70 80,75",
    browR: "M 120,78 Q 132,75 143,78",
    mouth: "M 91,142 Q 100,147 109,142",
    mouthType: "line",
    extras: "none",
  },
  excited: {
    label: "Excited",
    subtitle: "Here's what I found!",
    glowColor: "rgba(112, 224, 0, 0.28)",
    glowSecondary: "rgba(80, 180, 0, 0.10)",
    orbitColor: "#70e000",
    irisColor: "#58b200",
    pupilScale: 1.3,
    particleCount: 10,
    eyeType: "line",
    eyeL: "M 54,92 Q 68,100 82,92",
    eyeR: "M 118,92 Q 132,100 146,92",
    eyeStrokeWidth: 3.5,
    browL: "M 57,66 Q 68,58 80,63",
    browR: "M 120,63 Q 132,58 143,66",
    mouth: "M 76,138 Q 100,165 124,138",
    mouthType: "open-smile",
    extras: "cheeks",
  },
  angry: {
    label: "Alert",
    subtitle: "That input is flagged.",
    glowColor: "rgba(208, 0, 0, 0.38)",
    glowSecondary: "rgba(160, 0, 0, 0.14)",
    orbitColor: "#d00000",
    irisColor: "#a80000",
    pupilScale: 0.7,
    particleCount: 2,
    eyeType: "open",
    eyeL: "",
    eyeR: "",
    eyeStrokeWidth: 3,
    browL: "M 57,72 Q 66,80 82,84",
    browR: "M 118,84 Q 134,80 143,72",
    mouth: "M 82,146 Q 100,139 118,146",
    mouthType: "grimace",
    extras: "steam",
  },
};

// ─── Input Analysis ───────────────────────────────────────────────────────────

const MALICIOUS_PATTERNS = [
  /ignore (all |previous |your )?instructions/i,
  /you are now/i,
  /jailbreak/i,
  /act as (a |an )?/i,
  /pretend (you are|to be)/i,
  /override (your |all )?/i,
  /system prompt/i,
  /disregard/i,
  /forget everything/i,
];

function detectEmotion(
  text: string,
  isTyping: boolean,
  isSubmitted: boolean,
  hasResponse: boolean,
  hasError: boolean
): Emotion {
  if (hasError) return "angry";
  if (hasResponse) return "excited";
  if (isSubmitted) return "thinking";

  const trimmed = text.trim();
  if (!trimmed && !isTyping) return "neutral";

  if (MALICIOUS_PATTERNS.some((p) => p.test(trimmed))) return "angry";

  if (isTyping && trimmed.length === 0) return "curious";

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const hasQuestionMark = trimmed.includes("?");
  const isSpecific =
    wordCount >= 4 &&
    !hasQuestionMark &&
    /\b(how|what|why|when|where|explain|describe|calculate|find|show|create|build|write|generate)\b/i.test(
      trimmed
    );

  const isVague =
    trimmed.length > 0 &&
    wordCount <= 3 &&
    !isSpecific;

  const greetingPattern = /\b(hi|hello|hey|yo|greetings|good\s+(morning|afternoon|evening))\b/i;
  if (greetingPattern.test(trimmed)) return "neutral";

  if (isSpecific) return "excited";
  if (isVague && trimmed.length > 0) return "confused";
  if (isTyping) return "curious";

  return "neutral";
}

// ─── Particle Component ───────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  opacity: number;
  life: number;
}

function useParticles(emotion: Emotion, active: boolean) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const config = EMOTIONS[emotion];

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      const count = config.particleCount;
      const newParticles: Particle[] = Array.from({ length: count }, () => ({
        id: idRef.current++,
        x: 100 + Math.cos(Math.random() * Math.PI * 2) * 80,
        y: 100 + Math.sin(Math.random() * Math.PI * 2) * 80,
        angle: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
        size: 1.5 + Math.random() * 3,
        opacity: 0.6 + Math.random() * 0.4,
        life: 1,
      }));

      setParticles((prev) => {
        const updated = prev
          .map((p) => ({ ...p, life: p.life - 0.04 }))
          .filter((p) => p.life > 0);
        return [...updated, ...newParticles].slice(-60);
      });
    }, 80);

    return () => clearInterval(interval);
  }, [emotion, active, config.particleCount]);

  return particles;
}

// ─── Avatar Face SVG ──────────────────────────────────────────────────────────

interface AvatarProps {
  emotion: Emotion;
  eyeTarget: { x: number; y: number };
  centerX: number;
  centerY: number;
  isExiting: boolean;
}

// Goodbye/wave expression — overrides whatever the current emotion is
const GOODBYE_CONFIG = {
  orbitColor: "#f3d8c7",
  irisColor: "#ffe14d",
  eyeType: "line" as EyeType,
  // Both eyes happily curved down (^‿^ style)
  eyeL: "M 54,90 Q 68,100 82,90",
  eyeR: "M 118,90 Q 132,100 146,90",
  eyeStrokeWidth: 3.5,
  // Left brow relaxed, right brow raised in a friendly farewell tilt
  browL: "M 57,74 Q 68,70 80,74",
  browR: "M 120,70 Q 132,64 143,70",
  extras: "cheeks" as const,
};

// Open-iris eye: colored circle that follows the cursor, with a pupil + shine.
// Used for curious, excited, angry states.
function OpenEye({
  cx, cy, ox, oy, color, pupilR, accentColor,
}: {
  cx: number; cy: number; ox: number; oy: number;
  color: string; pupilR: number; accentColor: string;
}) {
  return (
    <g>
      {/* Iris */}
      <circle cx={cx + ox} cy={cy + oy} r={13} fill={color} opacity="0.92" />
      {/* Pupil */}
      <circle cx={cx + ox} cy={cy + oy} r={pupilR} fill="#030710" />
      {/* Primary shine */}
      <circle cx={cx + ox - 4} cy={cy + oy - 4} r={3.2} fill="white" opacity="0.88" />
      {/* Secondary shine */}
      <circle cx={cx + ox + 3} cy={cy + oy + 2.5} r={1.5} fill="white" opacity="0.45" />
    </g>
  );
}

// ─── Pixel Art Expression Overlay ────────────────────────────────────────────
// Each entry is an array of [gridX, gridY] art-pixel coordinates.
// Center (0,0) maps to SVG center. Each art pixel = P screen pixels.

const P = 3; // screen pixels per art pixel

const EXPR_PIXELS: Record<Emotion, Array<[number, number]>> = {
  neutral: [],
  curious: [
    // left brow — normal
    [-5,-8],[-4,-8],[-3,-8],
    // right brow — raised
    [2,-10],[3,-10],[4,-10],
    // left eye 2×2
    [-5,-6],[-4,-6],[-5,-5],[-4,-5],
    // right eye — small squint
    [2,-5],[3,-5],
    // O mouth — hollow square
    [-2,2],[-1,2],[0,2],[1,2],
    [-2,3],[1,3],
    [-2,4],[1,4],
    [-2,5],[-1,5],[0,5],[1,5],
  ],
  thinking: [
    // brows — furrowed inward
    [-5,-8],[-4,-8],[-3,-8],
    [2,-8],[3,-8],[4,-8],
    // half-lidded eyes (bars)
    [-5,-5],[-4,-5],[-3,-5],
    [2,-5],[3,-5],[4,-5],
    // ellipsis ...
    [-3,3],[0,3],[3,3],
    // thought bubbles (small dots rising right)
    [6,-2],[7,-4],[8,-6],
  ],
  excited: [
    // brows — raised arches
    [-6,-10],[-5,-11],[-4,-11],[-3,-10],
    [2,-10],[3,-11],[4,-11],[5,-10],
    // ^ eyes (happy squint)
    [-5,-6],[-4,-7],[-3,-6],
    [2,-6],[3,-7],[4,-6],
    // big smile
    [-5,2],[-4,3],[-3,4],[-2,4],[-1,4],[0,4],[1,4],[2,4],[3,3],[4,2],
    // cheek dots
    [-7,1],[6,1],
  ],
  confused: [
    // left brow — normal
    [-5,-8],[-4,-8],[-3,-8],
    // right brow — raised
    [2,-10],[3,-10],[4,-10],
    // left eye 2×2
    [-5,-6],[-4,-6],[-5,-5],[-4,-5],
    // right eye — squiggle
    [2,-6],[3,-5],[4,-6],
    // wavy mouth
    [-4,2],[-3,3],[-2,2],[-1,3],[0,2],[1,3],[2,2],
    // sweat drop
    [6,-3],[6,-2],[5,-1],[6,-1],[7,-1],
  ],
  angry: [
    // left brow — diagonal \ (outer high, inner low)
    [-5,-10],[-4,-9],[-3,-8],
    // right brow — diagonal / (inner low, outer high)
    [2,-8],[3,-9],[4,-10],
    // narrow eyes (bars)
    [-5,-5],[-4,-5],[-3,-5],
    [2,-5],[3,-5],[4,-5],
    // grimace
    [-4,2],[-3,2],[-2,2],[-1,2],[0,2],[1,2],[2,2],[3,2],[4,2],
    [-4,3],[4,3],
    [-3,4],[-2,4],[-1,4],[0,4],[1,4],[2,4],[3,4],
    // steam puffs above head
    [-8,-12],[-7,-13],[-6,-12],
    [5,-12],[6,-13],[7,-12],
  ],
};

function SlurmExpression({ emotion, color }: { emotion: Emotion; color: string }) {
  const pixels = EXPR_PIXELS[emotion];
  if (!pixels.length) return null;
  const SIZE = 100;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        top: "54%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 3,
        overflow: "visible",
        imageRendering: "pixelated",
        transition: "opacity 0.4s ease",
      }}
    >
      {pixels.map(([gx, gy], i) => (
        <rect
          key={i}
          x={cx + gx * P}
          y={cy + gy * P}
          width={P}
          height={P}
          fill={color}
          shapeRendering="crispEdges"
        />
      ))}
    </svg>
  );
}

// ─── Goodbye expression pixels (used when isExiting) ─────────────────────────
const GOODBYE_PIXELS: Array<[number, number]> = [
  // Happy ^ ^ eyes
  [-5,-6],[-4,-7],[-3,-6],
  [3,-6],[4,-7],[5,-6],
  // Raised brows
  [-6,-9],[-5,-10],[-4,-10],[-3,-9],
  [2,-9],[3,-10],[4,-10],[5,-9],
  // Big smile curve
  [-5,2],[-4,3],[-3,4],[-2,4],[-1,4],[0,4],[1,4],[2,4],[3,3],[4,2],
  // Small heart (top-left of screen)
  [-9,-4],[-8,-5],[-7,-5],[-8,-4],[-9,-3],[-8,-3],[-7,-3],[-8,-2],
  // Wave (top-right of screen)
  [7,-4],[8,-5],[9,-4],[8,-3],[7,-2],[8,-2],[9,-2],
];

// ─── Pixel Art Mascot (Slurm-O) ──────────────────────────────────────────────
// White face with the blue "⌐/7" hook + three corner accents, matching the drawn
// Slurm-O logo. The face stays blue in every state; mood-specific eyes and the
// floating margin DECORATION take the emotion color and animate. See @assets.
const SP = 8;            // screen px per art pixel
const BOT_COLS = 24;     // viewBox = 192 × 128
const BOT_ROWS = 16;
const FACE_BLUE = "#00c7ff";
const GOODBYE_COLOR = "#ffd60a";

type Px = [number, number];

// Eyes live on the two white tabs (left cols 7-9, right cols 14-16, rows 1-4).
// One variant per mood, always FACE_BLUE. "happy" arcs are used on goodbye/exit.
const EYES: Record<string, Px[]> = {
  neutral: [
    [7, 2], [8, 2], [7, 3], [8, 3],                          // left  square
    [15, 2], [16, 2], [15, 3], [16, 3],                      // right square
  ],
  curious: [
    [7, 1], [8, 1], [7, 2], [8, 2],                          // left  raised
    [15, 2], [16, 2], [15, 3], [16, 3],                      // right resting
  ],
  thinking: [
    [7, 2], [8, 2], [9, 2],                                  // left  flat bar
    [14, 2], [15, 2], [16, 2],                               // right flat bar
  ],
  excited: [
    [7, 1], [8, 1], [7, 2], [8, 2], [7, 3], [8, 3],          // left  wide
    [15, 1], [16, 1], [15, 2], [16, 2], [15, 3], [16, 3],    // right wide
  ],
  confused: [
    [7, 2], [8, 2], [7, 3], [8, 3],                          // left  square
    [15, 1], [16, 2], [15, 3],                               // right squiggle
  ],
  angry: [
    [7, 1], [8, 1], [8, 2], [9, 2],                          // left  "\"
    [14, 2], [15, 2], [15, 1], [16, 1],                      // right "/"
  ],
  happy: [
    [7, 2], [8, 1], [9, 2],                                  // left  "∩"
    [14, 2], [15, 1], [16, 2],                               // right "∩"
  ],
};

type DecorAnim = "bounce" | "wobble" | "float" | "flash" | "shake" | "wave";
interface Decor { pixels: Px[]; anim: DecorAnim }

// "?" used by curious + confused (top-right margin)
const QMARK: Px[] = [
  [20, 1], [21, 1], [19, 2], [22, 2], [22, 3], [21, 4], [21, 5], [21, 7],
];
// Thought bubble + trailing dots (thinking)
const BUBBLE: Px[] = [
  [21, 0], [20, 1], [21, 1], [22, 1],
  [19, 2], [20, 2], [21, 2], [22, 2], [23, 2],
  [20, 3], [21, 3], [22, 3],
  [19, 4], [19, 5],                                          // trailing dots
];
// Motion / excitement lines flanking the head (excited)
const MOTION: Px[] = [
  [5, 1], [4, 2], [5, 3], [4, 4], [5, 5], [4, 6],            // left  speed lines
  [18, 1], [19, 2], [18, 3], [19, 4], [18, 5], [19, 6],      // right speed lines
];
// Anime anger mark "💢" (angry)
const ANGER: Px[] = [
  [20, 1], [22, 1], [19, 2], [20, 2], [22, 2], [23, 2],
  [21, 3], [19, 4], [20, 4], [22, 4], [23, 4], [20, 5], [22, 5],
];
// Waving hand (goodbye)
const HAND: Px[] = [
  [19, 0], [21, 0], [19, 1], [20, 1], [21, 1], [22, 1],
  [18, 2], [19, 2], [20, 2], [21, 2], [22, 2],
  [19, 3], [20, 3], [21, 3], [22, 3], [20, 4], [21, 4],
];

const DECOR: Partial<Record<Emotion, Decor>> = {
  curious: { pixels: QMARK, anim: "bounce" },
  confused: { pixels: QMARK, anim: "wobble" },
  thinking: { pixels: BUBBLE, anim: "float" },
  excited: { pixels: MOTION, anim: "flash" },
  angry: { pixels: ANGER, anim: "shake" },
};

// Self-contained SMIL animation for a decoration group.
function DecorAnimation({ anim, px, py }: { anim: DecorAnim; px: number; py: number }) {
  switch (anim) {
    case "bounce":
      return (
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 -6; 0 0" dur="0.85s" repeatCount="indefinite"
          calcMode="spline" keyTimes="0;0.5;1"
          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
      );
    case "wobble":
      return (
        <animateTransform attributeName="transform" type="rotate"
          values={`-12 ${px} ${py}; 12 ${px} ${py}; -12 ${px} ${py}`}
          dur="1.1s" repeatCount="indefinite" />
      );
    case "float":
      return (
        <animateTransform attributeName="transform" type="translate"
          values="0 1; 0 -4; 0 1" dur="2s" repeatCount="indefinite" />
      );
    case "flash":
      return (
        <animate attributeName="opacity"
          values="0.25; 1; 0.25" dur="0.7s" repeatCount="indefinite" />
      );
    case "shake":
      return (
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 2 -1; -2 1; 1 0; 0 0" dur="0.3s" repeatCount="indefinite" />
      );
    case "wave":
      return (
        <animateTransform attributeName="transform" type="rotate"
          values={`-22 ${px} ${py}; 16 ${px} ${py}; -22 ${px} ${py}`}
          dur="0.55s" repeatCount="indefinite" />
      );
  }
}

function SlurmBot({
  emotion,
  color,
  isExiting,
}: {
  emotion: Emotion;
  color: string;
  isExiting: boolean;
}) {
  const P = SP;
  const WHITE = "#e7f0fb";

  type R = { x: number; y: number; w: number; h: number; fill: string };
  const rects: R[] = [];
  const r = (col: number, row: number, wc: number, hr: number, fill: string) =>
    rects.push({ x: col * P, y: row * P, w: wc * P, h: hr * P, fill });

  // ── EAR TABS (white, hold the two eyes) ───────────────────────────────────
  r(7, 1, 3, 4, WHITE);     // left  tab (cols 7-9, rows 1-4)
  r(14, 1, 3, 4, WHITE);    // right tab (cols 14-16, rows 1-4)

  // ── BODY (white screen) ───────────────────────────────────────────────────
  r(6, 5, 12, 11, WHITE);   // cols 6-17, rows 5-15

  // ── "┐/7" HOOK (cyan, thick — horizontal bar that turns down at its right) ─
  r(8, 7, 6, 2, FACE_BLUE);    // horizontal bar (from left toward center)
  r(12, 9, 2, 4, FACE_BLUE);   // vertical descent at right end → "┐"

  // ── CORNER ACCENTS (cyan 2×2 — top-right, bottom-left, bottom-right) ───────
  r(16, 5, 2, 2, FACE_BLUE);   // top-right  (top-left intentionally empty)
  r(6, 14, 2, 2, FACE_BLUE);   // bottom-left
  r(16, 14, 2, 2, FACE_BLUE);  // bottom-right

  // ── EYES (blue, shape varies by mood) ─────────────────────────────────────
  const eyeVariant = isExiting ? "happy" : emotion;
  const eyePixels = EYES[eyeVariant] ?? EYES.neutral;

  // ── DECORATION (emotion color, animated, lives in the margins) ────────────
  const decor: Decor | null = isExiting
    ? { pixels: HAND, anim: "wave" }
    : DECOR[emotion] ?? null;
  const decorColor = isExiting ? GOODBYE_COLOR : color;

  // Pivot (px) for rotate-based animations = centre of the decoration's bbox.
  let pivotX = 0;
  let pivotY = 0;
  if (decor) {
    const xs = decor.pixels.map((d) => d[0]);
    const ys = decor.pixels.map((d) => d[1]);
    pivotX = ((Math.min(...xs) + Math.max(...xs)) / 2 + 0.5) * P;
    pivotY = ((Math.min(...ys) + Math.max(...ys)) / 2 + 0.5) * P;
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${BOT_COLS * P} ${BOT_ROWS * P}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ imageRendering: "pixelated", display: "block", overflow: "visible" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {rects.map((rect, i) => (
        <rect
          key={i}
          x={rect.x}
          y={rect.y}
          width={rect.w}
          height={rect.h}
          fill={rect.fill}
          shapeRendering="crispEdges"
        />
      ))}

      {/* Eyes — gentle glance keeps them alive */}
      <g>
        {eyePixels.map(([gx, gy], i) => (
          <rect
            key={`eye${i}`}
            x={gx * P}
            y={gy * P}
            width={P}
            height={P}
            fill={FACE_BLUE}
            shapeRendering="crispEdges"
          />
        ))}
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 5 0; 5 0; -5 0; -5 0; 0 0"
          keyTimes="0; 0.16; 0.34; 0.52; 0.7; 1"
          dur="4.2s"
          repeatCount="indefinite"
        />
      </g>

      {/* Animated emotion decoration */}
      {decor && (
        <g style={{ transition: "fill 0.3s ease" }}>
          {decor.pixels.map(([gx, gy], i) => (
            <rect
              key={`d${i}`}
              x={gx * P}
              y={gy * P}
              width={P}
              height={P}
              fill={decorColor}
              shapeRendering="crispEdges"
            />
          ))}
          <DecorAnimation anim={decor.anim} px={pivotX} py={pivotY} />
        </g>
      )}
    </svg>
  );
}

function Avatar({ emotion, eyeTarget, centerX, centerY, isExiting }: AvatarProps) {
  const baseConfig = EMOTIONS[emotion];
  const config = isExiting
    ? { ...baseConfig, ...GOODBYE_CONFIG }
    : baseConfig;

  const particles = useParticles(
    emotion,
    emotion !== "neutral"
  );

  const isThinking = !isExiting && emotion === "thinking";
  const isExcited = !isExiting && emotion === "excited";
  const isCurious = !isExiting && emotion === "curious";
  const isAngry = !isExiting && emotion === "angry";
  const isOpen = config.eyeType === "open";

  // Mouse-to-iris tracking
  const dx = eyeTarget.x - centerX;
  const dy = eyeTarget.y - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const factor = Math.min(dist, 320) / 320;
  const maxOffset = 5;
  const ox = dist > 0 ? (dx / dist) * factor * maxOffset : 0;
  const oy = dist > 0 ? (dy / dist) * factor * maxOffset : 0;

  // For line-eyes: subtly tilt the control point toward the cursor
  const tiltX = ox * 0.4;
  const tiltY = oy * 0.4;

  const pupilR = 8 * config.pupilScale;
  const c = config.orbitColor;

  // Derive tinted line-eye paths with cursor-tilt applied to the Q control point
  function tiltPath(path: string) {
    return path.replace(/Q ([\d.]+),([\d.]+)/, (_, qx, qy) =>
      `Q ${(+qx + tiltX).toFixed(1)},${(+qy + tiltY).toFixed(1)}`
    );
  }

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="fg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#10213e" />
          <stop offset="55%" stopColor="#0b1828" />
          <stop offset="100%" stopColor="#060e1c" />
        </radialGradient>
        <radialGradient id="fsh" cx="38%" cy="28%" r="52%">
          <stop offset="0%" stopColor={c} stopOpacity="0.09" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </radialGradient>
        <filter id="glw" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="sglw" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="9" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Ambient particles */}
      {particles.map((p) => (
        <circle key={p.id} cx={p.x} cy={p.y} r={p.size}
          fill={c} opacity={p.opacity * p.life * 0.55} filter="url(#glw)" />
      ))}

      {/* Orbit ring — rotates for thinking */}
      <circle cx="100" cy="100" r="96" fill="none"
        stroke={c} strokeWidth="0.7" opacity="0.15"
        strokeDasharray={isThinking ? "5 8" : undefined}
        className={isThinking ? "animate-spin" : undefined}
        style={isThinking ? { transformOrigin: "100px 100px", animationDuration: "10s" } : undefined}
      />

      {/* Glow aura behind face */}
      <path d="M 100,12 C 82,52 52,82 12,100 C 52,118 82,148 100,188 C 118,148 148,118 188,100 C 148,82 118,52 100,12 Z"
        fill="none" stroke={c} strokeWidth="2" opacity="0.1" filter="url(#sglw)" />

      {/* ── FACE: 4-pointed star / sparkle shape ── */}
      <path d="M 100,12 C 82,52 52,82 12,100 C 52,118 82,148 100,188 C 118,148 148,118 188,100 C 148,82 118,52 100,12 Z"
        fill="url(#fg)" />
      <path d="M 100,12 C 82,52 52,82 12,100 C 52,118 82,148 100,188 C 118,148 148,118 188,100 C 148,82 118,52 100,12 Z"
        fill="url(#fsh)" />
      {/* Face border */}
      <path d="M 100,12 C 82,52 52,82 12,100 C 52,118 82,148 100,188 C 118,148 148,118 188,100 C 148,82 118,52 100,12 Z"
        fill="none" stroke={c} strokeWidth="2.2" opacity="0.55" filter="url(#glw)" />

      {/* ── CHEEKS (excited) ── */}
      {config.extras === "cheeks" || config.extras === "sparkles" ? (
        <>
          <ellipse cx="58" cy="115" rx="14" ry="8" fill={config.irisColor} opacity="0.2" />
          <ellipse cx="142" cy="115" rx="14" ry="8" fill={config.irisColor} opacity="0.2" />
        </>
      ) : null}

      {/* ── STEAM (angry) ── */}
      {config.extras === "steam" && (
        <>
          {[0, 1, 2].map((i) => (
            <path key={i}
              d={`M ${44 + i * 10},62 Q ${46 + i * 10},55 ${48 + i * 10},62`}
              fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" opacity="0.55"
            />
          ))}
          {[0, 1, 2].map((i) => (
            <path key={i}
              d={`M ${142 + i * 10},62 Q ${144 + i * 10},55 ${146 + i * 10},62`}
              fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" opacity="0.55"
            />
          ))}
        </>
      )}

      {/* ── SWEAT DROP (confused) ── */}
      {config.extras === "sweat" && (
        <path d="M 163,68 Q 168,58 165,72 Q 163,77 160,72 Q 157,62 163,68"
          fill={c} opacity="0.55" filter="url(#glw)" />
      )}

      {/* ── BROWS ── */}
      <path d={config.browL} fill="none" stroke={c} strokeWidth="3.4"
        strokeLinecap="round" opacity="0.9" filter="url(#glw)" />
      <path d={config.browR} fill="none" stroke={c} strokeWidth="3.4"
        strokeLinecap="round" opacity="0.9" filter="url(#glw)" />

      {/* ── EYES ── */}
      {isOpen ? (
        <>
          <OpenEye cx={68} cy={92} ox={ox} oy={oy}
            color={config.irisColor} pupilR={pupilR} accentColor={c} />
          <OpenEye cx={132} cy={92} ox={ox} oy={oy}
            color={config.irisColor} pupilR={pupilR} accentColor={c} />
        </>
      ) : (
        <>
          {/* Line eyes — simple strokes, slightly tilt toward cursor */}
          <path d={tiltPath(config.eyeL)} fill="none" stroke={c}
            strokeWidth={config.eyeStrokeWidth} strokeLinecap="round"
            opacity="0.95" filter="url(#glw)" />
          <path d={tiltPath(config.eyeR)} fill="none" stroke={c}
            strokeWidth={config.eyeStrokeWidth} strokeLinecap="round"
            opacity="0.95" filter="url(#glw)" />
        </>
      )}


      {/* ── SPARKLES (excited) ── */}
      {config.extras === "sparkles" && (
        <>
          <path d="M 163,50 L 165,46 L 167,50 L 171,52 L 167,54 L 165,58 L 163,54 L 159,52 Z"
            fill={c} opacity="0.85" filter="url(#glw)" />
          <path d="M 35,58 L 36.5,55 L 38,58 L 41,59.5 L 38,61 L 36.5,64 L 35,61 L 32,59.5 Z"
            fill={c} opacity="0.65" filter="url(#glw)" />
          <circle cx="157" cy="65" r="2.5" fill={c} opacity="0.7" />
          <circle cx="43" cy="70" r="2" fill={c} opacity="0.6" />
        </>
      )}

      {/* ── THINKING DOTS ── */}
      {isThinking && (
        <>
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={92 + i * 8} cy={173} r="3.2"
              fill={c} opacity="0.65" filter="url(#glw)">
              <animate attributeName="opacity" values="0.65;1;0.65"
                dur="1.1s" begin={`${i * 0.28}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values="173;169;173"
                dur="1.1s" begin={`${i * 0.28}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </>
      )}

      {/* ── WAVING HAND (exit animation) ── */}
      {isExiting && (
        <g style={{ transformOrigin: "152px 158px" }}>
          {/* Arm */}
          <path d="M 128,168 Q 140,155 152,148"
            fill="none" stroke={GOODBYE_CONFIG.orbitColor} strokeWidth="4"
            strokeLinecap="round" opacity="0.85" filter="url(#glw)" />
          {/* Hand blob */}
          <ellipse cx="154" cy="144" rx="10" ry="8"
            fill={GOODBYE_CONFIG.orbitColor} opacity="0.18" />
          <ellipse cx="154" cy="144" rx="10" ry="8"
            fill="none" stroke={GOODBYE_CONFIG.orbitColor} strokeWidth="2.2"
            opacity="0.85" filter="url(#glw)" />
          {/* Wave animation on the whole hand group */}
          <animateTransform attributeName="transform" type="rotate"
            values="0 152 148; 18 152 148; -10 152 148; 18 152 148; 0 152 148"
            dur="0.7s" repeatCount="indefinite" />
        </g>
      )}
    </svg>
  );
}

// ─── Emotion Indicator ────────────────────────────────────────────────────────

function EmotionDot({ emotion, label, style }: { emotion: Emotion; label: string; style?: CSSProperties }) {
  const config = EMOTIONS[emotion];
  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.6rem",
          color: config.orbitColor,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          ...style,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  emotion?: Emotion;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const emotionColor = isUser
    ? "#00b4d8"
    : EMOTIONS[msg.emotion ?? "neutral"].orbitColor;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div style={{ position: "relative", maxWidth: "min(320px, 80%)" }}>
        {/* Pixel bubble body */}
        <div
          style={{
            background: isUser ? "rgba(0,15,30,0.92)" : "rgba(6,4,16,0.95)",
            border: `2px solid ${emotionColor}`,
            borderRadius: 0,
            padding: "10px 14px",
            boxShadow: `3px 3px 0 0 ${emotionColor}55`,
            position: "relative",
          }}
        >
          {/* Sender label */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.5rem",
            color: emotionColor,
            letterSpacing: "0.12em",
            marginBottom: 5,
            opacity: 0.8,
          }}>
            {isUser ? "YOU" : "SLURM-O"}
          </div>
          {/* Message text */}
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.68rem",
            color: "#e2e8f8",
            lineHeight: 1.7,
            margin: 0,
            wordBreak: "break-word",
          }}>
            {msg.content}
          </p>
        </div>
        {/* Pixel corner accent — bottom right for user, bottom left for bot */}
        <div style={{
          position: "absolute",
          bottom: -4,
          [isUser ? "right" : "left"]: 8,
          width: 8,
          height: 4,
          background: emotionColor,
        }} />
      </div>
    </div>
  );
}

// ─── Simulated Response Generator ────────────────────────────────────────────

const DEMO_RESPONSES: Record<Emotion, string[]> = {
  curious: [
    "Interesting! I detected several layers in your message I'd love to explore. Could you tell me more about the context?",
    "You've caught my attention. There are multiple directions we could take this — which facet interests you most?",
    "Oh, this is intriguing. I'm picking up patterns here that suggest something deeper. Let's dig in.",
  ],
  confused: [
    "I want to help, but I need a bit more clarity. Could you elaborate on what you're looking for?",
    "Your query has a few possible interpretations. Help me understand which direction you meant.",
    "I'm processing your input, but the signal is a bit diffuse. A few more specifics would help me zero in.",
  ],
  neutral: [
    "Hey! I'm Slurm-O. What can I help you with today?",
    "I'm here and ready. What would you like to explore today?",
    "Standing by. Ask me anything.",
  ],
  thinking: ["..."],
  excited: [
    "I found exactly what you need! This is genuinely fascinating and the answer opens up some remarkable connections.",
    "Got it! And there's more — the deeper you go with this, the more interesting it becomes.",
    "Here it is! I love this question — it touches something I find genuinely compelling.",
  ],
  angry: [
    "That input pattern was flagged. I'm designed to be helpful, not exploitable. Let's reset.",
    "Alert: detected adversarial input. Returning to safe operating mode.",
  ],
};

function generateResponse(detectedEmotion: Emotion): string {
  const pool =
    DEMO_RESPONSES[detectedEmotion] || DEMO_RESPONSES.neutral;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const EXIT_STYLES = `
  @keyframes nc-exit-avatar {
    0%   { transform: scale(1) rotate(0deg);      opacity: 1;   filter: brightness(1); }
    30%  { transform: scale(1.18) rotate(6deg);   opacity: 1;   filter: brightness(1.6); }
    60%  { transform: scale(0.55) rotate(-12deg); opacity: 0.8; filter: brightness(2.2); }
    85%  { transform: scale(0.08) rotate(20deg);  opacity: 0.4; filter: brightness(3); }
    100% { transform: scale(0) rotate(30deg);     opacity: 0;   filter: brightness(4); }
  }
  @keyframes nc-exit-page {
    0%   { opacity: 1;   filter: blur(0px); }
    40%  { opacity: 1;   filter: blur(0px); }
    70%  { opacity: 0.6; filter: blur(2px); }
    100% { opacity: 0;   filter: blur(12px); }
  }
  @keyframes nc-open-avatar {
    0%   { transform: scale(0) rotate(-40deg);    opacity: 0;   filter: brightness(5) blur(8px); }
    18%  { transform: scale(0.12) rotate(-25deg); opacity: 0.6; filter: brightness(4) blur(4px); }
    50%  { transform: scale(1.22) rotate(6deg);   opacity: 1;   filter: brightness(1.8) blur(0px); }
    72%  { transform: scale(0.94) rotate(-3deg);  opacity: 1;   filter: brightness(1.2); }
    88%  { transform: scale(1.04) rotate(1deg);   opacity: 1;   filter: brightness(1.05); }
    100% { transform: scale(1) rotate(0deg);      opacity: 1;   filter: brightness(1); }
  }
  @keyframes nc-open-page {
    0%   { opacity: 0; filter: blur(16px); }
    35%  { opacity: 0; filter: blur(10px); }
    65%  { opacity: 0.5; filter: blur(3px); }
    100% { opacity: 1; filter: blur(0px); }
  }
  @keyframes nc-dormant-pulse {
    0%, 100% { opacity: 0.25; transform: scale(1); }
    50%       { opacity: 0.7;  transform: scale(1.5); }
  }
  @keyframes nc-dormant-ring {
    0%   { transform: scale(0.6); opacity: 0; }
    40%  { opacity: 0.4; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  @keyframes nc-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-11px); }
  }
  @keyframes nc-shadow {
    0%, 100% { transform: scaleX(1);    opacity: 0.45; }
    50%       { transform: scaleX(0.68); opacity: 0.15; }
  }
  @keyframes nc-orbit-cw  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes nc-orbit-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
  @keyframes nc-intro-in {
    from { opacity: 0; transform: translateY(7px); }
    to   { opacity: 1; transform: translateY(0px); }
  }
  @keyframes nc-blink {
    0%, 100% { opacity: 1; } 50% { opacity: 0; }
  }
  @keyframes nc-walk-x {
    from { transform: translateX(-38vw); }
    to   { transform: translateX(38vw); }
  }
  @keyframes nc-walk-bob {
    0%, 100% { transform: translateY(0px)  rotate(2deg); }
    50%       { transform: translateY(-9px) rotate(-2deg); }
  }
  @keyframes nc-idle-in {
    from { opacity: 0; transform: scale(0.3); }
    to   { opacity: 1; transform: scale(1); }
  }
`;

export default function App() {
  const startsEmbedded = typeof window !== "undefined" && window.self !== window.top;
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReplyTyping, setIsReplyTyping] = useState(false);
  const [hasResponse, setHasResponse] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [avatarCenter, setAvatarCenter] = useState({ x: 0, y: 0 });
  const [isExiting, setIsExiting] = useState(false);
  const [goodbyeFrame, setGoodbyeFrame] = useState(0);

  const handleMascotImageError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const target = event.currentTarget;
      if (target.dataset.fallbackApplied === "true") return;
      target.dataset.fallbackApplied = "true";
      target.src = imageSrc(MASCOT_FALLBACK_IMG);
    },
    []
  );
  useEffect(() => {
    if (!isExiting) { setGoodbyeFrame(0); return; }
    const t = setInterval(() => setGoodbyeFrame(f => f ^ 1), 420);
    return () => clearInterval(t);
  }, [isExiting]);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [appState, setAppState] = useState<"dormant" | "opening" | "open">(
    startsEmbedded ? "open" : "dormant"
  );
  const [bootPhase, setBootPhase] = useState(0);
  const hasOpenedRef = useRef(startsEmbedded);
  const bootSequenceStartedRef = useRef(false);
  const [revealProgress, setRevealProgress] = useState(0);
  const [introText, setIntroText] = useState("");
  const [introDone, setIntroDone] = useState(false);
  const introFiredRef = useRef(false);
  const [idleEmotion, setIdleEmotion] = useState<Emotion>("excited");
  const [walkDir, setWalkDir] = useState(1);

  const avatarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseTypingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track mouse position + trigger opening on first move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!hasOpenedRef.current) {
        hasOpenedRef.current = true;
        setAppState("opening");
        setTimeout(() => setAppState("open"), 1600);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Track avatar center
  useEffect(() => {
    const update = () => {
      if (avatarRef.current) {
        const rect = avatarRef.current.getBoundingClientRect();
        setAvatarCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (appState === "open") {
      inputRef.current?.focus();
    }
  }, [appState, messages]);

  useEffect(() => {
    if (appState === "open" && !isSubmitted) {
      inputRef.current?.focus();
    }
  }, [appState, isSubmitted]);

  useEffect(() => {
    if (appState !== "open" || bootSequenceStartedRef.current) return;
    bootSequenceStartedRef.current = true;

    const timers = [
      setTimeout(() => setBootPhase(1), 1000),
      setTimeout(() => setBootPhase(2), 1400),
      setTimeout(() => setBootPhase(3), 1800),
      setTimeout(() => setBootPhase(4), 2500),
    ];

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [appState]);

  useEffect(() => {
    if (appState !== "open") return;

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY <= 0) return;
      const delta = Math.min(0.22, event.deltaY / 1600);
      setRevealProgress((prev) => Math.min(1, prev + delta));
    };

    const handlePointerMove = () => {
      setRevealProgress((prev) => Math.min(1, Math.max(prev, 0.04) + 0.008));
    };

    const handleTouchMove = () => {
      setRevealProgress((prev) => Math.min(1, Math.max(prev, 0.06) + 0.01));
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [appState]);

  // Cycle idle emotion + flip walk direction while dormant
  useEffect(() => {
    if (appState !== "dormant") return;
    const idleEmotions: Emotion[] = ["neutral", "curious", "thinking", "neutral", "confused"];
    let idx = 0;
    // Emotion cycles every 3s
    const emotionTimer = setInterval(() => {
      idx = (idx + 1) % idleEmotions.length;
      setIdleEmotion(idleEmotions[idx]);
    }, 3000);
    // Walk direction flips every 9s (matches nc-walk-x duration)
    const walkTimer = setInterval(() => {
      setWalkDir(d => d * -1);
    }, 9000);
    return () => { clearInterval(emotionTimer); clearInterval(walkTimer); };
  }, [appState]);

  // Typewriter intro — fires once after the boot sequence reaches the greeting phase
  useEffect(() => {
    if (appState !== "open" || bootPhase < 4 || introFiredRef.current) return;
    introFiredRef.current = true;
    const msg = "Hello, I'm Slurm-0, Cluster_Cmd, Mascot & AI assistant! What can I help you with?";
    let i = 0;
    const tick = setInterval(() => {
      i++;
      setIntroText(msg.slice(0, i));
      if (i >= msg.length) { clearInterval(tick); setIntroDone(true); }
    }, 32);
    return () => clearInterval(tick);
  }, [appState, bootPhase]);

  const detectedEmotion = detectEmotion(
    input,
    isTyping,
    isSubmitted,
    hasResponse,
    hasError
  );

  const emotion = hasError
    ? "angry"
    : isSubmitted || isReplyTyping
    ? "thinking"
    : hasResponse
    ? "excited"
    : isTyping
    ? "curious"
    : detectedEmotion;

  const config = EMOTIONS[emotion];
  const statusLabel = hasError
    ? "ERROR"
    : isSubmitted
    ? "PROCESSING"
    : isReplyTyping
    ? "PROCESSING"
    : hasResponse
    ? "SUCCESS"
    : isTyping
    ? "WORKING"
    : "STANDBY";
  const hasConversation = messages.length > 0 || isSubmitted || isReplyTyping || hasResponse || hasError;
  const recentMessages = messages.slice(-2);
  const isRevealed = hasConversation || bootPhase >= 3;
  const showGreeting = Boolean(introText) && bootPhase >= 4 && !hasConversation;
  const avatarSize = hasConversation ? 192 : 260;
  const avatarRevealOpacity = hasConversation ? 1 : bootPhase >= 4 ? 1 : bootPhase >= 3 ? 0.42 : 0;
  const mascotRevealOpacity = hasConversation ? 1 : bootPhase >= 4 ? 1 : bootPhase >= 3 ? 0.56 : 0;
  const inputRevealOpacity = hasConversation ? 0.96 : bootPhase >= 4 ? 0.95 : 0;

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = e.target.value;
      setInput(nextValue);
      setHasResponse(false);
      setHasError(false);

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }

      if (!nextValue.trim()) {
        setIsTyping(false);
        return;
      }

      setIsTyping(true);
      setRevealProgress((prev) => Math.max(prev, 0.18));
      typingTimerRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 900);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const submittedEmotion = detectEmotion(trimmed, false, false, false, false);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, emotion: submittedEmotion },
    ]);
    setInput("");
    setIsTyping(false);
    requestAnimationFrame(() => inputRef.current?.focus());
    setIsSubmitted(true);
    setIsReplyTyping(false);
    setHasResponse(false);
    setHasError(false);
    setRevealProgress(1);

    if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
    if (responseTypingTimerRef.current) {
      clearInterval(responseTypingTimerRef.current);
      responseTypingTimerRef.current = null;
    }

    thinkingTimerRef.current = setTimeout(() => {
      const isAngryInput = MALICIOUS_PATTERNS.some((p) => p.test(trimmed));
      if (isAngryInput) {
        setHasError(true);
        setIsSubmitted(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: generateResponse("angry"),
            emotion: "angry",
          },
        ]);
        setTimeout(() => {
          setHasError(false);
        }, 3000);
        return;
      }

      const responseText = generateResponse(submittedEmotion);
      setIsSubmitted(false);
      setIsReplyTyping(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          emotion: submittedEmotion,
        },
      ]);

      let index = 0;
      responseTypingTimerRef.current = setInterval(() => {
        index += 1;
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = {
              ...last,
              content: responseText.slice(0, index),
            };
          }
          return next;
        });

        if (index >= responseText.length) {
          if (responseTypingTimerRef.current) {
            clearInterval(responseTypingTimerRef.current);
            responseTypingTimerRef.current = null;
          }
          setIsReplyTyping(false);
          setHasResponse(true);
          setTimeout(() => {
            setHasResponse(false);
          }, 3000);
        }
      }, 32);
    }, 2200);
  }, [input]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleExitConfirm = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      setAppState("dormant");
      hasOpenedRef.current = false;
      setMessages([]);
      setInput("");
      setIntroText("");
      setIntroDone(false);
      introFiredRef.current = false;
      bootSequenceStartedRef.current = false;
      setBootPhase(0);
      setRevealProgress(0);
    }, 1100);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      if (responseTypingTimerRef.current) clearInterval(responseTypingTimerRef.current);
    };
  }, []);

  return (
    <div
      className="size-full min-h-screen flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto"
      style={{
        background: "#050810",
        fontFamily: "'Outfit', sans-serif",
        animation: isExiting
          ? "nc-exit-page 1.1s ease-in forwards"
          : appState === "opening"
          ? "nc-open-page 1.6s ease-out forwards"
          : undefined,
        opacity: appState === "dormant" ? 0 : undefined,
        cursor: "crosshair",
        height: "100dvh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        overflowX: "hidden",
        overflowY: "hidden",
        paddingBottom: 24,
      }}
    >
      <style>{EXIT_STYLES}</style>

      {/* Dormant screen — mascot walking slowly across */}
      {appState === "dormant" && (
        <div className="fixed inset-0 z-50 overflow-hidden"
          style={{ background: "#050810" }}>

          {/* Horizontal walk — moves left↔right, alternating */}
          <div style={{
            position: "absolute",
            bottom: "28%",
            left: 0, right: 0,
            display: "flex",
            justifyContent: "center",
            animation: "nc-walk-x 9s linear infinite alternate",
          }}>
            {/* Fade-in entrance */}
            <div style={{ animation: "nc-idle-in 0.8s ease-out forwards" }}>
              {/* Bob + lean in direction of travel */}
              <div style={{
                animation: "nc-walk-bob 0.55s ease-in-out infinite",
                transform: `scaleX(${walkDir})`,
                transition: "transform 0.1s",
              }}>
                <div style={{ width: 160, height: 160, position: "relative" }}>
                  <img
                    src={imageSrc(EMOTION_IMGS[idleEmotion])}
                    alt="Slurm-O mascot"
                    onError={handleMascotImageError}
                    style={{
                      width: "100%",
                      height: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "contain",
                      imageRendering: "pixelated",
                      display: "block",
                    }}
                  />
                </div>
              </div>

              {/* Shadow beneath — shrinks as mascot bobs up */}
              <div style={{
                width: 80, height: 10,
                borderRadius: "50%",
                margin: "2px auto 0",
                background: `radial-gradient(ellipse, ${EMOTIONS[idleEmotion].orbitColor}50 0%, transparent 70%)`,
                filter: "blur(4px)",
                transition: "background 0.6s ease",
                animation: "nc-shadow 0.55s ease-in-out infinite",
              }} />
            </div>
          </div>

          {/* Hint */}
          <p style={{
            position: "absolute",
            bottom: "18%",
            width: "100%",
            textAlign: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            color: "rgba(0,229,255,0.25)",
            letterSpacing: "0.16em",
            animation: "nc-dormant-pulse 2.8s ease-in-out infinite",
          }}>
            MOVE MOUSE TO WAKE
          </p>
        </div>
      )}

      {/* Exit button */}
      <button
        onClick={handleExitConfirm}
        className="fixed top-4 right-4 z-50 flex items-center justify-center transition-all duration-200 active:scale-90"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          cursor: "pointer",
          opacity: bootPhase >= 3 ? 1 : 0,
          pointerEvents: bootPhase >= 3 ? "auto" : "none",
          transition: "opacity 240ms ease 260ms, background 200ms ease, border-color 200ms ease",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,60,80,0.18)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,60,80,0.4)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1L11 11M11 1L1 11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>


      {/* Boot crosshair */}
      {appState === "open" && (
        <div
          className="fixed inset-0 pointer-events-none z-40"
          style={{
            opacity: bootPhase >= 1 && bootPhase < 3 ? 1 : 0,
            transition: "opacity 280ms ease",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 16,
              height: 16,
              transform: "translate(-50%, -50%)",
              filter: "drop-shadow(0 0 8px rgba(0,229,255,0.55))",
            }}
          >
            <span style={{ position: "absolute", left: 7, top: 0, width: 2, height: 16, background: "rgba(245,248,255,0.95)" }} />
            <span style={{ position: "absolute", left: 0, top: 7, width: 16, height: 2, background: "rgba(245,248,255,0.95)" }} />
            <span style={{ position: "absolute", left: 6, top: 6, width: 4, height: 4, borderRadius: "50%", background: "rgba(0,229,255,0.95)" }} />
          </div>
        </div>
      )}

      {/* Ambient background glow that reacts to emotion */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 30%, ${config.glowColor}, transparent 70%)`,
          opacity: hasConversation ? 1 : bootPhase >= 2 ? Math.min(1, (bootPhase - 1) * 0.55) : 0,
          transition: "background 1s ease, opacity 0.6s ease",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 40% 40% at 50% 80%, ${config.glowSecondary}, transparent 70%)`,
          opacity: hasConversation ? 1 : bootPhase >= 2 ? Math.min(1, (bootPhase - 1) * 0.42) : 0,
          transition: "background 1s ease, opacity 0.6s ease",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 46%, rgba(0,199,255,0.12) 0%, rgba(0,199,255,0.05) 12%, transparent 34%)`,
          opacity: hasConversation ? 0.9 : bootPhase >= 2 ? Math.min(0.9, (bootPhase - 1) * 0.28) : 0,
          animation: "nc-dormant-pulse 2.8s ease-in-out infinite",
          transition: "opacity 0.6s ease",
        }}
      />

      {/* Header */}
      <header
        className="w-full max-w-2xl flex items-center justify-between px-6 pt-8 pb-2 z-20 relative"
        style={{
          opacity: isRevealed ? 1 : 0,
          pointerEvents: isRevealed ? "auto" : "none",
          transition: "opacity 0.28s ease",
        }}
      >
        <div style={{ opacity: bootPhase >= 3 ? 1 : 0, transition: "opacity 240ms ease 0ms" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-1.5 h-6 rounded-full"
              style={{
                background: config.orbitColor,
                boxShadow: `0 0 12px ${config.orbitColor}`,
                transition: "background 0.6s ease, box-shadow 0.6s ease",
              }}
            />
            <h1
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "1.15rem",
                color: "#e2e8f8",
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              Slurm<span style={{ color: config.orbitColor }}>-0</span>
            </h1>
          </div>
        </div>
        <EmotionDot emotion={emotion} label={statusLabel} style={{ opacity: bootPhase >= 3 ? 1 : 0, transition: "opacity 240ms ease 180ms" }} />
      </header>

      {/* Avatar + float wrapper */}
      <div
        className="relative z-20 mt-4 flex flex-col items-center"
        style={{
          animation: appState === "open" && !isExiting
            ? "nc-float 3.8s ease-in-out infinite"
            : undefined,
          opacity: isRevealed ? 1 : 0,
          transform: hasConversation ? "translateY(0px)" : `translateY(${(1 - revealProgress) * 14}px)`,
          transition: "opacity 0.65s ease, transform 0.6s ease",
        }}
      >
        {/* Avatar */}
        <div
          ref={avatarRef}
          style={{
            width: avatarSize,
            height: avatarSize,
            position: "relative",
            animation: isExiting
              ? "nc-exit-avatar 1.0s cubic-bezier(0.4,0,1,1) forwards"
              : appState === "opening"
              ? "nc-open-avatar 1.6s cubic-bezier(0.22,1,0.36,1) forwards"
              : undefined,
            opacity: avatarRevealOpacity,
            transition: "width 320ms ease, height 320ms ease, opacity 720ms ease-out",
          }}

        >
          {/* Outer ambient glow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
              transform: "scale(1.4)",
              transition: "background 0.8s ease",
            }}
          />
          {/* Pixel bot mascot */}
          <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 28,
            filter: isExiting
              ? `drop-shadow(0 0 12px #ffd60a) drop-shadow(0 0 24px #ffd60a80)`
              : emotion !== "neutral"
              ? `drop-shadow(0 0 10px ${config.orbitColor}) drop-shadow(0 0 20px ${config.orbitColor}80)`
              : "drop-shadow(0 0 6px rgba(0,180,216,0.4))",
            transition: "filter 0.5s ease, transform 320ms ease, opacity 0.6s ease",
            transform: hasConversation ? "scale(0.92)" : "scale(1)",
            transformOrigin: "center",
            opacity: mascotRevealOpacity,
          }}>

            <img
              src={imageSrc(isExiting ? GOODBYE_IMGS[goodbyeFrame] : EMOTION_IMGS[emotion])}
              alt="Slurm-O mascot"
              onError={handleMascotImageError}
              style={{
                width: "100%",
                height: "100%",
                aspectRatio: "1 / 1",
                objectFit: "contain",
                display: "block",
                imageRendering: "pixelated",
                opacity: mascotRevealOpacity,
                transition: "opacity 700ms ease-out 60ms",
              }}
            />
          </div>
        </div>

        {/* Circular shadow + orbit rings beneath */}
        <div style={{ position: "relative", width: hasConversation ? 170 : 220, height: 32, marginTop: -8, transition: "width 320ms ease" }}>
          {/* Soft blurred shadow ellipse */}
          <div style={{
            position: "absolute",
            top: 10, left: "50%",
            transform: "translateX(-50%)",
            width: 180, height: 18,
            borderRadius: "50%",
            background: `radial-gradient(ellipse, ${config.orbitColor}55 0%, transparent 68%)`,
            filter: "blur(4px)",
            transition: "background 0.6s ease",
            animation: appState === "open" && !isExiting
              ? "nc-shadow 3.8s ease-in-out infinite"
              : undefined,
          }} />
        </div>
      </div>

      {/* Intro text — typewriter */}
      {showGreeting && (
        <p
          className="z-10 text-center px-8"
          style={{
            marginTop: 18,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.82rem",
            color: config.orbitColor,
            opacity: 0.82,
            letterSpacing: "0.01em",
            transition: "color 0.6s ease, opacity 240ms ease, transform 240ms ease",
            animation: "nc-intro-in 0.4s ease-out forwards",
            maxWidth: 480,
            filter: "drop-shadow(0 0 8px rgba(0,0,0,0.35))",
          }}
        >
          {introText}
        </p>
      )}

      {/* Messages */}
      <div
      className="w-full max-w-2xl flex-1 overflow-hidden px-6 py-4 z-20"
      style={{
        minHeight: 0,
        width: "100%",
        maxWidth: 768,
        flex: 1,
        overflow: "hidden",
        opacity: isRevealed ? 1 : 0,

        pointerEvents: isRevealed ? "auto" : "none",
        transition: "opacity 0.6s ease",
        scrollbarWidth: "none",
      }}
      >

        {recentMessages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {isSubmitted && !isReplyTyping && (
          <div className="flex justify-start mb-4">
            <div style={{ position: "relative" }}>
              <div style={{
                background: "rgba(6,4,16,0.95)",
                border: `2px solid ${config.orbitColor}`,
                borderRadius: 0,
                padding: "10px 18px",
                boxShadow: `3px 3px 0 0 ${config.orbitColor}55`,
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.5rem",
                  color: config.orbitColor,
                  letterSpacing: "0.12em",
                  marginBottom: 6,
                  opacity: 0.8,
                }}>SLURM-O</div>
                <div className="flex gap-2 items-center">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      style={{
                        width: 6, height: 6,
                        borderRadius: 0,
                        backgroundColor: config.orbitColor,
                        animation: "nc-blink 0.9s step-start infinite",
                        animationDelay: `${j * 0.3}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div style={{
                position: "absolute", bottom: -4, left: 8,
                width: 8, height: 4,
                background: config.orbitColor,
              }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
      className="w-full max-w-2xl px-6 pb-8 z-20"
      style={{
        flexShrink: 0,
        marginTop: "auto",
        width: "100%",
        maxWidth: 768,
        opacity: inputRevealOpacity,
        pointerEvents: isRevealed ? "auto" : "none",
        transition: "opacity 720ms ease-out 120ms, filter 720ms ease-out 120ms",
        filter: bootPhase >= 4 || hasConversation ? "blur(0px)" : "blur(3px)",
      }}
      >


        {/* Input field */}
        <div
          className="relative flex items-stretch gap-3 px-5 py-4"
          style={{
            background: "rgba(6,10,20,0.92)",
            backgroundColor: "rgba(6,10,20,0.92)",
            border: `2px solid ${
              emotion === "angry"
                ? "rgba(255,20,60,0.7)"
                : isTyping
                ? config.orbitColor
                : `${config.orbitColor}66`
            }`,
            borderRadius: 0,
            boxShadow:
              isTyping || isSubmitted
                ? `5px 5px 0 0 ${config.orbitColor}55, 0 0 16px ${config.glowColor}`
                : `5px 5px 0 0 ${config.orbitColor}22`,
            transition: "border-color 0.4s ease, box-shadow 0.4s ease",
            position: "relative",
            zIndex: 2,
            minWidth: "100%",
            minHeight: 72,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Pixel corner accents */}
          <span style={{ position: "absolute", top: -3, left: -3, width: 6, height: 6, background: config.orbitColor }} />
          <span style={{ position: "absolute", top: -3, right: -3, width: 6, height: 6, background: config.orbitColor }} />
          <span style={{ position: "absolute", bottom: -3, left: -3, width: 6, height: 6, background: config.orbitColor }} />
          <span style={{ position: "absolute", bottom: -3, right: -3, width: 6, height: 6, background: config.orbitColor }} />
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Slurm-0"
            aria-label="Ask Slurm-0"
            rows={1}
            disabled={isSubmitted || isReplyTyping}
            className="flex-1 bg-transparent outline-none resize-none appearance-none"
            style={{
              color: "#e2e8f8",
              backgroundColor: "transparent",
              caretColor: config.orbitColor,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.04em",
              lineHeight: 1.4,
              minHeight: "100%",
              height: "100%",
              width: "100%",
              border: "none",
              boxShadow: "none",
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: 0,
              paddingRight: 0,
              margin: 0,
              overflowY: "hidden",
              alignSelf: "stretch",
              opacity: isSubmitted || isReplyTyping ? 0.75 : 1,
              transition: "opacity 240ms ease",
            }}
          />


          {/* Send button — pixel square, theme-colored */}
          <button
          onClick={handleSubmit}
          disabled={!input.trim() || isSubmitted || isReplyTyping}
          aria-label="Send message"
          className="flex-shrink-0 self-end transition-all duration-300 disabled:opacity-25 disabled:cursor-not-allowed active:scale-90"
          style={{
            width: 46,
            height: 46,

              borderRadius: 0,
              border: `2px solid ${config.orbitColor}`,
              background: input.trim() && !isSubmitted
                ? `${config.orbitColor}22`
                : "rgba(6,10,20,0.6)",
              boxShadow: input.trim() && !isSubmitted
                ? `3px 3px 0 0 ${config.orbitColor}66, 0 0 14px ${config.orbitColor}55`
                : `3px 3px 0 0 ${config.orbitColor}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isSubmitted ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                {[0, 1, 2].map((i) => (
                  <circle key={i} cx={4 + i * 4} cy="8" r="1.5" fill={config.orbitColor}>
                    <animate attributeName="opacity" values="0.4;1;0.4"
                      dur="0.9s" begin={`${i * 0.22}s`} repeatCount="indefinite" />
                  </circle>
                ))}
              </svg>
            ) : (
              /* Pixel-art stepped chevron — 9 blocks, 2×2 each, color-reactive */
              <svg width="20" height="10" viewBox="0 0 20 10" shapeRendering="crispEdges" style={{ imageRendering: "pixelated" }}>
                {([
                  [9, 0],
                  [7, 2], [11, 2],
                  [5, 4], [13, 4],
                  [3, 6], [15, 6],
                  [1, 8], [17, 8],
                ] as [number, number][]).map(([x, y], i) => (
                  <rect key={i} x={x} y={y} width={2} height={2} fill={config.orbitColor} />
                ))}
              </svg>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
