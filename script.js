const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const imgNave = carregarImagem("drone de guerra.png");
const imgFundo = carregarImagem("arte.png");
const imgCoracao = carregarImagem("variante.png");

const inimigoImgs = [
  "feijão.png", "parece uma alien.png", "Pratylenchus.png", "Rodopholus.png", "Rotylenchulus.png"
].map(carregarImagem);

const powerupImgs = {
  doubleShot: carregarImagem("power.png")
};

let player, bullets, enemies, keys, powerUps;
let vidas, pontos, combo, tempoSobrevivido;
let gameOver, pause, powerUpAtivo, powerUpTimer, flashScreen, tiroCor;
let comboTimer = 0;

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " ") atirar();
  if (e.key.toLowerCase() === "p") pause = !pause;
});

document.addEventListener("keyup", (e) => keys[e.key] = false);

document.getElementById("resetButton").addEventListener("click", () => {
  flashScreen = 10;
  resetGame();
});

function carregarImagem(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function resetGame() {
  player = { x: 180, y: 500, width: 50, height: 50, velocidade: 5 };
  bullets = [];
  enemies = [];
  powerUps = [];
  keys = {};
  vidas = 3;
  pontos = 0;
  combo = 0;
  tempoSobrevivido = 0;
  gameOver = false;
  pause = false;
  powerUpAtivo = null;
  powerUpTimer = 0;
  tiroCor = "blue";
  comboTimer = 0;
}

function atirar() {
  bullets.push({ x: player.x + player.width / 2 - 2, y: player.y });
  if (powerUpAtivo === "doubleShot") {
    bullets.push({ x: player.x + 5, y: player.y });
    bullets.push({ x: player.x + player.width - 9, y: player.y });
  }
}

function spawnEnemy() {
  const tipo = Math.floor(Math.random() * inimigoImgs.length);
  const vidaInicial = tipo === 3 ? 2 : tipo === 2 ? 3 : 1;

  enemies.push({
    tipo,
    x: Math.random() * (canvas.width - 40),
    y: 0,
    width: 40,
    height: 40,
    imagem: inimigoImgs[tipo],
    habilidade: ["lento", "zigzag", "divide", "rapido", "zigzag"][tipo],
    hp: vidaInicial
  });
}

function spawnPowerUp() {
  powerUps.push({
    tipo: "doubleShot",
    x: Math.random() * (canvas.width - 30),
    y: 0,
    width: 30,
    height: 30,
    imagem: powerupImgs.doubleShot
  });
}

function ativarPowerUp(tipo) {
  powerUpAtivo = tipo;
  powerUpTimer = 600;
  tiroCor = tipo === "doubleShot" ? "red" : "blue";
}

function update() {
  if (gameOver || pause) return;

  if (powerUpTimer > 0) {
    powerUpTimer--;
    if (powerUpTimer === 0) {
      powerUpAtivo = null;
      tiroCor = "blue";
    }
  }

  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.velocidade;
  if (keys["ArrowRight"] && player.x < canvas.width - player.width) player.x += player.velocidade;
  bullets = bullets.filter(b => (b.y -= 7) >= 0);

  if (combo > 0) {
    comboTimer++;
    if (comboTimer > 180) {
      combo = 0;
      comboTimer = 0;
    }
  }
  const novosInimigos = [];
  enemies = enemies.filter((enemy, ei) => {

    if (enemy.habilidade === "rapido") enemy.y += 4;
    else if (enemy.habilidade === "zigzag") {
      enemy.y += 2;
      enemy.x += Math.sin(enemy.y / 20) * 2;
    } else enemy.y += 2;

    if (colide(player, enemy)) {
      vidas--;
      if (vidas <= 0) gameOver = true;
      return false;
    }

    bullets = bullets.filter(b => {
      if (colide(b, enemy, 4, 10)) {
        enemy.hp--;
        pontos += 100;
        combo++;
        comboTimer = 0;

        if (enemy.hp <= 0) {
          if (enemy.habilidade === "divide") {
            novosInimigos.push(
              criarMiniInimigo(enemy.x - 10, enemy.y, 0),
              criarMiniInimigo(enemy.x + 10, enemy.y, 1)
            );
          }
          return false; 
        }
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

  enemies.push(...novosInimigos);

  powerUps = powerUps.filter((p, i) => {
    p.y += 2;

    if (colide(player, p)) {
      ativarPowerUp(p.tipo);
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

function criarMiniInimigo(x, y, tipo) {
  return {
    tipo,
    x,
    y,
    width: 20,
    height: 20,
    imagem: inimigoImgs[tipo],
    habilidade: "lento",
    hp: 1
  };
}

function colide(a, b, aw = a.width, ah = a.height) {
  return (
    a.x < b.x + b.width &&
    a.x + aw > b.x &&
    a.y < b.y + b.height &&
    a.y + ah > b.y
  );
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgFundo, 0, 0, canvas.width, canvas.height);

  ctx.drawImage(imgNave, player.x, player.y, player.width, player.height);

  bullets.forEach(b => {
    ctx.fillStyle = tiroCor;
    ctx.fillRect(b.x, b.y, 4, 10);
  });

  enemies.forEach(e => ctx.drawImage(e.imagem, e.x, e.y, e.width, e.height));
  powerUps.forEach(p => ctx.drawImage(p.imagem, p.x, p.y, p.width, p.height));

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
    ctx.fillText("Chora menos", 80, canvas.height / 2);
  }

  if (pause) {
    ctx.fillStyle = "yellow";
    ctx.font = "30px Arial";
    ctx.fillText("pq ta pensando", 130, canvas.height / 2);
  }

  if (powerUpAtivo) {
    ctx.fillStyle = "cyan";
    ctx.fillText("hora da show: " + powerUpAtivo, 10, 90);

    const segundosRestantes = Math.ceil(powerUpTimer / 60);
    ctx.fillStyle = "white";
    ctx.fillText("Tempo: " + segundosRestantes + "s", 10, 110);
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
    if (carregadas === imagens.length) {
      resetGame();
      loop();
    }
  };
});
