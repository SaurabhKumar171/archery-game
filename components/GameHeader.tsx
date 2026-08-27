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
  const { isInstallable, isStandalone, handleInstallClick } = usePWAInstall();

  const headerClass = isDarkMode
    ? "bg-gradient-to-r from-[#26133B] to-[#1C0E2B] border-purple-800/30"
    : "bg-gradient-to-r from-orange-100 to-amber-100 border-amber-800/20";

  const textTitleClass = isDarkMode
    ? "from-amber-200 to-amber-600"
    : "from-orange-600 to-amber-700";
  const textSubClass = isDarkMode ? "text-amber-200/70" : "text-orange-800/70";
  const statBoxClass = isDarkMode ? "text-purple-100" : "text-orange-900";

  const isStartingOver = score === 0 && bestScore > 0;

  return (
    <div
      className={`flex flex-col lg:flex-row items-stretch lg:items-center justify-between rounded-xl lg:rounded-2xl px-3 py-3 sm:px-5 sm:py-4 shadow-md border transition-colors duration-500 gap-3 lg:gap-5 ${headerClass}`}
    >
      {/* Top Section: Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 flex-1">
        {/* Title & Status */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1
              className={`text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${textTitleClass} leading-none`}
            >
              Kurukshetra
            </h1>
            <span
              className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${
                isDarkMode ? "text-amber-400/90" : "text-orange-700/90"
              }`}
            >
              🔥 {dayStreak}d · Best: {dailyBest}
            </span>
          </div>
          <p
            className={`text-xs sm:text-sm mt-1 font-medium truncate ${textSubClass}`}
          >
            {status}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-start sm:self-auto">
          {isInstallable && !isStandalone && (
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase bg-amber-500 hover:bg-amber-400 text-black active:scale-95 transition-all shadow-lg shadow-amber-500/20 animate-pulse flex items-center gap-1"
              title="Install Game to Home Screen"
            >
              <span>📱</span> Install
            </button>
          )}

          <button
            onClick={onNewRun}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase bg-black/10 hover:bg-black/20 active:scale-95 transition-all text-current flex items-center gap-1.5"
            title="Start a fresh run"
          >
            <span className="text-[14px]">⚔️</span> New Run
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 sm:p-2 rounded-full bg-black/10 hover:bg-black/20 active:scale-95 transition-all text-xs sm:text-sm"
            title="Toggle Sound"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          <button
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-full bg-black/10 hover:bg-black/20 active:scale-95 transition-all text-xs sm:text-sm"
            title="Toggle Day/Night"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Stats Counter Section */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 text-center pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-black/10 lg:pl-5 shrink-0 w-full lg:w-auto">
        <div className="bg-black/5 lg:bg-transparent rounded-lg py-1.5 px-1 sm:p-0 flex flex-col justify-center items-center">
          <p
            className={`text-[9px] sm:text-[10px] lg:text-xs uppercase font-bold tracking-wider flex items-center gap-1 ${
              isDarkMode ? "text-purple-400" : "text-orange-600"
            }`}
          >
            <span>🏹</span> <span className="hidden sm:inline">Arrows</span>
          </p>
          <p
            className={`text-sm sm:text-lg lg:text-xl font-black mt-0.5 ${statBoxClass}`}
          >
            {attempts}
          </p>
        </div>

        <div className="bg-black/5 lg:bg-transparent rounded-lg py-1.5 px-1 sm:p-0 flex flex-col justify-center items-center">
          <p
            className={`text-[9px] sm:text-[10px] lg:text-xs uppercase font-bold tracking-wider flex items-center gap-1 ${
              isDarkMode ? "text-rose-400" : "text-rose-600"
            }`}
          >
            <span>⚡</span> <span className="hidden sm:inline">Streak</span>
          </p>
          <p
            className={`text-sm sm:text-lg lg:text-xl font-black mt-0.5 transition-all duration-300 ${
              isDarkMode ? "text-rose-300" : "text-rose-600"
            } ${streak > 2 ? "scale-110 drop-shadow-md" : ""}`}
          >
            {streak}
          </p>
        </div>

        <div className="bg-black/5 lg:bg-transparent rounded-lg py-1.5 px-1 sm:p-0 flex flex-col justify-center items-center">
          <p
            className={`text-[9px] sm:text-[10px] lg:text-xs uppercase font-bold tracking-wider flex items-center gap-1 ${
              isDarkMode ? "text-amber-400" : "text-amber-600"
            }`}
          >
            <span>🪷</span> <span className="hidden sm:inline">Dharma</span>
          </p>
          <p
            className={`text-sm sm:text-lg lg:text-xl font-black mt-0.5 transition-all duration-300 ${
              isDarkMode ? "text-amber-300" : "text-orange-600"
            } ${score === 0 && attempts > 0 ? "text-red-500 opacity-70" : ""}`}
          >
            {score}
          </p>
        </div>

        <div
          className={`bg-black/5 lg:bg-transparent rounded-lg py-1.5 px-1 sm:p-0 flex flex-col justify-center items-center transition-all ${
            isStartingOver ? "animate-pulse bg-black/10 lg:bg-black/5" : ""
          }`}
        >
          <p
            className={`text-[9px] sm:text-[10px] lg:text-xs uppercase font-bold tracking-wider flex items-center gap-1 ${
              isDarkMode ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            <span>👑</span> <span className="hidden sm:inline">Best</span>
          </p>
          <p
            className={`text-sm sm:text-lg lg:text-xl font-black mt-0.5 ${
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
