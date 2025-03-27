// Global variables
let grid = [];
let base = { x: 0, y: 0, size: 0, health: 100, maxHealth: 100 }; // Base that enemies will target
let enemies = [];
let towers = [];
let projectiles = [];
let explosionEffects = []; // Track explosion particles for visual effects
let currentWave = 1; // Current wave number
let maxWaves = 10; // Total number of waves
let enemiesPerWave = 15; // Increased base enemies per wave for larger map
let enemiesToSpawn = enemiesPerWave; // Enemies remaining to spawn in current wave
let spawnInterval = 1000; // Base spawn interval (will be randomized)
let minSpawnInterval = 300; // Minimum spawn time between enemies
let maxSpawnInterval = 2000; // Maximum spawn time between enemies
let lastSpawnTime = 0;
let waveInProgress = false; // Flag to track if a wave is currently active
let waveCompleted = false; // Flag to track if all waves are completed
let gameOver = false;
let money = 200; // Increased starting money for larger map
let selectedTowerType = 'jammer'; // Default selected tower type
let gridSize = 25;
let baseSize = 20; // Base unit for scaling
let cellSize; // Will be calculated based on window size
let scaleFactor; // Global scale factor for all visual elements

// Missile battery on base variables
let baseTower = null; // Will hold the missile battery placed on the base
let missiles = 0; // Number of missiles available for the base tower
let missilePrice = 25; // Cost per missile
let selectedEnemy = null; // Currently selected enemy for targeting

let towerTypes = {
  jammer: { name: 'Jamming Tower', cost: 50, damage: 1, range: 60 * 2, attackSpeed: 300, color: [0, 0, 255] },
  missile: { name: 'Missile Battery', cost: 100, damage: 15, range: Infinity, attackSpeed: 1500, color: [128, 0, 0] },
  laser: { name: 'Laser Tower', cost: 75, damage: 8, range: 192, attackSpeed: 3000, color: [0, 200, 255] },
  hpm: { name: 'HPM Tower', cost: 125, damage: 5, range: 100, attackSpeed: 500, color: [128, 0, 128], coneDegrees: 90, dotDamage: true, splashRadius: 0 }
};
let enemyTypes = {
  'fixed_wing': { speedMod: 1.0, healthMod: 1.0, sizeMod: 1.0, color: [255, 0, 0], shape: 'rect', value: 1.0 },
  'fpv': { speedMod: 1.8, healthMod: 0.6, sizeMod: 0.8, color: [255, 165, 0], shape: 'rect', value: 1.2 },
  'group_3': { speedMod: 1.2, healthMod: 3.0, sizeMod: 1.4, color: [40, 45, 50], shape: 'rect', value: 2.0 },
  'group_5': { speedMod: 0.4, healthMod: 5.0, sizeMod: 1.6, color: [50, 50, 50], shape: 'circle', value: 3.0 }
};
let enemyReward = 15; // Base money earned per enemy killed
let waveReward = 50; // Bonus money for completing a wave
let gameStats = {
  enemiesKilled: 0,
  moneyEarned: 0,
  towersBuilt: 0,
  wavesCompleted: 0,
  startTime: 0,
  gameTime: 0
};

// Image storage objects
let enemyImages = {};
let towerImages = {};
let useImages = true; // Flag to enable/disable image usage

// Preload function to load images before setup
function preload() {
  // Load enemy images if they exist
  for (let type in enemyTypes) {
    let imagePath = `images/enemy_${type}.png`;
    // Use a try-catch approach with loadImage
    try {
      loadImage(
        imagePath,
        // Success callback
        img => { 
          console.log(`Loaded enemy image: ${imagePath}`);
          enemyImages[type] = img; 
        },
        // Error callback - silently fail and use drawn sprites instead
        () => { 
          console.log(`Enemy image not found: ${imagePath}, using drawn sprite`);
          // Don't throw an error, just continue
        }
      );
    } catch (e) {
      console.log(`Error loading enemy image: ${imagePath}`, e);
      // Continue execution even if image loading fails
    }
  }
  
  // Load tower images
  towerImages = {
    jammer: loadImage('images/tower_jammer.png', 
      () => { console.log("Jammer tower image loaded"); }, 
      () => { towerImages.jammer = null; console.log("Jammer tower image failed to load"); }
    ),
    missile: loadImage('images/tower_missile_battery.png', 
      () => { console.log("Missile battery image loaded"); }, 
      () => { towerImages.missile = null; console.log("Missile battery image failed to load"); }
    ),
    laser: loadImage('images/tower_laser.png', 
      () => { console.log("Laser tower image loaded"); }, 
      () => { towerImages.laser = null; console.log("Laser tower image failed to load"); }
    ),
    hpm: loadImage('images/tower_hpm.png', 
      () => { console.log("HPM tower image loaded"); }, 
      () => { towerImages.hpm = null; console.log("HPM tower image failed to load"); }
    )
  };
}

// Setup function to initialize the game
function setup() {
  // Make canvas fill the smaller of window width or height, maintaining square shape
  let size = min(windowWidth * 0.95, windowHeight * 0.95);
  createCanvas(size, size);
  
  // Calculate cell size and scale factor based on window size
  cellSize = size / gridSize;
  scaleFactor = cellSize / baseSize;
  
  // Initialize the grid
  for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = 'empty';
    }
  }

  // Set up the base on the right side in the middle
  base.x = width * 0.9;
  base.y = height * 0.5;
  base.size = cellSize * 2;
  base.health = 100;
  base.maxHealth = 100;

  // Mark the base position in the grid
  let baseGridX = floor(base.x / cellSize);
  let baseGridY = floor(base.y / cellSize);
  
  // Mark base area as occupied in the grid
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      let gridX = baseGridX + i;
      let gridY = baseGridY + j;
      if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
        grid[gridX][gridY] = 'base';
      }
    }
  }
  
  // Create the missile battery on the base
  baseTower = new BaseTower(base.x, base.y);
  
  // Start with 5 missiles
  missiles = 5;

  lastSpawnTime = millis();
  gameStats.startTime = millis();
}

// Handle window resizing
function windowResized() {
  let size = min(windowWidth * 0.95, windowHeight * 0.95);
  resizeCanvas(size, size);
  
  // Recalculate scaling factors
  cellSize = size / gridSize;
  scaleFactor = cellSize / baseSize;
  
  // Update base position
  base.x = width * 0.9;
  base.y = height * 0.5;
  base.size = cellSize * 2;

  // Update positions of existing entities
  for (let tower of towers) {
    let gridX = floor(tower.pos.x / (cellSize / scaleFactor));
    let gridY = floor(tower.pos.y / (cellSize / scaleFactor));
    tower.pos.x = gridX * cellSize + cellSize/2;
    tower.pos.y = gridY * cellSize + cellSize/2;
    tower.size = cellSize * 0.6;
  }
}

// Start a new wave of enemies
function startWave() {
  waveInProgress = true;
  enemiesToSpawn = enemiesPerWave + Math.floor(currentWave * 5); // Increase enemies per wave
  lastSpawnTime = millis();
  
  // If this is not the first wave, increment completed waves
  if (currentWave > 1) {
    gameStats.wavesCompleted++;
  }
}

// Get a random spawn interval
function getRandomSpawnInterval() {
  // As waves progress, the minimum interval gets shorter
  let waveMinInterval = max(minSpawnInterval, minSpawnInterval + 300 - (currentWave * 50));
  
  // Sometimes create clusters by having a higher chance of short intervals
  if (random() < 0.3) {
    return random(waveMinInterval, waveMinInterval + 300);
  } else {
    return random(waveMinInterval, maxSpawnInterval);
  }
}

// Main draw loop
function draw() {
  // Add drawOutlinedText helper at the beginning of the draw function
  function drawOutlinedText(txt, x, y, size, mainColor = 255, outlineColor = 0, outlineSize = 1) {
    push();
    textSize(size);
    
    // Draw outline
    fill(outlineColor);
    text(txt, x - outlineSize, y);
    text(txt, x + outlineSize, y);
    text(txt, x, y - outlineSize);
    text(txt, x, y + outlineSize);
    
    // Draw main text
    fill(mainColor);
    text(txt, x, y);
    pop();
  }

  if (gameOver) {
    // Only calculate game time once when the game first ends
    if (gameStats.gameTime === 0) {
      gameStats.gameTime = (millis() - gameStats.startTime) / 1000;
    }
    
    // Display game over screen with detailed stats
    background(0, 0, 0, 200); // Semi-transparent black
    fill(255, 0, 0);
    textSize(32 * scaleFactor);
    textAlign(CENTER);
    text("Game Over", width / 2, height / 3);
    
    // Performance summary
    textSize(16 * scaleFactor);
    fill(255);
    let statsY = height / 2 - 40 * scaleFactor;
    let statsSpacing = 24 * scaleFactor;
    
    text("Performance Summary", width / 2, statsY);
    statsY += statsSpacing * 1.5;
    
    text(`Waves Completed: ${gameStats.wavesCompleted} / ${maxWaves}`, width / 2, statsY);
    statsY += statsSpacing;
    
    text(`Enemies Defeated: ${gameStats.enemiesKilled}`, width / 2, statsY);
    statsY += statsSpacing;
    
    text(`Towers Built: ${gameStats.towersBuilt}`, width / 2, statsY);
    statsY += statsSpacing;
    
    text(`Money Earned: $${gameStats.moneyEarned}`, width / 2, statsY);
    statsY += statsSpacing;
    
    let minutes = floor(gameStats.gameTime / 60);
    let seconds = floor(gameStats.gameTime % 60);
    text(`Survival Time: ${minutes}m ${seconds}s`, width / 2, statsY);
    statsY += statsSpacing * 1.5;
    
    // Restart button
    fill(0, 100, 255);
    let buttonWidth = 150 * scaleFactor;
    let buttonHeight = 40 * scaleFactor;
    rect(width / 2 - buttonWidth / 2, statsY, buttonWidth, buttonHeight, 10);
    
    fill(255);
    textSize(18 * scaleFactor);
    text("Play Again", width / 2, statsY + buttonHeight / 2 + 6 * scaleFactor);
    
    return;
  }

  if (waveCompleted) {
    // Only calculate game time once when the game is first completed
    if (gameStats.gameTime === 0) {
      gameStats.gameTime = (millis() - gameStats.startTime) / 1000;
    }
    
    // Display victory screen with detailed stats
    background(0, 0, 0, 200); // Semi-transparent black
    fill(0, 255, 0);
    textSize(32 * scaleFactor);
    textAlign(CENTER);
    text("Victory!", width / 2, height / 3);
    
    // Performance summary
    textSize(16 * scaleFactor);
    fill(255);
    let statsY = height / 2 - 40 * scaleFactor;
    let statsSpacing = 24 * scaleFactor;
    
    text("Performance Summary", width / 2, statsY);
    statsY += statsSpacing * 1.5;
    
    text(`Waves Completed: ${maxWaves} / ${maxWaves}`, width / 2, statsY);
    statsY += statsSpacing;
    
    text(`Enemies Defeated: ${gameStats.enemiesKilled}`, width / 2, statsY);
    statsY += statsSpacing;
    
    text(`Towers Built: ${gameStats.towersBuilt}`, width / 2, statsY);
    statsY += statsSpacing;
    
    text(`Money Earned: $${gameStats.moneyEarned}`, width / 2, statsY);
    statsY += statsSpacing;
    
    let minutes = floor(gameStats.gameTime / 60);
    let seconds = floor(gameStats.gameTime % 60);
    text(`Completion Time: ${minutes}m ${seconds}s`, width / 2, statsY);
    statsY += statsSpacing * 1.5;
    
    // Restart button
    fill(0, 100, 255);
    let buttonWidth = 150 * scaleFactor;
    let buttonHeight = 40 * scaleFactor;
    rect(width / 2 - buttonWidth / 2, statsY, buttonWidth, buttonHeight, 10);
    
    fill(255);
    textSize(18 * scaleFactor);
    text("Play Again", width / 2, statsY + buttonHeight / 2 + 6 * scaleFactor);
    
    return;
  }

  // Draw the grid - replace with a solid background
  background(40, 80, 40); // Dark green background instead of grid

  // Mark base and tower positions with subtle indicators
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (grid[i][j] === 'base') {
        // Draw base area indicator but no grid cell
        fill(100, 100, 200, 50); // Semi-transparent blue for base
      let x = i * cellSize;
      let y = j * cellSize;
      rect(x, y, cellSize, cellSize);
      } 
      // Don't draw anything for empty or tower cells
    }
  }

  // Draw the base
  drawBase();
  
  // Draw the base tower
  if (baseTower) {
    baseTower.draw();
  }

  // **Handle wave logic**
  if (!waveInProgress && currentWave <= maxWaves) {
    // Display missile purchase interface before starting the wave
    displayMissilePurchaseUI();
    
    // Display "Start Wave" button
    fill(0, 100, 255);
    rect(width / 2 - 75, height - 50, 150, 40);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    drawOutlinedText("Start Wave " + currentWave, width / 2, height - 30, 18);
  } else if (waveInProgress) {
  // **Spawn enemies**
  if (enemiesToSpawn > 0 && millis() - lastSpawnTime > spawnInterval) {
    spawnEnemy();
    enemiesToSpawn--;
    lastSpawnTime = millis();
      // Set a new random spawn interval for the next enemy
      spawnInterval = getRandomSpawnInterval();
    }

    // Check if wave is complete (no more enemies to spawn and no enemies on the field)
    if (enemiesToSpawn <= 0 && enemies.length === 0) {
      waveInProgress = false;
      
      // Check if all waves are completed
      if (currentWave >= maxWaves) {
        waveCompleted = true;
      } else {
        // Prepare for next wave
        currentWave++;
        // Give player a reward for completing the wave
        money += waveReward + (currentWave - 1) * 25;
      }
    }
  }

  // **Update and draw enemies**
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    enemy.update();
    enemy.draw();
    
    // Highlight selected enemy
    if (selectedEnemy === enemy) {
      push();
      noFill();
      stroke(255, 0, 0);
      strokeWeight(2);
      circle(enemy.pos.x, enemy.pos.y, enemy.size * 2.5);
      pop();
    }
    
    // Check if enemy reached the base
    if (enemy.checkBaseCollision()) {
      base.health -= 10; // Damage the base
      enemies.splice(i, 1); // Remove the enemy
      
      // Reset selected enemy if it was removed
      if (selectedEnemy === enemy) {
        selectedEnemy = null;
        if (baseTower) {
          baseTower.targeting = false;
        }
      }
      
      if (base.health <= 0) {
        gameOver = true;
        break;
      }
    }
  }

  // **Update and draw towers**
  for (let tower of towers) {
    tower.update();
    tower.draw();
  }

  // **Update and draw projectiles**
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let proj = projectiles[i];
    proj.update();
    proj.draw();
    
    // Check for collision with enemies
    if (proj.checkCollision()) {
      projectiles.splice(i, 1); // Remove projectile after hit
      
      // Reset selected enemy if it was destroyed
      if (selectedEnemy && selectedEnemy.health <= 0) {
        selectedEnemy = null;
        if (baseTower) {
          baseTower.targeting = false;
        }
      }
    }
  }

  // **Update and draw explosion effects**
  for (let i = explosionEffects.length - 1; i >= 0; i--) {
    let effect = explosionEffects[i];
    
    // Update position
    effect.pos.add(effect.vel);
    effect.lifetime--;
    
    // Draw particle
    noStroke();
    let alpha = map(effect.lifetime, 0, 30, 0, 255);
    fill(effect.color[0], effect.color[1], effect.color[2], alpha);
    circle(effect.pos.x, effect.pos.y, effect.size * (effect.lifetime / 30));
    
    // Remove expired particles
    if (effect.lifetime <= 0) {
      explosionEffects.splice(i, 1);
    }
  }

  // **Highlight cell under mouse for tower placement and show tower preview**
  let mx = floor(mouseX / cellSize);
  let my = floor(mouseY / cellSize);
  
  // Only show tower placement preview if not in targeting mode and during waves
  if ((!baseTower || !baseTower.targeting) && waveInProgress) {
    if (mx >= 0 && mx < gridSize && my >= 0 && my < gridSize && grid[mx][my] === 'empty') {
      // Only highlight if we have enough money
      if (money >= towerTypes[selectedTowerType].cost) {
        // More visible yellow highlight with border
        fill(255, 255, 0, 70);
        stroke(255, 255, 0);
        strokeWeight(2);
      } else {
        // More visible red highlight with border
        fill(255, 0, 0, 70);
        stroke(255, 0, 0);
        strokeWeight(2);
      }
      rect(mx * cellSize, my * cellSize, cellSize, cellSize);
      noStroke();
      
      // Show tower preview
      let previewX = mx * cellSize + cellSize/2;
      let previewY = my * cellSize + cellSize/2;
      drawTowerPreview(previewX, previewY, selectedTowerType);
    }
  } 
  // Show targeting mode indicator
  else if (baseTower && baseTower.targeting) {
    // Draw a targeting cursor
    push();
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    line(mouseX - 10, mouseY, mouseX + 10, mouseY);
    line(mouseX, mouseY - 10, mouseX, mouseY + 10);
    noFill();
    stroke(255, 0, 0, 150);
    strokeWeight(1);
    ellipse(mouseX, mouseY, 30, 30);
    pop();
    
    // Add a semi-transparent background for better readability
    fill(0, 0, 0, 150);
    rect(width / 2 - 200, height - 35, 400, 30, 5);
    
    // Use white text with dark outline instead of red
    textAlign(CENTER);
    textSize(18);
    drawOutlinedText("TARGETING MODE - Click enemy to fire missile", width / 2, height - 20, 18, 255, 30, 2);
    
    // Draw a subtle red border instead of full overlay
    noFill();
    stroke(255, 0, 0, 80);
    strokeWeight(3);
    rect(5, 5, width-10, height-10, 5);
  }
  
  // **Show game HUD with improved visibility**
  // Add a semi-transparent background
  fill(0, 0, 0, 100);
  rect(5, 5, 150, 100, 5);
  
  // Use simple text for stats (no outline) for consistent appearance regardless of targeting mode
  textSize(18);
  textAlign(LEFT);
  fill(255);
  text(`Money: $${money}`, 15, 25);
  text(`Wave: ${currentWave}/${maxWaves}`, 15, 50);
  text(`Missiles: ${missiles}`, 15, 75);
  
  if (waveInProgress) {
    text(`Enemies: ${enemies.length + enemiesToSpawn}`, 15, 100);
  }
  
  // Draw tower selection UI
  drawTowerSelectionUI();
  
  // Only show the space key hint when not in targeting mode
  if (baseTower && missiles > 0 && !waveInProgress && !baseTower.targeting) {
    // Add a semi-transparent background
    fill(0, 0, 0, 100);
    rect(width / 2 - 180, height - 95, 360, 30, 5);
    
    textAlign(CENTER);
    textSize(16);
    drawOutlinedText("Press SPACE to enter missile targeting mode", width / 2, height - 80, 16, 255, 0, 1);
  }
  
  // Other targeting instructions are now handled in the tower preview section
}

// Display interface for purchasing missiles
function displayMissilePurchaseUI() {
  let boxWidth = 200;
  let boxHeight = 150;
  let boxX = width / 2 - boxWidth / 2;
  let boxY = height / 3 - boxHeight / 2;
  
  // Semi-transparent background for better readability
  fill(0, 0, 50, 200);
  rect(boxX, boxY, boxWidth, boxHeight, 10);
  
  function drawOutlinedText(txt, x, y, size, mainColor = 255, outlineColor = 0, outlineSize = 1) {
    push();
    textSize(size);
    
    // Draw outline
    fill(outlineColor);
    text(txt, x - outlineSize, y);
    text(txt, x + outlineSize, y);
    text(txt, x, y - outlineSize);
    text(txt, x, y + outlineSize);
    
    // Draw main text
    fill(mainColor);
    text(txt, x, y);
    pop();
  }
  
  textAlign(CENTER);
  
  // Title
  fill(255);
  textSize(20);
  drawOutlinedText("Missile Purchase", width / 2, boxY + 30, 20);
  
  // Current info
  fill(220);
  textSize(16);
  drawOutlinedText(`Current Missiles: ${missiles}`, width / 2, boxY + 60, 16);
  drawOutlinedText(`Cost: $${missilePrice} each`, width / 2, boxY + 85, 16);
  
  // Buy buttons
  let buttonWidth = 50;
  let buttonHeight = 30;
  let button1X = boxX + 40;
  let button5X = boxX + boxWidth - 40 - buttonWidth;
  let buttonY = boxY + 100;
  
  // "Buy 1" button
  if (money >= missilePrice) {
    fill(0, 150, 0);  // Green if can afford
  } else {
    fill(100, 100, 100);  // Gray if cannot afford
  }
  rect(button1X, buttonY, buttonWidth, buttonHeight, 5);
  fill(255);
  drawOutlinedText("Buy 1", button1X + buttonWidth / 2, buttonY + buttonHeight / 2 + 5, 14);
  
  // "Buy 5" button
  if (money >= missilePrice * 5) {
    fill(0, 150, 0);  // Green if can afford
  } else {
    fill(100, 100, 100);  // Gray if cannot afford
  }
  rect(button5X, buttonY, buttonWidth, buttonHeight, 5);
  fill(255);
  drawOutlinedText("Buy 5", button5X + buttonWidth / 2, buttonY + buttonHeight / 2 + 5, 14);
}

// Function to draw tower preview
function drawTowerPreview(x, y, towerType) {
  let towerData = towerTypes[towerType];
  
  push(); // Save drawing state
  translate(x, y);
  
  // Draw range indicator with animation
  noFill();
  stroke(towerData.color[0], towerData.color[1], towerData.color[2], 100 + 50 * sin(frameCount * 0.1));
  strokeWeight(2);
  circle(0, 0, towerData.range * 2);
  
  // Draw cone indicator for HPM tower
  if (towerType === 'hpm' && towerData.coneDegrees) {
    // Calculate the angle based on mouse position
    let mouseDirection = atan2(mouseY - y, mouseX - x);
    
    // Draw the cone
    let startAngle = mouseDirection - radians(towerData.coneDegrees / 2);
    let endAngle = mouseDirection + radians(towerData.coneDegrees / 2);
    
    fill(towerData.color[0], towerData.color[1], towerData.color[2], 40);
    arc(0, 0, towerData.range * 2, towerData.range * 2, startAngle, endAngle, PIE);
    
    // Draw direction indicator
    stroke(towerData.color[0], towerData.color[1], towerData.color[2], 150);
    line(0, 0, cos(mouseDirection) * 30, sin(mouseDirection) * 30);
  }
  
  // Draw splash radius for splash tower
  if (towerType === 'hpm' && towerData.splashRadius) {
    stroke(towerData.color[0], towerData.color[1], towerData.color[2], 50 + 20 * sin(frameCount * 0.1));
    strokeWeight(1);
    circle(0, 0, towerData.splashRadius * 2);
  }
  
  strokeWeight(1);
  
  // Semi-transparent tower preview
  if (useImages && towerImages[towerType]) {
    // Use the loaded image with transparency
    imageMode(CENTER);
    let imgSize = cellSize * 0.6 * 1.2; // Adjust size as needed
    tint(255, 180); // Semi-transparent
    image(towerImages[towerType], 0, 0, imgSize, imgSize);
  } else {
    // Fallback to drawing the tower with transparency
    if (towerType === 'jammer') {
      // Jamming tower design
      // Base
      fill(0, 0, 200, 180);
      circle(0, 0, cellSize * 0.6);
      // Antenna structure
      fill(0, 0, 255, 180);
      rect(-cellSize * 0.05, -cellSize * 0.4, cellSize * 0.1, cellSize * 0.4);
      // Dish
      fill(120, 120, 255, 180);
      arc(0, -cellSize * 0.4, cellSize * 0.3, cellSize * 0.3, PI, TWO_PI);
      // Signal waves
      noFill();
      stroke(0, 0, 255, 100 + 80 * sin(frameCount * 0.2));
      arc(0, -cellSize * 0.4, cellSize * 0.5, cellSize * 0.5, -PI/4, PI/4);
      arc(0, -cellSize * 0.4, cellSize * 0.7, cellSize * 0.7, -PI/5, PI/5);
      noStroke();
    } 
    else if (towerType === 'missile') {
      // Missile battery design
      // Base
      fill(128, 0, 0);
      circle(0, 0, cellSize * 0.48);
      // Tower body
      fill(160, 0, 0, 180);
      rect(-cellSize * 0.2, -cellSize * 0.3, cellSize * 0.4, cellSize * 0.3);
      // Long barrel
      fill(50, 50, 50, 180);
      rect(-cellSize * 0.1, -cellSize * 0.6, cellSize * 0.2, cellSize * 0.3);
      // Scope
      fill(70, 70, 70, 180);
      circle(0, -cellSize * 0.7, cellSize * 0.15);
    }
    else if (towerType === 'laser') {
      // Laser tower design
      // Tower base
      fill(0, 100, 200, 180);
      circle(0, 0, cellSize * 0.45);
      
      // High-tech energy core
      let pulseSize = sin(frameCount/15) * 0.1 + 1;
      fill(0, 220, 255, 140);
      circle(0, 0, cellSize * 0.25 * pulseSize);
      
      // Focusing lens
      fill(180, 220, 255);
      circle(0, -cellSize * 0.25, cellSize * 0.16);
      
      // Emitter structure
      fill(0, 160, 200, 180);
      rect(-cellSize * 0.12, -cellSize * 0.4, cellSize * 0.24, cellSize * 0.4);
      
      // Cooling fins
      fill(50, 150, 200, 180);
      rect(-cellSize * 0.25, -cellSize * 0.1, cellSize * 0.08, cellSize * 0.2);
      rect(cellSize * 0.17, -cellSize * 0.1, cellSize * 0.08, cellSize * 0.2);
      
      // Energy beam effect
      if (frameCount % 30 < 15) {
        stroke(0, 240, 255, 150);
        strokeWeight(2);
        line(0, -cellSize * 0.25, 0, -cellSize * 0.7);
        strokeWeight(1);
        noStroke();
      }
    }
    else if (towerType === 'hpm') {
      // HPM tower preview
      // Base
      fill(128, 0, 128, 180);
      circle(0, 0, cellSize * 0.48);
      
      // Calculate the angle for preview based on mouse position
      let mouseDirection = atan2(mouseY - y, mouseX - x);
      
      // Microwave emitter dish
      fill(150, 0, 150, 180);
        push();
      rotate(mouseDirection - PI/2); // Rotate dish toward mouse
      ellipse(0, 0, cellSize * 0.4, cellSize * 0.25);
      
      // Dish core
      fill(200, 100, 200, 180);
      ellipse(0, 0, cellSize * 0.25, cellSize * 0.15);
        pop();
      
      // Energy pulses in cone direction
      noFill();
      let startAngle = mouseDirection - PI/4;
      let endAngle = mouseDirection + PI/4;
      
      for (let i = 0; i < 2; i++) {
        stroke(200, 100, 200, 100 + 50 * sin(frameCount * 0.1 + i));
        strokeWeight(1);
        arc(0, 0, cellSize * (0.6 + i * 0.2), cellSize * (0.6 + i * 0.2), startAngle, endAngle);
      }
      noStroke();
    }
  }
  
  // Add a "Preview" text above
  fill(0);
  stroke(255);
  strokeWeight(2);
  textAlign(CENTER);
  textSize(cellSize * 0.25);
  text("PREVIEW", 0, -cellSize * 0.8);
  
  // Draw text with more contrast
  strokeWeight(3);
  stroke(0);
  fill(255, 255, 0);
  text("PREVIEW", 0, -cellSize * 0.8);
  
  noStroke();
  pop(); // Restore drawing state
}

// Draw the tower selection UI
function drawTowerSelectionUI() {
  // Only show tower selection UI during waves
  if (!waveInProgress) {
    return;
  }

  let startX = width - 140;
  let startY = 30;
  let spacing = 35;
  let boxWidth = 130;
  let boxHeight = 30;

  // Helper function for drawing outlined text
  function drawOutlinedText(txt, x, y, size, mainColor = 255, outlineColor = 0, outlineSize = 1) {
    push();
    textSize(size);
    
    // Draw outline
    fill(outlineColor);
    text(txt, x - outlineSize, y);
    text(txt, x + outlineSize, y);
    text(txt, x, y - outlineSize);
    text(txt, x, y + outlineSize);
    
    // Draw main text
    fill(mainColor);
    text(txt, x, y);
    pop();
  }
  
  // Draw the title with improved visibility
  fill(50);
  rect(startX - 10, 0, boxWidth + 20, startY + (Object.keys(towerTypes).length - 1) * spacing);
  
  // Draw the title using simple text (no outline) for consistent appearance
  textAlign(LEFT);
  textSize(14);
  fill(255);
  text("Tower Types:", startX, startY + 12);

  // Count how many tower types we're showing (excluding missile)
  let visibleTowerCount = 0;
  for (let type in towerTypes) {
    if (type !== 'missile') {
      visibleTowerCount++;
    }
  }
  
  // Draw each tower type
  let index = 0;
  for (let type in towerTypes) {
    // Skip the missile tower in selection
    if (type === 'missile') {
      continue;
    }
    
    let tower = towerTypes[type];
    let y = startY + (index * spacing);
    
    // Draw a selection box
    if (selectedTowerType === type) {
      fill(tower.color[0], tower.color[1], tower.color[2], 100); // Highlight selected tower
    } else {
      fill(200, 200, 200, 100); // Semi-transparent for others
    }
    rect(startX, y, boxWidth, boxHeight, 5);
    
    // Draw tower icon
    if (useImages && towerImages[type]) {
      imageMode(CENTER);
      image(towerImages[type], startX + 10, y + boxHeight/2, boxHeight * 0.7, boxHeight * 0.7);
    } else {
      // Draw simple icon representing tower type
      push();
    noStroke();
      translate(startX + 10, y + boxHeight/2);
      scale(0.4);
      if (type === 'jammer') {
        fill(0, 0, 200);
        circle(0, 0, 20);
        fill(100, 100, 255);
        rect(-2, -12, 4, 12);
      } else if (type === 'laser') {
        fill(0, 128, 128);
        circle(0, 0, 20);
      fill(0, 200, 200);
        rect(-5, -8, 10, 5);
      } else if (type === 'hpm') {
        fill(128, 0, 128);
        circle(0, 0, 20);
      fill(200, 100, 200);
        circle(0, 0, 12);
      }
      pop();
    }
    
    // Draw tower name and cost with simple text (no outline) for consistent appearance
    fill(255);
    textSize(12);
    text(`${tower.name} [$${tower.cost}]`, startX + 20, y + 10);
    
    // Add tower stats with simple text (no outline) for consistent appearance
    let keyNumber = index + 1;
    textSize(11);
    text(`DMG: ${tower.damage} [${keyNumber}]`, startX + 20, y + 22);
    
    index++;
  }
  
  // Add instructions for missile targeting
  fill(200, 200, 200, 180);
  rect(startX, startY + 15 + (visibleTowerCount * spacing), boxWidth, 20, 5);
  
  // Use simple text (no outline) for consistent appearance
  textSize(10);
  fill(255);
  textAlign(CENTER);
  text("Press SPACE for missile targeting", startX + boxWidth/2, startY + 15 + (visibleTowerCount * spacing) + 12);
  textAlign(LEFT);
}

// **Handle mouse interactions**
function mousePressed() {
  if (gameOver || waveCompleted) {
    // Check if the restart button was clicked
    let buttonWidth = 150 * scaleFactor;
    let buttonHeight = 40 * scaleFactor;
    let statsY = height / 2 + 120 * scaleFactor;
    
    if (mouseX > width / 2 - buttonWidth / 2 && 
        mouseX < width / 2 + buttonWidth / 2 && 
        mouseY > statsY && 
        mouseY < statsY + buttonHeight) {
      resetGame();
    }
    return;
  }

  // Check for "Start Wave" button click
  if (!waveInProgress && mouseY > height - 50 && mouseY < height - 10 &&
      mouseX > width / 2 - 75 && mouseX < width / 2 + 75) {
    startWave();
    return;
  }
  
  // Check for missile purchase buttons click
  if (!waveInProgress) {
    let boxWidth = 200;
    let boxHeight = 150;
    let boxX = width / 2 - boxWidth / 2;
    let boxY = height / 3 - boxHeight / 2;
    let buttonWidth = 50;
    let buttonHeight = 30;
    let button1X = boxX + 40;
    let button5X = boxX + boxWidth - 40 - buttonWidth;
    let buttonY = boxY + 100;
    
    // Buy 1 missile
    if (mouseX > button1X && mouseX < button1X + buttonWidth &&
        mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      if (money >= missilePrice) {
        money -= missilePrice;
        missiles += 1;
      }
      return;
    }
    
    // Buy 5 missiles
    if (mouseX > button5X && mouseX < button5X + buttonWidth &&
        mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      if (money >= missilePrice * 5) {
        money -= missilePrice * 5;
        missiles += 5;
      }
      return;
    }
  }
  
  // Check for direct enemy targeting if we have missiles and are in targeting mode
  if (baseTower && missiles > 0 && baseTower.targeting) {
    // Check if any enemy is clicked
    for (let enemy of enemies) {
      let d = dist(mouseX, mouseY, enemy.pos.x, enemy.pos.y);
      if (d < enemy.size * 1.5) {
        // Fire directly at the clicked enemy
        baseTower.launchMissile(enemy);
        return;
      }
    }
    
    // If in targeting mode and clicked on base tower, exit targeting mode
    let d = dist(mouseX, mouseY, baseTower.pos.x, baseTower.pos.y);
    if (d < baseTower.size) {
      baseTower.targeting = false; // Toggle targeting mode off
      selectedEnemy = null; // Clear any selected enemy
      return;
    }
    
    // If in targeting mode and clicked elsewhere, don't exit - stay in targeting mode
    return;
  }
  
  // Start targeting mode when clicking on the base tower (if not already targeting)
  if (baseTower && missiles > 0 && !baseTower.targeting) {
    let d = dist(mouseX, mouseY, baseTower.pos.x, baseTower.pos.y);
    if (d < baseTower.size) {
      baseTower.targeting = true; // Enter targeting mode
      selectedEnemy = null; // Clear any selected enemy
      return;
    }
  }
  
  // Only allow tower selection and placement during waves
  if (waveInProgress) {
  // Tower selection UI clicks
  let startX = width - 140;
  let startY = 30;
  let spacing = 35;
  let boxWidth = 130;
  let boxHeight = 30;
  
  let index = 0;
    let towerKeys = Object.keys(towerTypes).filter(type => type !== 'missile');
    
    for (let i = 0; i < towerKeys.length; i++) {
      let type = towerKeys[i];
      let y = startY + (i * spacing);
    
    if (mouseX >= startX && mouseX <= startX + boxWidth && 
        mouseY >= y && mouseY <= y + boxHeight) {
      selectedTowerType = type;
      // Exit targeting mode if we select a tower
      if (baseTower) {
        baseTower.targeting = false;
      }
      return;
    }
  }

    // Handle tower placement
    if (!baseTower || !baseTower.targeting) {
    let mx = floor(mouseX / cellSize);
    let my = floor(mouseY / cellSize);
    if (mx >= 0 && mx < gridSize && my >= 0 && my < gridSize && grid[mx][my] === 'empty') {
      // Check if we have enough money
      let towerType = towerTypes[selectedTowerType];
      if (money >= towerType.cost) {
        // Ensure we're not too close to the base
        let baseGridX = floor(base.x / cellSize);
        let baseGridY = floor(base.y / cellSize);
        let tooCloseToBase = (mx >= baseGridX - 1 && mx <= baseGridX + 1 && 
                            my >= baseGridY - 1 && my <= baseGridY + 1);
        
        if (!tooCloseToBase) {
          let x = mx * cellSize + cellSize/2; // Center of the cell
          let y = my * cellSize + cellSize/2;
          let tower = new Tower(x, y, selectedTowerType);
          towers.push(tower);
          grid[mx][my] = 'tower';
          money -= towerType.cost; // Deduct the cost
          gameStats.towersBuilt++; // Track tower built
          }
        }
      }
    }
  }
}

// Handle keyboard shortcuts for tower selection
function keyPressed() {
  // Number keys to select tower type
  if (key === '1') {
    if (baseTower) {
      baseTower.targeting = false;
    }
    selectedTowerType = 'jammer';
    message = `Selected ${towerTypes[selectedTowerType].name}`;
    messageTime = millis();
  } else if (key === '2') {
    if (baseTower) {
      baseTower.targeting = false;
    }
    selectedTowerType = 'laser';
    message = `Selected ${towerTypes[selectedTowerType].name}`;
    messageTime = millis();
  } else if (key === '3') {
    if (baseTower) {
      baseTower.targeting = false;
    }
    selectedTowerType = 'hpm';
    message = `Selected ${towerTypes[selectedTowerType].name}`;
    messageTime = millis();
  }
  
  // SPACE to enter targeting mode (if we have missiles)
  if (key === ' ' && missiles > 0 && baseTower) {
    baseTower.targeting = !baseTower.targeting;
    selectedEnemy = null; // Clear selected enemy
  }
  
  // 'i' to toggle between drawn sprites and image sprites
  if (key === 'i') {
    useImages = !useImages;
    message = useImages ? "Using image sprites" : "Using drawn sprites";
    messageTime = millis();
  }
  
  // 'q' - Test function - spawn test enemy
  if (key === 'q') {
    // Create a test enemy near the base for testing weapons
    let testEnemy = new Enemy(1, 'fixed_wing');
    testEnemy.pos.x = base.x - 100;
    testEnemy.pos.y = base.y - 100;
    enemies.push(testEnemy);
  }
}

// Reset the game to initial state
function resetGame() {
  grid = [];
  enemies = [];
  towers = [];
  projectiles = [];
  currentWave = 1;
  enemiesToSpawn = enemiesPerWave;
  waveInProgress = false;
  waveCompleted = false;
  gameOver = false;
  money = 200;
  selectedTowerType = 'jammer'; // Default selected tower type
  missiles = 5; // Reset missiles to starting amount
  selectedEnemy = null;
  
  // Reset game statistics
  gameStats = {
    enemiesKilled: 0,
    moneyEarned: 0,
    towersBuilt: 0,
    wavesCompleted: 0,
    startTime: millis(),
    gameTime: 0
  };
  
  // Reinitialize the grid
  for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = 'empty';
    }
  }
  
  // Mark base area in the grid and recreate base tower
  let baseGridX = floor(base.x / cellSize);
  let baseGridY = floor(base.y / cellSize);
  
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      let gridX = baseGridX + i;
      let gridY = baseGridY + j;
      if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
        grid[gridX][gridY] = 'base';
      }
    }
  }
  
  // Recreate the base tower
  baseTower = new BaseTower(base.x, base.y);
}

// **Spawn a new enemy**
function spawnEnemy() {
  let enemyType;
  
  // For wave 1, ensure we get one of each type in the first 4 spawns
  if (currentWave === 1 && enemiesToSpawn > enemiesPerWave - 4) {
    let spawnIndex = enemiesPerWave - enemiesToSpawn;
    switch(spawnIndex) {
      case 0:
        enemyType = 'fixed_wing';
        break;
      case 1:
        enemyType = 'fpv';
        break;
      case 2:
        enemyType = 'group_3';
        break;
      case 3:
        enemyType = 'group_5';
        break;
      default:
        // For remaining enemies in wave 1, use normal distribution
        let rand = random();
        if (rand < 0.4) {
          enemyType = 'fixed_wing';
        } else if (rand < 0.7) {
          enemyType = 'fpv';
        } else if (rand < 0.9) {
          enemyType = 'group_3';
        } else {
          enemyType = 'group_5';
        }
    }
  } else {
    // Original spawn logic for other waves
    let rand = random();
    if (currentWave >= 5 && rand < 0.15) {
      // 15% chance for Group 5 in wave 5+
      enemyType = 'group_5';
    } else if (currentWave >= 3 && rand < 0.3) {
      // 30% chance for Group 3 in wave 3+
      enemyType = 'group_3';
    } else if (rand < 0.4) {
      // 40% chance for FPV
      enemyType = 'fpv';
    } else {
      // Default fixed wing enemy
      enemyType = 'fixed_wing';
    }
  }
  
  let enemy = new Enemy(currentWave, enemyType);
  enemies.push(enemy);
}

// **Enemy class**
class Enemy {
  constructor(wave, type) {
    // Spawn on the left side of the screen at random height
    this.pos = createVector(0, random(height * 0.1, height * 0.9));
    this.type = type;
    
    let enemyData = enemyTypes[type];
    
    // Scale difficulty with wave number
    let baseSpeed = (20 + (wave * 2)) * scaleFactor; // Scale speed with window size
    let baseHealth = 10 + (wave * 3);
    
    this.speed = baseSpeed * enemyData.speedMod;
    this.health = baseHealth * enemyData.healthMod;
    this.maxHealth = this.health;
    this.hitTime = 0;
    
    // Base size is now relative to cell size
    this.size = (cellSize * 0.4) * enemyData.sizeMod; // 40% of cell size
    this.value = enemyReward * enemyData.value + Math.floor(wave * 2);
    this.shape = enemyData.shape;
    
    this.color = color(enemyData.color[0], enemyData.color[1], enemyData.color[2]);
  }

  update() {
    // Move directly toward the base
    let target = createVector(base.x, base.y);
    let dir = p5.Vector.sub(target, this.pos);
    let distance = dir.mag();
    let moveAmount = this.speed * (deltaTime / 1000);
    
    // Only move if not already at the base
    if (distance > this.size + base.size/2) {
      dir.normalize().mult(moveAmount);
      this.pos.add(dir);
    }
  }

  // Check if enemy has collided with the base
  checkBaseCollision() {
    let d = dist(this.pos.x, this.pos.y, base.x, base.y);
    return d < (this.size + base.size/2);
  }

  draw() {
    push(); // Save the current drawing state
    translate(this.pos.x, this.pos.y);
    
    if (millis() - this.hitTime < 100) {
      fill(255, 165, 0); // Orange when hit
      tint(255, 165, 0); // Orange tint for images when hit
    } else {
      fill(this.color);
      tint(255); // Normal tint for images
    }
    
    // Get the angle for rotation - now pointing toward the base
    let angle = atan2(base.y - this.pos.y, base.x - this.pos.x);
    
    // Check if we have an image for this enemy type
    if (useImages && enemyImages[this.type] && enemyImages[this.type].width > 0) {
      // Use the loaded image
      imageMode(CENTER);
      
      // Apply special handling for fpv type
      if (this.type === 'fpv') {
        // Don't rotate the fpv image
        let imgSize = this.size * 10; // 5x larger in each dimension
        image(enemyImages[this.type], 0, 0, imgSize, imgSize);
      } else if (this.type === 'fixed_wing') {
        // Special handling for fixed_wing type
        // Rotate 180 degrees to face forward + direction of travel
        rotate(angle + PI*1.5);
        let imgSize = this.size * 6; // 3x larger in each dimension
        image(enemyImages[this.type], 0, 0, imgSize, imgSize);
      } else {
        // Rotate other enemy types to face direction of travel
        rotate(angle + PI/2);
        let imgSize = this.size * 2; // Normal size for other enemy types
        image(enemyImages[this.type], 0, 0, imgSize, imgSize);
      }
    } else {
      // Fallback to drawing the enemy
      if (this.type === 'fixed_wing') {
        // Fixed-wing drone design (top-down view)
        push();
        // Apply the calculated angle
        rotate(angle + PI/2); // Rotate 90 degrees so nose faces direction of travel
        
        let droneSize = this.size * scaleFactor;
        
        // Main wings (thinner with slight sweep)
        fill(245); // Light gray for wings
        beginShape();
        // Left wing
        vertex(-droneSize * 1.2, 0);           // Wing tip
        vertex(-droneSize * 1.1, -droneSize * 0.15); // Leading edge
        vertex(-droneSize * 0.25, -droneSize * 0.15); // Wing root
        vertex(-droneSize * 0.2, 0);          // Trailing edge root
        vertex(-droneSize * 1.0, droneSize * 0.2);  // Trailing edge tip
        endShape(CLOSE);
        
        // Right wing (mirror of left)
        beginShape();
        vertex(droneSize * 1.2, 0);            // Wing tip
        vertex(droneSize * 1.1, -droneSize * 0.15);  // Leading edge
        vertex(droneSize * 0.25, -droneSize * 0.15);  // Wing root
        vertex(droneSize * 0.2, 0);           // Trailing edge root
        vertex(droneSize * 1.0, droneSize * 0.2);   // Trailing edge tip
        endShape(CLOSE);
        
        // Central fuselage (slightly thicker)
        fill(235); // Slightly darker for body
        // Main body
        rect(-droneSize * 0.2, -droneSize * 0.8, droneSize * 0.4, droneSize * 1.4, droneSize * 0.1);
        
        // Nose cone
        fill(220);
        arc(0, -droneSize * 0.8, droneSize * 0.4, droneSize * 0.25, PI, TWO_PI);
        
        // Propeller animation (faster rotation)
        push();
        translate(0, -droneSize * 0.8);
        rotate(frameCount * 1.5); // Increased rotation speed
        fill(40);
        // Thinner propeller blades
        rect(-droneSize * 0.8, -droneSize * 0.03, droneSize * 1.6, droneSize * 0.06);
        rect(-droneSize * 0.03, -droneSize * 0.8, droneSize * 0.06, droneSize * 1.6);
        // Hub
        fill(30);
        circle(0, 0, droneSize * 0.1);
        pop();
        
        // Tail section
        fill(245);
        // Vertical stabilizer (taller, thinner)
        beginShape();
        vertex(0, droneSize * 0.5);          // Base
        vertex(0, droneSize * 0.7);          // Top
        vertex(droneSize * 0.15, droneSize * 0.5); // Back
        endShape(CLOSE);
        
        // Equipment and details
        // Camera/sensor housing (center underside)
        fill(40);
        ellipse(0, 0, droneSize * 0.25, droneSize * 0.15);
        // Sensor lens
        fill(20);
        circle(0, 0, droneSize * 0.1);
        
        // Navigation lights
        fill(255, 0, 0, 200); // Red light (left)
        circle(-droneSize * 1.1, 0, droneSize * 0.06);
        fill(0, 255, 0, 200); // Green light (right)
        circle(droneSize * 1.1, 0, droneSize * 0.06);
        
        // Wing details
        stroke(200);
        strokeWeight(droneSize * 0.02);
        // Control surfaces
        line(-droneSize * 0.9, droneSize * 0.1, -droneSize * 0.4, droneSize * 0.05);
        line(droneSize * 0.4, droneSize * 0.05, droneSize * 0.9, droneSize * 0.1);
        noStroke();
        
        // Solar panels or sensor arrays on wings (thinner)
        fill(30, 30, 50, 100);
        rect(-droneSize * 0.8, -droneSize * 0.1, droneSize * 0.2, droneSize * 0.15);
        rect(droneSize * 0.6, -droneSize * 0.1, droneSize * 0.2, droneSize * 0.15);
        
        pop();
      } 
      else if (this.type === 'fpv') {
        // FPV Drone design
        push();
        // Apply the calculated angle
        rotate(angle + PI/4); // Rotate 45 degrees to make it diamond-shaped
        
        // Scale all sizes by scaleFactor
        let droneSize = this.size * scaleFactor;
        
        // Main body - X frame
        fill(40); // Dark gray for frame
        // Draw X frame using two rectangles
        rect(-droneSize/2, -droneSize/8, droneSize, droneSize/4); // Horizontal arm
        rect(-droneSize/8, -droneSize/2, droneSize/4, droneSize); // Vertical arm
        
        // Center hub
        fill(60);
        circle(0, 0, droneSize/2);
        
        // Flight controller with LED
        fill(20);
        rect(-droneSize/6, -droneSize/6, droneSize/3, droneSize/3);
        // LED indicator
        fill(255, 0, 0);
        circle(0, 0, droneSize/6);
        
        // Propellers - spinning animation
        fill(100);
        let propTime = frameCount * 0.5;
        for (let i = 0; i < 4; i++) {
          push();
          translate(cos(i * PI/2) * droneSize/2, sin(i * PI/2) * droneSize/2);
          rotate(propTime + i * PI/2);
          // Draw propeller blades
          ellipse(0, 0, droneSize/3, droneSize/20);
          ellipse(0, 0, droneSize/20, droneSize/3);
          // Propeller hub
          fill(30);
          circle(0, 0, droneSize/10);
          pop();
        }
        
        // FPV Camera housing
        fill(30);
        rect(-droneSize/4, -droneSize/4, droneSize/2, droneSize/3);
        // Camera lens
        fill(0);
        circle(0, -droneSize/6, droneSize/4);
        // Camera tilt
        stroke(30);
        strokeWeight(droneSize/16);
        line(-droneSize/4, -droneSize/6, droneSize/4, -droneSize/6);
        noStroke();
        
        pop();
      }
      else if (this.type === 'group_3') {
        // Flying wing stealth design
        push();
        // Apply the calculated angle
        rotate(angle + PI/2);
        
        let droneSize = this.size * scaleFactor;
        
        // Main wing body (dark gray with slight metallic tint)
        fill(40, 45, 50);
        beginShape();
        // Center point (nose)
        vertex(0, -droneSize * 0.8);
        // Right wing
        vertex(droneSize * 1.3, droneSize * 0.4);
        // Right wing tip
        vertex(droneSize * 1.1, droneSize * 0.5);
        // Rear edge right
        vertex(droneSize * 0.3, droneSize * 0.2);
        // Center rear
        vertex(0, droneSize * 0.4);
        // Rear edge left
        vertex(-droneSize * 0.3, droneSize * 0.2);
        // Left wing tip
        vertex(-droneSize * 1.1, droneSize * 0.5);
        // Left wing
        vertex(-droneSize * 1.3, droneSize * 0.4);
        endShape(CLOSE);
        
        // Surface detail lines (showing panel sections)
        stroke(60, 65, 70);
        strokeWeight(droneSize * 0.02);
        // Wing panel lines
        line(-droneSize * 0.9, droneSize * 0.2, -droneSize * 0.2, -droneSize * 0.3);
        line(droneSize * 0.9, droneSize * 0.2, droneSize * 0.2, -droneSize * 0.3);
        // Center body lines
        line(-droneSize * 0.2, -droneSize * 0.3, 0, -droneSize * 0.6);
        line(droneSize * 0.2, -droneSize * 0.3, 0, -droneSize * 0.6);
        noStroke();
        
        // Engine intakes (darker recessed areas)
        fill(30, 35, 40);
        // Left intake
        beginShape();
        vertex(-droneSize * 0.8, droneSize * 0.2);
        vertex(-droneSize * 0.6, droneSize * 0.1);
        vertex(-droneSize * 0.4, droneSize * 0.15);
        vertex(-droneSize * 0.6, droneSize * 0.25);
        endShape(CLOSE);
        // Right intake
        beginShape();
        vertex(droneSize * 0.8, droneSize * 0.2);
        vertex(droneSize * 0.6, droneSize * 0.1);
        vertex(droneSize * 0.4, droneSize * 0.15);
        vertex(droneSize * 0.6, droneSize * 0.25);
        endShape(CLOSE);
        
        // Sensor arrays and equipment
        fill(20, 25, 30);
        // Central sensor dome
        ellipse(0, -droneSize * 0.3, droneSize * 0.3, droneSize * 0.2);
        // Wing sensors
        circle(-droneSize * 0.9, droneSize * 0.1, droneSize * 0.15);
        circle(droneSize * 0.9, droneSize * 0.1, droneSize * 0.15);
        
        // Stealth coating patterns (subtle angular sections)
        fill(45, 50, 55, 100);
        beginShape();
        vertex(-droneSize * 0.6, 0);
        vertex(-droneSize * 0.3, -droneSize * 0.2);
        vertex(0, 0);
        vertex(-droneSize * 0.4, droneSize * 0.2);
        endShape(CLOSE);
        beginShape();
        vertex(droneSize * 0.6, 0);
        vertex(droneSize * 0.3, -droneSize * 0.2);
        vertex(0, 0);
        vertex(droneSize * 0.4, droneSize * 0.2);
        endShape(CLOSE);
        
        // Navigation lights (very subtle due to stealth)
        fill(255, 0, 0, 50); // Dim red
        circle(-droneSize * 1.1, droneSize * 0.3, droneSize * 0.08);
        fill(0, 255, 0, 50); // Dim green
        circle(droneSize * 1.1, droneSize * 0.3, droneSize * 0.08);
        
        // Exhaust ports (subtle glow effect)
        fill(60, 60, 60, 100);
        rect(-droneSize * 0.5, droneSize * 0.3, droneSize * 0.2, droneSize * 0.08, droneSize * 0.04);
        rect(droneSize * 0.3, droneSize * 0.3, droneSize * 0.2, droneSize * 0.08, droneSize * 0.04);
        // Exhaust glow
        fill(80, 80, 80, 50);
        rect(-droneSize * 0.45, droneSize * 0.32, droneSize * 0.15, droneSize * 0.04, droneSize * 0.02);
        rect(droneSize * 0.35, droneSize * 0.32, droneSize * 0.15, droneSize * 0.04, droneSize * 0.02);
        
        pop();
      }
      else if (this.type === 'group_5') {
        // Intimidating boss design
        fill(50); // Dark gray
        // Main body - larger pentagon
        beginShape();
        vertex(0, -this.size/1.5); // Top
        vertex(this.size/1.5, -this.size/3); // Upper right
        vertex(this.size/2, this.size/2); // Lower right
        vertex(-this.size/2, this.size/2); // Lower left
        vertex(-this.size/1.5, -this.size/3); // Upper left
        endShape(CLOSE);
        // Armor plates
        fill(70);
        rect(-this.size/2, 0, this.size, this.size/4);
        rect(-this.size/3, -this.size/2, this.size/1.5, this.size/4);
        // Glowing eyes
        fill(255, 0, 0);
        circle(-this.size/4, -this.size/3, this.size/4);
        circle(this.size/4, -this.size/3, this.size/4);
        // Inner glow
        fill(255, 100, 100);
        circle(-this.size/4, -this.size/3, this.size/8);
        circle(this.size/4, -this.size/3, this.size/8);
      }
    }
    
    // Health bar
    let barHeight = max(3 * scaleFactor, 2);
    let barYOffset = -this.size * 1.2;
    // Black background
    fill(0, 0, 0);
    rect(-this.size/2, barYOffset, this.size, barHeight);
    // Green health bar
    fill(map(this.health, 0, this.maxHealth, 255, 0), map(this.health, 0, this.maxHealth, 0, 255), 0);
    let healthWidth = map(this.health, 0, this.maxHealth, 0, this.size);
    rect(-this.size/2, barYOffset, healthWidth, barHeight);
    
    pop(); // Restore the drawing state
  }
}

// **Tower class**
class Tower {
  constructor(x, y, type) {
    this.pos = createVector(x, y);
    this.type = type;
    
    let towerData = towerTypes[type];
    this.range = towerData.range;
    this.attackSpeed = towerData.attackSpeed;
    this.damage = towerData.damage;
    this.cost = towerData.cost;
    this.color = towerData.color;
    this.name = towerData.name;
    
    this.splashRadius = towerData.splashRadius || 0;
    this.lastShot = 0;
    this.size = cellSize * 0.6; // Scale tower size with cell size
    
    // Track affected enemies for the jamming tower
    this.jammingTargets = [];
    
    // HPM tower specific properties
    if (this.type === 'hpm') {
      this.hpmTarget = null;              // Current target enemy
      this.coneAngle = 0;                 // Direction the cone is facing
      this.coneDegrees = towerData.coneDegrees || 90; // Width of cone in degrees
      this.coneRadians = this.coneDegrees * PI / 180; // Width in radians
      this.dotDamage = towerData.dotDamage || false;  // Damage over time flag
      this.affectedEnemies = [];          // Enemies in the cone
      this.pulseTime = 0;                 // Time for visual effect
    }
  }

  update() {
    if (this.type === 'jammer') { // Jamming tower behavior
      // Clear old targets that are no longer valid
      this.jammingTargets = this.jammingTargets.filter(target => 
        enemies.includes(target) && 
        p5.Vector.dist(this.pos, target.pos) < this.range);
      
      // Find new targets
      for (let enemy of enemies) {
        // Only target fpv and fixed_wing enemies
        if ((enemy.type === 'fpv' || enemy.type === 'fixed_wing') &&
            !this.jammingTargets.includes(enemy)) {
          let d = p5.Vector.dist(this.pos, enemy.pos);
          if (d < this.range) {
            this.jammingTargets.push(enemy);
          }
        }
      }
      
      // Apply damage to all current targets
      if (millis() - this.lastShot > this.attackSpeed) {
        for (let target of this.jammingTargets) {
          if (target.type === 'fpv' || target.type === 'fixed_wing') {
            // Create jamming visual effect
            let effect = new JammingEffect(target.pos.x, target.pos.y, target);
            projectiles.push(effect);
            
            // Slow damage over time
            target.health -= this.damage;
            target.hitTime = millis();
            
            // Check if enemy is dead
            if (target.health <= 0) {
              // Add money reward for killing the enemy
              money += target.value;
              gameStats.moneyEarned += target.value;
              gameStats.enemiesKilled++;
              
              // Remove the enemy
              let index = enemies.indexOf(target);
              if (index !== -1) {
                enemies.splice(index, 1);
              }
              
              // Reset selected enemy if it was removed
              if (selectedEnemy === target) {
                selectedEnemy = null;
                if (baseTower) {
                  baseTower.targeting = false;
                }
              }
            }
          }
        }
        this.lastShot = millis();
      }
    } 
    else if (this.type === 'hpm') { // HPM Tower behavior
      // Find a target if we don't have one or if the current target is gone
      if (!this.hpmTarget || !enemies.includes(this.hpmTarget) || 
          p5.Vector.dist(this.pos, this.hpmTarget.pos) > this.range) {
        
        // Target the closest enemy
        let minDist = Infinity;
        for (let enemy of enemies) {
          let d = p5.Vector.dist(this.pos, enemy.pos);
          if (d < this.range && d < minDist) {
            minDist = d;
            this.hpmTarget = enemy;
          }
        }
      }
      
      // If we have a target, update cone direction and find enemies in the cone
      if (this.hpmTarget) {
        // Calculate angle to target
        let dx = this.hpmTarget.pos.x - this.pos.x;
        let dy = this.hpmTarget.pos.y - this.pos.y;
        this.coneAngle = atan2(dy, dx);
        
        // Clear old affected enemies list
        this.affectedEnemies = [];
        
        // Find all enemies in the cone
        for (let enemy of enemies) {
          let d = p5.Vector.dist(this.pos, enemy.pos);
          
          // Check if in range
          if (d <= this.range) {
            // Calculate angle to this enemy
            let enemyDx = enemy.pos.x - this.pos.x;
            let enemyDy = enemy.pos.y - this.pos.y;
            let enemyAngle = atan2(enemyDy, enemyDx);
            
            // Calculate the angular difference 
            let angleDiff = abs(this.coneAngle - enemyAngle);
            
            // Normalize to handle angle wrapping
            if (angleDiff > PI) {
              angleDiff = TWO_PI - angleDiff;
            }
            
            // Check if enemy is in the cone
            if (angleDiff <= this.coneRadians / 2) {
              this.affectedEnemies.push(enemy);
            }
          }
        }
        
        // Apply damage over time to all enemies in the cone at the attack speed rate
        if (millis() - this.lastShot > this.attackSpeed) {
          for (let enemy of this.affectedEnemies) {
            enemy.health -= this.damage;
            enemy.hitTime = millis();
            
            // Create visual effect
            this.pulseTime = millis();
            
            // Check if enemy is dead
            if (enemy.health <= 0) {
              // Add money reward for killing the enemy
              money += enemy.value;
              gameStats.moneyEarned += enemy.value;
              gameStats.enemiesKilled++;
              
              // Remove the enemy
              let index = enemies.indexOf(enemy);
              if (index !== -1) {
                enemies.splice(index, 1);
              }
              
              // Reset selected enemy if it was removed
              if (selectedEnemy === enemy) {
                selectedEnemy = null;
                if (baseTower) {
                  baseTower.targeting = false;
                }
              }
              
              // Reset hpmTarget if it was killed
              if (this.hpmTarget === enemy) {
                this.hpmTarget = null;
              }
            }
          }
          this.lastShot = millis();
        }
      }
    }
    else {
      // Original behavior for other tower types
      if (millis() - this.lastShot > this.attackSpeed) {
        let target = null;
        
        // Different targeting strategies based on tower type
        if (this.type === 'laser') {
          // Missile battery targets the enemy with the highest health
          let maxHealth = -1;
          for (let enemy of enemies) {
            let d = p5.Vector.dist(this.pos, enemy.pos);
            if (d < this.range && enemy.health > maxHealth) {
              maxHealth = enemy.health;
              target = enemy;
            }
          }
        } else {
          // Other towers target the closest enemy
          let minDist = Infinity;
          for (let enemy of enemies) {
            let d = p5.Vector.dist(this.pos, enemy.pos);
            if (d < this.range && d < minDist) {
              minDist = d;
              target = enemy;
            }
          }
        }
        
        if (target) {
          this.shoot(target);
          this.lastShot = millis();
        }
      }
    }
  }

  shoot(enemy) {
    // Create a projectile with appropriate parameters
    let proj = new Projectile(this.pos.x, this.pos.y, enemy, this.damage, this.type, this.splashRadius);
    projectiles.push(proj);
  }

  draw() {
    push(); // Save drawing state
    translate(this.pos.x, this.pos.y);
    
    // Draw range indicator (lighter for actual towers)
    noFill();
    stroke(this.color[0], this.color[1], this.color[2], 30);
    circle(0, 0, this.range * 2);
    noStroke();
    
    // Check if we have an image for this tower type
    if (useImages && towerImages[this.type]) {
      // Use the loaded image
      imageMode(CENTER);
      let imgSize = this.size * 1.2; // Adjust size as needed
      image(towerImages[this.type], 0, 0, imgSize, imgSize);
    } else {
      // Fallback to drawing the tower
      if (this.type === 'jammer') {
        // Jamming tower design
        // Base
        fill(0, 0, 200);
        circle(0, 0, this.size);
        // Antenna structure
        fill(0, 0, 255);
        rect(-this.size/12, -this.size/2, this.size/6, this.size/2);
        // Dish
        fill(120, 120, 255);
        arc(0, -this.size/2, this.size/2, this.size/2, PI, TWO_PI);
        
        // Signal waves (animated)
        if (this.jammingTargets.length > 0) {
          noFill();
        for (let i = 0; i < 3; i++) {
            let alpha = map(sin(frameCount * 0.1 + i), -1, 1, 50, 150);
            stroke(100, 100, 255, alpha);
            let waveSize = this.size/2 + i * this.size/4 + sin(frameCount * 0.05) * this.size/8;
            arc(0, -this.size/2, waveSize, waveSize, -PI/3, PI/3);
          }
          noStroke();
        }
      }
      else if (this.type === 'laser') {
        // Laser tower design (replaced rapid-fire tower)
        // Tower base
        fill(0, 100, 200);
        circle(0, 0, this.size);
        
        // High-tech energy core
        let pulseSize = sin(frameCount/15) * 0.1 + 1;
        fill(0, 220, 255, 140);
        circle(0, 0, this.size/2 * pulseSize);
        
        // Focusing lens
        fill(180, 220, 255);
        circle(0, -this.size/2, this.size/3);
        
        // Emitter structure
        fill(0, 160, 200);
        rect(-this.size/5, -this.size/2 - this.size/4, this.size/2.5, this.size/2);
        
        // Cooling fins
        fill(50, 150, 200);
        rect(-this.size/2.5, -this.size/5, this.size/8, this.size/2.5);
        rect(this.size/3, -this.size/5, this.size/8, this.size/2.5);
        
        // Energy beam effect
        if (frameCount % 30 < 15) {
          stroke(0, 240, 255, 150);
          strokeWeight(2);
          line(0, -this.size/2, 0, -this.size * 1.2);
          strokeWeight(1);
          noStroke();
        }
      }
      else if (this.type === 'hpm') {
        // HPM Tower design
        // Base with microwave dish
        fill(128, 0, 128);
        circle(0, 0, this.size);
        
        // Always draw the cone 
        // Calculate the start and end angles for the cone
        let startAngle = this.coneAngle - this.coneRadians / 2;
        let endAngle = this.coneAngle + this.coneRadians / 2;
        
        // Draw the cone with semi-transparency
        fill(128, 0, 128, 40);
        arc(0, 0, this.range * 2, this.range * 2, startAngle, endAngle, PIE);
        
        // Add some visual effects for damage over time when attacking
        if (this.hpmTarget && enemies.includes(this.hpmTarget) && 
            this.affectedEnemies.length > 0 && millis() - this.pulseTime < 500) {
          // Draw energy pulses across the cone
          let pulseFade = map(millis() - this.pulseTime, 0, 500, 150, 0);
          fill(200, 100, 200, pulseFade);
          arc(0, 0, this.range * 1.5, this.range * 1.5, startAngle, endAngle, PIE);
          
          // Highlight enemies in the cone
          push();
          noFill();
          strokeWeight(2);
          for (let enemy of this.affectedEnemies) {
            // Calculate position relative to tower
            let relX = enemy.pos.x - this.pos.x;
            let relY = enemy.pos.y - this.pos.y;
            
            // Draw highlight around affected enemies
            stroke(255, 100, 255, 200);
            circle(relX, relY, enemy.size * 1.5);
            
            // Draw connecting beam
            stroke(200, 100, 200, 100);
            line(0, 0, relX, relY);
          }
          pop();
        }
        
        // Draw a line showing the direction
        stroke(200, 100, 200, 180);
        strokeWeight(2);
        line(0, 0, 
             cos(this.coneAngle) * this.size, 
             sin(this.coneAngle) * this.size);
        noStroke();
        
        // Microwave emitter dish
        fill(150, 0, 150);
        push();
        if (this.hpmTarget) {
          rotate(this.coneAngle - PI/2); // Rotate dish to face target
        } else {
          rotate(frameCount * 0.02); // Slowly rotate when no target
        }
        ellipse(0, 0, this.size * 0.8, this.size * 0.5);
        
        // Add dish details
        fill(200, 100, 200);
        ellipse(0, 0, this.size * 0.4, this.size * 0.25);
        pop();
        
        // Energy pulses - simplified when not attacking
        let pulseTime = frameCount * 0.1;
        if (this.hpmTarget && this.affectedEnemies.length > 0) {
          // More intense pulses when attacking
          for (let i = 0; i < 3; i++) {
            let pulseOpacity = map(sin(pulseTime + i * PI/1.5), -1, 1, 30, 150);
            noFill();
            stroke(200, 100, 200, pulseOpacity);
            strokeWeight(1);
            if (this.hpmTarget) {
              // Draw directed pulses toward target
              arc(0, 0, 
                  this.size * (1 + i * 0.3), 
                  this.size * (1 + i * 0.3), 
                  this.coneAngle - this.coneRadians / 4, 
                  this.coneAngle + this.coneRadians / 4);
            }
          }
        } else {
          // Simple circular pulses when idle
          for (let i = 0; i < 2; i++) {
            noFill();
            stroke(200, 100, 200, 80 + 40 * sin(pulseTime + i));
            strokeWeight(1);
            circle(0, 0, this.size * (1 + i * 0.3));
          }
        }
        noStroke();
      }
    }
    
    pop(); // Restore drawing state
  }
}

// Draw the base
function drawBase() {
  push();
  translate(base.x, base.y);
  
  // Draw base structure
  fill(100, 100, 200);
  rectMode(CENTER);
  rect(0, 0, base.size, base.size);
  
  // Draw some details on the base
  fill(50, 50, 150);
  rect(0, 0, base.size * 0.7, base.size * 0.7);
  
  // Draw defense turret on top
  fill(150, 150, 220);
  circle(0, 0, base.size * 0.4);
  rect(-base.size * 0.1, -base.size * 0.3, base.size * 0.2, base.size * 0.3);
  
  // Draw health bar
  let barWidth = base.size * 1.5;
  let barHeight = base.size * 0.2;
  let barY = -base.size * 0.8;
  
  // Black background
  fill(0);
  rect(0, barY, barWidth, barHeight);
  
  // Health bar
  fill(map(base.health, 0, base.maxHealth, 255, 0), map(base.health, 0, base.maxHealth, 0, 255), 0);
  let healthWidth = map(base.health, 0, base.maxHealth, 0, barWidth);
  rect(-barWidth/2 + healthWidth/2, barY, healthWidth, barHeight);
  
  pop();
  rectMode(CORNER); // Reset rect mode
}

// **BaseTower class** - Special missile battery that sits on the base
class BaseTower {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.type = 'missile';
    this.range = Infinity; // Unlimited range - can target any enemy on the map
    this.damage = towerTypes.missile.damage * 4; // Quadruple damage
    this.color = towerTypes.missile.color;
    this.size = cellSize * 0.8; // Slightly larger than normal towers
    this.targeting = false; // Flag to indicate if we're currently targeting an enemy
  }
  
  draw() {
    push(); // Save drawing state
    translate(this.pos.x, this.pos.y);
    
    // No range indicator for missile battery since it has unlimited range
    
    noStroke();
    
    // Special missile battery design
    // Base platform
    fill(50, 50, 100);
    circle(0, 0, this.size * 0.9);
    
    // Tower body
    fill(180, 0, 0);
    rect(-this.size/4, -this.size/3, this.size/2, this.size/1.5, 2);
    
    // Rotating turret - faces mouse when targeting
    push();
    if (this.targeting && mouseX > 0 && mouseY > 0) {
      let targetAngle = atan2(mouseY - this.pos.y, mouseX - this.pos.x);
      rotate(targetAngle);
    }
    
    // Missile launcher design
    fill(40);
    rect(0, -this.size/8, this.size/1.2, this.size/4);
    
    // Missile tubes
    fill(70);
    rect(this.size/5, -this.size/4, this.size/3, this.size/2, 2);
    rect(this.size/2, -this.size/5, this.size/4, this.size/2.5, 2);
    
    // Targeting system
    fill(100);
    circle(this.size/6, 0, this.size/5);
    fill(200, 0, 0, 150);
    circle(this.size/6, 0, this.size/10);
    pop();
    
    // Display missile count
    textAlign(CENTER);
    textSize(this.size/3);
    
    // Draw outline for better visibility
    // Black outline
    fill(0);
    text(`Missiles: ${missiles}`, 0, -this.size * 0.9 - 1);
    text(`Missiles: ${missiles}`, 0, -this.size * 0.9 + 1);
    text(`Missiles: ${missiles}`, -1, -this.size * 0.9);
    text(`Missiles: ${missiles}`, 1, -this.size * 0.9);
    
    // White text
    fill(255);
    text(`Missiles: ${missiles}`, 0, -this.size * 0.9);
    
    pop(); // Restore drawing state
  }
  
  // Launch a missile at the target enemy
  launchMissile(targetEnemy) {
    if (missiles > 0 && targetEnemy) {
      // Create a special missile projectile with splash damage
      let missile = new Missile(this.pos.x, this.pos.y, targetEnemy, this.damage);
      projectiles.push(missile);
      missiles--;
      
      // Stay in targeting mode instead of exiting
      // Only clear the selected enemy
      selectedEnemy = null;
    }
  }
}

// **Projectile class** - Base class for all projectiles
class Projectile {
  constructor(startX, startY, targetEnemy, damage, towerType, splashRadius) {
    this.pos = createVector(startX, startY);
    this.targetEnemy = targetEnemy;
    this.towerType = towerType;
    this.splashRadius = splashRadius || 0;
    
    if (towerType === 'jammer') {
      this.speed = 120;
      this.size = 4;
      this.color = [255, 255, 0];
    } else if (towerType === 'missile') {
      this.speed = 200;
      this.size = 3;
      this.color = [255, 0, 0];
    } else if (towerType === 'laser') {
      this.speed = 220; // Faster laser projectile
      this.size = 3;
      this.color = [0, 240, 255];
      this.isLaser = true; // Flag to identify laser projectiles for special drawing
      // Random variation in laser brightness
      this.brightness = random(200, 255);
      this.startTime = millis();
      this.duration = 200; // Laser beam duration in milliseconds
      this.damageApplied = false; // Flag to track if damage has been applied
    } else if (towerType === 'hpm') {
      this.speed = 100;
      this.size = 5;
      this.color = [255, 0, 255];
    }
    
    this.damage = damage;
    this.hasHit = false;
  }

  update() {
    // If the target enemy is dead or the projectile has already hit something, remove it
    if (!enemies.includes(this.targetEnemy) || this.hasHit) {
      return;
    }
    
    // Special handling for laser - it hits instantly
    if (this.isLaser) {
      // Check if laser duration has elapsed
      if (millis() - this.startTime > this.duration) {
        this.hasHit = true;
      }
      
      // Laser hits instantly when created
      if (!this.damageApplied) {
        this.damageApplied = true;
        this.applyDamage(this.targetEnemy, this.damage);
      }
      return;
    }
    
    // Regular projectile movement for non-laser types
    let targetPos = this.targetEnemy.pos.copy();
    
    let dir = p5.Vector.sub(targetPos, this.pos);
    let distance = dir.mag();
    let moveAmount = this.speed * (deltaTime / 1000);
    
    if (distance < moveAmount) {
      this.pos.set(targetPos);
    } else {
      dir.normalize().mult(moveAmount);
      this.pos.add(dir);
    }
  }

  checkCollision() {
    // If already hit something or target is gone, return true to remove projectile
    if (this.hasHit || !enemies.includes(this.targetEnemy)) {
      return true;
    }
    
    // Special handling for laser - remove after duration
    if (this.isLaser) {
      return millis() - this.startTime > this.duration;
    }
    
    // Check if this projectile has hit its target enemy
    let d = p5.Vector.dist(this.pos, this.targetEnemy.pos);
    if (d < (this.size/2 + this.targetEnemy.size/2)) {
      // Hit the enemy
      this.hasHit = true; // Mark as hit to prevent multiple hits
      
      if (this.towerType === 'hpm') {
        // Splash damage to nearby enemies
        this.applySplashDamage();
      } else {
        // Direct damage to target
        this.applyDamage(this.targetEnemy, this.damage);
      }
      
      return true; // Collision occurred, remove projectile
    }
    
    return false; // No collision
  }
  
  applySplashDamage() {
    // Apply damage to all enemies within splash radius
    for (let enemy of enemies) {
      let d = p5.Vector.dist(this.pos, enemy.pos);
      if (d <= this.splashRadius) {
        // Calculate damage falloff based on distance
        let damageMultiplier = 1 - (d / this.splashRadius);
        let actualDamage = this.damage * damageMultiplier;
        this.applyDamage(enemy, actualDamage);
      }
    }
    
    // Visual splash effect
    fill(255, 100, 255, 150);
    circle(this.pos.x, this.pos.y, this.splashRadius * 2);
  }
  
  applyDamage(enemy, damage) {
    enemy.health -= damage;
    enemy.hitTime = millis();
    
    // Check if enemy is dead
    if (enemy.health <= 0) {
      // Add money reward for killing the enemy
      money += enemy.value;
      gameStats.moneyEarned += enemy.value;
      gameStats.enemiesKilled++;
      
      // Remove the enemy
      enemies.splice(enemies.indexOf(enemy), 1);
    }
  }

  draw() {
    if (this.hasHit) return; // Don't draw if already hit
    
    if (this.isLaser) {
      // Special drawing for laser projectiles - instant beam
      push();
      
      // Main beam - bright core
      stroke(0, this.brightness, 255, 230);
      strokeWeight(2);
      
      // Draw straight line from tower to target
      if (enemies.includes(this.targetEnemy)) {
        line(this.pos.x, this.pos.y, this.targetEnemy.pos.x, this.targetEnemy.pos.y);
        
        // Outer glow
        stroke(0, this.brightness, 255, 90);
        strokeWeight(4);
        line(this.pos.x, this.pos.y, this.targetEnemy.pos.x, this.targetEnemy.pos.y);
        
        // Impact flare at target
        noStroke();
        fill(0, 255, 255, 180 - (millis() - this.startTime) / this.duration * 180);
        let impactSize = 6 + sin(millis() * 0.1) * 2;
        circle(this.targetEnemy.pos.x, this.targetEnemy.pos.y, impactSize);
        
        // Add small particles at impact point
        let particleCount = 3;
        for (let i = 0; i < particleCount; i++) {
          let angle = random(TWO_PI);
          let distance = random(5, 10);
          let x = this.targetEnemy.pos.x + cos(angle) * distance;
          let y = this.targetEnemy.pos.y + sin(angle) * distance;
          fill(0, 255, 255, random(100, 180));
          circle(x, y, random(1, 3));
        }
      }
      pop();
    } else {
      // Standard projectile drawing
      fill(this.color[0], this.color[1], this.color[2]);
      circle(this.pos.x, this.pos.y, this.size * 2);
    }
  }
}

// **Missile class** - Special projectile fired from the base tower with splash damage
class Missile extends Projectile {
  constructor(startX, startY, targetEnemy, damage) {
    // Set up missile with splash damage radius
    const splashRadius = 50 * scaleFactor; // Significant splash radius
    super(startX, startY, targetEnemy, damage, 'missile', splashRadius);
    this.speed = 300; // Increased from 150 to 300 for faster missiles
    this.size = 6;
    this.color = [255, 50, 50];
    this.trailLength = 10;
    this.trailPositions = [];
    this.damage = damage * 4; // Missiles do 4x damage (increased from 2x)
  }
  
  update() {
    // Store position for trail
    this.trailPositions.unshift({x: this.pos.x, y: this.pos.y});
    if (this.trailPositions.length > this.trailLength) {
      this.trailPositions.pop();
    }
    
    // Use original update logic from Projectile
    super.update();
  }
  
  draw() {
    // Draw trail first
    for (let i = 0; i < this.trailPositions.length; i++) {
      let pos = this.trailPositions[i];
      let alpha = map(i, 0, this.trailPositions.length, 200, 0);
      let size = map(i, 0, this.trailPositions.length, this.size, 1);
      fill(255, 100, 0, alpha);
      circle(pos.x, pos.y, size);
    }
    
    // Draw missile body
    push(); // Save drawing state
    translate(this.pos.x, this.pos.y);
    
    // Calculate angle based on movement direction
    let angle = 0;
    if (this.trailPositions.length > 1) {
      let prev = this.trailPositions[1];
      angle = atan2(this.pos.y - prev.y, this.pos.x - prev.x);
    } else if (this.targetEnemy) {
      angle = atan2(this.targetEnemy.pos.y - this.pos.y, this.targetEnemy.pos.x - this.pos.x);
    }
    rotate(angle);
    
    // Missile body
    fill(200, 0, 0);
    rect(-this.size, -this.size/3, this.size * 1.5, this.size/1.5, 1);
    
    // Nose cone
    fill(150, 0, 0);
    triangle(this.size/2, -this.size/3, this.size/2, this.size/3, this.size, 0);
    
    // Fins
    fill(100, 0, 0);
    triangle(-this.size/2, -this.size/3, -this.size, -this.size/2, -this.size/2, 0);
    triangle(-this.size/2, this.size/3, -this.size, this.size/2, -this.size/2, 0);
    
    pop(); // Restore drawing state
  }
  
  // Override the checkCollision method to add the explosion effect
  checkCollision() {
    if (!this.targetEnemy || this.hasHit) return false;
    
    // Check if this missile has hit its target enemy
    let d = p5.Vector.dist(this.pos, this.targetEnemy.pos);
    if (d < (this.size/2 + this.targetEnemy.size/2)) {
      // Hit the enemy
      this.hasHit = true; // Mark as hit to prevent multiple hits
      
      // Apply splash damage to all enemies in radius
      this.applyExplosion();
      
      return true; // Collision occurred, remove projectile
    }
    
    return false; // No collision
  }
  
  // Create a more dramatic explosion effect for missiles
  applyExplosion() {
    // Apply damage to all enemies within splash radius
    for (let enemy of enemies) {
      let d = p5.Vector.dist(this.pos, enemy.pos);
      if (d <= this.splashRadius) {
        // Calculate damage falloff based on distance
        let damageMultiplier = 1 - (d / this.splashRadius);
        let actualDamage = this.damage * damageMultiplier;
        this.applyDamage(enemy, actualDamage);
      }
    }
    
    // Create explosion animation
    for (let i = 0; i < 50; i++) {
      let explosionParticle = {
        pos: createVector(this.pos.x, this.pos.y),
        vel: p5.Vector.random2D().mult(random(1, 5) * scaleFactor),
        size: random(2, 6) * scaleFactor,
        lifetime: 30,
        color: [random(200, 255), random(50, 150), 0, 255]
      };
      
      // Add to game's explosion effects array if it exists
      if (typeof explosionEffects !== 'undefined') {
        explosionEffects.push(explosionParticle);
      }
    }
    
    // Visual splash effect
    push();
    noStroke();
    // Inner explosion
    fill(255, 200, 0, 200);
    circle(this.pos.x, this.pos.y, this.splashRadius * 0.5);
    // Outer explosion
    fill(255, 100, 0, 100);
    circle(this.pos.x, this.pos.y, this.splashRadius);
    // Shockwave
    noFill();
    strokeWeight(3 * scaleFactor);
    stroke(255, 255, 255, 150);
    circle(this.pos.x, this.pos.y, this.splashRadius * 1.2);
    pop();
  }
}

// Add a new class for jamming visual effects
class JammingEffect {
  constructor(x, y, targetEnemy) {
    this.pos = createVector(x, y);
    this.targetEnemy = targetEnemy;
    this.lifetime = 15; // Short lifetime for the effect
    this.size = 10 * scaleFactor;
    this.color = [50, 50, 255];
    this.hasHit = false; // Add this to match Projectile interface
  }
  
  update() {
    // Follow the target enemy
    if (this.targetEnemy && enemies.includes(this.targetEnemy)) {
      this.pos.x = this.targetEnemy.pos.x;
      this.pos.y = this.targetEnemy.pos.y;
    }
    
    // Decrease lifetime
    this.lifetime--;
  }
  
  draw() {
    // Don't draw if it has already hit
    if (this.hasHit) return;
    
    push();
    translate(this.pos.x, this.pos.y);
    
    // Draw disruption effect
    noFill();
    stroke(this.color[0], this.color[1], this.color[2], 150 - (15 - this.lifetime) * 10);
    strokeWeight(1);
    
    // Draw broken circles to represent signal disruption
    for (let i = 0; i < 4; i++) {
      let angle = random(TWO_PI);
      let arcLength = random(PI/4, PI);
      arc(0, 0, this.size * (i+1) * 0.5, this.size * (i+1) * 0.5, angle, angle + arcLength);
    }
    
    // Draw small glitchy lines
    for (let i = 0; i < 5; i++) {
      let angle = random(TWO_PI);
      let len = random(2, 8) * scaleFactor;
      let x1 = cos(angle) * this.size * 0.6;
      let y1 = sin(angle) * this.size * 0.6;
      line(x1, y1, x1 + random(-len, len), y1 + random(-len, len));
    }
    
    pop();
  }
  
  checkCollision() {
    // Mark as hit to ensure it gets removed properly
    if (this.lifetime <= 0 || !this.targetEnemy || !enemies.includes(this.targetEnemy)) {
      this.hasHit = true;
      return true;
    }
    return false;
  }
}