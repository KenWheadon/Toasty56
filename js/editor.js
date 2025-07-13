// Main Story Editor class that orchestrates all components

class StoryEditor {
  constructor() {
    this.currentScene = null;

    // Initialize component managers
    this.projectManager = new ProjectManager();
    this.assetManager = new AssetManager();
    this.sceneManager = new SceneManager();
    this.previewManager = new PreviewManager();
    this.uiManager = new UIManager();

    // Make global references for onclick handlers
    window.editor = this;
    window.assetManager = this.assetManager;
    window.projectManager = this.projectManager;
    window.sceneManager = this.sceneManager;
    window.previewManager = this.previewManager;
    window.uiManager = this.uiManager;

    this.initializeEditor();
  }

  /**
   * Initialize the editor
   */
  initializeEditor() {
    this.setupEventListeners();
    this.loadFromLocalStorage();
    this.projectManager.startAutoSave();
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    this.uiManager.setupEventListeners();
    this.assetManager.setupAssetDropZones();
    this.previewManager.setupPreviewEventListeners();
  }

  /**
   * Load project from localStorage or create new one
   */
  loadFromLocalStorage() {
    if (this.projectManager.loadFromLocalStorage()) {
      this.loadProjectData();
    } else {
      this.createNewProject();
    }
  }

  /**
   * Create new project
   */
  createNewProject() {
    this.projectManager.initializeProject();
    this.assetManager.clearAssets();
    this.refreshSceneList();
    this.assetManager.refreshAssetLists();
    this.updateSceneDropdowns(); // FIX: Add this missing call
    this.previewManager.clearPreview();
    this.uiManager.updateSceneObjectsList(
      this.projectManager.getProject(),
      null
    );
  }

  /**
   * Load project data
   */
  loadProjectData() {
    const extractedAssets = this.projectManager.extractAssetsFromProject();
    this.assetManager.setAssets(
      extractedAssets.backgrounds,
      extractedAssets.objects
    );
    this.refreshSceneList();
    this.assetManager.refreshAssetLists();
    this.updateSceneDropdowns(); // FIX: Add this missing call

    // Load first scene
    const project = this.projectManager.getProject();
    const firstSceneId = Object.keys(project.scenes)[0];
    if (firstSceneId) {
      this.selectScene(firstSceneId);
    }
  }

  /**
   * Load project from file
   */
  loadProject() {
    document.getElementById("file-input").click();
  }

  /**
   * Handle file load
   * @param {Event} event - File input change event
   */
  handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (this.projectManager.loadFromJSON(e.target.result)) {
        this.loadProjectData();
      } else {
        this.showWarning("Error loading project file.");
      }
    };
    reader.readAsText(file);
  }

  /**
   * Save project to file
   */
  saveProject() {
    this.projectManager.saveProjectToFile();
  }

  /**
   * Add new scene
   */
  addScene() {
    const project = this.projectManager.getProject();
    const sceneId = this.sceneManager.addScene(project);
    this.refreshSceneList();
    this.updateSceneDropdowns();
    this.selectScene(sceneId);
  }

  /**
   * Duplicate current scene
   */
  duplicateScene() {
    if (!this.currentScene) return;

    const project = this.projectManager.getProject();
    const sceneId = this.sceneManager.duplicateScene(
      project,
      this.currentScene
    );
    if (sceneId) {
      this.refreshSceneList();
      this.updateSceneDropdowns();
      this.selectScene(sceneId);
    }
  }

  /**
   * Delete current scene
   */
  deleteScene() {
    if (!this.currentScene) return;

    if (confirm("Are you sure you want to delete this scene?")) {
      const project = this.projectManager.getProject();
      this.sceneManager.deleteScene(project, this.currentScene);

      this.currentScene = null;
      this.refreshSceneList();
      this.updateSceneDropdowns();
      this.previewManager.clearPreview();
      this.uiManager.updateSceneObjectsList(project, null);
    }
  }

  /**
   * Select scene
   * @param {string} sceneId - Scene ID
   */
  selectScene(sceneId) {
    this.currentScene = sceneId;
    this.sceneManager.selectScene(sceneId);
    this.previewManager.deselectObject();

    const project = this.projectManager.getProject();
    this.uiManager.updateScenePropertiesDisplay(project, sceneId);
    this.updateSceneDropdowns();
    this.previewManager.renderPreview(project, sceneId);
    this.sceneManager.updateActiveSceneInList();
    this.updateObjectProperties();
    this.uiManager.updateSceneObjectsList(
      project,
      sceneId,
      this.previewManager.getSelectedObject()
    );
  }

  /**
   * Update scene dropdowns
   */
  updateSceneDropdowns() {
    const project = this.projectManager.getProject();
    const backgrounds = this.assetManager.getBackgrounds();
    this.uiManager.updateSceneDropdowns(backgrounds, project);
  }

  /**
   * Refresh scene list
   */
  refreshSceneList() {
    const project = this.projectManager.getProject();
    this.sceneManager.refreshSceneList(project);
  }

  /**
   * Update scene properties
   */
  updateSceneProperties() {
    if (!this.currentScene) return;

    const project = this.projectManager.getProject();
    const scene = project.scenes[this.currentScene];
    const newSceneId = document.getElementById("scene-id").value;

    // Handle scene ID change
    if (newSceneId !== this.currentScene) {
      if (project.scenes[newSceneId]) {
        this.showWarning("Scene ID already exists!");
        document.getElementById("scene-id").value = this.currentScene;
        return;
      }

      // Create mapping for the ID change
      const idMapping = {};
      Object.keys(project.scenes).forEach((id) => {
        idMapping[id] = id === this.currentScene ? newSceneId : id;
      });

      // Apply the renumbering
      this.sceneManager.renumberScenes(project, idMapping);
      this.currentScene = newSceneId;

      this.refreshSceneList();
      this.updateSceneDropdowns();
    }

    // Update other properties
    const sceneProperties = {
      id: document.getElementById("scene-id").value,
      type: document.getElementById("scene-type").value,
      content: document.getElementById("scene-content").value,
    };

    const backgroundSelect = document.getElementById("scene-background");
    if (backgroundSelect) {
      sceneProperties.background = backgroundSelect.value || undefined;
    }

    const nextSceneSelect = document.getElementById("next-scene");
    if (nextSceneSelect && scene.type === "image") {
      const nextScene = nextSceneSelect.value;
      sceneProperties.nextScene =
        nextScene === "null" ? null : nextScene || undefined;
    }

    this.sceneManager.updateSceneProperties(
      project,
      this.currentScene,
      sceneProperties
    );

    this.refreshSceneList();
    this.previewManager.renderPreview(project, this.currentScene);
    this.uiManager.updateChoicesVisibility();
    this.uiManager.updateSceneObjectsList(
      project,
      this.currentScene,
      this.previewManager.getSelectedObject()
    );
  }

  /**
   * Update overlay
   */
  updateOverlay() {
    if (!this.currentScene) return;

    const project = this.projectManager.getProject();
    const scene = project.scenes[this.currentScene];
    const enabled = document.getElementById("overlay-enabled").checked;

    if (enabled) {
      scene.overlay = {
        color: document.getElementById("overlay-color").value,
        opacity: parseFloat(document.getElementById("overlay-opacity").value),
        zIndex: parseInt(document.getElementById("overlay-zindex").value),
      };

      const opacityValue = document.getElementById("overlay-opacity-value");
      if (opacityValue) opacityValue.textContent = scene.overlay.opacity;

      const zindexValue = document.getElementById("overlay-zindex-value");
      if (zindexValue) zindexValue.textContent = scene.overlay.zIndex;
    } else {
      delete scene.overlay;
    }

    this.uiManager.updateOverlayControls();
    this.previewManager.renderPreview(project, this.currentScene);
  }

  /**
   * Add choice to current scene
   */
  addChoice() {
    if (!this.currentScene) return;

    const project = this.projectManager.getProject();
    this.sceneManager.addChoice(project, this.currentScene);
    this.uiManager.refreshChoicesList(project, this.currentScene);
    this.previewManager.renderPreview(project, this.currentScene);
  }

  /**
   * Remove choice from current scene
   * @param {number} index - Choice index
   */
  removeChoice(index) {
    if (!this.currentScene) return;

    const project = this.projectManager.getProject();
    this.sceneManager.removeChoice(project, this.currentScene, index);
    this.uiManager.refreshChoicesList(project, this.currentScene);
    this.previewManager.renderPreview(project, this.currentScene);
  }

  /**
   * Update choice
   * @param {number} index - Choice index
   * @param {string} property - Property to update
   * @param {*} value - New value
   */
  updateChoice(index, property, value) {
    if (!this.currentScene) return;

    const project = this.projectManager.getProject();
    this.sceneManager.updateChoice(
      project,
      this.currentScene,
      index,
      property,
      value
    );
    this.validateSceneReferences();
    this.previewManager.renderPreview(project, this.currentScene);
  }

  /**
   * Validate scene references
   */
  validateSceneReferences() {
    const project = this.projectManager.getProject();
    const warnings = Utils.validateSceneReferences(project.scenes);

    if (warnings.length > 0) {
      this.showWarning(warnings.join("\n"));
    }
  }

  /**
   * Add object to current scene
   * @param {string} objPath - Object path
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  addObjectToScene(objPath, x, y) {
    if (!this.currentScene) return;

    const project = this.projectManager.getProject();
    const scene = project.scenes[this.currentScene];
    if (!scene.images) scene.images = [];

    const newObject = {
      src: objPath,
      x: x,
      y: y,
      scale: 1.0,
      rotation: 0,
      zIndex: scene.images.length + 1,
      opacity: 1.0,
    };

    scene.images.push(newObject);
    this.previewManager.renderPreview(project, this.currentScene);
    this.uiManager.updateSceneObjectsList(
      project,
      this.currentScene,
      this.previewManager.getSelectedObject()
    );
  }

  /**
   * Select object from list
   * @param {number} index - Object index
   */
  selectObjectFromList(index) {
    this.previewManager.selectObject(index);
    this.uiManager.updateSceneObjectsList(
      this.projectManager.getProject(),
      this.currentScene,
      index
    );
  }

  /**
   * Remove object from list
   * @param {number} index - Object index
   */
  removeObjectFromList(index) {
    if (!this.currentScene) return;

    const project = this.projectManager.getProject();
    const scene = project.scenes[this.currentScene];
    if (scene.images && scene.images[index]) {
      scene.images.splice(index, 1);

      // Update selected object index if necessary
      const selectedObject = this.previewManager.getSelectedObject();
      if (selectedObject === index) {
        this.previewManager.deselectObject();
      } else if (selectedObject > index) {
        this.previewManager.selectObject(selectedObject - 1);
      }

      this.previewManager.renderPreview(project, this.currentScene);
      this.updateObjectProperties();
      this.uiManager.updateSceneObjectsList(
        project,
        this.currentScene,
        this.previewManager.getSelectedObject()
      );
    }
  }

  /**
   * Update object properties
   */
  updateObjectProperties() {
    const project = this.projectManager.getProject();
    const selectedObject = this.previewManager.getSelectedObject();
    this.uiManager.updateObjectProperties(
      project,
      this.currentScene,
      selectedObject
    );

    // Auto-handle drawer based on current effect
    if (
      selectedObject !== null &&
      this.currentScene &&
      project.scenes[this.currentScene]
    ) {
      const obj = project.scenes[this.currentScene].images[selectedObject];
      if (obj && obj.effect) {
        this.uiManager.handleEffectChange(obj.effect);
      } else {
        this.uiManager.closeEffectDrawer();
      }
    }
  }

  /**
   * Update scene objects list
   */
  updateSceneObjectsList() {
    const project = this.projectManager.getProject();
    const selectedObject = this.previewManager.getSelectedObject();
    this.uiManager.updateSceneObjectsList(
      project,
      this.currentScene,
      selectedObject
    );
  }

  /**
   * Update selected object from UI controls
   */
  updateSelectedObject() {
    const selectedObject = this.previewManager.getSelectedObject();
    if (selectedObject === null || !this.currentScene) return;

    const project = this.projectManager.getProject();
    const scene = project.scenes[this.currentScene];
    const obj = scene.images[selectedObject];

    const xInput = document.getElementById("obj-x");
    const yInput = document.getElementById("obj-y");
    const scaleInput = document.getElementById("obj-scale");
    const rotationInput = document.getElementById("obj-rotation");
    const zindexInput = document.getElementById("obj-zindex");
    const opacityInput = document.getElementById("obj-opacity");
    const effectSelect = document.getElementById("obj-effect");

    if (xInput) obj.x = parseFloat(xInput.value);
    if (yInput) obj.y = parseFloat(yInput.value);
    if (scaleInput) obj.scale = parseFloat(scaleInput.value);
    if (rotationInput) obj.rotation = parseFloat(rotationInput.value);
    if (zindexInput) obj.zIndex = parseInt(zindexInput.value);
    if (opacityInput) obj.opacity = parseFloat(opacityInput.value);
    if (effectSelect) obj.effect = effectSelect.value || undefined;

    // Clear effect properties when effect changes
    this.clearEffectProperties(obj);

    this.previewManager.updateObjectVisual();
    this.uiManager.updateSceneObjectsList(
      project,
      this.currentScene,
      selectedObject
    );
  }

  /**
   * Update selected object from drawer controls
   */
  updateSelectedObjectFromDrawer() {
    const selectedObject = this.previewManager.getSelectedObject();
    if (selectedObject === null || !this.currentScene) return;

    const project = this.projectManager.getProject();
    const scene = project.scenes[this.currentScene];
    const obj = scene.images[selectedObject];

    // Update effect-specific properties from drawer
    if (obj.effect === "scale_to") {
      const scaleStartInput = document.getElementById("drawer-scale-start");
      const scaleEndInput = document.getElementById("drawer-scale-end");

      if (scaleStartInput) obj.scaleStart = parseFloat(scaleStartInput.value);
      if (scaleEndInput) obj.scaleEnd = parseFloat(scaleEndInput.value);
    } else if (obj.effect === "slide_to") {
      const moveStartXInput = document.getElementById("drawer-move-start-x");
      const moveStartYInput = document.getElementById("drawer-move-start-y");
      const moveEndXInput = document.getElementById("drawer-move-end-x");
      const moveEndYInput = document.getElementById("drawer-move-end-y");

      if (moveStartXInput) obj.moveStartX = parseFloat(moveStartXInput.value);
      if (moveStartYInput) obj.moveStartY = parseFloat(moveStartYInput.value);
      if (moveEndXInput) obj.moveEndX = parseFloat(moveEndXInput.value);
      if (moveEndYInput) obj.moveEndY = parseFloat(moveEndYInput.value);
    }

    this.previewManager.updateObjectVisual();
    this.uiManager.updateSceneObjectsList(
      project,
      this.currentScene,
      selectedObject
    );
  }

  /**
   * Clear effect properties when effect type changes
   * @param {Object} obj - Object data
   */
  clearEffectProperties(obj) {
    // Always clear all effect properties first
    delete obj.scaleStart;
    delete obj.scaleEnd;
    delete obj.moveStartX;
    delete obj.moveStartY;
    delete obj.moveEndX;
    delete obj.moveEndY;
  }

  /**
   * Remove selected object
   */
  removeSelectedObject() {
    const selectedObject = this.previewManager.getSelectedObject();
    if (selectedObject === null || !this.currentScene) return;

    const project = this.projectManager.getProject();
    const scene = project.scenes[this.currentScene];
    scene.images.splice(selectedObject, 1);

    this.previewManager.deselectObject();
    this.previewManager.renderPreview(project, this.currentScene);
    this.updateObjectProperties();
    this.uiManager.updateSceneObjectsList(project, this.currentScene, null);
  }

  /**
   * Reorder scene
   * @param {string} sceneId - Scene ID
   * @param {number} newIndex - New index
   */
  reorderScene(sceneId, newIndex) {
    const project = this.projectManager.getProject();
    const idMapping = this.sceneManager.reorderScene(
      project,
      sceneId,
      newIndex
    );

    if (idMapping) {
      // Update current scene selection
      if (this.currentScene) {
        this.currentScene = idMapping[this.currentScene];
      }

      // Refresh UI
      this.refreshSceneList();
      this.updateSceneDropdowns();
      this.sceneManager.updateActiveSceneInList();
      this.uiManager.updateScenePropertiesDisplay(project, this.currentScene);
    }
  }

  /**
   * Show warning modal
   * @param {string} message - Warning message
   */
  showWarning(message) {
    this.uiManager.showWarning(message);
  }

  /**
   * Close modal
   */
  closeModal() {
    this.uiManager.closeModal();
  }
}

// Initialize the editor when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new StoryEditor();
});
