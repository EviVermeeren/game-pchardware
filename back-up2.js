let player;
let platforms = [];
let goals = [];
let currentQuestion = null;
let activeGoal = null;
let gameState = "PLAY";
let score = 0;
let levelWidth = 8000; // Iets langer gemaakt voor alle nieuwe vragen
let inputField;
let courseData; //

function preload() {
  courseData = loadJSON("vragen.json");
}

function setup() {
  createCanvas(800, 500);
  player = new Player();

  inputField = createInput("");
  inputField.position(width / 2 - 100, 350);
  inputField.style("font-size", "18px");
  inputField.hide();

  let questions = Object.values(courseData);

  platforms.push(new Platform(0, 470, levelWidth));
  for (let i = 0; i < questions.length; i++) {
    let xPos = 600 + i * 750;
    platforms.push(new Platform(xPos, 350, 200));
    goals.push(new Goal(xPos + 80, 270, questions[i]));
  }
}

function draw() {
  background(15, 15, 30);

  if (gameState === "PLAY") {
    playLoop();
  } else if (gameState === "QUIZ") {
    displayQuiz();
  } else if (gameState === "WIN") {
    displayWin();
  }
}

function playLoop() {
  let targetCamX = -player.x + width / 4;
  let camX = constrain(targetCamX, -levelWidth + width, 0);
  push();
  translate(camX, 0);
  drawGrid();
  for (let p of platforms) p.show();
  for (let g of goals) {
    g.show();
    if (player.hits(g) && !g.completed) {
      startQuiz(g);
    }
  }
  player.update(platforms);
  player.show();
  pop();
  drawUI();

  if (player.x > levelWidth - 100) gameState = "WIN";
}

function startQuiz(goal) {
  currentQuestion = goal.question;
  activeGoal = goal;
  gameState = "QUIZ";
  inputField.value("");

  if (currentQuestion.type === "OPEN" || currentQuestion.type === "MATCH") {
    // Mooi in het midden onder de instructies
    inputField.position(width / 2 - 100, 360);
    inputField.size(200, 30);
    inputField.show();

    setTimeout(() => {
      inputField.elt.focus();
    }, 10);
  }
}

function displayQuiz() {
  background(10, 10, 25);
  fill(0, 255, 255);
  textAlign(CENTER);
  textSize(22);
  text("STOP MOTION CHECK: " + currentQuestion.part, width / 2, 50);

  fill(255);
  textSize(20);
  textLeading(30);
  text(currentQuestion.q, width / 2, 130);

  if (currentQuestion.type === "MC") {
    let yPos = 220;
    for (let key in currentQuestion.options) {
      drawButton(key.toUpperCase(), currentQuestion.options[key], yPos);
      yPos += 70;
    }
  } else {
    // UI voor invulvragen (OPEN en MATCH)
    fill(0, 255, 255);
    textSize(18);
    text("Antwoord:", width / 2, 345);

    // Extra uitleg specifiek voor de verbindvraag
    if (currentQuestion.type === "MATCH") {
      fill(255, 200, 0); // Opvallende kleur voor de tip
      textSize(15);
      text(
        "TIP: Combineer de letters van de juiste antwoorden.",
        width / 2,
        280,
      );
      text("Voorbeeld: als 1=A, 2=B en 3=C, typ dan 'abc'", width / 2, 305);
    }

    fill(150);
    textSize(14);
    text("(Druk op ENTER om te bevestigen)", width / 2, 420);
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

function drawGrid() {
  stroke(30, 30, 60);
  for (let i = 0; i < levelWidth; i += 100) line(i, 0, i, height);
}

function drawUI() {
  fill(0, 255, 255, 150);
  noStroke();
  rect(10, 10, 150, 40, 5);
  fill(0);
  textAlign(LEFT);
  textSize(18);
  text("SCORE: " + score, 25, 37);
}

function displayWin() {
  background(0, 40, 0);
  fill(255);
  textAlign(CENTER);
  textSize(40);
  text("REGISSEUR GESLAAGD!", width / 2, height / 2);
  textSize(20);
  text(
    "Je bent klaar om je stop-motion te uploaden!",
    width / 2,
    height / 2 + 50,
  );
  text("Eindscore: " + score, width / 2, height / 2 + 90);
}

function keyPressed() {
  if (gameState === "QUIZ") {
    if (currentQuestion.type === "MC") {
      let pressedKey = key.toLowerCase();
      if (currentQuestion.options[pressedKey]) {
        checkAnswer(pressedKey);
      }
    } else if (keyCode === ENTER) {
      checkAnswer(inputField.value().toLowerCase().trim());
    }
  }
}

function checkAnswer(guess) {
  // btoa() is een standaard JavaScript functie die tekst omzet naar Base64
  let encodedGuess = btoa(guess);

  if (encodedGuess === currentQuestion.correct) {
    activeGoal.completed = true;
    score += 10;
    gameState = "PLAY";
    inputField.hide();
  } else {
    score = max(0, score - 5);
    player.x -= 400;
    gameState = "PLAY";
    inputField.hide();
  }
}

// --- CLASSES (Hetzelfde als voorheen) ---
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
