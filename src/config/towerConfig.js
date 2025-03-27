// Tower types configuration
const TOWER_TYPES = {
    jammer: { 
        name: 'Jamming Tower', 
        cost: 50, 
        damage: 1, 
        range: 60 * 2, 
        attackSpeed: 300, 
        color: [0, 0, 255] 
    },
    missile: { 
        name: 'Missile Battery', 
        cost: 100, 
        damage: 15, 
        range: Infinity, 
        attackSpeed: 1500, 
        color: [128, 0, 0] 
    },
    laser: { 
        name: 'Laser Tower', 
        cost: 75, 
        damage: 8, 
        range: 192, 
        attackSpeed: 3000, 
        color: [0, 200, 255] 
    },
    hpm: { 
        name: 'HPM Tower', 
        cost: 125, 
        damage: 5, 
        range: 100, 
        attackSpeed: 500, 
        color: [128, 0, 128], 
        coneDegrees: 90, 
        dotDamage: true, 
        splashRadius: 0 
    }
};

// Tower image paths
const TOWER_IMAGES = {
    jammer: 'images/tower_jammer.png',
    missile: 'images/tower_missile_battery.png',
    laser: 'images/tower_laser.png',
    hpm: 'images/tower_hpm.png'
}; 