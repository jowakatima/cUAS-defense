// Global variables
let base;
let waveManager;
let gameManager;

function setup() {
    createCanvas(800, 600);
    
    // Initialize game objects
    base = new Base(width - 50, height/2, 40);
    waveManager = new WaveManager();
    gameManager = new GameManager();
}

function draw() {
    background(20);
    
    // Draw base
    base.draw();
    
    // Update and draw game state
    waveManager.update();
    gameManager.update();
    waveManager.draw();
    gameManager.draw();
    
    if (gameManager.isGameOver()) {
        drawGameOver();
    }
}

function drawGameOver() {
    let stats = gameManager.getStats();
    
    // Draw semi-transparent background
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);
    
    // Draw game over text
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(48 * gameManager.scaleFactor);
    text('Game Over', width/2, height/2 - 50);
    
    // Draw stats
    textSize(24 * gameManager.scaleFactor);
    text(`Wave Reached: ${gameManager.waveManager.getWave()}`, width/2, height/2 + 20);
    text(`Enemies Killed: ${stats.enemiesKilled}`, width/2, height/2 + 50);
    text(`Money Earned: $${stats.moneyEarned}`, width/2, height/2 + 80);
    
    // Draw restart button
    let buttonWidth = 200 * gameManager.scaleFactor;
    let buttonHeight = 50 * gameManager.scaleFactor;
    let buttonX = width/2 - buttonWidth/2;
    let buttonY = height/2 + 150;
    
    fill(100);
    rect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    fill(255);
    textSize(20 * gameManager.scaleFactor);
    text('Click to Restart', width/2, buttonY + buttonHeight/2);
}

function mousePressed() {
    gameManager.mousePressed();
}

function keyPressed() {
    if (key === ' ') {
        waveManager.startWave();
    }
    gameManager.keyPressed();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if (!gameManager.isGameOver()) {
        gameManager = new GameManager();
    }
} 