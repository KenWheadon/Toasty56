// Project management functionality

class ProjectManager {
  constructor() {
    this.project = null;
    this.autoSaveInterval = null;
    this.autoSaveStatus = "ready";
    this.clipboardPosition = null; // For copy/paste functionality
  }

  /**
   * Initialize empty project structure
   */
  initializeProject() {
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
      // Global default positions for UI elements
      defaults: {
        uiPositions: {
          textContent: { x: 50, y: 85, width: 80 },
          buttonsContainer: { x: 80, y: 85, width: 40 },
          choiceButton: { x: 80, y: 85, width: 40 }, // Default for individual choice buttons
        },
      },
    };
  }

  /**
   * Create a new scenario with a default first scene
   */
  createNewScenario() {
    // Clear auto-save from localStorage first
    localStorage.removeItem("story-editor-autosave");
    this.clipboardPosition = null;

    // Initialize new project
    this.initializeProject();

    // Create first scene
    const firstScene = {
      id: "scene_1",
      name: "New Scene",
      type: "choice",
      content: "New scene content",
      choices: [],
      // Use default UI positioning from project defaults
      uiPositions: {
        textContent: { x: 50, y: 85, width: 80 },
        buttonsContainer: { x: 80, y: 85, width: 40 },
      },
    };

    this.project.scenes["1"] = firstScene;
    this.project.totalScenes = 1;
    this.project.currentScene = 1;

    // Update auto-save status
    this.updateAutoSaveStatus("ready");
  }

  /**
   * Get default UI positions
   * @returns {Object} Default UI positions
   */
  getDefaultUIPositions() {
    if (!this.project.defaults) {
      // Initialize defaults if they don't exist (for older projects)
      this.project.defaults = {
        uiPositions: {
          textContent: { x: 50, y: 85, width: 80 },
          buttonsContainer: { x: 80, y: 85, width: 40 },
          choiceButton: { x: 80, y: 85, width: 40 },
        },
      };
    }
    return this.project.defaults.uiPositions;
  }

  /**
   * Update default UI position
   * @param {string} elementType - Type of UI element
   * @param {number} x - X position percentage
   * @param {number} y - Y position percentage
   * @param {number} width - Width percentage
   */
  updateDefaultUIPosition(elementType, x, y, width) {
    const defaults = this.getDefaultUIPositions();
    defaults[elementType] = { x, y, width };
  }

  /**
   * Copy object to clipboard
   * @param {Object} objectData - Object data to copy
   */
  copyObject(objectData) {
    // Create a deep copy of the object data
    this.clipboardPosition = {
      type: "object",
      data: JSON.parse(JSON.stringify(objectData)),
    };
  }

  /**
   * Get copied object from clipboard
   * @returns {Object|null} Copied object data or null if nothing copied
   */
  getPastedObject() {
    if (this.clipboardPosition && this.clipboardPosition.type === "object") {
      return JSON.parse(JSON.stringify(this.clipboardPosition.data));
    }
    return null;
  }

  /**
   * Check if there's an object in clipboard
   * @returns {boolean} True if object is available for pasting
   */
  hasClipboardObject() {
    return (
      this.clipboardPosition !== null &&
      this.clipboardPosition.type === "object"
    );
  }

  /**
   * Copy position to clipboard
   * @param {Object} position - Position object with x, y, width
   */
  copyPosition(position) {
    this.clipboardPosition = {
      type: "position",
      data: { ...position },
    };
  }

  /**
   * Get copied position from clipboard
   * @returns {Object|null} Copied position or null if nothing copied
   */
  getPastedPosition() {
    if (this.clipboardPosition && this.clipboardPosition.type === "position") {
      return { ...this.clipboardPosition.data };
    }
    return null;
  }

  /**
   * Check if there's a position in clipboard
   * @returns {boolean} True if position is available for pasting
   */
  hasClipboardPosition() {
    return (
      this.clipboardPosition !== null &&
      this.clipboardPosition.type === "position"
    );
  }

  /**
   * Start auto-save functionality
   */
  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.autoSave();
    }, 10000); // Auto-save every 10 seconds
  }

  /**
   * Stop auto-save functionality
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Perform auto-save
   */
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

  /**
   * Update auto-save status indicator
   * @param {string} status - Status ('saving', 'saved', 'error', 'ready')
   */
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

  /**
   * Migrate old project data to include scene names, UI positions, and defaults
   * @param {Object} projectData - Project data to migrate
   */
  migrateProjectData(projectData) {
    if (!projectData.scenes) return projectData;

    // Add defaults if they don't exist
    if (!projectData.defaults) {
      projectData.defaults = {
        uiPositions: {
          textContent: { x: 50, y: 85, width: 80 },
          buttonsContainer: { x: 80, y: 85, width: 40 },
          choiceButton: { x: 80, y: 85, width: 40 },
        },
      };
    }

    // Add default names and UI positions to scenes that don't have them
    Object.keys(projectData.scenes).forEach((sceneId) => {
      const scene = projectData.scenes[sceneId];

      if (!scene.name) {
        scene.name = "New Scene";
      }

      // Add default UI positions if they don't exist
      if (!scene.uiPositions) {
        scene.uiPositions = {
          textContent: { x: 50, y: 85, width: 80 },
          buttonsContainer: { x: 80, y: 85, width: 40 },
        };
      }

      // Ensure width properties exist for existing UI positions
      if (!scene.uiPositions.textContent.width) {
        scene.uiPositions.textContent.width = 80;
      }
      if (!scene.uiPositions.buttonsContainer.width) {
        scene.uiPositions.buttonsContainer.width = 40;
      }

      // Add positions to choices that don't have them
      if (scene.choices) {
        scene.choices.forEach((choice, index) => {
          if (!choice.position) {
            choice.position = {
              x: 80,
              y: 85 + index * 5, // Offset each choice slightly
              width: 40,
            };
          }
          // Ensure width property exists
          if (!choice.position.width) {
            choice.position.width = 40;
          }
        });
      }
    });

    return projectData;
  }

  /**
   * Load project from localStorage
   * @returns {boolean} True if project loaded successfully
   */
  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem("story-editor-autosave");
      if (savedData) {
        const projectData = JSON.parse(savedData);
        this.project = this.migrateProjectData(projectData);
        this.updateAutoSaveStatus("ready");
        return true;
      }
    } catch (error) {
      console.error("Failed to load auto-save data:", error);
    }
    return false;
  }

  /**
   * Load project from JSON string
   * @param {string} jsonString - JSON project data
   * @returns {boolean} True if loaded successfully
   */
  loadFromJSON(jsonString) {
    try {
      const projectData = JSON.parse(jsonString);
      this.project = this.migrateProjectData(projectData);
      // Clear auto-save since we loaded a new project
      localStorage.removeItem("story-editor-autosave");
      this.updateAutoSaveStatus("ready");
      return true;
    } catch (error) {
      console.error("Error loading project:", error);
      return false;
    }
  }

  /**
   * Export project as JSON string
   * @returns {string} JSON string of project
   */
  exportProject() {
    return JSON.stringify(this.project, null, 2);
  }

  /**
   * Save project to file
   */
  saveProjectToFile() {
    const dataStr = this.exportProject();
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

  /**
   * Extract assets from project scenes
   * @returns {Object} Object containing backgrounds and objects arrays
   */
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

    return {
      backgrounds: Array.from(backgrounds),
      objects: Array.from(objects),
    };
  }

  /**
   * Get project instance
   * @returns {Object} Current project
   */
  getProject() {
    return this.project;
  }

  /**
   * Set project instance
   * @param {Object} project - Project object
   */
  setProject(project) {
    this.project = project;
  }

  /**
   * Clear project and localStorage
   */
  clearProject() {
    this.project = null;
    this.clipboardPosition = null;
    localStorage.removeItem("story-editor-autosave");
    this.updateAutoSaveStatus("ready");
  }
}
