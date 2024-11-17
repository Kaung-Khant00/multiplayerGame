const canvas = document.querySelector("canvas");
const scoreBoard = document.querySelector(".scoreBoard");
const startButton = document.querySelector(".start_button");
const startInput = document.querySelector(".login_input")
const login = document.querySelector(".login")
const c = canvas.getContext("2d");
const devicePixelRatio = document.devicePixelRatio || 1;
canvas.width = innerWidth * devicePixelRatio;
canvas.height = innerHeight * devicePixelRatio;
const socket = io();
//Player runner
class Player {
  constructor({ x, y, radius, color , score , canvas,name ,playerId}) {
    this.x = x;
    this.y = y;
    this.radius = radius * devicePixelRatio;
    this.color = color;
    this.score=score
    this.canvas=canvas
    this.name=name
    this.playerId=playerId
  }
  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }
}
const PLAYER_RADIUS = 10;
const frontendPlayer = {};
const frontendProjectiles = {};
startButton.addEventListener("click",() => {
  const newFrontPlayer =new Player ({
    x: (canvas.width + 10) * Math.random() - 10,
    y: (canvas.height + 10) * Math.random() - 10,
    radius: PLAYER_RADIUS,
    color: `hsl(${360 * Math.random()},100%,50%)`,
    score: 0,
    canvas: { width: canvas.width, height: canvas.height },
    name:startInput.value,
    playerId:socket.id
  });
  frontendPlayer[socket.id] = newFrontPlayer;
  login.style.display="none"
  socket.emit("initGame", newFrontPlayer);
  addEventListener("keydown", ({ code }) => {
    switch (code) {
      case "KeyW":
        keys.w.pressed = true;
        break;
      case "KeyA":
        keys.a.pressed = true;
        break;
      case "KeyS":
        keys.s.pressed = true;
        break;
      case "KeyD":
        keys.d.pressed = true;
        break;
    }
  });
  addEventListener("keyup", ({ code }) => {
    switch (code) {
      case "KeyW":
        keys.w.pressed = false;
        break;
      case "KeyA":
        keys.a.pressed = false;
        break;
      case "KeyS":
        keys.s.pressed = false;
        break;
      case "KeyD":
        keys.d.pressed = false;
        break;
    }
  });
});
socket.on("gameOver",(gameOverId)=>{
  if(socket.id==gameOverId){
    login.style.display="flex"
  }
})
/*  socket.io client side (emit , on) */
socket.on("updateplayer", (backendPlayer) => {
  scoreBoard.innerHTML = "";
  for (const id in frontendPlayer) {
    if (!backendPlayer[id]) {
      delete frontendPlayer[id];
    }
  }
  for (const id in backendPlayer) {
    if (!frontendPlayer[id]) {
      frontendPlayer[id]=new Player(backendPlayer[id]);
    }
  }
  for (const id in backendPlayer) {
    scoreBoard.innerHTML += `<div data-id="${id}">${backendPlayer[id].name}:<span>${backendPlayer[id].score}</span></div>`;
  }
});
socket.on("updateplayerMovement", (backendPlayer, backendProjectiles) => {
  for (const id in backendPlayer) {
    gsap.to(frontendPlayer[id], {
      x: backendPlayer[id].x,
      y: backendPlayer[id].y,
      duration: 0.015,
      ease: "linear",
    });
  }

  for (const projectileId in backendProjectiles) {
    if (!frontendProjectiles[projectileId]) {
      frontendProjectiles[projectileId] = new Projectile(
        backendProjectiles[projectileId]
      );
    } else {
      frontendProjectiles[projectileId].x +=
        frontendProjectiles[projectileId].velocity.x;
      frontendProjectiles[projectileId].y +=
        frontendProjectiles[projectileId].velocity.y;
    }
  }
  /*   for (const id in frontendProjectiles) {
    if (!backendProjectiles[id]) {
      delete frontendProjectiles[id];
    }
  } */
});
socket.on("updateprojectile", (projectileId) => {
  delete frontendProjectiles[projectileId];
});
/*  key functios  */
const keys = {
  w: { pressed: false },
  a: { pressed: false },
  s: { pressed: false },
  d: { pressed: false },
};
const SPEED = 4;
setInterval(() => {
  if (keys.w.pressed) {
    frontendPlayer[socket.id].y -= SPEED;
  }
  if (keys.a.pressed) {
    frontendPlayer[socket.id].x -= SPEED;
  }
  if (keys.s.pressed) {
    frontendPlayer[socket.id].y += SPEED;
  }
  if (keys.d.pressed) {
    frontendPlayer[socket.id].x += SPEED;
  }
  socket.emit("updatekey", keys);
}, 20);
function animation() {
  keyForCancel = requestAnimationFrame(animation);
  c.fillStyle = "rgba(0,0,0,0.1)";
  c.fillRect(0, 0, innerWidth, innerHeight);
  for (const id in frontendPlayer) {
    frontendPlayer[id].draw();
  }
  for (const id in frontendProjectiles) {
    frontendProjectiles[id].draw();
  }
}
animation();

//mouse event
let mouse = {
  x: innerWidth / 2,
  y: innerHeight / 2,
};
addEventListener("mousemove", (event) => {
  mouse.x = event.x;
  mouse.y = event.y;
});
addEventListener("mousedown", () => {
  socket.emit("fireProjectile", { mouse, playerId: socket.id });
});
