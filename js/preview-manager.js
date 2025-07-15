// Preview management functionality

class PreviewManager {
  constructor() {
    this.selectedObject = null;
    this.isDragging = false;
    this.isScaling = false;
    this.isRotating = false;
    this.dragOffset = { x: 0, y: 0 };
    this.selectedUIElement = null;
    this.isDraggingUI = false;
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

    // Add keyboard shortcuts for copy/paste
    document.addEventListener("keydown", (e) =>
      this.handleKeyboardShortcuts(e)
    );
  }

  /**
   * Handle keyboard shortcuts
   * @param {Event} e - Keyboard event
   */
  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "c") {
        e.preventDefault();
        if (this.selectedUIElement) {
          this.copyUIElementPosition();
        } else if (this.selectedObject !== null) {
          this.copySelectedObject();
        }
      } else if (e.key === "v") {
        e.preventDefault();
        if (this.selectedUIElement) {
          this.pasteUIElementPosition();
        } else if (this.selectedObject !== null) {
          this.pasteObject();
        }
      }
    }
  }

  /**
   * Copy selected object
   */
  copySelectedObject() {
    if (
      this.selectedObject === null ||
      !window.editor ||
      !window.editor.currentScene
    )
      return;

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const obj = scene.images[this.selectedObject];

    if (obj && window.projectManager) {
      window.projectManager.copyObject(obj);
      this.showCopyFeedback();
    }
  }

  /**
   * Paste object
   */
  pasteObject() {
    if (!window.editor || !window.editor.currentScene || !window.projectManager)
      return;

    const objectData = window.projectManager.getPastedObject();
    if (objectData) {
      // Offset the pasted object slightly to avoid exact overlap
      const newObject = {
        ...objectData,
        x: Math.min(95, objectData.x + 5), // Offset by 5% but keep within bounds
        y: Math.min(95, objectData.y + 5),
        zIndex: Date.now(), // Ensure unique z-index
      };

      // Add to scene
      const project = window.editor.projectManager.getProject();
      const scene = project.scenes[window.editor.currentScene];
      if (!scene.images) scene.images = [];
      scene.images.push(newObject);

      // Re-render and select the new object
      window.previewManager.renderPreview(project, window.editor.currentScene);
      window.previewManager.selectObject(scene.images.length - 1);

      // Update UI
      if (window.editor) {
        window.editor.updateObjectProperties();
        window.editor.updateSceneObjectsList();
      }

      this.showPasteFeedback();
    }
  }
  copyUIElementPosition() {
    if (!this.selectedUIElement || !window.projectManager) return;

    const position = this.getUIElementPosition(this.selectedUIElement);
    if (position) {
      window.projectManager.copyPosition(position);
      this.showCopyFeedback();
    }
  }

  /**
   * Paste UI element position
   */
  pasteUIElementPosition() {
    if (!this.selectedUIElement || !window.projectManager) return;

    const position = window.projectManager.getPastedPosition();
    if (position) {
      this.setUIElementPosition(this.selectedUIElement, position);
      this.showPasteFeedback();
    }
  }

  /**
   * Get UI element position
   * @param {Element} element - UI element
   * @returns {Object|null} Position object or null
   */
  getUIElementPosition(element) {
    if (!window.editor || !window.editor.currentScene) return null;

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const uiType = element.dataset.uiType;
    const choiceIndex = element.dataset.choiceIndex;

    if (uiType === "choice" && choiceIndex !== undefined) {
      const choice = scene.choices[parseInt(choiceIndex)];
      return choice.position ? { ...choice.position } : null;
    } else if (uiType === "textContent" || uiType === "buttonsContainer") {
      return scene.uiPositions[uiType]
        ? { ...scene.uiPositions[uiType] }
        : null;
    }

    return null;
  }

  /**
   * Set UI element position
   * @param {Element} element - UI element
   * @param {Object} position - Position object with x, y, width
   */
  setUIElementPosition(element, position) {
    if (!window.editor || !window.editor.currentScene) return;

    const project = window.editor.projectManager.getProject();
    const uiType = element.dataset.uiType;
    const choiceIndex = element.dataset.choiceIndex;

    // Update visual position
    element.style.left = `${position.x}%`;
    element.style.top = `${position.y}%`;
    element.style.width = `${position.width}%`;

    // Update data
    if (uiType === "choice" && choiceIndex !== undefined) {
      window.sceneManager.updateChoicePosition(
        project,
        window.editor.currentScene,
        parseInt(choiceIndex),
        position.x,
        position.y,
        position.width
      );
    } else if (uiType === "textContent" || uiType === "buttonsContainer") {
      window.sceneManager.updateUIElementPosition(
        project,
        window.editor.currentScene,
        uiType,
        position.x,
        position.y,
        position.width
      );
    }

    // Update length slider if visible
    this.updateLengthSliderPosition(element);
    const lengthSlider = document.getElementById("length-slider");
    if (lengthSlider) {
      lengthSlider.value = position.width;
      const valueDisplay = document
        .getElementById("length-slider-container")
        ?.querySelector("span");
      if (valueDisplay) {
        valueDisplay.textContent = `${position.width}%`;
      }
    }
  }

  /**
   * Show copy feedback
   */
  showCopyFeedback() {
    this.showPositionFeedback("Copied!", "#27ae60");
  }

  /**
   * Show paste feedback
   */
  showPasteFeedback() {
    this.showPositionFeedback("Pasted!", "#3498db");
  }

  /**
   * Show position feedback
   * @param {string} message - Feedback message
   * @param {string} color - Feedback color
   */
  showPositionFeedback(message, color) {
    if (!this.selectedUIElement) return;

    const rect = this.selectedUIElement.getBoundingClientRect();
    const previewRect = document
      .getElementById("preview-scene")
      .getBoundingClientRect();

    const feedback = document.createElement("div");
    feedback.className = "position-feedback";
    feedback.textContent = message;
    feedback.style.position = "absolute";
    feedback.style.left = `${rect.left - previewRect.left}px`;
    feedback.style.top = `${rect.top - previewRect.top - 25}px`;
    feedback.style.background = color;
    feedback.style.color = "white";
    feedback.style.padding = "4px 8px";
    feedback.style.borderRadius = "4px";
    feedback.style.fontSize = "12px";
    feedback.style.fontWeight = "bold";
    feedback.style.zIndex = "1002";
    feedback.style.pointerEvents = "none";

    document.getElementById("preview-scene").appendChild(feedback);

    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 1000);
  }

  /**
   * Handle preview click
   * @param {Event} e - Click event
   */
  handlePreviewClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Deselect current object and UI element
    this.selectedObject = null;
    this.selectedUIElement = null;
    if (window.editor) {
      window.editor.updateObjectProperties();
      window.editor.updateSceneObjectsList();
    }
    this.hideObjectControls();
    this.hideUIElementSelection();
    this.hideLengthSlider();

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

        // Apply visual properties based on effect edit mode
        this.applyObjectVisualProperties(objElement, imageData, index);

        // Add locked styling if object is locked
        if (imageData.locked) {
          objElement.classList.add("locked-object");
        }

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

        // Only add interaction handlers if object is not locked
        if (!imageData.locked) {
          // Add click handler
          objElement.addEventListener("click", (e) => {
            e.stopPropagation();
            this.selectObject(index);
          });

          // Add context menu handler
          objElement.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this.selectObject(index);
            this.showObjectContextMenu(e, index);
          });

          // Add drag handlers
          objElement.addEventListener("mousedown", (e) =>
            this.startDrag(e, index)
          );
        } else {
          // Add locked indicator
          const lockIndicator = document.createElement("div");
          lockIndicator.className = "lock-indicator";
          lockIndicator.textContent = "🔒";
          lockIndicator.style.position = "absolute";
          lockIndicator.style.top = "5px";
          lockIndicator.style.right = "5px";
          lockIndicator.style.background = "rgba(0, 0, 0, 0.7)";
          lockIndicator.style.color = "white";
          lockIndicator.style.padding = "2px 4px";
          lockIndicator.style.borderRadius = "3px";
          lockIndicator.style.fontSize = "12px";
          lockIndicator.style.pointerEvents = "none";
          lockIndicator.style.zIndex = "10";
          objElement.appendChild(lockIndicator);
        }

        previewScene.appendChild(objElement);
      }
    }

    // Add text content with draggable positioning
    if (scene.content) {
      const textContent = document.createElement("div");
      textContent.className = "preview-text-content draggable-ui";
      textContent.dataset.uiType = "textContent";
      textContent.textContent = scene.content;

      // Position based on stored UI positions
      const textPos = scene.uiPositions?.textContent || {
        x: 50,
        y: 85,
        width: 80,
      };
      textContent.style.left = `${textPos.x}%`;
      textContent.style.top = `${textPos.y}%`;
      textContent.style.width = `${textPos.width}%`;
      textContent.style.transform = "translate(-50%, -50%)";

      // Add draggable functionality
      this.makeUIElementDraggable(textContent);

      previewScene.appendChild(textContent);
    }

    // Add choices as individual draggable buttons
    if (scene.type === "choice" && scene.choices && scene.choices.length > 0) {
      scene.choices.forEach((choice, index) => {
        const choiceBtn = document.createElement("button");
        choiceBtn.className = "preview-choice-button draggable-ui";
        choiceBtn.dataset.uiType = "choice";
        choiceBtn.dataset.choiceIndex = index;
        choiceBtn.textContent = choice.text;

        // Position based on stored choice position or fallback to container position
        let choicePos;
        if (choice.position) {
          choicePos = choice.position;
        } else {
          // Fallback to old container-based positioning with offset
          const containerPos = scene.uiPositions?.buttonsContainer || {
            x: 80,
            y: 85,
            width: 40,
          };
          const spacing = window.sceneManager
            ? window.sceneManager.CHOICE_VERTICAL_SPACING
            : 8;
          choicePos = {
            x: containerPos.x,
            y: containerPos.y + index * spacing, // Use configurable spacing
            width: containerPos.width,
          };
        }

        choiceBtn.style.left = `${choicePos.x}%`;
        choiceBtn.style.top = `${choicePos.y}%`;
        choiceBtn.style.width = `${choicePos.width}%`;
        choiceBtn.style.transform = "translate(-50%, -50%)";

        // Add draggable functionality
        this.makeUIElementDraggable(choiceBtn);

        previewScene.appendChild(choiceBtn);
      });
    } else if (scene.type === "image" && scene.nextScene !== undefined) {
      const continueBtn = document.createElement("button");
      continueBtn.className = "preview-continue-button draggable-ui";
      continueBtn.dataset.uiType = "buttonsContainer";
      continueBtn.textContent = "Continue";

      // Position based on stored UI positions
      const buttonPos = scene.uiPositions?.buttonsContainer || {
        x: 80,
        y: 85,
        width: 40,
      };
      continueBtn.style.left = `${buttonPos.x}%`;
      continueBtn.style.top = `${buttonPos.y}%`;
      continueBtn.style.width = `${buttonPos.width}%`;
      continueBtn.style.transform = "translate(-50%, -50%)";

      // Add draggable functionality
      this.makeUIElementDraggable(continueBtn);

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
   * Make UI element draggable
   * @param {Element} element - UI element to make draggable
   */
  makeUIElementDraggable(element) {
    element.style.cursor = "move";
    element.style.border = "2px dashed transparent";
    element.style.transition = "border-color 0.2s";

    element.addEventListener("mouseenter", () => {
      element.style.borderColor = "rgba(52, 152, 219, 0.5)";
    });

    element.addEventListener("mouseleave", () => {
      if (this.selectedUIElement !== element) {
        element.style.borderColor = "transparent";
      }
    });

    element.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectUIElement(element);
    });

    element.addEventListener("mousedown", (e) => {
      this.startUIElementDrag(e, element);
    });

    element.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showUIElementContextMenu(e, element);
    });
  }

  /**
   * Show object context menu
   * @param {Event} e - Right-click event
   * @param {number} objectIndex - Object index
   */
  showObjectContextMenu(e, objectIndex) {
    e.preventDefault();

    // Remove any existing context menu
    const existingMenu = document.getElementById("object-context-menu");
    if (existingMenu) {
      existingMenu.remove();
    }

    const menu = document.createElement("div");
    menu.id = "object-context-menu";
    menu.className = "context-menu";
    menu.style.position = "absolute";
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    menu.style.background = "#2c3e50";
    menu.style.border = "1px solid #34495e";
    menu.style.borderRadius = "4px";
    menu.style.padding = "4px 0";
    menu.style.zIndex = "2000";
    menu.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.3)";
    menu.style.minWidth = "140px";

    // Copy button
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy Object";
    copyBtn.className = "context-menu-item";
    copyBtn.style.display = "block";
    copyBtn.style.width = "100%";
    copyBtn.style.padding = "8px 12px";
    copyBtn.style.background = "none";
    copyBtn.style.border = "none";
    copyBtn.style.color = "#ecf0f1";
    copyBtn.style.cursor = "pointer";
    copyBtn.style.fontSize = "12px";
    copyBtn.style.textAlign = "left";
    copyBtn.addEventListener("click", () => {
      this.copySelectedObject();
      menu.remove();
    });
    copyBtn.addEventListener("mouseenter", () => {
      copyBtn.style.background = "#3498db";
    });
    copyBtn.addEventListener("mouseleave", () => {
      copyBtn.style.background = "none";
    });

    // Paste button
    const pasteBtn = document.createElement("button");
    pasteBtn.textContent = "Paste Object";
    pasteBtn.className = "context-menu-item";
    pasteBtn.style.display = "block";
    pasteBtn.style.width = "100%";
    pasteBtn.style.padding = "8px 12px";
    pasteBtn.style.background = "none";
    pasteBtn.style.border = "none";
    pasteBtn.style.color = "#ecf0f1";
    pasteBtn.style.cursor = "pointer";
    pasteBtn.style.fontSize = "12px";
    pasteBtn.style.textAlign = "left";
    pasteBtn.disabled = !window.projectManager?.hasClipboardObject();
    if (pasteBtn.disabled) {
      pasteBtn.style.color = "#7f8c8d";
      pasteBtn.style.cursor = "not-allowed";
    } else {
      pasteBtn.addEventListener("click", () => {
        this.pasteObject();
        menu.remove();
      });
      pasteBtn.addEventListener("mouseenter", () => {
        pasteBtn.style.background = "#3498db";
      });
      pasteBtn.addEventListener("mouseleave", () => {
        pasteBtn.style.background = "none";
      });
    }

    // Separator
    const separator = document.createElement("div");
    separator.style.height = "1px";
    separator.style.background = "#34495e";
    separator.style.margin = "4px 0";

    // Lock/Unlock button
    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const obj = scene.images[objectIndex];
    const isLocked = obj.locked;

    const lockBtn = document.createElement("button");
    lockBtn.textContent = isLocked ? "Unlock Object" : "Lock Object";
    lockBtn.className = "context-menu-item";
    lockBtn.style.display = "block";
    lockBtn.style.width = "100%";
    lockBtn.style.padding = "8px 12px";
    lockBtn.style.background = "none";
    lockBtn.style.border = "none";
    lockBtn.style.color = "#ecf0f1";
    lockBtn.style.cursor = "pointer";
    lockBtn.style.fontSize = "12px";
    lockBtn.style.textAlign = "left";
    lockBtn.addEventListener("click", () => {
      if (window.editor) {
        window.editor.toggleObjectLock(objectIndex);
      }
      menu.remove();
    });
    lockBtn.addEventListener("mouseenter", () => {
      lockBtn.style.background = "#f39c12";
    });
    lockBtn.addEventListener("mouseleave", () => {
      lockBtn.style.background = "none";
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete Object";
    deleteBtn.className = "context-menu-item";
    deleteBtn.style.display = "block";
    deleteBtn.style.width = "100%";
    deleteBtn.style.padding = "8px 12px";
    deleteBtn.style.background = "none";
    deleteBtn.style.border = "none";
    deleteBtn.style.color = "#ecf0f1";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.fontSize = "12px";
    deleteBtn.style.textAlign = "left";
    deleteBtn.addEventListener("click", () => {
      if (window.editor) {
        window.editor.removeObjectFromList(objectIndex);
      }
      menu.remove();
    });
    deleteBtn.addEventListener("mouseenter", () => {
      deleteBtn.style.background = "#e74c3c";
    });
    deleteBtn.addEventListener("mouseleave", () => {
      deleteBtn.style.background = "none";
    });

    menu.appendChild(copyBtn);
    menu.appendChild(pasteBtn);
    menu.appendChild(separator);
    menu.appendChild(lockBtn);
    menu.appendChild(deleteBtn);

    document.body.appendChild(menu);

    // Close menu when clicking elsewhere
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };

    // Use setTimeout to prevent immediate closure
    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 0);
  }
  showUIElementContextMenu(e, element) {
    e.preventDefault();

    // Remove any existing context menu
    const existingMenu = document.getElementById("ui-context-menu");
    if (existingMenu) {
      existingMenu.remove();
    }

    const menu = document.createElement("div");
    menu.id = "ui-context-menu";
    menu.className = "context-menu";
    menu.style.position = "absolute";
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    menu.style.background = "#2c3e50";
    menu.style.border = "1px solid #34495e";
    menu.style.borderRadius = "4px";
    menu.style.padding = "4px 0";
    menu.style.zIndex = "2000";
    menu.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.3)";
    menu.style.minWidth = "120px";

    // Copy button
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy Position";
    copyBtn.className = "context-menu-item";
    copyBtn.style.display = "block";
    copyBtn.style.width = "100%";
    copyBtn.style.padding = "8px 12px";
    copyBtn.style.background = "none";
    copyBtn.style.border = "none";
    copyBtn.style.color = "#ecf0f1";
    copyBtn.style.cursor = "pointer";
    copyBtn.style.fontSize = "12px";
    copyBtn.style.textAlign = "left";
    copyBtn.addEventListener("click", () => {
      this.copyUIElementPosition();
      menu.remove();
    });
    copyBtn.addEventListener("mouseenter", () => {
      copyBtn.style.background = "#3498db";
    });
    copyBtn.addEventListener("mouseleave", () => {
      copyBtn.style.background = "none";
    });

    // Paste button
    const pasteBtn = document.createElement("button");
    pasteBtn.textContent = "Paste Position";
    pasteBtn.className = "context-menu-item";
    pasteBtn.style.display = "block";
    pasteBtn.style.width = "100%";
    pasteBtn.style.padding = "8px 12px";
    pasteBtn.style.background = "none";
    pasteBtn.style.border = "none";
    pasteBtn.style.color = "#ecf0f1";
    pasteBtn.style.cursor = "pointer";
    pasteBtn.style.fontSize = "12px";
    pasteBtn.style.textAlign = "left";
    pasteBtn.disabled = !window.projectManager?.hasClipboardPosition();
    if (pasteBtn.disabled) {
      pasteBtn.style.color = "#7f8c8d";
      pasteBtn.style.cursor = "not-allowed";
    } else {
      pasteBtn.addEventListener("click", () => {
        this.pasteUIElementPosition();
        menu.remove();
      });
      pasteBtn.addEventListener("mouseenter", () => {
        pasteBtn.style.background = "#3498db";
      });
      pasteBtn.addEventListener("mouseleave", () => {
        pasteBtn.style.background = "none";
      });
    }

    // Separator
    const separator = document.createElement("div");
    separator.style.height = "1px";
    separator.style.background = "#34495e";
    separator.style.margin = "4px 0";

    // Set as Default button
    const setDefaultBtn = document.createElement("button");
    setDefaultBtn.textContent = "Set as Default";
    setDefaultBtn.className = "context-menu-item";
    setDefaultBtn.style.display = "block";
    setDefaultBtn.style.width = "100%";
    setDefaultBtn.style.padding = "8px 12px";
    setDefaultBtn.style.background = "none";
    setDefaultBtn.style.border = "none";
    setDefaultBtn.style.color = "#ecf0f1";
    setDefaultBtn.style.cursor = "pointer";
    setDefaultBtn.style.fontSize = "12px";
    setDefaultBtn.style.textAlign = "left";
    setDefaultBtn.addEventListener("click", () => {
      this.setUIElementAsDefault(element);
      menu.remove();
    });
    setDefaultBtn.addEventListener("mouseenter", () => {
      setDefaultBtn.style.background = "#27ae60";
    });
    setDefaultBtn.addEventListener("mouseleave", () => {
      setDefaultBtn.style.background = "none";
    });

    // Reset to Default button
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset to Default";
    resetBtn.className = "context-menu-item";
    resetBtn.style.display = "block";
    resetBtn.style.width = "100%";
    resetBtn.style.padding = "8px 12px";
    resetBtn.style.background = "none";
    resetBtn.style.border = "none";
    resetBtn.style.color = "#ecf0f1";
    resetBtn.style.cursor = "pointer";
    resetBtn.style.fontSize = "12px";
    resetBtn.style.textAlign = "left";
    resetBtn.addEventListener("click", () => {
      this.resetUIElementToDefault(element);
      menu.remove();
    });
    resetBtn.addEventListener("mouseenter", () => {
      resetBtn.style.background = "#f39c12";
    });
    resetBtn.addEventListener("mouseleave", () => {
      resetBtn.style.background = "none";
    });

    menu.appendChild(copyBtn);
    menu.appendChild(pasteBtn);
    menu.appendChild(separator);
    menu.appendChild(setDefaultBtn);
    menu.appendChild(resetBtn);

    document.body.appendChild(menu);

    // Close menu when clicking elsewhere
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };

    // Use setTimeout to prevent immediate closure
    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 0);
  }

  /**
   * Reset UI element position to default
   * @param {Element} element - UI element
   */
  resetUIElementToDefault(element) {
    if (!window.projectManager) return;

    const uiType = element.dataset.uiType;
    const defaults = window.projectManager.getDefaultUIPositions();
    let defaultPosition;

    // Get the appropriate default position
    if (uiType === "choice") {
      defaultPosition = { ...defaults.choiceButton };
    } else if (uiType === "textContent") {
      defaultPosition = { ...defaults.textContent };
    } else if (uiType === "buttonsContainer") {
      defaultPosition = { ...defaults.buttonsContainer };
    } else {
      return;
    }

    // Apply the default position
    this.setUIElementPosition(element, defaultPosition);
    this.showPositionFeedback("Reset to Default!", "#f39c12");
  }
  setUIElementAsDefault(element) {
    const position = this.getUIElementPosition(element);
    if (position && window.projectManager) {
      const uiType = element.dataset.uiType;
      let defaultType = uiType;

      // Map UI types to default types
      if (uiType === "choice") {
        defaultType = "choiceButton";
      }

      window.projectManager.updateDefaultUIPosition(
        defaultType,
        position.x,
        position.y,
        position.width
      );
      this.showPositionFeedback("Set as Default!", "#27ae60");
    }
  }

  /**
   * Select UI element
   * @param {Element} element - UI element to select
   */
  selectUIElement(element) {
    // Deselect any selected object
    this.selectedObject = null;
    this.hideObjectControls();
    document.querySelectorAll(".preview-object").forEach((obj) => {
      obj.classList.remove("selected");
    });

    // Select UI element
    this.selectedUIElement = element;
    this.showUIElementSelection(element);
    this.showLengthSlider(element);

    if (window.editor) {
      window.editor.updateObjectProperties();
      window.editor.updateSceneObjectsList();
    }
  }

  /**
   * Show length slider for selected UI element
   * @param {Element} element - Selected UI element
   */
  showLengthSlider(element) {
    // Remove any existing length slider
    this.hideLengthSlider();

    const rect = element.getBoundingClientRect();
    const previewRect = document
      .getElementById("preview-scene")
      .getBoundingClientRect();

    // Create length slider container
    const sliderContainer = document.createElement("div");
    sliderContainer.className = "length-slider-container";
    sliderContainer.id = "length-slider-container";

    // Position above the element
    sliderContainer.style.position = "absolute";
    sliderContainer.style.left = `${rect.left - previewRect.left}px`;
    sliderContainer.style.top = `${rect.top - previewRect.top - 40}px`;
    sliderContainer.style.zIndex = "1000";
    sliderContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    sliderContainer.style.padding = "5px 10px";
    sliderContainer.style.borderRadius = "4px";
    sliderContainer.style.display = "flex";
    sliderContainer.style.alignItems = "center";
    sliderContainer.style.gap = "8px";

    // Create slider label
    const label = document.createElement("label");
    label.textContent = "Width:";
    label.style.color = "white";
    label.style.fontSize = "12px";
    label.style.minWidth = "40px";

    // Create slider
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "10";
    slider.max = "100";
    slider.step = "1";
    slider.id = "length-slider";
    slider.style.width = "100px";

    // Get current width
    const currentWidth = this.getElementWidth(element);
    slider.value = currentWidth;

    // Create value display
    const valueDisplay = document.createElement("span");
    valueDisplay.textContent = `${currentWidth}%`;
    valueDisplay.style.color = "white";
    valueDisplay.style.fontSize = "12px";
    valueDisplay.style.minWidth = "35px";

    // Add event listener
    slider.addEventListener("input", (e) => {
      const newWidth = parseFloat(e.target.value);
      valueDisplay.textContent = `${newWidth}%`;
      this.updateElementWidth(element, newWidth);
    });

    sliderContainer.appendChild(label);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);

    document.getElementById("preview-scene").appendChild(sliderContainer);
  }

  /**
   * Hide length slider
   */
  hideLengthSlider() {
    const existingSlider = document.getElementById("length-slider-container");
    if (existingSlider) {
      existingSlider.remove();
    }
  }

  /**
   * Get element width percentage
   * @param {Element} element - UI element
   * @returns {number} Width percentage
   */
  getElementWidth(element) {
    const uiType = element.dataset.uiType;
    const choiceIndex = element.dataset.choiceIndex;

    if (!window.editor || !window.editor.currentScene) return 40;

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];

    if (uiType === "choice" && choiceIndex !== undefined) {
      const choice = scene.choices[parseInt(choiceIndex)];
      return choice.position?.width || 40;
    } else if (uiType === "textContent") {
      return scene.uiPositions?.textContent?.width || 80;
    } else if (uiType === "buttonsContainer") {
      return scene.uiPositions?.buttonsContainer?.width || 40;
    }

    return 40;
  }

  /**
   * Update element width
   * @param {Element} element - UI element
   * @param {number} width - New width percentage
   */
  updateElementWidth(element, width) {
    element.style.width = `${width}%`;

    const uiType = element.dataset.uiType;
    const choiceIndex = element.dataset.choiceIndex;

    if (!window.editor || !window.editor.currentScene) return;

    const project = window.editor.projectManager.getProject();

    if (uiType === "choice" && choiceIndex !== undefined) {
      // Update individual choice width
      window.sceneManager.updateChoicePosition(
        project,
        window.editor.currentScene,
        parseInt(choiceIndex),
        undefined, // Don't change x
        undefined, // Don't change y
        width
      );

      // Update choice position sliders
      if (window.uiManager) {
        window.uiManager.updateChoicePositionSliders(
          window.editor.currentScene,
          parseInt(choiceIndex),
          { width: width }
        );
      }
    } else {
      // Update container width
      const currentPos =
        project.scenes[window.editor.currentScene].uiPositions[uiType];
      window.sceneManager.updateUIElementPosition(
        project,
        window.editor.currentScene,
        uiType,
        currentPos.x,
        currentPos.y,
        width
      );
    }
  }

  /**
   * Show UI element selection
   * @param {Element} element - Selected UI element
   */
  showUIElementSelection(element) {
    // Remove selection from all UI elements
    document.querySelectorAll(".draggable-ui").forEach((el) => {
      el.style.borderColor = "transparent";
    });

    // Highlight selected element
    element.style.borderColor = "#e74c3c";
  }

  /**
   * Hide UI element selection
   */
  hideUIElementSelection() {
    document.querySelectorAll(".draggable-ui").forEach((el) => {
      el.style.borderColor = "transparent";
    });
    this.hideLengthSlider();
  }

  /**
   * Start UI element drag
   * @param {Event} e - Mouse event
   * @param {Element} element - UI element to drag
   */
  startUIElementDrag(e, element) {
    e.preventDefault();
    e.stopPropagation();

    this.isDraggingUI = true;
    this.selectUIElement(element);

    const previewScene = document.getElementById("preview-scene");
    const previewRect = previewScene.getBoundingClientRect();

    const mouseMoveHandler = (e) => {
      if (!this.isDraggingUI) return;

      const x = ((e.clientX - previewRect.left) / previewRect.width) * 100;
      const y = ((e.clientY - previewRect.top) / previewRect.height) * 100;

      // Constrain to preview area
      const constrainedX = Math.max(0, Math.min(100, x));
      const constrainedY = Math.max(0, Math.min(100, y));

      element.style.left = `${constrainedX}%`;
      element.style.top = `${constrainedY}%`;

      // Update scene data based on element type
      if (window.editor && window.editor.currentScene) {
        const project = window.editor.projectManager.getProject();
        const uiType = element.dataset.uiType;
        const choiceIndex = element.dataset.choiceIndex;

        if (uiType === "choice" && choiceIndex !== undefined) {
          // Update individual choice position
          window.sceneManager.updateChoicePosition(
            project,
            window.editor.currentScene,
            parseInt(choiceIndex),
            constrainedX,
            constrainedY
          );

          // Update choice position sliders
          if (window.uiManager) {
            window.uiManager.updateChoicePositionSliders(
              window.editor.currentScene,
              parseInt(choiceIndex),
              { x: constrainedX, y: constrainedY }
            );
          }
        } else {
          // Update container position
          window.sceneManager.updateUIElementPosition(
            project,
            window.editor.currentScene,
            uiType,
            constrainedX,
            constrainedY
          );

          // Update the UI sliders to reflect the new position
          const scene = project.scenes[window.editor.currentScene];
          if (window.uiManager) {
            window.uiManager.updateUIPositionSliders(scene);
          }
        }
      }

      // Update length slider position
      this.updateLengthSliderPosition(element);
    };

    const mouseUpHandler = () => {
      this.isDraggingUI = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  /**
   * Update length slider position
   * @param {Element} element - UI element
   */
  updateLengthSliderPosition(element) {
    const sliderContainer = document.getElementById("length-slider-container");
    if (!sliderContainer) return;

    const rect = element.getBoundingClientRect();
    const previewRect = document
      .getElementById("preview-scene")
      .getBoundingClientRect();

    sliderContainer.style.left = `${rect.left - previewRect.left}px`;
    sliderContainer.style.top = `${rect.top - previewRect.top - 40}px`;
  }

  /**
   * Apply visual properties to object element based on effect edit mode
   * @param {Element} objElement - Object DOM element
   * @param {Object} imageData - Object data
   * @param {number} index - Object index
   */
  applyObjectVisualProperties(objElement, imageData, index) {
    let x = imageData.x;
    let y = imageData.y;
    let scale = imageData.scale;

    // If this is the selected object and has slide_to or scale_to effect,
    // show the appropriate start/end position based on edit mode
    if (this.selectedObject === index && window.uiManager) {
      const editMode = window.uiManager.getCurrentEffectEditMode();

      if (imageData.effect === "slide_to") {
        if (editMode === "start") {
          x =
            imageData.moveStartX !== undefined
              ? imageData.moveStartX
              : imageData.x;
          y =
            imageData.moveStartY !== undefined
              ? imageData.moveStartY
              : imageData.y;
        } else if (editMode === "end") {
          x =
            imageData.moveEndX !== undefined ? imageData.moveEndX : imageData.x;
          y =
            imageData.moveEndY !== undefined ? imageData.moveEndY : imageData.y;
        }
      } else if (imageData.effect === "scale_to") {
        if (editMode === "start") {
          scale =
            imageData.scaleStart !== undefined
              ? imageData.scaleStart
              : imageData.scale;
        } else if (editMode === "end") {
          scale =
            imageData.scaleEnd !== undefined
              ? imageData.scaleEnd
              : imageData.scale;
        }
      }
    }

    // Apply the calculated properties
    objElement.style.left = `${x}%`;
    objElement.style.top = `${y}%`;
    objElement.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${
      imageData.rotation || 0
    }deg)`;
    objElement.style.zIndex = imageData.zIndex || 1;
    objElement.style.opacity = imageData.opacity || 1;
  }

  /**
   * Update object visual for effect mode
   * @param {string} mode - 'start' or 'end'
   */
  updateObjectVisualForEffectMode(mode) {
    if (
      this.selectedObject === null ||
      !window.editor ||
      !window.editor.currentScene
    ) {
      return;
    }

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const obj = scene.images[this.selectedObject];

    if (!obj) return;

    const objElement = document.querySelector(
      `[data-image-index="${this.selectedObject}"]`
    );
    if (!objElement) return;

    // Apply the visual properties for the current mode
    this.applyObjectVisualProperties(objElement, obj, this.selectedObject);
  }

  /**
   * Select object
   * @param {number} index - Object index
   */
  selectObject(index) {
    this.selectedObject = index;
    this.selectedUIElement = null;
    this.hideUIElementSelection();

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
   * Get selected UI element
   * @returns {Element} Selected UI element
   */
  getSelectedUIElement() {
    return this.selectedUIElement;
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

    // Determine which scale property to modify based on effect and edit mode
    let scaleProperty = "scale";
    if (obj.effect === "scale_to" && window.uiManager) {
      const editMode = window.uiManager.getCurrentEffectEditMode();
      if (editMode === "start") {
        scaleProperty = "scaleStart";
        if (obj.scaleStart === undefined) obj.scaleStart = obj.scale;
      } else if (editMode === "end") {
        scaleProperty = "scaleEnd";
        if (obj.scaleEnd === undefined) obj.scaleEnd = obj.scale;
      }
    }

    const startScale = obj[scaleProperty];

    const mouseMoveHandler = (e) => {
      if (!this.isScaling) return;

      const deltaY = startMouseY - e.clientY;
      const scaleChange = deltaY * 0.01;
      obj[scaleProperty] = Math.max(0.1, Math.min(5, startScale + scaleChange));

      this.updateObjectVisual();
      if (window.editor) {
        window.editor.updateObjectProperties();
        window.editor.updateSceneObjectsList();
        // Update drawer content if open
        if (obj.effect === "scale_to") {
          window.uiManager.updateEffectDrawerContent(obj);
        }
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
      // Apply visual properties considering effect edit mode
      this.applyObjectVisualProperties(objElement, obj, this.selectedObject);
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

      // Determine which position properties to modify based on effect and edit mode
      if (obj.effect === "slide_to" && window.uiManager) {
        const editMode = window.uiManager.getCurrentEffectEditMode();
        if (editMode === "start") {
          if (obj.moveStartX === undefined) obj.moveStartX = obj.x;
          if (obj.moveStartY === undefined) obj.moveStartY = obj.y;
          obj.moveStartX = Math.max(0, Math.min(100, x));
          obj.moveStartY = Math.max(0, Math.min(100, y));
        } else if (editMode === "end") {
          if (obj.moveEndX === undefined) obj.moveEndX = obj.x;
          if (obj.moveEndY === undefined) obj.moveEndY = obj.y;
          obj.moveEndX = Math.max(0, Math.min(100, x));
          obj.moveEndY = Math.max(0, Math.min(100, y));
        }
        // Update drawer content if open
        if (window.uiManager) {
          window.uiManager.updateEffectDrawerContent(obj);
        }
      } else {
        // Standard position update
        obj.x = Math.max(0, Math.min(100, x));
        obj.y = Math.max(0, Math.min(100, y));
      }

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
    this.selectedUIElement = null;
    this.hideObjectControls();
    this.hideUIElementSelection();
    this.hideLengthSlider();

    // Remove any context menus
    const existingUIMenu = document.getElementById("ui-context-menu");
    if (existingUIMenu) {
      existingUIMenu.remove();
    }
    const existingObjectMenu = document.getElementById("object-context-menu");
    if (existingObjectMenu) {
      existingObjectMenu.remove();
    }
  }
}
