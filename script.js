// Game constants
const WIDTH = 900;
const HEIGHT = 600;
const TILE_SIZE = 60;
const GRASS_TOP_OFFSET = 15;
const DOUBLE_TAP_DELAY = 300; // ms
const DEBUG_TOUCHES = false; // Set to true to see touch points
const isMobile =
  window.innerWidth < 768 ||
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
const bgCanvas = document.createElement("canvas");
const bgCtx = bgCanvas.getContext("2d");

// Game states
const STATE_HOME = 0;
const STATE_LEVEL_SELECT = 1;
const STATE_PLAYING = 2;
const STATE_LOSE = 3;
const STATE_MENU = 4;
const STATE_TUTORIAL = 5;
const STATE_WIN = 6;

// Game variables
let canvas, ctx;
let scale = 1; // Scale factor for canvas rendering
let gameScale = 1;
let gameOffsetX = 0;
let gameOffsetY = 0;
let gameState = STATE_HOME;
let BTN_SIZE = 64;
let BTN_MARGIN = 20;
let selectedLevel = 1;
let loseSelectedOption = 0;
let menuSelectedOption = 0;
let running = true;
let winSoundPlayed = false;
const activeTouches = new Map(); // Track all active touches with their data
let soundsEnabled = false;
let beeSound = null;
let soundPromptShown = false;
bgCanvas.width = WIDTH;
bgCanvas.height = HEIGHT;
let bgNeedsUpdate = true;

// Player variables
let playerX = 200,
  playerY = 365;
let playerSpeed = 6;
let baseSpeed = 6;
let velocity = 0;
let gravity = 0.9;
const jumpPower = -15;
const boostJumpPower = -20;
let jumpsRemaining = 2;
let boostActive = false;
let chocoBoostEnd = 0;
let facingRight = true;
let swimming = false;
let swimTimer = 0;
let lives = 3;

// Animation variables
let frameIndex = 0;
let frameTimer = 0;
let animationSpeed = 0.2;
let duckBobAngle = 0;
let loseDuckAngle = 0;

// Game objects
let tilemap = [];
let beeTriggers = [];
let beeList = [];
let triggeredBees = new Set();
let eggs = [];
let toasts = [];
let cookies = [];
let chocolates = [];
let waters = [];
let cameraX = 0;
let startTime = 0;

// Counters
let toastCount = 0;
let cookieCount = 0;
let chocoCount = 0;

// Button states
let btnLeftPressed = false;
let btnRightPressed = false;
let btnJumpPressed = false;
let btnShootPressed = false;

// Touch controls
let lastLevelTap = null;
let lastLevelTapTime = 0;
let lastLoseTap = null;
let lastLoseTapTime = 0;

// Button positions
const btnLeft = {
  x: BTN_MARGIN,
  y: HEIGHT - BTN_SIZE - BTN_MARGIN,
  width: BTN_SIZE,
  height: BTN_SIZE,
};
const btnRight = {
  x: BTN_MARGIN * 2 + BTN_SIZE,
  y: HEIGHT - BTN_SIZE - BTN_MARGIN,
  width: BTN_SIZE,
  height: BTN_SIZE,
};
const btnJump = {
  x: WIDTH - BTN_MARGIN - BTN_SIZE,
  y: HEIGHT - BTN_SIZE * 2 - BTN_MARGIN * 2,
  width: BTN_SIZE,
  height: BTN_SIZE,
};
const btnShoot = {
  x: WIDTH - BTN_MARGIN - BTN_SIZE,
  y: HEIGHT - BTN_SIZE - BTN_MARGIN,
  width: BTN_SIZE,
  height: BTN_SIZE,
};

function checkOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth;
  const rotateMsg = document.getElementById("rotate-message");

  if (isPortrait) {
    if (!rotateMsg) {
      // Show rotate device message only if it doesn't exist
      const rotateMsg = document.createElement("div");
      rotateMsg.id = "rotate-message";
      rotateMsg.innerHTML = "Please rotate your device to landscape mode";
      rotateMsg.style.position = "fixed";
      rotateMsg.style.top = "0";
      rotateMsg.style.left = "0";
      rotateMsg.style.width = "100%";
      rotateMsg.style.height = "100%";
      rotateMsg.style.background = "rgba(0,0,0,0.8)";
      rotateMsg.style.color = "white";
      rotateMsg.style.display = "flex";
      rotateMsg.style.justifyContent = "center";
      rotateMsg.style.alignItems = "center";
      rotateMsg.style.zIndex = "2000";
      rotateMsg.style.fontSize = "30px";
      document.body.appendChild(rotateMsg);
    }
  } else {
    // Remove message if it exists and we're in landscape
    if (rotateMsg) {
      rotateMsg.remove();
    }
  }
}

window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);

// Remove existing orientation event listeners if any
window.removeEventListener("resize", checkOrientation);
window.removeEventListener("orientationchange", checkOrientation);

// Add new event listeners with proper debouncing
let resizeTimeout;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    checkOrientation();
    resizeGame();
  }, 100);
}

window.addEventListener("resize", handleResize);
window.addEventListener("orientationchange", handleResize);

// Initial check
checkOrientation();

function resizeGame() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Calculate scale to fit while keeping aspect ratio
  const scaleX = windowWidth / WIDTH;
  const scaleY = windowHeight / HEIGHT;
  gameScale = Math.min(scaleX, scaleY);

  // Calculate margins to center the game
  gameOffsetX = (windowWidth - WIDTH * gameScale) / 2;
  gameOffsetY = (windowHeight - HEIGHT * gameScale) / 2;

  // Apply scaling and positioning
  const gameContainer = document.getElementById("gameContainer");
  gameContainer.style.transform = `translate(${gameOffsetX}px, ${gameOffsetY}px) scale(${gameScale})`;

  // Scale loading screen elements
  const loading = document.getElementById("loading");
  if (loading) {
    loading.style.fontSize = `${24 * gameScale}px`;
  }

  // Handle portrait/landscape changes
  if (windowHeight > windowWidth) {
    // Portrait mode - add some additional scaling if needed
    gameContainer.style.transform = `translate(${gameOffsetX}px, ${gameOffsetY}px) scale(${
      gameScale * 0.9
    })`;
  }
}

// Call this initially and on resize
window.addEventListener("resize", resizeGame);
window.addEventListener("orientationchange", resizeGame);

// Initial resize + event listener
resizeGame();
window.addEventListener("resize", resizeGame);

// Levels data
const levels = {
  1: [
    "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "0000000000000000000000000000000000H00000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000C000011100000000000000000000000000000000000000000000000000000",
    "000000000000000000000000011110000000000000000000000000C0000000000000000000000T0000000000",
    "0000000000000000000T00T00000000000000000000000000T00000000000000000000000000000000000000",
    "00000000T000T00000111110000000000000000C00T00000111000000000C000T000T000T000000000000000",
    "111111100111111111222221111111111111111111111111222111111111111111111111111111111111WWWW",
    "2222222112222222222222222222222222222222222222222222222222222222222222222222222222222222",
    "2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222",
  ],
  2: [
    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "0000000000000000000000000000000000H0000000000000000000000000000000000000000000H00000000000000000000",
    "0000000000000000000000C0001111000000000000000C00000000000000000000000000000000100000000000000000000",
    "000000000000T00000011100000000000000110000000000000000T000000000000000000000C0000000000000000000000",
    "0000000000000000000000000T000000000000000T0000000000000000000000000000000000110000000T0000000000000",
    "000T0000C000000111110000000000000000C00000000011100000C0000000T0000000000000000000000000000T0000000",
    "111111111111111222221111111111111111111111111122211111111111111111111000111111111111111111111111WWW",
    "222222222222222222222222222222222222222222222222222222222222222222222000222222222222222222222222222",
    "222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222",
  ],
  3: [
    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "000000000000C0000000H000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000010000T000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000100000000T00000000000000000000000000000000000000000000000000C000000000000000000000000000000000000000000000",
    "000000000C0000000000T000000000000000000TTT000000000000000000000000000001000000000000000000000000000000000000000000000",
    "00000000110000000000T0000000000000000000000000000000000000000000000000T0000000000T000T0000000000000000000000000000000",
    "0000000000000000000000000000000000T00000000000001111000000000000000000100000000000000000000000000T00T00T00T00T00T0000",
    "111111111111111111111111111111111111111111111111222211000111111111111021111111111111111100111111111111111111111111WWW",
    "22222222222222222222222222222222222222222222222222222200T0T0C0T0T0C00T22222222222222222200222222222222222222222222222",
    "222222222222222222222222222222222222222222222222222222222222222222222222222222222222222200222222222222222222222222222",
  ],
  4: [
    "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000C0000000000000H00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000C0C111000000000000C000000000000000000000000000000000000000000000000C00000000H0000000000000000000000000000000000000000",
    "00000000000000000000000000TT1111200000000000000T0000000000000000C000000000000000000000000000000000000000110000000000000000000000000000000000000000",
    "000000000000000000000CT011112000000000000000000T00000000000000000000000T0000000000T00000000000T0000000000000000C0000000000000000000000000000000000",
    "0000000000000000T000111120000000000000000000000T00000000000T0000000000000000T000000000T000000000000000000000000000000000000T000000000000T0000T0000",
    "H1111111111110111111222221111111111111111111111C11111111111111111111111111111111111111111111111111111111111111111111111001111110111110111111111WWW",
    "22222222222C00222222222222222222222222222222222C00C00T00T00C00T00H22222222222222222222222222222222222222222222222222222222222220222220222222222222",
    "22222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222220222220222222222222",
  ],
  5: [
    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000H00000000000000000000000000000000000000000000000000000000000000HC000000000000000000000000000000000000000000000000H000000000000000",
    "00000000000000000000000000C0001000000000000000000000000000000000000000000000000000000TT0000001100000000000000000000000000000000000000000000C0001000000000000000",
    "0000000000000000000000C000100000000000000000C00000C000T000C0000000T0000H000000T0000001100000000000000T00000000000000C000000000000000000C00010000000000T00000000",
    "00000000000000000000001000000000000000000T000000000000000000000000000000000000000010000000000000000000000000C00000000000000000000000T01000000000000T0000000000",
    "00000000T000T00T00T000000000000000000T000000000000000000000000000000000000000000000000000000000000000000000000000000000000H00000000000000000000000000000000000",
    "101111111111111111111111111111111000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111100001111111111111111111111111111WWW",
    "222222222222222222222222222222222000022222222222222222222222222222222222222222222222222222222222222222222222222222222222222200002222222222222222222222222222222",
    "222222222222222222222222222222222000022222222222222222222222222222222222222222222222222222222222222222222222222222222222222200002222222222222222222222222222222",
  ],
};

// Game assets
const assets = {
  images: {},
  sounds: {},
};

// Asset paths
const assetPaths = {
  images: {
    grassTile: "assets/grass1.png",
    grass3Tile: "assets/grass3.png",
    dirtTile: "assets/grass2.png",
    skyImg: "assets/sky.jpg",
    duckWalk: "assets/duck_walk.png",
    beeImg: "assets/bee.png",
    toastImg: "assets/toast.png",
    cookieImg: "assets/cookie.png",
    chocolateImg: "assets/chocolate.png",
    waterTile: "assets/water.png",
    duckSwim: "assets/duck_swim.png",
    homeBg: "assets/home.png",
    heartImg: "assets/heart.png",
    duck: "assets/duck.png",
  },
  sounds: {
    coin: "assets/coin.mp3",
    egg: "assets/egg.mp3",
    hurt: "assets/hurt.mp3",
    bee: "assets/bee.mp3",
    win: "assets/win.mp3",
  },
};

// Initialize the game
function init() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // Set internal resolution
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // Initial resize
  resizeGame();

  if (isMobile) {
    // Mobile-specific adjustments
    BTN_SIZE = 80; // Make buttons bigger for touch
    BTN_MARGIN = 30;

    // Update button positions
    btnLeft.x = BTN_MARGIN;
    btnLeft.y = HEIGHT - BTN_SIZE - BTN_MARGIN;
    btnRight.x = BTN_MARGIN * 2 + BTN_SIZE;
    btnRight.y = HEIGHT - BTN_SIZE - BTN_MARGIN;
    btnJump.x = WIDTH - BTN_MARGIN - BTN_SIZE;
    btnJump.y = HEIGHT - BTN_SIZE * 2 - BTN_MARGIN * 2;
    btnShoot.x = WIDTH - BTN_MARGIN - BTN_SIZE;
    btnShoot.y = HEIGHT - BTN_SIZE - BTN_MARGIN;

    // Adjust player speed for mobile
    baseSpeed = 8;
    playerSpeed = 8;
    animationSpeed = 0.4;
    gravity = 1.2; // Slightly stronger gravity for mobile
  }

  // Set up event listeners
  setupEventListeners();

  // Show sound prompt immediately
  showSoundPrompt();

  const dpr = window.devicePixelRatio || 1;
  canvas.width = WIDTH * dpr;
  canvas.height = HEIGHT * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = `${WIDTH}px`;
  canvas.style.height = `${HEIGHT}px`;

  // Load all assets
  loadAssets().then(() => {
    document.getElementById("loading").style.display = "none";
    // Start the game loop
    requestAnimationFrame(gameLoop);
  });

  // Initial orientation check
  checkOrientation();

  // Start the game loop
  requestAnimationFrame(gameLoop);
}

// Ask the user to enable sounds
function showSoundPrompt() {
  if (soundPromptShown) return;

  const soundPrompt = document.createElement("div");
  soundPrompt.id = "soundPrompt";
  soundPrompt.style.position = "fixed";
  soundPrompt.style.top = "0";
  soundPrompt.style.left = "0";
  soundPrompt.style.width = "100%";
  soundPrompt.style.height = "100%";
  soundPrompt.style.backgroundColor = "rgba(0,0,0,0.7)";
  soundPrompt.style.display = "flex";
  soundPrompt.style.flexDirection = "column";
  soundPrompt.style.justifyContent = "center";
  soundPrompt.style.alignItems = "center";
  soundPrompt.style.zIndex = "1000";
  soundPrompt.style.color = "white";
  soundPrompt.style.fontFamily = "Verdana, sans-serif";
  soundPrompt.style.textAlign = "center";

  soundPrompt.innerHTML = `
    <h2 style="font-size: 24px; margin-bottom: 20px;">Enable Sounds for Better Experience</h2>
    <button id="enableSoundBtn" style="
      padding: 15px 30px;
      font-size: 18px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-bottom: 10px;
    ">Enable Sounds</button>
    <button id="continueWithoutSound" style="
      padding: 10px 20px;
      font-size: 14px;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    ">Continue Without Sound</button>
  `;

  document.body.appendChild(soundPrompt);

  document.getElementById("enableSoundBtn").addEventListener("click", () => {
    enableSounds();
    soundPrompt.remove();
    soundPromptShown = true;
  });

  document
    .getElementById("continueWithoutSound")
    .addEventListener("click", () => {
      // Explicitly disable sounds
      soundsEnabled = false;
      // Stop any currently playing bee sound
      if (beeSound) {
        beeSound.pause();
        beeSound.currentTime = 0;
        beeSound = null;
      }
      soundPrompt.remove();
      soundPromptShown = true;
    });
}

// Track keyboard state
const keys = {};

// Keyboard input handlers
function handleKeyDown(e) {
  if (gameState === STATE_HOME && (e.key === "Enter" || e.key === "Tab")) {
    gameState = STATE_LEVEL_SELECT;
  } else if (gameState === STATE_LEVEL_SELECT) {
    if (e.key === "ArrowUp") {
      selectedLevel = Math.max(1, selectedLevel - 1);
    } else if (e.key === "ArrowDown") {
      selectedLevel = Math.min(5, selectedLevel + 1);
    } else if (e.key === "Enter") {
      if (selectedLevel === 1) {
        gameState = STATE_TUTORIAL;
      } else {
        gameState = STATE_PLAYING;
        initGame(selectedLevel);
      }
    }
  } else if (gameState === STATE_TUTORIAL && e.key === "Enter") {
    gameState = STATE_PLAYING;
    initGame(selectedLevel);
  } else if (gameState === STATE_LOSE) {
    if (e.key === "ArrowUp") {
      loseSelectedOption = (loseSelectedOption - 1 + 3) % 3;
    } else if (e.key === "ArrowDown") {
      loseSelectedOption = (loseSelectedOption + 1) % 3;
    } else if (e.key === "Enter") {
      if (loseSelectedOption === 0) {
        gameState = STATE_PLAYING;
        initGame(selectedLevel);
      } else if (loseSelectedOption === 1) {
        gameState = STATE_HOME;
      } else if (loseSelectedOption === 2) {
        gameState = STATE_LEVEL_SELECT;
      }
    }
  } else if (gameState === STATE_MENU) {
    if (e.key === "ArrowUp") {
      menuSelectedOption = (menuSelectedOption - 1 + 4) % 4;
    } else if (e.key === "ArrowDown") {
      menuSelectedOption = (menuSelectedOption + 1) % 4;
    } else if (e.key === "Enter") {
      if (menuSelectedOption === 0) {
        gameState = STATE_PLAYING;
      } else if (menuSelectedOption === 1) {
        initGame(selectedLevel);
        gameState = STATE_PLAYING;
      } else if (menuSelectedOption === 2) {
        gameState = STATE_LEVEL_SELECT;
      } else if (menuSelectedOption === 3) {
        gameState = STATE_HOME;
      }
    } else if (e.key === "Escape") {
      gameState = STATE_PLAYING;
    }
  } else if (gameState === STATE_PLAYING) {
    if (e.key === "Escape") {
      gameState = STATE_MENU;
    } else if (e.key === " ") {
      eggs.push({
        x: playerX + (facingRight ? 20 : -20),
        y: playerY + 20,
        dx: facingRight ? 8 : -8,
      });
      playSound("coin");
    }
  }
}

function handleKeyUp(e) {
  keys[e.key] = false;
}

// Set up event listeners
function setupEventListeners() {
  // Keyboard events
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  // Mouse events
  canvas.addEventListener("mousedown", handlePointerDown);
  canvas.addEventListener("mouseup", handlePointerUp);

  // Touch events
  const passiveOptions = { passive: false };
  canvas.addEventListener("touchstart", handlePointerDown, passiveOptions);
  canvas.addEventListener("touchend", handlePointerUp, passiveOptions);
  canvas.addEventListener("touchmove", handleTouchMove, passiveOptions);

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const pos = getCanvasPosition(e.touches[0]);
    handleMenuTouch(pos.x, pos.y, true);
  });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    const pos = getCanvasPosition(e.changedTouches[0]);
    handleMenuTouch(pos.x, pos.y, false);
  });

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    // Mobile-specific adjustments
    BTN_SIZE = 80; // Make buttons bigger for touch
    BTN_MARGIN = 30;

    // Update button positions
    btnLeft.x = BTN_MARGIN;
    btnLeft.y = HEIGHT - BTN_SIZE - BTN_MARGIN;
    btnRight.x = BTN_MARGIN * 2 + BTN_SIZE;
    btnRight.y = HEIGHT - BTN_SIZE - BTN_MARGIN;
    btnJump.x = WIDTH - BTN_MARGIN - BTN_SIZE;
    btnJump.y = HEIGHT - BTN_SIZE * 2 - BTN_MARGIN * 2;
    btnShoot.x = WIDTH - BTN_MARGIN - BTN_SIZE;
    btnShoot.y = HEIGHT - BTN_SIZE - BTN_MARGIN;

    // Adjust player speed for mobile
    baseSpeed = 8;
    playerSpeed = 8;
  }
}

// Unified pointer handler for both mouse and touch
// Update the touch handlers
function handlePointerDown(e) {
  e.preventDefault();
  const touches = e.touches ? Array.from(e.touches) : [e];

  touches.forEach((touch) => {
    const pos = getCanvasPosition(touch);
    const identifier = touch.identifier || "mouse";
    activeTouches.set(identifier, { x: pos.x, y: pos.y });

    // Handle different game states
    switch (gameState) {
      case STATE_HOME:
        handleHomeScreenTouch(pos.x, pos.y);
        break;
      case STATE_LEVEL_SELECT:
        handleLevelSelectTouch(pos.x, pos.y);
        break;
      case STATE_TUTORIAL:
        handleTutorialTouch(pos.x, pos.y);
        break;
      case STATE_LOSE:
        handleLoseScreenTouch(pos.x, pos.y);
        break;
      case STATE_MENU:
        handleMenuTouch(pos.x, pos.y);
        break;
      case STATE_PLAYING:
        handleGameplayTouch(pos.x, pos.y, true);
        break;
    }
  });
}

function handlePointerUp(e) {
  e.preventDefault();
  const touches = e.touches ? Array.from(e.touches) : [];
  const changedTouches = e.changedTouches ? Array.from(e.changedTouches) : [e];

  // Remove ended touches
  changedTouches.forEach((touch) => {
    const identifier = touch.identifier || "mouse";
    activeTouches.delete(identifier);
  });

  // Update button states based on remaining touches
  btnLeftPressed = false;
  btnRightPressed = false;
  btnJumpPressed = false;
  btnShootPressed = false;

  activeTouches.forEach((pos) => {
    if (isPointInRect(pos.x, pos.y, btnLeft)) btnLeftPressed = true;
    if (isPointInRect(pos.x, pos.y, btnRight)) btnRightPressed = true;
    if (isPointInRect(pos.x, pos.y, btnJump)) btnJumpPressed = true;
    if (isPointInRect(pos.x, pos.y, btnShoot)) btnShootPressed = true;
  });
}

function getCanvasPosition(event) {
  let clientX, clientY;

  if (event.touches) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  // Convert to game coordinates considering scaling and offset
  return {
    x: (clientX - gameOffsetX) / gameScale,
    y: (clientY - gameOffsetY) / gameScale,
  };
}

// Touch handlers for each game state
function handleHomeScreenTouch(x, y) {
  const titleRect = {
    x: WIDTH / 2 - 200,
    y: HEIGHT / 3,
    width: 400,
    height: 100,
  };
  const instrRect = {
    x: WIDTH / 2 - 200,
    y: HEIGHT / 2,
    width: 400,
    height: 50,
  };

  if (isPointInRect(x, y, titleRect) || isPointInRect(x, y, instrRect)) {
    gameState = STATE_LEVEL_SELECT;
  }
}

function handleLevelSelectTouch(x, y) {
  const startY = HEIGHT / 4;
  const spacing = 60;
  const optionWidth = 300;
  const optionHeight = 70;

  for (let i = 1; i <= 5; i++) {
    const rect = {
      x: WIDTH / 2 - optionWidth / 2,
      y: startY + i * spacing - optionHeight / 2,
      width: optionWidth,
      height: optionHeight,
    };

    if (isPointInRect(x, y, rect)) {
      const now = Date.now();
      if (
        selectedLevel === i &&
        lastLevelTap === i &&
        now - lastLevelTapTime < DOUBLE_TAP_DELAY
      ) {
        // Double tap detected
        if (selectedLevel === 1) {
          gameState = STATE_TUTORIAL;
        } else {
          gameState = STATE_PLAYING;
          initGame(selectedLevel);
        }
      } else {
        // Single tap - just select
        selectedLevel = i;
        lastLevelTap = i;
        lastLevelTapTime = now;
      }
    }
  }
}

function handleTutorialTouch(x, y) {
  const instrRect = {
    x: WIDTH / 2 - 200,
    y: 60,
    width: 400,
    height: 500,
  };

  if (isPointInRect(x, y, instrRect)) {
    gameState = STATE_PLAYING;
    initGame(selectedLevel);
  }
}

function handleLoseScreenTouch(x, y) {
  const options = ["Play Again", "Exit to Home", "Change Level"];
  const startY = HEIGHT / 3;
  const spacing = 60;
  const optionWidth = 300;
  const optionHeight = 70;

  for (let i = 0; i < options.length; i++) {
    const rect = {
      x: WIDTH / 2 - optionWidth / 2,
      y: startY + i * spacing,
      width: optionWidth,
      height: optionHeight,
    };

    if (isPointInRect(x, y, rect)) {
      const now = Date.now();
      if (
        loseSelectedOption === i &&
        lastLoseTap === i &&
        now - lastLoseTapTime < DOUBLE_TAP_DELAY
      ) {
        // Double tap detected
        if (i === 0) {
          gameState = STATE_PLAYING;
          initGame(selectedLevel);
        } else if (i === 1) {
          gameState = STATE_HOME;
        } else if (i === 2) {
          gameState = STATE_LEVEL_SELECT;
        }
      } else {
        loseSelectedOption = i;
        lastLoseTap = i;
        lastLoseTapTime = now;
      }
    }
  }
}

let menuTouchStartTime = 0;
let menuTouchStartOption = -1;

function handleMenuTouch(x, y, isDown) {
  const options = ["Continue", "Re-Play", "Change Level", "Exit to Home"];
  const startY = HEIGHT / 3;
  const spacing = 50;
  const optionWidth = 300;
  const optionHeight = 50;

  // Check which option is being touched
  let touchedOption = -1;
  for (let i = 0; i < options.length; i++) {
    const rect = {
      x: WIDTH / 2 - optionWidth / 2,
      y: startY + i * spacing,
      width: optionWidth,
      height: optionHeight,
    };

    if (isPointInRect(x, y, rect)) {
      touchedOption = i;
      break;
    }
  }

  if (isDown) {
    // Touch start - just remember which option was touched
    menuTouchStartTime = Date.now();
    menuTouchStartOption = touchedOption;
    menuSelectedOption = touchedOption; // Highlight the option
  } else {
    // Touch end - perform action only if:
    // 1. The touch ended on the same option it started on
    // 2. The touch lasted at least 100ms (to prevent accidental taps)
    if (
      touchedOption === menuTouchStartOption &&
      Date.now() - menuTouchStartTime > 100
    ) {
      performMenuAction(touchedOption);
    }
  }
}

function performMenuAction(optionIndex) {
  switch (optionIndex) {
    case 0: // Continue
      gameState = STATE_PLAYING;
      break;
    case 1: // Re-Play
      initGame(selectedLevel);
      gameState = STATE_PLAYING;
      break;
    case 2: // Change Level
      gameState = STATE_LEVEL_SELECT;
      break;
    case 3: // Exit to Home
      gameState = STATE_HOME;
      break;
  }
}

function handleGameplayTouch(x, y, isDown) {
  // Check button presses
  if (isPointInRect(x, y, btnLeft)) {
    btnLeftPressed = isDown;
  }
  if (isPointInRect(x, y, btnRight)) {
    btnRightPressed = isDown;
  }
  if (isPointInRect(x, y, btnJump)) {
    btnJumpPressed = isDown;
  }
  if (isPointInRect(x, y, btnShoot)) {
    btnShootPressed = isDown;
    if (isDown) {
      eggs.push({
        x: playerX + (facingRight ? 20 : -20),
        y: playerY + 20,
        dx: facingRight ? 8 : -8,
      });
      playSound("egg");
    }
  }

  // Also handle pause by touching top center of screen
  const pauseArea = {
    x: WIDTH / 2 - 50,
    y: 10,
    width: 100,
    height: 40,
  };

  if (isPointInRect(x, y, pauseArea) && isDown) {
    gameState = STATE_MENU;
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();

  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    if (activeTouches.has(touch.identifier)) {
      const tx = (touch.clientX - rect.left) * (canvas.width / rect.width);
      const ty = (touch.clientY - rect.top) * (canvas.height / rect.height);
      activeTouches.set(touch.identifier, { x: tx, y: ty });
    }
  }

  // Update button states
  btnLeftPressed = false;
  btnRightPressed = false;
  btnJumpPressed = false;
  btnShootPressed = false;

  activeTouches.forEach((pos) => {
    if (isPointInRect(pos.x, pos.y, btnLeft)) btnLeftPressed = true;
    if (isPointInRect(pos.x, pos.y, btnRight)) btnRightPressed = true;
    if (isPointInRect(pos.x, pos.y, btnJump)) btnJumpPressed = true;
    if (isPointInRect(pos.x, pos.y, btnShoot)) btnShootPressed = true;
  });
}

// Helper function to check if point is in rectangle
function isPointInRect(x, y, rect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

let lastTime = 0;
const targetFPS = 80;
const frameTime = 1000 / targetFPS;

// Main game loop
function gameLoop(timestamp) {
  if (!running) return;

  const deltaTime = timestamp - lastTime;

  if (deltaTime >= frameTime) {
    update(deltaTime / 1000); // Convert to seconds
    render();
    lastTime = timestamp;
  }

  requestAnimationFrame(gameLoop);
}

// Change the initialization at the end of init() function
// From:
// requestAnimationFrame(gameLoop);
// To:

// Update game state
function update() {
  if (gameState === STATE_WIN) {
    swimTimer++;

    if (!winSoundPlayed) {
      playSound("win");
      winSoundPlayed = true;
    }

    // Clamp camera so it doesn't show beyond the right edge
    const maxCameraX = Math.max(0, tilemap[0].length * TILE_SIZE - WIDTH);
    cameraX = Math.min(Math.max(0, playerX - WIDTH / 2), maxCameraX);

    if (swimTimer < 60) {
      // Duck swims in place for 1 second
    } else {
      // Duck swims away horizontally after 1 second
      playerX += 4;
      // Clamp camera again as duck moves
      cameraX = Math.min(Math.max(0, playerX - WIDTH / 2), maxCameraX);
    }

    if (swimTimer > 120) {
      gameState = STATE_LEVEL_SELECT;
      winSoundPlayed = false;
    }
    return;
  }

  if (gameState !== STATE_PLAYING) {
    duckBobAngle += 0.1;
    loseDuckAngle += 0.1;
    return;
  }

  // Gameplay logic
  if (Date.now() / 1000 > chocoBoostEnd) {
    playerSpeed = baseSpeed;
    boostActive = false;
  }

  // Movement
  let moveX = 0;
  if (
    (keys["ArrowRight"] || btnRightPressed) &&
    !(keys["ArrowLeft"] || btnLeftPressed)
  ) {
    moveX += playerSpeed;
  }
  if (
    (keys["ArrowLeft"] || btnLeftPressed) &&
    !(keys["ArrowRight"] || btnRightPressed)
  ) {
    moveX -= playerSpeed;
  }
  const moving = moveX !== 0;

  let lastJumpTime = 0;
  const JUMP_COOLDOWN = 200; // 200ms cooldown
  // Double Jump logic
  if (
    (keys["ArrowUp"] || btnJumpPressed) &&
    jumpsRemaining > 0 &&
    Date.now() - lastJumpTime > JUMP_COOLDOWN
  ) {
    if (velocity >= 0) {
      velocity = boostActive ? boostJumpPower : jumpPower;
      jumpsRemaining--;
      lastJumpTime = Date.now();
      btnJumpPressed = false;
    }
  }

  facingRight = moveX > 0 ? true : moveX < 0 ? false : facingRight;
  velocity += gravity;
  const moveY = velocity;

  // Collision detection
  const playerRect = { x: playerX, y: playerY, width: 47, height: 60 };
  const blocks = [];

  for (let y = 0; y < tilemap.length; y++) {
    const row = tilemap[y];
    for (let x = 0; x < row.length; x++) {
      const tile = row[x];
      if (tile === "1") {
        blocks.push({
          x: x * TILE_SIZE,
          y: y * TILE_SIZE + GRASS_TOP_OFFSET,
          width: TILE_SIZE,
          height: TILE_SIZE - GRASS_TOP_OFFSET,
        });
      } else if (tile === "2" || tile === "3") {
        blocks.push({
          x: x * TILE_SIZE,
          y: y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
        });
      }
    }
  }

  // Horizontal collision
  playerRect.x += moveX;
  for (const block of blocks) {
    if (isColliding(playerRect, block)) {
      if (moveX > 0) {
        playerRect.x = block.x - playerRect.width;
      } else if (moveX < 0) {
        playerRect.x = block.x + block.width;
      }
    }
  }

  // Vertical collision
  const prevBottom = playerRect.y + playerRect.height;
  playerRect.y += moveY;
  let onGround = false;

  for (const block of blocks) {
    if (isColliding(playerRect, block)) {
      if (moveY > 0) {
        playerRect.y = block.y - playerRect.height;
        velocity = 0;
        onGround = true;
        jumpsRemaining = 2;
      } else if (moveY < 0) {
        playerRect.y = block.y + block.height;
        velocity = 0;
      }
    }
  }

  playerX = Math.max(0, playerRect.x);
  playerY = playerRect.y;

  // Check if player fell off the screen
  if (playerY > HEIGHT) {
    gameState = STATE_LOSE;
  }

  // Check water collision (only trigger win if duck's bottom is inside last water tiles)
  if (waters.length > 0) {
    for (let i = Math.max(0, waters.length - 3); i < waters.length; i++) {
      const waterRect = waters[i];
      if (
        isColliding(playerRect, waterRect) &&
        playerRect.y + playerRect.height > waterRect.y + TILE_SIZE / 3
      ) {
        gameState = STATE_WIN;
        swimTimer = 0;
        winSoundPlayed = false;
        break;
      }
    }
  }

  // Bees
  for (const [triggerX, spawnY] of beeTriggers) {
    if (playerX >= triggerX && !triggeredBees.has(triggerX)) {
      beeList.push({
        x: cameraX + WIDTH + 50,
        y: spawnY,
        width: assets.images.beeImg.width,
        height: assets.images.beeImg.height,
      });
      triggeredBees.add(triggerX);
    }
  }
  // Update bees
  let beeOnScreen = false;
  for (let i = beeList.length - 1; i >= 0; i--) {
    const bee = beeList[i];
    bee.x -= 3;

    if (isColliding(playerRect, bee)) {
      lives--;
      playSound("hurt");
      beeList.splice(i, 1);
      if (lives <= 0) {
        gameState = STATE_LOSE;
      }
    }

    if (bee.x + bee.width < cameraX) {
      beeList.splice(i, 1);
    }

    if (bee.x - cameraX < WIDTH && bee.x - cameraX + bee.width > 0) {
      beeOnScreen = true;
    }
  }

  // Bee sound handling
  if (beeOnScreen) {
    if (!beeSound && soundsEnabled) {
      // Only play if sounds are enabled
      beeSound = assets.sounds.bee.cloneNode();
      beeSound.loop = true;
      beeSound.volume = 0.3;
      beeSound.play().catch((e) => console.log("Bee sound failed", e));
    }
  } else {
    if (beeSound) {
      beeSound.pause();
      beeSound.currentTime = 0;
      beeSound = null;
    }
  }

  // Eggs
  for (let i = eggs.length - 1; i >= 0; i--) {
    const egg = eggs[i];
    egg.x += egg.dx;

    let removed = false;
    const eggRect = { x: egg.x, y: egg.y, width: 10, height: 10 };

    // Check block collisions
    for (const block of blocks) {
      if (isColliding(eggRect, block)) {
        eggs.splice(i, 1);
        removed = true;
        break;
      }
    }

    if (!removed) {
      // Check bee collisions
      for (let j = beeList.length - 1; j >= 0; j--) {
        const bee = beeList[j];
        if (isColliding(eggRect, bee)) {
          beeList.splice(j, 1);
          eggs.splice(i, 1);
          removed = true;
          break;
        }
      }
    }

    // Remove if off screen
    if (!removed && (egg.x < cameraX - 50 || egg.x > cameraX + WIDTH + 50)) {
      eggs.splice(i, 1);
    }
  }

  // Food collection
  for (let i = toasts.length - 1; i >= 0; i--) {
    if (isColliding(playerRect, toasts[i])) {
      toasts.splice(i, 1);
      toastCount++;
      playSound("coin");
    }
  }

  for (let i = cookies.length - 1; i >= 0; i--) {
    if (isColliding(playerRect, cookies[i])) {
      cookies.splice(i, 1);
      cookieCount++;
      playSound("coin");
    }
  }

  for (let i = chocolates.length - 1; i >= 0; i--) {
    if (isColliding(playerRect, chocolates[i])) {
      chocolates.splice(i, 1);
      chocoCount++;
      playerSpeed = baseSpeed * 2;
      boostActive = true;
      chocoBoostEnd = Date.now() / 1000 + 7;
      playSound("coin");
    }
  }

  // Animation
  frameTimer += animationSpeed;
  if (moving) {
    if (frameTimer >= 1) {
      frameTimer = 0;
      frameIndex = (frameIndex + 1) % assets.images.duckFramesRight.length;
    }
  }

  // Update camera position
  const maxCameraX = Math.max(0, tilemap[0].length * TILE_SIZE - WIDTH);
  cameraX = Math.min(Math.max(0, playerX - WIDTH / 2), maxCameraX);
}

// Check collision between two rectangles
function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// Resize the text
function getScaledFontSize(baseSize) {
  const scale = Math.min(
    window.innerWidth / WIDTH,
    window.innerHeight / HEIGHT
  );
  return Math.round(baseSize * scale);
}

// Render game
function render() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (gameState === STATE_HOME) {
    drawHomeScreen();
  } else if (gameState === STATE_LEVEL_SELECT) {
    const duckBobOffset = Math.sin(duckBobAngle) * 5;
    drawLevelSelect(duckBobOffset);
  } else if (gameState === STATE_TUTORIAL) {
    drawTutorialScreen();
  } else if (gameState === STATE_LOSE) {
    const loseDuckOffset = Math.sin(loseDuckAngle) * 5;
    drawLoseScreen(loseDuckOffset, loseSelectedOption);
  } else if (gameState === STATE_MENU) {
    const duckBobOffset = Math.sin(duckBobAngle) * 5;
    drawMenuScreen(duckBobOffset, menuSelectedOption);
  } else if (gameState === STATE_WIN) {
    // Draw background
    ctx.fillStyle = "#69beff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw sky
    const skyWidth = assets.images.skyImg.width;
    let startX = (-cameraX % skyWidth) - skyWidth;
    while (startX < WIDTH) {
      ctx.drawImage(assets.images.skyImg, startX, -130);
      startX += skyWidth;
    }

    // Draw tiles
    for (let y = 0; y < tilemap.length; y++) {
      const row = tilemap[y];
      for (let x = 0; x < row.length; x++) {
        const tile = row[x];
        const drawX = x * TILE_SIZE - cameraX;
        const drawY = y * TILE_SIZE;

        if (tile === "1") {
          ctx.drawImage(assets.images.grassTile, drawX, drawY);
        } else if (tile === "2") {
          ctx.drawImage(assets.images.dirtTile, drawX, drawY);
        } else if (tile === "3") {
          const offsetY = TILE_SIZE - assets.images.grass3Tile.height;
          ctx.drawImage(assets.images.grass3Tile, drawX, drawY + offsetY);
        } else if (tile === "W") {
          ctx.drawImage(assets.images.waterTile, drawX, drawY);
        }
      }
    }

    // Draw duck
    if (swimTimer < 60) {
      // Duck swims in place for 1 second
      ctx.drawImage(assets.images.duckSwim, playerX - cameraX, playerY);
    } else {
      // Duck swims away horizontally after 1 second
      ctx.drawImage(assets.images.duckSwim, playerX - cameraX, playerY);
    }
  } else if (gameState === STATE_PLAYING) {
    // Draw background
    ctx.fillStyle = "#69beff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw sky
    const skyWidth = assets.images.skyImg.width;
    let startX = (-cameraX % skyWidth) - skyWidth;
    while (startX < WIDTH) {
      ctx.drawImage(assets.images.skyImg, startX, -130);
      startX += skyWidth;

      // Debug: Draw touch points (remove in final version)
      if (DEBUG_TOUCHES && gameState === STATE_PLAYING) {
        activeTouches.forEach((touch) => {
          ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
          ctx.beginPath();
          ctx.arc(touch.x, touch.y, 20, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }

    // Draw tiles

    function renderTiles() {
      // Calculate visible tile range
      const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE) - 1);
      const endCol = Math.min(
        tilemap[0].length,
        Math.ceil((cameraX + WIDTH) / TILE_SIZE) + 1
      );

      for (let y = 0; y < tilemap.length; y++) {
        for (let x = startCol; x < endCol; x++) {
          const tile = tilemap[y][x];
          const drawX = x * TILE_SIZE - cameraX;
          const drawY = y * TILE_SIZE;

          if (tile === "1") {
            ctx.drawImage(assets.images.grassTile, drawX, drawY);
          } else if (tile === "2") {
            ctx.drawImage(assets.images.dirtTile, drawX, drawY);
          } else if (tile === "3") {
            const offsetY = TILE_SIZE - assets.images.grass3Tile.height;
            ctx.drawImage(assets.images.grass3Tile, drawX, drawY + offsetY);
          } else if (tile === "W") {
            ctx.drawImage(assets.images.waterTile, drawX, drawY);
          }
        }
      }
    }

    renderTiles();

    // Draw food with bobbing animation
    const foodOffset = Math.sin(Date.now() / 250) * 5;
    for (const toast of toasts) {
      ctx.drawImage(
        assets.images.toastImg,
        toast.x - cameraX,
        toast.y + foodOffset
      );
    }
    for (const cookie of cookies) {
      ctx.drawImage(
        assets.images.cookieImg,
        cookie.x - cameraX,
        cookie.y + foodOffset
      );
    }
    for (const choco of chocolates) {
      ctx.drawImage(
        assets.images.chocolateImg,
        choco.x - cameraX,
        choco.y + foodOffset
      );
    }

    // Draw bees
    for (const bee of beeList) {
      ctx.drawImage(assets.images.beeImg, bee.x - cameraX, bee.y);
    }

    // Draw eggs
    ctx.fillStyle = "white";
    for (const egg of eggs) {
      ctx.beginPath();
      ctx.arc(egg.x - cameraX, egg.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player
    let currentFrame;
    const moving =
      btnLeftPressed ||
      btnRightPressed ||
      keys["ArrowLeft"] ||
      keys["ArrowRight"];

    if (moving) {
      currentFrame = facingRight
        ? assets.images.duckFramesRight[frameIndex]
        : assets.images.duckFramesLeft[frameIndex];
    } else {
      currentFrame = facingRight
        ? assets.images.duckFramesRight[1]
        : assets.images.duckFramesLeft[1];
    }

    ctx.drawImage(currentFrame, playerX - cameraX, playerY);

    // Draw HUD
    const iconSize = 24;
    let xPos = 10;

    // Toast counter
    ctx.drawImage(assets.images.toastImg, xPos, 10, iconSize, iconSize);
    xPos += iconSize + 5;

    ctx.font = `${getScaledFontSize(24)}px Verdana`;
    ctx.fillStyle = "white";
    ctx.fillText(toastCount.toString(), xPos, 35);
    xPos += ctx.measureText(toastCount.toString()).width + 15;

    // Cookie counter
    ctx.drawImage(assets.images.cookieImg, xPos, 10, iconSize, iconSize);
    xPos += iconSize + 5;

    ctx.fillText(cookieCount.toString(), xPos, 35);
    xPos += ctx.measureText(cookieCount.toString()).width + 15;

    // Chocolate counter
    ctx.drawImage(assets.images.chocolateImg, xPos, 10, iconSize, iconSize);
    xPos += iconSize + 5;

    ctx.fillText(chocoCount.toString(), xPos, 35);

    // Lives
    const heartSize = 24;
    for (let i = 0; i < lives; i++) {
      ctx.drawImage(
        assets.images.heartImg,
        10 + i * (heartSize + 5),
        40,
        heartSize,
        heartSize
      );
    }

    // Timer
    const elapsed = Math.floor(Date.now() / 1000 - startTime);
    ctx.fillText(
      `Time: ${elapsed}s`,
      WIDTH - ctx.measureText(`Time: ${elapsed}s`).width - 10,
      35
    );

    // Boost indicator
    if (boostActive) {
      ctx.fillStyle = "#fff429";
      ctx.fillText(
        "BOOST!",
        WIDTH / 2 - ctx.measureText("BOOST!").width / 2,
        50
      );
    }

    // Draw buttons
    drawButtons();
  }

  // Add a pause button indicator when in playing state
  if (gameState === STATE_PLAYING) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillRect(WIDTH / 2 - 50, 10, 100, 40);
    ctx.fillStyle = "black";
    ctx.font = `${getScaledFontSize(17)}px Verdana`;
    ctx.textAlign = "center";
    ctx.fillText("PAUSE", WIDTH / 2, 35);
  }
}

// Sound functions
function playSound(soundName) {
  if (!soundsEnabled) return; // Early exit if sounds are disabled

  const sound = assets.sounds[soundName];
  if (!sound) return;

  try {
    const clone = sound.cloneNode();
    clone.volume = sound.volume || 1.0;
    clone.play().catch((e) => console.log(`Failed to play ${soundName}`, e));
  } catch (e) {
    console.log(`Sound error with ${soundName}`, e);
  }
}

function enableSounds() {
  soundsEnabled = true;
  // Play a silent sound to unlock audio context
  const silentSound = new Audio();
  silentSound.src =
    "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...";
  silentSound.volume = 0;
  silentSound
    .play()
    .then(() => {
      silentSound.remove();
    })
    .catch((e) => console.log("Audio unlock failed", e));
}

// Initialize game level
function initGame(levelNum) {
  beeTriggers = [];
  if (levelNum === 1) {
    beeTriggers = [
      [600, 300],
      [1200, 350],
      [1800, 300],
      [2400, 320],
      [3000, 280],
    ];
  } else if (levelNum === 2) {
    beeTriggers = [
      [500, 250],
      [800, 300],
      [1200, 270],
      [1500, 260],
      [2000, 300],
      [2500, 250],
      [3000, 230],
      [3999, 244],
      [4500, 230],
    ];
  } else if (levelNum === 3) {
    beeTriggers = [
      [800, 240],
      [900, 230],
      [900, 265],
      [1200, 250],
      [1600, 270],
      [1700, 235],
      [2000, 260],
      [2200, 300],
      [3000, 254],
      [3555, 239],
      [4000, 280],
    ];
  } else if (levelNum === 4) {
    beeTriggers = [
      [300, 250],
      [400, 210],
      [500, 240],
      [600, 230],
      [700, 300],
      [800, 240],
      [1000, 230],
      [1200, 244],
      [1400, 225],
      [1700, 221],
      [2000, 234],
      [2003, 239],
      [2006, 280],
      [2400, 200],
      [2800, 230],
      [3000, 260],
      [3200, 244],
      [3300, 230],
      [3600, 250],
      [3800, 254],
      [4000, 239],
      [4200, 280],
      [4400, 300],
    ];
  } else if (levelNum === 5) {
    beeTriggers = [
      [280, 220],
      [300, 210],
      [370, 220],
      [375, 230],
      [380, 190],
      [370, 230],
      [400, 170],
      [430, 180],
      [430, 220],
      [500, 240],
      [500, 230],
      [500, 240],
      [500, 170],
      [560, 190],
      [600, 180],
      [680, 201],
      [700, 206],
      [800, 210],
      [900, 190],
      [1000, 160],
      [1100, 200],
      [1200, 204],
      [1300, 207],
      [1400, 190],
      [1500, 210],
      [1600, 220],
      [1700, 205],
      [1800, 200],
      [1900, 210],
      [2000, 230],
      [2100, 290],
      [2200, 220],
      [2300, 260],
      [2400, 230],
      [2500, 250],
      [2600, 250],
      [2700, 230],
      [2800, 240],
      [2900, 250],
      [3000, 220],
      [3100, 224],
      [3200, 240],
      [3300, 201],
      [3400, 190],
      [3500, 210],
      [3600, 212],
      [3700, 170],
      [3800, 220],
      [3900, 222],
      [4000, 240],
      [4100, 202],
      [4200, 200],
      [4300, 220],
      [4400, 214],
      [4500, 181],
      [4600, 220],
      [4700, 225],
      [4800, 240],
      [4900, 203],
      [5000, 210],
      [5100, 170],
      [5200, 215],
      [5300, 193],
      [5400, 220],
      [5500, 227],
      [5600, 240],
      [5700, 204],
      [5800, 190],
      [5900, 223],
      [6000, 216],
      [6100, 185],
      [6200, 220],
      [6300, 229],
      [6400, 240],
      [6500, 190],
      [6600, 204],
      [6700, 215],
      [6800, 218],
      [6900, 200],
      [7000, 220],
      [7100, 222],
      [7200, 240],
      [7300, 205],
      [7400, 206],
      [7500, 219],
      [7600, 219],
      [7700, 190],
      [7800, 220],
      [7900, 221],
      [8000, 240],
      [8100, 206],
      [8200, 190],
      [8300, 215],
      [8400, 221],
      [8500, 210],
      [8600, 220],
      [8700, 223],
      [8800, 240],
      [8900, 207],
      [9000, 230],
    ];
  }

  triggeredBees = new Set();
  tilemap = levels[levelNum];

  playerX = 200;
  playerY = 365;
  playerSpeed = baseSpeed;
  velocity = 0;
  jumpsRemaining = 2;
  boostActive = false;
  chocoBoostEnd = 0;

  beeList = [];
  cameraX = 0;
  startTime = Date.now() / 1000;
  lives = 3;
  eggs = [];
  toasts = [];
  cookies = [];
  chocolates = [];
  waters = [];

  toastCount = 0;
  cookieCount = 0;
  chocoCount = 0;

  // Parse the tilemap
  for (let y = 0; y < tilemap.length; y++) {
    const row = tilemap[y];
    for (let x = 0; x < row.length; x++) {
      const tile = row[x];
      const worldX = x * TILE_SIZE;
      const worldY = y * TILE_SIZE;

      if (tile === "W") {
        waters.push({
          x: worldX,
          y: worldY,
          width: TILE_SIZE,
          height: TILE_SIZE,
        });
      } else if (tile === "T") {
        toasts.push({
          x: worldX,
          y: worldY + 10,
          width: assets.images.toastImg.width,
          height: assets.images.toastImg.height,
        });
      } else if (tile === "C") {
        cookies.push({
          x: worldX,
          y: worldY + 10,
          width: assets.images.cookieImg.width,
          height: assets.images.cookieImg.height,
        });
      } else if (tile === "H") {
        chocolates.push({
          x: worldX,
          y: worldY + 10,
          width: assets.images.chocolateImg.width,
          height: assets.images.chocolateImg.height,
        });
      }
    }
  }
}

// Load all game assets
async function loadAssets() {
  // Load images
  const imagePromises = Object.entries(assetPaths.images).map(
    ([name, path]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
          assets.images[name] = img;
          resolve();
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${path}`);
          resolve(); // Still resolve to prevent hanging
        };
      });
    }
  );

  // Load sounds
  const soundPromises = Object.entries(assetPaths.sounds).map(
    ([name, path]) => {
      return new Promise((resolve) => {
        const audio = new Audio();
        audio.src = path;
        audio.preload = "auto";
        audio.load();

        // Different browsers handle this differently
        const onCanPlay = () => {
          audio.removeEventListener("canplaythrough", onCanPlay);
          assets.sounds[name] = audio;
          resolve();
        };

        audio.addEventListener("canplaythrough", onCanPlay);
        audio.onerror = () => {
          console.error(`Failed to load sound: ${path}`);
          resolve(); // Still resolve to prevent hanging
        };
      });
    }
  );

  await Promise.all([...imagePromises, ...soundPromises]);
  sliceDuckFrames();
}

// Slice duck animation frames
function sliceDuckFrames() {
  const sheet = assets.images.duckWalk;
  const frameWidth = 47;
  const frameHeight = 60;
  const numFrames = 3;

  assets.images.duckFramesRight = [];
  for (let i = 0; i < numFrames; i++) {
    const frame = document.createElement("canvas");
    frame.width = frameWidth;
    frame.height = frameHeight;
    const frameCtx = frame.getContext("2d");
    frameCtx.drawImage(
      sheet,
      i * frameWidth,
      0,
      frameWidth,
      frameHeight,
      0,
      0,
      frameWidth,
      frameHeight
    );
    assets.images.duckFramesRight.push(frame);
  }

  assets.images.duckFramesLeft = assets.images.duckFramesRight.map((frame) => {
    const flipped = document.createElement("canvas");
    flipped.width = frameWidth;
    flipped.height = frameHeight;
    const flippedCtx = flipped.getContext("2d");
    flippedCtx.scale(-1, 1);
    flippedCtx.drawImage(frame, -frameWidth, 0);
    return flipped;
  });
}

// Draw home screen
function drawHomeScreen() {
  ctx.drawImage(assets.images.homeBg, 0, 0);

  // Draw title with outline
  const title = "Quackra";
  ctx.font = `${getScaledFontSize(50)}px Verdana`;
  ctx.textAlign = "left";

  // Outline
  ctx.fillStyle = "black";
  for (const [dx, dy] of [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
  ]) {
    ctx.fillText(
      title,
      WIDTH / 2 - ctx.measureText(title).width / 2 + dx,
      HEIGHT / 3 + dy
    );
  }

  // Main text
  ctx.fillStyle = "white";
  ctx.fillText(title, WIDTH / 2 - ctx.measureText(title).width / 2, HEIGHT / 3);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Instruction
  ctx.font = `${getScaledFontSize(25)}px Verdana`;
  const instruction = "Press ENTER or TAB ON THE SCREEN HERE to start";
  ctx.fillText(
    instruction,
    WIDTH / 2 - ctx.measureText(instruction).width / 2,
    HEIGHT / 2
  );

  // Credit
  ctx.fillStyle = "#fff429";
  ctx.fillText("Art by @Cookiekayjax on PixilArt", 10, HEIGHT - 40);
}

// Draw tutorial screens
function drawTutorialScreen() {
  // Draw grass background
  const tileWidth = assets.images.dirtTile.width;
  const tileHeight = assets.images.dirtTile.height;

  for (let y = 0; y < HEIGHT; y += tileHeight) {
    for (let x = 0; x < WIDTH; x += tileWidth) {
      ctx.drawImage(assets.images.dirtTile, x, y);
    }
  }

  // Draw duck and bee with bobbing animation
  const bob = Math.sin(Date.now() / 300) * 5;
  ctx.drawImage(
    assets.images.duck,
    WIDTH / 4 - assets.images.duck.width / 2,
    HEIGHT / 2 + bob
  );

  ctx.drawImage(assets.images.beeImg, WIDTH * 0.7, HEIGHT / 2 - 50 - bob);

  // Draw tutorial text
  const lines = [
    "Meet Quackra, the brave duck!",
    "Help Quackra reach the leak to swim.",
    "Beware of Haider the bee!",
    "",
    "Controls:",
    "Arrow Keys - Move",
    "Up Arrow - Jump (double jump)",
    "Space - Shoot eggs",
    "ESC - Pause",
    "",
    "Collect food for points and speed boost.",
    "",
    "Press ENTER or TAB ON THE SCREEN to start the adventure!",
  ];

  ctx.font = `${getScaledFontSize(20)}px Verdana`;
  ctx.fillStyle = "#fff429";
  let y = 60;
  ctx.textAlign = "left";

  for (const line of lines) {
    ctx.fillText(line, WIDTH / 2 - ctx.measureText(line).width / 2, y);
    y += 40;
  }
}

// Draw level select screen
function drawLevelSelect(duckBobOffset) {
  // Draw grass background
  const tileWidth = assets.images.dirtTile.width;
  const tileHeight = assets.images.dirtTile.height;

  for (let y = 0; y < HEIGHT; y += tileHeight) {
    for (let x = 0; x < WIDTH; x += tileWidth) {
      ctx.drawImage(assets.images.dirtTile, x, y);
    }
  }

  // Draw title
  ctx.font = `${getScaledFontSize(24)}px Verdana`;
  ctx.textAlign = "left";
  ctx.fillStyle = "white";
  const title = "Select Level";
  ctx.fillText(title, WIDTH / 2 - ctx.measureText(title).width / 2, HEIGHT / 8);

  // Draw level options
  const startY = HEIGHT / 4;
  const spacing = 60;

  for (let i = 1; i <= 5; i++) {
    ctx.fillStyle = i === selectedLevel ? "#fff429" : "white";
    const levelText = `Level ${i}`;
    ctx.fillText(
      levelText,
      WIDTH / 2 - ctx.measureText(levelText).width / 2,
      startY + i * spacing
    );
  }

  // Draw duck next to selected level
  const duckY = startY + selectedLevel * spacing + duckBobOffset - 10;
  ctx.drawImage(assets.images.duckFramesRight[1], WIDTH / 2 - 150, duckY);

  // Draw instructions
  ctx.font = `${getScaledFontSize(24)}px Verdana`;
  ctx.fillStyle = "white";
  const instructions =
    "Use UP/DOWN arrows and ENTER or TAB on the level to select";
  ctx.fillText(
    instructions,
    WIDTH / 2 - ctx.measureText(instructions).width / 2,
    HEIGHT - 80
  );
}

// Draw lose screen
function drawLoseScreen(duckBobOffset, selectedOption) {
  // Draw grass background
  const tileWidth = assets.images.dirtTile.width;
  const tileHeight = assets.images.dirtTile.height;

  for (let y = 0; y < HEIGHT; y += tileHeight) {
    for (let x = 0; x < WIDTH; x += tileWidth) {
      ctx.drawImage(assets.images.dirtTile, x, y);
    }
  }

  // Draw title
  ctx.font = `${getScaledFontSize(24)}px Verdana`;
  ctx.fillStyle = "#ff2929";
  const title = "You Lost!";
  ctx.textAlign = "left";
  ctx.fillText(title, WIDTH / 2 - ctx.measureText(title).width / 2, HEIGHT / 8);

  // Draw options
  const options = ["Play Again", "Exit to Home", "Change Level"];
  const startY = HEIGHT / 3;
  const spacing = 50;

  for (let i = 0; i < options.length; i++) {
    ctx.fillStyle = i === selectedOption ? "#fff429" : "white";
    ctx.fillText(
      options[i],
      WIDTH / 2 - ctx.measureText(options[i]).width / 2,
      startY + i * spacing
    );
  }

  // Draw duck next to selected option
  const duckY = startY + selectedOption * spacing + duckBobOffset - 10;
  ctx.drawImage(assets.images.duckFramesRight[1], WIDTH / 2 - 150, duckY);
}

// Draw menu screen
function drawMenuScreen(duckBobOffset, selectedOption) {
  // Draw grass background
  const tileWidth = assets.images.dirtTile.width;
  const tileHeight = assets.images.dirtTile.height;

  for (let y = 0; y < HEIGHT; y += tileHeight) {
    for (let x = 0; x < WIDTH; x += tileWidth) {
      ctx.drawImage(assets.images.dirtTile, x, y);
    }
  }

  // Draw title
  ctx.font = `${getScaledFontSize(24)}px Verdana`;
  ctx.textAlign = "left";
  ctx.fillStyle = "white";
  const title = "Paused";
  ctx.fillText(title, WIDTH / 2 - ctx.measureText(title).width / 2, HEIGHT / 8);

  // Draw options
  const options = ["Continue", "Re-Play", "Change Level", "Exit to Home"];
  const startY = HEIGHT / 3;
  const spacing = 60;

  for (let i = 0; i < options.length; i++) {
    ctx.fillStyle = i === selectedOption ? "#fff429" : "white";
    ctx.fillText(
      options[i],
      WIDTH / 2 - ctx.measureText(options[i]).width / 2,
      startY + i * spacing
    );
  }

  // Draw duck next to selected option
  const duckY = startY + selectedOption * spacing + duckBobOffset - 10;
  ctx.drawImage(assets.images.duckFramesRight[1], WIDTH / 2 - 150, duckY);
}

// Draw on-screen buttons
function drawButtons() {
  if (gameState !== STATE_PLAYING) return;

  if (gameState !== STATE_PLAYING) return;

  // Make buttons more visible on mobile
  const btnOpacity = isMobile ? 0.7 : 0.5;

  // Buttons get darker when pressed
  //ctx.globalAlpha = btnLeftPressed ? 0.9 : btnOpacity;
  //ctx.globalAlpha = btnRightPressed ? 0.9 : btnOpacity;
  //ctx.globalAlpha = btnJumpPressed ? 0.9 : btnOpacity;
  //ctx.globalAlpha = btnShootPressed ? 0.9 : btnOpacity;
  //ctx.fillStyle = "#c8c8c8";

  // Left button
  ctx.fillStyle = btnLeftPressed ? "#a0a0a0" : "#c8c8c8";
  roundRect(ctx, btnLeft.x, btnLeft.y, btnLeft.width, btnLeft.height, 16);

  ctx.fillStyle = "#505050";
  ctx.beginPath();
  ctx.moveTo(btnLeft.x + 16, btnLeft.y + btnLeft.height / 2);
  ctx.lineTo(btnLeft.x + btnLeft.width - 16, btnLeft.y + 16);
  ctx.lineTo(btnLeft.x + btnLeft.width - 16, btnLeft.y + btnLeft.height - 16);
  ctx.closePath();
  ctx.fill();

  // Right button
  ctx.fillStyle = btnRightPressed ? "#a0a0a0" : "#c8c8c8";
  roundRect(ctx, btnRight.x, btnRight.y, btnRight.width, btnRight.height, 16);

  ctx.fillStyle = "#505050";
  ctx.beginPath();
  ctx.moveTo(
    btnRight.x + btnRight.width - 16,
    btnRight.y + btnRight.height / 2
  );
  ctx.lineTo(btnRight.x + 16, btnRight.y + 16);
  ctx.lineTo(btnRight.x + 16, btnRight.y + btnRight.height - 16);
  ctx.closePath();
  ctx.fill();

  // Jump button
  ctx.fillStyle = btnJumpPressed ? "#a0a0a0" : "#c8c8c8";
  roundRect(ctx, btnJump.x, btnJump.y, btnJump.width, btnJump.height, 16);

  ctx.fillStyle = "#505050";
  ctx.beginPath();
  ctx.moveTo(btnJump.x + btnJump.width / 2, btnJump.y + 16);
  ctx.lineTo(btnJump.x + 16, btnJump.y + btnJump.height - 16);
  ctx.lineTo(btnJump.x + btnJump.width - 16, btnJump.y + btnJump.height - 16);
  ctx.closePath();
  ctx.fill();

  // Shoot button
  ctx.fillStyle = btnShootPressed ? "#a0a0a0" : "#c8c8c8";
  roundRect(ctx, btnShoot.x, btnShoot.y, btnShoot.width, btnShoot.height, 16);

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(
    btnShoot.x + btnShoot.width / 2,
    btnShoot.y + btnShoot.height / 2,
    BTN_SIZE / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = "#505050";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.globalAlpha = 1.0; // Reset alpha
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

// Track keyboard state
document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// Start the game
window.onload = init;
