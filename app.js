class ImagePreloader {
  constructor() {
    this.imageCache = new Map();
    this.preloadPromises = new Map();
    this.loadedCount = 0;
    this.totalCount = 0;
    this.onProgressCallback = null;
  }

  setProgressCallback(callback) {
    this.onProgressCallback = callback;
  }

  async preloadImage(src) {
    // Return cached image if already loaded
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src);
    }

    // Return existing promise if currently loading
    if (this.preloadPromises.has(src)) {
      return this.preloadPromises.get(src);
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.imageCache.set(src, img);
        this.preloadPromises.delete(src);
        this.loadedCount++;

        if (this.onProgressCallback) {
          this.onProgressCallback(this.loadedCount, this.totalCount);
        }

        resolve(img);
      };

      img.onerror = () => {
        this.preloadPromises.delete(src);
        console.warn(`Failed to preload image: ${src}`);
        this.loadedCount++;

        if (this.onProgressCallback) {
          this.onProgressCallback(this.loadedCount, this.totalCount);
        }

        // Don't reject - just resolve with null to prevent breaking the game
        resolve(null);
      };

      img.src = src;
    });

    this.preloadPromises.set(src, promise);
    return promise;
  }

  async preloadAllImages(imagePaths) {
    this.totalCount = imagePaths.length;
    this.loadedCount = 0;

    const promises = imagePaths.map((src) => this.preloadImage(src));
    await Promise.all(promises);

    console.log(`Preloaded ${this.imageCache.size} images`);
    return this.imageCache;
  }

  getImage(src) {
    return this.imageCache.get(src);
  }

  isImageLoaded(src) {
    return this.imageCache.has(src);
  }

  clear() {
    this.imageCache.clear();
    this.preloadPromises.clear();
    this.loadedCount = 0;
    this.totalCount = 0;
  }
}

class AudioManager {
  constructor() {
    this.audioCache = new Map();
    this.backgroundMusic = null;
    this.isBackgroundPlaying = false;
    this.isMuted = false;
    this.effectVolume = CONFIG.AUDIO.EFFECT_VOLUME;
    this.backgroundVolume = CONFIG.AUDIO.BACKGROUND_VOLUME;

    this.initializeAudio();
  }

  async initializeAudio() {
    try {
      // Preload audio files
      await this.preloadAudio(CONFIG.AUDIO.BACKGROUND_MUSIC, "background");
      await this.preloadAudio(CONFIG.AUDIO.BUTTON_HOVER, "hover");
      await this.preloadAudio(CONFIG.AUDIO.BUTTON_CLICK, "click");

      console.log("Audio system initialized successfully");
    } catch (error) {
      console.warn("Audio initialization failed:", error);
    }
  }

  async preloadAudio(src, key) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(src);
      audio.preload = "auto";

      audio.addEventListener("canplaythrough", () => {
        this.audioCache.set(key, audio);
        resolve(audio);
      });

      audio.addEventListener("error", (e) => {
        console.warn(`Failed to load audio: ${src}`, e);
        resolve(null); // Don't reject to prevent breaking the game
      });

      // Set initial volumes
      if (key === "background") {
        audio.volume = this.backgroundVolume;
        audio.loop = true;
        this.backgroundMusic = audio;
      } else {
        audio.volume = this.effectVolume;
      }
    });
  }

  playSound(key) {
    if (this.isMuted) return;

    const audio = this.audioCache.get(key);
    if (!audio) {
      console.warn(`Audio not found for key: ${key}`);
      return;
    }

    // Clone the audio for sound effects to allow overlapping playback
    if (key !== "background") {
      const clone = audio.cloneNode();
      clone.volume = this.effectVolume;
      clone.play().catch((e) => console.warn("Audio play failed:", e));
    } else {
      audio
        .play()
        .catch((e) => console.warn("Background music play failed:", e));
    }
  }

  startBackgroundMusic() {
    if (this.isBackgroundPlaying || this.isMuted || !this.backgroundMusic)
      return;

    this.backgroundMusic.currentTime = 0;
    this.backgroundMusic
      .play()
      .then(() => {
        this.isBackgroundPlaying = true;
        console.log("Background music started");
      })
      .catch((e) => {
        console.warn("Background music failed to start:", e);
      });
  }

  stopBackgroundMusic() {
    if (!this.backgroundMusic || !this.isBackgroundPlaying) return;

    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
    this.isBackgroundPlaying = false;
  }

  fadeBackgroundMusic(fadeIn = true) {
    if (!this.backgroundMusic) return;

    const startVolume = fadeIn ? 0 : this.backgroundVolume;
    const endVolume = fadeIn ? this.backgroundVolume : 0;
    const duration = CONFIG.AUDIO.FADE_DURATION;
    const steps = 50;
    const stepTime = duration / steps;
    const volumeStep = (endVolume - startVolume) / steps;

    let currentStep = 0;
    this.backgroundMusic.volume = startVolume;

    const fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = startVolume + volumeStep * currentStep;
      this.backgroundMusic.volume = Math.max(0, Math.min(1, newVolume));

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        if (!fadeIn) {
          this.stopBackgroundMusic();
        }
      }
    }, stepTime);
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
  }

  setEffectVolume(volume) {
    this.effectVolume = Math.max(0, Math.min(1, volume));
    // Update cached sound effects
    for (const [key, audio] of this.audioCache) {
      if (key !== "background") {
        audio.volume = this.effectVolume;
      }
    }
  }

  setBackgroundVolume(volume) {
    this.backgroundVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.backgroundVolume;
    }
  }

  destroy() {
    this.stopBackgroundMusic();
    this.audioCache.clear();
    this.backgroundMusic = null;
    this.isBackgroundPlaying = false;
  }
}

class ElementPool {
  constructor() {
    this.images = [];
    this.buttons = [];
    this.divs = [];
  }

  getImage() {
    const img = this.images.pop() || document.createElement("img");
    img.className = "scene-image";
    return img;
  }

  getButton() {
    const btn = this.buttons.pop() || document.createElement("button");
    btn.className = "";
    btn.textContent = "";
    btn.style.cssText = "";
    return btn;
  }

  getDiv() {
    const div = this.divs.pop() || document.createElement("div");
    div.className = "";
    div.innerHTML = "";
    div.style.cssText = "";
    return div;
  }

  returnImage(img) {
    img.style.cssText = "";
    img.className = "scene-image";
    img.src = "";
    this.images.push(img);
  }

  returnButton(btn) {
    btn.className = "";
    btn.textContent = "";
    btn.style.cssText = "";
    Object.keys(btn.dataset).forEach((key) => delete btn.dataset[key]);
    this.buttons.push(btn);
  }

  returnDiv(div) {
    div.className = "";
    div.innerHTML = "";
    div.style.cssText = "";
    this.divs.push(div);
  }
}

class ScenarioGenerator {
  constructor() {
    this.scenario = null;
    this.currentScene = null;
    this.gameContainer = document.getElementById(CONFIG.GAME_CONTAINER_ID);
    this.sceneCache = new Map();
    this.elementPool = new ElementPool();
    this.animations = new Map();
    this.audioManager = new AudioManager();
    this.imagePreloader = new ImagePreloader();
    this.isInitialized = false;
    this.isLoading = false;

    this.setupEventDelegation();
    this.initializeCSS();
    this.initializeGame();
  }

  async initializeGame() {
    // Wait for user interaction before starting audio (browsers require this)
    this.showInitialScreen();
  }

  showInitialScreen() {
    const initialScreen = this.elementPool.getDiv();
    initialScreen.className = "scene initial-screen";
    initialScreen.innerHTML = `
      <div class="text-content">
        <h2>Weird Demon Games Presents</h2>
        <p>A choose your own adventure game!</p>
      </div>
    `;

    const startButton = this.elementPool.getButton();
    startButton.className = "continue-button";
    startButton.textContent = "Start Game";
    startButton.addEventListener("click", () => this.startGame());

    initialScreen.appendChild(startButton);
    this.gameContainer.innerHTML = "";
    this.gameContainer.appendChild(initialScreen);
  }

  showLoadingScreen() {
    const loadingScreen = this.elementPool.getDiv();
    loadingScreen.className = "scene loading-screen";
    loadingScreen.innerHTML = `
      <div class="text-content">
        <h2>Loading Adventure...</h2>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <p class="progress-text" id="progress-text">0%</p>
        </div>
      </div>
    `;

    this.gameContainer.innerHTML = "";
    this.gameContainer.appendChild(loadingScreen);
  }

  updateLoadingProgress(loaded, total) {
    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");

    if (progressFill && progressText) {
      const percentage = Math.round((loaded / total) * 100);
      progressFill.style.width = `${percentage}%`;
      progressText.textContent = `${percentage}%`;
    }
  }

  async startGame() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoadingScreen();

    try {
      if (!this.isInitialized) {
        await this.loadStory();
        await this.preloadAllImages();
        this.audioManager.startBackgroundMusic();
        this.isInitialized = true;
      }

      this.isLoading = false;
      this.renderScene();
    } catch (error) {
      console.error("Failed to start game:", error);
      this.isLoading = false;
      this.showErrorScreen();
    }
  }

  showErrorScreen() {
    const errorScreen = this.elementPool.getDiv();
    errorScreen.className = "scene initial-screen";
    errorScreen.innerHTML = `
      <div class="text-content">
        <h2>Error Loading Game</h2>
        <p>There was a problem loading the game. Please try again.</p>
      </div>
    `;

    const retryButton = this.elementPool.getButton();
    retryButton.className = "continue-button";
    retryButton.textContent = "Retry";
    retryButton.addEventListener("click", () => this.startGame());

    errorScreen.appendChild(retryButton);
    this.gameContainer.innerHTML = "";
    this.gameContainer.appendChild(errorScreen);
  }

  async preloadAllImages() {
    if (!this.scenario) return;

    const imagePaths = new Set();

    // Collect all image paths from the scenario
    Object.values(this.scenario.scenes).forEach((scene) => {
      // Add background images
      if (scene.background) {
        imagePaths.add(scene.background);
      }

      // Add scene images
      if (scene.images) {
        scene.images.forEach((imageData) => {
          imagePaths.add(imageData.src);
        });
      }
    });

    // Set up progress callback
    this.imagePreloader.setProgressCallback((loaded, total) => {
      this.updateLoadingProgress(loaded, total);
    });

    // Preload all images
    const imagePathsArray = Array.from(imagePaths);
    await this.imagePreloader.preloadAllImages(imagePathsArray);

    console.log(`Successfully preloaded ${imagePathsArray.length} images`);
  }

  setupEventDelegation() {
    this.gameContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("continue-button")) {
        this.audioManager.playSound("click");
        this.handleContinue(e);
      } else if (e.target.classList.contains("choice-button")) {
        this.audioManager.playSound("click");
        this.handleChoice(e);
      }
    });

    // Add hover sound effects
    this.gameContainer.addEventListener(
      "mouseenter",
      (e) => {
        if (
          e.target.classList.contains("continue-button") ||
          e.target.classList.contains("choice-button")
        ) {
          this.audioManager.playSound("hover");
        }
      },
      true
    );
  }

  async loadStory() {
    try {
      const response = await fetch(CONFIG.STORY_CONFIG_PATH);
      this.scenario = await response.json();
      this.currentScene = this.scenario.currentScene;
    } catch (error) {
      console.error("Failed to load story:", error);
      // Create a default scenario if loading fails
      this.scenario = {
        currentScene: "default",
        scenes: {
          default: {
            content:
              "Welcome to the Scenario Generator! This is a default scene.",
            nextScene: null,
          },
        },
      };
      this.currentScene = "default";
    }
  }

  initializeCSS() {
    const root = document.documentElement;
    root.style.cssText += `
      --fade-duration: ${CONFIG.FADE_DURATION}ms;
      --slide-duration: ${CONFIG.SLIDE_DURATION}ms;
      --scale-duration: ${CONFIG.SCALE_DURATION}ms;
      --glow-duration: ${CONFIG.GLOW_DURATION}ms;
      --wiggle-duration: ${CONFIG.WIGGLE_DURATION}ms;
    `;
  }

  renderScene() {
    const scene = this.scenario.scenes[this.currentScene];
    if (!scene) {
      this.renderEndScene();
      return;
    }

    const cacheKey = `scene-${this.currentScene}`;
    if (this.sceneCache.has(cacheKey)) {
      this.gameContainer.innerHTML = "";
      this.gameContainer.appendChild(
        this.sceneCache.get(cacheKey).cloneNode(true)
      );
      this.reapplyAnimations(scene);
      return;
    }

    const sceneElement = this.createSceneElement(scene);
    this.sceneCache.set(cacheKey, sceneElement.cloneNode(true));
    this.gameContainer.innerHTML = "";
    this.gameContainer.appendChild(sceneElement);
  }

  createSceneElement(scene) {
    const sceneElement = this.elementPool.getDiv();

    sceneElement.className = "scene";
    sceneElement.id = `scene-${this.currentScene}`;

    if (scene.background) {
      sceneElement.style.cssText += `
        background-image: url('${scene.background}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      `;
    }

    if (scene.overlay) {
      sceneElement.appendChild(this.createOverlay(scene.overlay));
    }

    if (scene.images) {
      scene.images.forEach((imageData) => {
        sceneElement.appendChild(this.createImage(imageData));
      });
    }

    if (scene.content) {
      sceneElement.appendChild(this.createTextContent(scene));
    }

    if (scene.type === "choice" && scene.choices) {
      sceneElement.appendChild(this.createChoices(scene.choices));
    } else if (scene.nextScene !== undefined) {
      sceneElement.appendChild(this.createContinueButton(scene.nextScene));
    }

    return sceneElement;
  }

  createOverlay(overlayData) {
    const overlay = this.elementPool.getDiv();
    overlay.className = "scene-overlay";
    overlay.style.cssText = `
      background-color: ${overlayData.color};
      opacity: ${overlayData.opacity || 0.5};
      z-index: ${overlayData.zIndex || 50};
    `;
    return overlay;
  }

  createImage(imageData) {
    const img = this.elementPool.getImage();

    // Use preloaded image if available
    const preloadedImage = this.imagePreloader.getImage(imageData.src);
    if (preloadedImage) {
      img.src = preloadedImage.src;
    } else {
      img.src = imageData.src;
      console.warn(`Image not preloaded: ${imageData.src}`);
    }

    const scale = imageData.scale || 1.0;
    const rotation = imageData.rotation || 0;

    img.style.cssText = `
      --final-x: ${imageData.x}%;
      --final-y: ${imageData.y}%;
      --final-scale: ${scale};
      --final-rotation: ${rotation}deg;
      left: ${imageData.x}%;
      top: ${imageData.y}%;
      z-index: ${imageData.zIndex || 1};
      opacity: ${imageData.opacity || 1.0};
      transform: translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg);
    `;

    if (imageData.effect) {
      this.applyImageEffect(img, imageData.effect);
    }

    return img;
  }

  applyImageEffect(element, effect) {
    const effects = {
      fade_in: {
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
        options: { duration: CONFIG.FADE_DURATION, fill: "forwards" },
      },
      slide_to: {
        keyframes: [
          {
            transform:
              "translate(-50%, -50%) translateX(-100px) scale(var(--final-scale, 1)) rotate(var(--final-rotation, 0deg))",
            opacity: 0,
          },
          {
            transform:
              "translate(-50%, -50%) translateX(0) scale(var(--final-scale, 1)) rotate(var(--final-rotation, 0deg))",
            opacity: 1,
          },
        ],
        options: { duration: CONFIG.SLIDE_DURATION, fill: "forwards" },
      },
      scale_to: {
        keyframes: [
          {
            transform:
              "translate(-50%, -50%) scale(0) rotate(var(--final-rotation, 0deg))",
            opacity: 0,
          },
          {
            transform:
              "translate(-50%, -50%) scale(var(--final-scale, 1)) rotate(var(--final-rotation, 0deg))",
            opacity: 1,
          },
        ],
        options: { duration: CONFIG.SCALE_DURATION, fill: "forwards" },
      },
      glow: {
        keyframes: [
          { filter: "drop-shadow(0 0 5px rgba(255, 255, 255, 0.3))" },
          {
            filter:
              "drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 30px rgba(255, 255, 255, 0.6))",
          },
          { filter: "drop-shadow(0 0 5px rgba(255, 255, 255, 0.3))" },
        ],
        options: { duration: CONFIG.GLOW_DURATION, iterations: Infinity },
      },
      wiggle: {
        keyframes: [
          {
            transform:
              "translate(-50%, -50%) scale(var(--final-scale, 1)) rotate(var(--final-rotation, 0deg))",
          },
          {
            transform:
              "translate(-50%, -50%) scale(var(--final-scale, 1)) rotate(calc(var(--final-rotation, 0deg) - 3deg))",
          },
          {
            transform:
              "translate(-50%, -50%) scale(var(--final-scale, 1)) rotate(var(--final-rotation, 0deg))",
          },
          {
            transform:
              "translate(-50%, -50%) scale(var(--final-scale, 1)) rotate(calc(var(--final-rotation, 0deg) + 3deg))",
          },
          {
            transform:
              "translate(-50%, -50%) scale(var(--final-scale, 1)) rotate(var(--final-rotation, 0deg))",
          },
        ],
        options: { duration: CONFIG.WIGGLE_DURATION, iterations: Infinity },
      },
    };

    const effectData = effects[effect];
    if (effectData) {
      const animation = element.animate(
        effectData.keyframes,
        effectData.options
      );
      this.animations.set(element, animation);
    }
  }

  reapplyAnimations(scene) {
    if (!scene.images) return;

    const images = this.gameContainer.querySelectorAll(".scene-image");
    scene.images.forEach((imageData, index) => {
      if (imageData.effect && images[index]) {
        this.applyImageEffect(images[index], imageData.effect);
      }
    });
  }

  createTextContent(scene) {
    const textContent = this.elementPool.getDiv();
    textContent.className =
      scene.type === "choice" ? "text-content choice-layout" : "text-content";
    textContent.textContent = scene.content;
    return textContent;
  }

  createContinueButton(nextSceneId) {
    const continueBtn = this.elementPool.getButton();
    continueBtn.className = "continue-button";
    continueBtn.textContent = CONFIG.CONTINUE_BUTTON_TEXT;
    continueBtn.dataset.nextScene = nextSceneId;
    return continueBtn;
  }

  createChoices(choices) {
    const choicesContainer = this.elementPool.getDiv();
    choicesContainer.className = "choices-container";

    const fragment = document.createDocumentFragment();
    choices.forEach((choice, index) => {
      const choiceBtn = this.elementPool.getButton();
      choiceBtn.className = "choice-button";
      choiceBtn.textContent = choice.text;
      choiceBtn.dataset.nextScene = choice.nextScene;
      choiceBtn.dataset.choiceIndex = index;
      fragment.appendChild(choiceBtn);
    });

    choicesContainer.appendChild(fragment);
    return choicesContainer;
  }

  handleContinue(event) {
    const nextSceneId = event.target.dataset.nextScene;
    if (nextSceneId === "restart") {
      this.restart();
      return;
    }
    this.goToScene(nextSceneId === "null" ? null : nextSceneId);
  }

  handleChoice(event) {
    const nextSceneId = event.target.dataset.nextScene;
    this.goToScene(nextSceneId === "null" ? null : nextSceneId);
  }

  goToScene(sceneId) {
    if (sceneId === null) {
      this.renderEndScene();
      return;
    }
    this.currentScene = sceneId;
    this.renderScene();
  }

  renderEndScene() {
    const endScene = this.elementPool.getDiv();
    endScene.className = "scene";

    const endText = this.elementPool.getDiv();
    endText.className = "text-content";
    endText.textContent = "End of scenario. Thank you for playing!";

    const restartBtn = this.elementPool.getButton();
    restartBtn.className = "continue-button";
    restartBtn.textContent = "Restart";
    restartBtn.dataset.nextScene = "restart";

    endScene.appendChild(endText);
    endScene.appendChild(restartBtn);

    this.gameContainer.innerHTML = "";
    this.gameContainer.appendChild(endScene);
  }

  restart() {
    this.currentScene = this.scenario.currentScene;
    this.renderScene();
  }

  updateScenario(newScenarioData) {
    this.scenario = newScenarioData;
    this.currentScene = newScenarioData.currentScene;
    this.sceneCache.clear();
    this.renderScene();
  }

  getCurrentSceneData() {
    return this.scenario?.scenes[this.currentScene] || null;
  }

  getStoryMetadata() {
    return this.scenario?.metadata || null;
  }

  getAudioManager() {
    return this.audioManager;
  }

  getImagePreloader() {
    return this.imagePreloader;
  }

  destroy() {
    this.animations.forEach((animation) => animation.cancel());
    this.animations.clear();
    this.sceneCache.clear();
    this.imagePreloader.clear();
    this.gameContainer.innerHTML = "";
    this.audioManager.destroy();
    this.scenario = null;
    this.currentScene = null;
    this.isInitialized = false;
    this.isLoading = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.gameInstance = new ScenarioGenerator();
  window.addEventListener("beforeunload", () => window.gameInstance?.destroy());
});
