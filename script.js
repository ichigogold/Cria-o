const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const imgNave = new Image();
imgNave.src = "drone de guerra.png";

const imgFundo = new Image();
imgFundo.src = "arte.png";

const imgCoracao = new Image();
imgCoracao.src = "variante.png";

const inimigoImgs = [
  "feijão.png", "parece uma alien.png", "Pratylenchus.png", "Rodopholus.png", "Rotylenchulus.png"
].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

const powerupImgs = {
  shield: new Image(),
  doubleShot: new Image()
};
powerupImgs.shield.src = "escudo.png";
powerupImgs.doubleShot.src = "power.png";

let player = { x: 180, y: 500, width: 50, height: 50, invencivel: 0, velocidade: 5 };
let bullets = [], enemies = [], keys = [], powerUps = [];
let vidas = 3, pontos = 0, combo = 0, tempoSobrevivido = 0;
let gameOver = false, pause = false;
let powerUpAtivo = null, powerUpTimer = 0;
let flashScreen = 0;
let tiroCor = "blue";

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " ") atirar();
  if (e.key.toLowerCase() === "p") pause = !pause;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

document.getElementById("resetButton").addEventListener("click", () => {
  flashScreen = 10;
  resetGame();
});

function atirar() {
  bullets.push({ x: player.x + player.width / 2 - 2, y: player.y });

  if (powerUpAtivo === "doubleShot") {
    bullets.push({ x: player.x + 5, y: player.y });
    bullets.push({ x: player.x + player.width - 9, y: player.y });
  }
}

function resetGame() {
  player = { x: 180, y: 500, width: 50, height: 50, invencivel: 0, velocidade: 5 };
  bullets = [];
  enemies = [];
  powerUps = [];
  keys = [];
  vidas = 3;
  pontos = 0;
  combo = 0;
  tempoSobrevivido = 0;
  gameOver = false;
  pause = false;
  powerUpAtivo = null;
  powerUpTimer = 0;
  tiroCor = "blue";
}

function spawnEnemy() {
  const tipo = Math.floor(Math.random() * 5);
  enemies.push({
    tipo,
    x: Math.random() * (canvas.width - 40),
    y: 0,
    width: 40,
    height: 40,
    imagem: inimigoImgs[tipo],
    habilidade: ["lento", "zigzag", "divide", "rapido", "zigzag"][tipo]
  });
}

function spawnPowerUp() {
  const tipos = ["shield", "doubleShot"];
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];
  powerUps.push({
    tipo,
    x: Math.random() * (canvas.width - 30),
    y: 0,
    width: 30,
    height: 30,
    imagem: powerupImgs[tipo]
  });
}

function ativarPowerUp(tipo) {
  powerUpAtivo = tipo;
  powerUpTimer = 600; 

  if (tipo === "shield") {
    player.invencivel = powerUpTimer;
  }

  if (tipo === "doubleShot") {
    tiroCor = "cyan";
  }
}

function update() {
  if (gameOver || pause) return;

  if (player.invencivel > 0) player.invencivel--;

  if (powerUpTimer > 0) {
    powerUpTimer--;
    if (powerUpTimer === 0) {
      powerUpAtivo = null;
      tiroCor = "blue";
    }
  }

  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.velocidade;
  if (keys["ArrowRight"] && player.x < canvas.width - player.width) player.x += player.velocidade;

  bullets = bullets.filter(b => {
    b.y -= 7;
    return b.y >= 0;
  });

  enemies = enemies.filter((enemy, ei) => {
    
    if (enemy.habilidade === "rapido") enemy.y += 4;
    else if (enemy.habilidade === "zigzag") {
      enemy.y += 2;
      enemy.x += Math.sin(enemy.y / 20) * 2;
    } else enemy.y += 2;
    if (
      player.invencivel === 0 &&
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      vidas--;
      player.invencivel = 60;
      if (vidas <= 0) gameOver = true;
      return false;
    }

    bullets = bullets.filter(b => {
      if (
        b.x < enemy.x + enemy.width &&
        b.x + 4 > enemy.x &&
        b.y < enemy.y + enemy.height &&
        b.y + 10 > enemy.y
      ) {
        pontos += 100;
        combo++;

        if (enemy.habilidade === "divide") {
          enemies.push(
            {
              tipo: 0, x: enemy.x - 10, y: enemy.y,
              width: 20, height: 20,
              imagem: inimigoImgs[0], habilidade: "lento"
            },
            {
              tipo: 1, x: enemy.x + 10, y: enemy.y,
              width: 20, height: 20,
              imagem: inimigoImgs[1], habilidade: "lento"
            }
          );
        }

        enemies.splice(ei, 1);
        return false;
      }
      return true;
    });
    if (enemy.y > canvas.height) {
      vidas--;
      if (vidas <= 0) gameOver = true;
      return false;
    }

    return true;
  });

  powerUps = powerUps.filter((p, i) => {
    p.y += 2;

    if (
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y < p.y + p.height &&
      player.y + player.height > p.y
    ) {
      ativarPowerUp(p.tipo);
      powerUps.splice(i, 1);
      return false;
    }

    return p.y < canvas.height;
  });

  if (enemies.length < 5 && Math.random() < 0.03) spawnEnemy();

  if (Math.random() < 0.005) spawnPowerUp();

  tempoSobrevivido++;
  if (tempoSobrevivido % 60 === 0) pontos += 10;

  if (pontos % 500 === 0 && pontos > 0) player.velocidade += 0.1;

  if (flashScreen > 0) flashScreen--;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgFundo, 0, 0, canvas.width, canvas.height);

  if (player.invencivel === 0 || player.invencivel % 10 < 5) {
    ctx.drawImage(imgNave, player.x, player.y, player.width, player.height);
  }

  bullets.forEach(b => {
    ctx.fillStyle = tiroCor;
    ctx.fillRect(b.x, b.y, 4, 10);
  });

  enemies.forEach(e => {
    ctx.drawImage(e.imagem, e.x, e.y, e.width, e.height);
  });

  powerUps.forEach(p => {
    ctx.drawImage(p.imagem, p.x, p.y, p.width, p.height);
  });

  ctx.fillStyle = "red";
  ctx.font = "16px Arial";
  ctx.fillText("Pontos: " + pontos, 10, 30);

  if (combo > 0) {
    ctx.fillStyle = "yellow";
    ctx.fillText("Combo: " + combo, 10, 50);
  }

  for (let i = 0; i < vidas; i++) {
    ctx.drawImage(imgCoracao, 10 + i * 28, 60, 24, 24);
  }

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.fillText("FIM DE JOGO", 80, canvas.height / 2);
  }

  if (pause) {
    ctx.fillStyle = "yellow";
    ctx.font = "30px Arial";
    ctx.fillText("PAUSADO", 130, canvas.height / 2);
  }

  if (powerUpAtivo) {
    ctx.fillStyle = "cyan";
    ctx.fillText("PowerUp: " + powerUpAtivo, 10, 90);
  }
  if (flashScreen > 0) {
    ctx.fillStyle = "white";
    ctx.globalAlpha = flashScreen / 10;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

const imagens = [imgNave, imgFundo, imgCoracao, ...inimigoImgs, ...Object.values(powerupImgs)];
let carregadas = 0;
imagens.forEach(img => {
  img.onload = () => {
    carregadas++;
    if (carregadas === imagens.length) loop();
  };
});
