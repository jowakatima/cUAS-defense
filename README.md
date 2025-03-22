# cUAS Defense - Tower Defense Game

A tower defense game where you defend against various drone types by strategically placing defense towers.

## Game Overview

In this tower defense game, you'll defend against different types of unmanned aerial systems (UAS) by strategically placing defense towers along their path. The game features:

- 25x25 grid-based gameplay
- Multiple tower types with different abilities
- Various enemy drone types (Fixed Wing, FPV, Group 3, Group 5)
- Special missile targeting system
- Dynamic scaling based on window size
- Wave-based progression with increasing difficulty
- Money system for purchasing and upgrading towers

## How to Play

1. Click on the grid to place towers
2. Use number keys to select different tower types:
   - Press `1` for Jamming Tower
   - Press `2` for Rapid Tower
   - Press `3` for Splash Tower
3. Press `SPACE` to enter missile targeting mode (when missiles are available)
4. Click on enemies while in targeting mode to fire missiles at them
5. Survive all waves to win
6. Press 'i' to toggle between drawn sprites and image sprites

## Tower Types

- **Jamming Tower**: Specializes in countering FPV and Fixed Wing drones by disrupting their signals and draining health over time. Ineffective against Group 3 and Group 5 drones.
- **Rapid Tower**: Fast-firing tower with moderate damage, effective against all drone types.
- **Splash Tower**: Area damage tower that affects multiple enemies in a radius, ideal for clusters.

## Missile System

Your base comes equipped with a special missile battery that can launch guided missiles:
- Press `SPACE` to enter targeting mode
- Click on any enemy to fire a missile
- Targeting mode persists until you press a tower selection key (1-3)
- Purchase additional missiles between waves
- Missiles cause splash damage to nearby enemies

## Enemy Types

- **Fixed Wing**: Standard drone with balanced stats, vulnerable to jamming
- **FPV**: Fast but fragile racing drone, vulnerable to jamming
- **Group 3**: Stealthy flying wing with increased health, resistant to jamming
- **Group 5**: Heavy, armored boss-type enemy, resistant to jamming

## Custom Sprites

You can add custom sprites for enemies and towers by placing image files in the `images/` directory:

### Enemy Images
- `images/enemy_fixed_wing.png`
- `images/enemy_fpv.png`
- `images/enemy_group_3.png`
- `images/enemy_group_5.png`

### Tower Images
- `images/tower_basic.png` (Jamming Tower)
- `images/tower_missile_battery.png`
- `images/tower_rapid.png`
- `images/tower_splash.png`

If an image is not found, the game will automatically fall back to using the programmatically drawn sprites.

## Game Controls

- **1, 2, 3**: Select tower types
- **SPACE**: Toggle missile targeting mode
- **Mouse Click**: Place towers or target enemies
- **i**: Toggle between drawn sprites and image sprites
- **q**: Test function (spawns an enemy near the base)

## Development

This game is built using P5.js, a JavaScript library for creative coding. The game features dynamic scaling to fit different screen sizes and detailed sprite designs created programmatically.

## License

MIT License 