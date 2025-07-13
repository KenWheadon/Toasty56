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

    // Audio Configuration
    AUDIO: {
      BACKGROUND_MUSIC: "audio/background.mp3",
      BUTTON_HOVER: "audio/hover.wav",
      BUTTON_CLICK: "audio/click.wav",
      BACKGROUND_VOLUME: 0.3,
      EFFECT_VOLUME: 0.5,
      FADE_DURATION: 1000,
    },
  };

  window.CONFIG = Object.freeze(CONFIG);
})();
