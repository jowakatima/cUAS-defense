class TowerButton {
    constructor(x, y, type) {
        this.pos = createVector(x, y);
        this.type = type;
        this.size = 40;
        this.selected = false;
        
        // Get tower data from config
        let towerData = TOWER_TYPES[type];
        this.name = towerData.name;
        this.cost = towerData.cost;
        this.color = color(towerData.color[0], towerData.color[1], towerData.color[2]);
    }

    draw(money) {
        push();
        translate(this.pos.x, this.pos.y);
        
        // Draw button background
        fill(50);
        stroke(100);
        strokeWeight(2);
        rect(-this.size/2, -this.size/2, this.size, this.size);
        
        // Draw tower icon
        fill(this.color);
        if (this.type === 'jammer') {
            // Jammer icon
            rect(-this.size/4, -this.size/2, this.size/2, this.size);
            line(0, -this.size/2, 0, -this.size * 1.2);
        } else if (this.type === 'missile') {
            // Missile icon
            rect(-this.size/3, -this.size/2, this.size/1.5, this.size);
            fill(30);
            for (let i = 0; i < 3; i++) {
                circle(-this.size/6 + i * this.size/6, 0, this.size/4);
            }
        } else if (this.type === 'laser') {
            // Laser icon
            rect(-this.size/3, -this.size/2, this.size/1.5, this.size);
            fill(0, 255, 0);
            circle(0, 0, this.size/2);
        } else if (this.type === 'hpm') {
            // HPM icon
            circle(0, 0, this.size);
            noFill();
            stroke(255, 0, 255);
            for (let i = 0; i < 3; i++) {
                circle(0, 0, this.size * (1 + i * 0.2));
            }
        }
        
        // Draw cost
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(12);
        text('$' + this.cost, 0, this.size/2 + 10);
        
        // Draw selected highlight
        if (this.selected) {
            noFill();
            stroke(255, 255, 0);
            strokeWeight(2);
            rect(-this.size/2, -this.size/2, this.size, this.size);
        }
        
        // Draw disabled state if can't afford
        if (money < this.cost) {
            fill(0, 0, 0, 150);
            rect(-this.size/2, -this.size/2, this.size, this.size);
        }
        
        pop();
    }

    isClicked(x, y) {
        return (x > this.pos.x - this.size/2 &&
                x < this.pos.x + this.size/2 &&
                y > this.pos.y - this.size/2 &&
                y < this.pos.y + this.size/2);
    }

    select() {
        this.selected = true;
    }

    deselect() {
        this.selected = false;
    }
} 