/*
Copyright 2021, LWChris

This script is distributed under CC BY-SA 4.0.

This script uses the following third-party resources:
  * GM_config (https://github.com/sizzlemctwizzle/GM_config)
      Distributed under LGPL-3.0-or-later
      https://www.gnu.org/licenses/lgpl-3.0
  * iconmonstr "Brightness 3" (https://iconmonstr.com/brightness-3-svg/)
      Distributed under iconmonstr custom license
      https://iconmonstr.com/license/
*/

// ==UserScript==
// @name            Twitch Fullscreen Brightness
// @description     Control fullscreen video brightness by mouse wheel
// @name:de         Twitch Vollbild Helligkeit
// @description:de  Steuere die Vollbild-Video-Helligkeit mit dem Mausrad
// @icon            https://raw.githubusercontent.com/lwchris/twitch_fullscreen_brightness/master/icon.png
// @namespace       LWChris
// @author          LWChris
// @match           https://www.twitch.tv/*
// @version         1.2
// @require         https://openuserjs.org/src/libs/sizzle/GM_config.min.js
// @grant           GM.registerMenuCommand
// ==/UserScript==

(function() {
  'use strict';
  
  // L10N RESOURCES
  const CONFIG_ID = "LWChris-Twitch_Fullscreen_Brightness-GM_config";
  const LANGUAGE_FIELD_ID = "language";
  const LANGUAGE_DEFAULT = "en";

  const DEFAULT_BRIGHTNESS_FIELD_ID = "defaultBrightness";
  const DEFAULT_BRIGHTNESS_DEFAULT = "100%";

  const MIN_BRIGHTNESS_FIELD_ID = "minBrightness";
  const MIN_BRIGHTNESS_DEFAULT = "30%";

  const MAX_BRIGHTNESS_FIELD_ID = "maxBrightness";
  const MAX_BRIGHTNESS_DEFAULT = "100%";

  const ADJUSTMENT_SPEED_FIELD_ID = "adjustmentSpeed";
  const ADJUSTMENT_SPEED_SLOW = "Slow";
  const ADJUSTMENT_SPEED_DEFAULT = "Normal";
  const ADJUSTMENT_SPEED_FAST = "Fast";

  const OVERLAY_DURATION_FIELD_ID = "overlayDuration";
  const OVERLAY_DURATION_OFF = "Off";
  const OVERLAY_DURATION_SHORT = "Short";
  const OVERLAY_DURATION_DEFAULT = "Normal";
  const OVERLAY_DURATION_LONG = "Long";

  const TRANSLATABLE_FIELD_IDS = [ ADJUSTMENT_SPEED_FIELD_ID, OVERLAY_DURATION_FIELD_ID ];

  const LANGUAGE_RESOURCES = {
    [LANGUAGE_DEFAULT]: {
      "ui": {
        "title": "Twitch Fullscreen Brightness",
        "save": "Save",
        "close": "Close",
        "reset": "Reset to default",
        "open": "'Twitch Fullscreen Brightness' Settings"
      },
      "fields": {
        [LANGUAGE_FIELD_ID]: {
          "label": "Language",
          "type": "select",
          "options": [LANGUAGE_DEFAULT, "de"],
          "default": LANGUAGE_DEFAULT,
          "save": false
        },
        [DEFAULT_BRIGHTNESS_FIELD_ID]: {
          "label": "Default Brightness",
          "type": "select",
          "options": ["10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", DEFAULT_BRIGHTNESS_DEFAULT],
          "default": DEFAULT_BRIGHTNESS_DEFAULT
        },
        [MIN_BRIGHTNESS_FIELD_ID]: {
          "label": "Minimum Brightness",
          "type": "select",
          "options": ["10%", "20%", MIN_BRIGHTNESS_DEFAULT, "40%", "50%", "60%", "70%", "80%", "90%", "100%"],
          "default": MIN_BRIGHTNESS_DEFAULT
        },
        [MAX_BRIGHTNESS_FIELD_ID]: {
          "label": "Maximum Brightness",
          "type": "select",
          "options": ["10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", MAX_BRIGHTNESS_DEFAULT],
          "default": MAX_BRIGHTNESS_DEFAULT
        },
        [ADJUSTMENT_SPEED_FIELD_ID]: {
          "label": "Adjustment Speed",
          "type": "select",
          "options": [ADJUSTMENT_SPEED_SLOW, ADJUSTMENT_SPEED_DEFAULT, ADJUSTMENT_SPEED_FAST],
          "default": ADJUSTMENT_SPEED_DEFAULT
        },
        [OVERLAY_DURATION_FIELD_ID]: {
          "label": "Show Overlay",
          "type": "select",
          "options": [OVERLAY_DURATION_OFF, OVERLAY_DURATION_SHORT, OVERLAY_DURATION_DEFAULT, OVERLAY_DURATION_LONG],
          "default": OVERLAY_DURATION_DEFAULT
        }
      }
    },
    "de": {
      "ui": {
        "title": "Twitch Vollbild Helligkeit",
        "save": "Speichern",
        "close": "Schließen",
        "reset": "Zurücksetzen",
        "open": "'Twitch Vollbild Helligkeit' Einstellungen"
      },
      "fields": {
        [LANGUAGE_FIELD_ID]: {
          "label": "Sprache",
          "type": "select",
          "options": [LANGUAGE_DEFAULT, "de"],
          "default": LANGUAGE_DEFAULT,
          "save": false
        },
        [DEFAULT_BRIGHTNESS_FIELD_ID]: {
          "label": "Standard-Helligkeit",
          "type": "select",
          "options": ["10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", DEFAULT_BRIGHTNESS_DEFAULT],
          "default": DEFAULT_BRIGHTNESS_DEFAULT
        },
        [MIN_BRIGHTNESS_FIELD_ID]: {
          "label": "Minimale Helligkeit",
          "type": "select",
          "options": ["10%", "20%", MIN_BRIGHTNESS_DEFAULT, "40%", "50%", "60%", "70%", "80%", "90%", "100%"],
          "default": MIN_BRIGHTNESS_DEFAULT
        },
        [MAX_BRIGHTNESS_FIELD_ID]: {
          "label": "Maximale Helligkeit",
          "type": "select",
          "options": ["10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", MAX_BRIGHTNESS_DEFAULT],
          "default": MAX_BRIGHTNESS_DEFAULT
        },
        [ADJUSTMENT_SPEED_FIELD_ID]: {
          "label": "Änderungsrate",
          "type": "select",
          "options": ["Langsam", ADJUSTMENT_SPEED_DEFAULT, "Schnell"],
          "default": ADJUSTMENT_SPEED_DEFAULT
        },
        [OVERLAY_DURATION_FIELD_ID]: {
          "label": "Overlay anzeigen",
          "type": "select",
          "options": ["Aus", "Kurz", OVERLAY_DURATION_DEFAULT, "Lang"],
          "default": OVERLAY_DURATION_DEFAULT
        }
      }
    }
  };

  // CONSTANTS
  const OVERLAY_FADE_STEP = 20; // Smaller values = smoother animation
  const SVG_NS = "http://www.w3.org/2000/svg";

  // STATE VARIABLES
  var resources, brightness, opacity, showTimer, fadeTimer, video, overlay, icon, text, settingsFrame;

  // CONFIG VARIABLES
  var currentLanguage, defaultBrightness, minBrightness, maxBrightness, brightnessStep, useOverlay, overlayShowDuration, overlayFadeDuration;

  const _init = function() {
    initConfig();
    applyConfig();
    brightness = defaultBrightness;
    document.addEventListener("fullscreenchange", fullScreenChanged);
    createOverlay();
  };

  const initConfig = function() {
    const resetDiv = document.createElement("div");
    resetDiv.style = "all: initial";
    settingsFrame = document.createElement("div");
    resetDiv.appendChild(settingsFrame);
    document.body.appendChild(resetDiv);
    reloadConfig();
    GM.registerMenuCommand(resources.ui.open, openConfig);
  };

  const reloadConfig = function() {
    currentLanguage = GM_config.getValue(LANGUAGE_FIELD_ID, LANGUAGE_DEFAULT);
    resources = LANGUAGE_RESOURCES[currentLanguage];
    GM_config.init({
      "id": CONFIG_ID,
      "title": resources.ui.title,
      "fields": resources.fields,
      "events": {
        "init": onConfigInit,
        "open": onConfigOpen,
        "save": onConfigSave
      },
      "frame": settingsFrame,
      "css": "\
#LWChris-Twitch_Fullscreen_Brightness-GM_config {\
  background-color: var(--color-background-base);\
  border: 1px solid var(--color-border-base) !important;\
  color: var(--color-text-base);\
  height: unset !important;\
  min-width: 360px;\
  width: unset !important;\
  --color-accent: #9147ff;\
  --color-accent-label: var(--color-white);\
  --color-accent-hover: #a66bff;\
  --color-accent-primary-1: #220055;\
  --color-accent-primary-2: #39018d;\
  --color-accent-primary-3: #924afe;\
  --color-accent-primary-4: #a96ffe;\
  --color-accent-primary-5: #af7afe;\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config * {\
  font-family: var(--font-base) !important;\
}\
.tw-root--theme-light #LWChris-Twitch_Fullscreen_Brightness-GM_config {\
  --color-text-button: var(--color-accent-label);\
  --color-text-button-primary: var(--color-accent-label);\
  --color-text-link: var(--color-accent-primary-2);\
  --color-text-link-active: var(--color-accent-primary-1);\
  --color-text-link-focus: var(--color-accent-primary-1);\
  --color-text-link-hover: var(--color-accent-primary-1);\
  --color-text-link-visited: var(--color-accent-primary-2);\
  --color-background-interactable-hover: var(--color-accent-primary-3);\
  --color-background-interactable-active: var(--color-accent-primary-2);\
  --color-background-button-primary-default: var(--color-accent);\
  --color-background-button-primary-hover: var(--color-accent-hover);\
  --color-background-button-primary-active: var(--color-accent);\
  --color-text-button-text: var(--color-accent-primary-2);\
  --color-text-button-text-active: var(--color-accent-primary-1);\
  --color-text-button-text-focus: var(--color-accent-primary-1);\
  --color-text-button-text-hover: var(--color-accent-primary-1);\
}\
.tw-root--theme-dark #LWChris-Twitch_Fullscreen_Brightness-GM_config {\
  --color-text-button: var(--color-accent-label);\
  --color-text-button-primary: var(--color-accent-label);\
  --color-text-link: var(--color-accent-primary-5);\
  --color-text-link-active: var(--color-accent-primary-4);\
  --color-text-link-focus: var(--color-accent-primary-4);\
  --color-text-link-hover: var(--color-accent-primary-4);\
  --color-text-link-visited: var(--color-accent-primary-5);\
  --color-background-interactable-hover: var(--color-accent-primary-3);\
  --color-background-interactable-active: var(--color-accent-primary-2);\
  --color-background-button-primary-default: var(--color-accent);\
  --color-background-button-primary-hover: var(--color-accent-hover);\
  --color-background-button-primary-active: var(--color-accent);\
  --color-text-button-text: var(--color-accent-primary-5);\
  --color-text-button-text-active: var(--color-accent-primary-4);\
  --color-text-button-text-focus: var(--color-accent-primary-4);\
  --color-text-button-text-hover: var(--color-accent-primary-4);\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config .config_var select {\
  appearance: none;\
  background-clip: padding-box;\
  transition: box-shadow var(--timing-short) ease-in,border var(--timing-short) ease-in,background-color var(--timing-short) ease-in;\
  border-style: solid;\
  border-width: var(--border-width-input);\
  border-color: var(--color-border-input);\
  color: var(--color-text-input);\
  background-color: var(--color-background-input);\
  background-image: url(\"data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2020%2020%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%3Cpath%20fill%3D%22%22%20d%3D%22M10.5%2013.683l2.85-2.442%201.3%201.518-3.337%202.86a1.25%201.25%200%200%201-1.626%200l-3.338-2.86%201.302-1.518%202.849%202.442zm0-7.366L7.65%208.76l-1.3-1.518%203.337-2.86a1.25%201.25%200%200%201%201.627%200l3.337%202.86-1.302%201.518L10.5%206.317z%22%20%2F%3E%0A%3C%2Fsvg%3E\");\
  background-repeat: no-repeat;\
  background-position: right 0.8rem center;\
  background-size: 2rem;\
  border-radius: var(--border-radius-medium);\
  font-size: var(--font-size-6);\
  padding: .5rem 3rem .5rem 1rem;\
  height: 3rem;\
  cursor: pointer;\
  line-height: normal;\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config .config_var select:hover {\
  outline: currentcolor none medium;\
  border-color: var(--color-border-input-hover);\
  background-color: var(--color-background-input);\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config .config_var select:focus {\
  border-color: var(--color-border-input-focus);\
  background-color: var(--color-background-input-focus);\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config .config_var select:focus option {\
  border-color: var(--color-border-input-focus);\
  background-color: var(--color-background-input-focus);\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_wrapper {\
  padding: 20px;\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_header {\
  font-family: var(--font-display);\
  font-weight: 600 !important;\
  line-height: 1.2 !important;\
  font-size: var(--font-size-4) !important;\
  padding: 0 30px 10px !important;\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config .config_var {\
  margin: 10px 0 0 !important;\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config .config_var label {\
  font-weight: normal;\
  line-height: 2.5rem;\
  margin: 0;\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config .config_var select {\
  float: right;\
  width: 14ch;\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config .saveclose_buttons {\
  border-radius: var(--border-radius-medium);\
  font-size: var(--button-text-default);\
  height: var(--button-size-default);\
  margin: 10px 10px 10px 3px !important;\
  min-width: 85px;\
  text-align: center;\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_saveBtn {\
  background-color: var(--color-background-button-primary-default);\
  color: var(--color-text-button-primary);\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_saveBtn:hover {\
	background-color: var(--color-background-button-primary-hover);\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_saveBtn:active {\
	background-color: var(--color-background-button-primary-active);\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_closeBtn {\
	background-color: var(--color-background-button-secondary-default);\
	color: var(--color-text-button-secondary);\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_closeBtn:hover {\
	background-color: var(--color-background-button-secondary-hover);\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_closeBtn:active {\
	background-color: var(--color-background-button-secondary-active);\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config .reset_holder {\
	margin: -5px 10px 10px;\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_resetLink {\
	color: var(--color-text-alt-2) !important;\
	text-decoration: none;\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_resetLink:hover {\
	color: var(--color-text-link-hover) !important;\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_buttons_holder {\
  margin: 30px -10px -20px;\
  border-top: 1px solid var(--color-border-base);\
}\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_language_var.config_var,\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_defaultBrightness_var.config_var,\
#LWChris-Twitch_Fullscreen_Brightness-GM_config_overlayDuration_var.config_var {\
	margin-top: 20px !important;\
}\
"
    });
  };

  const openConfig = function() {
    GM_config.open();
  };

  const applyConfig = function() {
    defaultBrightness = toIntValue(GM_config.get(DEFAULT_BRIGHTNESS_FIELD_ID));
    minBrightness = toIntValue(GM_config.get(MIN_BRIGHTNESS_FIELD_ID));
    maxBrightness = toIntValue(GM_config.get(MAX_BRIGHTNESS_FIELD_ID));

    let adjustmentSpeed = GM_config.get(ADJUSTMENT_SPEED_FIELD_ID);
    let overlayDuration = GM_config.get(OVERLAY_DURATION_FIELD_ID);

    if (currentLanguage != LANGUAGE_DEFAULT) {
      let toResources = LANGUAGE_RESOURCES[LANGUAGE_DEFAULT];
      adjustmentSpeed = translateOption(resources, toResources, ADJUSTMENT_SPEED_FIELD_ID, adjustmentSpeed);
      overlayDuration = translateOption(resources, toResources, OVERLAY_DURATION_FIELD_ID, overlayDuration);
    }

    switch (adjustmentSpeed) {
      case ADJUSTMENT_SPEED_SLOW:
        brightnessStep = 2;
        break;
      case ADJUSTMENT_SPEED_FAST:
        brightnessStep = 10;
        break;
      default:
        brightnessStep = 5;
        break;
    }

    brightness -= brightness % brightnessStep;
    if (brightness < minBrightness) {
      brightness = minBrightness;
    }
    if (brightness > maxBrightness) {
      brightness = maxBrightness;
    }

    if (overlayDuration == OVERLAY_DURATION_OFF) {
      useOverlay = false;
    } else {
      useOverlay = true;
      switch (overlayDuration) {
        case OVERLAY_DURATION_SHORT:
          overlayShowDuration = 600;
          overlayFadeDuration = 250;
          break;
        case OVERLAY_DURATION_LONG:
          overlayShowDuration = 3000;
          overlayFadeDuration = 1000;
          break;
        default:
          overlayShowDuration = 2000;
          overlayFadeDuration = 750;
          break;
      }
    }
  };

  const onConfigInit = function() {
    GM_config.fields[LANGUAGE_FIELD_ID].value = currentLanguage;
  };

  const onConfigOpen = function(doc) {
    const config = this;
    doc.getElementById(config.id + "_saveBtn").textContent = resources.ui.save;
    doc.getElementById(config.id + "_closeBtn").textContent = resources.ui.close;
    doc.getElementById(config.id + "_resetLink").textContent = resources.ui.reset;
  };

  const onConfigSave = function(values) {
    for (const id in values) {
      if (id == LANGUAGE_FIELD_ID && values[id] != currentLanguage) {
        const oldLanguage = currentLanguage;
        currentLanguage = values[id];

        translateOptions(oldLanguage, currentLanguage, values);
        GM_config.setValue(LANGUAGE_FIELD_ID, currentLanguage);

        reloadConfig();

        GM_config.close();
        GM_config.open();
      }
    }
    applyConfig();
  };

  const translateOptions = function(fromLanguage, toLanguage, values) {
    const fromResources = LANGUAGE_RESOURCES[fromLanguage];
    const toResources = LANGUAGE_RESOURCES[fromLanguage];

    for (const fieldId of TRANSLATABLE_FIELD_IDS) {
      const fromValue = values[fieldId];
      const toValue = translateOption(fromResources, toResources, fieldId, fromValue);
      values[fieldId] = toValue;
      GM_config.setValue(fieldId, toValue);
    }
  };

  const translateOption = function(fromResources, toResources, fieldId, fromValue) {
    const fromOptions = fromResources.fields[fieldId].options;
    const toOptions = toResources.fields[fieldId].options;
    for (const option in fromOptions) {
      if (fromOptions[option] == fromValue) {
        return toOptions[option];
      }
    }
  };

  const toIntValue = function(percentage) {
    return parseInt(percentage.substring(0, percentage.length));
  };

  const fullScreenChanged = function() {
    if (document.fullscreen) {
      scrollWheelTracking(true);
    } else {
      scrollWheelTracking(false);
    }
  };

  const scrollWheelTracking = function(enable) {
    console.log("scrollWheelTracking", enable);
    video = document.querySelector("video");
    if (video) {
      if (enable) {
        document.addEventListener("wheel", scrolled);
        addOverlay();
        adjustBrightness(brightness, false);
      } else {
        document.removeEventListener("wheel", scrolled);
        removeOverlay();
        adjustBrightness(100, false);
      }
    }
  };

  const scrolled = function(evt) {
    console.log("scrolled");
    if (evt.deltaY > 0 && brightness > minBrightness) {
      brightness -= brightnessStep;
      if (brightness < minBrightness) {
        brightness = minBrightness;
      }
    } else if (evt.deltaY < 0 && brightness < maxBrightness) {
      brightness += brightnessStep;
      if (brightness > maxBrightness) {
        brightness = maxBrightness;
      }
    }
    adjustBrightness(brightness, true);
  };

  const adjustBrightness = function(b, showIfFull) {
    if (video) {
      video.style.opacity = b / 100.0;
      icon.style.opacity = b / 100.0;
      text.innerHTML = b + "%";
      if (useOverlay && b != 100 || showIfFull) {
        showOverlay();
      }
    }
  };

  const createOverlay = function() {
    overlay = document.createElement("div");
    overlay.style = "\
background-color: rgba(0, 0, 0, 0.7);\
border-radius: 10px;\
display: flex;\
font-size: 30px;\
left: 20px;\
opacity: 0;\
position: absolute;\
top: 20px;\
";
    icon = document.createElement("div");
    icon.style = "\
line-height: 0;\
margin: 15px;\
width: 40px;\
";
    const svg = document.createElementNS(SVG_NS, "svg");
    // Attribution optional, but credit where credit is due:
    // https://iconmonstr.com/brightness-3-svg/
    svg.setAttributeNS(null, "width", 40);
    svg.setAttributeNS(null, "height", 40);
    svg.setAttributeNS(null, "viewBox", "0 0 24 24");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttributeNS(null, "d", "\
M17 12c0 2.762-2.238 5-5 5s-5-2.238-5-5 2.238-5 5-5 5 \
2.238 5 5zm-5-7c.34 0 .672.033 1 .08v-2.08h-2v2.08c.32\
8-.047.66-.08 1-.08zm-4.184 1.401l-1.472-1.473-1.415 1\
.415 1.473 1.473c.402-.537.878-1.013 1.414-1.415zm9.78\
2 1.414l1.473-1.473-1.414-1.414-1.473 1.473c.537.402 1\
.012.878 1.414 1.414zm-5.598 11.185c-.34 0-.672-.033-1\
-.08v2.08h2v-2.08c-.328.047-.66.08-1 .08zm4.185-1.402l\
1.473 1.473 1.415-1.415-1.473-1.472c-.403.536-.879 1.0\
12-1.415 1.414zm-11.185-5.598c0-.34.033-.672.08-1h-2.0\
8v2h2.08c-.047-.328-.08-.66-.08-1zm13.92-1c.047.328.08\
.66.08 1s-.033.672-.08 1h2.08v-2h-2.08zm-12.519 5.184l\
-1.473 1.473 1.414 1.414 1.473-1.473c-.536-.402-1.012-\
.877-1.414-1.414z");
    path.setAttributeNS(null, "style", "fill: white");
    svg.appendChild(path);
    icon.appendChild(svg);
    overlay.appendChild(icon);
    text = document.createElement("div");
    text.style = "\
color: white;\
line-height: 70px;\
margin-right: 20px;\
text-align: right;\
width: 80px;\
";
    overlay.appendChild(text);
  };

  const addOverlay = function() {
    if (video) {
      video.parentNode.appendChild(overlay);
    }
  };

  const removeOverlay = function() {
    if (overlay) {
      overlay.remove();
    }
  };

  const showOverlay = function() {
    if (!useOverlay) return;
    window.clearTimeout(showTimer);
    window.clearInterval(fadeTimer);
    opacity = overlayFadeDuration;
    overlay.style.opacity = 1;
    showTimer = window.setTimeout(startFadeOverlay, overlayShowDuration);
  };

  const startFadeOverlay = function() {
    window.clearTimeout(showTimer);
    fadeTimer = window.setInterval(fadeOverlay, OVERLAY_FADE_STEP);
  };

  const fadeOverlay = function() {
    if (opacity > OVERLAY_FADE_STEP) {
      opacity -= OVERLAY_FADE_STEP;
      overlay.style.opacity = (opacity * 1.0) / overlayFadeDuration;
    } else {
      window.clearInterval(fadeTimer);
      opacity = 0;
      overlay.style.opacity = 0;
    }
  };

  _init();
})();