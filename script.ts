const GAME_WIDTH = 1200;
const GAME_HEIGHT = 800;

const CLOCK_SPEED = 1000 / 60; // 60 fps
const GRAVITY_SPEED = 0.5;

// start character in middle of canvas
let x = GAME_WIDTH / 2;
let y = GAME_HEIGHT / 2;

const CHAR_WIDTH = 50;
const CHAR_HEIGHT = 50;

let xv = 0;
let yv = 0;

let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
};

const obstacles: Obstacle[] = [];

let canvas: HTMLCanvasElement;

const clearCanvas = () => {
  const ctx = canvas.getContext("2d");
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
};

const drawCanvas = () => {
  clearCanvas();

  // color the background white
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawObstacle(GAME_WIDTH / 2, GAME_HEIGHT - 100, 100, 100);
  drawObstacle(GAME_WIDTH / 2 + 400, GAME_HEIGHT - 300, 100, 100);
  drawObstacle(GAME_WIDTH / 2 - 200, GAME_HEIGHT - 500, 100, 100);
  drawObstacle(GAME_WIDTH / 2 + 300, GAME_HEIGHT - 500, 100, 100);
  drawObstacle(GAME_WIDTH / 2 - 200, GAME_HEIGHT - 400, 500, 10);
  drawObstacle(GAME_WIDTH / 2 - 400, GAME_HEIGHT - 500, 10, 500);

  drawCharacter(x, y);
}

/** Size the canvas */
const sizeCanvas = () => {
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
};

/** Draw the character at the specified coordinates */
const drawCharacter = (x: number, y: number) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = 'red';
  ctx.fillRect(x, y, CHAR_WIDTH, CHAR_HEIGHT);
};

// type CollisionResult = [number | null, number | null];
interface CollisionResult {
  collisionX: number | null;
  collisionY: number | null;
}

const drawObstacle = (x: number, y: number, width: number = 50, height: number = 100) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = 'black';
  ctx.fillRect(x, y, width, height);

  obstacles.push({ x, y, width, height });
};

/** Check for other objects in canvas and return either a tuple containing the coordinates of the collision if there is one, or null otherwise */
const detectCollision = (newX: number, newY: number): CollisionResult => {
  let collisionResult: CollisionResult = {
    collisionX: null,
    collisionY: null,
  };

  const ctx = canvas.getContext('2d');
  if (!ctx) return collisionResult;

  // border collision
  if (newX < 0) {
    collisionResult.collisionX = 0;
  }

  if (newX > canvas.width - 50) {
    collisionResult.collisionX = canvas.width - 50;
  }

  if (newY < 0) {
    collisionResult.collisionY = 0;
  }

  if (newY > canvas.height - 50) {
    collisionResult.collisionY = canvas.height - 50;
  }

  const char = {
    newLeft: newX,
    newRight: newX + CHAR_WIDTH,
    newTop: newY,
    newBottom: newY + CHAR_HEIGHT,
    top: y,
    bottom: y + CHAR_HEIGHT,
    left: x,
    right: x + CHAR_WIDTH,
  }

  // obstacle collision
  for (const obstacle of obstacles) {
    const obs = {
      left: obstacle.x,
      right: obstacle.x + obstacle.width,
      top: obstacle.y,
      bottom: obstacle.y + obstacle.height,
    }

    if (char.newLeft < obs.right && char.newRight > obs.left && char.newTop < obs.bottom && char.newBottom > obs.top) {
      // right collision
      if (char.newLeft < obs.left && char.newRight > obs.left && char.bottom > obs.top && char.top < obs.bottom) {
        collisionResult.collisionX = xv >= 0 ? obs.left - CHAR_WIDTH : obs.right;
      }
      // left collision
      else if (char.newLeft < obs.right && char.newRight > obs.right && char.bottom > obs.top && char.top < obs.bottom) {
        collisionResult.collisionX = xv < 0 ? obs.right : obs.left - CHAR_WIDTH;
      }
      // bottom collision
      else if (char.newTop < obs.top && char.newBottom > obs.top && char.right > obs.left && char.left < obs.right) {
        collisionResult.collisionY = yv >= 0 ? obs.top - CHAR_HEIGHT : obs.bottom;
      }
      // top collision
      else if (char.newTop < obs.bottom && char.newBottom > obs.bottom && char.right > obs.left && char.left < obs.right) {
        collisionResult.collisionY = yv < 0 ? obs.bottom : obs.top - CHAR_HEIGHT;
      }
    }
  }

  return collisionResult;
};

/** Move the character if corresponding arrow keys are pressed (including diagonals) */
const moveCharacter = () => {
  let [newXv, newYv] = applyNaturalForces(xv, yv);
  let newX = x;
  let newY = y;

  if (leftPressed && !rightPressed) {
    newXv -= 1;
  } else if (rightPressed && !leftPressed) {
    newXv += 1;
  }

  if (upPressed && !downPressed) {
    newYv -= 1;
  } else if (downPressed && !upPressed) {
    newYv += 1;
  }

  xv = newXv;
  yv = newYv;

  // apply new velocities
  newX += xv;
  newY += yv;

  const { collisionX, collisionY } = detectCollision(newX, newY);

  if (collisionX === null && collisionY === null) {
    x = newX;
    y = newY;
  } else if (collisionX !== null && collisionY === null) {
    xv = 0;
    x = collisionX;
    y = newY;
  } else if (collisionY !== null && collisionX === null) {
    yv = 0;
    y = collisionY;
    x = newX;
  } else if (collisionX !== null && collisionY !== null) {
    xv = 0;
    yv = 0;
    x = collisionX;
    y = collisionY;
  }
};

const keyDownHandler = (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') {
    leftPressed = true;
  } else if (e.key === 'ArrowRight') {
    rightPressed = true;
  } else if (e.key === 'ArrowUp') {
    upPressed = true;
  } else if (e.key === 'ArrowDown') {
    downPressed = true;
  }
};

const keyUpHandler = (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') {
    leftPressed = false;
  } else if (e.key === 'ArrowRight') {
    rightPressed = false;
  } else if (e.key === 'ArrowUp') {
    upPressed = false;
  } else if (e.key === 'ArrowDown') {
    downPressed = false;
  }
};

const applyNaturalForces = (xv: number, yv: number) => {
  yv += GRAVITY_SPEED;
  xv *= 0.9;

  return [xv, yv];
};


/** Initialize the game */
const init = () => {
  canvas = document.getElementById('canvas') as HTMLCanvasElement;

  sizeCanvas();
  drawCanvas();
  addEventListener('resize', () => drawCanvas());
  addEventListener('keydown', keyDownHandler);
  addEventListener('keyup', keyUpHandler);

  setInterval(() => {
    drawCanvas();
    moveCharacter();
  }, CLOCK_SPEED);
};

(() => {
  init();
})()
