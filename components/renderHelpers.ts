import { GAME_CONFIG } from "../utils/gamePhysics";

export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  t: any,
  backgroundLayers: any[],
  isArrowFlying: boolean,
  velocityX: number,
  dt: number,
  timeElapsed: number,
) => {
  const { WIDTH, HEIGHT, Py } = GAME_CONFIG;

  // Sky Gradient (Rendered in Logical Coordinates)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGrad.addColorStop(0, t.sky[0]);
  bgGrad.addColorStop(0.5, t.sky[1]);
  bgGrad.addColorStop(1, t.sky[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(-500, -500, WIDTH + 1000, HEIGHT + 1000);

  // Sun
  ctx.save();
  ctx.shadowColor = t.sunGlow;
  ctx.shadowBlur = 120;
  ctx.fillStyle = t.sun;
  ctx.beginPath();
  ctx.arc(WIDTH / 2 + 150, 160, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Mountains & Flags
  backgroundLayers.forEach((layer) => {
    layer.x -= isArrowFlying ? velocityX * dt * 0.015 * layer.speed : 0;
    const mGrad = ctx.createLinearGradient(
      0,
      layer.y,
      0,
      layer.y + layer.height,
    );
    mGrad.addColorStop(0, layer.color1);
    mGrad.addColorStop(1, layer.color2);
    ctx.fillStyle = mGrad;

    if (layer.type === "mountain") {
      ctx.beginPath();
      ctx.moveTo(layer.x - 500, layer.y + layer.height + 1000);
      ctx.lineTo(layer.x, layer.y + layer.height);
      ctx.lineTo(layer.x + layer.width / 2, layer.y);
      ctx.lineTo(layer.x + layer.width, layer.y + layer.height);
      ctx.lineTo(layer.x + layer.width + 500, layer.y + layer.height + 1000);
      ctx.fill();
    } else if (layer.type === "flag") {
      ctx.fillStyle = t.flagPole;
      ctx.fillRect(layer.x, layer.y, 5, layer.height);
      ctx.fillStyle = layer.color1;
      ctx.beginPath();
      ctx.moveTo(layer.x + 5, layer.y + 10);
      ctx.quadraticCurveTo(
        layer.x + 55 + Math.sin(timeElapsed * 3) * 10,
        layer.y + 20,
        layer.x + 75,
        layer.y + 15,
      );
      ctx.lineTo(layer.x + 5, layer.y + 35);
      ctx.fill();
    }
  });

  // Ground Surface
  const groundY = Py + 35;
  const groundGrad = ctx.createLinearGradient(0, groundY, 0, HEIGHT + 400);
  groundGrad.addColorStop(0, t.ground[0]);
  groundGrad.addColorStop(1, t.ground[1]);
  ctx.fillStyle = groundGrad;
  ctx.fillRect(-2000, groundY, 5000, HEIGHT + 1000);
};

export const drawTarget = (
  ctx: CanvasRenderingContext2D,
  t: any,
  tx: number,
  ty: number,
  groundY: number,
  targetRadius: number,
  bullseyeRadius: number,
) => {
  ctx.save();
  ctx.fillStyle = t.targetStand[0];
  ctx.fillRect(tx - 12, ty, 16, groundY - ty);
  ctx.fillStyle = t.targetStand[1];
  ctx.fillRect(tx - 16, ty, 10, groundY - ty);

  const drawRing = (r: number, c1: string, c2: string) => {
    const grad = ctx.createRadialGradient(
      tx - r / 3,
      ty - r / 3,
      r / 4,
      tx,
      ty,
      r,
    );
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(tx, ty, r, 0, Math.PI * 2);
    ctx.fill();
  };

  drawRing(targetRadius, t.targetRings.outer, t.targetStand[1]);
  drawRing(targetRadius * 0.7, t.targetRings.mid, t.targetRings.mid);
  drawRing(targetRadius * 0.4, t.targetRings.inner, t.targetStand[1]);
  drawRing(bullseyeRadius, t.targetRings.bullseye, t.sunGlow);
  ctx.restore();
};

export const drawArrow = (
  ctx: CanvasRenderingContext2D,
  t: any,
  isHotStreak: boolean,
) => {
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(20, 0);
  ctx.strokeStyle = isHotStreak ? "#F59E0B" : t.targetStand[0];
  ctx.lineWidth = isHotStreak ? 4.5 : 3.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(25, 0);
  ctx.lineTo(5, -7);
  ctx.lineTo(5, 7);
  ctx.fillStyle = isHotStreak ? "#EF4444" : t.sunGlow;
  ctx.fill();
};

export const drawArcher = (
  ctx: CanvasRenderingContext2D,
  t: any,
  timeElapsed: number,
  backHandX: number,
  backHandY: number,
  backElbowX: number,
  backElbowY: number,
  handX: number,
  handY: number,
  elbowX: number,
  elbowY: number,
) => {
  const Px = GAME_CONFIG.Px;
  const Py = GAME_CONFIG.Py;
  const skinColor = "#937F77";
  const silverArmor = "#E2E8F0";
  const dhotiColor = t.sun === "#FFFFFF" ? "#F3F4F6" : "#9CA3AF";
  const clothColor = "#DC2626";

  ctx.save();

  // Quiver & Arrows on Back
  ctx.fillStyle = "#451A03";
  ctx.beginPath();
  ctx.moveTo(Px - 15, Py - 60);
  ctx.lineTo(Px - 35, Py - 10);
  ctx.lineTo(Px - 20, Py - 5);
  ctx.lineTo(Px - 5, Py - 55);
  ctx.fill();
  ctx.strokeStyle = silverArmor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = "#F3F4F6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Px - 15, Py - 60);
  ctx.lineTo(Px - 25, Py - 80);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(Px - 10, Py - 58);
  ctx.lineTo(Px - 15, Py - 82);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(Px - 5, Py - 55);
  ctx.lineTo(Px - 5, Py - 78);
  ctx.stroke();

  // Back Arm
  ctx.strokeStyle = skinColor;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(Px, Py - 45);
  ctx.lineTo(backElbowX, backElbowY);
  ctx.lineTo(backHandX, backHandY);
  ctx.stroke();

  let bdx = backHandX - backElbowX,
    bdy = backHandY - backElbowY,
    blen = Math.hypot(bdx, bdy);
  if (blen > 0) {
    let bux = bdx / blen,
      buy = bdy / blen;
    ctx.strokeStyle = silverArmor;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(backHandX - bux * 15, backHandY - buy * 15);
    ctx.lineTo(backHandX - bux * 5, backHandY - buy * 5);
    ctx.stroke();
  }

  // Lower Body / Dhoti
  ctx.fillStyle = dhotiColor;
  ctx.beginPath();
  ctx.moveTo(Px - 10, Py - 10);
  ctx.lineTo(Px - 25, Py + 35);
  ctx.lineTo(Px - 5, Py + 35);
  ctx.lineTo(Px + 5, Py - 10);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(Px + 5, Py - 10);
  ctx.lineTo(Px + 15, Py + 35);
  ctx.lineTo(Px + 35, Py + 35);
  ctx.lineTo(Px + 15, Py - 10);
  ctx.fill();

  // Torso & Armor
  ctx.fillStyle = silverArmor;
  ctx.fillRect(Px - 12, Py - 15, 26, 8);
  ctx.fillStyle = skinColor;
  ctx.fillRect(Px - 12, Py - 55, 24, 40);
  ctx.fillStyle = silverArmor;
  ctx.beginPath();
  ctx.moveTo(Px - 14, Py - 55);
  ctx.lineTo(Px + 14, Py - 55);
  ctx.lineTo(Px + 10, Py - 25);
  ctx.lineTo(Px - 10, Py - 25);
  ctx.fill();

  // Red Gem/Pendant
  ctx.fillStyle = "#DC2626";
  ctx.beginPath();
  ctx.arc(Px, Py - 40, 4, 0, Math.PI * 2);
  ctx.fill();

  // Flowing Sash
  ctx.fillStyle = clothColor;
  ctx.beginPath();
  ctx.moveTo(Px - 10, Py - 45);
  ctx.quadraticCurveTo(
    Px - 40 - Math.sin(timeElapsed * 4) * 10,
    Py - 20,
    Px - 50,
    Py + 10,
  );
  ctx.lineTo(Px - 40, Py + 15);
  ctx.quadraticCurveTo(
    Px - 30 - Math.sin(timeElapsed * 4) * 10,
    Py - 10,
    Px,
    Py - 35,
  );
  ctx.fill();

  // Head & Hair
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(Px, Py - 65, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(Px, Py - 76);
  ctx.lineTo(Px + 14, Py - 65);
  ctx.lineTo(Px + 10, Py - 55);
  ctx.lineTo(Px - 5, Py - 55);
  ctx.fill();

  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.moveTo(Px + 3, Py - 68);
  ctx.lineTo(Px + 8, Py - 66);
  ctx.lineTo(Px + 3, Py - 65);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(Px - 4, Py - 65, 12, Math.PI * 0.5, Math.PI * 1.6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(Px - 14, Py - 60, 6, 0, Math.PI * 2);
  ctx.fill();

  // Crown / Helmet
  ctx.fillStyle = silverArmor;
  ctx.beginPath();
  ctx.moveTo(Px - 12, Py - 73);
  ctx.lineTo(Px + 10, Py - 73);
  ctx.lineTo(Px + 15, Py - 100);
  ctx.lineTo(Px, Py - 90);
  ctx.lineTo(Px - 15, Py - 100);
  ctx.fill();
  ctx.fillStyle = "#DC2626";
  ctx.beginPath();
  ctx.arc(Px, Py - 85, 3, 0, Math.PI * 2);
  ctx.fill();

  // Front Arm
  ctx.strokeStyle = skinColor;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(Px, Py - 45);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(handX, handY);
  ctx.stroke();

  let fdx = handX - elbowX,
    fdy = handY - elbowY,
    flen = Math.hypot(fdx, fdy);
  if (flen > 0) {
    let fux = fdx / flen,
      fuy = fdy / flen;
    ctx.strokeStyle = silverArmor;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(handX - fux * 15, handY - fuy * 15);
    ctx.lineTo(handX - fux * 5, handY - fuy * 5);
    ctx.stroke();
  }

  ctx.restore();
};
