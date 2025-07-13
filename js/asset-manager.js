// Asset management functionality

class AssetManager {
  constructor() {
    this.backgrounds = [];
    this.objects = [];
    this.imageCache = new Map();
  }

  /**
   * Set assets from arrays
   * @param {Array} backgrounds - Background assets
   * @param {Array} objects - Object assets
   */
  setAssets(backgrounds, objects) {
    this.backgrounds = backgrounds || [];
    this.objects = objects || [];
  }

  /**
   * Add background asset
   * @param {string} backgroundPath - Path to background image
   */
  addBackground(backgroundPath) {
    if (!this.backgrounds.includes(backgroundPath)) {
      this.backgrounds.push(backgroundPath);
    }
  }

  /**
   * Add object asset
   * @param {string} objectPath - Path to object image
   */
  addObject(objectPath) {
    if (!this.objects.includes(objectPath)) {
      this.objects.push(objectPath);
    }
  }

  /**
   * Remove background asset
   * @param {string} backgroundPath - Path to background image
   */
  removeBackground(backgroundPath) {
    this.backgrounds = this.backgrounds.filter((bg) => bg !== backgroundPath);
  }

  /**
   * Remove object asset
   * @param {string} objectPath - Path to object image
   */
  removeObject(objectPath) {
    this.objects = this.objects.filter((obj) => obj !== objectPath);
  }

  /**
   * Get all backgrounds
   * @returns {Array} Array of background paths
   */
  getBackgrounds() {
    return this.backgrounds;
  }

  /**
   * Get all objects
   * @returns {Array} Array of object paths
   */
  getObjects() {
    return this.objects;
  }

  /**
   * Get sorted backgrounds
   * @returns {Array} Sorted array of backgrounds
   */
  getSortedBackgrounds() {
    return Utils.sortAssets(this.backgrounds);
  }

  /**
   * Get sorted objects
   * @returns {Array} Sorted array of objects
   */
  getSortedObjects() {
    return Utils.sortAssets(this.objects);
  }

  /**
   * Setup asset drop zones
   */
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

    this.setupDropZoneEvents(backgroundDropZone, "backgrounds");
    this.setupDropZoneEvents(objectDropZone, "objects");

    // Object drop zone
    objectDropZone.addEventListener("click", () => {
      const assetInput = document.getElementById("asset-file-input");
      if (assetInput) {
        assetInput.dataset.target = "objects";
        assetInput.click();
      }
    });
  }

  /**
   * Setup drop zone events
   * @param {Element} dropZone - Drop zone element
   * @param {string} targetType - Target type ('backgrounds' or 'objects')
   */
  setupDropZoneEvents(dropZone, targetType) {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      this.handleAssetDrop(e, targetType);
    });
  }

  /**
   * Handle asset drop
   * @param {Event} event - Drop event
   * @param {string} targetType - Target type ('backgrounds' or 'objects')
   */
  handleAssetDrop(event, targetType) {
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      if (window.editor) {
        window.editor.showWarning("Please drop image files only.");
      }
      return;
    }

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imagePath = `images/${file.name}`;
        if (targetType === "backgrounds") {
          this.addBackground(imagePath);
        } else {
          this.addObject(imagePath);
        }
        this.refreshAssetLists();
        if (window.editor) {
          window.editor.updateSceneDropdowns();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Handle asset file load from input
   * @param {Event} event - File input change event
   */
  handleAssetFileLoad(event) {
    const files = Array.from(event.target.files);
    const targetType = event.target.dataset.target;

    if (!targetType) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      if (window.editor) {
        window.editor.showWarning("Please select image files only.");
      }
      return;
    }

    imageFiles.forEach((file) => {
      const imagePath = `images/${file.name}`;
      if (targetType === "backgrounds") {
        this.addBackground(imagePath);
      } else {
        this.addObject(imagePath);
      }
    });

    this.refreshAssetLists();
    if (window.editor) {
      window.editor.updateSceneDropdowns();
    }

    // Clear the file input
    event.target.value = "";
    event.target.dataset.target = "";
  }

  /**
   * Load image dimensions and cache them
   * @param {string} src - Image source
   * @returns {Promise} Promise resolving to image dimensions
   */
  async loadImageDimensions(src) {
    return Utils.loadImageDimensions(src, this.imageCache);
  }

  /**
   * Refresh asset lists in UI
   */
  refreshAssetLists() {
    this.refreshBackgroundList();
    this.refreshObjectList();
  }

  /**
   * Refresh background list in UI
   */
  refreshBackgroundList() {
    const bgList = document.getElementById("background-list");
    if (!bgList) {
      console.warn("Background list element not found");
      return;
    }

    bgList.innerHTML = "";

    // Sort backgrounds alphabetically
    const sortedBackgrounds = this.getSortedBackgrounds();

    sortedBackgrounds.forEach((bg) => {
      const item = document.createElement("div");
      item.className = "asset-item";
      const cleanName = Utils.getCleanFilename(bg, "background");
      item.innerHTML = `
        ${cleanName}
        <button class="remove-btn" onclick="window.assetManager.removeBackground('${bg}'); window.assetManager.refreshAssetLists(); if(window.editor) window.editor.updateSceneDropdowns();">&times;</button>
      `;
      bgList.appendChild(item);
    });
  }

  /**
   * Refresh object list in UI
   */
  refreshObjectList() {
    const objList = document.getElementById("object-list");
    if (!objList) {
      console.warn("Object list element not found");
      return;
    }

    objList.innerHTML = "";

    // Sort objects alphabetically
    const sortedObjects = this.getSortedObjects();

    sortedObjects.forEach((obj) => {
      const item = document.createElement("div");
      item.className = "asset-item";
      item.draggable = true;
      item.dataset.objPath = obj;
      const cleanName = Utils.getCleanFilename(obj, "object");
      item.innerHTML = `
        ${cleanName}
        <button class="remove-btn" onclick="window.assetManager.removeObject('${obj}'); window.assetManager.refreshAssetLists();">&times;</button>
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

  /**
   * Clear all assets
   */
  clearAssets() {
    this.backgrounds = [];
    this.objects = [];
    this.imageCache.clear();
  }
}
