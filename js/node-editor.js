// Visual node-based editor for scene connections
//
// Updated version with auto-connection type determination and scene type toggle

class NodeEditor {
  constructor() {
    this.isOpen = false;
    this.canvas = null;
    this.ctx = null;
    this.nodes = new Map();
    this.connections = [];
    this.selectedNode = null;
    this.draggingNode = null;
    this.dragOffset = { x: 0, y: 0 };
    this.isDraggingConnection = false;
    this.connectionStart = null;
    this.mousePos = { x: 0, y: 0 };
    this.viewOffset = { x: 0, y: 0 };
    this.zoom = 1;
    this.resizeHandler = null;

    // Canvas panning
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.panOffset = { x: 0, y: 0 };

    // Node styling
    this.nodeWidth = 200;
    this.nodeHeight = 180; // Increased height to accommodate toggle
    this.nodeRadius = 8;
    this.connectionRadius = 8;

    // Colors matching scene types from bottom panel
    this.colors = {
      choice: {
        background: "#2980b9",
        border: "#3498db",
        active: "#1abc9c",
      },
      image: {
        background: "#5a9c12",
        border: "#e67e22",
        active: "#e74c3c",
      },
      connection: "#34495e",
      selected: "#e74c3c",
      text: "#ffffff",
      background: "#1a1a1a",
    };

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for the node editor
   */
  setupEventListeners() {
    // Add button click listener - check if DOM is already loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.setupButtonListener()
      );
    } else {
      this.setupButtonListener();
    }
  }

  /**
   * Setup button listener
   */
  setupButtonListener() {
    const openNodeEditorBtn = document.getElementById("open-node-editor");
    if (openNodeEditorBtn) {
      openNodeEditorBtn.addEventListener("click", () => this.open());
    }
  }

  open() {
    if (this.isOpen) return;

    // Check if we have a valid project
    if (!window.editor || !window.editor.projectManager) {
      alert("No project loaded. Please create or load a project first.");
      return;
    }

    const project = window.editor.projectManager.getProject();
    if (
      !project ||
      !project.scenes ||
      Object.keys(project.scenes).length === 0
    ) {
      alert("No scenes found in the project. Please create some scenes first.");
      return;
    }

    this.isOpen = true;
    this.createNodeEditorOverlay();

    // Load nodes first
    this.loadScenesAsNodes();

    // Then update connections based on loaded nodes
    this.updateConnections();

    // Calculate layout using the connections
    this.calculateInitialLayout();

    // Render everything
    this.render();
  }

  /**
   * Close the node editor
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    const overlay = document.getElementById("node-editor-overlay");
    if (overlay) {
      overlay.remove();
    }
    this.cleanup();
  }

  /**
   * Create the full-screen overlay with canvas
   */
  createNodeEditorOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "node-editor-overlay";
    overlay.className = "node-editor-overlay";

    // Create header
    const header = document.createElement("div");
    header.className = "node-editor-header";
    header.innerHTML = `
      <h2>Visual Node Editor</h2>
      <div class="node-editor-controls">
        <button id="node-editor-fit" class="btn btn-small">Fit to Screen</button>
        <button id="node-editor-reset" class="btn btn-small">Reset Layout</button>
        <button id="node-editor-close" class="btn btn-small btn-danger">Close</button>
      </div>
    `;

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.id = "node-editor-canvas";
    this.canvas.className = "node-editor-canvas";
    this.ctx = this.canvas.getContext("2d");

    // Create info panel
    const infoPanel = document.createElement("div");
    infoPanel.className = "node-editor-info";
    infoPanel.innerHTML = `
      <div class="node-editor-legend">
        <h3>Controls</h3>
        <p>• Drag nodes to reposition</p>
        <p>• Drag empty space to pan view</p>
        <p>• Click and drag from node edge to create connection</p>
        <p>• Click type button to toggle scene type</p>
        <p>• Right-click connection to delete</p>
        <p>• Mouse wheel to zoom</p>
        <p><strong>Note:</strong> Changing scene type removes outgoing connections</p>
      </div>
    `;

    overlay.appendChild(header);
    overlay.appendChild(this.canvas);
    overlay.appendChild(infoPanel);
    document.body.appendChild(overlay);

    // Setup canvas size
    this.resizeCanvas();

    // Add event listeners
    this.setupCanvasEventListeners();

    // Add control button listeners
    document
      .getElementById("node-editor-close")
      .addEventListener("click", () => this.close());
    document
      .getElementById("node-editor-fit")
      .addEventListener("click", () => this.fitToScreen());
    document
      .getElementById("node-editor-reset")
      .addEventListener("click", () => this.resetLayout());

    // Handle window resize
    this.resizeHandler = () => this.resizeCanvas();
    window.addEventListener("resize", this.resizeHandler);
  }

  /**
   * Setup canvas event listeners
   */
  setupCanvasEventListeners() {
    // Mouse events
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.canvas.addEventListener("contextmenu", (e) =>
      this.handleRightClick(e)
    );
    this.canvas.addEventListener("wheel", (e) => this.handleWheel(e));

    // Prevent context menu
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /**
   * Resize canvas to fit window
   */
  resizeCanvas() {
    if (!this.canvas) return;

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - 60; // Account for header

    if (this.isOpen) {
      this.render();
    }
  }

  loadScenesAsNodes() {
    if (!window.editor || !window.editor.projectManager) return;

    const project = window.editor.projectManager.getProject();
    if (!project || !project.scenes) return;

    this.nodes.clear();
    this.connections = [];

    // Create nodes for each scene
    Object.keys(project.scenes).forEach((sceneId) => {
      const scene = project.scenes[sceneId];

      const node = {
        id: sceneId,
        scene: scene,
        x: 0,
        y: 0,
        width: this.nodeWidth,
        height: this.nodeHeight,
        isDragging: false,
        backgroundImage: null,
      };

      // Load background image if exists
      if (scene.background) {
        const img = new Image();
        img.onload = () => {
          node.backgroundImage = img;
          this.render();
        };
        img.src = scene.background;
      }

      this.nodes.set(sceneId, node);
    });
  }

  /**
   * Update connections based on scene data
   */
  updateConnections() {
    this.connections = [];

    this.nodes.forEach((node, nodeId) => {
      const scene = node.scene;

      // Add nextScene connection (for image type scenes)
      if (scene.nextScene) {
        const nextSceneId = scene.nextScene.toString();
        if (this.nodes.has(nextSceneId)) {
          this.connections.push({
            from: nodeId,
            to: nextSceneId,
            type: "nextScene",
            label: "Continue",
          });
        }
      }

      // Add choice connections
      if (
        scene.choices &&
        Array.isArray(scene.choices) &&
        scene.choices.length > 0
      ) {
        scene.choices.forEach((choice, index) => {
          if (
            choice.nextScene &&
            choice.nextScene !== null &&
            choice.nextScene !== undefined &&
            choice.nextScene !== ""
          ) {
            const nextSceneId = choice.nextScene.toString();
            if (this.nodes.has(nextSceneId)) {
              this.connections.push({
                from: nodeId,
                to: nextSceneId,
                type: "choice",
                label: choice.text || `Choice ${index + 1}`,
                choiceIndex: index,
              });
            }
          }
        });
      }
    });
  }

  /**
   * Calculate initial force-directed layout
   */
  calculateInitialLayout() {
    if (this.nodes.size === 0) return;

    // Find root node (scene with ID "1" or first scene)
    let rootNode = this.nodes.get("1");
    if (!rootNode) {
      const sortedKeys = Array.from(this.nodes.keys()).sort(
        (a, b) => parseInt(a) - parseInt(b)
      );
      rootNode = this.nodes.get(sortedKeys[0]);
    }

    if (!rootNode) {
      rootNode = this.nodes.values().next().value;
    }

    // Simple hierarchical layout
    const levels = new Map();

    // BFS to assign levels
    const queue = [{ node: rootNode, level: 0 }];
    levels.set(rootNode.id, 0);

    while (queue.length > 0) {
      const { node, level } = queue.shift();

      // Find connections from this node
      const connections = this.connections.filter((c) => c.from === node.id);
      connections.forEach((conn) => {
        const targetNode = this.nodes.get(conn.to);
        if (targetNode && !levels.has(targetNode.id)) {
          levels.set(targetNode.id, level + 1);
          queue.push({ node: targetNode, level: level + 1 });
        }
      });
    }

    // Group nodes by level
    const nodesByLevel = new Map();
    levels.forEach((level, nodeId) => {
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level).push(this.nodes.get(nodeId));
    });

    // Position nodes
    const levelSpacing = 300;
    const nodeSpacing = 250;
    const startX = this.canvas ? this.canvas.width / 2 : 400;
    const startY = 100;

    nodesByLevel.forEach((levelNodes, level) => {
      const totalWidth = (levelNodes.length - 1) * nodeSpacing;
      const startXForLevel = startX - totalWidth / 2;

      levelNodes.forEach((node, index) => {
        node.x = startXForLevel + index * nodeSpacing;
        node.y = startY + level * levelSpacing;
      });
    });

    // Handle nodes not connected to the main graph
    let orphanX = startX + 400;
    let orphanY = startY;
    this.nodes.forEach((node) => {
      if (!levels.has(node.id)) {
        node.x = orphanX;
        node.y = orphanY;
        orphanY += levelSpacing;
        if (orphanY > startY + levelSpacing * 5) {
          orphanX += nodeSpacing;
          orphanY = startY;
        }
      }
    });
  }

  /**
   * Handle mouse down events
   */
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / this.zoom - this.viewOffset.x;
    const mouseY = (e.clientY - rect.top) / this.zoom - this.viewOffset.y;

    // Check if clicking on a node
    const clickedNode = this.getNodeAtPosition(mouseX, mouseY);

    if (clickedNode) {
      // Check if clicking on scene type toggle
      const toggleArea = this.getToggleArea(clickedNode);
      if (this.isPositionInArea(mouseX, mouseY, toggleArea)) {
        this.toggleSceneType(clickedNode);
        return;
      }

      // Check if clicking on connection point (edge of node)
      const isOnEdge = this.isOnNodeEdge(clickedNode, mouseX, mouseY);

      if (isOnEdge) {
        // Start creating connection
        this.isDraggingConnection = true;
        this.connectionStart = clickedNode;
        this.mousePos = { x: mouseX, y: mouseY };
      } else {
        // Start dragging node
        this.draggingNode = clickedNode;
        this.dragOffset = {
          x: mouseX - clickedNode.x,
          y: mouseY - clickedNode.y,
        };
        clickedNode.isDragging = true;
      }

      this.selectedNode = clickedNode;
      this.canvas.style.cursor = "grabbing";
    } else {
      // Start panning canvas
      this.isPanning = true;
      this.panStart = { x: e.clientX, y: e.clientY };
      this.panOffset = { x: this.viewOffset.x, y: this.viewOffset.y };
      this.selectedNode = null;
      this.canvas.style.cursor = "grabbing";
    }

    this.render();
  }

  /**
   * Get toggle area for a node - positioned in the center
   */
  getToggleArea(node) {
    const buttonWidth = 80;
    const buttonHeight = 25;
    return {
      x: node.x + (node.width - buttonWidth) / 2,
      y: node.y + (node.height - buttonHeight) / 2,
      width: buttonWidth,
      height: buttonHeight,
    };
  }

  /**
   * Check if position is within an area
   */
  isPositionInArea(x, y, area) {
    return (
      x >= area.x &&
      x <= area.x + area.width &&
      y >= area.y &&
      y <= area.y + area.height
    );
  }

  /**
   * Toggle scene type for a node
   */
  toggleSceneType(node) {
    if (!window.editor || !window.editor.projectManager) return;

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[node.id];

    // Toggle between image and choice
    const newType = scene.type === "choice" ? "image" : "choice";
    scene.type = newType;

    // Update the node's scene reference
    node.scene = scene;

    // Clean up incompatible properties
    if (newType === "image") {
      // Remove choices for image scenes
      delete scene.choices;
    } else {
      // Remove nextScene for choice scenes and ensure choices array exists
      delete scene.nextScene;
      if (!scene.choices) {
        scene.choices = [];
      }
    }

    // IMPORTANT: Remove only OUTGOING connections when type changes (preserve incoming)
    this.removeAllConnectionsForScene(node.id);

    // Clean up only outgoing references from this scene
    this.cleanupSceneReferences(project, node.id);

    // Update connections and re-render
    this.updateConnections();
    this.render();

    // Update main editor UI comprehensively
    if (window.editor) {
      // Update dropdowns and scene list
      window.editor.updateSceneDropdowns();
      window.editor.refreshSceneList();

      // If this is the currently selected scene, update all UI elements
      if (window.editor.currentScene === node.id) {
        window.editor.uiManager.updateScenePropertiesDisplay(project, node.id);
        window.editor.previewManager.renderPreview(project, node.id);
        window.editor.uiManager.refreshChoicesList(project, node.id);
        window.editor.uiManager.updateChoicesVisibility();
      }
    }
  }

  /**
   * Remove only outgoing connections from a specific scene (not incoming)
   */
  removeAllConnectionsForScene(sceneId) {
    // Remove only outgoing connections (where this scene is the source)
    this.connections = this.connections.filter(
      (connection) => connection.from !== sceneId
    );
  }

  /**
   * Clean up only outgoing references from a scene in other scenes' data
   */
  cleanupSceneReferences(project, sceneId) {
    // Only clean up the scene's own outgoing references
    const scene = project.scenes[sceneId];

    // Clean up this scene's outgoing references
    if (scene.nextScene) {
      delete scene.nextScene;
    }

    if (scene.choices) {
      scene.choices.forEach((choice) => {
        if (choice.nextScene) {
          choice.nextScene = "";
        }
      });
    }

    // Note: We don't clean up references TO this scene from other scenes
    // because incoming connections should be preserved
  }

  /**
   * Handle mouse move events
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / this.zoom - this.viewOffset.x;
    const mouseY = (e.clientY - rect.top) / this.zoom - this.viewOffset.y;

    this.mousePos = { x: mouseX, y: mouseY };

    if (this.draggingNode) {
      // Update node position
      this.draggingNode.x = mouseX - this.dragOffset.x;
      this.draggingNode.y = mouseY - this.dragOffset.y;
      this.render();
    } else if (this.isDraggingConnection) {
      // Update connection preview
      this.render();
    } else if (this.isPanning) {
      // Update canvas pan
      const deltaX = e.clientX - this.panStart.x;
      const deltaY = e.clientY - this.panStart.y;

      this.viewOffset.x = this.panOffset.x + deltaX / this.zoom;
      this.viewOffset.y = this.panOffset.y + deltaY / this.zoom;

      this.render();
    } else {
      // Update cursor based on what's under mouse
      const nodeUnderMouse = this.getNodeAtPosition(mouseX, mouseY);
      if (nodeUnderMouse) {
        // Check if hovering over toggle area
        const toggleArea = this.getToggleArea(nodeUnderMouse);
        if (this.isPositionInArea(mouseX, mouseY, toggleArea)) {
          this.canvas.style.cursor = "pointer";
        } else {
          const isOnEdge = this.isOnNodeEdge(nodeUnderMouse, mouseX, mouseY);
          this.canvas.style.cursor = isOnEdge ? "crosshair" : "grab";
        }
      } else {
        this.canvas.style.cursor = "grab";
      }
    }
  }

  /**
   * Handle mouse up events
   */
  handleMouseUp(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / this.zoom - this.viewOffset.x;
    const mouseY = (e.clientY - rect.top) / this.zoom - this.viewOffset.y;

    if (this.isDraggingConnection) {
      // Check if ending on a node
      const targetNode = this.getNodeAtPosition(mouseX, mouseY);
      if (targetNode && targetNode !== this.connectionStart) {
        // Validate connection before showing dialog
        if (this.validateConnection(this.connectionStart, targetNode)) {
          this.createConnection(this.connectionStart, targetNode);
        }
      }

      this.isDraggingConnection = false;
      this.connectionStart = null;
    }

    if (this.draggingNode) {
      this.draggingNode.isDragging = false;
      this.draggingNode = null;
    }

    if (this.isPanning) {
      this.isPanning = false;
    }

    // Reset cursor
    this.canvas.style.cursor = "grab";

    this.render();
  }

  /**
   * Handle right click events
   */
  handleRightClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / this.zoom - this.viewOffset.x;
    const mouseY = (e.clientY - rect.top) / this.zoom - this.viewOffset.y;

    // Check if clicking on a connection
    const connection = this.getConnectionAtPosition(mouseX, mouseY);
    if (connection) {
      this.deleteConnection(connection);
    }
  }

  /**
   * Handle wheel events for zooming
   */
  handleWheel(e) {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, this.zoom * delta));

    // Zoom towards mouse position
    this.viewOffset.x =
      mouseX / this.zoom - mouseX / newZoom + this.viewOffset.x;
    this.viewOffset.y =
      mouseY / this.zoom - mouseY / newZoom + this.viewOffset.y;

    this.zoom = newZoom;
    this.render();
  }

  /**
   * Get node at specific position
   */
  getNodeAtPosition(x, y) {
    for (const node of this.nodes.values()) {
      if (
        x >= node.x &&
        x <= node.x + node.width &&
        y >= node.y &&
        y <= node.y + node.height
      ) {
        return node;
      }
    }
    return null;
  }

  /**
   * Check if position is on node edge (for connection creation)
   */
  isOnNodeEdge(node, x, y) {
    const edgeThreshold = 20;
    return (
      x < node.x + edgeThreshold ||
      x > node.x + node.width - edgeThreshold ||
      y < node.y + edgeThreshold ||
      y > node.y + node.height - edgeThreshold
    );
  }

  /**
   * Get connection at specific position
   */
  getConnectionAtPosition(x, y) {
    const threshold = 10;

    for (const connection of this.connections) {
      const fromNode = this.nodes.get(connection.from);
      const toNode = this.nodes.get(connection.to);

      if (!fromNode || !toNode) continue;

      const fromX = fromNode.x + fromNode.width / 2;
      const fromY = fromNode.y + fromNode.height / 2;
      const toX = toNode.x + toNode.width / 2;
      const toY = toNode.y + toNode.height / 2;

      // Check if point is near line
      const distance = this.pointToLineDistance(x, y, fromX, fromY, toX, toY);
      if (distance < threshold) {
        return connection;
      }
    }

    return null;
  }

  /**
   * Calculate distance from point to line
   */
  pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Validate if a connection can be created between two nodes
   */
  validateConnection(fromNode, toNode) {
    // Can't connect to self
    if (fromNode.id === toNode.id) {
      alert("Cannot connect a scene to itself.");
      return false;
    }

    // Image scenes can only have one nextScene connection
    if (fromNode.scene.type === "image" && fromNode.scene.nextScene) {
      alert(
        "Image scenes can only have one 'Next Scene' connection. Remove the existing connection first."
      );
      return false;
    }

    // Check if connection already exists
    const existingConnection = this.connections.find(
      (conn) => conn.from === fromNode.id && conn.to === toNode.id
    );

    if (existingConnection) {
      alert("A connection already exists between these scenes.");
      return false;
    }

    return true;
  }

  /**
   * Create connection between two nodes
   */
  createConnection(fromNode, toNode) {
    // Show connection type selection dialog
    this.showConnectionDialog(fromNode, toNode);
  }

  /**
   * Show dialog to select connection type - now with proper restrictions based on scene type
   */
  showConnectionDialog(fromNode, toNode) {
    const dialog = document.createElement("div");
    dialog.className = "connection-dialog";

    // Determine connection type based on source scene type - NO CHOICE for user
    const connectionType =
      fromNode.scene.type === "image" ? "nextScene" : "choice";

    // Check if connection is valid
    if (fromNode.scene.type === "image" && fromNode.scene.nextScene) {
      // Image scene already has a nextScene connection
      alert(
        "Image scenes can only have one 'Next Scene' connection. Remove the existing connection first."
      );
      return;
    }

    let dialogContent = `
      <div class="connection-dialog-content">
        <h3>Create Connection</h3>
        <p>From: ${fromNode.id} (${fromNode.scene.name})</p>
        <p>To: ${toNode.id} (${toNode.scene.name})</p>
        <p><strong>Connection Type: ${
          connectionType === "nextScene"
            ? "Next Scene (Continue)"
            : "Choice Connection"
        }</strong></p>
    `;

    // Only show choice options for choice scenes
    if (connectionType === "choice") {
      dialogContent += `<div id="choice-selection">`;

      // Show existing choices if any
      if (fromNode.scene.choices && fromNode.scene.choices.length > 0) {
        dialogContent += `
          <h4>Existing Choices:</h4>
          <div class="existing-choices">
        `;

        fromNode.scene.choices.forEach((choice, index) => {
          dialogContent += `
            <label>
              <input type="radio" name="choiceOption" value="existing-${index}">
              Update: "${choice.text}"
            </label>
          `;
        });

        dialogContent += `</div>`;
      }

      // Add new choice option
      dialogContent += `
        <label>
          <input type="radio" name="choiceOption" value="new" ${
            !fromNode.scene.choices || fromNode.scene.choices.length === 0
              ? "checked"
              : ""
          }>
          Create New Choice
        </label>
      `;

      dialogContent += `</div>`;

      dialogContent += `
        <div id="choice-text-input">
          <input type="text" id="choice-text" placeholder="Enter choice text">
        </div>
      `;
    }

    dialogContent += `
        <div class="connection-dialog-buttons">
          <button id="create-connection-btn" class="btn btn-primary">Create</button>
          <button id="cancel-connection-btn" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    `;

    dialog.innerHTML = dialogContent;
    document.body.appendChild(dialog);

    // Setup choice option handlers only for choice scenes
    if (connectionType === "choice") {
      const choiceOptions = dialog.querySelectorAll(
        'input[name="choiceOption"]'
      );
      const choiceTextInputField = dialog.querySelector("#choice-text");

      choiceOptions.forEach((option) => {
        option.addEventListener("change", () => {
          if (option.value === "new") {
            choiceTextInputField.value = "";
            choiceTextInputField.placeholder = "Enter choice text";
            choiceTextInputField.disabled = false;
          } else if (option.value.startsWith("existing-")) {
            const index = parseInt(option.value.split("-")[1]);
            const existingChoice = fromNode.scene.choices[index];
            choiceTextInputField.value = existingChoice.text;
            choiceTextInputField.placeholder = "Choice will be updated";
            choiceTextInputField.disabled = true;
          }
        });
      });
    }

    // Handle buttons
    dialog
      .querySelector("#create-connection-btn")
      .addEventListener("click", () => {
        let choiceText = "";
        let choiceOption = null;

        if (connectionType === "choice") {
          choiceText = dialog.querySelector("#choice-text").value;
          const selectedChoiceOption = dialog.querySelector(
            'input[name="choiceOption"]:checked'
          );
          choiceOption = selectedChoiceOption
            ? selectedChoiceOption.value
            : "new";
        }

        this.executeCreateConnection(
          fromNode,
          toNode,
          connectionType,
          choiceText,
          choiceOption
        );
        dialog.remove();
      });

    dialog
      .querySelector("#cancel-connection-btn")
      .addEventListener("click", () => {
        dialog.remove();
      });
  }

  /**
   * Execute connection creation - updated to handle scene type restrictions
   */
  executeCreateConnection(fromNode, toNode, type, choiceText, choiceOption) {
    if (!window.editor || !window.editor.projectManager) return;

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[fromNode.id];

    // Validate connection type matches scene type
    if (type === "nextScene" && scene.type !== "image") {
      alert("Only image scenes can have 'Next Scene' connections.");
      return;
    }

    if (type === "choice" && scene.type !== "choice") {
      alert("Only choice scenes can have 'Choice' connections.");
      return;
    }

    if (type === "nextScene") {
      // Check if image scene already has a nextScene connection
      if (scene.nextScene) {
        alert(
          "Image scenes can only have one 'Next Scene' connection. Remove the existing connection first."
        );
        return;
      }
      scene.nextScene = toNode.id;
    } else if (type === "choice") {
      if (!scene.choices) scene.choices = [];

      if (choiceOption && choiceOption.startsWith("existing-")) {
        // Update existing choice
        const index = parseInt(choiceOption.split("-")[1]);
        if (scene.choices[index]) {
          scene.choices[index].nextScene = toNode.id;
        }
      } else {
        // Create new choice
        const newChoice = {
          text: choiceText || "New Choice",
          nextScene: toNode.id,
        };

        // Add default position for new choice
        if (window.projectManager) {
          const defaultChoicePosition =
            window.projectManager.getDefaultUIPositions().choiceButton;
          const choiceCount = scene.choices.length;
          const spacing = window.sceneManager
            ? window.sceneManager.CHOICE_VERTICAL_SPACING
            : 7;

          newChoice.position = {
            x: defaultChoicePosition.x,
            y: defaultChoicePosition.y + choiceCount * spacing,
            width: defaultChoicePosition.width,
          };
        }

        scene.choices.push(newChoice);
      }
    }

    // Update connections and re-render
    this.updateConnections();
    this.render();

    // Update main editor UI
    if (window.editor) {
      window.editor.updateSceneDropdowns();
      window.editor.refreshSceneList();
      // Update UI if the currently selected scene was modified
      if (window.editor.currentScene === fromNode.id) {
        window.editor.uiManager.refreshChoicesList(project, fromNode.id);
        window.editor.previewManager.renderPreview(project, fromNode.id);
      }
    }
  }

  /**
   * Delete connection
   */
  deleteConnection(connection) {
    if (!window.editor || !window.editor.projectManager) return;

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[connection.from];

    if (connection.type === "nextScene") {
      scene.nextScene = null;
    } else if (
      connection.type === "choice" &&
      connection.choiceIndex !== undefined
    ) {
      if (scene.choices && scene.choices[connection.choiceIndex]) {
        scene.choices.splice(connection.choiceIndex, 1);
      }
    }

    // Update connections and re-render
    this.updateConnections();
    this.render();

    // Update main editor UI
    if (window.editor) {
      window.editor.updateSceneDropdowns();
      window.editor.refreshSceneList();
      // Update UI if the currently selected scene was modified
      if (window.editor.currentScene === connection.from) {
        window.editor.uiManager.refreshChoicesList(project, connection.from);
      }
    }
  }

  /**
   * Fit all nodes to screen
   */
  fitToScreen() {
    if (this.nodes.size === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    this.nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    const padding = 50;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const scaleX = this.canvas.width / contentWidth;
    const scaleY = this.canvas.height / contentHeight;
    this.zoom = Math.min(scaleX, scaleY, 1);

    this.viewOffset.x = -(minX - padding) * this.zoom;
    this.viewOffset.y = -(minY - padding) * this.zoom;

    this.render();
  }

  /**
   * Reset layout to initial force-directed layout
   */
  resetLayout() {
    this.calculateInitialLayout();
    this.fitToScreen();
  }

  /**
   * Main render function
   */
  render() {
    if (!this.ctx || !this.canvas) return;

    try {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Apply zoom and pan
      this.ctx.save();
      this.ctx.scale(this.zoom, this.zoom);
      this.ctx.translate(this.viewOffset.x, this.viewOffset.y);

      // Draw connections
      this.renderConnections();

      // Draw connection preview
      if (this.isDraggingConnection && this.connectionStart) {
        this.renderConnectionPreview();
      }

      // Draw nodes
      this.renderNodes();

      this.ctx.restore();
    } catch (error) {
      console.error("Error rendering node editor:", error);
    }
  }

  /**
   * Render all connections
   */
  renderConnections() {
    this.connections.forEach((connection) => {
      this.renderConnection(connection);
    });
  }

  /**
   * Render a single connection
   */
  renderConnection(connection) {
    const fromNode = this.nodes.get(connection.from);
    const toNode = this.nodes.get(connection.to);

    if (!fromNode || !toNode) return;

    const fromX = fromNode.x + fromNode.width / 2;
    const fromY = fromNode.y + fromNode.height / 2;
    const toX = toNode.x + toNode.width / 2;
    const toY = toNode.y + toNode.height / 2;

    // Set line style based on connection type
    this.ctx.strokeStyle = connection.type === "choice" ? "#e74c3c" : "#3498db";
    this.ctx.lineWidth = 2;

    // Draw line
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();

    // Draw arrow
    this.drawArrow(fromX, fromY, toX, toY);

    // Draw label
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    this.renderConnectionLabel(connection.label, midX, midY);
  }

  /**
   * Draw arrow at end of connection
   */
  drawArrow(fromX, fromY, toX, toY) {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Calculate arrow position (at edge of target node)
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const factor = (distance - this.nodeWidth / 2) / distance;

    const arrowX = fromX + dx * factor;
    const arrowY = fromY + dy * factor;

    this.ctx.beginPath();
    this.ctx.moveTo(arrowX, arrowY);
    this.ctx.lineTo(
      arrowX - headLength * Math.cos(angle - Math.PI / 6),
      arrowY - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(arrowX, arrowY);
    this.ctx.lineTo(
      arrowX - headLength * Math.cos(angle + Math.PI / 6),
      arrowY - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  /**
   * Render connection label
   */
  renderConnectionLabel(text, x, y) {
    if (!text) return;

    // Truncate long text
    const maxLength = 20;
    const displayText =
      text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.font = "12px Arial";

    const textWidth = this.ctx.measureText(displayText).width;
    const padding = 4;

    // Background
    this.ctx.fillRect(
      x - textWidth / 2 - padding,
      y - 8,
      textWidth + padding * 2,
      16
    );

    // Text
    this.ctx.fillStyle = "#ffffff";
    this.ctx.textAlign = "center";
    this.ctx.fillText(displayText, x, y + 4);
  }

  /**
   * Render connection preview while dragging
   */
  renderConnectionPreview() {
    const fromNode = this.connectionStart;
    const fromX = fromNode.x + fromNode.width / 2;
    const fromY = fromNode.y + fromNode.height / 2;

    this.ctx.strokeStyle = "#95a5a6";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(this.mousePos.x, this.mousePos.y);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  /**
   * Render all nodes
   */
  renderNodes() {
    this.nodes.forEach((node) => {
      this.renderNode(node);
    });
  }

  /**
   * Render a single node - updated to include scene type toggle
   */
  renderNode(node) {
    const { x, y, width, height, scene } = node;

    // Get colors based on scene type
    const colors =
      scene.type === "choice" ? this.colors.choice : this.colors.image;

    // Draw node background
    this.ctx.fillStyle =
      this.selectedNode === node ? colors.active : colors.background;
    this.ctx.fillRect(x, y, width, height);

    // Draw border
    this.ctx.strokeStyle = colors.border;
    this.ctx.lineWidth = this.selectedNode === node ? 3 : 1;
    this.ctx.strokeRect(x, y, width, height);

    // Draw background image if exists
    if (node.backgroundImage) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.3;
      this.ctx.drawImage(node.backgroundImage, x, y, width, height);
      this.ctx.restore();
    }

    // Draw scene objects (mini preview)
    if (scene.images && scene.images.length > 0) {
      this.renderSceneObjects(node, scene.images);
    }

    // Draw text
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = "bold 14px Arial";
    this.ctx.textAlign = "center";

    // Scene ID
    this.ctx.fillText(`Scene ${node.id}`, x + width / 2, y + 20);

    // Scene name
    this.ctx.font = "12px Arial";
    const name = scene.name || "Untitled Scene";
    this.ctx.fillText(name, x + width / 2, y + 40);

    // Scene type
    this.ctx.font = "10px Arial";
    this.ctx.fillStyle = "#bdc3c7";
    this.ctx.fillText(scene.type, x + width / 2, y + height - 50);

    // Draw scene type toggle button
    this.renderSceneTypeToggle(node);

    // Draw connection points if selected
    if (this.selectedNode === node) {
      this.renderConnectionPoints(node);
    }
  }

  /**
   * Render scene type toggle button - shows current type
   */
  renderSceneTypeToggle(node) {
    const toggleArea = this.getToggleArea(node);
    const { x, y, width, height } = toggleArea;

    // Button background - more prominent in center
    this.ctx.fillStyle = "#34495e";
    this.ctx.fillRect(x, y, width, height);

    // Button border - thicker for visibility
    this.ctx.strokeStyle = "#2c3e50";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    // Button text - shows CURRENT type
    this.ctx.fillStyle = "#ecf0f1";
    this.ctx.font = "bold 12px Arial";
    this.ctx.textAlign = "center";

    const currentType = node.scene.type;
    const buttonText = currentType === "choice" ? "Choice" : "Image";
    this.ctx.fillText(buttonText, x + width / 2, y + height / 2 + 4);
  }

  /**
   * Render scene objects in mini preview - adjusted for centered toggle button
   */
  renderSceneObjects(node, objects) {
    if (!objects || objects.length === 0) return;

    const { x, y, width, height } = node;
    const toggleArea = this.getToggleArea(node);

    // Create preview areas around the centered toggle button
    const previewAreas = [
      // Top area
      {
        x: x + 10,
        y: y + 50,
        width: width - 20,
        height: toggleArea.y - y - 60,
      },
      // Bottom area
      {
        x: x + 10,
        y: toggleArea.y + toggleArea.height + 10,
        width: width - 20,
        height: y + height - (toggleArea.y + toggleArea.height) - 50,
      },
    ];

    // Limit objects to prevent performance issues
    const maxObjects = Math.min(objects.length, 10);
    let objectIndex = 0;

    // Distribute objects across preview areas
    previewAreas.forEach((previewArea) => {
      if (previewArea.height > 20 && objectIndex < maxObjects) {
        // Only use areas with reasonable height
        const objectsInThisArea = Math.min(3, maxObjects - objectIndex);

        for (
          let i = 0;
          i < objectsInThisArea && objectIndex < maxObjects;
          i++, objectIndex++
        ) {
          const obj = objects[objectIndex];
          const objX = previewArea.x + (obj.x / 100) * previewArea.width;
          const objY = previewArea.y + (obj.y / 100) * previewArea.height;
          const objSize =
            Math.min(previewArea.width, previewArea.height) *
            0.15 *
            (obj.scale || 1);

          // Use different colors for different objects
          const colors = [
            "#3498db",
            "#e74c3c",
            "#2ecc71",
            "#f39c12",
            "#9b59b6",
          ];
          this.ctx.fillStyle = colors[objectIndex % colors.length];
          this.ctx.fillRect(
            objX - objSize / 2,
            objY - objSize / 2,
            objSize,
            objSize
          );
        }
      }
    });

    // Show count if more than 10 objects - position it below the toggle button
    if (objects.length > 10) {
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "10px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        `+${objects.length - 10} more`,
        x + width / 2,
        toggleArea.y + toggleArea.height + 35
      );
    }
  }

  /**
   * Render connection points on selected node
   */
  renderConnectionPoints(node) {
    const { x, y, width, height } = node;
    const radius = this.connectionRadius;

    // Draw connection points at edges
    const points = [
      { x: x + width / 2, y: y }, // Top
      { x: x + width, y: y + height / 2 }, // Right
      { x: x + width / 2, y: y + height }, // Bottom
      { x: x, y: y + height / 2 }, // Left
    ];

    points.forEach((point) => {
      this.ctx.fillStyle = "#27ae60";
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  cleanup() {
    // Remove window resize listener
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      this.resizeHandler = null;
    }

    // Reset canvas cursor
    if (this.canvas) {
      this.canvas.style.cursor = "grab";
    }

    this.nodes.clear();
    this.connections = [];
    this.selectedNode = null;
    this.draggingNode = null;
    this.isDraggingConnection = false;
    this.connectionStart = null;
    this.isPanning = false;
    this.canvas = null;
    this.ctx = null;
  }
}

// Initialize node editor
window.nodeEditor = new NodeEditor();
