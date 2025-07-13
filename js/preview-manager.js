// Preview management functionality

class PreviewManager {
  constructor() {
    this.selectedObject = null;
    this.isDragging = false;
    this.isScaling = false;
    this.isRotating = false;
    this.dragOffset = { x: 0, y: 0 };
  }

  /**
   * Setup preview event listeners
   */
  setupPreviewEventListeners() {
    const previewScene = document.getElementById("preview-scene");
    if (previewScene) {
      previewScene.addEventListener("click", (e) => this.handlePreviewClick(e));
      previewScene.addEventListener("dragover", (e) => this.handleDragOver(e));
      previewScene.addEventListener("drop", (e) => this.handleDrop(e));
    }
  }

  /**
   * Handle preview click
   * @param {Event} e - Click event
   */
  handlePreviewClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Deselect current object
    this.selectedObject = null;
    if (window.editor) {
      window.editor.updateObjectProperties();
      window.editor.updateSceneObjectsList();
    }
    this.hideObjectControls();

    // Remove selection from all objects
    document.querySelectorAll(".preview-object").forEach((obj) => {
      obj.classList.remove("selected");
    });
  }

  /**
   * Handle drag over
   * @param {Event} e - Drag event
   */
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  /**
   * Handle drop
   * @param {Event} e - Drop event
   */
  handleDrop(e) {
    e.preventDefault();
    const objPath = e.dataTransfer.getData("text/plain");

    if (objPath && window.editor) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      window.editor.addObjectToScene(objPath, x, y);
    }
  }

  /**
   * Render preview
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID to render
   */
  async renderPreview(project, sceneId) {
    const previewScene = document.getElementById("preview-scene");

    if (!sceneId || !project.scenes[sceneId]) {
      previewScene.innerHTML =
        '<div class="drop-zone">Select a scene to preview</div>';
      return;
    }

    const scene = project.scenes[sceneId];

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

  /**
   * Select object
   * @param {number} index - Object index
   */
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

    if (window.editor) {
      window.editor.updateObjectProperties();
      window.editor.updateSceneObjectsList();
    }
    this.showObjectControls();
  }

  /**
   * Get selected object
   * @returns {number} Selected object index
   */
  getSelectedObject() {
    return this.selectedObject;
  }

  /**
   * Deselect object
   */
  deselectObject() {
    this.selectedObject = null;
    this.hideObjectControls();

    document.querySelectorAll(".preview-object").forEach((obj) => {
      obj.classList.remove("selected");
    });
  }

  /**
   * Maintain selection after re-render
   */
  maintainSelection() {
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

  /**
   * Show object controls
   */
  showObjectControls() {
    if (this.selectedObject === null) return;

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

  /**
   * Hide object controls
   */
  hideObjectControls() {
    const existingControls = document.getElementById("object-controls");
    if (existingControls) {
      existingControls.remove();
    }
  }

  /**
   * Start scaling
   * @param {Event} e - Mouse event
   */
  startScaling(e) {
    e.preventDefault();
    e.stopPropagation();
    this.isScaling = true;

    if (!window.editor || !window.editor.currentScene) return;

    const startMouseY = e.clientY;
    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const obj = scene.images[this.selectedObject];
    const startScale = obj.scale;

    const mouseMoveHandler = (e) => {
      if (!this.isScaling) return;

      const deltaY = startMouseY - e.clientY;
      const scaleChange = deltaY * 0.01;
      obj.scale = Math.max(0.1, Math.min(5, startScale + scaleChange));

      this.updateObjectVisual();
      if (window.editor) {
        window.editor.updateObjectProperties();
        window.editor.updateSceneObjectsList();
      }
    };

    const mouseUpHandler = () => {
      this.isScaling = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  /**
   * Start rotating
   * @param {Event} e - Mouse event
   */
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

    if (!window.editor || !window.editor.currentScene) return;

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const obj = scene.images[this.selectedObject];

    const mouseMoveHandler = (e) => {
      if (!this.isRotating) return;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const rotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      obj.rotation = Math.round(rotation);

      this.updateObjectVisual();
      if (window.editor) {
        window.editor.updateObjectProperties();
        window.editor.updateSceneObjectsList();
      }
    };

    const mouseUpHandler = () => {
      this.isRotating = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  /**
   * Update object visual
   */
  updateObjectVisual() {
    if (
      this.selectedObject === null ||
      !window.editor ||
      !window.editor.currentScene
    )
      return;

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
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

  /**
   * Start dragging object
   * @param {Event} e - Mouse event
   * @param {number} index - Object index
   */
  startDrag(e, index) {
    e.preventDefault();
    e.stopPropagation();

    // Don't start dragging if we're scaling or rotating
    if (this.isScaling || this.isRotating) return;

    this.isDragging = true;
    this.selectObject(index);

    if (!window.editor || !window.editor.currentScene) return;

    const previewScene = document.getElementById("preview-scene");
    const previewRect = previewScene.getBoundingClientRect();

    const mouseMoveHandler = (e) => {
      if (!this.isDragging) return;

      const x = ((e.clientX - previewRect.left) / previewRect.width) * 100;
      const y = ((e.clientY - previewRect.top) / previewRect.height) * 100;

      const project = window.editor.projectManager.getProject();
      const scene = project.scenes[window.editor.currentScene];
      const obj = scene.images[this.selectedObject];
      obj.x = Math.max(0, Math.min(100, x));
      obj.y = Math.max(0, Math.min(100, y));

      this.updateObjectVisual();
      if (window.editor) {
        window.editor.updateObjectProperties();
        window.editor.updateSceneObjectsList();
      }
    };

    const mouseUpHandler = () => {
      this.isDragging = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  /**
   * Clear preview
   */
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
  }
}
