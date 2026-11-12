const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const restartBtn = document.getElementById('restart-btn');
const overlay = document.getElementById('message-overlay');
const overlayTitle = document.getElementById('overlay-title');
const diffButtons = document.querySelectorAll('.diff-btn');

// Game settings
const ballRadius = 10;
const paddleHeight = 15;
const brickRowCount = 6;
const brickColumnCount = 9;
const brickPadding = 10;
const brickOffsetTop = 60;
const brickOffsetLeft = 35;
const brickWidth = 75;
const brickHeight = 25;

// Difficulty Configurations
const DIFFICULTIES = {
    easy: {
        initialDx: 3,
        initialDy: -3,
        acceleration: 0.00005,
        brickBoost: 0.03,
        paddleWidth: 150
    },
    medium: {
        initialDx: 4,
        initialDy: -4,
        acceleration: 0.0001,
        brickBoost: 0.06,
        paddleWidth: 120
    },
    hard: {
        initialDx: 6,
        initialDy: -6,
        acceleration: 0.0002,
        brickBoost: 0.1,
        paddleWidth: 90
    }
};

// Game State
let score = 0;
let x, y, dx, dy;
let paddleX;
let bricks = [];
let gameRunning = false;
let speedMultiplier = 1.0;
let currentDifficulty = 'medium';

// Initialize Game logic
function initGame(difficultyKey) {
    const config = DIFFICULTIES[difficultyKey];
    currentDifficulty = difficultyKey;

    score = 0;
    scoreElement.innerText = score;
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = config.initialDx;
    dy = config.initialDy;
    paddleX = (canvas.width - config.paddleWidth) / 2;
    speedMultiplier = 1.0;

    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
    }

    gameRunning = true;
    overlay.classList.add('hidden');
    draw();
}

// Handle Mouse Input
document.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - DIFFICULTIES[currentDifficulty].paddleWidth / 2;
        if (paddleX < 0) paddleX = 0;
        if (paddleX > canvas.width - DIFFICULTIES[currentDifficulty].paddleWidth) {
            paddleX = canvas.width - DIFFICULTIES[currentDifficulty].paddleWidth;
        }
    }
});

// Difficulty Button Selection
diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove selected class from all
        diffButtons.forEach(b => b.classList.remove('selected'));
        // Add to current
        btn.classList.add('selected');

        // Set and start
        initGame(btn.dataset.difficulty);
    });
});

// Restart Button
restartBtn.addEventListener('click', () => {
    initGame(currentDifficulty);
});

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score += 10;
                    scoreElement.innerText = score;

                    // Apply brick-specific speed boost
                    speedMultiplier += DIFFICULTIES[currentDifficulty].brickBoost;

                    if (score === brickRowCount * brickColumnCount * 10) {
                        endGame("YOU WIN!");
                    }
                }
            }
        }
    }
}

function endGame(message) {
    gameRunning = false;
    overlayTitle.innerText = message;
    overlay.classList.remove('hidden');
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight - 10, DIFFICULTIES[currentDifficulty].paddleWidth, paddleHeight);
    ctx.fillStyle = "#00d2ff";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    const colors = ["#f1c40f", "#e67e22", "#e74c3c", "#9b59b6", "#3498db", "#1abc9c"];
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = colors[r % colors.length];
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function draw() {
    if (!gameRunning) return;

    // Progressively increase speed over time
    speedMultiplier += DIFFICULTIES[currentDifficulty].acceleration;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();

    // Wall collisions
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius - 10) {
        // Paddle collision
        if (x > paddleX && x < paddleX + DIFFICULTIES[currentDifficulty].paddleWidth) {
            dy = -dy;
            // Calculate new dx based on hit position and current speed multiplier
            let hitPos = (x - (paddleX + DIFFICULTIES[currentDifficulty].paddleWidth / 2)) / (DIFFICULTIES[currentDifficulty].paddleWidth / 2);
            dx = (hitPos * 8) * speedMultiplier;
        } else {
            endGame("GAME OVER");
        }
    }

    x += dx * speedMultiplier;
    y += dy * speedMultiplier;

    requestAnimationFrame(draw);
}

// Initial State: Game is not running, overlay is visible
gameRunning = false;
overlay.classList.remove('hidden');
