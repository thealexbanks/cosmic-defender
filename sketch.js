// Global variables
let gameState = "start";
let player;
let enemies = [];
let playerProjectiles = [];
let enemyProjectiles = [];
let explosions = [];
let stars = [];
let nebulaClouds = [];
let particles = [];
let powerups = [];
let score = 0;
let level = 1;
let enemiesDefeated = 0;
let enemiesRequiredForNextLevel = 10;
let lastEnemyTime = 0;
let enemyInterval = 1500; // Enemy spawn interval in milliseconds
let lastPowerupTime = 0;
let powerupInterval = 10000; // Powerup spawn interval in milliseconds
let gameFont;
let titleY = 0;
let gameTitle;
let levelUpAnimation = {active: false, time: 0, duration: 2000};
let leaderboardShown = false;
let leaderboardData = [];
let debugMode = false;

// Email masking function (backup in case the one in supabase-config.js isn't available)
function hashEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'anonymous';
  }
  
  // Get username part (before @)
  const parts = email.split('@');
  const username = parts[0];
  const domain = parts[1];
  
  // Show exactly first 3 characters followed by 3 stars
  let maskedUsername = '';
  if (username.length <= 3) {
    // If username is 3 chars or less, show what we have and fill the rest with stars
    maskedUsername = username + '*'.repeat(3 - username.length);
  } else {
    // If longer than 3 chars, take first 3 and add 3 stars
    maskedUsername = username.substring(0, 3) + '***';
  }
  
  // Mask domain as well, only show the domain extension
  let maskedDomain = '';
  if (domain) {
    const domainParts = domain.split('.');
    if (domainParts.length > 1) {
      // Only show the domain extension (e.g., .com, .org)
      const extension = domainParts[domainParts.length - 1];
      maskedDomain = '*****.' + extension;
    } else {
      maskedDomain = '*****';
    }
  }
  
  return maskedUsername + '@' + maskedDomain;
}

// Preload function to load assets
function preload() {
  gameFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceSansPro-Bold.otf');
}

// Setup function to initialize the canvas and stars
function setup() {
  createCanvas(800, 600);
  frameRate(60);
  textFont(gameFont);
  
  // Initialize game elements
  initStars();
  initNebulaClouds();
  
  // Initialize game title with proper positioning
  gameTitle = {
    x: width / 2,
    y: height / 3,
    scale: 1,
    rotation: 0
  };
  
  // Set initial game state
  gameState = "start";
}

// Main draw loop
function draw() {
  // Always set the background first
  background(10, 5, 30); // Deep space background
  
  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "play") {
    drawPlayScreen();
  } else if (gameState === "gameover") {
    drawGameOverScreen();
  }
}

// Start screen
function drawStartScreen() {
  // Ensure the canvas is drawn before rendering content
  drawStars();
  
  // Ensure gameTitle is initialized
  if (!gameTitle || typeof gameTitle.x === 'undefined') {
    gameTitle = {
      x: width / 2,
      y: height / 3,
      scale: 1,
      rotation: 0
    };
  }
  
  // Animate title position
  gameTitle.y = height / 3 + sin(frameCount * 0.02) * 10;
  gameTitle.scale = 1 + sin(frameCount * 0.01) * 0.05;
  gameTitle.rotation = sin(frameCount * 0.005) * 0.03;
  
  push();
  translate(gameTitle.x, gameTitle.y);
  scale(gameTitle.scale);
  rotate(gameTitle.rotation);
  
  // Draw title with glow effect
  textSize(60);
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(0, 150, 255, 0.8)';
  fill(220, 240, 255);
  textAlign(CENTER);
  text("COSMIC DEFENDER", 0, 0);
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
  pop();
  
  // Draw subtitle
  textSize(24);
  fill(180, 200, 255, 200);
  textAlign(CENTER);
  text("Navigate the stars. Defend the galaxy.", width / 2, height / 2);
  
  // Draw controls info
  textSize(16);
  fill(150, 180, 255, 150 + sin(frameCount * 0.1) * 50);
  text("ARROWS: Move   SPACE: Shoot   Z: Special Attack (when fully charged)", width / 2, height / 2 + 30);
  
  // Spacebar start prompt with pulsing effect
  textSize(20);
  let pulseIntensity = 150 + sin(frameCount * 0.1) * 50;
  fill(150, 180, 255, pulseIntensity);
  text("PRESS SPACEBAR TO START", width / 2, height / 2 + 70);
  
  // Draw start button
  let buttonX = width / 2;
  let buttonY = height / 2 + 110; // Moved down to accommodate the spacebar text
  let buttonWidth = 200;
  let buttonHeight = 50;
  
  // Check if mouse is over button
  if (mouseX > buttonX - buttonWidth/2 && mouseX < buttonX + buttonWidth/2 &&
      mouseY > buttonY - buttonHeight/2 && mouseY < buttonY + buttonHeight/2) {
    buttonHover = true;
  } else {
    buttonHover = false;
  }
  
  // Draw button with glow effect when hovered
  drawingContext.shadowBlur = buttonHover ? 15 : 5;
  drawingContext.shadowColor = 'rgba(0, 150, 255, 0.8)';
  
  // Button background
  fill(20, 40, 100, buttonHover ? 230 : 200);
  stroke(0, 150, 255, buttonHover ? 255 : 200);
  strokeWeight(2);
  rect(buttonX - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 10);
  
  // Button text
  textSize(buttonHover ? 22 : 20);
  fill(255);
  noStroke();
  text("START MISSION", buttonX, buttonY + 7);
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
  
  // Instructions
  textSize(16);
  fill(150, 180, 255, 150);
  text("Collect powerups to enhance your ship", width / 2, height - 50);
}

// Play screen
function drawPlayScreen() {
  // Apply screen shake if active
  if (screenShake.active) {
    let elapsed = millis() - screenShake.startTime;
    if (elapsed > screenShake.duration) {
      screenShake.active = false;
    } else {
      // Calculate shake intensity based on remaining time
      let progress = elapsed / screenShake.duration;
      let currentIntensity = screenShake.intensity * (1 - progress);
      
      // Apply random translation for shake effect
      translate(random(-currentIntensity, currentIntensity), 
                random(-currentIntensity, currentIntensity));
    }
  }
  
  drawStars();
  updateParticles();
  updateExplosions();
  updatePowerups();
  player.update();
  player.draw();
  updateEnemies();
  updateProjectiles();
  checkCollisions();
  checkLevelUp();
  drawHUD();
}

// Player class
class Player {
  constructor() {
    this.width = 50;
    this.height = 30;
    this.x = width / 2 - this.width / 2;
    this.y = height - this.height - 10;
    this.speed = 5;
    this.lives = 3;
    this.shootCooldown = 200; // Shooting cooldown in milliseconds
    this.lastShootTime = 0;
    this.thrusterAnimation = 0;
    this.shieldActive = false;
    this.shieldTime = 0;
    this.invincible = false;
    this.preventFirstShot = true; // Flag to prevent firing immediately when game starts
    
    // Energy system
    this.maxEnergy = 100;
    this.energy = 0; // Start with empty energy
    this.energyRechargeRate = 0.1; // Reduced recharge rate
    this.specialAttackCost = this.maxEnergy; // Special attack requires full energy
    this.specialAttackReady = false;
    this.lastSpecialAttackTime = 0;
    
    // Powerup properties
    this.powerups = {
      rapidFire: {active: false, duration: 5000, startTime: 0},
      tripleShot: {active: false, duration: 8000, startTime: 0},
      speedBoost: {active: false, duration: 7000, startTime: 0},
      shield: {active: false, duration: 10000, startTime: 0}
    };
    
    // Base stats that can be modified by powerups
    this.baseSpeed = 5;
    this.baseShootCooldown = 200;
  }

  update() {
    // Movement
    if (keyIsDown(LEFT_ARROW) && this.x > 0) {
      this.x -= this.speed;
    }
    if (keyIsDown(RIGHT_ARROW) && this.x < width - this.width) {
      this.x += this.speed;
    }
    
    // Special attack with 'Z' key - only when energy is full
    if (keyIsDown(90) && this.energy >= this.maxEnergy) { // 90 is 'Z' key
      this.specialAttack();
      this.energy = 0; // Reset energy to 0 after using special attack
      this.specialAttackReady = false;
      this.lastSpecialAttackTime = millis();
    }
    
    // Regular shooting
    if (keyIsDown(32) && millis() - this.lastShootTime > this.shootCooldown) { // 32 is spacebar
      // If this is the first frame and spacebar is still pressed from starting the game, ignore it
      if (this.preventFirstShot) {
        this.preventFirstShot = false;
      } else {
        this.shoot();
        this.lastShootTime = millis();
      }
    }
    
    // If spacebar is released, clear the prevention flag
    if (!keyIsDown(32)) {
      this.preventFirstShot = false;
    }
    
    // Animate thrusters
    this.thrusterAnimation = (this.thrusterAnimation + 0.2) % 6;
    
    // Energy recharge
    if (this.energy < this.maxEnergy) {
      // Recharge faster at higher levels
      let levelBonus = 1 + (level - 1) * 0.1; // 10% faster recharge per level
      this.energy += this.energyRechargeRate * levelBonus;
      
      if (this.energy >= this.maxEnergy) {
        this.energy = this.maxEnergy;
        this.specialAttackReady = true;
        
        // Create a small visual effect when special attack is ready
        if (!this.specialAttackReady) {
          createExplosion(
            this.x + this.width / 2,
            this.y + this.height / 2,
            [0, 200, 255],
            30
          );
        }
      }
    }
    
    // Update powerups
    this.updatePowerups();
  }
  
  updatePowerups() {
    const currentTime = millis();
    
    // Check and update each powerup
    for (let powerupType in this.powerups) {
      let powerup = this.powerups[powerupType];
      
      if (powerup.active && currentTime - powerup.startTime > powerup.duration) {
        powerup.active = false;
        
        // Reset stats based on powerup type
        switch(powerupType) {
          case 'rapidFire':
            this.shootCooldown = this.baseShootCooldown;
            break;
          case 'speedBoost':
            this.speed = this.baseSpeed;
            break;
          case 'shield':
            this.shieldActive = false;
            this.invincible = false;
            break;
          // Triple shot doesn't need reset as it's checked during shooting
        }
      }
    }
  }
  
  activatePowerup(type) {
    const powerup = this.powerups[type];
    if (powerup) {
      powerup.active = true;
      powerup.startTime = millis();
      
      // Apply powerup effects
      switch(type) {
        case 'rapidFire':
          this.shootCooldown = this.baseShootCooldown / 3;
          break;
        case 'speedBoost':
          this.speed = this.baseSpeed * 1.7;
          break;
        case 'shield':
          this.shieldActive = true;
          this.invincible = true;
          // Call the dedicated shield activation method for consistency
          this.activateShield();
          break;
        // Triple shot is handled in the shoot method
      }
    }
  }

  draw() {
    push();
    translate(this.x + this.width / 2, this.y + this.height / 2);
    
    // Draw shield if active
    if (this.shieldActive) {
      // Outer glow
      drawingContext.shadowBlur = 20;
      drawingContext.shadowColor = 'rgba(0, 150, 255, 0.9)';
      
      // Pulsating shield effect
      let pulseAmount = 5 * sin(frameCount * 0.1);
      
      // Outer shield ring
      noFill();
      stroke(0, 150, 255, 150 + sin(frameCount * 0.1) * 50);
      strokeWeight(3);
      ellipse(0, 0, this.width + 30 + pulseAmount, this.height + 30 + pulseAmount);
      
      // Middle shield ring
      stroke(100, 200, 255, 100 + sin(frameCount * 0.15) * 50);
      strokeWeight(2);
      ellipse(0, 0, this.width + 40 + pulseAmount, this.height + 40 + pulseAmount);
      
      // Inner shield ring
      stroke(200, 230, 255, 80 + sin(frameCount * 0.2) * 40);
      strokeWeight(1.5);
      ellipse(0, 0, this.width + 20 + pulseAmount, this.height + 20 + pulseAmount);
    }
    
    // Draw ship body
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(0, 255, 100, 0.5)';
    fill(20, 180, 120);
    stroke(0, 255, 150);
    strokeWeight(2);
    
    // Ship body - sleek design
    beginShape();
    vertex(-this.width/2, this.height/2); // Bottom left
    vertex(-this.width/4, -this.height/4); // Mid left
    vertex(0, -this.height/2); // Top center
    vertex(this.width/4, -this.height/4); // Mid right
    vertex(this.width/2, this.height/2); // Bottom right
    vertex(this.width/4, this.height/3); // Indent right
    vertex(-this.width/4, this.height/3); // Indent left
    endShape(CLOSE);
    
    // Cockpit
    drawingContext.shadowBlur = 5;
    drawingContext.shadowColor = 'rgba(100, 200, 255, 0.7)';
    fill(100, 200, 255, 200);
    noStroke();
    ellipse(0, -this.height/6, this.width/3, this.height/3);
    
    // Thrusters with animation
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(255, 100, 0, 0.8)';
    
    // Left thruster
    fill(255, 150, 0);
    rect(-this.width/3, this.height/3, this.width/6, this.height/6);
    
    // Right thruster
    rect(this.width/3 - this.width/6, this.height/3, this.width/6, this.height/6);
    
    // Thruster flames
    noStroke();
    for (let i = 0; i < 3; i++) {
      let flameSize = 5 + sin(frameCount * 0.3 + i) * 3;
      let alpha = 200 - i * 50;
      
      // Left flame
      fill(255, 100 + i * 50, 0, alpha);
      ellipse(-this.width/3 + this.width/12, this.height/3 + this.height/6 + flameSize/2 + i*3, 
              this.width/8, flameSize);
      
      // Right flame
      ellipse(this.width/3 - this.width/12, this.height/3 + this.height/6 + flameSize/2 + i*3, 
              this.width/8, flameSize);
    }
    
    // Wing lights
    fill(255, 0, 0, 150 + sin(frameCount * 0.2) * 50);
    ellipse(-this.width/2 + 5, 0, 4, 4);
    fill(0, 255, 0, 150 + sin(frameCount * 0.2 + PI) * 50);
    ellipse(this.width/2 - 5, 0, 4, 4);
    
    pop();
    
    // Reset shadow
    drawingContext.shadowBlur = 0;
  }

  shoot() {
    // Create projectile with particle effect
    if (this.powerups.tripleShot.active) {
      // Triple shot pattern
      let projectile1 = new Projectile(this.x + this.width / 2 - 2.5, this.y, 0, -8, "player");
      let projectile2 = new Projectile(this.x + this.width / 2 - 2.5, this.y, -2, -7.5, "player");
      let projectile3 = new Projectile(this.x + this.width / 2 - 2.5, this.y, 2, -7.5, "player");
      
      playerProjectiles.push(projectile1, projectile2, projectile3);
    } else {
      // Regular shot
      let projectile = new Projectile(this.x + this.width / 2 - 2.5, this.y, 0, -8, "player");
      playerProjectiles.push(projectile);
    }
    
    // Add muzzle flash particles
    for (let i = 0; i < 8; i++) {
      let angle = random(PI + PI/4, PI + 3*PI/4);
      let speed = random(1, 3);
      particles.push({
        x: this.x + this.width / 2,
        y: this.y,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        size: random(2, 5),
        color: [0, 255, 200],
        alpha: 255,
        life: 20
      });
    }
  }
  
  specialAttack() {
    // Create a radial blast of projectiles
    const numProjectiles = 24; // Increased from 16
    const angleStep = TWO_PI / numProjectiles;
    
    // First wave - outward projectiles
    for (let i = 0; i < numProjectiles; i++) {
      let angle = i * angleStep;
      let vx = cos(angle) * 7; // Increased speed
      let vy = sin(angle) * 7;
      
      let projectile = new Projectile(
        this.x + this.width / 2, 
        this.y + this.height / 2, 
        vx, vy, 
        "player"
      );
      
      // Make special attack projectiles larger and more powerful
      projectile.width = 8;
      projectile.height = 20;
      projectile.specialAttack = true;
      
      playerProjectiles.push(projectile);
    }
    
    // Second wave - delayed spiral (added for more visual impact)
    setTimeout(() => {
      for (let i = 0; i < numProjectiles; i++) {
        let angle = i * angleStep + PI/numProjectiles; // Offset angle
        let vx = cos(angle) * 5;
        let vy = sin(angle) * 5;
        
        let projectile = new Projectile(
          this.x + this.width / 2, 
          this.y + this.height / 2, 
          vx, vy, 
          "player"
        );
        
        // Make special attack projectiles larger and more powerful
        projectile.width = 6;
        projectile.height = 15;
        projectile.specialAttack = true;
        
        playerProjectiles.push(projectile);
      }
    }, 150); // Slight delay for second wave
    
    // Add special attack visual effect
    createExplosion(
      this.x + this.width / 2,
      this.y + this.height / 2,
      [0, 200, 255],
      150 // Larger explosion
    );
    
    // Add screen shake effect
    screenShake = {
      active: true,
      intensity: 10,
      duration: 500,
      startTime: millis()
    };
    
    // Clear all enemy projectiles as a defensive measure
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
      // Create small explosions where projectiles were
      createExplosion(
        enemyProjectiles[i].x,
        enemyProjectiles[i].y,
        [0, 150, 255],
        20
      );
    }
    enemyProjectiles = [];
    
    // Damage nearby enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      // Calculate distance to enemy
      let dx = enemies[i].x + enemies[i].width/2 - (this.x + this.width/2);
      let dy = enemies[i].y + enemies[i].height/2 - (this.y + this.height/2);
      let distance = sqrt(dx*dx + dy*dy);
      
      // If enemy is within blast radius
      if (distance < 150) {
        // Damage or destroy based on distance
        if (distance < 80) {
          // Direct hit - destroy immediately
          createExplosion(
            enemies[i].x + enemies[i].width/2,
            enemies[i].y + enemies[i].height/2,
            [0, 200, 255],
            40
          );
          
          // Add score
          score += enemies[i].points * level;
          enemiesDefeated++;
          
          enemies.splice(i, 1);
        } else {
          // Partial damage
          enemies[i].health -= 2;
          
          // Create hit effect
          createExplosion(
            enemies[i].x + enemies[i].width/2,
            enemies[i].y + enemies[i].height/2,
            [0, 150, 255],
            20
          );
          
          // Check if enemy is destroyed
          if (enemies[i].health <= 0) {
            createExplosion(
              enemies[i].x + enemies[i].width/2,
              enemies[i].y + enemies[i].height/2,
              [0, 200, 255],
              40
            );
            
            // Add score
            score += enemies[i].points * level;
            enemiesDefeated++;
            
            enemies.splice(i, 1);
          }
        }
      }
    }
  }
  
  activateShield() {
    this.shieldActive = true;
    this.invincible = true;
    this.shieldTime = millis();
  }
}

// Enemy class
class Enemy {
  constructor(type) {
    this.type = type;
    if (type === 0) { // Small red enemy
      this.width = 25;
      this.height = 20;
      this.health = 1;
      this.speed = 1.5;
      this.points = 10;
      this.canShoot = false;
    } else if (type === 1) { // Medium yellow enemy
      this.width = 35;
      this.height = 35;
      this.health = 2;
      this.speed = 1.2;
      this.points = 20;
      this.canShoot = true;
    } else if (type === 2) { // Large blue enemy
      this.width = 50;
      this.height = 50;
      this.health = 3;
      this.speed = 0.8;
      this.points = 30;
      this.canShoot = true;
    }
    this.x = random(0, width - this.width);
    this.y = -this.height;
    this.lastShootTime = 0;
    this.shootInterval = random(1500, 3000); // Enemy shooting interval in milliseconds
    this.rotation = 0;
    this.rotationSpeed = random(-0.02, 0.02);
  }

  update() {
    this.y += this.speed;
    this.rotation += this.rotationSpeed;
    
    if (this.canShoot && millis() - this.lastShootTime > this.shootInterval) {
      this.shoot();
      this.lastShootTime = millis();
    }
  }

  draw() {
    push();
    translate(this.x + this.width/2, this.y + this.height/2);
    rotate(this.rotation);
    
    if (this.type === 0) { // Small red enemy - dart shape
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = 'rgba(255, 50, 50, 0.7)';
      
      fill(150, 20, 20);
      stroke(255, 50, 50);
      strokeWeight(2);
      
      // Dart shape
      beginShape();
      vertex(0, -this.height/2);
      vertex(this.width/2, 0);
      vertex(0, this.height/2);
      vertex(-this.width/2, 0);
      endShape(CLOSE);
      
      // Center eye
      fill(255, 200, 200);
      noStroke();
      ellipse(0, 0, this.width/3, this.width/3);
      
      // Pulsing core
      fill(255, 50, 50, 150 + sin(frameCount * 0.1) * 50);
      ellipse(0, 0, this.width/5, this.width/5);
      
    } else if (this.type === 1) { // Medium yellow enemy - hexagon
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = 'rgba(255, 255, 0, 0.7)';
      
      fill(100, 100, 0);
      stroke(255, 255, 0);
      strokeWeight(2);
      
      // Hexagon shape
      beginShape();
      for (let i = 0; i < 6; i++) {
        let angle = i * TWO_PI / 6;
        let x = cos(angle) * this.width/2;
        let y = sin(angle) * this.height/2;
        vertex(x, y);
      }
      endShape(CLOSE);
      
      // Inner details
      noFill();
      stroke(255, 255, 0, 150);
      ellipse(0, 0, this.width * 0.6, this.height * 0.6);
      
      // Center core
      fill(255, 255, 0, 150 + sin(frameCount * 0.15) * 50);
      noStroke();
      ellipse(0, 0, this.width/4, this.height/4);
      
    } else if (this.type === 2) { // Large blue enemy - octagon with details
      drawingContext.shadowBlur = 20;
      drawingContext.shadowColor = 'rgba(50, 50, 255, 0.7)';
      
      fill(20, 20, 150);
      stroke(50, 50, 255);
      strokeWeight(2);
      
      // Octagon shape
      beginShape();
      for (let i = 0; i < 8; i++) {
        let angle = i * TWO_PI / 8;
        let x = cos(angle) * this.width/2;
        let y = sin(angle) * this.height/2;
        vertex(x, y);
      }
      endShape(CLOSE);
      
      // Inner ring
      noFill();
      stroke(100, 100, 255, 200);
      ellipse(0, 0, this.width * 0.7, this.height * 0.7);
      
      // Center core with pulsing effect
      fill(100, 100, 255, 150 + sin(frameCount * 0.1) * 50);
      noStroke();
      ellipse(0, 0, this.width/3, this.height/3);
      
      // Energy spikes
      stroke(200, 200, 255, 100 + sin(frameCount * 0.2) * 50);
      for (let i = 0; i < 8; i++) {
        let angle = i * TWO_PI / 8 + frameCount * 0.01;
        let x1 = cos(angle) * this.width/6;
        let y1 = sin(angle) * this.height/6;
        let x2 = cos(angle) * this.width/3;
        let y2 = sin(angle) * this.height/3;
        line(x1, y1, x2, y2);
      }
    }
    
    pop();
    
    // Reset shadow
    drawingContext.shadowBlur = 0;
  }

  shoot() {
    // Create projectile that only moves vertically downward
    let projectile = new Projectile(
      this.x + this.width / 2 - 2.5, 
      this.y + this.height, 
      0,  // No horizontal movement
      4,  // Only vertical movement downward
      "enemy"
    );
    enemyProjectiles.push(projectile);
    
    // Add muzzle flash particles
    for (let i = 0; i < 6; i++) {
      let angle = PI/2 + random(-PI/6, PI/6); // Mostly downward with slight variation
      let speed = random(1, 2);
      particles.push({
        x: this.x + this.width / 2,
        y: this.y + this.height,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        size: random(2, 4),
        color: this.type === 0 ? [255, 50, 50] : 
               this.type === 1 ? [255, 255, 0] : [50, 50, 255],
        alpha: 255,
        life: 15
      });
    }
  }
}

// Projectile class
class Projectile {
  constructor(x, y, vx, vy, owner) {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = owner === "player" ? 15 : 8;
    this.vx = vx;
    this.vy = vy;
    this.owner = owner;
    this.age = 0;
    this.specialAttack = false; // Flag for special attack projectiles
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;
    
    // Add trail particles
    if (frameCount % 2 === 0) {
      let color = this.owner === "player" ? 
                  (this.specialAttack ? [0, 200, 255] : [0, 255, 200]) : 
                  [255, 50, 50];
      
      // More particles for special attack projectiles
      let particleChance = this.specialAttack ? 0.8 : 
                          (this.owner === "player" ? 0.3 : 0.5);
      
      if (random() > particleChance) {
        particles.push({
          x: this.x + this.width/2,
          y: this.y + (this.owner === "player" ? this.height/2 : 0),
          vx: random(-0.5, 0.5),
          vy: this.owner === "player" ? random(0, 1) : random(-1, 0),
          size: random(1, this.specialAttack ? 4 : 3),
          color: color,
          alpha: this.specialAttack ? 200 : 150,
          life: this.specialAttack ? 15 : 10
        });
      }
    }
  }

  draw() {
    push();
    
    if (this.owner === "player") {
      if (this.specialAttack) {
        // Special attack projectile - more intense energy beam
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = 'rgba(0, 200, 255, 0.9)';
        
        // Pulsing core
        let pulseIntensity = 200 + sin(this.age * 0.3) * 55;
        fill(200, pulseIntensity, 255);
        noStroke();
        rect(this.x, this.y, this.width, this.height, 2);
        
        // Outer glow
        fill(0, 150, 255, 180);
        rect(this.x - 3, this.y, this.width + 6, this.height, 5);
      } else {
        // Regular player projectile - energy beam
        drawingContext.shadowBlur = 10;
        drawingContext.shadowColor = 'rgba(0, 255, 200, 0.7)';
        
        // Glowing core
        fill(200, 255, 255);
        noStroke();
        rect(this.x, this.y, this.width, this.height, 2);
        
        // Outer glow
        fill(0, 255, 200, 150);
        rect(this.x - 2, this.y, this.width + 4, this.height, 4);
      }
    } else {
      // Enemy projectile - energy ball
      drawingContext.shadowBlur = 8;
      drawingContext.shadowColor = 'rgba(255, 50, 50, 0.7)';
      
      // Pulsing effect
      let pulseSize = sin(this.age * 0.2) * 2;
      
      // Core
      fill(255, 200, 200);
      noStroke();
      ellipse(this.x + this.width/2, this.y + this.height/2, 
              this.width, this.height);
      
      // Outer glow
      fill(255, 50, 50, 150);
      ellipse(this.x + this.width/2, this.y + this.height/2, 
              this.width + pulseSize, this.height + pulseSize);
    }
    
    pop();
    
    // Reset shadow
    drawingContext.shadowBlur = 0;
  }
}

// Star background
function initStars() {
  stars = [];
  // Small distant stars (more of them)
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: random(0, width),
      y: random(0, height),
      size: random(0.5, 2),
      speed: random(0.05, 0.2),
      brightness: random(150, 255),
      twinkle: random(0.01, 0.05)
    });
  }
  
  // Medium stars
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: random(0, width),
      y: random(0, height),
      size: random(2, 3.5),
      speed: random(0.2, 0.4),
      brightness: random(200, 255),
      twinkle: random(0.03, 0.08)
    });
  }
  
  // Few bright stars
  for (let i = 0; i < 15; i++) {
    stars.push({
      x: random(0, width),
      y: random(0, height),
      size: random(3.5, 5),
      speed: random(0.3, 0.5),
      brightness: 255,
      twinkle: random(0.05, 0.1)
    });
  }
}

function initNebulaClouds() {
  nebulaClouds = [];
  // Create colorful nebula clouds
  for (let i = 0; i < 5; i++) {
    nebulaClouds.push({
      x: random(0, width),
      y: random(0, height),
      size: random(150, 300),
      color: [
        random(50, 100), // R
        random(0, 50),   // G
        random(100, 200) // B
      ],
      alpha: random(20, 40),
      speed: random(0.01, 0.05)
    });
  }
}

function drawStars() {
  // Draw nebula clouds first (background layer)
  for (let cloud of nebulaClouds) {
    noStroke();
    fill(cloud.color[0], cloud.color[1], cloud.color[2], cloud.alpha);
    ellipse(cloud.x, cloud.y, cloud.size, cloud.size);
    cloud.y += cloud.speed;
    if (cloud.y - cloud.size/2 > height) {
      cloud.y = -cloud.size/2;
      cloud.x = random(0, width);
    }
  }
  
  // Draw stars on top
  noStroke();
  for (let star of stars) {
    // Twinkle effect
    let brightness = star.brightness + sin(frameCount * star.twinkle) * 50;
    fill(brightness);
    
    // Draw star with glow effect for larger stars
    if (star.size > 3) {
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = 'rgba(255, 255, 255, 0.7)';
    } else {
      drawingContext.shadowBlur = 0;
    }
    
    ellipse(star.x, star.y, star.size, star.size);
    
    // Reset shadow
    drawingContext.shadowBlur = 0;
    
    // Move star
    star.y += star.speed;
    if (star.y > height) {
      star.y = 0;
      star.x = random(0, width);
    }
  }
}

// Enemy management
function updateEnemies() {
  if (millis() - lastEnemyTime > enemyInterval) {
    // Weighted enemy type selection based on level
    let typeWeights;
    
    if (level <= 2) {
      typeWeights = [0, 0, 0, 1, 1, 2]; // More small enemies at low levels
    } else if (level <= 4) {
      typeWeights = [0, 0, 1, 1, 1, 2]; // More medium enemies at mid levels
    } else {
      typeWeights = [0, 1, 1, 2, 2, 2]; // More large enemies at high levels
    }
    
    let type = typeWeights[Math.floor(random(typeWeights.length))];
    let enemy = new Enemy(type);
    
    // Scale enemy health with level
    if (level > 3) {
      enemy.health += Math.floor((level - 3) / 2);
    }
    
    enemies.push(enemy);
    lastEnemyTime = millis();
    
    // Gradually decrease spawn interval for increasing difficulty
    enemyInterval = max(300, enemyInterval - 5);
  }
  
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    enemies[i].draw();
    if (enemies[i].y > height) {
      enemies.splice(i, 1); // Remove enemies that go off-screen
    }
  }
}

// Projectile management
function updateProjectiles() {
  for (let i = playerProjectiles.length - 1; i >= 0; i--) {
    playerProjectiles[i].update();
    playerProjectiles[i].draw();
    if (playerProjectiles[i].y < 0) {
      playerProjectiles.splice(i, 1); // Remove off-screen player projectiles
    }
  }
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    enemyProjectiles[i].update();
    enemyProjectiles[i].draw();
    if (enemyProjectiles[i].y > height || enemyProjectiles[i].x < 0 || enemyProjectiles[i].x > width) {
      enemyProjectiles.splice(i, 1); // Remove off-screen enemy projectiles
    }
  }
}

// Collision detection
function checkCollisions() {
  // Player projectiles vs enemies
  for (let i = playerProjectiles.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (collideRectRect(playerProjectiles[i].x, playerProjectiles[i].y, playerProjectiles[i].width, playerProjectiles[i].height,
                          enemies[j].x, enemies[j].y, enemies[j].width, enemies[j].height)) {
        enemies[j].health--;
        
        // Create hit effect
        createExplosion(
          playerProjectiles[i].x + playerProjectiles[i].width/2,
          playerProjectiles[i].y,
          [0, 255, 200],
          20
        );
        
        if (enemies[j].health <= 0) {
          // Create explosion based on enemy type
          let color;
          let size;
          
          if (enemies[j].type === 0) {
            color = [255, 50, 50];
            size = 30;
          } else if (enemies[j].type === 1) {
            color = [255, 255, 0];
            size = 50;
          } else {
            color = [50, 50, 255];
            size = 70;
          }
          
          createExplosion(
            enemies[j].x + enemies[j].width/2,
            enemies[j].y + enemies[j].height/2,
            color,
            size
          );
          
          // Add score and count enemy defeat
          score += enemies[j].points * level; // Score multiplier based on level
          enemiesDefeated++;
          
          // Small chance to drop a powerup when enemy is destroyed
          if (random() < 0.1) {
            const powerupTypes = ['rapidFire', 'tripleShot', 'speedBoost', 'shield'];
            const randomType = powerupTypes[Math.floor(random(powerupTypes.length))];
            
            let powerup = new Powerup(randomType);
            powerup.x = enemies[j].x + enemies[j].width/2;
            powerup.y = enemies[j].y + enemies[j].height/2;
            powerups.push(powerup);
          }
          
          enemies.splice(j, 1);
        }
        
        playerProjectiles.splice(i, 1);
        break;
      }
    }
  }
  
  // Enemy projectiles vs player
  if (!player.invincible) {
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
      // Use a more precise collision detection for enemy projectiles
      // For enemy projectiles, which are drawn as circles, use a circle-based collision
      let projectileRadius = enemyProjectiles[i].width / 2;
      let projectileCenterX = enemyProjectiles[i].x + projectileRadius;
      let projectileCenterY = enemyProjectiles[i].y + projectileRadius;
      
      // Create a slightly larger hitbox for the player to make collisions more reliable
      let playerHitboxX = player.x + player.width * 0.1; // 10% inset from left
      let playerHitboxY = player.y + player.height * 0.1; // 10% inset from top
      let playerHitboxWidth = player.width * 0.8; // 80% of original width
      let playerHitboxHeight = player.height * 0.8; // 80% of original height
      
      // Check if the projectile's center is inside the player's hitbox
      if (collideRectRect(
          projectileCenterX - projectileRadius, projectileCenterY - projectileRadius, 
          projectileRadius * 2, projectileRadius * 2,
          playerHitboxX, playerHitboxY, playerHitboxWidth, playerHitboxHeight)) {
        
        player.lives--;
        
        // Create hit effect
        createExplosion(
          enemyProjectiles[i].x,
          enemyProjectiles[i].y,
          [255, 50, 50],
          30
        );
        
        if (player.lives <= 0) {
          // Create player explosion
          createExplosion(
            player.x + player.width/2,
            player.y + player.height/2,
            [0, 255, 150],
            80
          );
          
          gameState = "gameover";
        } else {
          // If player still has lives, provide temporary invincibility
          player.invincible = true;
          setTimeout(() => {
            // Only remove invincibility if shield is not active
            if (!player.shieldActive) {
              player.invincible = false;
            }
          }, 2000); // 2 seconds of invincibility after being hit
        }
        
        enemyProjectiles.splice(i, 1);
      }
    }
  } else if (player.shieldActive) {
    // If shield is active, destroy enemy projectiles that hit the shield without damaging the player
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
      // Use a larger collision area for the shield
      let shieldRadius = player.width + 30;
      let playerCenterX = player.x + player.width/2;
      let playerCenterY = player.y + player.height/2;
      
      // Calculate projectile center
      let projectileRadius = enemyProjectiles[i].width / 2;
      let projectileCenterX = enemyProjectiles[i].x + projectileRadius;
      let projectileCenterY = enemyProjectiles[i].y + projectileRadius;
      
      // Calculate distance between centers
      let dx = playerCenterX - projectileCenterX;
      let dy = playerCenterY - projectileCenterY;
      let distance = sqrt(dx*dx + dy*dy);
      
      if (distance < shieldRadius) {
        // Create shield hit effect
        createExplosion(
          enemyProjectiles[i].x,
          enemyProjectiles[i].y,
          [50, 150, 255], // Blue shield color
          20
        );
        
        // Remove the projectile
        enemyProjectiles.splice(i, 1);
        
        // No damage to player
      }
    }
    
    // If shield is active, also destroy enemies that hit the shield without damaging the player
    for (let i = enemies.length - 1; i >= 0; i--) {
      // Use a larger collision area for the shield
      let shieldRadius = player.width + 30;
      let playerCenterX = player.x + player.width/2;
      let playerCenterY = player.y + player.height/2;
      
      // Calculate enemy center
      let enemyCenterX = enemies[i].x + enemies[i].width/2;
      let enemyCenterY = enemies[i].y + enemies[i].height/2;
      
      // Calculate distance between centers
      let dx = playerCenterX - enemyCenterX;
      let dy = playerCenterY - enemyCenterY;
      let distance = sqrt(dx*dx + dy*dy);
      
      if (distance < shieldRadius) {
        // Store enemy points before removing it
        let enemyPoints = enemies[i].points;
        
        // Create shield hit effect
        createExplosion(
          enemies[i].x + enemies[i].width/2,
          enemies[i].y + enemies[i].height/2,
          [50, 150, 255], // Blue shield color
          40
        );
        
        // Remove the enemy
        enemies.splice(i, 1);
        
        // Add score for the enemy
        score += enemyPoints * level;
        enemiesDefeated++;
        
        // No damage to player
      }
    }
  }
  
  // Enemies vs player
  if (!player.invincible) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      // Create a slightly larger hitbox for the player to make collisions more reliable
      let playerHitboxX = player.x + player.width * 0.1; // 10% inset from left
      let playerHitboxY = player.y + player.height * 0.1; // 10% inset from top
      let playerHitboxWidth = player.width * 0.8; // 80% of original width
      let playerHitboxHeight = player.height * 0.8; // 80% of original height
      
      if (collideRectRect(enemies[i].x, enemies[i].y, enemies[i].width, enemies[i].height,
                          playerHitboxX, playerHitboxY, playerHitboxWidth, playerHitboxHeight)) {
        player.lives--;
        
        // Create explosion based on enemy type
        let color;
        let size;
        
        if (enemies[i].type === 0) {
          color = [255, 50, 50];
          size = 30;
        } else if (enemies[i].type === 1) {
          color = [255, 255, 0];
          size = 50;
        } else {
          color = [50, 50, 255];
          size = 70;
        }
        
        createExplosion(
          enemies[i].x + enemies[i].width/2,
          enemies[i].y + enemies[i].height/2,
          color,
          size
        );
        
        if (player.lives <= 0) {
          // Create player explosion
          createExplosion(
            player.x + player.width/2,
            player.y + player.height/2,
            [0, 255, 150],
            80
          );
          
          gameState = "gameover";
        } else {
          // If player still has lives, provide temporary invincibility
          player.invincible = true;
          setTimeout(() => {
            // Only remove invincibility if shield is not active
            if (!player.shieldActive) {
              player.invincible = false;
            }
          }, 2000); // 2 seconds of invincibility after being hit
        }
        
        enemies.splice(i, 1);
      }
    }
  } else if (player.shieldActive) {
    // If shield is active, destroy enemies that hit the shield without damaging the player
    for (let i = enemies.length - 1; i >= 0; i--) {
      // Use a larger collision area for the shield
      let shieldRadius = player.width + 30;
      let playerCenterX = player.x + player.width/2;
      let playerCenterY = player.y + player.height/2;
      
      // Calculate enemy center
      let enemyCenterX = enemies[i].x + enemies[i].width/2;
      let enemyCenterY = enemies[i].y + enemies[i].height/2;
      
      // Calculate distance between centers
      let dx = playerCenterX - enemyCenterX;
      let dy = playerCenterY - enemyCenterY;
      let distance = sqrt(dx*dx + dy*dy);
      
      if (distance < shieldRadius) {
        // Store enemy points before removing it
        let enemyPoints = enemies[i].points;
        
        // Create shield hit effect
        createExplosion(
          enemies[i].x + enemies[i].width/2,
          enemies[i].y + enemies[i].height/2,
          [50, 150, 255], // Blue shield color
          40
        );
        
        // Remove the enemy
        enemies.splice(i, 1);
        
        // Add score for the enemy
        score += enemyPoints * level;
        enemiesDefeated++;
        
        // No damage to player
      }
    }
  }
}

// Rectangle collision helper function
function collideRectRect(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

// Heads-Up Display (HUD)
function drawHUD() {
  // Score and level display with glow
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(0, 150, 255, 0.7)';
  
  textSize(24);
  fill(200, 230, 255);
  textAlign(LEFT);
  text("SCORE: " + score, 20, 35);
  
  // Level display
  textAlign(CENTER);
  text("LEVEL " + level, width / 2, 35);
  
  // Progress to next level indicator
  let progressWidth = 150;
  let progress = enemiesDefeated / enemiesRequiredForNextLevel;
  
  // Progress bar background
  noStroke();
  fill(50, 50, 80);
  rect(width / 2 - progressWidth / 2, 45, progressWidth, 8, 4);
  
  // Progress bar fill
  fill(100, 200, 255);
  rect(width / 2 - progressWidth / 2, 45, progressWidth * progress, 8, 4);
  
  // Lives display
  textAlign(RIGHT);
  text("LIVES: ", width - 120, 35);
  
  // Draw life icons
  for (let i = 0; i < player.lives; i++) {
    fill(20, 180, 120);
    stroke(0, 255, 150);
    strokeWeight(2);
    
    // Small ship icon for each life
    let x = width - 100 + i * 30;
    let y = 30;
    
    // Simple ship shape
    triangle(x, y + 10, x + 10, y - 5, x + 20, y + 10);
  }
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
  
  // Energy bar background
  fill(50, 50, 80);
  noStroke();
  rect(20, height - 30, 200, 15, 5);
  
  // Energy level - based on player's actual energy
  let energyWidth = 196 * (player.energy / player.maxEnergy);
  
  // Color changes based on energy level
  let energyColor;
  let energyText;
  
  if (player.energy >= player.maxEnergy) {
    // Full energy - special attack ready - pulsing bright blue
    let pulseIntensity = 150 + sin(frameCount * 0.1) * 50;
    energyColor = color(0, pulseIntensity, 255);
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(0, 200, 255, 0.9)';
    energyText = "SPECIAL ATTACK READY! (Z)";
    
    // Add small particles around the energy bar when full
    if (frameCount % 5 === 0) {
      particles.push({
        x: random(20, 220),
        y: height - random(25, 35),
        vx: random(-0.5, 0.5),
        vy: random(-0.5, 0.5),
        size: random(1, 3),
        color: [0, 200, 255],
        alpha: 200,
        life: 20
      });
    }
  } else if (player.energy >= player.maxEnergy * 0.75) {
    // Almost full - bright blue
    energyColor = color(0, 180, 255);
    drawingContext.shadowBlur = 8;
    drawingContext.shadowColor = 'rgba(0, 180, 255, 0.7)';
    energyText = "ENERGY CHARGING (75%)";
  } else if (player.energy >= player.maxEnergy * 0.5) {
    // Half full - medium blue
    energyColor = color(0, 150, 220);
    drawingContext.shadowBlur = 5;
    drawingContext.shadowColor = 'rgba(0, 150, 220, 0.6)';
    energyText = "ENERGY CHARGING (50%)";
  } else if (player.energy >= player.maxEnergy * 0.25) {
    // Quarter full - dim blue
    energyColor = color(0, 120, 200);
    drawingContext.shadowBlur = 3;
    drawingContext.shadowColor = 'rgba(0, 120, 200, 0.5)';
    energyText = "ENERGY CHARGING (25%)";
  } else {
    // Low energy - very dim blue
    energyColor = color(0, 80, 150);
    drawingContext.shadowBlur = 2;
    drawingContext.shadowColor = 'rgba(0, 80, 150, 0.4)';
    energyText = "ENERGY DEPLETED";
  }
  
  // Draw energy bar fill
  fill(energyColor);
  rect(22, height - 28, energyWidth, 11, 3);
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
  
  // Energy text and key hint
  textSize(14);
  fill(200, 230, 255);
  textAlign(LEFT);
  text(energyText, 230, height - 17);
  
  // Active powerups display
  let powerupY = height - 60;
  textSize(14);
  textAlign(LEFT);
  fill(200, 230, 255);
  text("ACTIVE POWERUPS:", 20, powerupY);
  
  // Display active powerup icons
  let iconX = 150;
  let iconSpacing = 70;
  
  for (let type in player.powerups) {
    if (player.powerups[type].active) {
      // Calculate remaining time
      let remaining = (player.powerups[type].duration - (millis() - player.powerups[type].startTime)) / 1000;
      
      // Set color based on powerup type
      let color;
      switch(type) {
        case 'rapidFire':
          color = [255, 50, 50]; // Red
          break;
        case 'tripleShot':
          color = [50, 255, 50]; // Green
          break;
        case 'speedBoost':
          color = [255, 255, 50]; // Yellow
          break;
        case 'shield':
          color = [50, 150, 255]; // Blue
          break;
      }
      
      // Draw powerup icon
      fill(color[0], color[1], color[2]);
      stroke(255);
      strokeWeight(1);
      ellipse(iconX, powerupY - 5, 15, 15);
      
      // Draw timer
      noStroke();
      fill(255);
      text(remaining.toFixed(1) + "s", iconX + 10, powerupY);
      
      // Display powerup name
      let powerupName;
      switch(type) {
        case 'rapidFire':
          powerupName = "RAPID FIRE";
          break;
        case 'tripleShot':
          powerupName = "TRIPLE SHOT";
          break;
        case 'speedBoost':
          powerupName = "SPEED BOOST";
          break;
        case 'shield':
          powerupName = "SHIELD";
          break;
      }
      
      // Draw powerup name below the timer
      textSize(12);
      fill(color[0], color[1], color[2]);
      text(powerupName, iconX - 10, powerupY + 15);
      
      iconX += iconSpacing;
    }
  }
  
  // Draw level up animation if active
  if (levelUpAnimation.active) {
    let progress = (millis() - levelUpAnimation.time) / levelUpAnimation.duration;
    
    if (progress >= 1) {
      levelUpAnimation.active = false;
    } else {
      let alpha = 255;
      if (progress < 0.3) {
        alpha = 255 * (progress / 0.3);
      } else if (progress > 0.7) {
        alpha = 255 * (1 - (progress - 0.7) / 0.3);
      }
      
      textSize(40 + sin(frameCount * 0.2) * 5);
      textAlign(CENTER);
      fill(255, 255, 100, alpha);
      drawingContext.shadowBlur = 20;
      drawingContext.shadowColor = 'rgba(255, 255, 0, 0.7)';
      text("LEVEL UP!", width / 2, height / 2);
      
      textSize(24);
      fill(200, 255, 200, alpha);
      text("LEVEL " + level, width / 2, height / 2 + 40);
      
      // Reset shadow
      drawingContext.shadowBlur = 0;
    }
  }
}

// Game over screen
function drawGameOverScreen() {
  // If leaderboard modal is shown, just draw stars in the background
  if (leaderboardShown) {
    drawStars();
    return;
  }
  
  drawStars();
  
  // Game over title with glow
  textSize(60);
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(255, 50, 50, 0.8)';
  fill(255, 100, 100);
  textAlign(CENTER);
  text("MISSION FAILED", width / 2, height / 3 - 20);
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
  
  // Score and level display
  textSize(32);
  fill(200, 200, 255);
  text("FINAL SCORE: " + score, width / 2, height / 2 - 20);
  text("LEVEL REACHED: " + level, width / 2, height / 2 + 20);
  
  // Keyboard shortcuts with pulsing effect
  textSize(18);
  let pulseIntensity = 150 + sin(frameCount * 0.1) * 50;
  fill(150, 180, 255, pulseIntensity);
  text("Press SPACEBAR to restart", width / 2, height / 2 + 50);
  text("Press S to save your score", width / 2, height / 2 + 75);
  
  // Draw leaderboard button
  let leaderboardButtonX = width / 2;
  let leaderboardButtonY = height / 2 + 120; // Moved down to accommodate the new text
  let leaderboardButtonWidth = 220;
  let leaderboardButtonHeight = 50;
  
  // Check if mouse is over leaderboard button
  let leaderboardHover = false;
  if (mouseX > leaderboardButtonX - leaderboardButtonWidth/2 && mouseX < leaderboardButtonX + leaderboardButtonWidth/2 &&
      mouseY > leaderboardButtonY - leaderboardButtonHeight/2 && mouseY < leaderboardButtonY + leaderboardButtonHeight/2) {
    leaderboardHover = true;
  }
  
  // Draw leaderboard button with glow effect when hovered
  drawingContext.shadowBlur = leaderboardHover ? 15 : 5;
  drawingContext.shadowColor = 'rgba(0, 150, 255, 0.8)';
  
  // Button background
  fill(20, 40, 100, leaderboardHover ? 230 : 200);
  stroke(0, 150, 255, leaderboardHover ? 255 : 200);
  strokeWeight(2);
  rect(leaderboardButtonX - leaderboardButtonWidth/2, leaderboardButtonY - leaderboardButtonHeight/2, leaderboardButtonWidth, leaderboardButtonHeight, 10);
  
  // Button text
  textSize(leaderboardHover ? 22 : 20);
  fill(255);
  noStroke();
  text("SAVE SCORE", leaderboardButtonX, leaderboardButtonY + 7);
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
}

// Key press handler
function keyPressed() {
  if (gameState === "start") {
    // Only start the game if spacebar is pressed
    if (keyCode === 32) { // 32 is spacebar
      startGame();
      return false; // Prevent default behavior
    }
  } else if (gameState === "gameover") {
    if (!leaderboardShown) {
      // 'S' key to save score
      if (keyCode === 83) { // 83 is 'S' key
        showLeaderboardModal();
        return false; // Prevent default behavior
      }
      // Spacebar to restart
      else if (keyCode === 32) { // 32 is spacebar
        startGame();
        return false; // Prevent default behavior
      }
    } else {
      // If leaderboard is shown and we're viewing the leaderboard section (not the email input)
      if (document.getElementById('leaderboardSection').style.display === 'block' && keyCode === 32) {
        startGame();
        return false; // Prevent default behavior
      }
    }
  } else if (gameState === "play") {
    // Special attack on Z key when energy is full
    if ((key === 'z' || key === 'Z') && player.energy >= player.maxEnergy) {
      player.specialAttack();
    }
  }
  
  return true; // Allow default behavior for other keys
}

// Start or restart the game
function startGame() {
  player = new Player();
  enemies = [];
  playerProjectiles = [];
  enemyProjectiles = [];
  particles = [];
  explosions = [];
  powerups = [];
  score = 0;
  level = 1;
  enemiesDefeated = 0;
  enemiesRequiredForNextLevel = 10;
  lastEnemyTime = millis();
  lastPowerupTime = millis();
  enemyInterval = 1500;
  powerupInterval = 10000;
  levelUpAnimation.active = false;
  screenShake = {active: false, intensity: 0, duration: 0, startTime: 0};
  leaderboardShown = false;
  gameState = "play";
  
  // Hide leaderboard modal if it's open
  document.getElementById('leaderboardModal').style.display = 'none';
}

// Add mouse click handler for buttons
function mousePressed() {
  if (gameState === "start") {
    let buttonX = width / 2;
    let buttonY = height / 2 + 110; // Updated to match the new button position in start screen
    let buttonWidth = 200;
    let buttonHeight = 50;
    
    if (mouseX > buttonX - buttonWidth/2 && mouseX < buttonX + buttonWidth/2 &&
        mouseY > buttonY - buttonHeight/2 && mouseY < buttonY + buttonHeight/2) {
      startGame();
    }
  } else if (gameState === "gameover" && !leaderboardShown) {
    let buttonX = width / 2;
    let buttonY = height / 2 + 120; // Updated to match the new button position
    let buttonWidth = 220;
    let buttonHeight = 50;
    
    if (mouseX > buttonX - buttonWidth/2 && mouseX < buttonX + buttonWidth/2 &&
        mouseY > buttonY - buttonHeight/2 && mouseY < buttonY + buttonHeight/2) {
      showLeaderboardModal();
    }
  }
}

// Show leaderboard modal
function showLeaderboardModal() {
  leaderboardShown = true;
  
  // Update the final score in the modal
  document.getElementById('finalScore').textContent = score;
  
  // Show the modal
  const modal = document.getElementById('leaderboardModal');
  modal.style.display = 'flex';
  
  // Show submit section, hide leaderboard section
  document.getElementById('submitScoreSection').style.display = 'block';
  document.getElementById('leaderboardSection').style.display = 'none';
  
  // Clear any previous error messages
  document.getElementById('errorMessage').textContent = '';
  
  // Use setTimeout to delay focusing and clearing the input field
  // This prevents the 'S' keypress from being captured by the input
  setTimeout(() => {
    const playerEmailInput = document.getElementById('playerEmail');
    playerEmailInput.value = ''; // Clear any existing value
    playerEmailInput.focus();
  }, 10);
  
  // Set up event listeners if they haven't been set up yet
  setupLeaderboardEventListeners();
}

// Set up event listeners for the leaderboard modal
function setupLeaderboardEventListeners() {
  // Only set up event listeners once
  if (window.leaderboardListenersInitialized) return;
  
  // Function to submit score
  const submitScore = async function() {
    const playerEmail = document.getElementById('playerEmail').value.trim();
    
    // Validate player email
    if (!playerEmail) {
      document.getElementById('errorMessage').textContent = 'Please enter your email';
      return;
    }
    
    // Disable the button while submitting
    const submitButton = document.getElementById('submitScore');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    // Save the score to Supabase
    const result = await saveScore(playerEmail, score, level);
    
    if (result.success) {
      // Show the leaderboard
      await showLeaderboard();
    } else {
      // Show error message
      document.getElementById('errorMessage').textContent = result.error || 'Error saving score. Please try again.';
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Score';
    }
  };
  
  // Function to skip and show leaderboard
  const skipSubmit = async function() {
    await showLeaderboard();
  };
  
  // Submit score button
  document.getElementById('submitScore').addEventListener('click', submitScore);
  
  // Skip button
  document.getElementById('skipSubmit').addEventListener('click', skipSubmit);
  
  // Play again button
  document.getElementById('playAgain').addEventListener('click', function() {
    startGame();
  });
  
  // Add keyboard event listener for the email input field
  document.getElementById('playerEmail').addEventListener('keydown', function(event) {
    // Enter key to submit
    if (event.key === 'Enter') {
      event.preventDefault();
      submitScore();
    }
  });
  
  // Mark as initialized
  window.leaderboardListenersInitialized = true;
}

// Show the leaderboard
async function showLeaderboard() {
  // Fetch top scores
  const result = await getTopScores();
  
  if (result.success) {
    // Hide submit section, show leaderboard section
    document.getElementById('submitScoreSection').style.display = 'none';
    document.getElementById('leaderboardSection').style.display = 'block';
    
    // Clear previous leaderboard entries
    const leaderboardBody = document.getElementById('leaderboardBody');
    leaderboardBody.innerHTML = '';
    
    // Add new entries
    result.data.forEach((entry, index) => {
      const row = document.createElement('tr');
      
      // Highlight the current player's score
      if (entry.email === document.getElementById('playerEmail').value.trim() && 
          entry.score === score && 
          entry.level === level) {
        row.style.backgroundColor = 'rgba(0, 150, 255, 0.3)';
      }
      
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.displayEmail || hashEmail(entry.email)}</td>
        <td>${entry.score}</td>
        <td>${entry.level}</td>
      `;
      
      leaderboardBody.appendChild(row);
    });
    
    // Add spacebar instruction text
    const spacebarText = document.createElement('p');
    spacebarText.innerHTML = 'Press <span style="color: #00c8ff; font-weight: bold;">SPACEBAR</span> to play again';
    spacebarText.style.textAlign = 'center';
    spacebarText.style.marginTop = '10px';
    spacebarText.style.fontSize = '14px';
    
    // Add it after the Play Again button
    const buttonContainer = document.querySelector('#leaderboardSection .button-container');
    buttonContainer.parentNode.insertBefore(spacebarText, buttonContainer.nextSibling);
    
  } else {
    // If there's an error, just show an empty leaderboard
    document.getElementById('submitScoreSection').style.display = 'none';
    document.getElementById('leaderboardSection').style.display = 'block';
    document.getElementById('leaderboardBody').innerHTML = '<tr><td colspan="4">Error loading leaderboard</td></tr>';
  }
}

// Particle system
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 255 / p.life;
    p.life--;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    
    // Draw particle
    noStroke();
    fill(p.color[0], p.color[1], p.color[2], p.alpha);
    ellipse(p.x, p.y, p.size, p.size);
  }
}

// Explosion effect
function createExplosion(x, y, color, size) {
  // Add to explosions array
  explosions.push({
    x: x,
    y: y,
    color: color,
    size: size,
    particles: [],
    frame: 0,
    maxFrames: 30
  });
  
  // Create explosion particles
  for (let i = 0; i < size/2; i++) {
    let angle = random(0, TWO_PI);
    let speed = random(1, 4);
    let life = random(20, 40);
    
    particles.push({
      x: x,
      y: y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      size: random(2, size/5),
      color: color,
      alpha: 255,
      life: life
    });
  }
}

// Update explosions
function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    let e = explosions[i];
    e.frame++;
    
    if (e.frame >= e.maxFrames) {
      explosions.splice(i, 1);
      continue;
    }
    
    // Draw explosion glow
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = `rgba(${e.color[0]}, ${e.color[1]}, ${e.color[2]}, 0.7)`;
    
    let progress = e.frame / e.maxFrames;
    let currentSize = e.size * (1 - progress);
    let alpha = 255 * (1 - progress);
    
    fill(e.color[0], e.color[1], e.color[2], alpha);
    noStroke();
    ellipse(e.x, e.y, currentSize, currentSize);
    
    // Reset shadow
    drawingContext.shadowBlur = 0;
  }
}

// Powerup class
class Powerup {
  constructor(type) {
    this.type = type;
    this.x = random(50, width - 50);
    this.y = -30;
    this.width = 30;
    this.height = 30;
    this.speed = 2;
    this.rotation = 0;
    this.rotationSpeed = random(-0.03, 0.03);
    this.pulseSize = 0;
    
    // Set color based on powerup type
    switch(type) {
      case 'rapidFire':
        this.color = [255, 50, 50]; // Red
        break;
      case 'tripleShot':
        this.color = [50, 255, 50]; // Green
        break;
      case 'speedBoost':
        this.color = [255, 255, 50]; // Yellow
        break;
      case 'shield':
        this.color = [50, 150, 255]; // Blue
        break;
    }
  }
  
  update() {
    this.y += this.speed;
    this.rotation += this.rotationSpeed;
    this.pulseSize = sin(frameCount * 0.1) * 5;
  }
  
  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    
    // Draw glow effect
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.7)`;
    
    // Draw powerup shape
    fill(this.color[0], this.color[1], this.color[2], 200);
    stroke(255);
    strokeWeight(2);
    
    // Different shapes for different powerups
    if (this.type === 'rapidFire') {
      // Lightning bolt shape for rapid fire
      beginShape();
      vertex(-10, -15);
      vertex(0, -5);
      vertex(-5, 5);
      vertex(10, 15);
      vertex(0, 5);
      vertex(5, -5);
      endShape(CLOSE);
    } else if (this.type === 'tripleShot') {
      // Triple line shape for triple shot
      line(-10, -10, -10, 10);
      line(0, -10, 0, 10);
      line(10, -10, 10, 10);
    } else if (this.type === 'speedBoost') {
      // Arrow shape for speed boost
      triangle(-10, 10, 0, -15, 10, 10);
      rect(-5, 5, 10, 10);
    } else if (this.type === 'shield') {
      // Shield shape
      arc(0, 0, 25 + this.pulseSize, 25 + this.pulseSize, PI, TWO_PI);
      line(-12.5 - this.pulseSize/2, 0, 12.5 + this.pulseSize/2, 0);
    }
    
    // Inner glow
    noStroke();
    fill(255, 255, 255, 100 + sin(frameCount * 0.2) * 50);
    ellipse(0, 0, 10, 10);
    
    pop();
    
    // Reset shadow
    drawingContext.shadowBlur = 0;
  }
}

// Function to spawn powerups
function spawnPowerup() {
  if (millis() - lastPowerupTime > powerupInterval) {
    // Randomly select a powerup type
    const powerupTypes = ['rapidFire', 'tripleShot', 'speedBoost', 'shield'];
    const randomType = powerupTypes[Math.floor(random(powerupTypes.length))];
    
    powerups.push(new Powerup(randomType));
    lastPowerupTime = millis();
    
    // Randomize next powerup interval (between 8-15 seconds)
    powerupInterval = random(8000, 15000);
  }
}

// Function to update powerups
function updatePowerups() {
  spawnPowerup();
  
  for (let i = powerups.length - 1; i >= 0; i--) {
    powerups[i].update();
    powerups[i].draw();
    
    // Check for collision with player
    if (collideRectRect(
      powerups[i].x - powerups[i].width/2, powerups[i].y - powerups[i].height/2, 
      powerups[i].width, powerups[i].height,
      player.x, player.y, player.width, player.height
    )) {
      // Activate the powerup
      player.activatePowerup(powerups[i].type);
      
      // Create pickup effect
      createExplosion(
        powerups[i].x,
        powerups[i].y,
        powerups[i].color,
        40
      );
      
      // Remove the powerup
      powerups.splice(i, 1);
      
      // Play pickup sound (if we had sound)
      // playSound('powerup');
      
      continue;
    }
    
    // Remove powerups that go off-screen
    if (powerups[i].y > height + 50) {
      powerups.splice(i, 1);
    }
  }
}

// Check if player has reached the next level
function checkLevelUp() {
  if (enemiesDefeated >= enemiesRequiredForNextLevel) {
    // Level up!
    level++;
    enemiesDefeated = 0;
    
    // Increase difficulty
    enemiesRequiredForNextLevel = Math.floor(enemiesRequiredForNextLevel * 1.5);
    enemyInterval = Math.max(300, enemyInterval * 0.8);
    
    // Start level up animation
    levelUpAnimation.active = true;
    levelUpAnimation.time = millis();
    
    // Give player a shield powerup when leveling up
    player.activatePowerup('shield');
    
    // Create level up visual effect
    for (let i = 0; i < 3; i++) {
      createExplosion(
        random(width * 0.2, width * 0.8),
        random(height * 0.2, height * 0.8),
        [255, 255, 100],
        80
      );
    }
  }
}