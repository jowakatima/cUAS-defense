// Game configuration
const GAME_CONFIG = {
    GRID_SIZE: 25,
    BASE_SIZE: 20,
    STARTING_MONEY: 200,
    ENEMY_REWARD: 15,
    WAVE_REWARD: 50,
    MAX_WAVES: 10,
    ENEMIES_PER_WAVE: 15,
    SPAWN_INTERVAL: 1000,
    MIN_SPAWN_INTERVAL: 300,
    MAX_SPAWN_INTERVAL: 2000
};

// Enemy types configuration
const ENEMY_TYPES = {
    'fixed_wing': { speedMod: 1.0, healthMod: 1.0, sizeMod: 1.0, color: [255, 0, 0], shape: 'rect', value: 1.0 },
    'fpv': { speedMod: 1.8, healthMod: 0.6, sizeMod: 0.8, color: [255, 165, 0], shape: 'rect', value: 1.2 },
    'group_3': { speedMod: 1.2, healthMod: 3.0, sizeMod: 1.4, color: [40, 45, 50], shape: 'rect', value: 2.0 },
    'group_5': { speedMod: 0.4, healthMod: 5.0, sizeMod: 1.6, color: [50, 50, 50], shape: 'circle', value: 3.0 }
};

// Initial game statistics
const INITIAL_GAME_STATS = {
    enemiesKilled: 0,
    moneyEarned: 0,
    towersBuilt: 0,
    wavesCompleted: 0,
    startTime: 0,
    gameTime: 0
}; 