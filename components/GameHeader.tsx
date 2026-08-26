import React from "react";

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
      className={`shrink-0 flex flex-col sm:flex-row items-center justify-between rounded-2xl px-6 py-4 shadow-md border transition-colors duration-500 ${headerClass}`}
    >
      <div className="flex items-center gap-4">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${textTitleClass}`}
          >
            Kurukshetra
          </h1>
          <p className={`text-xs sm:text-sm mt-1 font-medium ${textSubClass}`}>
            {status}
          </p>
          <p
            className={`text-[10px] mt-0.5 font-semibold ${isDarkMode ? "text-amber-400/80" : "text-orange-700/80"}`}
          >
            🔥 {dayStreak}-day streak · Today's best: {dailyBest}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 sm:mt-0">
        <button
          onClick={onNewRun}
          className="px-3 py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase bg-black/10 hover:bg-black/20 transition-colors"
          title="Start a fresh run (keeps your best scores)"
        >
          New Run
        </button>

        <button
          onClick={onToggleMute}
          className="p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
          title="Toggle Sound"
        >
          {isMuted ? "🔇" : "🔊"}
        </button>

        <button
          onClick={onToggleTheme}
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
  );
};
