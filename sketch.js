// --- GLOBALE VARIABELEN ---
let platformImg, goalImg, questionsData;
let idleImg, runImg, jumpImg; // Nieuwe variabelen voor de 3 standen
let player,
  platforms = [],
  goals = [],
  inputField;
let currentQuestion = null,
  activeGoal = null,
  gameState = "LOADING",
  score = 0;
let levelWidth = 8000,
  camX = 0;
let nameInput;
let playerName = "";
let scoreSaved = false;
let canvas;

// -----------------------------------------------------------------
// PRELOAD: Laad alle assets in
// -----------------------------------------------------------------
function preload() {
  questionsData = loadJSON("vragen.json");
  platformImg = loadImage("platform.png");
  goalImg = loadImage("goal.png");

  // Laad de drie aparte afbeeldingen
  idleImg = loadImage("idle.png");
  runImg = loadImage("run.png");
  jumpImg = loadImage("jump.png");
}

// -----------------------------------------------------------------
// SETUP: Initialiseer de game
// -----------------------------------------------------------------
function setup() {
  canvas = createCanvas(800, 500);
  canvas.parent("game-wrapper");

  nameInput = createInput("");
  nameInput.parent("game-wrapper");
  nameInput.position(width / 2 - 100, height / 2 + 20);
  nameInput.size(200, 30);
  nameInput.attribute("placeholder", "Typ je naam");
  nameInput.hide();

  nameInput.style("font-size", "18px");
  // We geven de player een object mee met de drie geladen afbeeldingen
  player = new Player({
    idle: idleImg,
    run: runImg,
    jump: jumpImg,
  });

  inputField = createInput("");
  inputField.position(width / 2 + 75, 380);
  inputField.size(200, 30);
  inputField.style("font-size", "18px");
  inputField.style("font-family", "monospace");
  inputField.hide();

  let questions = Object.values(questionsData);
  platforms.push(new Platform(0, 470, levelWidth, platformImg));

  for (let i = 0; i < questions.length; i++) {
    let xPos = 800 + i * 850;
    platforms.push(new Platform(xPos, 350, 200, platformImg));
    goals.push(new Goal(xPos + 80, 270, questions[i], goalImg));
  }

  setTimeout(() => {
    gameState = "START";
    nameInput.show();
    nameInput.elt.focus();
  }, 3000);
}

function draw() {
  background(0);

  // Check of alles geladen is (inclusief de 3 nieuwe imgs)
  if (
    !questionsData ||
    !platformImg ||
    !idleImg ||
    !runImg ||
    !jumpImg ||
    !goalImg
  ) {
    background(0);
    fill(255);
    textAlign(CENTER);
    text("SYSTEEM LADEN...", width / 2, height / 2);
    return;
  }

  if (gameState === "LOADING") {
    displayLoadingScreen();
  } else if (gameState === "START") {
    displayStartScreen();
  } else if (gameState === "PLAY") {
    playLoop();
  } else if (gameState === "QUIZ") {
    displayQuiz();
  } else if (gameState === "WIN") {
    displayWin();
  }
}

function displayStartScreen() {
  background(0);

  fill(0, 255, 255);
  textAlign(CENTER);
  textSize(32);
  text("STOP MOTION GAME", width / 2, height / 2 - 60);

  fill(255);
  textSize(18);
  text(
    "Typ je naam en druk op ENTER om te starten.",
    width / 2,
    height / 2 - 20,
  );
}

function playLoop() {
  let targetCamX = -player.x + width / 4;
  camX = constrain(targetCamX, -levelWidth + width, 0);

  push();
  translate(camX, 0);
  for (let p of platforms) p.show();
  for (let g of goals) {
    g.show();
    if (player.hits(g) && !g.completed) startQuiz(g);
  }
  player.update(platforms);
  player.show();
  pop();
  drawUI();
  if (player.x > levelWidth - 100) gameState = "WIN";
}

// --- PLAYER KLASSE (MET WISSELENDE AFBEELDINGEN) ---
class Player {
  constructor(imgs) {
    this.x = 100;
    this.y = 100;
    this.vy = 0;
    this.gravity = 0.8;
    this.size = 100;
    this.onGround = false;
    this.imgs = imgs; // Object met idle, run, jump
    this.direction = 1;
    this.isMoving = false;
  }

  update(platforms) {
    this.vy += this.gravity;
    this.y += this.vy;
    this.onGround = false;
    this.isMoving = false;

    for (let p of platforms) {
      if (
        this.vy >= 0 &&
        this.x + this.size * 0.7 > p.x &&
        this.x + this.size * 0.3 < p.x + p.w &&
        this.y + this.size > p.y &&
        this.y + this.size < p.y + p.h + this.vy
      ) {
        this.y = p.y - this.size;
        this.vy = 0;
        this.onGround = true;
      }
    }

    if (keyIsDown(LEFT_ARROW)) {
      this.x -= 7;
      this.direction = -1;
      this.isMoving = true;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.x += 7;
      this.direction = 1;
      this.isMoving = true;
    }
    if (keyIsDown(UP_ARROW) && this.onGround) {
      this.vy = -18;
      this.onGround = false;
    }
    this.x = constrain(this.x, 0, levelWidth);
  }

  show() {
    let currentImg;

    // Logica voor het kiezen van de juiste afbeelding
    if (!this.onGround) {
      currentImg = this.imgs.jump;
    } else if (this.isMoving) {
      currentImg = this.imgs.run;
    } else {
      currentImg = this.imgs.idle;
    }

    push();
    translate(this.x + this.size / 2, this.y + this.size / 2);
    scale(this.direction, 1);
    imageMode(CENTER);
    if (currentImg) image(currentImg, 0, 0, this.size, this.size);
    pop();
  }

  hits(goal) {
    return (
      this.x + this.size * 0.8 > goal.x &&
      this.x + this.size * 0.2 < goal.x + goal.w &&
      this.y + this.size > goal.y &&
      this.y < goal.y + goal.h
    );
  }
}

// --- OVERIGE FUNCTIES (QUIZ, UI, ETC. BLIJVEN HETZELFDE) ---
function startQuiz(goal) {
  currentQuestion = goal.question;
  activeGoal = goal;
  gameState = "QUIZ";
  inputField.value("");
  if (currentQuestion.type === "OPEN" || currentQuestion.type === "MATCH") {
    inputField.show();
    setTimeout(() => inputField.elt.focus(), 10);
  } else {
    inputField.hide();
  }
}

function checkAnswer(guess) {
  if (btoa(guess) === currentQuestion.correct) {
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

function displayQuiz() {
  background(10, 10, 25, 230);
  fill(0, 255, 255);
  textAlign(CENTER);
  textSize(22);
  text("STOP MOTION CHECK: " + currentQuestion.part, width / 2, 50);
  fill(255);
  textSize(20);
  textLeading(30);
  text(currentQuestion.q, width / 2, 130);
  if (currentQuestion.type === "MC") {
    let y = 220;
    for (let k in currentQuestion.options) {
      drawButton(k.toUpperCase(), currentQuestion.options[k], y);
      y += 70;
    }
  } else {
    fill(0, 255, 255);
    text("Antwoord:", width / 2, height / 2 + 50);
    if (currentQuestion.type === "MATCH") {
      fill(255, 200, 0);
      textSize(15);
      text(
        "Combineer de letters. Als 1 bij antwoord a hoort, 2 bij b hoort, en 3 bij c hoort, dan typ je abc.",
        width / 2,
        280,
      );
    }
    fill(150);
    textSize(14);
    text("(Druk op ENTER)", width / 2, height / 2 + 100);
  }
}

function drawButton(l, t, y) {
  fill(30, 30, 60, 200);
  stroke(0, 255, 255);
  rect(width / 2 - 200, y, 400, 50, 10);
  fill(255);
  noStroke();
  text("[" + l + "] " + t, width / 2, y + 33);
}

function drawUI() {
  fill(0, 255, 255, 150);
  rect(10, 10, 150, 40, 5);
  fill(0);
  textSize(18);
  text("SCORE: " + score, 70, 37);
}

function displayWin() {
  background(0, 40, 0);

  fill(255);
  textAlign(CENTER);
  textSize(40);
  text("REGISSEUR GESLAAGD!", width / 2, height / 2 - 40);

  textSize(22);
  text("Score: " + score, width / 2, height / 2 + 10);

  saveScore();
}

function keyPressed() {
  if (gameState === "START" && keyCode === ENTER) {
    playerName = nameInput.value().trim();

    if (playerName !== "") {
      nameInput.hide();
      gameState = "PLAY";
    }
  }

  if (gameState === "QUIZ") {
    if (currentQuestion.type === "MC") {
      let pk = key.toLowerCase();
      if (currentQuestion.options[pk]) checkAnswer(pk);
    } else if (keyCode === ENTER) {
      checkAnswer(inputField.value().toLowerCase().trim());
    }
  }
}

class Platform {
  constructor(x, y, w, img) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = 32;
    this.img = img;
  }
  show() {
    if (this.img) {
      for (let i = 0; i < this.w; i += this.h)
        image(this.img, this.x + i, this.y, this.h, this.h);
    }
  }
}

class Goal {
  constructor(x, y, q, img) {
    this.x = x;
    this.y = y;
    this.w = 64;
    this.h = 64;
    this.question = q;
    this.completed = false;
    this.img = img;
  }
  show() {
    if (!this.completed && this.img)
      image(this.img, this.x, this.y, this.w, this.h);
  }
}

function saveScore() {
  if (scoreSaved) return;

  scoreSaved = true;

  fetch("https://phishingapi-pmhh.onrender.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: playerName,
      score: score,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Score opgeslagen:", data);
    })
    .catch((error) => {
      console.error("Fout bij opslaan score:", error);
    });
}

function displayLoadingScreen() {
  background(0);

  fill(0, 255, 255);
  textAlign(CENTER);
  textSize(30);

  text("GAME WORDT GELADEN...", width / 2, height / 2);
}
