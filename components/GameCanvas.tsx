import React, { useEffect, useRef } from "react";
import { useGameAudio } from "../hooks/useGameAudio";
import {
  GAME_CONFIG,
  computeLayout,
  getDifficultyLevel,
  getWindStrength,
  getBullseyeRadius,
  getTargetRadius,
  getTargetY,
  getTargetXOffset,
} from "../utils/gamePhysics";
import {
  drawBackground,
  drawTarget,
  drawArrow,
  drawArcher,
} from "./renderHelpers";

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
  const consecutiveMissesRef = useRef(0);

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

    const handleResize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      const l = computeLayout(w, h);
      canvas.width = w * l.dpr;
      canvas.height = h * l.dpr;
      layout.current = l;
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const { Px, Py, Tx, GRAVITY, POWER_MULTIPLIER } = GAME_CONFIG;

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

    const backgroundLayers = [
      {
        x: -600,
        y: 180,
        width: 500,
        height: 330,
        speed: 1.8,
        color1: t.mountains[1].c1,
        color2: t.mountains[1].c2,
        type: "mountain",
      },
      {
        x: 0,
        y: 160,
        width: 300,
        height: 350,
        speed: 1.5,
        color1: t.mountains[0].c1,
        color2: t.mountains[0].c2,
        type: "mountain",
      },
      {
        x: 350,
        y: 200,
        width: 400,
        height: 310,
        speed: 2.5,
        color1: t.mountains[1].c1,
        color2: t.mountains[1].c2,
        type: "mountain",
      },
      {
        x: 750,
        y: 280,
        width: 50,
        height: 180,
        speed: 4,
        color1: t.flag1,
        color2: t.flag2,
        type: "flag",
      },
      {
        x: 900,
        y: 220,
        width: 450,
        height: 290,
        speed: 2.2,
        color1: t.mountains[0].c1,
        color2: t.mountains[0].c2,
        type: "mountain",
      },
      {
        x: -50,
        y: 250,
        width: 350,
        height: 260,
        speed: 4,
        color1: t.mountains[2].c1,
        color2: t.mountains[2].c2,
        type: "mountain",
      },
      {
        x: 150,
        y: 300,
        width: 40,
        height: 160,
        speed: 5,
        color1: t.flag2,
        color2: t.flag1,
        type: "flag",
      },
    ];

    const getMousePos = (e: MouseEvent | TouchEvent) => {
      const clientX =
        e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
      const clientY =
        e instanceof TouchEvent ? e.touches[0].clientY : e.clientY;
      const { offsetX, offsetY, scale } = layout.current;

      return {
        x: (clientX - offsetX) / scale,
        y: (clientY - offsetY) / scale,
      };
    };

    const startDrag = (e: MouseEvent | TouchEvent) => {
      if (isArrowFlying) return;
      const { x, y } = getMousePos(e);

      isDragging = true;
      dragStartX = x;
      dragStartY = y;
      currentX = x;
      currentY = y;
      arrowTrail = [];
      minDistToBullseye = Infinity;

      const windMax = getWindStrength(
        getDifficultyLevel(scoreRef.current),
        scoreRef.current,
        streakRef.current,
      );
      currentWind = windMax > 0 ? (Math.random() - 0.5) * 2 * windMax : 0;

      cb.current.sfx.draw();
      cb.current.onStatusChange(
        streakRef.current >= 3
          ? "🔥 HOT STREAK! Double Points Active!"
          : "Aiming... focus your mind.",
      );
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

      const pullDx = currentX - dragStartX;
      const pullDy = currentY - dragStartY;
      const dragDist = Math.hypot(pullDx, pullDy);

      if (dragDist < 20) {
        cb.current.onStatusChange("Draw the string farther!");
        return;
      }

      arrowAngle = Math.atan2(-pullDy, -pullDx);
      const V0 = Math.min(dragDist, 250) * POWER_MULTIPLIER;
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

      let targetBowRaise = 0,
        targetBowAngle = Math.PI / 3.5,
        pullDist = 0,
        displayAngle = 0,
        dragDist = 0;

      if (isDragging) {
        const pullDx = currentX - dragStartX;
        const pullDy = currentY - dragStartY;
        dragDist = Math.hypot(pullDx, pullDy);

        if (dragDist > 5) {
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

      const { offsetX, offsetY, scale, dpr } = layout.current;

      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      // 1. Transform World to Logical Space
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // 2. Draw Transformed Background & Scene
      drawBackground(
        ctx,
        t,
        backgroundLayers,
        isArrowFlying,
        velocityX,
        dt,
        timeElapsed,
      );

      if (screenShakeMag > 0)
        screenShakeMag = Math.max(0, screenShakeMag - dt * 26);
      ctx.save();
      ctx.translate(
        (Math.random() - 0.5) * screenShakeMag,
        (Math.random() - 0.5) * screenShakeMag * 0.6,
      );

      if (targetShake > 0) targetShake = Math.max(0, targetShake - dt * 4);
      const shakeX = (Math.random() - 0.5) * targetShake * 15;

      const dynamicLevel = getDifficultyLevel(scoreRef.current);
      const currentTx =
        Tx + getTargetXOffset(scoreRef.current, streakRef.current, timeElapsed);
      const Ty = getTargetY(scoreRef.current, streakRef.current, timeElapsed);
      const targetRadius = getTargetRadius(dynamicLevel);
      const bullseyeRadius = getBullseyeRadius(dynamicLevel);

      ctx.save();
      ctx.translate(shakeX, 0);
      drawTarget(ctx, t, currentTx, Ty, Py + 35, targetRadius, bullseyeRadius);
      ctx.restore();

      // Aim Line & Pity Trajectory Arc
      if (isDragging) {
        if (consecutiveMissesRef.current < 3) {
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
        } else {
          ctx.beginPath();
          let simX = handX,
            simY = handY;
          let simVx =
            Math.min(dragDist, 250) * POWER_MULTIPLIER * Math.cos(displayAngle);
          let simVy =
            Math.min(dragDist, 250) * POWER_MULTIPLIER * Math.sin(displayAngle);

          for (let step = 0; step < 25; step++) {
            simX += simVx * 0.02;
            simY += simVy * 0.02;
            simVy += GRAVITY * 0.02;
            if (step === 0) ctx.moveTo(simX, simY);
            else ctx.lineTo(simX, simY);
          }
          ctx.strokeStyle = "#F59E0B";
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        if (Math.abs(currentWind) > 1.5) {
          ctx.save();
          ctx.font = "bold 13px sans-serif";
          ctx.fillStyle = t.windIndicator;
          ctx.textAlign = "center";
          ctx.fillText(
            `WIND ${currentWind > 0 ? "→ → →" : "← ← ←"}`,
            GAME_CONFIG.WIDTH / 2,
            40,
          );
          ctx.restore();
        }
      }

      drawArcher(
        ctx,
        t,
        timeElapsed,
        backHandX,
        backHandY,
        backElbowX,
        backElbowY,
        handX,
        handY,
        elbowX,
        elbowY,
      );

      // Bow & String
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

      const isHotStreak = streakRef.current >= 3;

      if (isArrowFlying) {
        arrowTrail.push({ x: arrowX, y: arrowY, alpha: 1.0 });
        if (arrowTrail.length > 20) arrowTrail.shift();
        arrowX += velocityX * dt;
        arrowY += velocityY * dt;
        velocityX += currentWind * dt;
        velocityY += GRAVITY * dt;
        arrowAngle = Math.atan2(velocityY, velocityX);
        const dist = Math.hypot(arrowX - currentTx, arrowY - Ty);
        if (arrowX > Px + 100)
          minDistToBullseye = Math.min(minDistToBullseye, dist);

        if (
          dist <= targetRadius &&
          arrowX >= currentTx - 15 &&
          arrowX <= currentTx + 15
        ) {
          isArrowFlying = false;
          stuckOffset = { x: arrowX - currentTx, y: arrowY - Ty };
          targetShake = 1.0;
          streakRef.current += 1;
          consecutiveMissesRef.current = 0;

          const streakBonus = 1 + Math.min(streakRef.current - 1, 10) * 0.15;
          const isBullseye = dist <= bullseyeRadius;
          const gained = Math.round((isBullseye ? 100 : 25) * streakBonus);
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

          if (streakRef.current > 1) {
            spawnFloatingText(
              arrowX,
              arrowY - 55,
              `Streak x${streakRef.current}!`,
              t.sunGlow,
            );
          }
        } else if (
          arrowY > GAME_CONFIG.HEIGHT ||
          arrowX > GAME_CONFIG.WIDTH ||
          arrowY < -200
        ) {
          isArrowFlying = false;
          consecutiveMissesRef.current += 1;
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
        drawArrow(ctx, t, isHotStreak);
      } else if (isDragging) {
        ctx.translate(
          backHandX + Math.cos(currentBowAngle) * 40,
          backHandY + Math.sin(currentBowAngle) * 40,
        );
        ctx.rotate(currentBowAngle);
        drawArrow(ctx, t, isHotStreak);
      }
      ctx.restore();

      if (!isArrowFlying && stuckOffset.x !== 0) {
        ctx.save();
        ctx.translate(currentTx + stuckOffset.x + shakeX, Ty + stuckOffset.y);
        ctx.rotate(arrowAngle);
        drawArrow(ctx, t, isHotStreak);
        ctx.restore();
      }

      particles.forEach((p, index) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += GRAVITY * 0.4 * dt;
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

      ctx.restore(); // Restore shake
      ctx.restore(); // Restore scale/offset layout

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("mousedown", startDrag);
      canvas.removeEventListener("mousemove", moveDrag);
      window.removeEventListener("mouseup", endDrag);
      canvas.removeEventListener("touchstart", startDrag);
      canvas.removeEventListener("touchmove", moveDrag);
      window.removeEventListener("touchend", endDrag);
    };
  }, [t]);

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
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
