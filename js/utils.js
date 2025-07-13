// Utility functions for the Story Editor

class Utils {
  /**
   * Get clean filename from path
   * @param {string} path - The file path
   * @param {string} type - The type of asset ('background' or 'object')
   * @returns {string} Clean filename
   */
  static getCleanFilename(path, type = "object") {
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

  /**
   * Sort assets alphabetically
   * @param {Array} assets - Array of asset paths
   * @returns {Array} Sorted array of assets
   */
  static sortAssets(assets) {
    return assets.sort((a, b) => {
      const nameA = Utils.getCleanFilename(a).toLowerCase();
      const nameB = Utils.getCleanFilename(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  /**
   * Safely add event listener to element by ID
   * @param {string} id - Element ID
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   */
  static addEventListenerSafe(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener(event, handler);
    } else {
      console.warn(`Element with id '${id}' not found`);
    }
  }

  /**
   * Safely add event listener to element by selector
   * @param {string} selector - CSS selector
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   */
  static addQueryListenerSafe(selector, event, handler) {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener(event, handler);
    } else {
      console.warn(`Element with selector '${selector}' not found`);
    }
  }

  /**
   * Load image dimensions and cache them
   * @param {string} src - Image source
   * @param {Map} cache - Image cache
   * @returns {Promise} Promise resolving to image dimensions
   */
  static async loadImageDimensions(src, cache) {
    if (cache.has(src)) {
      return cache.get(src);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const dimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        cache.set(src, dimensions);
        resolve(dimensions);
      };
      img.onerror = () => {
        // Fallback dimensions if image fails to load
        const fallback = { width: 100, height: 100 };
        cache.set(src, fallback);
        resolve(fallback);
      };
      img.src = src;
    });
  }

  /**
   * Generate next available scene ID
   * @param {Object} scenes - Scene object
   * @returns {number} Next available scene ID
   */
  static getNextSceneId(scenes) {
    const existingIds = Object.keys(scenes)
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));
    return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  }

  /**
   * Get ordered scene keys (sorted numerically)
   * @param {Object} scenes - Scene object
   * @returns {Array} Ordered scene keys
   */
  static getOrderedSceneKeys(scenes) {
    return Object.keys(scenes).sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * Clean up references to deleted scene
   * @param {Object} scenes - Scene object
   * @param {string} deletedSceneId - ID of deleted scene
   */
  static cleanupDeletedSceneReferences(scenes, deletedSceneId) {
    Object.keys(scenes).forEach((sceneId) => {
      const scene = scenes[sceneId];

      // Clean up nextScene references
      if (scene.nextScene === deletedSceneId) {
        scene.nextScene = undefined;
      }

      // Clean up choice references
      if (scene.choices) {
        scene.choices.forEach((choice) => {
          if (choice.nextScene === deletedSceneId) {
            choice.nextScene = "";
          }
        });
      }
    });
  }

  /**
   * Validate scene references
   * @param {Object} scenes - Scene object
   * @returns {Array} Array of warning messages
   */
  static validateSceneReferences(scenes) {
    const warnings = [];

    Object.keys(scenes).forEach((sceneId) => {
      const scene = scenes[sceneId];

      // Check nextScene
      if (
        scene.nextScene &&
        scene.nextScene !== null &&
        !scenes[scene.nextScene]
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
            !scenes[choice.nextScene]
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

    return warnings;
  }
}
