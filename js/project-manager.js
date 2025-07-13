// Project management functionality

class ProjectManager {
  constructor() {
    this.project = null;
    this.autoSaveInterval = null;
    this.autoSaveStatus = "ready";
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
    };
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
   * Load project from localStorage
   * @returns {boolean} True if project loaded successfully
   */
  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem("story-editor-autosave");
      if (savedData) {
        const projectData = JSON.parse(savedData);
        this.project = projectData;
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
      this.project = projectData;
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
    localStorage.removeItem("story-editor-autosave");
    this.updateAutoSaveStatus("ready");
  }
}
