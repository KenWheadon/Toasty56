// UI management functionality

class UIManager {
  constructor() {
    this.modalElement = null;
  }

  /**
   * Setup UI event listeners
   */
  setupEventListeners() {
    // Header controls
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

    // Scene properties
    Utils.addEventListenerSafe("scene-id", "input", () => {
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

    // Modal controls
    Utils.addQueryListenerSafe(".close", "click", () => this.closeModal());

    window.addEventListener("click", (e) => {
      const modal = document.getElementById("warning-modal");
      if (modal && e.target === modal) {
        this.closeModal();
      }
    });
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

    // Update next scene dropdown with ordered scenes
    const nextSceneSelect = document.getElementById("next-scene");
    if (nextSceneSelect) {
      // Preserve current selection
      const currentNextValue = nextSceneSelect.value;

      nextSceneSelect.innerHTML =
        '<option value="">Select Scene</option><option value="null">End</option>';

      const orderedSceneKeys = Utils.getOrderedSceneKeys(project.scenes);
      orderedSceneKeys.forEach((sceneId) => {
        const option = document.createElement("option");
        option.value = sceneId;
        option.textContent = `Scene ${sceneId}`;
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
        const option = document.createElement("option");
        option.value = sceneId;
        option.textContent = `Scene ${sceneId}`;
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

    const sceneIdInput = document.getElementById("scene-id");
    if (sceneIdInput) sceneIdInput.value = sceneId;

    const sceneTypeSelect = document.getElementById("scene-type");
    if (sceneTypeSelect) sceneTypeSelect.value = scene.type || "choice";

    const sceneBackgroundSelect = document.getElementById("scene-background");
    if (sceneBackgroundSelect)
      sceneBackgroundSelect.value = scene.background || "";

    const sceneContentTextarea = document.getElementById("scene-content");
    if (sceneContentTextarea) sceneContentTextarea.value = scene.content || "";

    const nextSceneSelect = document.getElementById("next-scene");
    if (nextSceneSelect) nextSceneSelect.value = scene.nextScene || "";

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
          <input type="text" placeholder="Choice text" value="${choice.text}" 
                 onchange="if(window.editor) window.editor.updateChoice(${index}, 'text', this.value)">
          <select class="choice-next-scene" onchange="if(window.editor) window.editor.updateChoice(${index}, 'nextScene', this.value)">
            <option value="">Select Scene</option>
            <option value="null">End</option>
          </select>
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

      const cleanName = Utils.getCleanFilename(imageData.src, "object");
      objectItem.innerHTML = `
        <div class="scene-object-info">
          <div class="scene-object-name">${cleanName}</div>
          <div class="scene-object-details">
            x: ${imageData.x.toFixed(1)}%, y: ${imageData.y.toFixed(1)}%, 
            scale: ${imageData.scale.toFixed(1)}, z: ${imageData.zIndex}
          </div>
        </div>
        <div class="scene-object-actions">
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

    // Update drawer content with current object's effect settings
    this.updateEffectDrawerContent(obj);

    // Show the drawer
    drawer.classList.add("open");
  }

  /**
   * Close effect controls drawer
   */
  closeEffectDrawer() {
    const drawer = document.getElementById("effect-controls-drawer");
    if (drawer) {
      drawer.classList.remove("open");
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
        <div class="effect-controls-section">
          <h5>Scale Effect Settings</h5>
          <div class="slider-group">
            <label>Start Scale:</label>
            <div class="slider-container">
              <input type="range" id="drawer-scale-start" min="0.1" max="5" step="0.1" value="${
                obj.scaleStart || 1
              }">
              <span class="slider-value" id="drawer-scale-start-value">${(
                obj.scaleStart || 1
              ).toFixed(1)}</span>
            </div>
          </div>
          <div class="slider-group">
            <label>End Scale:</label>
            <div class="slider-container">
              <input type="range" id="drawer-scale-end" min="0.1" max="5" step="0.1" value="${
                obj.scaleEnd || 1
              }">
              <span class="slider-value" id="drawer-scale-end-value">${(
                obj.scaleEnd || 1
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
        <div class="effect-controls-section">
          <h5>Move Effect Settings</h5>
          <div class="slider-group">
            <label>Start X Position:</label>
            <div class="slider-container">
              <input type="range" id="drawer-move-start-x" min="0" max="100" step="0.1" value="${
                obj.moveStartX || 0
              }">
              <span class="slider-value" id="drawer-move-start-x-value">${(
                obj.moveStartX || 0
              ).toFixed(1)}</span>
            </div>
          </div>
          <div class="slider-group">
            <label>Start Y Position:</label>
            <div class="slider-container">
              <input type="range" id="drawer-move-start-y" min="0" max="100" step="0.1" value="${
                obj.moveStartY || 0
              }">
              <span class="slider-value" id="drawer-move-start-y-value">${(
                obj.moveStartY || 0
              ).toFixed(1)}</span>
            </div>
          </div>
          <div class="slider-group">
            <label>End X Position:</label>
            <div class="slider-container">
              <input type="range" id="drawer-move-end-x" min="0" max="100" step="0.1" value="${
                obj.moveEndX || 100
              }">
              <span class="slider-value" id="drawer-move-end-x-value">${(
                obj.moveEndX || 100
              ).toFixed(1)}</span>
            </div>
          </div>
          <div class="slider-group">
            <label>End Y Position:</label>
            <div class="slider-container">
              <input type="range" id="drawer-move-end-y" min="0" max="100" step="0.1" value="${
                obj.moveEndY || 100
              }">
              <span class="slider-value" id="drawer-move-end-y-value">${(
                obj.moveEndY || 100
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
    // Note: No else clause - drawer content remains empty for effects without settings
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
