# cUAS Defense - Tower Defense Game

A modern tower defense game built with P5.js and ES modules. Defend your base from waves of enemy drones using various types of defensive towers.

## Features

- Four unique tower types:
  - Jammer Tower: Basic tower with balanced stats
  - Missile Tower: Slow but powerful with splash damage
  - Laser Tower: Fast but less powerful
  - HPM Tower: High-power microwave tower with area damage

- Multiple enemy types:
  - Fixed-wing drones
  - FPV drones
  - Group 3 drones
  - Group 5 drones

- Wave-based gameplay:
  - Increasing difficulty with each wave
  - Different enemy types introduced as waves progress
  - Tower placement restricted to active waves

- Modern UI:
  - Tower preview with range indicators
  - Health bars for base and enemies
  - Wave information display
  - Money and resource management

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cuas-defense.git
cd cuas-defense
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:8080`

## Controls

- Left-click: Select and place towers
- Spacebar: Start/advance wave
- Mouse hover: Preview tower placement
- Click to restart after game over

## Project Structure

```
cuas-defense/
├── src/
│   ├── config/
│   │   ├── gameConfig.js
│   │   └── towerConfig.js
│   ├── entities/
│   │   ├── Base.js
│   │   ├── Enemy.js
│   │   ├── Projectile.js
│   │   └── Tower.js
│   ├── game/
│   │   ├── GameManager.js
│   │   └── WaveManager.js
│   ├── ui/
│   │   └── TowerButton.js
│   ├── utils/
│   │   └── helpers.js
│   └── sketch.js
├── images/
├── index.html
├── package.json
└── README.md
```

## Development

The game is built using:
- P5.js for graphics and game loop
- ES modules for code organization
- Modern JavaScript features
- Responsive design

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- P5.js team for the amazing creative coding library
- All contributors and testers
- The tower defense game community for inspiration 