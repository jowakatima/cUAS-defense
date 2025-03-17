# cUAS Defense - Tower Defense Game

A tower defense game where you defend against various drone types by strategically placing defense towers.

## Game Overview

In this tower defense game, you'll defend against different types of unmanned aerial systems (UAS) by strategically placing defense towers along their path. The game features:

- 25x25 grid-based gameplay
- Multiple tower types with different abilities
- Various enemy drone types (Fixed Wing, FPV, Group 3, Group 5)
- Dynamic scaling based on window size
- Wave-based progression with increasing difficulty
- Money system for purchasing and upgrading towers

## How to Play

1. Click on the grid to place towers
2. Use number keys 1-4 to select different tower types
3. Survive all waves to win
4. If an enemy reaches the end of the path, it's game over
5. Press 'i' to toggle between drawn sprites and image sprites

## Enemy Types

- **Fixed Wing**: Standard drone with balanced stats
- **FPV**: Fast but fragile racing drone
- **Group 3**: Stealthy flying wing with increased health
- **Group 5**: Heavy, armored boss-type enemy

## Custom Sprites

You can add custom sprites for enemies and towers by placing image files in the `images/` directory:

### Enemy Images
- `images/enemy_fixed_wing.png`
- `images/enemy_fpv.png`
- `images/enemy_group_3.png`
- `images/enemy_group_5.png`

### Tower Images
- `images/tower_basic.png`
- `images/tower_sniper.png`
- `images/tower_rapid.png`
- `images/tower_splash.png`

If an image is not found, the game will automatically fall back to using the programmatically drawn sprites.

## Development

This game is built using P5.js, a JavaScript library for creative coding. The game features dynamic scaling to fit different screen sizes and detailed sprite designs created programmatically.

## Testing

Press 'q' during gameplay to trigger the game over test (places an enemy near the end of the path).

## License

MIT License 