// Scene management functionality

class SceneManager {
  constructor() {
    this.currentScene = null;
    this.draggedScene = null;
    this.insertionIndicator = null;
  }

  /**
   * Add new scene
   * @param {Object} project - Project object
   * @returns {string} New scene ID
   */
  addScene(project) {
    const sceneId = Utils.getNextSceneId(project.scenes);
    const newScene = {
      id: `scene_${sceneId}`,
      type: "choice",
      content: "New scene content",
      choices: [],
    };

    project.scenes[sceneId] = newScene;
    project.totalScenes = Object.keys(project.scenes).length;
    return sceneId;
  }

  /**
   * Duplicate scene
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID to duplicate
   * @returns {string} New scene ID
   */
  duplicateScene(project, sceneId) {
    if (!project.scenes[sceneId]) return null;

    const newSceneId = Utils.getNextSceneId(project.scenes);
    const currentSceneData = project.scenes[sceneId];
    const duplicatedScene = JSON.parse(JSON.stringify(currentSceneData));

    duplicatedScene.id = `scene_${newSceneId}`;

    project.scenes[newSceneId] = duplicatedScene;
    project.totalScenes = Object.keys(project.scenes).length;
    return newSceneId;
  }

  /**
   * Delete scene
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID to delete
   */
  deleteScene(project, sceneId) {
    if (!project.scenes[sceneId]) return;

    delete project.scenes[sceneId];
    project.totalScenes = Object.keys(project.scenes).length;

    // Clean up references to deleted scene
    Utils.cleanupDeletedSceneReferences(project.scenes, sceneId);
  }

  /**
   * Select scene
   * @param {string} sceneId - Scene ID to select
   */
  selectScene(sceneId) {
    this.currentScene = sceneId;
  }

  /**
   * Get current scene
   * @returns {string} Current scene ID
   */
  getCurrentScene() {
    return this.currentScene;
  }

  /**
   * Refresh scene list in UI
   * @param {Object} project - Project object
   */
  refreshSceneList(project) {
    const sceneList = document.getElementById("scene-list");
    if (!sceneList) {
      console.warn("Scene list element not found");
      return;
    }

    sceneList.innerHTML = "";

    // Get ordered scene keys (sorted numerically)
    const orderedSceneKeys = Utils.getOrderedSceneKeys(project.scenes);

    orderedSceneKeys.forEach((sceneId, index) => {
      const scene = project.scenes[sceneId];
      const sceneItem = document.createElement("div");
      sceneItem.className = "scene-item";
      sceneItem.dataset.sceneId = sceneId;
      sceneItem.dataset.sceneIndex = index;
      sceneItem.draggable = true;
      sceneItem.innerHTML = `
        <div class="scene-item-id">${sceneId}</div>
      `;

      // Add click handler (not drag start)
      sceneItem.addEventListener("click", (e) => {
        if (!this.draggedScene && window.editor) {
          window.editor.selectScene(sceneId);
        }
      });

      // Add drag handlers
      sceneItem.addEventListener("dragstart", (e) =>
        this.handleSceneDragStart(e, sceneId, index)
      );
      sceneItem.addEventListener("dragend", (e) => this.handleSceneDragEnd(e));
      sceneItem.addEventListener("dragover", (e) =>
        this.handleSceneDragOver(e, sceneId, index)
      );
      sceneItem.addEventListener("drop", (e) =>
        this.handleSceneDrop(e, sceneId, index)
      );
      sceneItem.addEventListener("dragenter", (e) =>
        this.handleSceneDragEnter(e)
      );
      sceneItem.addEventListener("dragleave", (e) =>
        this.handleSceneDragLeave(e)
      );

      sceneList.appendChild(sceneItem);
    });

    // Create insertion indicator
    this.createInsertionIndicator();
  }

  /**
   * Create insertion indicator for scene reordering
   */
  createInsertionIndicator() {
    const sceneList = document.getElementById("scene-list");
    if (!this.insertionIndicator) {
      this.insertionIndicator = document.createElement("div");
      this.insertionIndicator.className = "scene-insertion-indicator";
      sceneList.appendChild(this.insertionIndicator);
    }
  }

  /**
   * Handle scene drag start
   * @param {Event} e - Drag event
   * @param {string} sceneId - Scene ID
   * @param {number} index - Scene index
   */
  handleSceneDragStart(e, sceneId, index) {
    this.draggedScene = { id: sceneId, index: index };
    e.currentTarget.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sceneId);

    // Prevent text selection during drag
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  }

  /**
   * Handle scene drag end
   * @param {Event} e - Drag event
   */
  handleSceneDragEnd(e) {
    e.currentTarget.classList.remove("dragging");
    this.draggedScene = null;
    this.hideInsertionIndicator();

    // Remove drag-over class from all items
    document.querySelectorAll(".scene-item").forEach((item) => {
      item.classList.remove("drag-over");
    });
  }

  /**
   * Handle scene drag over
   * @param {Event} e - Drag event
   * @param {string} sceneId - Scene ID
   * @param {number} index - Scene index
   */
  handleSceneDragOver(e, sceneId, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!this.draggedScene || this.draggedScene.id === sceneId) {
      return;
    }

    // Calculate drop position
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const dropPosition = e.clientX < midpoint ? "before" : "after";

    this.showInsertionIndicator(e.currentTarget, dropPosition);
  }

  /**
   * Handle scene drag enter
   * @param {Event} e - Drag event
   */
  handleSceneDragEnter(e) {
    e.preventDefault();
    if (this.draggedScene) {
      e.currentTarget.classList.add("drag-over");
    }
  }

  /**
   * Handle scene drag leave
   * @param {Event} e - Drag event
   */
  handleSceneDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  /**
   * Handle scene drop
   * @param {Event} e - Drop event
   * @param {string} targetSceneId - Target scene ID
   * @param {number} targetIndex - Target index
   */
  handleSceneDrop(e, targetSceneId, targetIndex) {
    e.preventDefault();

    if (!this.draggedScene || this.draggedScene.id === targetSceneId) {
      return;
    }

    // Calculate drop position
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const dropPosition = e.clientX < midpoint ? "before" : "after";

    let newIndex = targetIndex;
    if (dropPosition === "after") {
      newIndex = targetIndex + 1;
    }

    // Adjust for dragging item removal
    if (this.draggedScene.index < newIndex) {
      newIndex--;
    }

    if (window.editor) {
      window.editor.reorderScene(this.draggedScene.id, newIndex);
    }
    this.hideInsertionIndicator();
  }

  /**
   * Show insertion indicator
   * @param {Element} targetElement - Target element
   * @param {string} position - Position ('before' or 'after')
   */
  showInsertionIndicator(targetElement, position) {
    if (!this.insertionIndicator) return;

    const rect = targetElement.getBoundingClientRect();
    const containerRect = document
      .getElementById("scene-list")
      .getBoundingClientRect();

    let left;
    if (position === "before") {
      left = rect.left - containerRect.left - 2;
    } else {
      left = rect.right - containerRect.left + 2;
    }

    this.insertionIndicator.style.left = `${left}px`;
    this.insertionIndicator.classList.add("visible");
  }

  /**
   * Hide insertion indicator
   */
  hideInsertionIndicator() {
    if (this.insertionIndicator) {
      this.insertionIndicator.classList.remove("visible");
    }
  }

  /**
   * Update active scene in list
   */
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

  /**
   * Reorder scene
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID to reorder
   * @param {number} newIndex - New index position
   */
  reorderScene(project, sceneId, newIndex) {
    const orderedSceneKeys = Utils.getOrderedSceneKeys(project.scenes);
    const currentIndex = orderedSceneKeys.indexOf(sceneId);

    if (currentIndex === -1 || currentIndex === newIndex) {
      return;
    }

    // Create new ordered array
    const newOrderedScenes = [...orderedSceneKeys];
    newOrderedScenes.splice(currentIndex, 1);
    newOrderedScenes.splice(newIndex, 0, sceneId);

    // Create ID mapping for renumbering
    const idMapping = {};
    newOrderedScenes.forEach((oldId, index) => {
      const newId = (index + 1).toString();
      idMapping[oldId] = newId;
    });

    // Apply the renumbering
    this.renumberScenes(project, idMapping);

    // Update current scene selection
    if (this.currentScene) {
      this.currentScene = idMapping[this.currentScene];
    }

    return idMapping;
  }

  /**
   * Renumber scenes based on ID mapping
   * @param {Object} project - Project object
   * @param {Object} idMapping - ID mapping object
   */
  renumberScenes(project, idMapping) {
    const newScenes = {};
    const oldScenes = { ...project.scenes };

    // First pass: Create new scene objects with updated IDs
    Object.keys(oldScenes).forEach((oldId) => {
      const newId = idMapping[oldId];
      const scene = { ...oldScenes[oldId] };
      scene.id = `scene_${newId}`;
      newScenes[newId] = scene;
    });

    // Second pass: Update all references
    Object.keys(newScenes).forEach((sceneId) => {
      const scene = newScenes[sceneId];

      // Update nextScene references
      if (scene.nextScene && idMapping[scene.nextScene]) {
        scene.nextScene = idMapping[scene.nextScene];
      }

      // Update choice references
      if (scene.choices) {
        scene.choices.forEach((choice) => {
          if (choice.nextScene && idMapping[choice.nextScene]) {
            choice.nextScene = idMapping[choice.nextScene];
          }
        });
      }
    });

    // Replace the scenes object
    project.scenes = newScenes;
  }

  /**
   * Update scene properties
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID
   * @param {Object} properties - Properties to update
   */
  updateSceneProperties(project, sceneId, properties) {
    if (!project.scenes[sceneId]) return;

    const scene = project.scenes[sceneId];
    Object.assign(scene, properties);
  }

  /**
   * Add choice to scene
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID
   * @param {Object} choice - Choice object
   */
  addChoice(project, sceneId, choice = { text: "New choice", nextScene: "" }) {
    if (!project.scenes[sceneId]) return;

    const scene = project.scenes[sceneId];
    if (!scene.choices) scene.choices = [];

    scene.choices.push(choice);
  }

  /**
   * Remove choice from scene
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID
   * @param {number} index - Choice index
   */
  removeChoice(project, sceneId, index) {
    if (!project.scenes[sceneId]) return;

    const scene = project.scenes[sceneId];
    if (scene.choices && scene.choices[index]) {
      scene.choices.splice(index, 1);
    }
  }

  /**
   * Update choice
   * @param {Object} project - Project object
   * @param {string} sceneId - Scene ID
   * @param {number} index - Choice index
   * @param {string} property - Property to update
   * @param {*} value - New value
   */
  updateChoice(project, sceneId, index, property, value) {
    if (!project.scenes[sceneId]) return;

    const scene = project.scenes[sceneId];
    if (scene.choices && scene.choices[index]) {
      scene.choices[index][property] = value;
    }
  }
}
