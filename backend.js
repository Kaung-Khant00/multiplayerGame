const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { pingInterval: 2000, pingTimeout: 6000 });

const port = process.env.PORT||3000;
const backendPlayers = {};
const backendProjectiles = {};
let projectileId = 0;
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

/*  socket part   */
let init=true
const SPEED = 4;
const PLAYER_RADIUS = 10;
const PROJECTILE_RADIUS = 4;
io.on("connection", (socket) => {
  socket.on("initGame", (newPlayer) => {
    backendPlayers[socket.id] = newPlayer;
    io.emit("updateplayer",backendPlayers)
    console.log(newPlayer.playerId==socket.id,newPlayer.playerId,socket.id)
    if(init&&newPlayer.playerId===socket.id){
      setInterval(() => {
        io.emit("updateplayerMovement", backendPlayers, backendProjectiles);
        for (const id in backendProjectiles) {
          backendProjectiles[id].x += backendProjectiles[id].velocity.x;
          backendProjectiles[id].y += backendProjectiles[id].velocity.y;
          if (
            backendProjectiles[id].x <= 0 ||
            backendProjectiles[id].x >=
              backendPlayers[backendProjectiles[id].playerId]?.canvas?.width ||
            backendProjectiles[id].y <= 0 ||
            backendProjectiles[id].y >=
              backendPlayers[backendProjectiles[id].playerId]?.canvas?.height
          ) {
            delete backendProjectiles[id];
            io.emit("updateprojectile", id);
          }
          for (const BplayerId in backendPlayers) {
            const distance = Math.hypot(
              backendPlayers[BplayerId].x - backendProjectiles[id]?.x,
              backendPlayers[BplayerId].y - backendProjectiles[id]?.y
            );
            if (
              PLAYER_RADIUS + PROJECTILE_RADIUS >= distance &&
              backendPlayers[BplayerId] !=
                backendPlayers[backendProjectiles[id].playerId]
            ) {
              backendPlayers[backendProjectiles[id].playerId].score++;
              delete backendProjectiles[id];
              delete backendPlayers[BplayerId];
              io.emit("updateplayer", backendPlayers);
              io.emit("updateprojectile", id);
              io.emit("gameOver",BplayerId)
            }
          }
        }
      }, 15);
      init=false
    }
  });
  console.log(`a user connected with id ${socket.id}`);
  socket.on("updatekey", (key) => {
    if (key.w.pressed) {
      backendPlayers[socket.id].y -= SPEED;
    }
    if (key.a.pressed) {
      backendPlayers[socket.id].x -= SPEED;
    }
    if (key.s.pressed) {
      backendPlayers[socket.id].y += SPEED;
    }
    if (key.d.pressed) {
      backendPlayers[socket.id].x += SPEED;
    }
  });
  socket.on("fireProjectile", ({ mouse, playerId }) => {
    projectileId++;
    let angle =
      Math.atan2(
        mouse.x - backendPlayers[playerId]?.x,
        mouse.y - backendPlayers[playerId]?.y
      ) -
      Math.PI / 2;
    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(-angle) * 5,
    };
    backendProjectiles[projectileId] = {
      x: backendPlayers[playerId]?.x,
      y: backendPlayers[playerId]?.y,
      radius: PROJECTILE_RADIUS,
      color: backendPlayers[playerId]?.color,
      velocity,
      playerId,
    };
  });
  /*   user disconnect  */
  socket.on("disconnect", () => {
    delete backendPlayers[socket.id];
    io.emit("updateplayer", backendPlayers);
  });
});
server.listen(PORT, () => {
  console.log(`server is running on port ${port}!`);
});
