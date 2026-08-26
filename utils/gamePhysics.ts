export interface LayoutState {
  offsetX: number;
  offsetY: number;
  scale: number;
  dpr: number;
  w: number;
  h: number;
}

export const GAME_CONFIG = {
  WIDTH: 1000,
  HEIGHT: 600,
  Px: 100,
  Py: 450,
  Tx: 880,
  BASE_TY: 280,
  BASE_BULLSEYE_RADIUS: 12,
  GRAVITY: 1200,
  POWER_MULTIPLIER: 7,
};

export const computeLayout = (w: number, h: number): LayoutState => {
  const dpr = window.devicePixelRatio || 1;
  const scale = Math.max(
    Math.min(w / GAME_CONFIG.WIDTH, h / GAME_CONFIG.HEIGHT),
    0.45,
  );
  const offsetX = (w - GAME_CONFIG.WIDTH * scale) / 2;
  const offsetY = (h - GAME_CONFIG.HEIGHT * scale) / 2;

  return { offsetX, offsetY, scale, dpr, w, h };
};

export const getDifficultyLevel = (score: number) => score / 100;

export const getTargetSpeed = (level: number, streak: number) => {
  const baseSpeed = 0.35 + 0.08 * Math.sqrt(level);
  const streakSurge = streak >= 3 ? 1.2 : 1.0;
  return baseSpeed * streakSurge;
};

export const getTargetAmplitude = (level: number) => {
  return Math.min(160, 25 + 24 * Math.log(1 + level));
};

export const getWindStrength = (
  level: number,
  score: number,
  streak: number,
) => {
  if (score < 300) return 0;
  const baseWind = 3.5 * Math.sqrt(level - 3);
  return streak >= 5 ? baseWind * 1.3 : baseWind;
};

export const getBullseyeRadius = (level: number) => {
  return Math.max(
    6,
    GAME_CONFIG.BASE_BULLSEYE_RADIUS - Math.min(level * 0.1, 5),
  );
};

export const getTargetRadius = (level: number) => {
  return Math.max(42, 55 - Math.min(level * 0.25, 13));
};

export const getTargetY = (
  score: number,
  streak: number,
  timeElapsed: number,
) => {
  const level = getDifficultyLevel(score);
  const speed = getTargetSpeed(level, streak);
  const amp = getTargetAmplitude(level);
  return GAME_CONFIG.BASE_TY + Math.sin(timeElapsed * speed) * amp;
};

export const getTargetXOffset = (
  score: number,
  streak: number,
  timeElapsed: number,
) => {
  const level = getDifficultyLevel(score);
  if (level > 10) {
    const speed = getTargetSpeed(level, streak);
    return Math.cos(timeElapsed * speed * 2) * 20;
  }
  return 0;
};
