const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const imgNave = new Image();
imgNave.src = "images.jpeg";

const imgFundo = new Image();
imgFundo.src = "photo.jpeg";

const imgCoracao = new Image();
imgCoracao.src = "t.png";

const inimigoImgs = [
  "jp.jpeg", "qe.jpeg", "ai.png", "qr.jpeg", "qo.jpeg"
].map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

let player = { x: 180, y: 500, width: 40, height: 40, invencivel: 0 };
let bullets = [], enemies = [], keys = {};
let vidas = 3, pontos = 0, combo = 0, tempoSobrevivido = 0;
let gameOver = false, pause = false;

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " ") bullets.push({ x: player.x + 18, y: player.y });
  if (e.key.toLowerCase() === "p") pause = !pause;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

document.getElementById("resetButton").addEventListener("click", resetGame);

function resetGame() {
  player = { x: 180, y: 500, width: 40, height: 40, invencivel: 0 };
  bullets = [];
  enemies = [];
  keys = {};
  vidas = 3;
  pontos = 0;
  combo = 0;
  tempoSobrevivido = 0;
  gameOver = false;
  pause = false;
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

function update() {
  if (gameOver || pause) return;

  if (player.invencivel > 0) player.invencivel--;

  if (keys["ArrowLeft"] && player.x > 0) player.x -= 5;
  if (keys["ArrowRight"] && player.x < canvas.width - player.width) player.x += 5;

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

    // Colisão com o jogador
    if (
      player.invencivel === 0 &&
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      vidas--;
      player.invencivel = 60; // 1 segundo de invencibilidade
      if (vidas <= 0) gameOver = true;
      return false;
    }

    // Colisão com bala
    bullets.forEach((b, bi) => {
      if (
        b.x < enemy.x + enemy.width &&
        b.x + 4 > enemy.x &&
        b.y < enemy.y + enemy.height &&
        b.y + 10 > enemy.y
      ) {
        bullets.splice(bi, 1);
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
      }
    });

    if (enemy.y > canvas.height) {
      vidas--;
      if (vidas <= 0) gameOver = true;
      return false;
    }

    return true;
  });

  if (enemies.length < 5 && Math.random() < 0.03) spawnEnemy();

  tempoSobrevivido++;
  if (tempoSobrevivido % 60 === 0) pontos += 10;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgFundo, 0, 0, canvas.width, canvas.height);

  // Piscar se estiver invencível
  if (player.invencivel === 0 || player.invencivel % 10 < 5) {
    ctx.drawImage(imgNave, player.x, player.y, player.width, player.height);
  }

  bullets.forEach(b => {
    ctx.fillStyle = "blue";
    ctx.fillRect(b.x, b.y, 4, 10);
  });

  enemies.forEach(e => {
    ctx.drawImage(e.imagem, e.x, e.y, e.width, e.height);
  });

  // Pontos e Combo
  ctx.fillStyle = "red";
  ctx.font = "16px Arial";
  ctx.fillText("Pontos: " + pontos, 10, 30);

  if (combo > 0) {
    ctx.fillStyle = "yellow";
    ctx.fillText("Combo: " + combo, 10, 50);
  }

  // Vidas (com corações)
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
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

const imagens = [imgNave, imgFundo, imgCoracao, ...inimigoImgs];
let carregadas = 0;
imagens.forEach(img => {
  img.onload = () => {
    carregadas++;
    if (carregadas === imagens.length) loop();
  };
});
