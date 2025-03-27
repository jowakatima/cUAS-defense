class WaveManager {
    constructor(basePos, cellSize, scaleFactor) {
        this.basePos = basePos;
        this.cellSize = cellSize;
        this.scaleFactor = scaleFactor;
        this.currentWave = 0;
        this.enemies = [];
        this.waveInProgress = false;
        this.spawnTimer = 0;
        this.spawnInterval = 1000; // Time between enemy spawns
        this.enemiesPerWave = 10;
        this.enemiesRemaining = 0;
    }

    update() {
        if (!this.waveInProgress) return false;

        // Spawn enemies
        if (this.enemiesRemaining > 0 && millis() - this.spawnTimer > this.spawnInterval) {
            this.spawnEnemy();
            this.enemiesRemaining--;
            this.spawnTimer = millis();
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            
            // Move enemy towards base
            let dir = p5.Vector.sub(this.basePos, enemy.pos);
            dir.normalize();
            dir.mult(enemy.speed);
            enemy.pos.add(dir);

            // Check if enemy reached base
            let d = p5.Vector.dist(enemy.pos, this.basePos);
            if (d < this.cellSize) {
                this.enemies.splice(i, 1);
                return true; // Signal that base was hit
            }

            // Check if enemy died
            if (enemy.health <= 0) {
                this.enemies.splice(i, 1);
                continue;
            }
        }

        // Check if wave is complete
        if (this.enemies.length === 0 && this.enemiesRemaining === 0) {
            this.waveInProgress = false;
            this.currentWave++;
            return false;
        }

        return false;
    }

    startWave() {
        if (this.waveInProgress) return;
        
        this.waveInProgress = true;
        this.enemiesRemaining = this.enemiesPerWave + Math.floor(this.currentWave * 2);
        this.spawnTimer = millis();
    }

    spawnEnemy() {
        // Determine enemy type based on wave number
        let type = 'fixed_wing';
        let rand = random();
        
        if (this.currentWave >= 5 && rand < 0.15) {
            type = 'group_5';
        } else if (this.currentWave >= 3 && rand < 0.3) {
            type = 'group_3';
        } else if (rand < 0.4) {
            type = 'fpv';
        }

        // Create enemy at random position on left side of screen
        let enemy = new Enemy(
            createVector(0, random(height * 0.1, height * 0.9)),
            type,
            this.currentWave,
            this.cellSize,
            this.scaleFactor
        );
        
        this.enemies.push(enemy);
    }

    isWaveInProgress() {
        return this.waveInProgress;
    }

    getEnemies() {
        return this.enemies;
    }

    draw() {
        // Draw all enemies
        for (let enemy of this.enemies) {
            enemy.draw();
        }
    }
} 