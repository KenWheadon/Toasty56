// UI management functionality

class UIManager {
  constructor() {
    this.modalElement = null;
    this.currentEffectEditMode = "start"; // 'start' or 'end'
  }

  /**
   * Setup UI event listeners
   */
  setupEventListeners() {
    // Make resetChoicePosition available globally for onclick handlers
    window.uiManager = this;

    // Header controls
    Utils.addEventListenerSafe("new-scenario", "click", () => {
      this.showNewScenarioModal();
    });
    Utils.addEventListenerSafe("load-project", "click", () => {
      if (window.editor) window.editor.loadProject();
    });
    Utils.addEventListenerSafe("save-project", "click", () => {
      if (window.editor) window.editor.saveProject();
    });
    Utils.addEventListenerSafe("file-input", "change", (e) => {
      if (window.editor) window.editor.handleFileLoad(e);
    });

    // Asset file input
    Utils.addEventListenerSafe("asset-file-input", "change", (e) => {
      if (window.assetManager) window.assetManager.handleAssetFileLoad(e);
    });

    // Scene controls
    Utils.addEventListenerSafe("add-scene", "click", () => {
      if (window.editor) window.editor.addScene();
    });
    Utils.addEventListenerSafe("duplicate-scene", "click", () => {
      if (window.editor) window.editor.duplicateScene();
    });
    Utils.addEventListenerSafe("delete-scene", "click", () => {
      if (window.editor) window.editor.deleteScene();
    });

    // Scene properties - Updated to handle scene name instead of scene ID
    Utils.addEventListenerSafe("scene-name", "input", () => {
      if (window.editor) window.editor.updateSceneProperties();
    });
    Utils.addEventListenerSafe("scene-type", "change", () => {
      if (window.editor) window.editor.updateSceneProperties();
    });
    Utils.addEventListenerSafe("scene-background", "change", () => {
      if (window.editor) window.editor.updateSceneProperties();
    });
    Utils.addEventListenerSafe("scene-content", "input", () => {
      if (window.editor) window.editor.updateSceneProperties();
    });
    Utils.addEventListenerSafe("next-scene", "change", () => {
      if (window.editor) window.editor.updateSceneProperties();
    });

    // UI Position controls - These will be setup dynamically in updateUIPositionControls
    // to avoid duplicate event listeners

    // Default position controls
    Utils.addEventListenerSafe("default-text-pos-x", "input", () => {
      this.updateDefaultPositions();
    });
    Utils.addEventListenerSafe("default-text-pos-y", "input", () => {
      this.updateDefaultPositions();
    });
    Utils.addEventListenerSafe("default-text-width", "input", () => {
      this.updateDefaultPositions();
    });
    Utils.addEventListenerSafe("default-buttons-pos-x", "input", () => {
      this.updateDefaultPositions();
    });
    Utils.addEventListenerSafe("default-buttons-pos-y", "input", () => {
      this.updateDefaultPositions();
    });
    Utils.addEventListenerSafe("default-buttons-width", "input", () => {
      this.updateDefaultPositions();
    });
    Utils.addEventListenerSafe("default-choice-pos-x", "input", () => {
      this.updateDefaultPositions();
    });
    Utils.addEventListenerSafe("default-choice-pos-y", "input", () => {
      this.updateDefaultPositions();
    });
    Utils.addEventListenerSafe("default-choice-width", "input", () => {
      this.updateDefaultPositions();
    });

    // Reset position controls
    Utils.addEventListenerSafe("reset-text-position", "click", () => {
      this.resetTextPosition();
    });
    Utils.addEventListenerSafe("reset-buttons-position", "click", () => {
      this.resetButtonsPosition();
    });

    // Overlay controls
    Utils.addEventListenerSafe("overlay-enabled", "change", () => {
      if (window.editor) window.editor.updateOverlay();
    });
    Utils.addEventListenerSafe("overlay-color", "input", () => {
      if (window.editor) window.editor.updateOverlay();
    });
    Utils.addEventListenerSafe("overlay-opacity", "input", () => {
      if (window.editor) window.editor.updateOverlay();
    });
    Utils.addEventListenerSafe("overlay-zindex", "input", () => {
      if (window.editor) window.editor.updateOverlay();
    });

    // Choice controls
    Utils.addEventListenerSafe("add-choice", "click", () => {
      if (window.editor) window.editor.addChoice();
    });

    // Effect drawer controls
    Utils.addEventListenerSafe("close-effect-drawer", "click", () => {
      this.closeEffectDrawer();
    });

    // UI Positioning drawer controls
    Utils.addEventListenerSafe("open-ui-positioning", "click", () => {
      this.openUIPositioningDrawer();
    });
    Utils.addEventListenerSafe("close-ui-positioning-drawer", "click", () => {
      this.closeUIPositioningDrawer();
    });

    // New Scenario modal controls
    Utils.addEventListenerSafe("new-scenario-close", "click", () => {
      this.closeNewScenarioModal();
    });
    Utils.addEventListenerSafe("confirm-new-scenario", "click", () => {
      this.confirmNewScenario();
    });
    Utils.addEventListenerSafe("cancel-new-scenario", "click", () => {
      this.closeNewScenarioModal();
    });

    // Modal controls
    Utils.addQueryListenerSafe(".close", "click", () => this.closeModal());

    window.addEventListener("click", (e) => {
      const warningModal = document.getElementById("warning-modal");
      const newScenarioModal = document.getElementById("new-scenario-modal");

      if (warningModal && e.target === warningModal) {
        this.closeModal();
      }
      if (newScenarioModal && e.target === newScenarioModal) {
        this.closeNewScenarioModal();
      }
    });
  }

  /**
   * Show new scenario confirmation modal
   */
  showNewScenarioModal() {
    const modal = document.getElementById("new-scenario-modal");
    if (modal) {
      modal.style.display = "block";
    }
  }

  /**
   * Close new scenario modal
   */
  closeNewScenarioModal() {
    const modal = document.getElementById("new-scenario-modal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  /**
   * Confirm new scenario creation
   */
  confirmNewScenario() {
    if (window.editor) {
      window.editor.createNewScenario();
    }
    this.closeNewScenarioModal();
  }

  /**
   * Update UI position sliders to reflect current scene positions
   * @param {Object} scene - Scene object
   */
  updateUIPositionSliders(scene) {
    const uiPositions = scene.uiPositions || {
      textContent: { x: 50, y: 85 },
      buttonsContainer: { x: 80, y: 85 },
    };

    // Update text position sliders
    const textPosX = document.getElementById("text-pos-x");
    const textPosY = document.getElementById("text-pos-y");
    const textPosXValue = document.getElementById("text-pos-x-value");
    const textPosYValue = document.getElementById("text-pos-y-value");

    if (textPosX) textPosX.value = uiPositions.textContent.x;
    if (textPosY) textPosY.value = uiPositions.textContent.y;
    if (textPosXValue)
      textPosXValue.textContent = uiPositions.textContent.x.toFixed(1) + "%";
    if (textPosYValue)
      textPosYValue.textContent = uiPositions.textContent.y.toFixed(1) + "%";

    // Update buttons position sliders
    const buttonsPosX = document.getElementById("buttons-pos-x");
    const buttonsPosY = document.getElementById("buttons-pos-y");
    const buttonsPosXValue = document.getElementById("buttons-pos-x-value");
    const buttonsPosYValue = document.getElementById("buttons-pos-y-value");

    if (buttonsPosX) buttonsPosX.value = uiPositions.buttonsContainer.x;
    if (buttonsPosY) buttonsPosY.value = uiPositions.buttonsContainer.y;
    if (buttonsPosXValue)
      buttonsPosXValue.textContent =
        uiPositions.buttonsContainer.x.toFixed(1) + "%";
    if (buttonsPosYValue)
      buttonsPosYValue.textContent =
        uiPositions.buttonsContainer.y.toFixed(1) + "%";
  }
  resetTextPosition() {
    if (!window.editor || !window.editor.currentScene || !window.projectManager)
      return;

    const defaults = window.projectManager.getDefaultUIPositions();
    const project = window.editor.projectManager.getProject();

    // Update the scene data
    window.sceneManager.updateUIElementPosition(
      project,
      window.editor.currentScene,
      "textContent",
      defaults.textContent.x,
      defaults.textContent.y,
      defaults.textContent.width
    );

    // Update the UI controls
    const textPosX = document.getElementById("text-pos-x");
    const textPosY = document.getElementById("text-pos-y");
    const textPosXValue = document.getElementById("text-pos-x-value");
    const textPosYValue = document.getElementById("text-pos-y-value");

    if (textPosX) textPosX.value = defaults.textContent.x;
    if (textPosY) textPosY.value = defaults.textContent.y;
    if (textPosXValue)
      textPosXValue.textContent = defaults.textContent.x.toFixed(1) + "%";
    if (textPosYValue)
      textPosYValue.textContent = defaults.textContent.y.toFixed(1) + "%";

    // Re-render the preview
    window.previewManager.renderPreview(project, window.editor.currentScene);

    // Show feedback
    this.showResetFeedback("Text position reset to default!");
  }

  /**
   * Reset buttons position to default
   */
  resetButtonsPosition() {
    if (!window.editor || !window.editor.currentScene || !window.projectManager)
      return;

    const defaults = window.projectManager.getDefaultUIPositions();
    const project = window.editor.projectManager.getProject();

    // Update the scene data
    window.sceneManager.updateUIElementPosition(
      project,
      window.editor.currentScene,
      "buttonsContainer",
      defaults.buttonsContainer.x,
      defaults.buttonsContainer.y,
      defaults.buttonsContainer.width
    );

    // Update the UI controls
    const buttonsPosX = document.getElementById("buttons-pos-x");
    const buttonsPosY = document.getElementById("buttons-pos-y");
    const buttonsPosXValue = document.getElementById("buttons-pos-x-value");
    const buttonsPosYValue = document.getElementById("buttons-pos-y-value");

    if (buttonsPosX) buttonsPosX.value = defaults.buttonsContainer.x;
    if (buttonsPosY) buttonsPosY.value = defaults.buttonsContainer.y;
    if (buttonsPosXValue)
      buttonsPosXValue.textContent =
        defaults.buttonsContainer.x.toFixed(1) + "%";
    if (buttonsPosYValue)
      buttonsPosYValue.textContent =
        defaults.buttonsContainer.y.toFixed(1) + "%";

    // Re-render the preview
    window.previewManager.renderPreview(project, window.editor.currentScene);

    // Show feedback
    this.showResetFeedback("Buttons position reset to default!");
  }

  /**
   * Update choice positions visibility and controls
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID
   */
  updateChoicePositions(project, sceneId) {
    const choicePositionsSection = document.getElementById(
      "choice-positions-section-drawer"
    );
    if (!choicePositionsSection) return;

    const scene = project.scenes[sceneId];
    const hasChoices =
      scene &&
      scene.type === "choice" &&
      scene.choices &&
      scene.choices.length > 0;

    if (hasChoices) {
      choicePositionsSection.style.display = "block";
      this.refreshChoicePositionsList(project, sceneId);
    } else {
      choicePositionsSection.style.display = "none";
    }
  }

  /**
   * Refresh choice positions list
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID
   */
  refreshChoicePositionsList(project, sceneId) {
    const choicePositionsList = document.getElementById(
      "choice-positions-list"
    );
    if (!choicePositionsList) return;

    const scene = project.scenes[sceneId];
    if (!scene || !scene.choices) {
      choicePositionsList.innerHTML = "";
      return;
    }

    choicePositionsList.innerHTML = "";

    scene.choices.forEach((choice, index) => {
      const position = choice.position || { x: 80, y: 85, width: 40 };

      const choiceItem = document.createElement("div");
      choiceItem.className = "choice-position-item";
      choiceItem.innerHTML = `
        <div class="choice-position-header">
          <h4>Choice ${index + 1}: ${choice.text || "Untitled"}</h4>
          <button class="btn btn-small btn-reset" onclick="if(window.uiManager) window.uiManager.resetChoicePosition(${index})">Reset</button>
        </div>
        <div class="choice-position-controls">
          <div class="slider-group">
            <label>X Position:</label>
            <div class="slider-container">
              <input type="range" id="choice-pos-x-${index}" min="0" max="100" step="0.1" value="${
        position.x
      }">
              <span class="slider-value" id="choice-pos-x-${index}-value">${position.x.toFixed(
        1
      )}%</span>
            </div>
          </div>
          <div class="slider-group">
            <label>Y Position:</label>
            <div class="slider-container">
              <input type="range" id="choice-pos-y-${index}" min="0" max="100" step="0.1" value="${
        position.y
      }">
              <span class="slider-value" id="choice-pos-y-${index}-value">${position.y.toFixed(
        1
      )}%</span>
            </div>
          </div>
          <div class="slider-group">
            <label>Width:</label>
            <div class="slider-container">
              <input type="range" id="choice-width-${index}" min="10" max="100" step="1" value="${
        position.width
      }">
              <span class="slider-value" id="choice-width-${index}-value">${
        position.width
      }%</span>
            </div>
          </div>
        </div>
      `;

      choicePositionsList.appendChild(choiceItem);
    });

    // Add event listeners for all choice position sliders
    this.setupChoicePositionEventListeners(sceneId, scene.choices.length);
  }

  /**
   * Setup event listeners for choice position sliders
   * @param {string} sceneId - Scene ID
   * @param {number} choiceCount - Number of choices
   */
  setupChoicePositionEventListeners(sceneId, choiceCount) {
    for (let i = 0; i < choiceCount; i++) {
      const controls = [
        {
          id: `choice-pos-x-${i}`,
          valueId: `choice-pos-x-${i}-value`,
          suffix: "%",
        },
        {
          id: `choice-pos-y-${i}`,
          valueId: `choice-pos-y-${i}-value`,
          suffix: "%",
        },
        {
          id: `choice-width-${i}`,
          valueId: `choice-width-${i}-value`,
          suffix: "%",
        },
      ];

      controls.forEach(({ id, valueId, suffix }) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(valueId);

        if (slider && valueDisplay) {
          // Remove existing listeners to prevent duplicates
          slider.removeEventListener("input", slider._choicePositionHandler);

          // Create new handler
          const handler = () => {
            const value = parseFloat(slider.value);
            valueDisplay.textContent = value.toFixed(1) + suffix;
            this.updateChoicePositionFromSlider(i, sceneId);
          };

          // Store reference and add listener
          slider._choicePositionHandler = handler;
          slider.addEventListener("input", handler);
        }
      });
    }
  }

  /**
   * Update choice position from slider input
   * @param {number} choiceIndex - Choice index
   * @param {string} sceneId - Scene ID
   */
  updateChoicePositionFromSlider(choiceIndex, sceneId) {
    if (!window.editor || !window.editor.currentScene) return;

    const project = window.editor.projectManager.getProject();

    // Get slider values
    const xSlider = document.getElementById(`choice-pos-x-${choiceIndex}`);
    const ySlider = document.getElementById(`choice-pos-y-${choiceIndex}`);
    const widthSlider = document.getElementById(`choice-width-${choiceIndex}`);

    if (xSlider && ySlider && widthSlider) {
      const x = parseFloat(xSlider.value);
      const y = parseFloat(ySlider.value);
      const width = parseFloat(widthSlider.value);

      // Update scene data
      window.sceneManager.updateChoicePosition(
        project,
        sceneId,
        choiceIndex,
        x,
        y,
        width
      );

      // Re-render preview
      window.previewManager.renderPreview(project, sceneId);
    }
  }

  /**
   * Update choice position sliders when choices are dragged
   * @param {string} sceneId - Scene ID
   * @param {number} choiceIndex - Choice index
   * @param {Object} position - New position {x, y, width}
   */
  updateChoicePositionSliders(sceneId, choiceIndex, position) {
    const xSlider = document.getElementById(`choice-pos-x-${choiceIndex}`);
    const ySlider = document.getElementById(`choice-pos-y-${choiceIndex}`);
    const widthSlider = document.getElementById(`choice-width-${choiceIndex}`);
    const xValue = document.getElementById(`choice-pos-x-${choiceIndex}-value`);
    const yValue = document.getElementById(`choice-pos-y-${choiceIndex}-value`);
    const widthValue = document.getElementById(
      `choice-width-${choiceIndex}-value`
    );

    if (xSlider && position.x !== undefined) {
      xSlider.value = position.x;
      if (xValue) xValue.textContent = position.x.toFixed(1) + "%";
    }
    if (ySlider && position.y !== undefined) {
      ySlider.value = position.y;
      if (yValue) yValue.textContent = position.y.toFixed(1) + "%";
    }
    if (widthSlider && position.width !== undefined) {
      widthSlider.value = position.width;
      if (widthValue) widthValue.textContent = position.width + "%";
    }
  }

  /**
   * Reset choice position to default
   * @param {number} choiceIndex - Choice index
   */
  resetChoicePosition(choiceIndex) {
    if (!window.editor || !window.editor.currentScene || !window.projectManager)
      return;

    const defaults = window.projectManager.getDefaultUIPositions();
    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];

    if (!scene.choices || !scene.choices[choiceIndex]) return;

    // Update the choice position
    const choice = scene.choices[choiceIndex];
    choice.position = {
      x: defaults.choiceButton.x,
      y:
        defaults.choiceButton.y +
        choiceIndex * window.sceneManager.CHOICE_VERTICAL_SPACING, // Use configurable spacing
      width: defaults.choiceButton.width,
    };

    // Update the sliders
    this.updateChoicePositionSliders(
      window.editor.currentScene,
      choiceIndex,
      choice.position
    );

    // Re-render preview
    window.previewManager.renderPreview(project, window.editor.currentScene);

    // Show feedback
    this.showResetFeedback(
      `Choice ${choiceIndex + 1} position reset to default!`
    );
  }
  showResetFeedback(message) {
    const feedback = document.createElement("div");
    feedback.className = "reset-feedback";
    feedback.textContent = message;
    feedback.style.position = "fixed";
    feedback.style.top = "20px";
    feedback.style.right = "20px";
    feedback.style.background = "#f39c12";
    feedback.style.color = "white";
    feedback.style.padding = "12px 16px";
    feedback.style.borderRadius = "4px";
    feedback.style.fontSize = "14px";
    feedback.style.fontWeight = "bold";
    feedback.style.zIndex = "2001";
    feedback.style.pointerEvents = "none";
    feedback.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.3)";

    document.body.appendChild(feedback);

    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 2000);
  }
  updateDefaultPositions() {
    if (!window.projectManager) return;

    // Update text content defaults
    const textPosX = parseFloat(
      document.getElementById("default-text-pos-x")?.value || 50
    );
    const textPosY = parseFloat(
      document.getElementById("default-text-pos-y")?.value || 85
    );
    const textWidth = parseFloat(
      document.getElementById("default-text-width")?.value || 80
    );
    window.projectManager.updateDefaultUIPosition(
      "textContent",
      textPosX,
      textPosY,
      textWidth
    );

    // Update button container defaults
    const buttonsPosX = parseFloat(
      document.getElementById("default-buttons-pos-x")?.value || 80
    );
    const buttonsPosY = parseFloat(
      document.getElementById("default-buttons-pos-y")?.value || 85
    );
    const buttonsWidth = parseFloat(
      document.getElementById("default-buttons-width")?.value || 40
    );
    window.projectManager.updateDefaultUIPosition(
      "buttonsContainer",
      buttonsPosX,
      buttonsPosY,
      buttonsWidth
    );

    // Update choice button defaults
    const choicePosX = parseFloat(
      document.getElementById("default-choice-pos-x")?.value || 80
    );
    const choicePosY = parseFloat(
      document.getElementById("default-choice-pos-y")?.value || 85
    );
    const choiceWidth = parseFloat(
      document.getElementById("default-choice-width")?.value || 40
    );
    window.projectManager.updateDefaultUIPosition(
      "choiceButton",
      choicePosX,
      choicePosY,
      choiceWidth
    );

    // Update slider value displays
    this.updateDefaultPositionSliderValues();
  }

  /**
   * Update default position slider values
   */
  updateDefaultPositionSliderValues() {
    const sliders = [
      {
        id: "default-text-pos-x",
        valueId: "default-text-pos-x-value",
        suffix: "%",
      },
      {
        id: "default-text-pos-y",
        valueId: "default-text-pos-y-value",
        suffix: "%",
      },
      {
        id: "default-text-width",
        valueId: "default-text-width-value",
        suffix: "%",
      },
      {
        id: "default-buttons-pos-x",
        valueId: "default-buttons-pos-x-value",
        suffix: "%",
      },
      {
        id: "default-buttons-pos-y",
        valueId: "default-buttons-pos-y-value",
        suffix: "%",
      },
      {
        id: "default-buttons-width",
        valueId: "default-buttons-width-value",
        suffix: "%",
      },
      {
        id: "default-choice-pos-x",
        valueId: "default-choice-pos-x-value",
        suffix: "%",
      },
      {
        id: "default-choice-pos-y",
        valueId: "default-choice-pos-y-value",
        suffix: "%",
      },
      {
        id: "default-choice-width",
        valueId: "default-choice-width-value",
        suffix: "%",
      },
    ];

    sliders.forEach(({ id, valueId, suffix }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(valueId);

      if (slider && valueDisplay) {
        const value = parseFloat(slider.value);
        valueDisplay.textContent = value.toFixed(1) + suffix;
      }
    });
  }

  /**
   * Setup default position controls
   */
  setupDefaultPositionControls() {
    if (!window.projectManager) return;

    const defaults = window.projectManager.getDefaultUIPositions();

    // Setup text content defaults
    const textPosX = document.getElementById("default-text-pos-x");
    const textPosY = document.getElementById("default-text-pos-y");
    const textWidth = document.getElementById("default-text-width");

    if (textPosX) textPosX.value = defaults.textContent.x;
    if (textPosY) textPosY.value = defaults.textContent.y;
    if (textWidth) textWidth.value = defaults.textContent.width;

    // Setup button container defaults
    const buttonsPosX = document.getElementById("default-buttons-pos-x");
    const buttonsPosY = document.getElementById("default-buttons-pos-y");
    const buttonsWidth = document.getElementById("default-buttons-width");

    if (buttonsPosX) buttonsPosX.value = defaults.buttonsContainer.x;
    if (buttonsPosY) buttonsPosY.value = defaults.buttonsContainer.y;
    if (buttonsWidth) buttonsWidth.value = defaults.buttonsContainer.width;

    // Setup choice button defaults
    const choicePosX = document.getElementById("default-choice-pos-x");
    const choicePosY = document.getElementById("default-choice-pos-y");
    const choiceWidth = document.getElementById("default-choice-width");

    if (choicePosX) choicePosX.value = defaults.choiceButton.x;
    if (choicePosY) choicePosY.value = defaults.choiceButton.y;
    if (choiceWidth) choiceWidth.value = defaults.choiceButton.width;

    // Update slider value displays
    this.updateDefaultPositionSliderValues();

    // Add event listeners for sliders
    const sliders = [
      {
        id: "default-text-pos-x",
        valueId: "default-text-pos-x-value",
        suffix: "%",
      },
      {
        id: "default-text-pos-y",
        valueId: "default-text-pos-y-value",
        suffix: "%",
      },
      {
        id: "default-text-width",
        valueId: "default-text-width-value",
        suffix: "%",
      },
      {
        id: "default-buttons-pos-x",
        valueId: "default-buttons-pos-x-value",
        suffix: "%",
      },
      {
        id: "default-buttons-pos-y",
        valueId: "default-buttons-pos-y-value",
        suffix: "%",
      },
      {
        id: "default-buttons-width",
        valueId: "default-buttons-width-value",
        suffix: "%",
      },
      {
        id: "default-choice-pos-x",
        valueId: "default-choice-pos-x-value",
        suffix: "%",
      },
      {
        id: "default-choice-pos-y",
        valueId: "default-choice-pos-y-value",
        suffix: "%",
      },
      {
        id: "default-choice-width",
        valueId: "default-choice-width-value",
        suffix: "%",
      },
    ];

    sliders.forEach(({ id, valueId, suffix }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(valueId);

      if (slider && valueDisplay) {
        // Remove existing listeners to prevent duplicates
        slider.removeEventListener("input", slider._defaultPositionHandler);

        // Create new handler
        const handler = () => {
          const value = parseFloat(slider.value);
          valueDisplay.textContent = value.toFixed(1) + suffix;
          this.updateDefaultPositions();
        };

        // Store reference and add listener
        slider._defaultPositionHandler = handler;
        slider.addEventListener("input", handler);
      }
    });
  }

  /**
   * Get display name for scene in dropdowns
   * @param {string} sceneId - Scene ID (storage key)
   * @param {Object} scene - Scene object
   * @returns {string} Display name
   */
  getSceneDisplayName(sceneId, scene) {
    const sceneName = scene.name || "Untitled Scene";
    return `${sceneId}: ${sceneName}`;
  }

  /**
   * Update scene dropdowns
   * @param {Array} backgrounds - Background assets
   * @param {Object} project - Project object
   */
  updateSceneDropdowns(backgrounds, project) {
    // Update background dropdown
    const bgSelect = document.getElementById("scene-background");
    if (bgSelect) {
      // Preserve current selection
      const currentBgValue = bgSelect.value;

      bgSelect.innerHTML = '<option value="">No Background</option>';

      // Sort backgrounds alphabetically for dropdown
      const sortedBackgrounds = Utils.sortAssets(backgrounds);
      sortedBackgrounds.forEach((bg) => {
        const option = document.createElement("option");
        option.value = bg;
        option.textContent = Utils.getCleanFilename(bg, "background");
        bgSelect.appendChild(option);
      });

      // Restore selection
      bgSelect.value = currentBgValue;
    }

    // Update next scene dropdown with ordered scenes and scene names
    const nextSceneSelect = document.getElementById("next-scene");
    if (nextSceneSelect) {
      // Preserve current selection
      const currentNextValue = nextSceneSelect.value;

      nextSceneSelect.innerHTML =
        '<option value="">Select Scene</option><option value="null">End</option>';

      const orderedSceneKeys = Utils.getOrderedSceneKeys(project.scenes);
      orderedSceneKeys.forEach((sceneId) => {
        const scene = project.scenes[sceneId];
        const option = document.createElement("option");
        option.value = sceneId;
        option.textContent = this.getSceneDisplayName(sceneId, scene);
        nextSceneSelect.appendChild(option);
      });

      // Restore selection
      nextSceneSelect.value = currentNextValue;
    }

    // Update choice dropdowns
    this.updateChoiceDropdowns(project);
  }

  /**
   * Update choice dropdowns
   * @param {Object} project - Project object
   */
  updateChoiceDropdowns(project) {
    const choiceSelects = document.querySelectorAll(".choice-next-scene");
    const orderedSceneKeys = Utils.getOrderedSceneKeys(project.scenes);

    choiceSelects.forEach((select) => {
      // Preserve current selection
      const currentValue = select.value;

      select.innerHTML =
        '<option value="">Select Scene</option><option value="null">End</option>';

      orderedSceneKeys.forEach((sceneId) => {
        const scene = project.scenes[sceneId];
        const option = document.createElement("option");
        option.value = sceneId;
        option.textContent = this.getSceneDisplayName(sceneId, scene);
        select.appendChild(option);
      });

      // Restore selection
      select.value = currentValue;
    });
  }

  /**
   * Update scene properties display
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID
   */
  updateScenePropertiesDisplay(project, sceneId) {
    if (!sceneId || !project.scenes[sceneId]) return;

    const scene = project.scenes[sceneId];

    // Update the combined scene ID/name field
    const sceneIdDisplay = document.getElementById("scene-id-display");
    if (sceneIdDisplay) sceneIdDisplay.textContent = `${sceneId}:`;

    const sceneNameInput = document.getElementById("scene-name");
    if (sceneNameInput) sceneNameInput.value = scene.name || "New Scene";

    const sceneTypeSelect = document.getElementById("scene-type");
    if (sceneTypeSelect) sceneTypeSelect.value = scene.type || "choice";

    const sceneBackgroundSelect = document.getElementById("scene-background");
    if (sceneBackgroundSelect)
      sceneBackgroundSelect.value = scene.background || "";

    const sceneContentTextarea = document.getElementById("scene-content");
    if (sceneContentTextarea) sceneContentTextarea.value = scene.content || "";

    const nextSceneSelect = document.getElementById("next-scene");
    if (nextSceneSelect) nextSceneSelect.value = scene.nextScene || "";

    // Update UI positions
    this.updateUIPositionControls(scene);

    // Update default positions
    this.setupDefaultPositionControls();

    // Update overlay
    if (scene.overlay) {
      const overlayEnabled = document.getElementById("overlay-enabled");
      if (overlayEnabled) overlayEnabled.checked = true;

      const overlayColor = document.getElementById("overlay-color");
      if (overlayColor) overlayColor.value = scene.overlay.color || "#000000";

      const overlayOpacity = document.getElementById("overlay-opacity");
      if (overlayOpacity) overlayOpacity.value = scene.overlay.opacity || 0.5;

      const overlayZindex = document.getElementById("overlay-zindex");
      if (overlayZindex) overlayZindex.value = scene.overlay.zIndex || 45;

      const overlayOpacityValue = document.getElementById(
        "overlay-opacity-value"
      );
      if (overlayOpacityValue)
        overlayOpacityValue.textContent = scene.overlay.opacity || 0.5;

      const overlayZindexValue = document.getElementById(
        "overlay-zindex-value"
      );
      if (overlayZindexValue)
        overlayZindexValue.textContent = scene.overlay.zIndex || 45;
    } else {
      const overlayEnabled = document.getElementById("overlay-enabled");
      if (overlayEnabled) overlayEnabled.checked = false;
    }

    this.updateOverlayControls();
    this.updateChoicesVisibility();
    this.refreshChoicesList(project, sceneId);
    this.updateChoicePositions(project, sceneId);
  }

  /**
   * Update UI position controls
   * @param {Object} scene - Scene object
   */
  updateUIPositionControls(scene) {
    const uiPositions = scene.uiPositions || {
      textContent: { x: 50, y: 85 },
      buttonsContainer: { x: 80, y: 85 },
    };

    // Update text position controls
    const textPosX = document.getElementById("text-pos-x");
    const textPosY = document.getElementById("text-pos-y");
    const textPosXValue = document.getElementById("text-pos-x-value");
    const textPosYValue = document.getElementById("text-pos-y-value");

    if (textPosX) textPosX.value = uiPositions.textContent.x;
    if (textPosY) textPosY.value = uiPositions.textContent.y;
    if (textPosXValue)
      textPosXValue.textContent = uiPositions.textContent.x.toFixed(1) + "%";
    if (textPosYValue)
      textPosYValue.textContent = uiPositions.textContent.y.toFixed(1) + "%";

    // Update buttons position controls
    const buttonsPosX = document.getElementById("buttons-pos-x");
    const buttonsPosY = document.getElementById("buttons-pos-y");
    const buttonsPosXValue = document.getElementById("buttons-pos-x-value");
    const buttonsPosYValue = document.getElementById("buttons-pos-y-value");

    if (buttonsPosX) buttonsPosX.value = uiPositions.buttonsContainer.x;
    if (buttonsPosY) buttonsPosY.value = uiPositions.buttonsContainer.y;
    if (buttonsPosXValue)
      buttonsPosXValue.textContent =
        uiPositions.buttonsContainer.x.toFixed(1) + "%";
    if (buttonsPosYValue)
      buttonsPosYValue.textContent =
        uiPositions.buttonsContainer.y.toFixed(1) + "%";

    // Add event listeners for sliders
    const sliders = [
      { id: "text-pos-x", valueId: "text-pos-x-value", suffix: "%" },
      { id: "text-pos-y", valueId: "text-pos-y-value", suffix: "%" },
      { id: "buttons-pos-x", valueId: "buttons-pos-x-value", suffix: "%" },
      { id: "buttons-pos-y", valueId: "buttons-pos-y-value", suffix: "%" },
    ];

    sliders.forEach(({ id, valueId, suffix }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(valueId);

      if (slider && valueDisplay) {
        // Remove existing listeners to prevent duplicates
        slider.removeEventListener("input", slider._uiPositionHandler);

        // Create new handler
        const handler = () => {
          const value = parseFloat(slider.value);
          valueDisplay.textContent = value.toFixed(1) + suffix;
          if (window.editor) window.editor.updateUIPositions();
        };

        // Store reference and add listener
        slider._uiPositionHandler = handler;
        slider.addEventListener("input", handler);
      }
    });
  }

  /**
   * Update choices visibility based on scene type
   */
  updateChoicesVisibility() {
    const sceneTypeSelect = document.getElementById("scene-type");
    const sceneType = sceneTypeSelect ? sceneTypeSelect.value : "choice";

    const choicesSection = document.getElementById("choices-section");
    const nextSceneGroup = document.getElementById("next-scene-group");

    if (sceneType === "choice") {
      if (choicesSection) choicesSection.style.display = "block";
      if (nextSceneGroup) nextSceneGroup.style.display = "none";
    } else {
      if (choicesSection) choicesSection.style.display = "none";
      if (nextSceneGroup) nextSceneGroup.style.display = "block";
    }
  }

  /**
   * Update overlay controls visibility
   */
  updateOverlayControls() {
    const overlayEnabled = document.getElementById("overlay-enabled");
    const enabled = overlayEnabled ? overlayEnabled.checked : false;

    const controls = document.getElementById("overlay-controls");
    if (controls) {
      controls.classList.toggle("visible", enabled);
    }
  }

  /**
   * Refresh choices list
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID
   */
  refreshChoicesList(project, sceneId) {
    if (!sceneId || !project.scenes[sceneId]) return;

    const scene = project.scenes[sceneId];
    const choicesList = document.getElementById("choices-list");
    if (!choicesList) return;

    choicesList.innerHTML = "";

    if (scene.choices) {
      scene.choices.forEach((choice, index) => {
        const choiceItem = document.createElement("div");
        choiceItem.className = "choice-item";
        choiceItem.innerHTML = `
          <button class="remove-choice" onclick="if(window.editor) window.editor.removeChoice(${index})">&times;</button>
        <select class="choice-next-scene" onchange="if(window.editor) window.editor.updateChoice(${index}, 'nextScene', this.value)">
            <option value="">Select Scene</option>
            <option value="null">End</option>
          </select>
          <input type="text" placeholder="Choice text" value="${choice.text}" 
                 onchange="if(window.editor) window.editor.updateChoice(${index}, 'text', this.value)">
        `;
        choicesList.appendChild(choiceItem);
      });

      // Update choice dropdowns with all available scenes
      this.updateChoiceDropdowns(project);

      // Set the saved values for each choice dropdown
      const choiceSelects = document.querySelectorAll(".choice-next-scene");
      scene.choices.forEach((choice, index) => {
        if (choiceSelects[index]) {
          choiceSelects[index].value = choice.nextScene || "";
        }
      });
    }

    // Update choice positions UI
    this.updateChoicePositions(project, sceneId);
  }

  /**
   * Update scene objects list
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID
   * @param {number} selectedObjectIndex - Selected object index
   */
  updateSceneObjectsList(project, sceneId, selectedObjectIndex = null) {
    const sceneObjectsList = document.getElementById("scene-objects-list");
    if (!sceneObjectsList) {
      console.warn("Scene objects list element not found");
      return;
    }

    sceneObjectsList.innerHTML = "";

    if (!sceneId) {
      sceneObjectsList.innerHTML =
        '<div class="scene-objects-empty">No scene selected</div>';
      return;
    }

    const scene = project.scenes[sceneId];
    if (!scene.images || scene.images.length === 0) {
      sceneObjectsList.innerHTML =
        '<div class="scene-objects-empty">No objects in scene</div>';
      return;
    }

    scene.images.forEach((imageData, index) => {
      const objectItem = document.createElement("div");
      objectItem.className = "scene-object-item";
      if (selectedObjectIndex === index) {
        objectItem.classList.add("selected");
      }
      if (imageData.locked) {
        objectItem.classList.add("locked");
      }

      const cleanName = Utils.getCleanFilename(imageData.src, "object");
      const lockIcon = imageData.locked ? "🔒" : "🔓";
      const lockTitle = imageData.locked ? "Unlock object" : "Lock object";

      objectItem.innerHTML = `
        <div class="scene-object-info">
          <div class="scene-object-name">${cleanName}</div>
          <div class="scene-object-details">
            x: ${imageData.x.toFixed(1)}%, y: ${imageData.y.toFixed(1)}%, 
            scale: ${imageData.scale.toFixed(1)}, z: ${imageData.zIndex}
          </div>
        </div>
        <div class="scene-object-actions">
          <button class="lock-btn" onclick="if(window.editor) window.editor.toggleObjectLock(${index})" title="${lockTitle}">${lockIcon}</button>
          <button class="select-btn" onclick="if(window.editor) window.editor.selectObjectFromList(${index})">Select</button>
          <button class="delete-btn" onclick="if(window.editor) window.editor.removeObjectFromList(${index})">Delete</button>
        </div>
      `;

      sceneObjectsList.appendChild(objectItem);
    });
  }

  /**
   * Update object properties panel
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID
   * @param {number} selectedObjectIndex - Selected object index
   */
  updateObjectProperties(project, sceneId, selectedObjectIndex) {
    const propsContainer = document.getElementById("object-properties");
    if (!propsContainer) return;

    if (selectedObjectIndex === null || !sceneId || !project.scenes[sceneId]) {
      propsContainer.innerHTML = "";
      return;
    }

    const scene = project.scenes[sceneId];
    const obj = scene.images[selectedObjectIndex];
    if (!obj) {
      propsContainer.innerHTML = "";
      return;
    }

    propsContainer.innerHTML = `
      <div class="object-properties-form">
        <div class="slider-group">
          <label>X Position:</label>
          <div class="slider-container">
            <input type="range" id="obj-x" min="0" max="100" step="0.1" value="${
              obj.x
            }">
            <span class="slider-value" id="obj-x-value">${obj.x.toFixed(
              1
            )}</span>
          </div>
        </div>
        <div class="slider-group">
          <label>Y Position:</label>
          <div class="slider-container">
            <input type="range" id="obj-y" min="0" max="100" step="0.1" value="${
              obj.y
            }">
            <span class="slider-value" id="obj-y-value">${obj.y.toFixed(
              1
            )}</span>
          </div>
        </div>
        <div class="slider-group">
          <label>Scale:</label>
          <div class="slider-container">
            <input type="range" id="obj-scale" min="0.1" max="5" step="0.1" value="${
              obj.scale
            }">
            <span class="slider-value" id="obj-scale-value">${obj.scale.toFixed(
              1
            )}</span>
          </div>
        </div>
        <div class="slider-group">
          <label>Rotation:</label>
          <div class="slider-container">
            <input type="range" id="obj-rotation" min="-360" max="360" step="1" value="${
              obj.rotation
            }">
            <span class="slider-value" id="obj-rotation-value">${
              obj.rotation
            }°</span>
          </div>
        </div>
        <div class="slider-group">
          <label>Z-Index:</label>
          <div class="slider-container">
            <input type="range" id="obj-zindex" min="1" max="100" step="1" value="${
              obj.zIndex
            }">
            <span class="slider-value" id="obj-zindex-value">${
              obj.zIndex
            }</span>
          </div>
        </div>
        <div class="slider-group">
          <label>Opacity:</label>
          <div class="slider-container">
            <input type="range" id="obj-opacity" min="0" max="1" step="0.1" value="${
              obj.opacity
            }">
            <span class="slider-value" id="obj-opacity-value">${obj.opacity.toFixed(
              1
            )}</span>
          </div>
        </div>
        <div class="form-group effect-group">
          <label>Effect:</label>
          <div class="effect-controls-inline">
            <select id="obj-effect">
              <option value="">No Effect</option>
              <option value="fade_in">Fade In</option>
              <option value="fade_out">Fade Out</option>
              <option value="slide_to">Slide To</option>
              <option value="scale_to">Scale To</option>
              <option value="glow">Glow</option>
              <option value="wiggle">Wiggle</option>
            </select>
            <button class="btn btn-danger btn-small" onclick="if(window.editor) window.editor.removeSelectedObject()">Remove Object</button>
          </div>
        </div>
      </div>
    `;

    // Set effect value
    const effectSelect = document.getElementById("obj-effect");
    if (effectSelect) effectSelect.value = obj.effect || "";

    // Add event listeners for sliders
    const sliders = [
      { id: "obj-x", valueId: "obj-x-value", suffix: "" },
      { id: "obj-y", valueId: "obj-y-value", suffix: "" },
      { id: "obj-scale", valueId: "obj-scale-value", suffix: "" },
      { id: "obj-rotation", valueId: "obj-rotation-value", suffix: "°" },
      { id: "obj-zindex", valueId: "obj-zindex-value", suffix: "" },
      { id: "obj-opacity", valueId: "obj-opacity-value", suffix: "" },
    ];

    sliders.forEach(({ id, valueId, suffix }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(valueId);

      if (slider && valueDisplay) {
        slider.addEventListener("input", () => {
          const value = parseFloat(slider.value);
          valueDisplay.textContent = value.toFixed(1) + suffix;
          if (window.editor) window.editor.updateSelectedObject();
        });
      }
    });

    if (effectSelect) {
      effectSelect.addEventListener("change", () => {
        if (window.editor) {
          window.editor.updateSelectedObject();
          // Auto-open/close drawer based on effect type
          this.handleEffectChange(effectSelect.value);
        }
      });
    }
  }

  /**
   * Handle effect change and auto-open/close drawer
   * @param {string} effectType - Selected effect type
   */
  handleEffectChange(effectType) {
    if (effectType === "scale_to" || effectType === "slide_to") {
      // Auto-open drawer for effects with settings
      this.autoOpenEffectDrawer();
    } else {
      // Auto-close drawer for effects without settings
      this.closeEffectDrawer();
    }
  }

  /**
   * Auto-open effect controls drawer (only if object is selected)
   */
  autoOpenEffectDrawer() {
    const selectedObject = window.previewManager
      ? window.previewManager.getSelectedObject()
      : null;
    if (
      selectedObject === null ||
      !window.editor ||
      !window.editor.currentScene
    ) {
      return;
    }

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const obj = scene.images[selectedObject];

    if (!obj) return;

    const drawer = document.getElementById("effect-controls-drawer");
    const drawerContent = document.getElementById("effect-drawer-content");

    if (!drawer || !drawerContent) return;

    // Reset edit mode to start when opening drawer
    this.currentEffectEditMode = "start";

    // Update drawer content with current object's effect settings
    this.updateEffectDrawerContent(obj);

    // Show the drawer
    drawer.classList.add("open");
  }

  /**
   * Open UI positioning drawer
   */
  openUIPositioningDrawer() {
    const drawer = document.getElementById("ui-positioning-drawer");
    if (drawer) {
      drawer.classList.add("open");
    }
  }

  /**
   * Close UI positioning drawer
   */
  closeUIPositioningDrawer() {
    const drawer = document.getElementById("ui-positioning-drawer");
    if (drawer) {
      drawer.classList.remove("open");
    }
  }

  /**
   * Close effect controls drawer
   */
  closeEffectDrawer() {
    const drawer = document.getElementById("effect-controls-drawer");
    if (drawer) {
      drawer.classList.remove("open");
    }
    // Reset edit mode when closing
    this.currentEffectEditMode = "start";
  }

  /**
   * Toggle effect edit mode
   * @param {string} mode - 'start' or 'end'
   */
  toggleEffectEditMode(mode) {
    this.currentEffectEditMode = mode;

    // Update toggle button states and UI
    this.updateToggleButtonStates();

    // Update the object visual to show the current edit mode
    if (window.previewManager) {
      window.previewManager.updateObjectVisualForEffectMode(mode);
    }
  }

  /**
   * Update toggle button states and state indicator
   */
  updateToggleButtonStates() {
    // Update toggle button states
    const startBtn = document.getElementById("effect-toggle-start");
    const endBtn = document.getElementById("effect-toggle-end");

    if (startBtn && endBtn) {
      startBtn.classList.toggle(
        "active",
        this.currentEffectEditMode === "start"
      );
      endBtn.classList.toggle("active", this.currentEffectEditMode === "end");
    }

    // Update state indicator
    const stateLabel = document.getElementById("effect-state-label");
    const stateDesc = document.getElementById("effect-state-description");

    if (stateLabel && stateDesc) {
      if (this.currentEffectEditMode === "start") {
        stateLabel.textContent = "Editing Start Position";
        stateDesc.textContent = "Adjusting where the effect begins";
      } else {
        stateLabel.textContent = "Editing End Position";
        stateDesc.textContent = "Adjusting where the effect finishes";
      }
    }
  }

  /**
   * Update effect drawer content based on selected object
   * @param {Object} obj - Object data
   */
  updateEffectDrawerContent(obj) {
    const drawerContent = document.getElementById("effect-drawer-content");
    if (!drawerContent) return;

    const effectType = obj.effect || "";

    if (effectType === "scale_to") {
      drawerContent.innerHTML = `
        <div class="effect-state-indicator">
          <div class="state-label" id="effect-state-label">Editing Start Position</div>
          <div class="state-description" id="effect-state-description">Adjusting where the effect begins</div>
        </div>
        
        <div class="effect-toggle-controls">
          <button class="effect-toggle-btn active" id="effect-toggle-start" onclick="if(window.uiManager) window.uiManager.toggleEffectEditMode('start')">Start</button>
          <button class="effect-toggle-btn" id="effect-toggle-end" onclick="if(window.uiManager) window.uiManager.toggleEffectEditMode('end')">End</button>
        </div>

        <div class="effect-controls-section">
          <h5>Scale Effect Settings</h5>
          <div class="slider-group">
            <label>Start Scale:</label>
            <div class="slider-container">
              <input type="range" id="drawer-scale-start" min="0.1" max="5" step="0.1" value="${
                obj.scaleStart !== undefined ? obj.scaleStart : obj.scale
              }">
              <span class="slider-value" id="drawer-scale-start-value">${(obj.scaleStart !==
              undefined
                ? obj.scaleStart
                : obj.scale
              ).toFixed(1)}</span>
            </div>
          </div>
          <div class="slider-group">
            <label>End Scale:</label>
            <div class="slider-container">
              <input type="range" id="drawer-scale-end" min="0.1" max="5" step="0.1" value="${
                obj.scaleEnd !== undefined ? obj.scaleEnd : obj.scale
              }">
              <span class="slider-value" id="drawer-scale-end-value">${(obj.scaleEnd !==
              undefined
                ? obj.scaleEnd
                : obj.scale
              ).toFixed(1)}</span>
            </div>
          </div>
        </div>
      `;

      // Add event listeners for scale controls
      const scaleStartSlider = document.getElementById("drawer-scale-start");
      const scaleStartValue = document.getElementById(
        "drawer-scale-start-value"
      );
      const scaleEndSlider = document.getElementById("drawer-scale-end");
      const scaleEndValue = document.getElementById("drawer-scale-end-value");

      if (scaleStartSlider && scaleStartValue) {
        scaleStartSlider.addEventListener("input", () => {
          const value = parseFloat(scaleStartSlider.value);
          scaleStartValue.textContent = value.toFixed(1);
          if (window.editor) window.editor.updateSelectedObjectFromDrawer();
        });
      }

      if (scaleEndSlider && scaleEndValue) {
        scaleEndSlider.addEventListener("input", () => {
          const value = parseFloat(scaleEndSlider.value);
          scaleEndValue.textContent = value.toFixed(1);
          if (window.editor) window.editor.updateSelectedObjectFromDrawer();
        });
      }
    } else if (effectType === "slide_to") {
      drawerContent.innerHTML = `
        <div class="effect-state-indicator">
          <div class="state-label" id="effect-state-label">Editing Start Position</div>
          <div class="state-description" id="effect-state-description">Adjusting where the effect begins</div>
        </div>
        
        <div class="effect-toggle-controls">
          <button class="effect-toggle-btn active" id="effect-toggle-start" onclick="if(window.uiManager) window.uiManager.toggleEffectEditMode('start')">Start</button>
          <button class="effect-toggle-btn" id="effect-toggle-end" onclick="if(window.uiManager) window.uiManager.toggleEffectEditMode('end')">End</button>
        </div>

        <div class="effect-controls-section">
          <h5>Move Effect Settings</h5>
          <div class="slider-group">
            <label>Start X Position:</label>
            <div class="slider-container">
              <input type="range" id="drawer-move-start-x" min="0" max="100" step="0.1" value="${
                obj.moveStartX !== undefined ? obj.moveStartX : obj.x
              }">
              <span class="slider-value" id="drawer-move-start-x-value">${(obj.moveStartX !==
              undefined
                ? obj.moveStartX
                : obj.x
              ).toFixed(1)}</span>
            </div>
          </div>
          <div class="slider-group">
            <label>Start Y Position:</label>
            <div class="slider-container">
              <input type="range" id="drawer-move-start-y" min="0" max="100" step="0.1" value="${
                obj.moveStartY !== undefined ? obj.moveStartY : obj.y
              }">
              <span class="slider-value" id="drawer-move-start-y-value">${(obj.moveStartY !==
              undefined
                ? obj.moveStartY
                : obj.y
              ).toFixed(1)}</span>
            </div>
          </div>
          <div class="slider-group">
            <label>End X Position:</label>
            <div class="slider-container">
              <input type="range" id="drawer-move-end-x" min="0" max="100" step="0.1" value="${
                obj.moveEndX !== undefined ? obj.moveEndX : obj.x
              }">
              <span class="slider-value" id="drawer-move-end-x-value">${(obj.moveEndX !==
              undefined
                ? obj.moveEndX
                : obj.x
              ).toFixed(1)}</span>
            </div>
          </div>
          <div class="slider-group">
            <label>End Y Position:</label>
            <div class="slider-container">
              <input type="range" id="drawer-move-end-y" min="0" max="100" step="0.1" value="${
                obj.moveEndY !== undefined ? obj.moveEndY : obj.y
              }">
              <span class="slider-value" id="drawer-move-end-y-value">${(obj.moveEndY !==
              undefined
                ? obj.moveEndY
                : obj.y
              ).toFixed(1)}</span>
            </div>
          </div>
        </div>
      `;

      // Add event listeners for move controls
      const moveControls = [
        { id: "drawer-move-start-x", valueId: "drawer-move-start-x-value" },
        { id: "drawer-move-start-y", valueId: "drawer-move-start-y-value" },
        { id: "drawer-move-end-x", valueId: "drawer-move-end-x-value" },
        { id: "drawer-move-end-y", valueId: "drawer-move-end-y-value" },
      ];

      moveControls.forEach(({ id, valueId }) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(valueId);

        if (slider && valueDisplay) {
          slider.addEventListener("input", () => {
            const value = parseFloat(slider.value);
            valueDisplay.textContent = value.toFixed(1);
            if (window.editor) window.editor.updateSelectedObjectFromDrawer();
          });
        }
      });
    }

    // Update the toggle buttons and state indicator to reflect current mode
    // without calling toggleEffectEditMode (to avoid infinite loop)
    this.updateToggleButtonStates();
  }

  /**
   * Get current effect edit mode
   * @returns {string} Current edit mode ('start' or 'end')
   */
  getCurrentEffectEditMode() {
    return this.currentEffectEditMode;
  }

  /**
   * Update effect-specific controls based on selected effect
   * @param {Object} obj - Object data
   */
  updateEffectControls(obj) {
    // This method is no longer used as effect controls are now in the drawer
    // Keeping it for backwards compatibility but it does nothing
  }

  /**
   * Show warning modal
   * @param {string} message - Warning message
   */
  showWarning(message) {
    const warningMessage = document.getElementById("warning-message");
    const warningModal = document.getElementById("warning-modal");

    if (warningMessage && warningModal) {
      warningMessage.textContent = message;
      warningModal.style.display = "block";
    } else {
      console.warn("Warning modal elements not found, message:", message);
    }
  }

  /**
   * Close modal
   */
  closeModal() {
    const warningModal = document.getElementById("warning-modal");
    if (warningModal) {
      warningModal.style.display = "none";
    }
  }
}
