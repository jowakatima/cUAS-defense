class Tower {
    constructor(x, y, type) {
        this.pos = createVector(x, y);
        this.type = type;
        this.level = 1;
        this.target = null;
        this.lastShot = 0;
        this.rotation = 0;
        
        // Get tower data from config
        let towerData = TOWER_TYPES[type];
        this.name = towerData.name;
        this.cost = towerData.cost;
        this.damage = towerData.damage;
        this.range = towerData.range;
        this.attackSpeed = towerData.attackSpeed;
        this.color = color(towerData.color[0], towerData.color[1], towerData.color[2]);
        
        // Size based on type
        this.size = 30;
        if (type === 'hpm') {
            this.size = 40; // HPM towers are larger
        }
    }

    update(enemies) {
        // Find closest enemy in range
        let closest = null;
        let closestDist = Infinity;
        
        for (let enemy of enemies) {
            let d = dist(this.pos.x, this.pos.y, enemy.pos.x, enemy.pos.y);
            if (d < this.range && d < closestDist) {
                closest = enemy;
                closestDist = d;
            }
        }
        
        // Update target and rotation
        if (closest) {
            this.target = closest;
            this.rotation = atan2(closest.pos.y - this.pos.y, closest.pos.x - this.pos.x);
            
            // Check if we can shoot
            if (millis() - this.lastShot > this.attackSpeed) {
                this.shoot();
                this.lastShot = millis();
            }
        } else {
            this.target = null;
        }
    }

    shoot() {
        if (!this.target) return;
        
        // Create projectile based on tower type
        let projectile = new Projectile(
            this.pos.x,
            this.pos.y,
            this.target,
            this.damage,
            15, // Base speed
            this.type
        );
        
        return projectile;
    }

    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        
        // Draw base
        fill(100);
        circle(0, 0, this.size);
        
        // Draw tower body
        fill(this.color);
        if (this.type === 'jammer') {
            // Jammer tower - antenna design
            rect(-this.size/4, -this.size/2, this.size/2, this.size);
            // Antenna
            line(0, -this.size/2, 0, -this.size * 1.2);
            // Energy rings
            noFill();
            stroke(this.color);
            strokeWeight(2);
            for (let i = 0; i < 3; i++) {
                circle(0, 0, this.size * (1 + i * 0.2));
            }
        } else if (this.type === 'missile') {
            // Missile tower - launcher design
            rect(-this.size/3, -this.size/2, this.size/1.5, this.size);
            // Missile pods
            fill(50);
            rect(-this.size/4, -this.size/3, this.size/2, this.size/3);
            // Launch tubes
            for (let i = 0; i < 3; i++) {
                fill(30);
                circle(-this.size/6 + i * this.size/6, 0, this.size/4);
            }
        } else if (this.type === 'laser') {
            // Laser tower - energy cannon design
            rect(-this.size/3, -this.size/2, this.size/1.5, this.size);
            // Energy core
            fill(0, 255, 0);
            circle(0, 0, this.size/2);
            // Focusing lens
            fill(0, 255, 0, 100);
            circle(0, 0, this.size/3);
        } else if (this.type === 'hpm') {
            // HPM tower - energy generator design
            // Main body
            fill(255, 0, 255);
            circle(0, 0, this.size);
            // Energy rings
            noFill();
            stroke(255, 0, 255);
            strokeWeight(2);
            for (let i = 0; i < 3; i++) {
                circle(0, 0, this.size * (1 + i * 0.2));
            }
            // Core
            fill(255, 0, 255, 100);
            circle(0, 0, this.size/2);
        }
        
        // Draw turret rotation
        push();
        rotate(this.rotation);
        fill(80);
        if (this.type === 'jammer') {
            // Jammer turret
            rect(-this.size/4, -this.size/4, this.size/2, this.size/2);
        } else if (this.type === 'missile') {
            // Missile turret
            rect(-this.size/3, -this.size/4, this.size/1.5, this.size/2);
        } else if (this.type === 'laser') {
            // Laser turret
            rect(-this.size/3, -this.size/4, this.size/1.5, this.size/2);
        } else if (this.type === 'hpm') {
            // HPM turret
            circle(0, 0, this.size/2);
        }
        pop();
        
        // Draw range indicator when selected
        if (this.selected) {
            noFill();
            stroke(255, 255, 0, 100);
            strokeWeight(1);
            circle(0, 0, this.range * 2);
        }
        
        pop();
    }

    upgrade() {
        this.level++;
        this.damage *= 1.5;
        this.range *= 1.2;
        this.attackSpeed *= 0.8; // Faster attacks
        this.cost = Math.floor(this.cost * 1.5);
    }
} 