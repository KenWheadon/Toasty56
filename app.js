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

    this.setupEventDelegation();
    this.initializeCSS();
    this.loadStory();
  }

  setupEventDelegation() {
    this.gameContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("continue-button")) {
        this.handleContinue(e);
      } else if (e.target.classList.contains("choice-button")) {
        this.handleChoice(e);
      }
    });
  }

  async loadStory() {
    const response = await fetch(CONFIG.STORY_CONFIG_PATH);
    this.scenario = await response.json();
    this.currentScene = this.scenario.currentScene;
    this.renderScene();
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
    img.src = imageData.src;

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

  destroy() {
    this.animations.forEach((animation) => animation.cancel());
    this.animations.clear();
    this.sceneCache.clear();
    this.gameContainer.innerHTML = "";
    this.scenario = null;
    this.currentScene = null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.gameInstance = new ScenarioGenerator();
  window.addEventListener("beforeunload", () => window.gameInstance?.destroy());
});
