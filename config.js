(function () {
  "use strict";

  const CONFIG = {
    FADE_DURATION: 500,
    SLIDE_DURATION: 800,
    SCALE_DURATION: 600,
    GLOW_DURATION: 1000,
    WIGGLE_DURATION: 600,

    CONTINUE_BUTTON_TEXT: "Continue",
    GAME_CONTAINER_ID: "game-container",
    STORY_CONFIG_PATH: "story-config.json",

    SCENE_WIDTH: 800,
    SCENE_HEIGHT: 600,

    MIN_SCALE: 0.1,
    MAX_SCALE: 3.0,
    MIN_ROTATION: -360,
    MAX_ROTATION: 360,
    MIN_OPACITY: 0.0,
    MAX_OPACITY: 1.0,
  };

  window.CONFIG = Object.freeze(CONFIG);
})();
