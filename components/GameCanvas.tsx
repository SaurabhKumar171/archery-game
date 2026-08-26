import React, { useEffect, useRef } from "react";
import { useGameAudio } from "../hooks/useGameAudio";

interface GameCanvasProps {
  theme: any;
  isMuted: boolean;
  initialScore: number;
  initialAttempts: number;
  initialStreak: number;
  onStatusChange: (status: string) => void;
  onAttempt: (attempts: number) => void;
  onHit: (newScore: number, newStreak: number, isBullseye: boolean) => void;
  onMiss: (wasClose: boolean) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  theme: t,
  isMuted,
  initialScore,
  initialAttempts,
  initialStreak,
  onStatusChange,
  onAttempt,
  onHit,
  onMiss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { sfx, vibrate } = useGameAudio(isMuted);

  const scoreRef = useRef(initialScore);
  const attemptsRef = useRef(initialAttempts);
  const streakRef = useRef(initialStreak);

  // Layout engine now uses a wider 1000x600 logical canvas
  const layout = useRef({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    dpr: 1,
    w: 1000,
    h: 600,
  });

  const cb = useRef({ onStatusChange, onAttempt, onHit, onMiss, sfx, vibrate });
  useEffect(() => {
    cb.current = { onStatusChange, onAttempt, onHit, onMiss, sfx, vibrate };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- Responsive Fullscreen Handler ---
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      // Scale to fit the wider 1000x600 arena perfectly
      const scale = Math.min(w / 1000, h / 600);
      const offsetX = (w - 1000 * scale) / 2;
      const offsetY = (h - 600 * scale) / 2;

      layout.current = { offsetX, offsetY, scale, dpr, w, h };
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Logical Game Coordinates (Wider battlefield)
    const WIDTH = 1000,
      HEIGHT = 600;
    const Px = 100,
      Py = 470,
      Tx = 900,
      BASE_TY = 300; // Px moved left, Tx moved right!
    const targetRadius = 60,
      BASE_BULLSEYE_RADIUS = 12;
    const gravity = 1200,
      powerMultiplier = 7;

    let currentHandX = Px,
      currentHandY = Py;
    let bowRaiseAmt = 0;
    let currentBowAngle = Math.PI / 3.5;
    let lastAimAngle = 0;

    let backHandX = Px - 25,
      backHandY = Py + 15;
    let backElbowX = Px + 5,
      backElbowY = Py - 15;

    let isDragging = false,
      dragStartX = Px,
      dragStartY = Py,
      currentX = Px,
      currentY = Py;

    let isArrowFlying = false,
      arrowX = Px,
      arrowY = Py,
      velocityX = 0,
      velocityY = 0,
      arrowAngle = 0;
    let stuckOffset = { x: 0, y: 0 };

    let arrowTrail: { x: number; y: number; alpha: number }[] = [];
    let particles: any[] = [];
    let floatingTexts: {
      x: number;
      y: number;
      text: string;
      life: number;
      color: string;
    }[] = [];

    let targetShake = 0,
      timeElapsed = 0,
      screenShakeMag = 0,
      currentWind = 0;
    let minDistToBullseye = Infinity;

    const getDifficultyLevel = () => scoreRef.current / 100;
    const getTargetAmplitude = (level: number) =>
      Math.min(150, 20 + 22 * Math.log(1 + level));
    const getTargetSpeed = (level: number) => 0.35 + 0.06 * Math.sqrt(level);
    const getWindStrength = (level: number) => 4.5 * Math.sqrt(level);
    const getBullseyeRadius = (level: number) =>
      Math.max(6, BASE_BULLSEYE_RADIUS - level * 0.15);
    const getTargetY = () =>
      BASE_TY +
      Math.sin(timeElapsed * getTargetSpeed(getDifficultyLevel())) *
        getTargetAmplitude(getDifficultyLevel());

    const backgroundLayers = [
      {
        x: -600,
        y: 220,
        width: 500,
        height: 380,
        speed: 1.8,
        color1: t.mountains[1].c1,
        color2: t.mountains[1].c2,
        type: "mountain",
      },
      {
        x: 0,
        y: 200,
        width: 300,
        height: 400,
        speed: 1.5,
        color1: t.mountains[0].c1,
        color2: t.mountains[0].c2,
        type: "mountain",
      },
      {
        x: 350,
        y: 250,
        width: 400,
        height: 350,
        speed: 2.5,
        color1: t.mountains[1].c1,
        color2: t.mountains[1].c2,
        type: "mountain",
      },
      {
        x: 750,
        y: 320,
        width: 50,
        height: 180,
        speed: 4,
        color1: t.flag1,
        color2: t.flag2,
        type: "flag",
      },
      {
        x: 900,
        y: 260,
        width: 450,
        height: 340,
        speed: 2.2,
        color1: t.mountains[0].c1,
        color2: t.mountains[0].c2,
        type: "mountain",
      },
      {
        x: -50,
        y: 300,
        width: 350,
        height: 300,
        speed: 4,
        color1: t.mountains[2].c1,
        color2: t.mountains[2].c2,
        type: "mountain",
      },
      {
        x: 150,
        y: 340,
        width: 40,
        height: 160,
        speed: 5,
        color1: t.flag2,
        color2: t.flag1,
        type: "flag",
      },
    ];

    const getMousePos = (e: MouseEvent | TouchEvent) => {
      let clientX = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
      let clientY = e instanceof TouchEvent ? e.touches[0].clientY : e.clientY;
      const { offsetX, offsetY, scale } = layout.current;

      return {
        x: (clientX - offsetX) / scale,
        y: (clientY - offsetY) / scale,
      };
    };

    const startDrag = (e: MouseEvent | TouchEvent) => {
      if (isArrowFlying) return;
      const { x, y } = getMousePos(e);

      const distToPlayer = Math.hypot(x - currentHandX, y - currentHandY);
      const distToCenter = Math.hypot(x - WIDTH / 2, y - HEIGHT / 2);

      // Allow dragging from either near the player OR the center of the screen
      if (distToPlayer < 150 || distToCenter < 300) {
        isDragging = true;
        dragStartX = x;
        dragStartY = y;
        currentX = x;
        currentY = y;
        arrowTrail = [];
        minDistToBullseye = Infinity;
        currentWind =
          (Math.random() - 0.5) * 2 * getWindStrength(getDifficultyLevel());
        cb.current.sfx.draw();
        cb.current.onStatusChange("Aiming... focus your mind.");
      }
    };

    const moveDrag = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      const { x, y } = getMousePos(e);
      currentX = x;
      currentY = y;
    };

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;

      // Calculate pull using relative displacement (Angry Birds style)
      const pullDx = currentX - dragStartX,
        pullDy = currentY - dragStartY;
      const dragDist = Math.hypot(pullDx, pullDy);

      if (dragDist < 20) {
        cb.current.onStatusChange("Draw the string farther!");
        return;
      }

      arrowAngle = Math.atan2(-pullDy, -pullDx);
      const V0 = Math.min(dragDist, 250) * powerMultiplier;
      velocityX = V0 * Math.cos(arrowAngle);
      velocityY = V0 * Math.sin(arrowAngle);

      arrowX = currentHandX;
      arrowY = currentHandY;
      isArrowFlying = true;

      attemptsRef.current += 1;
      cb.current.onAttempt(attemptsRef.current);
      cb.current.onStatusChange("Arrow released!");
      cb.current.sfx.release();
    };

    canvas.addEventListener("mousedown", startDrag);
    canvas.addEventListener("mousemove", moveDrag);
    window.addEventListener("mouseup", endDrag);
    canvas.addEventListener("touchstart", startDrag, { passive: false });
    canvas.addEventListener("touchmove", moveDrag, { passive: false });
    window.addEventListener("touchend", endDrag);

    let lastTime = performance.now();
    let animationId: number;

    const spawnParticles = (
      x: number,
      y: number,
      color: string,
      burst = 30,
    ) => {
      for (let i = 0; i < burst; i++)
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 600,
          vy: (Math.random() - 0.5) * 600 - 150,
          life: 1.0,
          size: Math.random() * 4 + 2,
          color,
        });
    };

    const spawnFloatingText = (
      x: number,
      y: number,
      text: string,
      color: string,
    ) => {
      floatingTexts.push({ x, y, text, life: 1.4, color });
    };

    const loop = (time: number) => {
      let dt = (time - lastTime) / 1000;
      lastTime = time;
      if (dt > 0.1) dt = 0.016;
      timeElapsed += dt;

      // 1. KINEMATICS
      let targetBowRaise = 0,
        targetBowAngle = Math.PI / 3.5,
        pullDist = 0,
        displayAngle = 0,
        dragDist = 0;

      if (isDragging) {
        // Calculate physics dynamically relative to initial touch point
        const pullDx = currentX - dragStartX;
        const pullDy = currentY - dragStartY;
        dragDist = Math.hypot(pullDx, pullDy);

        if (dragDist > 5) {
          // Prevent angle snapping on initial subtle touch
          displayAngle = Math.atan2(-pullDy, -pullDx);
          lastAimAngle = displayAngle;
        } else {
          displayAngle = lastAimAngle || currentBowAngle;
        }

        targetBowRaise = 1.0;
        targetBowAngle = displayAngle;
        pullDist = Math.min(dragDist, 100);
      } else if (isArrowFlying) {
        targetBowRaise = 0.7;
        targetBowAngle = lastAimAngle;
      }

      bowRaiseAmt += (targetBowRaise - bowRaiseAmt) * dt * 10;
      currentBowAngle += (targetBowAngle - currentBowAngle) * dt * 12;

      const handX = Px - 15 + 45 * bowRaiseAmt;
      const handY = Py + 40 - 40 * bowRaiseAmt;
      const elbowX = Px - 20 + 15 * bowRaiseAmt;
      const elbowY = Py + 5 - 15 * bowRaiseAmt;
      currentHandX = handX;
      currentHandY = handY;

      let targetBackHandX = Px - 25,
        targetBackHandY = Py + 15;
      let targetBackElbowX = Px + 5,
        targetBackElbowY = Py - 15;

      if (isDragging) {
        targetBackHandX = handX - Math.cos(currentBowAngle) * (pullDist * 0.9);
        targetBackHandY = handY - Math.sin(currentBowAngle) * (pullDist * 0.9);
        targetBackElbowX = Px - 30;
        targetBackElbowY = Py - 35;
      } else if (isArrowFlying && bowRaiseAmt > 0.5) {
        targetBackHandX = handX - Math.cos(currentBowAngle) * 20;
        targetBackHandY = handY - Math.sin(currentBowAngle) * 20;
        targetBackElbowX = Px - 10;
        targetBackElbowY = Py - 25;
      }

      backHandX += (targetBackHandX - backHandX) * dt * 15;
      backHandY += (targetBackHandY - backHandY) * dt * 15;
      backElbowX += (targetBackElbowX - backElbowX) * dt * 15;
      backElbowY += (targetBackElbowY - backElbowY) * dt * 15;

      // 2. RENDERING (Responsive Layering)
      const { offsetX, offsetY, scale, dpr, w, h } = layout.current;

      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, t.sky[0]);
      bgGrad.addColorStop(0.5, t.sky[1]);
      bgGrad.addColorStop(1, t.sky[2]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      if (screenShakeMag > 0)
        screenShakeMag = Math.max(0, screenShakeMag - dt * 26);
      ctx.save();
      ctx.translate(
        (Math.random() - 0.5) * screenShakeMag,
        (Math.random() - 0.5) * screenShakeMag * 0.6,
      );

      ctx.save();
      ctx.shadowColor = t.sunGlow;
      ctx.shadowBlur = 120;
      ctx.fillStyle = t.sun;
      ctx.beginPath();
      ctx.arc(WIDTH / 2 + 150, 200, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

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
          ctx.lineTo(
            layer.x + layer.width + 500,
            layer.y + layer.height + 1000,
          );
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

      const groundGrad = ctx.createLinearGradient(
        0,
        HEIGHT - 100,
        0,
        HEIGHT + 200,
      );
      groundGrad.addColorStop(0, t.ground[0]);
      groundGrad.addColorStop(1, t.ground[1]);
      ctx.fillStyle = groundGrad;
      ctx.fillRect(-2000, HEIGHT - 100, 4800, 3000);

      if (targetShake > 0) targetShake = Math.max(0, targetShake - dt * 4);
      const shakeX = (Math.random() - 0.5) * targetShake * 15;
      const Ty = getTargetY();
      const bullseyeRadius = getBullseyeRadius(getDifficultyLevel());

      ctx.save();
      ctx.translate(shakeX, 0);
      ctx.fillStyle = t.targetStand[0];
      ctx.fillRect(Tx - 15, Ty, 20, HEIGHT - Ty);
      ctx.fillStyle = t.targetStand[1];
      ctx.fillRect(Tx - 20, Ty, 15, HEIGHT - Ty);
      const drawRing = (r: number, c1: string, c2: string) => {
        const grad = ctx.createRadialGradient(
          Tx - r / 3,
          Ty - r / 3,
          r / 4,
          Tx,
          Ty,
          r,
        );
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(Tx, Ty, r, 0, Math.PI * 2);
        ctx.fill();
      };
      drawRing(targetRadius, t.targetRings.outer, t.targetStand[1]);
      drawRing(45, t.targetRings.mid, t.targetRings.mid);
      drawRing(30, t.targetRings.inner, t.targetStand[1]);
      drawRing(bullseyeRadius, t.targetRings.bullseye, t.sunGlow);
      ctx.restore();

      if (isDragging) {
        ctx.beginPath();
        ctx.moveTo(handX, handY);
        ctx.lineTo(
          handX + Math.cos(displayAngle) * 1000,
          handY + Math.sin(displayAngle) * 1000,
        );
        ctx.strokeStyle = t.aimLine;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (Math.abs(currentWind) > 2) {
          ctx.save();
          ctx.font = "bold 13px sans-serif";
          ctx.fillStyle = t.windIndicator;
          ctx.textAlign = "center";
          ctx.fillText(
            `WIND ${currentWind > 0 ? "→ → →" : "← ← ←"}`,
            WIDTH / 2,
            40,
          );
          ctx.restore();
        }
      }

      ctx.save();
      const skinColor = "#937F77",
        silverArmor = "#E2E8F0",
        dhotiColor = t.sun === "#FFFFFF" ? "#F3F4F6" : "#9CA3AF",
        clothColor = "#DC2626";

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

      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(currentBowAngle);
      ctx.beginPath();
      ctx.moveTo(Math.cos(-Math.PI / 2.2) * 55, Math.sin(-Math.PI / 2.2) * 55);
      ctx.quadraticCurveTo(20, -30, 0, 0);
      ctx.quadraticCurveTo(
        20,
        30,
        Math.cos(Math.PI / 2.2) * 55,
        Math.sin(Math.PI / 2.2) * 55,
      );
      const bowGrad = ctx.createLinearGradient(-30, -50, 30, 50);
      bowGrad.addColorStop(0, t.bowGrad[0]);
      bowGrad.addColorStop(0.5, t.bowGrad[1]);
      bowGrad.addColorStop(1, t.bowGrad[0]);
      ctx.strokeStyle = bowGrad;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.shadowColor = t.bowGlow;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(Math.cos(-Math.PI / 2.2) * 55, Math.sin(-Math.PI / 2.2) * 55);

      if (isDragging || (isArrowFlying && bowRaiseAmt > 0.5)) {
        let dx = backHandX - handX,
          dy = backHandY - handY;
        let localX =
          dx * Math.cos(-currentBowAngle) - dy * Math.sin(-currentBowAngle);
        let localY =
          dx * Math.sin(-currentBowAngle) + dy * Math.cos(-currentBowAngle);
        ctx.lineTo(localX, localY);
      } else {
        ctx.lineTo(
          Math.sin(timeElapsed * 60) * 4 * Math.max(0, bowRaiseAmt),
          0,
        );
      }
      ctx.lineTo(Math.cos(Math.PI / 2.2) * 55, Math.sin(Math.PI / 2.2) * 55);
      ctx.strokeStyle = t.bowString;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      const drawArrow = () => {
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(20, 0);
        ctx.strokeStyle = t.targetStand[0];
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(5, -7);
        ctx.lineTo(5, 7);
        ctx.fillStyle = t.sunGlow;
        ctx.fill();
      };

      if (isArrowFlying) {
        arrowTrail.push({ x: arrowX, y: arrowY, alpha: 1.0 });
        if (arrowTrail.length > 20) arrowTrail.shift();
        arrowX += velocityX * dt;
        arrowY += velocityY * dt;
        velocityX += currentWind * dt;
        velocityY += gravity * dt;
        arrowAngle = Math.atan2(velocityY, velocityX);
        const dist = Math.hypot(arrowX - Tx, arrowY - Ty);
        if (arrowX > Px + 100)
          minDistToBullseye = Math.min(minDistToBullseye, dist);

        if (dist <= targetRadius && arrowX >= Tx - 15 && arrowX <= Tx + 15) {
          isArrowFlying = false;
          stuckOffset = { x: arrowX - Tx, y: arrowY - Ty };
          targetShake = 1.0;
          streakRef.current += 1;
          const streakBonus = 1 + Math.min(streakRef.current - 1, 10) * 0.1;
          const isBullseye = dist <= bullseyeRadius;
          const gained = Math.round((isBullseye ? 100 : 20) * streakBonus);
          scoreRef.current += gained;
          cb.current.onHit(scoreRef.current, streakRef.current, isBullseye);
          spawnParticles(
            arrowX,
            arrowY,
            isBullseye ? t.particles.win : t.particles.hit,
            isBullseye ? 60 : 30,
          );
          spawnFloatingText(
            arrowX,
            arrowY - 30,
            `+${gained}`,
            isBullseye ? t.particles.win : t.particles.hit,
          );
          screenShakeMag = isBullseye ? 16 : 8;
          isBullseye ? cb.current.sfx.bullseye() : cb.current.sfx.hit();
          cb.current.vibrate(isBullseye ? [30, 30, 60] : 40);
          if (streakRef.current > 1)
            spawnFloatingText(
              arrowX,
              arrowY - 55,
              `Streak x${streakRef.current}!`,
              t.sunGlow,
            );
          if (!isBullseye && dist <= bullseyeRadius * 2.4)
            spawnFloatingText(arrowX, arrowY - 50, "So close!", t.sunGlow);
        } else if (arrowY > HEIGHT || arrowX > WIDTH || arrowY < -200) {
          isArrowFlying = false;
          const wasClose = minDistToBullseye < 100;
          cb.current.onMiss(wasClose);
          wasClose ? cb.current.sfx.close() : cb.current.sfx.miss();
          if (streakRef.current > 0) {
            spawnFloatingText(Px, Py - 90, "Streak broken", "#F87171");
            cb.current.sfx.streakBreak();
            cb.current.vibrate(80);
          } else cb.current.vibrate(50);
          streakRef.current = 0;
        }
      }

      ctx.save();
      if (isArrowFlying) {
        ctx.translate(arrowX, arrowY);
        ctx.rotate(arrowAngle);
        drawArrow();
      } else if (isDragging) {
        ctx.translate(
          backHandX + Math.cos(currentBowAngle) * 40,
          backHandY + Math.sin(currentBowAngle) * 40,
        );
        ctx.rotate(currentBowAngle);
        drawArrow();
      }
      ctx.restore();

      if (!isArrowFlying && stuckOffset.x !== 0) {
        ctx.save();
        ctx.translate(Tx + stuckOffset.x + shakeX, Ty + stuckOffset.y);
        ctx.rotate(arrowAngle);
        drawArrow();
        ctx.restore();
      }

      particles.forEach((p, index) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += gravity * 0.4 * dt;
        p.life -= dt * 1.5;
        if (p.life <= 0) particles.splice(index, 1);
        else {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      });
      floatingTexts.forEach((ft, index) => {
        ft.y -= 40 * dt;
        ft.life -= dt * 0.9;
        if (ft.life <= 0) floatingTexts.splice(index, 1);
        else {
          ctx.save();
          ctx.globalAlpha = Math.min(1, ft.life);
          ctx.font = "bold 20px sans-serif";
          ctx.fillStyle = ft.color;
          ctx.textAlign = "center";
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }
      });

      ctx.restore();
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("mousedown", startDrag);
      canvas.removeEventListener("mousemove", moveDrag);
      window.addEventListener("mouseup", endDrag);
      canvas.removeEventListener("touchstart", startDrag);
      canvas.removeEventListener("touchmove", moveDrag);
      window.addEventListener("touchend", endDrag);
    };
  }, [t]);

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none cursor-crosshair"
        style={{ touchAction: "none" }}
      />
      <div className="pointer-events-none absolute bottom-12 w-full flex justify-center">
        <span className="rounded-full bg-black/60 px-6 py-2.5 text-xs sm:text-sm font-bold tracking-widest uppercase text-white/90 backdrop-blur-md shadow-2xl">
          Pull back to draw
        </span>
      </div>
    </div>
  );
};
