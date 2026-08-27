import { GAME_CONFIG } from "./gamePhysics";

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

  // 1. Sky Gradient (Extended to cover ultra-tall screens)
  const bgGrad = ctx.createLinearGradient(0, -1000, 0, HEIGHT + 500);
  bgGrad.addColorStop(0, t.sky[0]);
  bgGrad.addColorStop(0.5, t.sky[1]);
  bgGrad.addColorStop(1, t.sky[2]);
  ctx.fillStyle = bgGrad;
  // Fills a massive area to prevent letterbox clipping on ultra-wide / ultra-tall devices
  ctx.fillRect(-2000, -2000, WIDTH + 4000, HEIGHT + 4000);

  // 2. Sun (Anchored relatively so it doesn't get lost on wide screens)
  ctx.save();
  ctx.shadowColor = t.sunGlow;
  ctx.shadowBlur = 120;
  ctx.fillStyle = t.sun;
  ctx.beginPath();
  ctx.arc(WIDTH * 0.75, 160, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Mountains & Flags
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
      // Extended the mountain bases from 500 to 1500 to prevent ground-clipping
      ctx.moveTo(layer.x - 1500, layer.y + layer.height + 2000);
      ctx.lineTo(layer.x, layer.y + layer.height);
      ctx.lineTo(layer.x + layer.width / 2, layer.y);
      ctx.lineTo(layer.x + layer.width, layer.y + layer.height);
      ctx.lineTo(layer.x + layer.width + 1500, layer.y + layer.height + 2000);
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

  // 4. Ground Surface (Extended downward and outward for tall mobile screens)
  const groundY = Py + 35;
  const groundGrad = ctx.createLinearGradient(0, groundY, 0, HEIGHT + 1000);
  groundGrad.addColorStop(0, t.ground[0]);
  groundGrad.addColorStop(1, t.ground[1]);
  ctx.fillStyle = groundGrad;
  ctx.fillRect(-3000, groundY, WIDTH + 6000, HEIGHT + 2000);
};

export const drawTarget = (
  ctx: CanvasRenderingContext2D,
  t: any,
  tx: number,
  ty: number,
  groundY: number,
  targetRadius: number,
  bullseyeRadius: number,
  timeElapsed: number = 0,
) => {
  ctx.save();
  const scale = targetRadius / 45;
  ctx.translate(tx, ty);
  ctx.scale(scale, scale);

  // Organic hovering offset
  const hoverY = Math.sin(timeElapsed * 4) * 3;
  ctx.translate(0, hoverY);

  // Rapid flapping math
  const flap = Math.sin(timeElapsed * 20);

  // --- THE MYSTICAL BIRD ---

  // Back Wing
  ctx.save();
  ctx.translate(2, -2);
  ctx.rotate((Math.PI / 5) * flap);
  ctx.fillStyle = "#065F46";
  ctx.beginPath();
  ctx.ellipse(12, -4, 18, 6, -Math.PI / 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Tail
  ctx.save();
  ctx.translate(15, 8);
  ctx.rotate((-Math.PI / 25) * flap);
  ctx.fillStyle = "#047857";
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(32, -12);
  ctx.lineTo(26, 12);
  ctx.fill();
  ctx.restore();

  // Body
  ctx.fillStyle = "#10B981";
  ctx.beginPath();
  ctx.ellipse(10, 8, 20, 12, -Math.PI / 12, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = "#F59E0B";
  ctx.beginPath();
  ctx.moveTo(-10, -4);
  ctx.quadraticCurveTo(-25, -2, -26, 6);
  ctx.quadraticCurveTo(-15, 6, -8, 4);
  ctx.fill();

  // Front Wing
  ctx.save();
  ctx.translate(4, 4);
  ctx.rotate((Math.PI / 4) * flap);
  ctx.fillStyle = "#34D399";
  ctx.beginPath();
  ctx.ellipse(14, 2, 22, 8, Math.PI / 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // The Eye
  const adjustedBullseye = bullseyeRadius / scale;

  ctx.shadowColor = t.sunGlow || "#F59E0B";
  ctx.shadowBlur = 15;
  ctx.fillStyle = "#EF4444";
  ctx.beginPath();
  ctx.arc(0, 0, adjustedBullseye, 0, Math.PI * 2);
  ctx.fill();

  // Intense Eye highlight
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(-2, -2, adjustedBullseye * 0.4, 0, Math.PI * 2);
  ctx.fill();

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

  ctx.fillStyle = "#DC2626";
  ctx.beginPath();
  ctx.arc(Px, Py - 40, 4, 0, Math.PI * 2);
  ctx.fill();

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
