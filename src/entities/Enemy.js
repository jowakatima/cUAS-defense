class Enemy {
    constructor(pos, type, wave, cellSize, scaleFactor) {
        this.pos = pos;
        this.type = type;
        this.cellSize = cellSize;
        this.scaleFactor = scaleFactor;
        
        // Get enemy data from config
        let enemyData = ENEMY_TYPES[type];
        
        // Scale stats with wave number
        let baseSpeed = (3 + wave * 0.5) * scaleFactor;
        let baseHealth = 10 + wave * 3;
        let baseSize = cellSize * 0.4;
        
        // Apply type modifiers
        this.speed = baseSpeed * enemyData.speedMod;
        this.health = baseHealth * enemyData.healthMod;
        this.maxHealth = this.health;
        this.size = baseSize * enemyData.sizeMod;
        this.value = Math.floor(10 * enemyData.value + wave * 2);
        
        // Visual properties
        this.color = color(enemyData.color[0], enemyData.color[1], enemyData.color[2]);
        this.hitTime = 0;
    }

    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        
        // Flash white when hit
        if (millis() - this.hitTime < 100) {
            fill(255);
        } else {
            fill(this.color);
        }
        
        // Draw enemy based on type
        if (this.type === 'fixed_wing') {
            // Draw triangular shape
            rotate(atan2(this.vel?.y || 0, this.vel?.x || 0));
            triangle(-this.size, -this.size/2, -this.size, this.size/2, this.size, 0);
        } else if (this.type === 'fpv') {
            // Draw X shape
            rotate(PI/4);
            rect(-this.size/2, -this.size/6, this.size, this.size/3);
            rotate(PI/2);
            rect(-this.size/2, -this.size/6, this.size, this.size/3);
        } else {
            // Default circular shape for other types
            circle(0, 0, this.size * 2);
        }
        
        // Health bar
        let barWidth = this.size * 2;
        let barHeight = 4 * this.scaleFactor;
        let barY = -this.size - 10 * this.scaleFactor;
        
        // Background
        fill(0);
        rect(-barWidth/2, barY, barWidth, barHeight);
        
        // Health
        fill(map(this.health, 0, this.maxHealth, 255, 0), 
             map(this.health, 0, this.maxHealth, 0, 255), 0);
        let healthWidth = map(this.health, 0, this.maxHealth, 0, barWidth);
        rect(-barWidth/2, barY, healthWidth, barHeight);
        
        pop();
    }

    update(base) {
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

    checkBaseCollision(base) {
        let d = dist(this.pos.x, this.pos.y, base.x, base.y);
        return d < (this.size + base.size/2);
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitTime = millis();
        return this.health <= 0;
    }
} 