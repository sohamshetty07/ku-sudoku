# Ku Sudoku: The Void Protocol 🌌

![Project Status](https://img.shields.io/badge/Status-Production-success)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20TypeScript%20%7C%20MongoDB-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

**Ku Sudoku** is not just a logic puzzle; it is a cosmic survival expedition.

This project reimagines the classic Sudoku experience by fusing it with **Roguelike progression systems**, a vast **unlockable galaxy**, and a high-fidelity **"Cosmic Glass" UI**. Built with the latest web technologies, it features real-time cloud sync, PWA support, and a procedural economy.

[**🚀 Play the Live Demo**]https://ku-sudoku.vercel.app

---

## ✨ Key Features

### 🎮 Gamified Logic
* **Expedition Mode (Roguelike):** A survival mode where you warp through sectors. One mistake costs a life. Permadeath rules apply to the run, but you keep your currency.
* **The Astral Chart:** A massive skill tree visualized as a galaxy. Spend Stardust to unlock planets (Nodes) that grant permanent passive buffs (e.g., *Jupiter: +10% XP gain*).
* **Artifact System:** Equip powerful tech like *Auto-Fillers*, *Shield Generators*, and *Scanners* to break the rules of Sudoku during difficult runs.

### 💎 Economy & Customization
* **The Observatory (Shop):** Spend **Stardust** (Common) and **Comet Shards** (Rare) to buy stunning visual themes.
* **Dynamic Themes:** Supports standard color palettes and "Mythic" themes like *Eternity* which features fluid, animated gradients.
* **Void Market:** A shop that appears between Expedition sectors to repair your hull or buy emergency supplies.

### 🛠 Technical Highlights
* **Cloud Sync:** Seamlessly switch between Mobile and Desktop. Your progress (XP, Inventory, Stats) syncs automatically via MongoDB.
* **PWA Support:** Installable as a native app on iOS/Android with full offline capabilities (Logic engine runs on Web Workers).
* **Performance:** 60FPS animations using Tailwind CSS hardware acceleration and Framer Motion.
* **Social:** Global Leaderboards (ELO System) and Daily Challenges generated server-side.

---

## 🏗️ Tech Stack

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
* **Database:** [MongoDB](https://www.mongodb.com/) (Mongoose)
* **Auth:** [NextAuth.js](https://next-auth.js.org/)
* **State Management:** Zustand (Local) + React Query (Server)
* **Icons:** Lucide React

---

## 🚀 Getting Started

Follow these steps to run the "Void Protocol" locally.

### Prerequisites
* Node.js 18+
* MongoDB Cluster (Atlas or Local)

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/sohamshetty07/ku-sudoku.git](https://github.com/sohamshetty07/ku-sudoku.git)
    cd ku-sudoku
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add the following:
    ```bash
    # Database
    MONGODB_URI=your_mongodb_connection_string

    # Auth (Generate a random string: openssl rand -base64 32)
    NEXTAUTH_SECRET=your_random_secret_string
    NEXTAUTH_URL=http://localhost:3000

    # Optional: Google OAuth (if you enable social login later)
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```

5.  **Build for Production**
    ```bash
    npm run build
    npm start
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to enter the Void.

---

## 📂 Project Structure

```bash
src/
├── app/                  # Next.js App Router Pages
│   ├── api/              # Serverless Functions (Sync, Auth, Leaderboard)
│   ├── game/             # The Core Sudoku Game Logic
│   ├── expedition/       # Roguelike Mode Logic
│   ├── astral/           # Galaxy/Skill Tree View
│   └── dashboard/        # Main Hub
├── components/           # Reusable UI Components
│   ├── ui/               # Buttons, Modals, Cards (Atomic Design)
│   └── layout/           # ThemeManager, Navbar
├── lib/
│   ├── sudoku/           # Sudoku Generation & Solver Algorithms (WASM/JS)
│   ├── db/               # Mongoose Models (User.ts)
│   └── store/            # Zustand State Stores (game.ts, theme.ts)
└── public/               # Static Assets & PWA Manifest

## 🤝 **Contributing**
Contributions are welcome! If you have ideas for new Artifacts, Themes, or Game Modes:
1. Fork the Project
2. Create your Feature Branch (git checkout -b feature/AmazingFeature)
3. Commit your Changes (git commit -m 'Add some AmazingFeature')
4. Push to the Branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

## 📜 License
Distributed under the MIT License. See LICENSE for more information.

Built with 💙 and ☕ by Soham Shetty.