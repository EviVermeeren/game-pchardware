let player;
let platforms = [];
let goals = [];
let currentQuestion = null;
let activeGoal = null;
let gameState = "PLAY";
let score = 0;
let levelWidth = 6000; // Iets langer voor de extra vragen
let loadedImage = null;

// De leerstof + Beeldvragen
const courseData = [
  {
    q: "Hardware is...",
    a: "Alles wat je kunt aanraken",
    b: "Software",
    correct: "a",
    part: "Definitie",
  },
  {
    q: "Wat is dit?",
    a: "Moederbord",
    b: "Processor",
    correct: "a",
    part: "Herkenning",
    imgUrl: "images/motherboard.jpg",
  },
  {
    q: "Wat is het brein van de PC?",
    a: "Moederbord",
    b: "Processor (CPU)",
    correct: "b",
    part: "CPU",
  },
  {
    q: "Welk onderdeel zie je hier?",
    a: "GPU (Videokaart)",
    b: "PSU (Voeding)",
    correct: "a",
    part: "Beelden",
    imgUrl: "images/gpu.png",
  },
  {
    q: "Welk geheugen is leeg als de PC uitgaat?",
    a: "SSD",
    b: "RAM",
    correct: "b",
    part: "Geheugen",
  },
  {
    q: "Wat is dit vierkantje?",
    a: "De Processor",
    b: "De Harde schijf",
    correct: "a",
    part: "Hardware",
    imgUrl: "images/processor.jpg",
  },
  {
    q: "Waarvoor staat de afkorting SSD?",
    a: "Solid State Drive",
    b: "Super Speed Disk",
    correct: "a",
    part: "Opslag",
  },
  {
    q: "Wat doet dit apparaat?",
    a: "Stroom leveren",
    b: "Gegevens opslaan",
    correct: "a",
    part: "Energie",
    imgUrl: "images/psu.jpeg",
  },
  {
    q: "Wie maakt de M1 en M2 chips?",
    a: "Intel",
    b: "Apple",
    correct: "b",
    part: "Merken",
  },
  {
    q: "Welk onderdeel zie je hier?",
    a: "Geluidskaart",
    b: "RAM-latje",
    correct: "b",
    part: "Geheugen",
    imgUrl: "images/ram.jpg",
  },
];

function setup() {
  createCanvas(800, 500); // Iets hoger voor de foto's
  player = new Player();
  platforms.push(new Platform(0, 470, levelWidth));

  for (let i = 0; i < courseData.length; i++) {
    let xPos = 400 + i * 550;
    platforms.push(new Platform(xPos, 350 - (i % 2) * 60, 200));
    goals.push(new Goal(xPos + 80, 270 - (i % 2) * 60, courseData[i]));
  }
}

function draw() {
  background(15, 15, 30);

  if (gameState === "PLAY") {
    let targetCamX = -player.x + width / 4;
    let camX = constrain(targetCamX, -levelWidth + width, 0);
    push();
    translate(camX, 0);
    drawGrid();
    for (let p of platforms) p.show();
    for (let g of goals) {
      g.show();
      if (player.hits(g) && !g.completed) {
        currentQuestion = g.question;
        activeGoal = g;
        if (currentQuestion.imgUrl) {
          loadedImage = loadImage(currentQuestion.imgUrl);
        } else {
          loadedImage = null;
        }
        gameState = "QUIZ";
      }
    }
    player.update(platforms);
    player.show();
    pop();
    drawUI();
    if (player.x > levelWidth - 100) gameState = "WIN";
  } else if (gameState === "QUIZ") {
    displayQuiz();
  } else if (gameState === "WIN") {
    displayWin();
  }
}

function drawGrid() {
  stroke(30, 30, 60);
  for (let i = 0; i < levelWidth; i += 100) line(i, 0, i, height);
}

function drawUI() {
  fill(0, 255, 255, 150);
  rect(10, 10, 150, 40, 5);
  fill(0);
  textSize(18);
  text("SCORE: " + score, 65, 35);
}

function displayQuiz() {
  background(10, 10, 25);
  fill(0, 255, 255);
  textAlign(CENTER);
  textSize(24);
  text("SYSTEM CHECK: " + currentQuestion.part, width / 2, 50);

  if (loadedImage) {
    // Toon de foto als centrale vraag
    imageMode(CENTER);
    fill(255);
    rect(width / 2 - 105, 95, 210, 160); // Kader
    image(loadedImage, width / 2, 175, 200, 150);
    fill(255);
    textSize(20);
    text(currentQuestion.q, width / 2, 280);
    drawButton("A", currentQuestion.a, 320);
    drawButton("B", currentQuestion.b, 390);
  } else {
    // Gewone tekstvraag
    fill(255);
    textSize(22);
    text(currentQuestion.q, width / 2, 160);
    drawButton("A", currentQuestion.a, 240);
    drawButton("B", currentQuestion.b, 310);
  }
}

function drawButton(letter, txt, y) {
  fill(30, 30, 60);
  stroke(0, 255, 255);
  rect(width / 2 - 200, y, 400, 50, 10);
  fill(255);
  noStroke();
  textAlign(CENTER);
  text("[" + letter + "] " + txt, width / 2, y + 33);
}

function displayWin() {
  background(0, 40, 0);
  fill(255);
  textAlign(CENTER);
  textSize(40);
  text("SYSTEEM VOLTOOID!", width / 2, height / 2);
  textSize(20);
  text("Eindscore: " + score, width / 2, height / 2 + 50);
}

function keyPressed() {
  if (gameState === "QUIZ") {
    if (key.toLowerCase() === currentQuestion.correct) {
      activeGoal.completed = true;
      score += 10;
      gameState = "PLAY";
    } else if (key.toLowerCase() === "a" || key.toLowerCase() === "b") {
      score = max(0, score - 5);
      player.x -= 300;
      gameState = "PLAY";
    }
  }
}

// Player, Platform en Goal classes blijven hetzelfde als in jouw broncode
class Player {
  constructor() {
    this.x = 100;
    this.y = 100;
    this.vy = 0;
    this.gravity = 0.8;
    this.size = 32;
    this.onGround = false;
  }
  update(platforms) {
    this.vy += this.gravity;
    this.y += this.vy;
    this.onGround = false;
    for (let p of platforms) {
      if (
        this.vy >= 0 &&
        this.x + this.size > p.x &&
        this.x < p.x + p.w &&
        this.y + this.size > p.y &&
        this.y + this.size < p.y + p.h + this.vy
      ) {
        this.y = p.y - this.size;
        this.vy = 0;
        this.onGround = true;
      }
    }
    if (keyIsDown(LEFT_ARROW)) this.x -= 7;
    if (keyIsDown(RIGHT_ARROW)) this.x += 7;
    if (keyIsDown(UP_ARROW) && this.onGround) {
      this.vy = -17;
      this.onGround = false;
    }
    this.x = constrain(this.x, 0, levelWidth);
  }
  show() {
    fill(0, 255, 255);
    stroke(255);
    rect(this.x, this.y, this.size, this.size, 4);
    fill(0);
    rect(this.x + 20, this.y + 8, 6, 6);
  }
  hits(goal) {
    return (
      this.x + this.size > goal.x &&
      this.x < goal.x + goal.w &&
      this.y + this.size > goal.y &&
      this.y < goal.y + goal.h
    );
  }
}

class Platform {
  constructor(x, y, w) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = 25;
  }
  show() {
    fill(40, 40, 80);
    stroke(0, 255, 255);
    rect(this.x, this.y, this.w, this.h, 2);
  }
}

class Goal {
  constructor(x, y, q) {
    this.x = x;
    this.y = y;
    this.w = 50;
    this.h = 50;
    this.question = q;
    this.completed = false;
  }
  show() {
    if (!this.completed) {
      fill(255, 0, 255, 150);
      stroke(255);
      rect(this.x, this.y, this.w, this.h, 8);
      fill(255);
      textAlign(CENTER);
      textSize(24);
      text("?", this.x + 25, this.y + 35);
    }
  }
}
