# 🏹 Kurukshetra: Archery

A meditative, offline-first archery game built with Next.js, Tailwind CSS, and the pure HTML5 Canvas API.

Inspired by the epic *Mahabharata*, players take on the role of Arjuna, firing celestial arrows (Divyastras) across a full-screen, dynamic battlefield.

---

## ✨ Features

- **📱 Progressive Web App (PWA):** Fully installable on iOS, Android, and Desktop. Works **100% offline** with zero loading times after the first visit.
- **🌗 Day & Night Themes:** Toggle between "Vedic Dawn" (Light Mode) and "Astral Twilight" (Dark Mode).
- **🏹 Dynamic Inverse Kinematics (IK):** Custom-built character movement engine where Arjuna's arms, bow tension, and posture dynamically adjust as you draw and fire.
- **🔥 Dynamic Battlefield Background:** Features procedural smoke, glowing fires, distant clashing warriors, wind physics, and scattered ground debris.
- **🎯 Dynamic Mechanics:** Features realistic wind resistance, gravity arcs, and progressive target difficulty.
- **🔊 Game Juice:** Full feedback loop featuring screen shake, particle trails, Web Audio API sound effects, and mobile haptic vibrations.
- **🏆 Local Persistence:** Automatically tracks and saves your high score, daily best, total attempts, and active day streaks via `localStorage`.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router & TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Graphics & Engine:** Pure HTML5 Canvas API (No external game engines used)
- **PWA & Offline:** [@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa)
- **Audio:** Web Audio API (Synthesized in real-time, zero audio assets required)

---

## 🎮 How to Play

1. **Draw the Bow:** Touch/click near Arjuna and drag backward to aim and tension the Gandiva bow.
2. **Account for Wind:** Look at the wind indicator at the top of the screen to adjust your arc.
3. **Release to Strike:** Release your mouse or finger to launch the Divyastra.
4. **Build Streaks:** Consecutive bullseyes grant massive score multipliers. A miss resets your streak!

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-username/kurukshetra-archery.git
cd kurukshetra-archery
npm install
```

### 2. Development Mode

Run the local development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

(Note: PWA caching and Service Workers are disabled in development mode to avoid caching stale code).

### 📦 Building & Testing Offline PWA

To test the offline Service Worker and PWA installation features, generate a production build:

```bash
npm run build
npm run start
```

1. Open http://localhost:3000 in Google Chrome or Safari.
2. Click the Install button in the browser URL bar (or "Add to Home Screen" on mobile).
3. Disconnect your internet connection, refresh the page, and play completely offline!

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.