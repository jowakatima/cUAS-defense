// Helper functions
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

function getRandomSpawnInterval(currentWave, minSpawnInterval, maxSpawnInterval) {
    // As waves progress, the minimum interval gets shorter
    let waveMinInterval = max(minSpawnInterval, minSpawnInterval + 300 - (currentWave * 50));
    
    // Sometimes create clusters by having a higher chance of short intervals
    if (random() < 0.3) {
        return random(waveMinInterval, waveMinInterval + 300);
    } else {
        return random(waveMinInterval, maxSpawnInterval);
    }
}

function isTooCloseToBase(x, y, base, cellSize) {
    let baseGridX = floor(base.x / cellSize);
    let baseGridY = floor(base.y / cellSize);
    let gridX = floor(x / cellSize);
    let gridY = floor(y / cellSize);
    
    return (gridX >= baseGridX - 1 && gridX <= baseGridX + 1 && 
            gridY >= baseGridY - 1 && gridY <= baseGridY + 1);
}

function calculateDistance(x1, y1, x2, y2) {
    return dist(x1, y1, x2, y2);
}

function normalizeAngle(angle) {
    while (angle < 0) angle += TWO_PI;
    while (angle >= TWO_PI) angle -= TWO_PI;
    return angle;
}

function calculateAngle(x1, y1, x2, y2) {
    return atan2(y2 - y1, x2 - x1);
} 