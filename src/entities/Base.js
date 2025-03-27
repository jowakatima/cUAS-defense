class Base {
    constructor(x, y, size, scaleFactor) {
        this.pos = createVector(x, y);
        this.size = size;
        this.scaleFactor = scaleFactor;
        this.maxHealth = 100;
        this.health = this.maxHealth;
    }

    launchMissile(target) {
        // Create a missile projectile
        let missile = new Projectile(
            this.pos.x,
            this.pos.y,
            target,
            50,  // High damage for missiles
            'missile'
        );
        return missile;
    }

    takeDamage(amount) {
        this.health = max(0, this.health - amount);
    }

    draw() {
        push();
        // Draw base health bar
        let healthBarWidth = this.size * 1.5;
        let healthBarHeight = 10;
        let healthBarY = this.pos.y - this.size;
        
        // Background of health bar
        fill(100);
        noStroke();
        rect(this.pos.x - healthBarWidth/2, healthBarY, healthBarWidth, healthBarHeight);
        
        // Health bar
        fill(map(this.health, 0, this.maxHealth, 255, 0), map(this.health, 0, this.maxHealth, 0, 255), 0);
        rect(this.pos.x - healthBarWidth/2, healthBarY, 
             map(this.health, 0, this.maxHealth, 0, healthBarWidth), healthBarHeight);

        // Draw base
        fill(0, 100, 255);
        stroke(0, 50, 200);
        strokeWeight(2);
        rect(this.pos.x - this.size/2, this.pos.y - this.size/2, this.size, this.size);
        
        // Draw base details
        fill(0, 150, 255);
        noStroke();
        // Radar dish
        arc(this.pos.x, this.pos.y - this.size/4, this.size/2, this.size/2, PI, TWO_PI);
        // Windows
        rect(this.pos.x - this.size/4, this.pos.y, this.size/8, this.size/4);
        rect(this.pos.x + this.size/8, this.pos.y, this.size/8, this.size/4);
        pop();
    }
} 