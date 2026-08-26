"use client";

import React from "react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface GameHeaderProps {
  isDarkMode: boolean;
  status: string;
  dayStreak: number;
  dailyBest: number;
  attempts: number;
  streak: number;
  score: number;
  bestScore: number;
  isMuted: boolean;
  onNewRun: () => void;
  onToggleMute: () => void;
  onToggleTheme: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  isDarkMode,
  status,
  dayStreak,
  dailyBest,
  attempts,
  streak,
  score,
  bestScore,
  isMuted,
  onNewRun,
  onToggleMute,
  onToggleTheme,
}) => {
  // Bring in our smart install hook
  const { isInstallable, isStandalone, handleInstallClick } = usePWAInstall();

  const headerClass = isDarkMode
    ? "bg-gradient-to-r from-[#26133B] to-[#1C0E2B] border-purple-800/30"
    : "bg-gradient-to-r from-orange-100 to-amber-100 border-amber-800/20";

  const textTitleClass = isDarkMode
    ? "from-amber-200 to-amber-600"
    : "from-orange-600 to-amber-700";
  const textSubClass = isDarkMode ? "text-amber-200/70" : "text-orange-800/70";
  const statBoxClass = isDarkMode ? "text-purple-100" : "text-orange-900";

  return (
    <div
      className={`shrink-0 flex flex-col lg:flex-row items-stretch lg:items-center justify-between rounded-xl lg:rounded-2xl px-3 py-2.5 sm:px-5 sm:py-3.5 shadow-md border transition-colors duration-500 gap-2.5 lg:gap-4 ${headerClass}`}
    >
      {/* Top Section: Title & Controls */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h1
              className={`text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${textTitleClass} leading-none`}
            >
              Kurukshetra
            </h1>
            <span
              className={`text-[9px] sm:text-xs font-semibold whitespace-nowrap ${
                isDarkMode ? "text-amber-400/80" : "text-orange-700/80"
              }`}
            >
              🔥 {dayStreak}d · Best: {dailyBest}
            </span>
          </div>
          <p
            className={`text-[10px] sm:text-xs mt-0.5 font-medium truncate ${textSubClass}`}
          >
            {status}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Smart Install Button */}
          {isInstallable && !isStandalone && (
            <button
              onClick={handleInstallClick}
              className="px-2.5 py-1.5 rounded-full text-[9px] sm:text-xs font-bold uppercase bg-amber-500 hover:bg-amber-400 text-black active:scale-95 transition-all shadow-lg shadow-amber-500/20 animate-pulse"
              title="Install Game to Home Screen"
            >
              📱 Install
            </button>
          )}

          <button
            onClick={onNewRun}
            className="px-2.5 py-1.5 rounded-full text-[9px] sm:text-xs font-bold uppercase bg-black/10 hover:bg-black/20 active:scale-95 transition-all text-current"
            title="Start a fresh run"
          >
            New Run
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 active:scale-95 transition-all text-xs"
            title="Toggle Sound"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 active:scale-95 transition-all text-xs"
            title="Toggle Day/Night"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Stats Counter Section: Responsive Grid on Mobile, Row on Desktop */}
      <div className="grid grid-cols-4 gap-1 sm:gap-4 text-center pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-black/10 lg:pl-4 shrink-0">
        <div className="bg-black/5 lg:bg-transparent rounded-lg py-1 px-1.5 sm:p-0">
          <p
            className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider ${
              isDarkMode ? "text-purple-400" : "text-orange-600"
            }`}
          >
            Arrows
          </p>
          <p className={`text-base sm:text-xl font-black ${statBoxClass}`}>
            {attempts}
          </p>
        </div>

        <div className="bg-black/5 lg:bg-transparent rounded-lg py-1 px-1.5 sm:p-0">
          <p
            className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider ${
              isDarkMode ? "text-rose-400" : "text-rose-600"
            }`}
          >
            Streak
          </p>
          <p
            className={`text-base sm:text-xl font-black ${
              isDarkMode ? "text-rose-300" : "text-rose-600"
            }`}
          >
            {streak}
          </p>
        </div>

        <div className="bg-black/5 lg:bg-transparent rounded-lg py-1 px-1.5 sm:p-0">
          <p
            className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider ${
              isDarkMode ? "text-amber-400" : "text-amber-600"
            }`}
          >
            Dharma
          </p>
          <p
            className={`text-base sm:text-xl font-black ${
              isDarkMode ? "text-amber-300" : "text-orange-600"
            }`}
          >
            {score}
          </p>
        </div>

        <div className="bg-black/5 lg:bg-transparent rounded-lg py-1 px-1.5 sm:p-0">
          <p
            className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider ${
              isDarkMode ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            Best
          </p>
          <p
            className={`text-base sm:text-xl font-black ${
              isDarkMode ? "text-emerald-300" : "text-emerald-700"
            }`}
          >
            {bestScore}
          </p>
        </div>
      </div>
    </div>
  );
};
