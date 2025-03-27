class GameManager {
    constructor() {
        this.cellSize = GAME_CONFIG.GRID_SIZE;
        this.scaleFactor = GAME_CONFIG.SCALE_FACTOR;
        
        // Initialize game state
        this.money = GAME_CONFIG.STARTING_MONEY;
        this.stats = { ...INITIAL_GAME_STATS };
        this.gameOver = false;
        
        // Initialize missile system
        this.missiles = 5; // Start with 5 missiles
        this.missilePrice = 25; // Cost per missile
        this.isTargetingMode = false; // Add targeting mode flag
        
        // Initialize game objects
        this.base = new Base(width - this.cellSize * 2, height/2, this.cellSize, this.scaleFactor);
        this.towers = [];
        this.projectiles = [];
        this.waveManager = new WaveManager(this.base.pos, this.cellSize, this.scaleFactor);
        
        // Initialize UI
        this.selectedTowerType = 'jammer'; // Default selected tower
        this.selectedTowerButton = null;
        this.towerButtons = this.createTowerButtons();
    }

    createTowerButtons() {
        let buttons = [];
        let buttonTypes = ['jammer', 'missile', 'laser', 'hpm'];
        let spacing = this.cellSize * 1.2;
        
        for (let i = 0; i < buttonTypes.length; i++) {
            let x = width - this.cellSize * 4;
            let y = this.cellSize * 2 + i * spacing;
            buttons.push(new TowerButton(x, y, buttonTypes[i], this.cellSize, this.scaleFactor));
        }
        
        return buttons;
    }

    update() {
        if (this.gameOver) return;
        
        // Update wave manager
        let enemyReachedBase = this.waveManager.update();
        if (enemyReachedBase) {
            this.base.takeDamage(10);
            if (this.base.health <= 0) {
                this.gameOver = true;
            }
        }
        
        // Update towers
        for (let tower of this.towers) {
            tower.update(this.waveManager.getEnemies());
            let projectile = tower.shoot();
            if (projectile) {
                this.projectiles.push(projectile);
            }
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let projectile = this.projectiles[i];
            projectile.update();
            
            // Check for hits
            if (projectile.checkHit()) {
                projectile.target.health -= projectile.damage;
                projectile.target.hitTime = millis();
                
                // Handle splash damage
                if (projectile.splashRadius > 0) {
                    for (let enemy of this.waveManager.getEnemies()) {
                        if (enemy !== projectile.target) {
                            let d = dist(projectile.pos.x, projectile.pos.y, enemy.pos.x, enemy.pos.y);
                            if (d < projectile.splashRadius) {
                                enemy.health -= projectile.damage * 0.5;
                                enemy.hitTime = millis();
                            }
                        }
                    }
                }
                
                // Handle enemy death
                if (projectile.target.health <= 0) {
                    this.money += projectile.target.value;
                    this.stats.enemiesKilled++;
                    this.stats.moneyEarned += projectile.target.value;
                }
                
                this.projectiles.splice(i, 1);
            }
        }
    }

    draw() {
        // Draw grid
        this.drawGrid();
        
        // Draw game objects
        this.base.draw();
        for (let tower of this.towers) {
            tower.draw();
        }
        for (let projectile of this.projectiles) {
            projectile.draw();
        }
        
        // Draw wave manager
        this.waveManager.draw();
        
        // Draw UI
        this.drawUI();
        
        // Draw tower preview
        if (this.selectedTowerType && this.waveManager.isWaveInProgress()) {
            this.drawTowerPreview();
        }
        
        // Draw targeting cursor if in targeting mode
        if (this.isTargetingMode) {
            push();
            stroke(255, 0, 0);
            strokeWeight(2);
            noFill();
            // Draw crosshair
            let size = 20;
            line(mouseX - size, mouseY, mouseX + size, mouseY);
            line(mouseX, mouseY - size, mouseX, mouseY + size);
            circle(mouseX, mouseY, size * 2);
            pop();

            // Highlight targetable enemies
            let enemies = this.waveManager.getEnemies();
            for (let enemy of enemies) {
                let d = dist(mouseX, mouseY, enemy.pos.x, enemy.pos.y);
                if (d < enemy.size) {
                    push();
                    stroke(255, 0, 0);
                    strokeWeight(2);
                    noFill();
                    circle(enemy.pos.x, enemy.pos.y, enemy.size * 2);
                    pop();
                }
            }
        }
        
        // Draw game over screen
        if (this.gameOver) {
            fill(0, 0, 0, 200);
            rect(0, 0, width, height);
            
            fill(255);
            textAlign(CENTER, CENTER);
            textSize(48);
            text('Game Over', width/2, height/2 - 50);
            textSize(24);
            text('Final Wave: ' + this.waveManager.currentWave, width/2, height/2);
            text('Press R to restart', width/2, height/2 + 50);
        }
    }

    drawGrid() {
        stroke(50);
        strokeWeight(1);
        
        for (let x = 0; x < width; x += this.cellSize) {
            line(x, 0, x, height);
        }
        for (let y = 0; y < height; y += this.cellSize) {
            line(0, y, width, y);
        }
    }

    drawUI() {
        // Draw stats (wave, money, etc) with dark background
        fill(0, 0, 0, 200);
        rect(5, 5, 120, 70, 5);
        
        fill(255);
        noStroke();
        textAlign(LEFT, TOP);
        textSize(16);
        text(`Wave: ${this.waveManager.currentWave}`, 10, 10);
        text(`Money: $${this.money}`, 10, 30);
        text(`Missiles: ${this.missiles}`, 10, 50);

        // Draw tower selection panel during wave
        if (this.waveManager.isWaveInProgress()) {
            // Panel dimensions
            const panelWidth = 150;
            const buttonHeight = 28;
            const padding = 8;
            const startX = width - panelWidth - padding;
            const startY = padding;
            
            // Background panel
            fill(0, 0, 0, 240);
            rect(startX, startY, panelWidth, 20 + buttonHeight * 3 + padding * 2, 5);
            
            // Title
            fill(255);
            textAlign(LEFT);
            textSize(12);
            text("SELECT TOWER", startX + padding, startY + 15);
            
            // Draw tower buttons
            let y = startY + 25;
            const towers = [
                { type: 'jammer', name: 'Jammer', cost: 50, key: '1' },
                { type: 'laser', name: 'Laser', cost: 75, key: '2' },
                { type: 'hpm', name: 'HPM', cost: 125, key: '3' }
            ];
            
            for (let tower of towers) {
                // Button background
                if (this.selectedTowerType === tower.type) {
                    fill(60, 100, 255, 200);
                } else if (this.money >= tower.cost) {
                    fill(40, 40, 40, 200);
                } else {
                    fill(60, 0, 0, 200);
                }
                rect(startX + padding, y, panelWidth - padding * 2, buttonHeight, 3);
                
                // Tower name
                textAlign(LEFT);
                textSize(12);
                fill(255);
                text(tower.name, startX + padding * 4, y + 11);
                
                // Cost
                fill(this.money >= tower.cost ? '#00ff00' : '#ff0000');
                textSize(11);
                text(`$${tower.cost}`, startX + padding * 4, y + 22);
                
                // Hotkey
                textAlign(RIGHT);
                textSize(10);
                fill(200);
                text(`[${tower.key}]`, startX + panelWidth - padding * 2, y + 11);
                
                // Draw small icon
                this.drawTowerIcon(tower.type, startX + padding * 2.5, y + buttonHeight/2);
                
                y += buttonHeight + 2;
            }
        }

        // Only show missile purchase and wave start when wave is not in progress
        if (!this.waveManager.isWaveInProgress()) {
            // Draw missile purchase interface
            let boxWidth = 200;
            let boxHeight = 150;
            let boxX = width / 2 - boxWidth / 2;
            let boxY = height / 3 - boxHeight / 2;

            // Semi-transparent background
            fill(0, 0, 50, 200);
            rect(boxX, boxY, boxWidth, boxHeight, 10);

            // Title
            fill(255);
            textAlign(CENTER);
            textSize(20);
            text("Missile Purchase", width / 2, boxY + 30);

            // Current info
            fill(220);
            textSize(16);
            text(`Current Missiles: ${this.missiles}`, width / 2, boxY + 60);
            text(`Cost: $${this.missilePrice} each`, width / 2, boxY + 85);

            // Buy buttons
            let buttonWidth = 50;
            let buttonHeight = 30;
            let button1X = boxX + 40;
            let button5X = boxX + boxWidth - 40 - buttonWidth;
            let buttonY = boxY + 100;

            // "Buy 1" button
            if (this.money >= this.missilePrice) {
                fill(0, 150, 0);  // Green if can afford
            } else {
                fill(100, 100, 100);  // Gray if cannot afford
            }
            rect(button1X, buttonY, buttonWidth, buttonHeight, 5);
            fill(255);
            text("Buy 1", button1X + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);

            // "Buy 5" button
            if (this.money >= this.missilePrice * 5) {
                fill(0, 150, 0);  // Green if can afford
            } else {
                fill(100, 100, 100);  // Gray if cannot afford
            }
            rect(button5X, buttonY, buttonWidth, buttonHeight, 5);
            fill(255);
            text("Buy 5", button5X + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);

            // Draw "Start Wave" button
            fill(0, 100, 255);
            rect(width / 2 - 75, height - 50, 150, 40);
            fill(255);
            textAlign(CENTER, CENTER);
            textSize(18);
            text("Start Wave " + (this.waveManager.currentWave + 1), width / 2, height - 30);
        }
    }

    drawTowerPreview() {
        let towerData = TOWER_TYPES[this.selectedTowerType];
        let previewSize = this.cellSize * 0.8;
        
        // Get grid position
        let gridX = floor(mouseX / this.cellSize) * this.cellSize;
        let gridY = floor(mouseY / this.cellSize) * this.cellSize;
        
        // Check if position is valid
        let isValid = !this.isTowerAt(gridX, gridY) && !isTooCloseToBase(gridX, gridY, this.base, this.cellSize);
        
        // Draw preview
        push();
        translate(gridX + this.cellSize/2, gridY + this.cellSize/2);
        
        // Draw range indicator
        noFill();
        stroke(isValid ? 0 : 255, isValid ? 255 : 0, 0, 100);
        strokeWeight(2);
        circle(0, 0, towerData.range * 2);
        
        // Draw tower preview based on type
        if (isValid) {
            fill(towerData.color[0], towerData.color[1], towerData.color[2], 200);
        } else {
            fill(255, 0, 0, 200);
        }
        
        // Draw different shapes based on tower type
        if (this.selectedTowerType === 'jammer') {
            // Jamming tower design
            circle(0, 0, previewSize);
            fill(100, 100, 255, 200);
            rect(-previewSize/10, -previewSize/2, previewSize/5, previewSize/2);
            arc(0, -previewSize/2, previewSize/3, previewSize/3, PI, TWO_PI);
        } 
        else if (this.selectedTowerType === 'laser') {
            // Laser tower design
            circle(0, 0, previewSize);
            fill(0, 220, 255, 140);
            circle(0, 0, previewSize * 0.5);
            fill(180, 220, 255);
            circle(0, -previewSize/4, previewSize/3);
        }
        else if (this.selectedTowerType === 'hpm') {
            // HPM tower design
            circle(0, 0, previewSize);
            fill(200, 100, 200, 200);
            ellipse(0, 0, previewSize * 0.8, previewSize * 0.5);
        }
        
        pop();
    }

    mousePressed(x, y) {
        if (this.gameOver) return;

        // Handle missile targeting mode
        if (this.isTargetingMode && this.waveManager.isWaveInProgress()) {
            let enemies = this.waveManager.getEnemies();
            for (let enemy of enemies) {
                let d = dist(x, y, enemy.pos.x, enemy.pos.y);
                if (d < enemy.size) {
                    // Launch missile at enemy
                    let missile = this.base.launchMissile(enemy);
                    this.projectiles.push(missile);
                    this.missiles--;
                    this.isTargetingMode = false;
                    return;
                }
            }
            // If no enemy was clicked, exit targeting mode
            this.isTargetingMode = false;
            return;
        }

        // Check for missile purchase buttons when wave is not in progress
        if (!this.waveManager.isWaveInProgress()) {
            let boxWidth = 200;
            let boxHeight = 150;
            let boxX = width / 2 - boxWidth / 2;
            let boxY = height / 3 - boxHeight / 2;
            let buttonWidth = 50;
            let buttonHeight = 30;
            let button1X = boxX + 40;
            let button5X = boxX + boxWidth - 40 - buttonWidth;
            let buttonY = boxY + 100;

            // Check "Buy 1" button
            if (mouseX > button1X && mouseX < button1X + buttonWidth &&
                mouseY > buttonY && mouseY < buttonY + buttonHeight) {
                if (this.money >= this.missilePrice) {
                    this.money -= this.missilePrice;
                    this.missiles += 1;
                }
                return;
            }

            // Check "Buy 5" button
            if (mouseX > button5X && mouseX < button5X + buttonWidth &&
                mouseY > buttonY && mouseY < buttonY + buttonHeight) {
                if (this.money >= this.missilePrice * 5) {
                    this.money -= this.missilePrice * 5;
                    this.missiles += 5;
                }
                return;
            }

            // Check "Start Wave" button
            if (mouseY > height - 50 && mouseY < height - 10 &&
                mouseX > width / 2 - 75 && mouseX < width / 2 + 75) {
                this.startWave();
                return;
            }
        }

        // Check for tower button clicks - always allow during wave
        for (let button of this.towerButtons) {
            if (button.isClicked(x, y)) {
                // Deselect previous button if any
                if (this.selectedTowerButton) {
                    this.selectedTowerButton.deselect();
                }
                // Select new button
                button.select();
                this.selectedTowerButton = button;
                this.selectedTowerType = button.type;
                return;
            }
        }
        
        // Place tower - always allow during wave
        if (this.selectedTowerType && this.waveManager.isWaveInProgress()) {
            let gridX = floor(mouseX / this.cellSize) * this.cellSize;
            let gridY = floor(mouseY / this.cellSize) * this.cellSize;
            
            if (!this.isTowerAt(gridX, gridY) && !isTooCloseToBase(gridX, gridY, this.base, this.cellSize)) {
                let towerData = TOWER_TYPES[this.selectedTowerType];
                if (this.money >= towerData.cost) {
                    this.towers.push(new Tower(gridX, gridY, this.selectedTowerType, this.cellSize, this.scaleFactor));
                    this.money -= towerData.cost;
                    this.stats.towersBuilt++;
                }
            }
        }
    }

    isTowerAt(x, y) {
        return this.towers.some(tower => tower.pos.x === x && tower.pos.y === y);
    }

    startWave() {
        if (!this.waveManager.isWaveInProgress() && !this.gameOver) {
            this.waveManager.startWave();
        }
    }

    isGameOver() {
        return this.gameOver;
    }

    getStats() {
        return this.stats;
    }

    keyPressed() {
        if (key === 'r' && this.gameOver) {
            this.restart();
            return;
        }

        // Space bar to toggle targeting mode
        if (key === ' ' && this.waveManager.isWaveInProgress() && this.missiles > 0) {
            this.isTargetingMode = !this.isTargetingMode;
            return;
        }

        // Number keys to select tower type
        if (key === '1') {
            this.selectTowerType('jammer');
        } else if (key === '2') {
            this.selectTowerType('laser');
        } else if (key === '3') {
            this.selectTowerType('hpm');
        }
    }

    selectTowerType(type) {
        this.selectedTowerType = type;
        // Update button selection
        for (let button of this.towerButtons) {
            if (button.type === type) {
                button.select();
                this.selectedTowerButton = button;
            } else {
                button.deselect();
            }
        }
    }

    restart() {
        this.towers = [];
        this.projectiles = [];
        this.selectedTowerType = 'jammer'; // Reset to default tower
        this.selectedTowerButton = null;
        this.money = GAME_CONFIG.STARTING_MONEY;
        this.missiles = 5; // Reset missiles
        this.gameOver = false;
        this.waveManager.currentWave = 0;
        this.base.health = this.base.maxHealth;
        
        // Reset button selection
        for (let button of this.towerButtons) {
            button.deselect();
        }
    }

    drawTowerIcon(type, x, y) {
        push();
        translate(x, y);
        const size = 8; // Smaller icon size
        
        switch(type) {
            case 'jammer':
                // Base
                fill(0, 0, 200);
                circle(0, 0, size);
                // Antenna
                fill(0, 0, 255);
                rect(-size/8, -size/2, size/4, size/2);
                // Dish
                fill(120, 120, 255);
                arc(0, -size/2, size/2, size/2, PI, TWO_PI);
                break;
                
            case 'laser':
                // Base
                fill(0, 100, 200);
                circle(0, 0, size);
                // Beam emitter
                fill(0, 200, 255);
                rect(-size/4, -size/2, size/2, size/3);
                // Lens
                fill(100, 200, 255);
                circle(0, -size/2, size/3);
                break;
                
            case 'hpm':
                // Base
                fill(128, 0, 128);
                circle(0, 0, size);
                // Dish
                fill(200, 100, 200);
                ellipse(0, 0, size * 0.8, size * 0.5);
                // Core
                fill(255, 100, 255);
                circle(0, 0, size/3);
                break;
        }
        pop();
    }
} 