const DEFAULT_BLOCK_SIZE = 5;
const PLAYER_NAMES = ["Bass", "Tenor", "Alto"];
const MIDI_TPQ = 480;
const MIDI_RECORDER_PROGRAM = 73;
const FINAL_CHORD_HOLD_BEATS = 8;
const NO_VALID_NOTE_DECAY_LIFE = 8;
const BREATH_MAX_BEATS = 8;
const BREATH_REST_BEATS = 0;

// Prescribed note choices per chord step, extracted from wtc1p01.krn (Bach WTC I Prelude 1).
const SCORE_CHORDS = [
  [
    "c",
    "cc",
    "g"
  ],
  [
    "cc",
    "e",
    "ee",
    "g"
  ],
  [
    "c",
    "cc",
    "g"
  ],
  [
    "cc",
    "e",
    "ee",
    "g"
  ],
  [
    "a",
    "c",
    "dd"
  ],
  [
    "a",
    "d",
    "dd",
    "ff"
  ],
  [
    "a",
    "c",
    "dd"
  ],
  [
    "a",
    "d",
    "dd",
    "ff"
  ],
  [
    "B",
    "dd",
    "g"
  ],
  [
    "d",
    "dd",
    "ff",
    "g"
  ],
  [
    "B",
    "dd",
    "g"
  ],
  [
    "d",
    "dd",
    "ff",
    "g"
  ],
  [
    "c",
    "cc",
    "g"
  ],
  [
    "cc",
    "e",
    "ee",
    "g"
  ],
  [
    "c",
    "cc",
    "g"
  ],
  [
    "cc",
    "e",
    "ee",
    "g"
  ],
  [
    "a",
    "c",
    "ee"
  ],
  [
    "a",
    "aa",
    "e",
    "ee"
  ],
  [
    "a",
    "c",
    "ee"
  ],
  [
    "a",
    "aa",
    "e",
    "ee"
  ],
  [
    "a",
    "c",
    "f#"
  ],
  [
    "a",
    "d",
    "dd",
    "f#"
  ],
  [
    "a",
    "c",
    "f#"
  ],
  [
    "a",
    "d",
    "dd",
    "f#"
  ],
  [
    "B",
    "dd",
    "g"
  ],
  [
    "d",
    "dd",
    "g",
    "gg"
  ],
  [
    "B",
    "dd",
    "g"
  ],
  [
    "d",
    "dd",
    "g",
    "gg"
  ],
  [
    "B",
    "e",
    "g"
  ],
  [
    "c",
    "cc",
    "e",
    "g"
  ],
  [
    "B",
    "e",
    "g"
  ],
  [
    "c",
    "cc",
    "e",
    "g"
  ],
  [
    "A",
    "e",
    "g"
  ],
  [
    "c",
    "cc",
    "e",
    "g"
  ],
  [
    "A",
    "e",
    "g"
  ],
  [
    "c",
    "cc",
    "e",
    "g"
  ],
  [
    "d",
    "D",
    "f#"
  ],
  [
    "A",
    "cc",
    "d",
    "f#"
  ],
  [
    "d",
    "D",
    "f#"
  ],
  [
    "A",
    "cc",
    "d",
    "f#"
  ],
  [
    "d",
    "g",
    "G"
  ],
  [
    "b",
    "B",
    "d",
    "g"
  ],
  [
    "d",
    "g",
    "G"
  ],
  [
    "b",
    "B",
    "d",
    "g"
  ],
  [
    "e",
    "g",
    "G"
  ],
  [
    "B-",
    "cc#",
    "e",
    "g"
  ],
  [
    "e",
    "g",
    "G"
  ],
  [
    "B-",
    "cc#",
    "e",
    "g"
  ],
  [
    "a",
    "d",
    "F"
  ],
  [
    "a",
    "A",
    "d",
    "dd"
  ],
  [
    "a",
    "d",
    "F"
  ],
  [
    "a",
    "A",
    "d",
    "dd"
  ],
  [
    "d",
    "f",
    "F"
  ],
  [
    "A-",
    "b",
    "d",
    "f"
  ],
  [
    "d",
    "f",
    "F"
  ],
  [
    "A-",
    "b",
    "d",
    "f"
  ],
  [
    "c",
    "E",
    "g"
  ],
  [
    "c",
    "cc",
    "g",
    "G"
  ],
  [
    "c",
    "E",
    "g"
  ],
  [
    "c",
    "cc",
    "g",
    "G"
  ],
  [
    "A",
    "c",
    "E"
  ],
  [
    "A",
    "c",
    "f",
    "F"
  ],
  [
    "A",
    "c",
    "E"
  ],
  [
    "A",
    "c",
    "f",
    "F"
  ],
  [
    "A",
    "c",
    "D"
  ],
  [
    "A",
    "c",
    "f",
    "F"
  ],
  [
    "A",
    "c",
    "D"
  ],
  [
    "A",
    "c",
    "f",
    "F"
  ],
  [
    "B",
    "G",
    "GG"
  ],
  [
    "B",
    "D",
    "f",
    "G"
  ],
  [
    "B",
    "G",
    "GG"
  ],
  [
    "B",
    "D",
    "f",
    "G"
  ],
  [
    "c",
    "C",
    "G"
  ],
  [
    "c",
    "e",
    "E",
    "G"
  ],
  [
    "c",
    "C",
    "G"
  ],
  [
    "c",
    "e",
    "E",
    "G"
  ],
  [
    "B-",
    "c",
    "C"
  ],
  [
    "B-",
    "c",
    "e",
    "G"
  ],
  [
    "B-",
    "c",
    "C"
  ],
  [
    "B-",
    "c",
    "e",
    "G"
  ],
  [
    "A",
    "c",
    "FF"
  ],
  [
    "A",
    "c",
    "e",
    "F"
  ],
  [
    "A",
    "c",
    "FF"
  ],
  [
    "A",
    "c",
    "e",
    "F"
  ],
  [
    "A",
    "c",
    "FF#"
  ],
  [
    "A",
    "c",
    "C",
    "e-"
  ],
  [
    "A",
    "c",
    "FF#"
  ],
  [
    "A",
    "c",
    "C",
    "e-"
  ],
  [
    "AA-",
    "B",
    "c"
  ],
  [
    "B",
    "c",
    "d",
    "F"
  ],
  [
    "AA-",
    "B",
    "c"
  ],
  [
    "B",
    "c",
    "d",
    "F"
  ],
  [
    "B",
    "G",
    "GG"
  ],
  [
    "B",
    "d",
    "F",
    "G"
  ],
  [
    "B",
    "G",
    "GG"
  ],
  [
    "B",
    "d",
    "F",
    "G"
  ],
  [
    "c",
    "G",
    "GG"
  ],
  [
    "c",
    "e",
    "E",
    "G"
  ],
  [
    "c",
    "G",
    "GG"
  ],
  [
    "c",
    "e",
    "E",
    "G"
  ],
  [
    "c",
    "G",
    "GG"
  ],
  [
    "c",
    "D",
    "f",
    "G"
  ],
  [
    "c",
    "G",
    "GG"
  ],
  [
    "c",
    "D",
    "f",
    "G"
  ],
  [
    "B",
    "G",
    "GG"
  ],
  [
    "B",
    "D",
    "f",
    "G"
  ],
  [
    "B",
    "G",
    "GG"
  ],
  [
    "B",
    "D",
    "f",
    "G"
  ],
  [
    "A",
    "c",
    "GG"
  ],
  [
    "A",
    "c",
    "E-",
    "f#"
  ],
  [
    "A",
    "c",
    "GG"
  ],
  [
    "A",
    "c",
    "E-",
    "f#"
  ],
  [
    "c",
    "G",
    "GG"
  ],
  [
    "c",
    "E",
    "g",
    "G"
  ],
  [
    "c",
    "G",
    "GG"
  ],
  [
    "c",
    "E",
    "g",
    "G"
  ],
  [
    "c",
    "G",
    "GG"
  ],
  [
    "c",
    "D",
    "f",
    "G"
  ],
  [
    "c",
    "G",
    "GG"
  ],
  [
    "c",
    "D",
    "f",
    "G"
  ],
  [
    "B",
    "G",
    "GG"
  ],
  [
    "B",
    "D",
    "f",
    "G"
  ],
  [
    "B",
    "G",
    "GG"
  ],
  [
    "B",
    "D",
    "f",
    "G"
  ],
  [
    "B-",
    "CC",
    "G"
  ],
  [
    "B-",
    "C",
    "e",
    "G"
  ],
  [
    "B-",
    "CC",
    "G"
  ],
  [
    "B-",
    "C",
    "e",
    "G"
  ],
  [
    "A",
    "CC",
    "F"
  ],
  [
    "A",
    "c",
    "C",
    "f"
  ],
  [
    "A",
    "c",
    "F"
  ],
  [
    "D",
    "F"
  ],
  [
    "b",
    "CC",
    "g"
  ],
  [
    "b",
    "BB",
    "dd",
    "ff"
  ],
  [
    "b",
    "dd",
    "g"
  ],
  [
    "d",
    "e",
    "f"
  ],
  [
    "C",
    "cc",
    "CC",
    "e",
    "g"
  ]
];

const VOICE_MIDI_RANGES = [
  { min: 53, max: 74 }, // Bass recorder comfortable range: F3-D5
  { min: 60, max: 76 }, // Tenor recorder comfortable range: C4-E5
  { min: 65, max: 79 }, // Alto recorder comfortable range: F4-G5
];

const BASS_OMIT_PITCHES = new Set(["C", "E"]);

const seedGridEl = document.getElementById("seed-grid");
const historyGridEl = document.getElementById("history-grid");
const kernOutputEl = document.getElementById("kern-output");
const xmlOutputEl = document.getElementById("xml-output");
const stepBtn = document.getElementById("step-btn");
const playBtn = document.getElementById("play-btn");
const resetBtn = document.getElementById("reset-btn");
const kernBtn = document.getElementById("kern-btn");
const xmlBtn = document.getElementById("xml-btn");
const generateXmlBtn = document.getElementById("generate-xml-btn");
const midiBtn = document.getElementById("midi-btn");
const midiPreviewBtn = document.getElementById("midi-preview-btn");
const audioBtn = document.getElementById("audio-btn");
const rngSeedInput = document.getElementById("rng-seed-input");
const rngApplyBtn = document.getElementById("rng-apply-btn");
const rngGenerateBtn = document.getElementById("rng-generate-btn");
const speedInput = document.getElementById("speed-input");
const speedLabel = document.getElementById("speed-label");
const volumeInput = document.getElementById("volume-input");
const volumeLabel = document.getElementById("volume-label");
const sweepStartInput = document.getElementById("sweep-start-input");
const sweepStartLabel = document.getElementById("sweep-start-label");
const sweepEndInput = document.getElementById("sweep-end-input");
const sweepEndLabel = document.getElementById("sweep-end-label");
const sweepModeSelect = document.getElementById("sweep-mode-select");
const manualLambdaInput = document.getElementById("manual-lambda-input");
const manualLambdaLabel = document.getElementById("manual-lambda-label");
const sweepDurationInput = document.getElementById("sweep-duration-input");
const sweepDurationLabel = document.getElementById("sweep-duration-label");
const currentLambdaDisplayEl = document.getElementById("current-lambda-display");
const blockSizeInput = document.getElementById("block-size-input");
const blockSizeLabel = document.getElementById("block-size-label");

let blockSize = DEFAULT_BLOCK_SIZE;

function normalizeBlockSize(value) {
  const parsed = Number(value);
  let size = Number.isFinite(parsed) ? parsed : DEFAULT_BLOCK_SIZE;
  size = Math.max(3, Math.min(15, size));
  if (size % 2 === 0) {
    size += 1;
  }
  return size;
}

function getTotalCells() {
  return blockSize * PLAYER_NAMES.length;
}

function getOutputCellOffset() {
  return Math.floor(blockSize / 2);
}

function getBlockLabels() {
  return PLAYER_NAMES.flatMap((name) => Array(blockSize).fill(name));
}

function createDefaultSeed(size = blockSize) {
  const cells = [];
  const gateOffset = Math.floor(size / 2);
  for (let player = 0; player < PLAYER_NAMES.length; player += 1) {
    for (let i = 0; i < size; i += 1) {
      cells.push(i === gateOffset ? 1 : 0);
    }
  }
  return cells;
}

let seed = createDefaultSeed();
let currentCaRow = [...seed];
let caHistory = [[...currentCaRow]];
let playerProgress = [];
let voiceHistory = [];
let finalPhase = {
  active: false,
  beatsElapsed: 0,
  completed: false,
};
let xmlCache = "";
let xmlCacheDirty = true;

let playTimer = null;
let midiPreviewTimer = null;
let midiPreviewIndex = 0;
let maxHistoryRows = 96;
let sweepStartLambda = 0.0;
let sweepEndLambda = 1.0;
let sweepMode = "forward";
let manualLambda = 0.5;
let sweepDuration = 96;
let sweepStep = 0;
let patternOrders = [[], [], []];
let ruleTables = [
  new Array(8).fill(0),
  new Array(8).fill(0),
  new Array(8).fill(0),
];
let currentLambda = 0.0;

let audioEnabled = true;
let audioCtx = null;
let masterGain = null;
let outputCompressor = null;
const voiceSynths = Array(PLAYER_NAMES.length).fill(null);

let rngSeedText = "trio-001";
let rngState = 0;

function hashSeed(text) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

function reseedRng(seedText) {
  const normalized = String(seedText || "").trim() || "trio-001";
  rngSeedText = normalized;
  rngState = hashSeed(normalized);
  if (rngSeedInput) {
    rngSeedInput.value = normalized;
  }
}

function random01() {
  rngState = (rngState + 0x6d2b79f5) >>> 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function createSeededRandom(seedText) {
  let state = hashSeed(seedText);
  return function seededRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGeneratedSeed() {
  return `seed-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function randomChoice(items) {
  if (!items || items.length === 0) {
    return null;
  }
  return items[Math.floor(random01() * items.length)];
}

function shiftPitchOctaveOnce(pitch, direction) {
  const match = String(pitch || "").match(/^([A-Ga-g]+)([#\-xXn]*)$/);
  if (!match) {
    return null;
  }

  let letters = match[1];
  const accidental = match[2] || "";
  const isLower = letters[0] >= "a" && letters[0] <= "z";

  if (direction > 0) {
    if (isLower) {
      letters += letters[0];
    } else if (letters.length > 1) {
      letters = letters.slice(1);
    } else {
      letters = letters.toLowerCase();
    }
  } else if (direction < 0) {
    if (!isLower) {
      letters = letters[0] + letters;
    } else if (letters.length > 1) {
      letters = letters.slice(1);
    } else {
      letters = letters.toUpperCase();
    }
  }

  return `${letters}${accidental}`;
}

function shiftPitchByOctaves(pitch, octaves) {
  let out = pitch;
  const dir = octaves >= 0 ? 1 : -1;
  for (let i = 0; i < Math.abs(octaves); i += 1) {
    out = shiftPitchOctaveOnce(out, dir);
    if (!out) {
      return null;
    }
  }
  return out;
}

function getChordChoicesForVoice(chord, voiceIndex) {
  const range = VOICE_MIDI_RANGES[voiceIndex];
  if (!Array.isArray(chord) || !range) {
    return [];
  }

  // Literal mode: only pitches explicitly present in the source chord token set.
  const choices = chord.filter((candidate) => {
    if (voiceIndex === 0 && BASS_OMIT_PITCHES.has(candidate)) {
      return false;
    }

    const midi = pitchToMidi(candidate);
    if (midi === null) {
      return false;
    }

    return midi >= range.min && midi <= range.max;
  });

  return [...new Set(choices)].sort((a, b) => pitchToMidi(a) - pitchToMidi(b));
}

function choosePitchForVoice(chord, voiceIndex, fallbackPitch = null) {
  const choices = getChordChoicesForVoice(chord, voiceIndex);
  if (choices.length === 0) {
    return fallbackPitch;
  }

  return randomChoice(choices);
}

function createInitialPlayers() {
  return PLAYER_NAMES.map((_, voiceIndex) => {
    return {
      chordIndex: 0,
      pitch: null,
      decayRemaining: 0,
      breathBeats: 0,
      forcedRestRemaining: 0,
    };
  });
}

function snapshotVoices(players, strikeAll = false) {
  return players.map((player) => ({
    state: strikeAll ? 2 : 1,
    pitch: player.pitch,
  }));
}

function createRestVoices() {
  return PLAYER_NAMES.map(() => ({ state: 0, pitch: null }));
}

function resetSimulationState() {
  reseedRng(rngSeedText);
  initPatternOrders();
  sweepStep = 0;
  updateRuleTables(getSweepLambdaAtStep(sweepStep));
  if (currentLambdaDisplayEl) {
    currentLambdaDisplayEl.textContent = currentLambda.toFixed(3);
  }
  if (seed.length !== getTotalCells()) {
    seed = createDefaultSeed();
  }
  currentCaRow = [...seed];
  caHistory = [[...currentCaRow]];
  playerProgress = createInitialPlayers();
  voiceHistory = [createRestVoices()];
  finalPhase = {
    active: false,
    beatsElapsed: 0,
    completed: false,
  };

  invalidateXmlCache();
}

function getVolumeScalar() {
  return Number(volumeInput.value) / 100;
}

function getMasterGainLevel() {
  return Math.min(0.9, 0.28 * getVolumeScalar());
}

function getMidiVelocity(isStrike) {
  const baseVelocity = isStrike ? 94 : 82;
  const velocity = Math.round(baseVelocity * getVolumeScalar());
  return Math.max(1, Math.min(127, velocity));
}

function getTempoBpm() {
  return Number(speedInput.value);
}

function getStepDurationMs() {
  const bpm = Math.max(1, getTempoBpm());
  return Math.round(60000 / bpm);
}

function blockStart(index) {
  return Math.floor(index / blockSize) * blockSize;
}

function getOutputCellIndex(playerIndex) {
  return blockStart(playerIndex * blockSize) + getOutputCellOffset();
}

// --- Langton λ rule table ---
// For a 2-state, radius-1 (3-cell neighbourhood) CA there are 8 possible
// input patterns: 000..111 (indices 0-7).  Pattern 000 → 0 is fixed as the
// quiescent state so that an all-zero grid stays dead.  λ controls how many
// of the remaining 7 patterns map to 1.  The mapping is established by a
// seeded shuffle of those 7 indices so that it is deterministic per RNG seed
// yet arbitrary (not biased toward any particular rule).

function buildPatternOrder(rng) {
  const patterns = [1, 2, 3, 4, 5, 6, 7];
  for (let i = patterns.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [patterns[i], patterns[j]] = [patterns[j], patterns[i]];
  }

  // Ensure the first activatable pattern can affect the default single-gate seed
  // (neighborhoods 001, 010, 100), so a non-zero lambda does not immediately die out.
  const seedResponsivePatterns = [1, 2, 4];
  const preferred = seedResponsivePatterns[Math.floor(rng() * seedResponsivePatterns.length)];
  const preferredIndex = patterns.indexOf(preferred);
  if (preferredIndex > 0) {
    [patterns[0], patterns[preferredIndex]] = [patterns[preferredIndex], patterns[0]];
  }

  return patterns;
}

function buildRuleTable(lambda, patternOrder) {
  const table = new Array(8).fill(0);
  let activeCount = Math.round(lambda * patternOrder.length);
  if (lambda > 0 && activeCount === 0) {
    activeCount = 1;
  }
  for (let i = 0; i < activeCount; i += 1) {
    table[patternOrder[i]] = 1;
  }

  // At the top of the sweep, treat lambda as total life so dead blocks can re-seed.
  if (lambda >= 1 - Number.EPSILON) {
    table[0] = 1;
  }

  return table;
}

function applyRule(table, left, center, right) {
  return table[(left << 2) | (center << 1) | right];
}

function initPatternOrders() {
  patternOrders = PLAYER_NAMES.map(() => buildPatternOrder(random01));
}

function updateRuleTables(lambda) {
  currentLambda = Math.max(0, Math.min(1, lambda));
  ruleTables = patternOrders.map((order) => buildRuleTable(currentLambda, order));
}

// --- λ sweep ---

function getSweepLambdaAtStep(step) {
  if (sweepMode === "manual") {
    return manualLambda;
  }

  const dur = Math.max(1, sweepDuration);
  if (sweepMode === "bounce") {
    const period = dur * 2;
    const pos = step % period;
    const t = pos < dur ? pos / dur : 2 - pos / dur;
    return sweepStartLambda + t * (sweepEndLambda - sweepStartLambda);
  }
  if (sweepMode === "loop") {
    const t = (step % dur) / dur;
    return sweepStartLambda + t * (sweepEndLambda - sweepStartLambda);
  }
  if (sweepMode === "reverse") {
    const t = Math.min(1, step / dur);
    return sweepEndLambda + t * (sweepStartLambda - sweepEndLambda);
  }
  // "forward" (default)
  const t = Math.min(1, step / dur);
  return sweepStartLambda + t * (sweepEndLambda - sweepStartLambda);
}

function advanceSweep() {
  if (sweepMode === "manual") {
    updateRuleTables(manualLambda);
    if (currentLambdaDisplayEl) {
      currentLambdaDisplayEl.textContent = currentLambda.toFixed(3);
    }
    return;
  }

  sweepStep += 1;
  updateRuleTables(getSweepLambdaAtStep(sweepStep));
  if (currentLambdaDisplayEl) {
    currentLambdaDisplayEl.textContent = currentLambda.toFixed(3);
  }
}

function setSweepControlEnabled(control, enabled) {
  if (!control) {
    return;
  }

  control.disabled = !enabled;
  const wrapper = control.closest("label");
  if (wrapper) {
    wrapper.style.opacity = enabled ? "1" : "0.55";
  }
}

function syncSweepModeUi() {
  const manualMode = sweepMode === "manual";
  setSweepControlEnabled(sweepStartInput, !manualMode);
  setSweepControlEnabled(sweepEndInput, !manualMode);
  setSweepControlEnabled(sweepDurationInput, !manualMode);
}

// --- CA transition ---

function nextStateForPlayerCount(state, ruleTbls, playerCount) {
  const totalCells = blockSize * playerCount;
  const next = Array(totalCells).fill(0);

  for (let block = 0; block < playerCount; block += 1) {
    const start = block * blockSize;
    const table = ruleTbls[block];

    for (let i = 0; i < blockSize; i += 1) {
      const idx = start + i;
      const leftIdx = start + ((i - 1 + blockSize) % blockSize);
      const rightIdx = start + ((i + 1) % blockSize);
      next[idx] = applyRule(table, state[leftIdx], state[idx], state[rightIdx]);
    }
  }

  return next;
}

function nextState(state) {
  return nextStateForPlayerCount(state, ruleTables, PLAYER_NAMES.length);
}

function advancePlayersFromCa(nextCaRow) {
  const lastChordIndex = SCORE_CHORDS.length - 1;
  const nextPlayers = playerProgress.map((player) => ({ ...player }));
  const voices = [];

  for (let voice = 0; voice < PLAYER_NAMES.length; voice += 1) {
    const outputCell = getOutputCellIndex(voice);
    const hit = nextCaRow[outputCell] === 1;
    const player = nextPlayers[voice];
    let state = 1;
    let advanced = false;

    if (hit && player.chordIndex < lastChordIndex) {
      player.chordIndex += 1;
      advanced = true;
    }

    if ((player.forcedRestRemaining ?? 0) > 0) {
      player.forcedRestRemaining -= 1;
      player.pitch = null;
      player.decayRemaining = 0;
      player.breathBeats = 0;
      voices.push({ state: 0, pitch: null });
      continue;
    }

    if (player.pitch && (player.breathBeats ?? 0) >= BREATH_MAX_BEATS) {
      player.pitch = null;
      player.decayRemaining = 0;
      player.breathBeats = 0;
      player.forcedRestRemaining = Math.max(0, BREATH_REST_BEATS - 1);
      voices.push({ state: 0, pitch: null });
      continue;
    }

    const currentChord = SCORE_CHORDS[player.chordIndex];
    const choices = getChordChoicesForVoice(currentChord, voice);

    if (advanced && choices.length > 0) {
      const nextPitch = randomChoice(choices);
      const samePitch = Boolean(player.pitch && nextPitch === player.pitch);
      player.pitch = nextPitch;
      player.decayRemaining = NO_VALID_NOTE_DECAY_LIFE;
      player.breathBeats = samePitch ? (player.breathBeats ?? 0) + 1 : (player.pitch ? 1 : 0);
      player.forcedRestRemaining = 0;
      state = samePitch ? 1 : 2;
    } else if (choices.length === 0) {
      if (player.pitch && (player.decayRemaining ?? NO_VALID_NOTE_DECAY_LIFE) > 0) {
        player.decayRemaining = (player.decayRemaining ?? NO_VALID_NOTE_DECAY_LIFE) - 1;
        player.breathBeats = (player.breathBeats ?? 0) + 1;
        player.forcedRestRemaining = 0;
        state = 1;
      } else {
        player.pitch = null;
        player.decayRemaining = 0;
        player.breathBeats = 0;
        player.forcedRestRemaining = 0;
        state = 0;
      }
    } else {
      if (!player.pitch) {
        player.decayRemaining = 0;
        player.breathBeats = 0;
        player.forcedRestRemaining = 0;
        state = 0;
      } else {
        player.breathBeats = (player.breathBeats ?? 0) + 1;
        state = 1;
        player.decayRemaining = NO_VALID_NOTE_DECAY_LIFE;
        player.forcedRestRemaining = 0;
      }
    }

    voices.push({ state, pitch: player.pitch });
  }

  const allFinished = nextPlayers.every((player) => player.chordIndex >= lastChordIndex);

  return {
    nextPlayers,
    voices,
    allFinished,
  };
}

function toKernPitchToken(pitch) {
  return pitch;
}

function voiceToken(historyRows, rowIndex, voiceIndex) {
  const currentVoice = historyRows[rowIndex][voiceIndex];
  if (currentVoice.state === 0 || !currentVoice.pitch) {
    return "4r";
  }

  const currentPitch = currentVoice.pitch;

  const prevVoice = rowIndex > 0 ? historyRows[rowIndex - 1][voiceIndex] : null;
  const nextVoice = rowIndex + 1 < historyRows.length ? historyRows[rowIndex + 1][voiceIndex] : null;

  const prevSame = prevVoice !== null && prevVoice.pitch === currentPitch;
  const nextSame = nextVoice !== null && nextVoice.pitch === currentPitch;

  if (currentVoice.state === 2) {
    return nextSame ? `[4${toKernPitchToken(currentPitch)}` : `4${toKernPitchToken(currentPitch)}`;
  }

  if (prevSame && nextSame) {
    return `4${toKernPitchToken(currentPitch)}_`;
  }

  if (prevSame && !nextSame) {
    return `4${toKernPitchToken(currentPitch)}]`;
  }

  if (!prevSame && nextSame) {
    return `[4${toKernPitchToken(currentPitch)}`;
  }

  return `4${toKernPitchToken(currentPitch)}`;
}

function toKern(historyRows) {
  const lines = [];
  lines.push("**kern\t**kern\t**kern");
  lines.push("*Ibass\t*Itenor\t*Ialto");
  lines.push("*M4/4\t*M4/4\t*M4/4");

  let bar = 1;
  lines.push(`=${bar}\t=${bar}\t=${bar}`);

  for (let i = 0; i < historyRows.length; i += 1) {
    if (i > 0 && i % 4 === 0) {
      bar += 1;
      lines.push(`=${bar}\t=${bar}\t=${bar}`);
    }

    const bass = voiceToken(historyRows, i, 0);
    const tenor = voiceToken(historyRows, i, 1);
    const alto = voiceToken(historyRows, i, 2);
    lines.push(`${bass}\t${tenor}\t${alto}`);
  }

  lines.push("*-\t*-\t*-");
  return lines.join("\n");
}

function pitchToXmlParts(pitch) {
  const cleaned = String(pitch || "").replace(/[^A-Ga-g#\-xXn]/g, "");
  const letterMatch = cleaned.match(/[A-Ga-g]+/);
  if (!letterMatch) {
    return null;
  }

  const letters = letterMatch[0];
  const accidentalPart = cleaned.slice(letters.length);
  const letter = letters[0];
  const repeats = letters.length;

  const step = letter.toUpperCase();
  let octave = 4;
  if (letter >= "a" && letter <= "z") {
    octave = 4 + (repeats - 1);
  } else {
    octave = 3 - (repeats - 1);
  }

  let alter = 0;
  if (!accidentalPart.includes("n")) {
    for (const ch of accidentalPart) {
      if (ch === "#") {
        alter += 1;
      } else if (ch === "x" || ch === "X") {
        alter += 2;
      } else if (ch === "-") {
        alter -= 1;
      }
    }
  }

  return { step, alter, octave };
}

function xmlTieState(historyRows, rowIndex, voiceIndex) {
  const current = historyRows[rowIndex][voiceIndex];
  if (!current.pitch || current.state === 0) {
    return { starts: false, stops: false };
  }

  const prev = rowIndex > 0 ? historyRows[rowIndex - 1][voiceIndex] : null;
  const next = rowIndex + 1 < historyRows.length ? historyRows[rowIndex + 1][voiceIndex] : null;
  const prevSame = prev && prev.state !== 0 && prev.pitch === current.pitch;
  const nextSame = next && next.state !== 0 && next.pitch === current.pitch;

  return {
    starts: Boolean(nextSame),
    stops: Boolean(prevSame),
  };
}

function xmlDurationSpec(duration) {
  if (duration === 4) {
    return { type: "whole", dots: 0 };
  }

  if (duration === 3) {
    return { type: "half", dots: 1 };
  }

  if (duration === 2) {
    return { type: "half", dots: 0 };
  }

  return { type: "quarter", dots: 0 };
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildXmlNote(noteEvent) {
  const duration = Math.max(1, noteEvent.duration);
  const durationInfo = xmlDurationSpec(duration);

  if (noteEvent.isRest || !noteEvent.pitch) {
    const lines = [
      "      <note>",
      "        <rest/>",
      `        <duration>${duration}</duration>`,
      `        <type>${durationInfo.type}</type>`,
    ];

    for (let i = 0; i < durationInfo.dots; i += 1) {
      lines.push("        <dot/>");
    }

    lines.push("      </note>");
    return lines.join("\n");
  }

  const xmlPitch = pitchToXmlParts(noteEvent.pitch);
  if (!xmlPitch) {
    return [
      "      <note>",
      "        <rest/>",
      `        <duration>${duration}</duration>`,
      `        <type>${durationInfo.type}</type>`,
      "      </note>",
    ].join("\n");
  }

  const lines = [
    "      <note>",
    "        <pitch>",
    `          <step>${xmlPitch.step}</step>`,
  ];

  if (xmlPitch.alter !== 0) {
    lines.push(`          <alter>${xmlPitch.alter}</alter>`);
  }

  lines.push(`          <octave>${xmlPitch.octave}</octave>`);
  lines.push("        </pitch>");
  lines.push(`        <duration>${duration}</duration>`);

  if (noteEvent.tieStop) {
    lines.push('        <tie type="stop"/>');
  }
  if (noteEvent.tieStart) {
    lines.push('        <tie type="start"/>');
  }

  lines.push(`        <type>${durationInfo.type}</type>`);
  for (let i = 0; i < durationInfo.dots; i += 1) {
    lines.push("        <dot/>");
  }

  if (noteEvent.tieStart || noteEvent.tieStop) {
    lines.push("        <notations>");
    if (noteEvent.tieStop) {
      lines.push('          <tied type="stop"/>');
    }
    if (noteEvent.tieStart) {
      lines.push('          <tied type="start"/>');
    }
    lines.push("        </notations>");
  }

  lines.push("      </note>");
  return lines.join("\n");
}

function buildXmlPart(historyRows, voiceIndex, partId) {
  const lines = [`  <part id="${partId}">`];
  const clefByVoice = [
    { sign: "F", line: 4 },
    { sign: "G", line: 2 },
    { sign: "G", line: 2 },
  ];
  const clef = clefByVoice[voiceIndex] ?? { sign: "G", line: 2 };

  let measureNumber = 1;
  for (let i = 0; i < historyRows.length; i += 4) {
    lines.push(`    <measure number="${measureNumber}">`);

    if (measureNumber === 1) {
      lines.push("      <attributes>");
      lines.push("        <divisions>1</divisions>");
      lines.push("        <key><fifths>0</fifths></key>");
      lines.push("        <time><beats>4</beats><beat-type>4</beat-type></time>");
      lines.push(`        <clef><sign>${clef.sign}</sign><line>${clef.line}</line></clef>`);
      lines.push("      </attributes>");
    }

    let beat = 0;
    while (beat < 4) {
      const rowIndex = i + beat;

      if (rowIndex >= historyRows.length) {
        lines.push(buildXmlNote({ isRest: true, pitch: null, duration: 4 - beat }));
        break;
      }

      const currentVoice = historyRows[rowIndex][voiceIndex];
      const isRest = currentVoice.state === 0 || !currentVoice.pitch;
      let runLength = 1;

      while (beat + runLength < 4) {
        const nextRowIndex = i + beat + runLength;
        if (nextRowIndex >= historyRows.length) {
          break;
        }

        const nextVoice = historyRows[nextRowIndex][voiceIndex];
        const nextIsRest = nextVoice.state === 0 || !nextVoice.pitch;
        const samePitch = !isRest && !nextIsRest && nextVoice.pitch === currentVoice.pitch;
        const nextIsAttack = nextVoice.state === 2;
        const sameRest = isRest && nextIsRest;

        if ((!samePitch || nextIsAttack) && !sameRest) {
          break;
        }

        runLength += 1;
      }

      if (isRest) {
        lines.push(buildXmlNote({ isRest: true, pitch: null, duration: runLength }));
      } else {
        const previousVoice = rowIndex > 0 ? historyRows[rowIndex - 1][voiceIndex] : null;
        const nextVoice = rowIndex + runLength < historyRows.length ? historyRows[rowIndex + runLength][voiceIndex] : null;
        const tieStop = Boolean(
          previousVoice && previousVoice.state !== 0 && previousVoice.state !== 2 && previousVoice.pitch === currentVoice.pitch,
        );
        const tieStart = Boolean(
          nextVoice && nextVoice.state !== 0 && nextVoice.state !== 2 && nextVoice.pitch === currentVoice.pitch,
        );

        lines.push(buildXmlNote({
          isRest: false,
          pitch: currentVoice.pitch,
          duration: runLength,
          tieStart,
          tieStop,
        }));
      }

      beat += runLength;
    }

    lines.push("    </measure>");
    measureNumber += 1;
  }

  lines.push("  </part>");
  return lines.join("\n");
}

function toMusicXml(historyRows) {
  const title = "Recorder Trio — Langton λ Sweep";
  const parts = [
    { id: "P1", name: "Alto Recorder" },
    { id: "P2", name: "Tenor Recorder" },
    { id: "P3", name: "Bass Recorder" },
  ];

  const lines = [];
  lines.push("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>");
  lines.push("<!DOCTYPE score-partwise PUBLIC \"-//Recordare//DTD MusicXML 3.1 Partwise//EN\" \"http://www.musicxml.org/dtds/partwise.dtd\">");
  lines.push("<score-partwise version=\"3.1\">");
  lines.push("  <work>");
  lines.push(`    <work-title>${escapeXml(title)}</work-title>`);
  lines.push("  </work>");
  lines.push("  <part-list>");

  for (const part of parts) {
    lines.push(`    <score-part id=\"${part.id}\">`);
    lines.push(`      <part-name>${escapeXml(part.name)}</part-name>`);
    lines.push("    </score-part>");
  }

  lines.push("  </part-list>");
  lines.push(buildXmlPart(historyRows, 2, "P1"));
  lines.push(buildXmlPart(historyRows, 1, "P2"));
  lines.push(buildXmlPart(historyRows, 0, "P3"));
  lines.push("</score-partwise>");
  return lines.join("\n");
}

function pitchToMidi(pitch) {
  const cleaned = pitch.replace(/[^A-Ga-g#\-xXn]/g, "");
  const letterMatch = cleaned.match(/[A-Ga-g]+/);
  if (!letterMatch) {
    return null;
  }

  const letters = letterMatch[0];
  const accidentalPart = cleaned.slice(letters.length);
  const letter = letters[0];
  const repeats = letters.length;

  const lowerBase = {
    c: 60,
    d: 62,
    e: 64,
    f: 65,
    g: 67,
    a: 69,
    b: 71,
  };

  const upperBase = {
    C: 48,
    D: 50,
    E: 52,
    F: 53,
    G: 55,
    A: 57,
    B: 59,
  };

  let midi = null;
  if (letter >= "a" && letter <= "z") {
    midi = lowerBase[letter] + 12 * (repeats - 1);
  } else {
    midi = upperBase[letter] - 12 * (repeats - 1);
  }

  if (Number.isNaN(midi) || midi === undefined || midi === null) {
    return null;
  }

  let accidental = 0;
  const naturalized = accidentalPart.includes("n");
  if (!naturalized) {
    for (const ch of accidentalPart) {
      if (ch === "#") {
        accidental += 1;
      } else if (ch === "x" || ch === "X") {
        accidental += 2;
      } else if (ch === "-") {
        accidental -= 1;
      }
    }
  }

  midi += accidental;
  return Math.max(0, Math.min(127, midi));
}

function midiToFrequency(midi) {
  return 440 * (2 ** ((midi - 69) / 12));
}

function ensureAudioContext() {
  if (audioCtx) {
    return true;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return false;
  }

  audioCtx = new AudioContextCtor();
  outputCompressor = audioCtx.createDynamicsCompressor();
  outputCompressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
  outputCompressor.knee.setValueAtTime(24, audioCtx.currentTime);
  outputCompressor.ratio.setValueAtTime(3.2, audioCtx.currentTime);
  outputCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
  outputCompressor.release.setValueAtTime(0.12, audioCtx.currentTime);

  masterGain = audioCtx.createGain();
  masterGain.gain.value = getMasterGainLevel();
  masterGain.connect(outputCompressor);
  outputCompressor.connect(audioCtx.destination);
  return true;
}

async function resumeAudioContext() {
  if (!ensureAudioContext()) {
    return false;
  }

  if (audioCtx.state !== "running") {
    try {
      await audioCtx.resume();
    } catch (_) {
      return false;
    }
  }

  return true;
}

function stopVoice(index, now, release = 0.05) {
  const synth = voiceSynths[index];
  if (!synth || !audioCtx) {
    return;
  }

  const stopAt = now + Math.max(0.01, release);
  synth.amp.gain.cancelScheduledValues(now);
  synth.amp.gain.setValueAtTime(Math.max(0.0001, synth.amp.gain.value), now);
  synth.amp.gain.exponentialRampToValueAtTime(0.0001, stopAt);
  synth.oscMain.stop(stopAt + 0.01);
  synth.oscBreath.stop(stopAt + 0.01);
  voiceSynths[index] = null;
}

function startVoice(index, midi, velocity = 0.75, rearticulate = false) {
  if (!audioCtx || !masterGain) {
    return;
  }

  const now = audioCtx.currentTime;
  const freq = midiToFrequency(midi);
  const attack = rearticulate ? 0.01 : 0.018;

  const voiceGain = audioCtx.createGain();
  voiceGain.gain.setValueAtTime(0.0001, now);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(Math.min(3200, freq * 5.5), now);
  filter.Q.setValueAtTime(5.6, now);

  const oscMain = audioCtx.createOscillator();
  oscMain.type = "triangle";
  oscMain.frequency.setValueAtTime(freq, now);

  const oscBreath = audioCtx.createOscillator();
  oscBreath.type = "sine";
  oscBreath.frequency.setValueAtTime(freq * 2, now);
  oscBreath.detune.setValueAtTime(6, now);

  oscMain.connect(filter);
  oscBreath.connect(filter);
  filter.connect(voiceGain);
  voiceGain.connect(masterGain);

  const targetGain = Math.max(0.09, Math.min(0.75, velocity * 0.44));
  voiceGain.gain.exponentialRampToValueAtTime(targetGain, now + attack);

  oscMain.start(now);
  oscBreath.start(now);

  voiceSynths[index] = {
    midi,
    amp: voiceGain,
    oscMain,
    oscBreath,
    startedAt: now,
  };
}

function silenceAllVoices() {
  if (!audioCtx) {
    return;
  }

  const now = audioCtx.currentTime;
  for (let i = 0; i < PLAYER_NAMES.length; i += 1) {
    stopVoice(i, now, 0.04);
  }
}

function syncAudioToRow(row, prevRow) {
  if (!audioEnabled || !audioCtx || !masterGain) {
    return;
  }

  for (let i = 0; i < PLAYER_NAMES.length; i += 1) {
    const currentVoice = row[i];
    const previousVoice = prevRow[i];
    const currentSynth = voiceSynths[i];

    if (currentVoice.state === 0 || !currentVoice.pitch) {
      if (currentSynth) {
        stopVoice(i, audioCtx.currentTime);
      }
      continue;
    }

    const midi = pitchToMidi(currentVoice.pitch);
    if (midi === null) {
      if (currentSynth) {
        stopVoice(i, audioCtx.currentTime);
      }
      continue;
    }

    const isStrike = currentVoice.state === 2;

    if (!currentSynth) {
      startVoice(i, midi, isStrike ? 0.9 : 0.72, false);
      continue;
    }

    if (currentSynth.midi !== midi) {
      stopVoice(i, audioCtx.currentTime, 0.02);
      startVoice(i, midi, isStrike ? 0.9 : 0.72, true);
    }
  }
}

async function triggerAudioForRow(row, prevRow) {
  if (!audioEnabled) {
    return;
  }

  const ready = await resumeAudioContext();
  if (!ready) {
    audioEnabled = false;
    audioBtn.textContent = "Audio: Unavailable";
    audioBtn.classList.add("is-muted");
    return;
  }

  syncAudioToRow(row, prevRow);
}

function numberToBytes(value, length) {
  const bytes = [];
  for (let i = length - 1; i >= 0; i -= 1) {
    bytes[i] = value & 0xff;
    value >>= 8;
  }
  return bytes;
}

function stringToBytes(text) {
  return Array.from(text).map((ch) => ch.charCodeAt(0));
}

function toVarLen(value) {
  let buffer = value & 0x7f;
  const bytes = [];

  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }

  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }

  return bytes;
}

function createMidiEvents(historyRows) {
  const events = [];
  const tempoUsPerQuarter = Math.max(1000, Math.round(60000000 / Math.max(1, getTempoBpm())));

  events.push({ tick: 0, kind: "meta", bytes: [0xff, 0x03, 0x1f, ...stringToBytes("Recorder Trio CA - Player Gated")] });
  events.push({
    tick: 0,
    kind: "meta",
    bytes: [
      0xff,
      0x51,
      0x03,
      ...numberToBytes(tempoUsPerQuarter, 3),
    ],
  });

  for (let ch = 0; ch < PLAYER_NAMES.length; ch += 1) {
    events.push({ tick: 0, kind: "program", bytes: [0xc0 + ch, MIDI_RECORDER_PROGRAM] });
  }

  for (let voice = 0; voice < PLAYER_NAMES.length; voice += 1) {
    let currentNote = null;
    let prevVoice = historyRows[0][voice];

    for (let step = 0; step < historyRows.length; step += 1) {
      const tick = step * MIDI_TPQ;
      const voiceData = historyRows[step][voice];

      if (voiceData.state === 0 || !voiceData.pitch) {
        if (currentNote !== null) {
          events.push({ tick, kind: "off", bytes: [0x80 + voice, currentNote.pitch, 0] });
          currentNote = null;
        }
        prevVoice = voiceData;
        continue;
      }

      const pitch = pitchToMidi(voiceData.pitch);
      if (pitch === null) {
        if (currentNote !== null) {
          events.push({ tick, kind: "off", bytes: [0x80 + voice, currentNote.pitch, 0] });
          currentNote = null;
        }
        prevVoice = voiceData;
        continue;
      }

      const velocity = getMidiVelocity(voiceData.state === 2);

      if (currentNote === null) {
        events.push({ tick, kind: "on", bytes: [0x90 + voice, pitch, velocity] });
        currentNote = { pitch };
      } else if (currentNote.pitch !== pitch) {
        events.push({ tick, kind: "off", bytes: [0x80 + voice, currentNote.pitch, 0] });
        events.push({ tick, kind: "on", bytes: [0x90 + voice, pitch, velocity] });
        currentNote = { pitch };
      }

      prevVoice = voiceData;
    }

    if (currentNote !== null) {
      const endTick = historyRows.length * MIDI_TPQ;
      events.push({ tick: endTick, kind: "off", bytes: [0x80 + voice, currentNote.pitch, 0] });
    }
  }

  events.sort((a, b) => {
    if (a.tick !== b.tick) {
      return a.tick - b.tick;
    }

    const priority = { off: 0, meta: 1, program: 2, on: 3 };
    return priority[a.kind] - priority[b.kind];
  });

  return events;
}

function buildMidiFileBytes(historyRows) {
  const header = [
    ...stringToBytes("MThd"),
    ...numberToBytes(6, 4),
    ...numberToBytes(0, 2),
    ...numberToBytes(1, 2),
    ...numberToBytes(MIDI_TPQ, 2),
  ];

  const events = createMidiEvents(historyRows);
  const trackData = [];
  let lastTick = 0;

  for (const event of events) {
    const delta = event.tick - lastTick;
    trackData.push(...toVarLen(delta), ...event.bytes);
    lastTick = event.tick;
  }

  trackData.push(0x00, 0xff, 0x2f, 0x00);

  const track = [
    ...stringToBytes("MTrk"),
    ...numberToBytes(trackData.length, 4),
    ...trackData,
  ];

  return new Uint8Array([...header, ...track]);
}

function downloadMidi() {
  if (voiceHistory.length === 0) {
    return;
  }

  const midiBytes = buildMidiFileBytes(voiceHistory);
  const blob = new Blob([midiBytes], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  anchor.href = url;
  anchor.download = `recorder-trio-ca-player-gated-${timestamp}.mid`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadKern() {
  const kernText = toKern(voiceHistory);
  const blob = new Blob([kernText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  anchor.href = url;
  anchor.download = `recorder-trio-ca-player-gated-${timestamp}.krn`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadXml(forceRefresh = false) {
  if (forceRefresh) {
    reseedRng(rngSeedInput.value);
    const completed = generateFullPieceSilently();
    if (!completed) {
      console.warn("Generation cap reached before completion.");
    }
  }

  const xmlText = getXmlText();
  const blob = new Blob([xmlText], { type: "application/vnd.recordare.musicxml+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  anchor.href = url;
  anchor.download = `recorder-trio-ca-player-gated-${timestamp}.musicxml`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function invalidateXmlCache() {
  xmlCacheDirty = true;
  if (xmlOutputEl) {
    xmlOutputEl.value = "XML is generated on demand. Click Export XML to build the latest file.";
  }
}

function getXmlText() {
  if (xmlCacheDirty) {
    xmlCache = toMusicXml(voiceHistory);
    xmlCacheDirty = false;
  }

  if (xmlOutputEl) {
    xmlOutputEl.value = xmlCache;
  }

  return xmlCache;
}

function stopMidiPreview(resetButtonState = true, silenceVoices = true) {
  const hadActivePreview = midiPreviewTimer !== null;

  if (hadActivePreview) {
    window.clearInterval(midiPreviewTimer);
    midiPreviewTimer = null;
  }

  if (silenceVoices && hadActivePreview) {
    silenceAllVoices();
  }

  if (resetButtonState) {
    midiPreviewBtn.textContent = "Preview MIDI";
    midiPreviewBtn.classList.remove("is-active");
  }
}

function runMidiPreviewTick() {
  if (voiceHistory.length === 0) {
    stopMidiPreview();
    return;
  }

  if (midiPreviewIndex >= voiceHistory.length) {
    stopMidiPreview();
    return;
  }

  const row = voiceHistory[midiPreviewIndex];
  const prevRow = midiPreviewIndex > 0 ? voiceHistory[midiPreviewIndex - 1] : row;
  syncAudioToRow(row, prevRow);
  midiPreviewIndex += 1;

  if (midiPreviewIndex >= voiceHistory.length) {
    stopMidiPreview();
  }
}

function startMidiPreviewTimer() {
  if (midiPreviewTimer !== null) {
    window.clearInterval(midiPreviewTimer);
  }

  const ms = getStepDurationMs();
  midiPreviewTimer = window.setInterval(runMidiPreviewTick, ms);
}

async function startMidiPreview() {
  if (!audioEnabled) {
    audioEnabled = true;
    audioBtn.textContent = "Audio: On";
    audioBtn.classList.remove("is-muted");
  }

  const ready = await resumeAudioContext();
  if (!ready) {
    midiPreviewBtn.textContent = "Preview Unavailable";
    midiPreviewBtn.classList.add("is-muted");
    return;
  }

  if (playTimer !== null) {
    stopPlayback();
  }

  stopMidiPreview(false);
  midiPreviewIndex = 0;
  midiPreviewBtn.textContent = "Stop Preview";
  midiPreviewBtn.classList.add("is-active");

  runMidiPreviewTick();
  if (voiceHistory.length > 1) {
    startMidiPreviewTimer();
  }
}

function renderSeedGrid() {
  seedGridEl.innerHTML = "";
  const totalCells = getTotalCells();
  const labels = getBlockLabels();
  const gateOffset = getOutputCellOffset();
  seedGridEl.style.gridTemplateColumns = `repeat(${totalCells}, minmax(50px, 1fr))`;

  for (let i = 0; i < totalCells; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `seed-cell state-${seed[i]}`;
    if ((i + 1) % blockSize === 0 && i < totalCells - 1) {
      btn.classList.add("block-divider");
    }

    const playerLabel = labels[i];
    const localCell = (i % blockSize) + 1;
    const outputLabel = localCell - 1 === gateOffset ? " (gate)" : "";
    if (localCell - 1 === gateOffset) {
      btn.classList.add("is-gate");
    }

    btn.dataset.index = String(i);
    btn.innerHTML = `<strong>${seed[i]}</strong><small>${playerLabel} C${localCell}${outputLabel}</small>`;
    btn.addEventListener("click", () => {
      seed[i] = seed[i] === 1 ? 0 : 1;
      stopPlayback();
      stopMidiPreview();
      resetSimulationState();
      renderAll();
    });

    seedGridEl.appendChild(btn);
  }
}

function renderHistory() {
  historyGridEl.innerHTML = "";
  const totalCells = getTotalCells();
  const gateOffset = getOutputCellOffset();

  const visibleHistory = caHistory.slice(-maxHistoryRows);
  for (const row of visibleHistory) {
    const rowEl = document.createElement("div");
    rowEl.className = "history-row";
    rowEl.style.gridTemplateColumns = `repeat(${totalCells}, minmax(24px, 1fr))`;

    row.forEach((value) => {
      const cell = document.createElement("div");
      cell.className = `history-cell s${value}`;
      const i = rowEl.children.length;
      if ((i + 1) % blockSize === 0 && i < totalCells - 1) {
        cell.classList.add("block-divider");
      }
      if (i % blockSize === gateOffset) {
        cell.classList.add("is-gate");
      }
      rowEl.appendChild(cell);
    });

    historyGridEl.appendChild(rowEl);
  }

  historyGridEl.scrollTop = historyGridEl.scrollHeight;
}

function renderKern() {
  kernOutputEl.value = toKern(voiceHistory);
}

function renderXml() {
  if (xmlCacheDirty) {
    xmlOutputEl.value = "XML is generated on demand. Click Export XML to build the latest file.";
    return;
  }

  xmlOutputEl.value = xmlCache;
}

function renderAll() {
  renderSeedGrid();
  renderHistory();
  renderKern();
  renderXml();
}

function setNeighborhoodSize(value) {
  blockSize = normalizeBlockSize(value);
  blockSizeInput.value = String(blockSize);
  blockSizeLabel.textContent = `${blockSize} cells`;
}

function applyNeighborhoodSize(value) {
  setNeighborhoodSize(value);
  seed = createDefaultSeed();
  resetSimulationState();
}

function allPlayersFinished() {
  const lastChordIndex = SCORE_CHORDS.length - 1;
  return playerProgress.every((player) => player.chordIndex >= lastChordIndex);
}

function appendGeneration(caRow, voices, prevVoices, options = {}) {
  const { render = true, triggerAudio = true } = options;
  currentCaRow = [...caRow];
  caHistory.push([...currentCaRow]);
  voiceHistory.push(voices);
  invalidateXmlCache();

  if (caHistory.length > 640) {
    caHistory = caHistory.slice(-640);
    voiceHistory = voiceHistory.slice(-640);
  }

  if (triggerAudio) {
    triggerAudioForRow(voices, prevVoices);
  }

  if (render) {
    renderHistory();
    renderKern();
    renderXml();
  }
}

function generateFullPieceSilently() {
  stopPlayback();
  stopMidiPreview();
  silenceAllVoices();
  resetSimulationState();

  const MAX_GENERATION_STEPS = 50000;
  let steps = 0;

  while (!finalPhase.completed && steps < MAX_GENERATION_STEPS) {
    if (finalPhase.active) {
      const prevVoices = voiceHistory[voiceHistory.length - 1];
      finalPhase.beatsElapsed += 1;

      if (finalPhase.beatsElapsed > FINAL_CHORD_HOLD_BEATS) {
        const restVoices = createRestVoices();
        appendGeneration(currentCaRow, restVoices, prevVoices, { render: false, triggerAudio: false });
        finalPhase.completed = true;
        break;
      }

      const heldVoices = prevVoices.map((voice) => ({
        state: 1,
        pitch: voice.pitch,
      }));
      appendGeneration(currentCaRow, heldVoices, prevVoices, { render: false, triggerAudio: false });
      steps += 1;
      continue;
    }

    advanceSweep();
    const nextCa = nextState(currentCaRow);
    const { nextPlayers, voices, allFinished } = advancePlayersFromCa(nextCa);
    const prevVoices = voiceHistory[voiceHistory.length - 1];

    playerProgress = nextPlayers;
    appendGeneration(nextCa, voices, prevVoices, { render: false, triggerAudio: false });

    if (allFinished) {
      finalPhase.active = true;
      finalPhase.beatsElapsed = 1;
    }

    steps += 1;
  }

  renderHistory();
  renderKern();
  renderXml();
  return finalPhase.completed;
}

function stopPlayback() {
  if (playTimer !== null) {
    window.clearInterval(playTimer);
    playTimer = null;
  }
  silenceAllVoices();
  playBtn.textContent = "Play";
}

function stepForward() {
  stopMidiPreview(true, false);

  if (finalPhase.completed) {
    stopPlayback();
    return;
  }

  if (finalPhase.active) {
    const prevVoices = voiceHistory[voiceHistory.length - 1];
    finalPhase.beatsElapsed += 1;

    if (finalPhase.beatsElapsed > FINAL_CHORD_HOLD_BEATS) {
      const restVoices = createRestVoices();
      appendGeneration(currentCaRow, restVoices, prevVoices);
      finalPhase.completed = true;
      stopPlayback();
      return;
    }

    const nextPlayers = playerProgress.map((player) => ({ ...player }));
    const heldVoices = [];

    for (let voice = 0; voice < PLAYER_NAMES.length; voice += 1) {
      const player = nextPlayers[voice];
      const currentChord = SCORE_CHORDS[player.chordIndex];
      const choices = getChordChoicesForVoice(currentChord, voice);

      if ((player.forcedRestRemaining ?? 0) > 0) {
        player.forcedRestRemaining -= 1;
        player.pitch = null;
        player.decayRemaining = 0;
        player.breathBeats = 0;
        heldVoices.push({ state: 0, pitch: null });
        continue;
      }

      if (player.pitch && (player.breathBeats ?? 0) >= BREATH_MAX_BEATS) {
        player.pitch = null;
        player.decayRemaining = 0;
        player.breathBeats = 0;
        player.forcedRestRemaining = Math.max(0, BREATH_REST_BEATS - 1);
        heldVoices.push({ state: 0, pitch: null });
        continue;
      }

      if (!player.pitch) {
        if (choices.length > 0) {
          player.pitch = randomChoice(choices);
          player.decayRemaining = NO_VALID_NOTE_DECAY_LIFE;
          player.breathBeats = 1;
          player.forcedRestRemaining = 0;
          heldVoices.push({ state: 2, pitch: player.pitch });
        } else {
          player.decayRemaining = 0;
          player.breathBeats = 0;
          heldVoices.push({ state: 0, pitch: null });
        }
        continue;
      }

      player.decayRemaining = NO_VALID_NOTE_DECAY_LIFE;
      player.breathBeats = (player.breathBeats ?? 0) + 1;
      player.forcedRestRemaining = 0;
      heldVoices.push({ state: 1, pitch: player.pitch });
    }

    playerProgress = nextPlayers;
    appendGeneration(currentCaRow, heldVoices, prevVoices);
    return;
  }

  advanceSweep();
  const nextCa = nextState(currentCaRow);
  const { nextPlayers, voices, allFinished } = advancePlayersFromCa(nextCa);

  const prevVoices = voiceHistory[voiceHistory.length - 1];

  playerProgress = nextPlayers;
  appendGeneration(nextCa, voices, prevVoices);

  if (allFinished) {
    finalPhase.active = true;
    finalPhase.beatsElapsed = 1;
  }
}

function startPlayback() {
  stopMidiPreview();
  stopPlayback();
  const ms = getStepDurationMs();
  playTimer = window.setInterval(stepForward, ms);
  const currentVoices = voiceHistory[voiceHistory.length - 1];
  triggerAudioForRow(currentVoices, currentVoices);
  playBtn.textContent = "Pause";
}

stepBtn.addEventListener("click", () => {
  stepForward();
});

playBtn.addEventListener("click", () => {
  if (playTimer === null) {
    startPlayback();
  } else {
    stopPlayback();
  }
});

resetBtn.addEventListener("click", () => {
  stopPlayback();
  stopMidiPreview();
  resetSimulationState();
  silenceAllVoices();
  renderAll();
});

rngApplyBtn.addEventListener("click", () => {
  stopPlayback();
  stopMidiPreview();
  reseedRng(rngSeedInput.value);
  resetSimulationState();
  renderAll();
});

rngGenerateBtn.addEventListener("click", () => {
  stopPlayback();
  stopMidiPreview();
  reseedRng(makeGeneratedSeed());
  resetSimulationState();
  renderAll();
});

rngSeedInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  stopPlayback();
  stopMidiPreview();
  reseedRng(rngSeedInput.value);
  resetSimulationState();
  renderAll();
});

kernBtn.addEventListener("click", () => {
  downloadKern();
});

xmlBtn.addEventListener("click", () => {
  downloadXml(true);
});

generateXmlBtn.addEventListener("click", () => {
  const originalLabel = generateXmlBtn.textContent;
  generateXmlBtn.disabled = true;
  generateXmlBtn.textContent = "Generating...";

  try {
    downloadXml(true);
  } finally {
    generateXmlBtn.disabled = false;
    generateXmlBtn.textContent = originalLabel;
  }
});

midiBtn.addEventListener("click", () => {
  downloadMidi();
});

midiPreviewBtn.addEventListener("click", async () => {
  if (midiPreviewTimer !== null) {
    stopMidiPreview();
    return;
  }

  await startMidiPreview();
});

audioBtn.addEventListener("click", async () => {
  audioEnabled = !audioEnabled;
  if (!audioEnabled) {
    silenceAllVoices();
    audioBtn.textContent = "Audio: Off";
    audioBtn.classList.add("is-muted");
    return;
  }

  const ready = await resumeAudioContext();
  if (!ready) {
    audioEnabled = false;
    audioBtn.textContent = "Audio: Unavailable";
    audioBtn.classList.add("is-muted");
    return;
  }

  audioBtn.textContent = "Audio: On";
  audioBtn.classList.remove("is-muted");
  const currentVoices = voiceHistory[voiceHistory.length - 1];
  syncAudioToRow(currentVoices, currentVoices);
});

speedInput.addEventListener("input", () => {
  const bpm = getTempoBpm();
  speedLabel.textContent = `${bpm} BPM`;

  if (playTimer !== null) {
    startPlayback();
  }

  if (midiPreviewTimer !== null) {
    startMidiPreviewTimer();
  }
});

volumeInput.addEventListener("input", () => {
  const percent = Number(volumeInput.value);
  volumeLabel.textContent = `${percent}%`;

  if (masterGain && audioCtx) {
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(getMasterGainLevel(), now, 0.02);
  }
});

sweepStartInput.addEventListener("input", () => {
  sweepStartLambda = Number(sweepStartInput.value);
  sweepStartLabel.textContent = sweepStartLambda.toFixed(2);
});

sweepEndInput.addEventListener("input", () => {
  sweepEndLambda = Number(sweepEndInput.value);
  sweepEndLabel.textContent = sweepEndLambda.toFixed(2);
});

sweepModeSelect.addEventListener("change", () => {
  sweepMode = sweepModeSelect.value;
  syncSweepModeUi();
  updateRuleTables(getSweepLambdaAtStep(sweepStep));
  currentLambdaDisplayEl.textContent = currentLambda.toFixed(3);
});

manualLambdaInput.addEventListener("input", () => {
  manualLambda = Number(manualLambdaInput.value);
  manualLambdaLabel.textContent = manualLambda.toFixed(2);

  if (sweepMode === "manual") {
    updateRuleTables(manualLambda);
    currentLambdaDisplayEl.textContent = currentLambda.toFixed(3);
  }
});

sweepDurationInput.addEventListener("input", () => {
  sweepDuration = Math.max(4, Number(sweepDurationInput.value));
  sweepDurationLabel.textContent = `${sweepDuration} steps`;
});

blockSizeInput.addEventListener("input", () => {
  stopPlayback();
  stopMidiPreview();
  applyNeighborhoodSize(blockSizeInput.value);
  renderAll();
});

sweepStartLabel.textContent = sweepStartLambda.toFixed(2);
sweepEndLabel.textContent = sweepEndLambda.toFixed(2);
manualLambdaLabel.textContent = manualLambda.toFixed(2);
sweepDurationLabel.textContent = `${sweepDuration} steps`;
volumeLabel.textContent = `${Number(volumeInput.value)}%`;
speedLabel.textContent = `${getTempoBpm()} BPM`;
syncSweepModeUi();
setNeighborhoodSize(blockSizeInput.value);

reseedRng(rngSeedInput.value);
resetSimulationState();
renderAll();
