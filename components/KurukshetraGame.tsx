"use client";

import React, { useEffect, useState, useCallback } from "react";
import { themes } from "../constants/themes";
import { GameHeader } from "./GameHeader";
import { GameCanvas } from "./GameCanvas";

const KurukshetraGame = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [status, setStatus] = useState(
    "Focus, Arjuna. Draw the divine string...",
  );

  const [bestScore, setBestScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [dailyBest, setDailyBest] = useState(0);
  const [dayStreak, setDayStreak] = useState(0);

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
      if (!Number.isNaN(savedBest)) setBestScore(savedBest);
      if (!Number.isNaN(savedStreak)) setBestStreak(savedStreak);

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
        setDailyBest(storedDailyBest);
      } else {
        storedDailyBest = 0;
        localStorage.setItem("kurukshetra_daily_date", todayStr);
        localStorage.setItem("kurukshetra_daily_best", "0");

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastPlayed === yesterday.toISOString().slice(0, 10)) {
          storedDayStreak += 1;
        } else if (lastPlayed !== todayStr) {
          storedDayStreak = 1;
        }
      }

      setDailyBest(storedDailyBest);
      setDayStreak(storedDayStreak);
      localStorage.setItem("kurukshetra_day_streak", String(storedDayStreak));
      localStorage.setItem("kurukshetra_last_played", todayStr);

      const savedSession = localStorage.getItem("kurukshetra_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed) {
          setScore(parsed.score || 0);
          setAttempts(parsed.attempts || 0);
          setStreak(parsed.streak || 0);
        }
      }
    } catch {
      // Ignore local storage errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const persistSessionAndBests = useCallback(
    (newScore: number, newStreak: number) => {
      setBestScore((prev) => {
        const updated = Math.max(prev, newScore);
        localStorage.setItem("kurukshetra_best_score", String(updated));
        return updated;
      });
      setBestStreak((prev) => {
        const updated = Math.max(prev, newStreak);
        localStorage.setItem("kurukshetra_best_streak", String(updated));
        return updated;
      });
      setDailyBest((prev) => {
        const updated = Math.max(prev, newScore);
        localStorage.setItem("kurukshetra_daily_best", String(updated));
        return updated;
      });
    },
    [],
  );

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        "kurukshetra_session",
        JSON.stringify({ score, attempts, streak }),
      );
    }
  }, [score, attempts, streak, isLoaded]);

  const startNewSession = () => {
    setScore(0);
    setAttempts(0);
    setStreak(0);
    setStatus("The battlefield awaits anew. Draw the string...");
    setSessionKey((prev) => prev + 1);
    localStorage.removeItem("kurukshetra_session");
  };

  const handleHit = useCallback(
    (newScore: number, newStreak: number, isBullseye: boolean) => {
      setScore(newScore);
      setStreak(newStreak);
      setStatus(
        isBullseye
          ? '"I see only the eye of the bird."'
          : "A true strike. Dharma grows.",
      );
      persistSessionAndBests(newScore, newStreak);
    },
    [persistSessionAndBests],
  );

  const handleMiss = useCallback((wasClose: boolean) => {
    setStreak(0);
    setScore(0); // SUDDEN DEATH: Reset Dharma to 0

    setStatus(
      wasClose
        ? "The wind tests you. Focus wavers, Dharma resets."
        : "Illusion clouds your vision. Dharma is lost.",
    );
  }, []);

  if (!isLoaded) return null;

  return (
    <div className="relative w-full h-full transition-colors duration-500 overflow-hidden bg-black">
      {/* Floating HUD overlay - Added safe-area padding for mobile notches/dynamic islands */}
      <div
        className="absolute top-0 left-0 w-full z-10 pointer-events-none px-2 sm:px-4 lg:px-6"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="pointer-events-auto max-w-6xl mx-auto">
          <GameHeader
            isDarkMode={isDarkMode}
            status={status}
            dayStreak={dayStreak}
            dailyBest={dailyBest}
            attempts={attempts}
            streak={streak}
            score={score}
            bestScore={bestScore}
            isMuted={isMuted}
            onNewRun={startNewSession}
            onToggleMute={() => setIsMuted(!isMuted)}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          />
        </div>
      </div>

      {/* Fullscreen interactive canvas */}
      <GameCanvas
        key={sessionKey}
        theme={isDarkMode ? themes.dark : themes.light}
        isMuted={isMuted}
        initialScore={score}
        initialAttempts={attempts}
        initialStreak={streak}
        onStatusChange={setStatus}
        onAttempt={setAttempts}
        onHit={handleHit}
        onMiss={handleMiss}
      />
    </div>
  );
};

export default KurukshetraGame;
