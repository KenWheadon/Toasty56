class StoryEditor {
  constructor() {
    this.project = null;
    this.currentScene = null;
    this.selectedObject = null;
    this.backgrounds = [];
    this.objects = [];
    this.isDragging = false;
    this.isScaling = false;
    this.isRotating = false;
    this.dragOffset = { x: 0, y: 0 };
    this.imageCache = new Map();
    this.autoSaveInterval = null;
    this.autoSaveStatus = "ready";

    this.initializeEditor();
    this.setupEventListeners();
    this.loadFromLocalStorage();
    this.startAutoSave();
  }

  initializeEditor() {
    // Initialize with empty project structure
    this.project = {
      metadata: {
        title: "New Story",
        author: "Author",
        description: "A new interactive story",
        version: "1.0.0",
        tags: [],
      },
      totalScenes: 0,
      currentScene: 1,
      scenes: {},
    };
  }

  // Auto-save functionality
  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.autoSave();
    }, 10000); // Auto-save every 10 seconds
  }

  autoSave() {
    if (!this.project || Object.keys(this.project.scenes).length === 0) {
      return;
    }

    try {
      this.updateAutoSaveStatus("saving");
      const projectData = JSON.stringify(this.project);
      localStorage.setItem("story-editor-autosave", projectData);
      this.updateAutoSaveStatus("saved");
    } catch (error) {
      console.error("Auto-save failed:", error);
      this.updateAutoSaveStatus("error");
    }
  }

  updateAutoSaveStatus(status) {
    this.autoSaveStatus = status;
    const indicator = document.getElementById("auto-save-indicator");
    if (indicator) {
      indicator.className = status;
      switch (status) {
        case "saving":
          indicator.textContent = "Saving...";
          break;
        case "saved":
          indicator.textContent = "Saved";
          setTimeout(() => {
            if (this.autoSaveStatus === "saved") {
              this.updateAutoSaveStatus("ready");
            }
          }, 2000);
          break;
        case "error":
          indicator.textContent = "Error";
          setTimeout(() => {
            if (this.autoSaveStatus === "error") {
              this.updateAutoSaveStatus("ready");
            }
          }, 3000);
          break;
        default:
          indicator.textContent = "Ready";
          break;
      }
    }
  }

  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem("story-editor-autosave");
      if (savedData) {
        const projectData = JSON.parse(savedData);
        this.project = projectData;
        this.loadProjectData();
        this.updateAutoSaveStatus("ready");
      } else {
        this.createNewProject();
      }
    } catch (error) {
      console.error("Failed to load auto-save data:", error);
      this.createNewProject();
    }
  }

  // Helper function to get clean filename from path
  getCleanFilename(path, type = "object") {
    if (!path) return "";
    // Remove folder path and extension
    let filename = path.split("/").pop();
    filename = filename.replace(/\.[^/.]+$/, "");

    if (type === "background") {
      // Remove bg- prefix from background names
      filename = filename.replace(/^bg-/, "");
    } else if (type === "object") {
      // Replace dashes with spaces and capitalize each word
      filename = filename
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }

    return filename;
  }

  // Helper function to sort assets alphabetically
  sortAssets(assets) {
    return assets.sort((a, b) => {
      const nameA = this.getCleanFilename(a).toLowerCase();
      const nameB = this.getCleanFilename(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  setupEventListeners() {
    // Helper function to safely add event listeners
    const addEventListenerSafe = (id, event, handler) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener(event, handler);
      } else {
        console.warn(`Element with id '${id}' not found`);
      }
    };

    // Helper function to safely query selector and add event listener
    const addQueryListenerSafe = (selector, event, handler) => {
      const element = document.querySelector(selector);
      if (element) {
        element.addEventListener(event, handler);
      } else {
        console.warn(`Element with selector '${selector}' not found`);
      }
    };

    // Header controls
    addEventListenerSafe("load-project", "click", () => this.loadProject());
    addEventListenerSafe("save-project", "click", () => this.saveProject());
    addEventListenerSafe("file-input", "change", (e) => this.handleFileLoad(e));

    // Asset file input
    addEventListenerSafe("asset-file-input", "change", (e) =>
      this.handleAssetFileLoad(e)
    );

    // Scene controls
    addEventListenerSafe("add-scene", "click", () => this.addScene());
    addEventListenerSafe("duplicate-scene", "click", () =>
      this.duplicateScene()
    );
    addEventListenerSafe("delete-scene", "click", () => this.deleteScene());

    // Asset drop zones
    this.setupAssetDropZones();

    // Scene properties
    addEventListenerSafe("scene-id", "input", () =>
      this.updateSceneProperties()
    );
    addEventListenerSafe("scene-type", "change", () =>
      this.updateSceneProperties()
    );
    addEventListenerSafe("scene-background", "change", () =>
      this.updateSceneProperties()
    );
    addEventListenerSafe("scene-content", "input", () =>
      this.updateSceneProperties()
    );
    addEventListenerSafe("next-scene", "change", () =>
      this.updateSceneProperties()
    );

    // Overlay controls
    addEventListenerSafe("overlay-enabled", "change", () =>
      this.updateOverlay()
    );
    addEventListenerSafe("overlay-color", "input", () => this.updateOverlay());
    addEventListenerSafe("overlay-opacity", "input", () =>
      this.updateOverlay()
    );
    addEventListenerSafe("overlay-zindex", "input", () => this.updateOverlay());

    // Choice controls
    addEventListenerSafe("add-choice", "click", () => this.addChoice());

    // Preview scene interactions
    const previewScene = document.getElementById("preview-scene");
    if (previewScene) {
      previewScene.addEventListener("click", (e) => this.handlePreviewClick(e));
      previewScene.addEventListener("dragover", (e) => this.handleDragOver(e));
      previewScene.addEventListener("drop", (e) => this.handleDrop(e));
    }

    // Modal controls
    addQueryListenerSafe(".close", "click", () => this.closeModal());

    window.addEventListener("click", (e) => {
      const modal = document.getElementById("warning-modal");
      if (modal && e.target === modal) {
        this.closeModal();
      }
    });
  }

  setupAssetDropZones() {
    const backgroundDropZone = document.getElementById("background-drop-zone");
    const objectDropZone = document.getElementById("object-drop-zone");

    if (!backgroundDropZone || !objectDropZone) {
      console.warn("Asset drop zones not found in DOM");
      return;
    }

    // Background drop zone
    backgroundDropZone.addEventListener("click", () => {
      const assetInput = document.getElementById("asset-file-input");
      if (assetInput) {
        assetInput.dataset.target = "backgrounds";
        assetInput.click();
      }
    });

    backgroundDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      backgroundDropZone.classList.add("dragover");
    });

    backgroundDropZone.addEventListener("dragleave", () => {
      backgroundDropZone.classList.remove("dragover");
    });

    backgroundDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      backgroundDropZone.classList.remove("dragover");
      this.handleAssetDrop(e, "backgrounds");
    });

    // Object drop zone
    objectDropZone.addEventListener("click", () => {
      const assetInput = document.getElementById("asset-file-input");
      if (assetInput) {
        assetInput.dataset.target = "objects";
        assetInput.click();
      }
    });

    objectDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      objectDropZone.classList.add("dragover");
    });

    objectDropZone.addEventListener("dragleave", () => {
      objectDropZone.classList.remove("dragover");
    });

    objectDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      objectDropZone.classList.remove("dragover");
      this.handleAssetDrop(e, "objects");
    });
  }

  handleAssetDrop(event, targetType) {
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      this.showWarning("Please drop image files only.");
      return;
    }

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imagePath = `images/${file.name}`;
        if (targetType === "backgrounds") {
          if (!this.backgrounds.includes(imagePath)) {
            this.backgrounds.push(imagePath);
          }
        } else {
          if (!this.objects.includes(imagePath)) {
            this.objects.push(imagePath);
          }
        }
        this.refreshAssetLists();
        this.updateSceneDropdowns();
      };
      reader.readAsDataURL(file);
    });
  }

  handleAssetFileLoad(event) {
    const files = Array.from(event.target.files);
    const targetType = event.target.dataset.target;

    if (!targetType) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      this.showWarning("Please select image files only.");
      return;
    }

    imageFiles.forEach((file) => {
      const imagePath = `images/${file.name}`;
      if (targetType === "backgrounds") {
        if (!this.backgrounds.includes(imagePath)) {
          this.backgrounds.push(imagePath);
        }
      } else {
        if (!this.objects.includes(imagePath)) {
          this.objects.push(imagePath);
        }
      }
    });

    this.refreshAssetLists();
    this.updateSceneDropdowns();

    // Clear the file input
    event.target.value = "";
    event.target.dataset.target = "";
  }

  async loadImageDimensions(src) {
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const dimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        this.imageCache.set(src, dimensions);
        resolve(dimensions);
      };
      img.onerror = () => {
        // Fallback dimensions if image fails to load
        const fallback = { width: 100, height: 100 };
        this.imageCache.set(src, fallback);
        resolve(fallback);
      };
      img.src = src;
    });
  }

  createNewProject() {
    this.initializeEditor();
    this.refreshSceneList();
    this.refreshAssetLists();
    this.clearPreview();
    this.updateSceneObjectsList();
  }

  loadProject() {
    document.getElementById("file-input").click();
  }

  handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target.result);
        this.project = projectData;
        this.loadProjectData();
        // Clear auto-save since we loaded a new project
        localStorage.removeItem("story-editor-autosave");
        this.updateAutoSaveStatus("ready");
      } catch (error) {
        this.showWarning("Error loading project: " + error.message);
      }
    };
    reader.readAsText(file);
  }

  loadProjectData() {
    this.extractAssetsFromProject();
    this.refreshSceneList();
    this.refreshAssetLists();

    // Load first scene
    const firstSceneId = Object.keys(this.project.scenes)[0];
    if (firstSceneId) {
      this.selectScene(firstSceneId);
    }
  }

  extractAssetsFromProject() {
    const backgrounds = new Set();
    const objects = new Set();

    Object.values(this.project.scenes).forEach((scene) => {
      if (scene.background) {
        backgrounds.add(scene.background);
      }
      if (scene.images) {
        scene.images.forEach((img) => {
          objects.add(img.src);
        });
      }
    });

    this.backgrounds = Array.from(backgrounds);
    this.objects = Array.from(objects);
  }

  saveProject() {
    const dataStr = JSON.stringify(this.project, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${this.project.metadata.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}-story.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }

  addScene() {
    const sceneId = this.getNextSceneId();
    const newScene = {
      id: `scene_${sceneId}`,
      type: "choice",
      content: "New scene content",
      choices: [],
    };

    this.project.scenes[sceneId] = newScene;
    this.project.totalScenes = Object.keys(this.project.scenes).length;
    this.refreshSceneList();
    this.selectScene(sceneId);
  }

  duplicateScene() {
    if (!this.currentScene) return;

    const sceneId = this.getNextSceneId();
    const currentSceneData = this.project.scenes[this.currentScene];
    const duplicatedScene = JSON.parse(JSON.stringify(currentSceneData));

    duplicatedScene.id = `scene_${sceneId}`;

    this.project.scenes[sceneId] = duplicatedScene;
    this.project.totalScenes = Object.keys(this.project.scenes).length;
    this.refreshSceneList();
    this.selectScene(sceneId);
  }

  deleteScene() {
    if (!this.currentScene) return;

    if (confirm("Are you sure you want to delete this scene?")) {
      delete this.project.scenes[this.currentScene];
      this.project.totalScenes = Object.keys(this.project.scenes).length;
      this.currentScene = null;
      this.refreshSceneList();
      this.clearPreview();
      this.updateSceneObjectsList();
    }
  }

  getNextSceneId() {
    const existingIds = Object.keys(this.project.scenes)
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));
    return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  }

  selectScene(sceneId) {
    this.currentScene = sceneId;
    this.selectedObject = null;
    this.updateScenePropertiesDisplay();
    this.updateSceneDropdowns();
    this.renderPreview();
    this.updateActiveSceneInList();
    this.updateObjectProperties();
    this.updateSceneObjectsList();
  }

  updateActiveSceneInList() {
    document.querySelectorAll(".scene-item").forEach((item) => {
      item.classList.remove("active");
    });

    const activeItem = document.querySelector(
      `[data-scene-id="${this.currentScene}"]`
    );
    if (activeItem) {
      activeItem.classList.add("active");
    }
  }

  refreshSceneList() {
    const sceneList = document.getElementById("scene-list");
    if (!sceneList) {
      console.warn("Scene list element not found");
      return;
    }

    sceneList.innerHTML = "";

    Object.keys(this.project.scenes).forEach((sceneId) => {
      const scene = this.project.scenes[sceneId];
      const sceneItem = document.createElement("div");
      sceneItem.className = "scene-item";
      sceneItem.dataset.sceneId = sceneId;
      sceneItem.innerHTML = `
        <div class="scene-item-id">${sceneId}</div>
      `;
      sceneItem.addEventListener("click", () => this.selectScene(sceneId));
      sceneList.appendChild(sceneItem);
    });
  }

  refreshAssetLists() {
    this.refreshBackgroundList();
    this.refreshObjectList();
  }

  refreshBackgroundList() {
    const bgList = document.getElementById("background-list");
    if (!bgList) {
      console.warn("Background list element not found");
      return;
    }

    bgList.innerHTML = "";

    // Sort backgrounds alphabetically
    const sortedBackgrounds = this.sortAssets(this.backgrounds);

    sortedBackgrounds.forEach((bg) => {
      const item = document.createElement("div");
      item.className = "asset-item";
      const cleanName = this.getCleanFilename(bg, "background");
      item.innerHTML = `
        ${cleanName}
        <button class="remove-btn" onclick="editor.removeBackground('${bg}')">&times;</button>
      `;
      bgList.appendChild(item);
    });
  }

  refreshObjectList() {
    const objList = document.getElementById("object-list");
    if (!objList) {
      console.warn("Object list element not found");
      return;
    }

    objList.innerHTML = "";

    // Sort objects alphabetically
    const sortedObjects = this.sortAssets(this.objects);

    sortedObjects.forEach((obj) => {
      const item = document.createElement("div");
      item.className = "asset-item";
      item.draggable = true;
      item.dataset.objPath = obj;
      const cleanName = this.getCleanFilename(obj, "object");
      item.innerHTML = `
        ${cleanName}
        <button class="remove-btn" onclick="editor.removeObject('${obj}')">&times;</button>
      `;

      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", obj);
        item.classList.add("dragging");
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
      });

      objList.appendChild(item);
    });
  }

  // Update scene objects list
  updateSceneObjectsList() {
    const sceneObjectsList = document.getElementById("scene-objects-list");
    if (!sceneObjectsList) {
      console.warn("Scene objects list element not found");
      return;
    }

    sceneObjectsList.innerHTML = "";

    if (!this.currentScene) {
      sceneObjectsList.innerHTML =
        '<div class="scene-objects-empty">No scene selected</div>';
      return;
    }

    const scene = this.project.scenes[this.currentScene];
    if (!scene.images || scene.images.length === 0) {
      sceneObjectsList.innerHTML =
        '<div class="scene-objects-empty">No objects in scene</div>';
      return;
    }

    scene.images.forEach((imageData, index) => {
      const objectItem = document.createElement("div");
      objectItem.className = "scene-object-item";
      if (this.selectedObject === index) {
        objectItem.classList.add("selected");
      }

      const cleanName = this.getCleanFilename(imageData.src, "object");
      objectItem.innerHTML = `
        <div class="scene-object-info">
          <div class="scene-object-name">${cleanName}</div>
          <div class="scene-object-details">
            x: ${imageData.x.toFixed(1)}%, y: ${imageData.y.toFixed(1)}%, 
            scale: ${imageData.scale.toFixed(1)}, z: ${imageData.zIndex}
          </div>
        </div>
        <div class="scene-object-actions">
          <button class="select-btn" onclick="editor.selectObjectFromList(${index})">Select</button>
          <button class="delete-btn" onclick="editor.removeObjectFromList(${index})">Delete</button>
        </div>
      `;

      sceneObjectsList.appendChild(objectItem);
    });
  }

  selectObjectFromList(index) {
    this.selectObject(index);
    this.updateSceneObjectsList();
  }

  removeObjectFromList(index) {
    if (!this.currentScene) return;

    const scene = this.project.scenes[this.currentScene];
    if (scene.images && scene.images[index]) {
      scene.images.splice(index, 1);

      // Update selected object index if necessary
      if (this.selectedObject === index) {
        this.selectedObject = null;
      } else if (this.selectedObject > index) {
        this.selectedObject--;
      }

      this.renderPreview();
      this.updateObjectProperties();
      this.updateSceneObjectsList();
    }
  }

  removeBackground(bg) {
    this.backgrounds = this.backgrounds.filter((b) => b !== bg);
    this.refreshAssetLists();
    this.updateSceneDropdowns();
  }

  removeObject(obj) {
    this.objects = this.objects.filter((o) => o !== obj);
    this.refreshAssetLists();
  }

  updateSceneDropdowns() {
    // Update background dropdown
    const bgSelect = document.getElementById("scene-background");
    bgSelect.innerHTML = '<option value="">No Background</option>';

    // Sort backgrounds alphabetically for dropdown
    const sortedBackgrounds = this.sortAssets(this.backgrounds);
    sortedBackgrounds.forEach((bg) => {
      const option = document.createElement("option");
      option.value = bg;
      option.textContent = this.getCleanFilename(bg, "background");
      bgSelect.appendChild(option);
    });

    // Update next scene dropdown
    const nextSceneSelect = document.getElementById("next-scene");
    nextSceneSelect.innerHTML =
      '<option value="">Select Scene</option><option value="null">End</option>';
    Object.keys(this.project.scenes).forEach((sceneId) => {
      const scene = this.project.scenes[sceneId];
      const option = document.createElement("option");
      option.value = sceneId;
      option.textContent = `${sceneId}`;
      nextSceneSelect.appendChild(option);
    });

    // Update choice dropdowns
    this.updateChoiceDropdowns();
  }

  updateChoiceDropdowns() {
    const choiceSelects = document.querySelectorAll(".choice-next-scene");
    choiceSelects.forEach((select) => {
      const currentValue = select.value;
      select.innerHTML =
        '<option value="">Select Scene</option><option value="null">End</option>';
      Object.keys(this.project.scenes).forEach((sceneId) => {
        const scene = this.project.scenes[sceneId];
        const option = document.createElement("option");
        option.value = sceneId;
        option.textContent = `${sceneId}`;
        if (sceneId === currentValue) option.selected = true;
        select.appendChild(option);
      });
    });
  }

  updateSceneProperties() {
    if (!this.currentScene) return;

    const scene = this.project.scenes[this.currentScene];
    const newSceneId = document.getElementById("scene-id").value;

    // Handle scene ID change
    if (newSceneId !== this.currentScene) {
      if (this.project.scenes[newSceneId]) {
        this.showWarning("Scene ID already exists!");
        document.getElementById("scene-id").value = this.currentScene;
        return;
      }

      // Update scene ID
      this.project.scenes[newSceneId] = scene;
      delete this.project.scenes[this.currentScene];
      this.currentScene = newSceneId;
      this.refreshSceneList();
      this.updateSceneDropdowns();
    }

    // Update other properties
    scene.id = document.getElementById("scene-id").value;
    scene.type = document.getElementById("scene-type").value;
    scene.background =
      document.getElementById("scene-background").value || undefined;
    scene.content = document.getElementById("scene-content").value;

    const nextScene = document.getElementById("next-scene").value;
    if (scene.type === "image") {
      scene.nextScene = nextScene === "null" ? null : nextScene || undefined;
    }

    this.refreshSceneList();
    this.renderPreview();
    this.updateChoicesVisibility();
    this.updateSceneObjectsList();
  }

  updateScenePropertiesDisplay() {
    if (!this.currentScene) return;

    const scene = this.project.scenes[this.currentScene];
    document.getElementById("scene-id").value = this.currentScene;
    document.getElementById("scene-type").value = scene.type || "choice";
    document.getElementById("scene-background").value = scene.background || "";
    document.getElementById("scene-content").value = scene.content || "";
    document.getElementById("next-scene").value = scene.nextScene || "";

    // Update overlay
    if (scene.overlay) {
      document.getElementById("overlay-enabled").checked = true;
      document.getElementById("overlay-color").value =
        scene.overlay.color || "#000000";
      document.getElementById("overlay-opacity").value =
        scene.overlay.opacity || 0.5;
      document.getElementById("overlay-zindex").value =
        scene.overlay.zIndex || 45;
      document.getElementById("overlay-opacity-value").textContent =
        scene.overlay.opacity || 0.5;
      document.getElementById("overlay-zindex-value").textContent =
        scene.overlay.zIndex || 45;
    } else {
      document.getElementById("overlay-enabled").checked = false;
    }

    this.updateOverlayControls();
    this.updateChoicesVisibility();
    this.refreshChoicesList();
  }

  updateChoicesVisibility() {
    const sceneType = document.getElementById("scene-type").value;
    const choicesSection = document.getElementById("choices-section");
    const nextSceneGroup = document.getElementById("next-scene-group");

    if (sceneType === "choice") {
      choicesSection.style.display = "block";
      nextSceneGroup.style.display = "none";
    } else {
      choicesSection.style.display = "none";
      nextSceneGroup.style.display = "block";
    }
  }

  updateOverlay() {
    if (!this.currentScene) return;

    const scene = this.project.scenes[this.currentScene];
    const enabled = document.getElementById("overlay-enabled").checked;

    if (enabled) {
      scene.overlay = {
        color: document.getElementById("overlay-color").value,
        opacity: parseFloat(document.getElementById("overlay-opacity").value),
        zIndex: parseInt(document.getElementById("overlay-zindex").value),
      };
      document.getElementById("overlay-opacity-value").textContent =
        scene.overlay.opacity;
      document.getElementById("overlay-zindex-value").textContent =
        scene.overlay.zIndex;
    } else {
      delete scene.overlay;
    }

    this.updateOverlayControls();
    this.renderPreview();
  }

  updateOverlayControls() {
    const enabled = document.getElementById("overlay-enabled").checked;
    const controls = document.getElementById("overlay-controls");
    controls.classList.toggle("visible", enabled);
  }

  addChoice() {
    if (!this.currentScene) return;

    const scene = this.project.scenes[this.currentScene];
    if (!scene.choices) scene.choices = [];

    scene.choices.push({
      text: "New choice",
      nextScene: "",
    });

    this.refreshChoicesList();
    this.renderPreview(); // Fix: Update preview when adding choices
  }

  refreshChoicesList() {
    if (!this.currentScene) return;

    const scene = this.project.scenes[this.currentScene];
    const choicesList = document.getElementById("choices-list");
    choicesList.innerHTML = "";

    if (scene.choices) {
      scene.choices.forEach((choice, index) => {
        const choiceItem = document.createElement("div");
        choiceItem.className = "choice-item";
        choiceItem.innerHTML = `
          <button class="remove-choice" onclick="editor.removeChoice(${index})">&times;</button>
          <input type="text" placeholder="Choice text" value="${choice.text}" 
                 onchange="editor.updateChoice(${index}, 'text', this.value)">
          <select class="choice-next-scene" onchange="editor.updateChoice(${index}, 'nextScene', this.value)">
            <option value="">Select Scene</option>
            <option value="null">End</option>
          </select>
        `;
        choicesList.appendChild(choiceItem);
      });

      this.updateChoiceDropdowns();
    }
  }

  updateChoice(index, property, value) {
    if (!this.currentScene) return;

    const scene = this.project.scenes[this.currentScene];
    if (scene.choices && scene.choices[index]) {
      scene.choices[index][property] = value;
      this.validateSceneReferences();
      this.renderPreview(); // Fix: Update preview when updating choices
    }
  }

  removeChoice(index) {
    if (!this.currentScene) return;

    const scene = this.project.scenes[this.currentScene];
    if (scene.choices) {
      scene.choices.splice(index, 1);
      this.refreshChoicesList();
      this.renderPreview(); // Fix: Update preview when removing choices
    }
  }

  validateSceneReferences() {
    const warnings = [];

    Object.keys(this.project.scenes).forEach((sceneId) => {
      const scene = this.project.scenes[sceneId];

      // Check nextScene
      if (
        scene.nextScene &&
        scene.nextScene !== null &&
        !this.project.scenes[scene.nextScene]
      ) {
        warnings.push(
          `Scene ${sceneId} references non-existent scene: ${scene.nextScene}`
        );
      }

      // Check choices
      if (scene.choices) {
        scene.choices.forEach((choice, index) => {
          if (
            choice.nextScene &&
            choice.nextScene !== null &&
            !this.project.scenes[choice.nextScene]
          ) {
            warnings.push(
              `Scene ${sceneId}, choice ${
                index + 1
              } references non-existent scene: ${choice.nextScene}`
            );
          }
        });
      }
    });

    if (warnings.length > 0) {
      this.showWarning(warnings.join("\n"));
    }
  }

  handlePreviewClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Deselect current object
    this.selectedObject = null;
    this.updateObjectProperties();
    this.hideObjectControls();
    this.updateSceneObjectsList();

    // Remove selection from all objects
    document.querySelectorAll(".preview-object").forEach((obj) => {
      obj.classList.remove("selected");
    });
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  handleDrop(e) {
    e.preventDefault();
    const objPath = e.dataTransfer.getData("text/plain");

    if (objPath) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      this.addObjectToScene(objPath, x, y);
    }
  }

  addObjectToScene(objPath, x, y) {
    if (!this.currentScene) return;

    const scene = this.project.scenes[this.currentScene];
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
    this.renderPreview();
    this.updateSceneObjectsList();
  }

  async renderPreview() {
    const previewScene = document.getElementById("preview-scene");

    if (!this.currentScene) {
      previewScene.innerHTML =
        '<div class="drop-zone">Select a scene to preview</div>';
      return;
    }

    const scene = this.project.scenes[this.currentScene];

    // Clear preview
    previewScene.innerHTML = "";

    // Set background
    if (scene.background) {
      previewScene.style.backgroundImage = `url('${scene.background}')`;
    } else {
      previewScene.style.backgroundImage = "none";
    }

    // Add overlay
    if (scene.overlay) {
      const overlay = document.createElement("div");
      overlay.className = "preview-overlay";
      overlay.style.backgroundColor = scene.overlay.color;
      overlay.style.opacity = scene.overlay.opacity;
      overlay.style.zIndex = scene.overlay.zIndex;
      previewScene.appendChild(overlay);
    }

    // Add objects
    if (scene.images) {
      for (let index = 0; index < scene.images.length; index++) {
        const imageData = scene.images[index];
        const objElement = document.createElement("div");
        objElement.className = "preview-object";
        objElement.dataset.imageIndex = index;
        objElement.style.left = `${imageData.x}%`;
        objElement.style.top = `${imageData.y}%`;
        objElement.style.transform = `translate(-50%, -50%) scale(${
          imageData.scale || 1
        }) rotate(${imageData.rotation || 0}deg)`;
        objElement.style.zIndex = imageData.zIndex || 1;
        objElement.style.opacity = imageData.opacity || 1;

        // Use natural image dimensions (same as game)
        const img = document.createElement("img");
        img.src = imageData.src;
        img.alt = "Scene Object";
        img.style.position = "absolute";
        img.style.top = "0";
        img.style.left = "0";
        img.style.width = "auto";
        img.style.height = "auto";
        img.style.maxWidth = "none";
        img.style.maxHeight = "none";
        img.style.objectFit = "contain";
        img.style.pointerEvents = "none";

        // Wait for image to load to get natural dimensions
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });

        // Set container size to natural image dimensions
        objElement.style.width = `${img.naturalWidth}px`;
        objElement.style.height = `${img.naturalHeight}px`;

        objElement.appendChild(img);

        // Add click handler
        objElement.addEventListener("click", (e) => {
          e.stopPropagation();
          this.selectObject(index);
        });

        // Add drag handlers
        objElement.addEventListener("mousedown", (e) =>
          this.startDrag(e, index)
        );

        previewScene.appendChild(objElement);
      }
    }

    // Add text content
    if (scene.content) {
      const textContent = document.createElement("div");
      textContent.className =
        scene.type === "choice"
          ? "preview-text-content choice-layout"
          : "preview-text-content";
      textContent.textContent = scene.content;
      previewScene.appendChild(textContent);
    }

    // Add choices or continue button
    if (scene.type === "choice" && scene.choices && scene.choices.length > 0) {
      const choicesContainer = document.createElement("div");
      choicesContainer.className = "preview-choices-container";

      scene.choices.forEach((choice) => {
        const choiceBtn = document.createElement("button");
        choiceBtn.className = "preview-choice-button";
        choiceBtn.textContent = choice.text;
        choicesContainer.appendChild(choiceBtn);
      });

      previewScene.appendChild(choicesContainer);
    } else if (scene.type === "image" && scene.nextScene !== undefined) {
      const continueBtn = document.createElement("button");
      continueBtn.className = "preview-continue-button";
      continueBtn.textContent = "Continue";
      previewScene.appendChild(continueBtn);
    }

    // Add drop zone if no objects
    if (!scene.images || scene.images.length === 0) {
      const dropZone = document.createElement("div");
      dropZone.className = "drop-zone";
      dropZone.textContent = "Drop objects here or click to place";
      previewScene.appendChild(dropZone);
    }

    // Maintain selection after re-render
    this.maintainSelection();
  }

  selectObject(index) {
    this.selectedObject = index;

    // Update visual selection
    document.querySelectorAll(".preview-object").forEach((obj) => {
      obj.classList.remove("selected");
    });

    const selectedElement = document.querySelector(
      `[data-image-index="${index}"]`
    );
    if (selectedElement) {
      selectedElement.classList.add("selected");
    }

    this.updateObjectProperties();
    this.showObjectControls();
    this.updateSceneObjectsList();
  }

  maintainSelection() {
    // Helper method to maintain object selection after re-render
    if (this.selectedObject !== null) {
      const selectedElement = document.querySelector(
        `[data-image-index="${this.selectedObject}"]`
      );
      if (selectedElement) {
        selectedElement.classList.add("selected");
        this.showObjectControls();
      }
    }
  }

  showObjectControls() {
    if (this.selectedObject === null || !this.currentScene) return;

    const selectedElement = document.querySelector(
      `[data-image-index="${this.selectedObject}"]`
    );
    if (!selectedElement) return;

    // Remove existing controls
    this.hideObjectControls();

    // Create controls container
    const controls = document.createElement("div");
    controls.className = "object-controls visible";
    controls.id = "object-controls";

    // Position controls relative to the object
    controls.style.position = "absolute";
    controls.style.top = "0";
    controls.style.left = "0";
    controls.style.width = "100%";
    controls.style.height = "100%";
    controls.style.pointerEvents = "none";

    // Create scale handle
    const scaleHandle = document.createElement("div");
    scaleHandle.className = "control-handle scale-handle";
    scaleHandle.style.pointerEvents = "auto";
    scaleHandle.addEventListener("mousedown", (e) => this.startScaling(e));
    controls.appendChild(scaleHandle);

    // Create rotate handle
    const rotateHandle = document.createElement("div");
    rotateHandle.className = "control-handle rotate-handle";
    rotateHandle.style.pointerEvents = "auto";
    rotateHandle.addEventListener("mousedown", (e) => this.startRotating(e));
    controls.appendChild(rotateHandle);

    selectedElement.appendChild(controls);
  }

  hideObjectControls() {
    const existingControls = document.getElementById("object-controls");
    if (existingControls) {
      existingControls.remove();
    }
  }

  startScaling(e) {
    e.preventDefault();
    e.stopPropagation();
    this.isScaling = true;

    const startMouseY = e.clientY;
    const scene = this.project.scenes[this.currentScene];
    const obj = scene.images[this.selectedObject];
    const startScale = obj.scale;

    const mouseMoveHandler = (e) => {
      if (!this.isScaling) return;

      const deltaY = startMouseY - e.clientY;
      const scaleChange = deltaY * 0.01;
      obj.scale = Math.max(0.1, Math.min(5, startScale + scaleChange));

      this.updateObjectVisual();
      this.updateObjectProperties();
      this.updateSceneObjectsList();
    };

    const mouseUpHandler = () => {
      this.isScaling = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  startRotating(e) {
    e.preventDefault();
    e.stopPropagation();
    this.isRotating = true;

    const selectedElement = document.querySelector(
      `[data-image-index="${this.selectedObject}"]`
    );
    const rect = selectedElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const scene = this.project.scenes[this.currentScene];
    const obj = scene.images[this.selectedObject];

    const mouseMoveHandler = (e) => {
      if (!this.isRotating) return;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const rotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      obj.rotation = Math.round(rotation);

      this.updateObjectVisual();
      this.updateObjectProperties();
      this.updateSceneObjectsList();
    };

    const mouseUpHandler = () => {
      this.isRotating = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  updateObjectVisual() {
    if (this.selectedObject === null || !this.currentScene) return;

    const scene = this.project.scenes[this.currentScene];
    const obj = scene.images[this.selectedObject];

    const objElement = document.querySelector(
      `[data-image-index="${this.selectedObject}"]`
    );
    if (objElement) {
      objElement.style.left = `${obj.x}%`;
      objElement.style.top = `${obj.y}%`;
      objElement.style.transform = `translate(-50%, -50%) scale(${obj.scale}) rotate(${obj.rotation}deg)`;
      objElement.style.zIndex = obj.zIndex;
      objElement.style.opacity = obj.opacity;
    }
  }

  updateObjectProperties() {
    const propsContainer = document.getElementById("object-properties");

    if (this.selectedObject === null || !this.currentScene) {
      propsContainer.innerHTML = "";
      return;
    }

    const scene = this.project.scenes[this.currentScene];
    const obj = scene.images[this.selectedObject];

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
        <div class="form-group">
          <label>Effect:</label>
          <select id="obj-effect">
            <option value="">No Effect</option>
            <option value="fade_in">Fade In</option>
            <option value="slide_to">Slide To</option>
            <option value="scale_to">Scale To</option>
            <option value="glow">Glow</option>
            <option value="wiggle">Wiggle</option>
          </select>
        </div>
        <button class="btn btn-danger btn-small" onclick="editor.removeSelectedObject()">Remove Object</button>
      </div>
    `;

    // Set effect value
    document.getElementById("obj-effect").value = obj.effect || "";

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

      slider.addEventListener("input", () => {
        const value = parseFloat(slider.value);
        valueDisplay.textContent = value.toFixed(1) + suffix;
        this.updateSelectedObject();
      });
    });

    document
      .getElementById("obj-effect")
      .addEventListener("change", () => this.updateSelectedObject());
  }

  updateSelectedObject() {
    if (this.selectedObject === null || !this.currentScene) return;

    const scene = this.project.scenes[this.currentScene];
    const obj = scene.images[this.selectedObject];

    obj.x = parseFloat(document.getElementById("obj-x").value);
    obj.y = parseFloat(document.getElementById("obj-y").value);
    obj.scale = parseFloat(document.getElementById("obj-scale").value);
    obj.rotation = parseFloat(document.getElementById("obj-rotation").value);
    obj.zIndex = parseInt(document.getElementById("obj-zindex").value);
    obj.opacity = parseFloat(document.getElementById("obj-opacity").value);
    obj.effect = document.getElementById("obj-effect").value || undefined;

    this.updateObjectVisual();
    this.updateSceneObjectsList();
  }

  removeSelectedObject() {
    if (this.selectedObject === null || !this.currentScene) return;

    const scene = this.project.scenes[this.currentScene];
    scene.images.splice(this.selectedObject, 1);
    this.selectedObject = null;
    this.hideObjectControls();
    this.renderPreview();
    this.updateObjectProperties();
    this.updateSceneObjectsList();
  }

  startDrag(e, index) {
    e.preventDefault();
    e.stopPropagation();

    // Don't start dragging if we're scaling or rotating
    if (this.isScaling || this.isRotating) return;

    this.isDragging = true;
    this.selectObject(index);

    const previewScene = document.getElementById("preview-scene");
    const previewRect = previewScene.getBoundingClientRect();

    const mouseMoveHandler = (e) => {
      if (!this.isDragging) return;

      const x = ((e.clientX - previewRect.left) / previewRect.width) * 100;
      const y = ((e.clientY - previewRect.top) / previewRect.height) * 100;

      const scene = this.project.scenes[this.currentScene];
      const obj = scene.images[this.selectedObject];
      obj.x = Math.max(0, Math.min(100, x));
      obj.y = Math.max(0, Math.min(100, y));

      this.updateObjectVisual();
      this.updateObjectProperties();
      this.updateSceneObjectsList();
    };

    const mouseUpHandler = () => {
      this.isDragging = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  clearPreview() {
    const previewScene = document.getElementById("preview-scene");
    if (previewScene) {
      previewScene.innerHTML =
        '<div class="drop-zone">Select a scene to preview</div>';
      previewScene.style.backgroundImage = "none";
    }

    const objectProperties = document.getElementById("object-properties");
    if (objectProperties) {
      objectProperties.innerHTML = "";
    }

    this.selectedObject = null;
    this.hideObjectControls();
    this.updateSceneObjectsList();
  }

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

  closeModal() {
    const warningModal = document.getElementById("warning-modal");
    if (warningModal) {
      warningModal.style.display = "none";
    }
  }
}

// Initialize the editor when the page loads
document.addEventListener("DOMContentLoaded", () => {
  window.editor = new StoryEditor();
});
