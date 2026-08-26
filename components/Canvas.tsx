"use client";

import React, { useEffect, useRef, useState } from "react";
import { themes } from "@/constants/themes";

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState("Draw the divine string...");
  const [isDarkMode, setIsDarkMode] = useState(false); // Theme State
  const [isMuted, setIsMuted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [dailyBest, setDailyBest] = useState(0);
  const [dayStreak, setDayStreak] = useState(0);

  // Use refs for state inside the animation loop to avoid dependency cycles
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const streakRef = useRef(0);
  const bestScoreRef = useRef(0);
  const bestStreakRef = useRef(0);
  const dailyBestRef = useRef(0);
  const dayStreakRef = useRef(0);
  const isMutedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // =========================
  // Sound engine (synthesized, no external assets)
  // =========================
  const getAudioCtx = () => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  };

  const playTone = (
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    volume = 0.2,
    sweepTo?: number,
    delay = 0,
  ) => {
    if (isMutedRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const startAt = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    if (sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(sweepTo, 1),
        startAt + duration,
      );
    }
    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  };

  const sfx = {
    draw: () => playTone(180, 0.08, "triangle", 0.04),
    release: () => playTone(220, 0.16, "sawtooth", 0.14, 700),
    hit: () => playTone(150, 0.12, "square", 0.18, 60),
    bullseye: () => {
      playTone(523, 0.12, "sine", 0.22, 1046);
      playTone(659, 0.16, "sine", 0.18, 0, 0.07);
      playTone(784, 0.2, "sine", 0.14, 0, 0.14);
    },
    miss: () => playTone(90, 0.28, "sawtooth", 0.1, 40),
    streakBreak: () => playTone(180, 0.22, "sawtooth", 0.12, 70),
    close: () => playTone(300, 0.14, "sine", 0.1, 200),
  };

  const vibrate = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore
    }
  };

  // Load persisted high scores, daily challenge state, and the in-progress
  // session once on mount so a refresh no longer wipes out the run.
  useEffect(() => {
    try {
      const savedBest = parseInt(
        localStorage.getItem("kurukshetra_best_score") || "0",
        10,
      );
      const savedStreak = parseInt(
        localStorage.getItem("kurukshetra_best_streak") || "0",
        10,
      );
      if (!Number.isNaN(savedBest)) {
        bestScoreRef.current = savedBest;
        setBestScore(savedBest);
      }
      if (!Number.isNaN(savedStreak)) {
        bestStreakRef.current = savedStreak;
        setBestStreak(savedStreak);
      }

      // --- Daily challenge / day-streak bookkeeping ---
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastPlayed = localStorage.getItem("kurukshetra_last_played");
      const storedDailyDate = localStorage.getItem("kurukshetra_daily_date");
      let storedDailyBest = parseInt(
        localStorage.getItem("kurukshetra_daily_best") || "0",
        10,
      );
      let storedDayStreak = parseInt(
        localStorage.getItem("kurukshetra_day_streak") || "0",
        10,
      );
      if (Number.isNaN(storedDailyBest)) storedDailyBest = 0;
      if (Number.isNaN(storedDayStreak)) storedDayStreak = 0;

      if (storedDailyDate === todayStr) {
        dailyBestRef.current = storedDailyBest;
      } else {
        // A new day - the daily target resets, but the day-streak may grow.
        dailyBestRef.current = 0;
        localStorage.setItem("kurukshetra_daily_date", todayStr);
        localStorage.setItem("kurukshetra_daily_best", "0");

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);

        if (lastPlayed === yStr) {
          storedDayStreak += 1; // played yesterday, streak continues
        } else if (lastPlayed !== todayStr) {
          storedDayStreak = 1; // streak broken, start fresh today
        }
      }
      dayStreakRef.current = storedDayStreak;
      setDailyBest(dailyBestRef.current);
      setDayStreak(storedDayStreak);
      localStorage.setItem("kurukshetra_day_streak", String(storedDayStreak));
      localStorage.setItem("kurukshetra_last_played", todayStr);

      // --- Resume in-progress session (fixes "refresh wipes your run") ---
      const savedSession = localStorage.getItem("kurukshetra_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && typeof parsed.score === "number") {
          scoreRef.current = parsed.score || 0;
          attemptsRef.current = parsed.attempts || 0;
          streakRef.current = parsed.streak || 0;
          setScore(scoreRef.current);
          setAttempts(attemptsRef.current);
          setStreak(streakRef.current);
        }
      }
    } catch {
      // localStorage unavailable (e.g. private browsing) - fail silently, game still works
    }
  }, []);

  const persistSession = () => {
    try {
      localStorage.setItem(
        "kurukshetra_session",
        JSON.stringify({
          score: scoreRef.current,
          attempts: attemptsRef.current,
          streak: streakRef.current,
        }),
      );
    } catch {
      // ignore
    }
  };

  const startNewSession = () => {
    scoreRef.current = 0;
    attemptsRef.current = 0;
    streakRef.current = 0;
    setScore(0);
    setAttempts(0);
    setStreak(0);
    setStatus("Draw the divine string...");
    try {
      localStorage.removeItem("kurukshetra_session");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load active theme
    const t = isDarkMode ? themes.dark : themes.light;

    // =========================
    // 1. High-DPI Display Fix
    // =========================
    const WIDTH = 800;
    const HEIGHT = 600;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    // =========================
    // Game Setup & Constants
    // =========================
    const Px = 120,
      Py = 470,
      Tx = 680,
      BASE_TY = 300;
    const targetRadius = 60;
    const BASE_BULLSEYE_RADIUS = 12;
    const gravity = 1200,
      powerMultiplier = 7;

    let isDragging = false,
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
      timeElapsed = 0;

    // Whole-screen shake magnitude, punchier than the old target-only shake
    let screenShakeMag = 0;

    // Current wind for the in-flight arrow, rolled fresh on every draw
    let currentWind = 0;

    // Tracks how close the current arrow got to the bullseye, so a wide
    // miss can still say "so close!" instead of feeling identical to
    // an airball.
    let minDistToBullseye = Infinity;

    // =========================
    // Progressive difficulty (dino-game style: never announced, just
    // quietly ramps - and now genuinely never stops ramping. Growth uses
    // sqrt/log curves so it stays fair early on but never plateaus into a
    // repeatable loop the way a hard cap does.)
    // =========================
    const getDifficultyLevel = () => scoreRef.current / 100; // roughly one "level" per bullseye
    const getTargetAmplitude = (level: number) =>
      Math.min(150, 20 + 22 * Math.log(1 + level)); // eases toward a wide but bounded drift, so the target never leaves the frame
    const getTargetSpeed = (level: number) => 0.35 + 0.06 * Math.sqrt(level); // unbounded, slows its own growth
    const getWindStrength = (level: number) => 4.5 * Math.sqrt(level); // unbounded, slows its own growth
    const getBullseyeRadius = (level: number) =>
      Math.max(6, BASE_BULLSEYE_RADIUS - level * 0.15); // the ring itself tightens over time

    const getTargetY = () => {
      const level = getDifficultyLevel();
      const amplitude = getTargetAmplitude(level);
      const speed = getTargetSpeed(level);
      return BASE_TY + Math.sin(timeElapsed * speed) * amplitude;
    };
    const rollWind = () => {
      const level = getDifficultyLevel();
      const windStrength = getWindStrength(level);
      currentWind = (Math.random() - 0.5) * 2 * windStrength;
    };

    const backgroundLayers = [
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
        x: 600,
        y: 320,
        width: 50,
        height: 180,
        speed: 4,
        color1: t.flag1,
        color2: t.flag2,
        type: "flag",
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

    const persistBest = () => {
      try {
        localStorage.setItem(
          "kurukshetra_best_score",
          String(bestScoreRef.current),
        );
        localStorage.setItem(
          "kurukshetra_best_streak",
          String(bestStreakRef.current),
        );
        localStorage.setItem(
          "kurukshetra_daily_best",
          String(dailyBestRef.current),
        );
      } catch {
        // ignore write failures (private browsing / storage disabled)
      }
    };

    // =========================
    // Event Handlers
    // =========================
    const getMousePos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      let clientX, clientY;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const startDrag = (e: MouseEvent | TouchEvent) => {
      if (isArrowFlying) return;
      const { x, y } = getMousePos(e);
      if (Math.hypot(x - Px, y - Py) < 120) {
        isDragging = true;
        currentX = x;
        currentY = y;
        arrowTrail = [];
        minDistToBullseye = Infinity;
        rollWind();
        sfx.draw();
        setStatus("Aiming... focus your mind.");
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
      const pullDx = currentX - Px,
        pullDy = currentY - Py;
      const dragDist = Math.hypot(pullDx, pullDy);

      if (dragDist < 20) {
        setStatus("Draw the string farther!");
        return;
      }

      arrowAngle = Math.atan2(-pullDy, -pullDx);
      const clampedDist = Math.min(dragDist, 250);
      const V0 = clampedDist * powerMultiplier;

      velocityX = V0 * Math.cos(arrowAngle);
      velocityY = V0 * Math.sin(arrowAngle);
      arrowX = Px;
      arrowY = Py;
      isArrowFlying = true;

      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      setStatus("Arrow released!");
      sfx.release();
    };

    canvas.addEventListener("mousedown", startDrag);
    canvas.addEventListener("mousemove", moveDrag);
    window.addEventListener("mouseup", endDrag);
    canvas.addEventListener("touchstart", startDrag, { passive: false });
    canvas.addEventListener("touchmove", moveDrag, { passive: false });
    window.addEventListener("touchend", endDrag);

    // =========================
    // Game Loop
    // =========================
    let lastTime = performance.now();
    let animationId: number;

    const spawnParticles = (
      x: number,
      y: number,
      color: string,
      burst: number = 30,
    ) => {
      for (let i = 0; i < burst; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 600,
          vy: (Math.random() - 0.5) * 600 - 150,
          life: 1.0,
          size: Math.random() * 4 + 2,
          color,
        });
      }
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

      const level = getDifficultyLevel();
      const Ty = getTargetY();
      const bullseyeRadius = getBullseyeRadius(level);

      // Whole-canvas shake offset (juice on top of the existing target shake)
      if (screenShakeMag > 0) {
        screenShakeMag -= dt * 26;
        if (screenShakeMag < 0) screenShakeMag = 0;
      }
      const screenShakeX = (Math.random() - 0.5) * screenShakeMag;
      const screenShakeY = (Math.random() - 0.5) * screenShakeMag * 0.6;

      ctx.save();
      ctx.translate(screenShakeX, screenShakeY);

      ctx.clearRect(-20, -20, WIDTH + 40, HEIGHT + 40);

      // Background Sky
      const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      bgGrad.addColorStop(0, t.sky[0]);
      bgGrad.addColorStop(0.5, t.sky[1]);
      bgGrad.addColorStop(1, t.sky[2]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Sun/Moon
      ctx.save();
      ctx.shadowColor = t.sunGlow;
      ctx.shadowBlur = 120;
      ctx.fillStyle = t.sun;
      ctx.beginPath();
      ctx.arc(WIDTH / 2 + 150, 200, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Parallax
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
          ctx.moveTo(layer.x, layer.y + layer.height);
          ctx.lineTo(layer.x + layer.width / 2, layer.y);
          ctx.lineTo(layer.x + layer.width, layer.y + layer.height);
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

      // Ground
      const groundGrad = ctx.createLinearGradient(0, HEIGHT - 100, 0, HEIGHT);
      groundGrad.addColorStop(0, t.ground[0]);
      groundGrad.addColorStop(1, t.ground[1]);
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, HEIGHT - 100, WIDTH, 100);

      if (targetShake > 0) {
        targetShake -= dt * 4;
        if (targetShake < 0) targetShake = 0;
      }
      const shakeX = (Math.random() - 0.5) * targetShake * 15;

      // Target (drifting vertically, and shrinking its bullseye, as difficulty ramps up)
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

      // Warrior Base
      ctx.fillStyle = t.warrior;
      ctx.fillRect(Px - 15, Py - 60, 30, 50);
      ctx.beginPath();
      ctx.arc(Px, Py - 72, 14, 0, Math.PI * 2);
      ctx.fill();

      // Aiming
      let displayAngle = 0,
        dragDist = 0;
      if (isDragging) {
        dragDist = Math.hypot(currentX - Px, currentY - Py);
        displayAngle = Math.atan2(-(currentY - Py), -(currentX - Px));
        ctx.beginPath();
        ctx.moveTo(Px, Py);
        ctx.lineTo(
          Px + Math.cos(displayAngle) * 800,
          Py + Math.sin(displayAngle) * 800,
        );
        ctx.strokeStyle = t.aimLine;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 12]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Wind indicator while aiming - keeps the added difficulty feeling fair, not random
        if (Math.abs(currentWind) > 2) {
          const windDir = currentWind > 0 ? 1 : -1;
          const wx = WIDTH / 2;
          const wy = 40;
          ctx.save();
          ctx.font = "bold 13px sans-serif";
          ctx.fillStyle = t.windIndicator;
          ctx.textAlign = "center";
          const arrows = windDir > 0 ? "→ → →" : "← ← ←";
          ctx.fillText(`WIND ${arrows}`, wx, wy);
          ctx.restore();
        }
      }

      // Bow
      ctx.save();
      ctx.translate(Px, Py);
      ctx.rotate(isDragging ? displayAngle : isArrowFlying ? 0 : -Math.PI / 6);
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
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.shadowColor = t.bowGlow;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // String
      ctx.beginPath();
      ctx.moveTo(Math.cos(-Math.PI / 2.2) * 55, Math.sin(-Math.PI / 2.2) * 55);
      ctx.lineTo(isDragging ? Math.min(dragDist, 100) * -0.6 : 0, 0);
      ctx.lineTo(Math.cos(Math.PI / 2.2) * 55, Math.sin(Math.PI / 2.2) * 55);
      ctx.strokeStyle = t.bowString;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Arrow Physics
      if (isArrowFlying) {
        arrowTrail.push({ x: arrowX, y: arrowY, alpha: 1.0 });
        if (arrowTrail.length > 20) arrowTrail.shift();

        arrowX += velocityX * dt;
        arrowY += velocityY * dt;
        velocityX += currentWind * dt;
        velocityY += gravity * dt;
        arrowAngle = Math.atan2(velocityY, velocityX);

        const dist = Math.hypot(arrowX - Tx, arrowY - Ty);
        if (arrowX > Px + 100) {
          minDistToBullseye = Math.min(minDistToBullseye, dist);
        }

        if (dist <= targetRadius && arrowX >= Tx - 15 && arrowX <= Tx + 15) {
          isArrowFlying = false;
          stuckOffset = { x: arrowX - Tx, y: arrowY - Ty };
          targetShake = 1.0;

          streakRef.current += 1;
          const streakBonus = 1 + Math.min(streakRef.current - 1, 10) * 0.1; // caps at +100%

          if (dist <= bullseyeRadius) {
            const gained = Math.round(100 * streakBonus);
            scoreRef.current += gained;
            setStatus(`DIVINE STRIKE! +${gained}`);
            spawnParticles(arrowX, arrowY, t.particles.win, 60);
            spawnFloatingText(
              arrowX,
              arrowY - 30,
              `+${gained}`,
              t.particles.win,
            );
            screenShakeMag = 16;
            sfx.bullseye();
            vibrate([30, 30, 60]);
          } else {
            const gained = Math.round(20 * streakBonus);
            scoreRef.current += gained;
            const nearMiss = dist <= bullseyeRadius * 2.4;
            setStatus(
              nearMiss
                ? `So close! Target struck. +${gained}`
                : `Target struck! +${gained}`,
            );
            spawnParticles(arrowX, arrowY, t.particles.hit, 30);
            spawnFloatingText(
              arrowX,
              arrowY - 30,
              `+${gained}`,
              t.particles.hit,
            );
            if (nearMiss) {
              spawnFloatingText(arrowX, arrowY - 50, "So close!", t.sunGlow);
            }
            screenShakeMag = 8;
            sfx.hit();
            vibrate(40);
          }

          if (streakRef.current > 1) {
            spawnFloatingText(
              arrowX,
              arrowY - 55,
              `Streak x${streakRef.current}!`,
              t.sunGlow,
            );
          }

          if (streakRef.current > bestStreakRef.current) {
            bestStreakRef.current = streakRef.current;
            setBestStreak(bestStreakRef.current);
          }
          if (scoreRef.current > bestScoreRef.current) {
            bestScoreRef.current = scoreRef.current;
            setBestScore(bestScoreRef.current);
          }
          if (scoreRef.current > dailyBestRef.current) {
            dailyBestRef.current = scoreRef.current;
            setDailyBest(dailyBestRef.current);
          }
          persistBest();

          setScore(scoreRef.current);
          setStreak(streakRef.current);
          persistSession();
        } else if (arrowY > HEIGHT || arrowX > WIDTH || arrowY < -200) {
          isArrowFlying = false;
          const wasClose = minDistToBullseye < 100;
          setStatus(
            wasClose
              ? "So close! The arrow missed its mark."
              : "The arrow missed its mark.",
          );
          if (wasClose) sfx.close();
          else sfx.miss();
          if (streakRef.current > 0) {
            spawnFloatingText(Px, Py - 90, "Streak broken", "#F87171");
            sfx.streakBreak();
            vibrate(80);
          } else {
            vibrate(50);
          }
          streakRef.current = 0;
          setStreak(0);
          persistSession();
        }
      }

      // Draw Arrow
      ctx.save();
      if (!isDragging && !isArrowFlying && stuckOffset.x !== 0) {
        ctx.translate(Tx + stuckOffset.x + shakeX, Ty + stuckOffset.y);
        ctx.rotate(arrowAngle);
      } else if (isArrowFlying) {
        ctx.translate(arrowX, arrowY);
        ctx.rotate(arrowAngle);
      } else if (isDragging) {
        ctx.translate(
          Px - Math.cos(displayAngle) * 20,
          Py - Math.sin(displayAngle) * 20,
        );
        ctx.rotate(displayAngle);
      } else {
        ctx.translate(Px, Py);
        ctx.rotate(-Math.PI / 6);
      }

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
      ctx.restore();

      // Particles
      particles.forEach((p, index) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += gravity * 0.4 * dt;
        p.life -= dt * 1.5;
        if (p.life <= 0) {
          particles.splice(index, 1);
        } else {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      });

      // Floating combo/score text
      floatingTexts.forEach((ft, index) => {
        ft.y -= 40 * dt;
        ft.life -= dt * 0.9;
        if (ft.life <= 0) {
          floatingTexts.splice(index, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = Math.min(1, ft.life);
          ctx.font = "bold 20px sans-serif";
          ctx.fillStyle = ft.color;
          ctx.textAlign = "center";
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }
      });

      ctx.restore(); // matches the screen-shake save() at the top of the loop

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("mousedown", startDrag);
      canvas.removeEventListener("mousemove", moveDrag);
      window.removeEventListener("mouseup", endDrag);
      canvas.removeEventListener("touchstart", startDrag);
      canvas.removeEventListener("touchmove", moveDrag);
      window.removeEventListener("touchend", endDrag);
    };
  }, [isDarkMode]); // Re-run effect when theme changes to redraw canvas colors

  // Dynamic UI Styles
  const wrapperClass = isDarkMode
    ? "bg-[#140A21] ring-purple-900/40"
    : "bg-amber-50 ring-amber-900/20";
  const headerClass = isDarkMode
    ? "bg-gradient-to-r from-[#26133B] to-[#1C0E2B] border-purple-800/30"
    : "bg-gradient-to-r from-orange-100 to-amber-100 border-amber-800/20";
  const textTitleClass = isDarkMode
    ? "from-amber-200 to-amber-600"
    : "from-orange-600 to-amber-700";
  const textSubClass = isDarkMode ? "text-amber-200/70" : "text-orange-800/70";
  const statBoxClass = isDarkMode ? "text-purple-100" : "text-orange-900";

  // Ornamental frame around the canvas - replaces the old flat black letterbox
  const frameBezelClass = isDarkMode
    ? "bg-gradient-to-br from-[#3B2166] via-[#1E1030] to-[#0B061A] ring-1 ring-amber-400/20"
    : "bg-gradient-to-br from-amber-300 via-orange-400 to-amber-600 ring-1 ring-amber-900/30";
  const frameInsetStyle = isDarkMode
    ? {
        background:
          "radial-gradient(ellipse at center, #241338 0%, #0B061A 100%)",
      }
    : {
        background:
          "radial-gradient(ellipse at center, #FDE9C8 0%, #C2740A 100%)",
      };
  const cornerOrnamentColor = isDarkMode ? "#FBBF24" : "#7C2D12";

  return (
    <div
      className={`flex h-full w-full max-w-[900px] flex-col gap-4 p-2 sm:p-4 rounded-3xl mx-auto shadow-2xl ring-1 transition-colors duration-500 ${wrapperClass}`}
    >
      {/* Header UI */}
      <div
        className={`shrink-0 flex flex-col sm:flex-row items-center justify-between rounded-2xl px-6 py-4 shadow-md border transition-colors duration-500 ${headerClass}`}
      >
        <div className="flex items-center gap-4">
          <div>
            <h1
              className={`text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${textTitleClass}`}
            >
              Kurukshetra
            </h1>
            <p
              className={`text-xs sm:text-sm mt-1 font-medium ${textSubClass}`}
            >
              {status}
            </p>
            <p
              className={`text-[10px] mt-0.5 font-semibold ${isDarkMode ? "text-amber-400/80" : "text-orange-700/80"}`}
            >
              🔥 {dayStreak}-day streak · Today&apos;s best: {dailyBest}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 sm:mt-0">
          {/* New Session Button */}
          <button
            onClick={startNewSession}
            className="px-3 py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase bg-black/10 hover:bg-black/20 transition-colors"
            title="Start a fresh run (keeps your best scores)"
          >
            New Run
          </button>

          {/* Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
            title="Toggle Sound"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
            title="Toggle Day/Night"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>

          <div className="flex gap-4 sm:gap-6 text-center border-l border-black/10 pl-4">
            <div>
              <p
                className={`text-[10px] uppercase font-bold ${isDarkMode ? "text-purple-400" : "text-orange-500"}`}
              >
                Arrows
              </p>
              <p className={`text-xl sm:text-2xl font-bold ${statBoxClass}`}>
                {attempts}
              </p>
            </div>
            <div>
              <p
                className={`text-[10px] uppercase font-bold ${isDarkMode ? "text-rose-400" : "text-rose-600"}`}
              >
                Streak
              </p>
              <p
                className={`text-xl sm:text-2xl font-bold ${isDarkMode ? "text-rose-300" : "text-rose-600"}`}
              >
                {streak}
              </p>
            </div>
            <div>
              <p
                className={`text-[10px] uppercase font-bold ${isDarkMode ? "text-amber-500" : "text-amber-600"}`}
              >
                Dharma
              </p>
              <p
                className={`text-xl sm:text-2xl font-bold ${isDarkMode ? "text-amber-400" : "text-orange-600"}`}
              >
                {score}
              </p>
            </div>
            <div>
              <p
                className={`text-[10px] uppercase font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}
              >
                Best
              </p>
              <p
                className={`text-xl sm:text-2xl font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}
              >
                {bestScore}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative w-full aspect-[4/3] bg-black overflow-hidden rounded-xl border border-black/20 shadow-inner">
        <canvas
          ref={canvasRef}
          className="block w-full h-full touch-none cursor-crosshair"
          style={{ touchAction: "none" }}
        />
        <div className="pointer-events-none absolute bottom-4 w-full flex justify-center">
          <span className="rounded-full bg-black/60 px-4 py-2 text-[10px] sm:text-xs font-bold uppercase text-white/90 backdrop-blur-md">
            Pull back to draw
          </span>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
