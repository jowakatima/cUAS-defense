class Projectile {
    constructor(startX, startY, targetEnemy, damage, type = 'normal') {
        this.pos = createVector(startX, startY);
        this.target = targetEnemy;
        this.damage = damage;
        this.type = type;
        this.speed = 15;
        this.size = 5;
        this.hasHit = false;
    }

    update() {
        if (!this.target || this.hasHit) return true;

        // Move towards target
        let dir = p5.Vector.sub(this.target.pos, this.pos);
        let distance = dir.mag();
        
        // Check if we've reached the target
        if (distance < this.speed) {
            this.pos = this.target.pos.copy();
            return this.checkHit();
        }
        
        // Move towards target
        dir.normalize().mult(this.speed);
        this.pos.add(dir);
        
        return false;
    }

    checkHit() {
        if (this.hasHit || !this.target) return true;
        
        let d = p5.Vector.dist(this.pos, this.target.pos);
        if (d < this.size + this.target.size) {
            this.hasHit = true;
            return true;
        }
        return false;
    }

    draw() {
        if (this.hasHit) return;
        
        push();
        fill(255);
        noStroke();
        circle(this.pos.x, this.pos.y, this.size * 2);
        pop();
    }
} 