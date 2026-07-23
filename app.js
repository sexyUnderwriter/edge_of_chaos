const DEFAULT_BLOCK_SIZE = 5;
const PLAYER_NAMES = ["Bass", "Tenor", "Alto"];
const MIDI_TPQ = 480;
const MIDI_RECORDER_PROGRAM = 73;
const MAX_HISTORY_ROWS = 640;

const VOICE_MIDI_RANGES = [
  { min: 53, max: 74 }, // Bass recorder comfortable range: F3-D5
  { min: 60, max: 76 }, // Tenor recorder comfortable range: C4-E5
  { min: 65, max: 79 }, // Alto recorder comfortable range: F4-G5
];

const DEFAULT_MELODY_TEXT = [
  "F3 G3 A3 Bb3 A3 G3 F3 C4 D4 C4 A3 G3",
  "C4 E4 F4 G4 A4 G4 F4 E4 D4 E4 F4 G4",
  "F4 A4 G4 Bb4 C5 Bb4 A4 G4 F4 G4 A4 C5",
];

const historyGridEl = document.getElementById("history-grid");
const kernOutputEl = document.getElementById("kern-output");
const xmlOutputEl = document.getElementById("xml-output");
const markovDebugOutputEl = document.getElementById("markov-debug-output");

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

const lambdaInput = document.getElementById("lambda-input");
const lambdaLabel = document.getElementById("lambda-label");
const bassLambdaInput = document.getElementById("bass-lambda-input");
const bassLambdaLabel = document.getElementById("bass-lambda-label");
const tenorLambdaInput = document.getElementById("tenor-lambda-input");
const tenorLambdaLabel = document.getElementById("tenor-lambda-label");
const altoLambdaInput = document.getElementById("alto-lambda-input");
const altoLambdaLabel = document.getElementById("alto-lambda-label");

const blockSizeInput = document.getElementById("block-size-input");
const blockSizeLabel = document.getElementById("block-size-label");

const bassMelodyInput = document.getElementById("bass-melody-input");
const tenorMelodyInput = document.getElementById("tenor-melody-input");
const altoMelodyInput = document.getElementById("alto-melody-input");
const applyMelodiesBtn = document.getElementById("apply-melodies-btn");

let playTimer = null;
let midiPreviewTimer = null;
let midiPreviewIndex = 0;

let audioEnabled = true;
let audioCtx = null;
let masterGain = null;
let outputCompressor = null;
const voiceSynths = Array(PLAYER_NAMES.length).fill(null);

let xmlCache = "";
let xmlCacheDirty = true;

let blockSize = DEFAULT_BLOCK_SIZE;
let rngSeedText = "trio-001";
let rngState = 0;

let globalTemperatureControl = Number(lambdaInput.value);
let voiceTemperativeControls = [
  Number(bassLambdaInput.value),
  Number(tenorLambdaInput.value),
  Number(altoLambdaInput.value),
];

let sourceMelodies = [[], [], []];

let voiceEngines = [];
let voiceHistory = [];
let activityHistory = [];
let latestDebugByVoice = [];

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

function getMasterGainLevel() {
  const volumeScalar = Number(volumeInput.value) / 100;
  return Math.min(0.9, 0.28 * volumeScalar);
}

function getMidiVelocity(isStrike) {
  const volumeScalar = Number(volumeInput.value) / 100;
  const baseVelocity = isStrike ? 94 : 82;
  const velocity = Math.round(baseVelocity * volumeScalar);
  return Math.max(1, Math.min(127, velocity));
}

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

function randomChoice(items) {
  if (!items || items.length === 0) {
    return null;
  }
  return items[Math.floor(random01() * items.length)];
}

function weightedChoice(items, weights) {
  if (!items || items.length === 0 || !weights || weights.length !== items.length) {
    return null;
  }

  let total = 0;
  for (const w of weights) {
    total += Math.max(0, w);
  }

  if (total <= 0) {
    return randomChoice(items);
  }

  let r = random01() * total;
  for (let i = 0; i < items.length; i += 1) {
    r -= Math.max(0, weights[i]);
    if (r <= 0) {
      return items[i];
    }
  }

  return items[items.length - 1];
}

function makeGeneratedSeed() {
  return `seed-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function clampMidi(midi, range) {
  return Math.max(range.min, Math.min(range.max, midi));
}

function parseScientificNote(token) {
  const match = String(token || "").trim().match(/^([A-Ga-g])([#b]{0,2})(-?\d+)$/);
  if (!match) {
    return null;
  }

  const letter = match[1].toUpperCase();
  const accidental = match[2] || "";
  const octave = Number(match[3]);

  const base = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  }[letter];

  if (base === undefined || !Number.isFinite(octave)) {
    return null;
  }

  let offset = 0;
  for (const ch of accidental) {
    if (ch === "#") {
      offset += 1;
    } else if (ch === "b") {
      offset -= 1;
    }
  }

  const midi = 12 * (octave + 1) + base + offset;
  if (midi < 0 || midi > 127) {
    return null;
  }

  return midi;
}

function parseHumdrumLikePitch(token) {
  const cleaned = String(token || "").replace(/[^A-Ga-g#\-xXn]/g, "");
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

  if (midi === null || midi === undefined || Number.isNaN(midi)) {
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
  if (midi < 0 || midi > 127) {
    return null;
  }

  return midi;
}

function parsePitchTokenToMidi(token) {
  const trimmed = String(token || "").trim();
  if (!trimmed) {
    return null;
  }

  // Accept common rest spellings: r, r4, r8., 4r, 16r..
  if (/^r(\d+)?(\.*)?$/i.test(trimmed) || /^(\d+)r(\.*)?$/i.test(trimmed)) {
    return null;
  }

  const scientific = parseScientificNote(trimmed);
  if (scientific !== null) {
    return scientific;
  }

  return parseHumdrumLikePitch(trimmed);
}

function parseMelodyText(text, range) {
  const tokens = String(text || "")
    .trim()
    .split(/[\s,|;]+/)
    .filter(Boolean);

  const out = [];
  for (const token of tokens) {
    const trimmed = String(token || "").trim();
    const isRest = /^r(\d+)?(\.*)?$/i.test(trimmed) || /^(\d+)r(\.*)?$/i.test(trimmed);
    if (isRest) {
      out.push(null);
      continue;
    }

    const midi = parsePitchTokenToMidi(token);
    if (midi === null) {
      continue;
    }
    out.push(clampMidi(midi, range));
  }

  return out;
}

function midiToFrequency(midi) {
  return 440 * (2 ** ((midi - 69) / 12));
}

function midiToKernPitch(midi) {
  const names = [
    ["c", "C"],
    ["c#", "C#"],
    ["d", "D"],
    ["d#", "D#"],
    ["e", "E"],
    ["f", "F"],
    ["f#", "F#"],
    ["g", "G"],
    ["g#", "G#"],
    ["a", "A"],
    ["a#", "A#"],
    ["b", "B"],
  ];

  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;

  if (octave >= 4) {
    const repeats = octave - 3;
    const lower = names[pc][0];
    return lower[0].repeat(Math.max(1, repeats)) + lower.slice(1);
  }

  const repeats = 3 - octave;
  const upper = names[pc][1];
  return upper[0].repeat(Math.max(1, repeats)) + upper.slice(1);
}

function midiToXmlParts(midi) {
  const names = [
    { step: "C", alter: 0 },
    { step: "C", alter: 1 },
    { step: "D", alter: 0 },
    { step: "D", alter: 1 },
    { step: "E", alter: 0 },
    { step: "F", alter: 0 },
    { step: "F", alter: 1 },
    { step: "G", alter: 0 },
    { step: "G", alter: 1 },
    { step: "A", alter: 0 },
    { step: "A", alter: 1 },
    { step: "B", alter: 0 },
  ];

  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return { step: names[pc].step, alter: names[pc].alter, octave };
}

function buildTransitionModel(melody) {
  const transitions = new Map();
  const counts = new Map();

  if (melody.length === 0) {
    return { transitions, counts };
  }

  for (let i = 0; i < melody.length; i += 1) {
    const curr = melody[i];
    const next = melody[(i + 1) % melody.length];

    if (!transitions.has(curr)) {
      transitions.set(curr, new Map());
    }

    const row = transitions.get(curr);
    row.set(next, (row.get(next) || 0) + 1);
    counts.set(curr, (counts.get(curr) || 0) + 1);
  }

  return { transitions, counts };
}

function meanMidi(melody) {
  if (!melody || melody.length === 0) {
    return null;
  }

  const notes = melody.filter((m) => Number.isFinite(m));
  if (notes.length === 0) {
    return null;
  }

  return notes.reduce((sum, m) => sum + m, 0) / notes.length;
}

function getGlobalTemperature() {
  return Math.max(0.2, Number(globalTemperatureControl) || 1);
}

function getTemperativeScale(controlValue) {
  // Control range 0..1 mapped to 0.55..1.75 interval expansion/compression.
  return 0.55 + controlValue * 1.2;
}

function createVoiceEngine(voiceIndex, melody) {
  const range = VOICE_MIDI_RANGES[voiceIndex];
  const clampedMelody = melody.map((m) => (Number.isFinite(m) ? clampMidi(m, range) : null));
  const uniquePitchClasses = new Set(
    clampedMelody.filter((m) => Number.isFinite(m)).map((m) => ((m % 12) + 12) % 12),
  );

  const { transitions, counts } = buildTransitionModel(clampedMelody);
  const anchor = meanMidi(clampedMelody);

  return {
    voiceIndex,
    range,
    melody: clampedMelody,
    pitchClasses: uniquePitchClasses,
    transitions,
    counts,
    anchor,
    currentMidi: clampedMelody.length > 0 ? clampedMelody[0] : null,
  };
}

function nearestAllowedByPitchClass(targetMidi, range, allowedPitchClasses) {
  if (!allowedPitchClasses || allowedPitchClasses.size === 0) {
    return clampMidi(Math.round(targetMidi), range);
  }

  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let midi = range.min; midi <= range.max; midi += 1) {
    const pc = ((midi % 12) + 12) % 12;
    if (!allowedPitchClasses.has(pc)) {
      continue;
    }

    const distance = Math.abs(midi - targetMidi);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = midi;
    }
  }

  if (best === null) {
    return clampMidi(Math.round(targetMidi), range);
  }

  return best;
}

function chooseMarkovNext(engine, temperature) {
  if (!engine.melody || engine.melody.length === 0) {
    return {
      candidate: null,
      debug: {
        hasRow: false,
        reason: "empty-melody",
        current: engine.currentMidi,
        candidates: [],
        baseProbabilities: [],
        adjustedProbabilities: [],
        temperature,
      },
    };
  }

  const current = engine.currentMidi;
  const row = engine.transitions.get(current);

  if (!row || row.size === 0) {
    return {
      candidate: randomChoice(engine.melody),
      debug: {
        hasRow: false,
        reason: "no-outgoing-row",
        current,
        candidates: [],
        baseProbabilities: [],
        adjustedProbabilities: [],
        temperature,
      },
    };
  }

  const rowTotal = Array.from(row.values()).reduce((sum, count) => sum + count, 0);
  if (rowTotal <= 0) {
    return {
      candidate: randomChoice(engine.melody),
      debug: {
        hasRow: false,
        reason: "zero-row-total",
        current,
        candidates: [],
        baseProbabilities: [],
        adjustedProbabilities: [],
        temperature,
      },
    };
  }

  const candidates = [];
  const baseProbabilities = [];
  const adjustedWeights = [];
  const safeTemperature = Math.max(0.2, temperature);

  for (const [next, count] of row.entries()) {
    candidates.push(next);

    // Method 2 (temperature scaling): P'(j|i) proportional to P(j|i)^(1/T)
    const probability = count / rowTotal;
    const scaledWeight = Math.pow(probability, 1 / safeTemperature);
    baseProbabilities.push(probability);
    adjustedWeights.push(scaledWeight);
  }

  const weightTotal = adjustedWeights.reduce((sum, w) => sum + w, 0);
  const adjustedProbabilities = adjustedWeights.map((w) => (weightTotal > 0 ? w / weightTotal : 0));

  return {
    candidate: weightedChoice(candidates, adjustedWeights),
    debug: {
      hasRow: true,
      reason: "ok",
      current,
      candidates,
      baseProbabilities,
      adjustedProbabilities,
      temperature: safeTemperature,
    },
  };
}

function applyTemperativeScaling(engine, candidateMidi, temperativeScale) {
  if (candidateMidi === null) {
    return null;
  }

  const anchor = engine.anchor ?? candidateMidi;
  const morphed = anchor + (candidateMidi - anchor) * temperativeScale;
  return nearestAllowedByPitchClass(morphed, engine.range, engine.pitchClasses);
}

function stepVoice(engine, voiceIndex) {
  const temperature = getGlobalTemperature();
  const temperativeScale = getTemperativeScale(voiceTemperativeControls[voiceIndex]);

  const nextChoice = chooseMarkovNext(engine, temperature);
  const candidate = nextChoice.candidate;
  const morphed = applyTemperativeScaling(engine, candidate, temperativeScale);

  if (morphed === null) {
    engine.currentMidi = null;
    latestDebugByVoice[voiceIndex] = {
      ...nextChoice.debug,
      candidate,
      morphed,
      temperativeScale,
      state: 0,
    };
    return { state: 0, midi: null };
  }

  const same = engine.currentMidi !== null && morphed === engine.currentMidi;
  engine.currentMidi = morphed;

  latestDebugByVoice[voiceIndex] = {
    ...nextChoice.debug,
    candidate,
    morphed,
    temperativeScale,
    state: same ? 1 : 2,
  };

  return {
    state: same ? 1 : 2,
    midi: morphed,
  };
}

function debugPitchLabel(midi) {
  if (midi === null || midi === undefined || !Number.isFinite(midi)) {
    return "rest";
  }
  return `${midiToKernPitch(midi)} (${midi})`;
}

function renderMarkovDebug() {
  if (!markovDebugOutputEl) {
    return;
  }

  const order = [
    { label: "Alto", index: 2 },
    { label: "Tenor", index: 1 },
    { label: "Bass", index: 0 },
  ];

  const lines = [];
  for (const voice of order) {
    const debug = latestDebugByVoice[voice.index];
    if (!debug) {
      lines.push(`${voice.label}: no data yet`);
      lines.push("");
      continue;
    }

    lines.push(`${voice.label} | current: ${debugPitchLabel(debug.current)} | candidate: ${debugPitchLabel(debug.candidate)} | morphed: ${debugPitchLabel(debug.morphed)} | state: ${debug.state}`);
    lines.push(`  T=${Number(debug.temperature).toFixed(2)}  scale=${Number(debug.temperativeScale).toFixed(2)}  row=${debug.reason}`);

    if (debug.hasRow && debug.candidates.length > 0) {
      for (let i = 0; i < debug.candidates.length; i += 1) {
        const note = debugPitchLabel(debug.candidates[i]);
        const base = (debug.baseProbabilities[i] * 100).toFixed(1);
        const adjusted = (debug.adjustedProbabilities[i] * 100).toFixed(1);
        lines.push(`    ${note}: base ${base}% -> adjusted ${adjusted}%`);
      }
    } else {
      lines.push("    No outgoing transition row for this current state; using fallback random choice.");
    }

    lines.push("");
  }

  markovDebugOutputEl.textContent = lines.join("\n").trim();
}

function createInitialRow() {
  return voiceEngines.map((engine) => ({
    state: engine.currentMidi === null ? 0 : 2,
    midi: engine.currentMidi,
  }));
}

function voicesToActivityRow(voices) {
  const row = Array(getTotalCells()).fill(0);

  for (let voice = 0; voice < PLAYER_NAMES.length; voice += 1) {
    const start = voice * blockSize;
    const state = voices[voice];

    if (!state || state.state === 0 || state.midi === null) {
      continue;
    }

    const range = VOICE_MIDI_RANGES[voice];
    const span = Math.max(1, range.max - range.min);
    const normalized = (state.midi - range.min) / span;
    const lane = Math.max(0, Math.min(blockSize - 1, Math.round(normalized * (blockSize - 1))));
    row[start + lane] = state.state === 2 ? 2 : 1;
  }

  return row;
}

function invalidateXmlCache() {
  xmlCacheDirty = true;
  if (xmlOutputEl) {
    xmlOutputEl.value = "XML reflects the current generated rows. Click Save XML to export.";
  }
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function voiceToken(historyRows, rowIndex, voiceIndex) {
  const current = historyRows[rowIndex][voiceIndex];
  if (!current || current.state === 0 || current.midi === null) {
    return "4r";
  }

  const currentMidi = current.midi;
  const prev = rowIndex > 0 ? historyRows[rowIndex - 1][voiceIndex] : null;
  const next = rowIndex + 1 < historyRows.length ? historyRows[rowIndex + 1][voiceIndex] : null;

  const prevSame = Boolean(prev && prev.state !== 0 && prev.midi === currentMidi);
  const nextSame = Boolean(next && next.state !== 0 && next.midi === currentMidi);

  const pitch = midiToKernPitch(currentMidi);

  if (current.state === 2) {
    return nextSame ? `[4${pitch}` : `4${pitch}`;
  }

  if (prevSame && nextSame) {
    return `4${pitch}_`;
  }

  if (prevSame && !nextSame) {
    return `4${pitch}]`;
  }

  if (!prevSame && nextSame) {
    return `[4${pitch}`;
  }

  return `4${pitch}`;
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

function buildXmlNote(noteEvent) {
  const duration = Math.max(1, noteEvent.duration);
  const durationInfo = xmlDurationSpec(duration);

  if (noteEvent.isRest || noteEvent.midi === null) {
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

  const xmlPitch = midiToXmlParts(noteEvent.midi);
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
        lines.push(buildXmlNote({ isRest: true, midi: null, duration: 4 - beat }));
        break;
      }

      const currentVoice = historyRows[rowIndex][voiceIndex];
      const isRest = !currentVoice || currentVoice.state === 0 || currentVoice.midi === null;
      let runLength = 1;

      while (beat + runLength < 4) {
        const nextRowIndex = i + beat + runLength;
        if (nextRowIndex >= historyRows.length) {
          break;
        }

        const nextVoice = historyRows[nextRowIndex][voiceIndex];
        const nextIsRest = !nextVoice || nextVoice.state === 0 || nextVoice.midi === null;
        const samePitch = !isRest && !nextIsRest && nextVoice.midi === currentVoice.midi;
        const nextIsAttack = nextVoice && nextVoice.state === 2;
        const sameRest = isRest && nextIsRest;

        if ((!samePitch || nextIsAttack) && !sameRest) {
          break;
        }

        runLength += 1;
      }

      if (isRest) {
        lines.push(buildXmlNote({ isRest: true, midi: null, duration: runLength }));
      } else {
        const previousVoice = rowIndex > 0 ? historyRows[rowIndex - 1][voiceIndex] : null;
        const nextVoice = rowIndex + runLength < historyRows.length ? historyRows[rowIndex + runLength][voiceIndex] : null;
        const tieStop = Boolean(
          previousVoice && previousVoice.state !== 0 && previousVoice.state !== 2 && previousVoice.midi === currentVoice.midi,
        );
        const tieStart = Boolean(
          nextVoice && nextVoice.state !== 0 && nextVoice.state !== 2 && nextVoice.midi === currentVoice.midi,
        );

        lines.push(buildXmlNote({
          isRest: false,
          midi: currentVoice.midi,
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
  const title = "Recorder Trio Markov Morph";
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

function getTempoBpm() {
  return Number(speedInput.value);
}

function getStepDurationMs() {
  const bpm = Math.max(1, getTempoBpm());
  return Math.round(60000 / bpm);
}

function createMidiEvents(historyRows) {
  const events = [];
  const tempoUsPerQuarter = Math.max(1000, Math.round(60000000 / Math.max(1, getTempoBpm())));

  events.push({ tick: 0, kind: "meta", bytes: [0xff, 0x03, 0x1a, ...stringToBytes("Recorder Trio Markov Morph")] });
  events.push({ tick: 0, kind: "meta", bytes: [0xff, 0x51, 0x03, ...numberToBytes(tempoUsPerQuarter, 3)] });

  for (let ch = 0; ch < PLAYER_NAMES.length; ch += 1) {
    events.push({ tick: 0, kind: "program", bytes: [0xc0 + ch, MIDI_RECORDER_PROGRAM] });
  }

  for (let voice = 0; voice < PLAYER_NAMES.length; voice += 1) {
    let currentNote = null;

    for (let step = 0; step < historyRows.length; step += 1) {
      const tick = step * MIDI_TPQ;
      const voiceData = historyRows[step][voice];

      if (!voiceData || voiceData.state === 0 || voiceData.midi === null) {
        if (currentNote !== null) {
          events.push({ tick, kind: "off", bytes: [0x80 + voice, currentNote.pitch, 0] });
          currentNote = null;
        }
        continue;
      }

      const pitch = voiceData.midi;
      const velocity = getMidiVelocity(voiceData.state === 2);

      if (currentNote === null) {
        events.push({ tick, kind: "on", bytes: [0x90 + voice, pitch, velocity] });
        currentNote = { pitch };
      } else if (currentNote.pitch !== pitch) {
        events.push({ tick, kind: "off", bytes: [0x80 + voice, currentNote.pitch, 0] });
        events.push({ tick, kind: "on", bytes: [0x90 + voice, pitch, velocity] });
        currentNote = { pitch };
      }
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

function downloadBlob(content, type, filenamePrefix, extension) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  anchor.href = url;
  anchor.download = `${filenamePrefix}-${timestamp}.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadKern() {
  downloadBlob(toKern(voiceHistory), "text/plain;charset=utf-8", "recorder-trio-markov-morph", "krn");
}

function downloadXml() {
  downloadBlob(getXmlText(), "application/vnd.recordare.musicxml+xml;charset=utf-8", "recorder-trio-markov-morph", "musicxml");
}

function downloadMidi() {
  const midiBytes = buildMidiFileBytes(voiceHistory);
  downloadBlob(midiBytes, "audio/midi", "recorder-trio-markov-morph", "mid");
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

function syncAudioToRow(row) {
  if (!audioEnabled || !audioCtx || !masterGain) {
    return;
  }

  for (let i = 0; i < PLAYER_NAMES.length; i += 1) {
    const currentVoice = row[i];
    const currentSynth = voiceSynths[i];

    if (!currentVoice || currentVoice.state === 0 || currentVoice.midi === null) {
      if (currentSynth) {
        stopVoice(i, audioCtx.currentTime);
      }
      continue;
    }

    const midi = currentVoice.midi;
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

async function triggerAudioForRow(row) {
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

  syncAudioToRow(row);
}

function renderHistory() {
  historyGridEl.innerHTML = "";

  const visibleHistory = activityHistory.slice(-96);
  const totalCells = getTotalCells();

  for (const row of visibleHistory) {
    const rowEl = document.createElement("div");
    rowEl.className = "history-row";
    rowEl.style.gridTemplateColumns = `repeat(${totalCells}, minmax(24px, 1fr))`;

    for (let i = 0; i < row.length; i += 1) {
      const value = row[i];
      const cell = document.createElement("div");
      cell.className = `history-cell s${value}`;
      if ((i + 1) % blockSize === 0 && i < totalCells - 1) {
        cell.classList.add("block-divider");
      }
      rowEl.appendChild(cell);
    }

    historyGridEl.appendChild(rowEl);
  }

  historyGridEl.scrollTop = historyGridEl.scrollHeight;
}

function renderKern() {
  kernOutputEl.value = toKern(voiceHistory);
}

function renderXml() {
  if (xmlCacheDirty) {
    xmlOutputEl.value = "XML reflects the current generated rows. Click Save XML to export.";
    return;
  }
  xmlOutputEl.value = xmlCache;
}

function renderAll() {
  renderHistory();
  renderMarkovDebug();
  renderKern();
  renderXml();
}

function appendGeneration(voices, options = {}) {
  const { render = true, triggerAudio = true } = options;
  voiceHistory.push(voices);
  activityHistory.push(voicesToActivityRow(voices));
  invalidateXmlCache();

  if (voiceHistory.length > MAX_HISTORY_ROWS) {
    voiceHistory = voiceHistory.slice(-MAX_HISTORY_ROWS);
    activityHistory = activityHistory.slice(-MAX_HISTORY_ROWS);
  }

  if (triggerAudio) {
    triggerAudioForRow(voices);
  }

  if (render) {
    renderAll();
  }
}

function stopPlayback() {
  if (playTimer !== null) {
    window.clearInterval(playTimer);
    playTimer = null;
  }
  silenceAllVoices();
  playBtn.textContent = "Play";
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

  syncAudioToRow(voiceHistory[midiPreviewIndex]);
  midiPreviewIndex += 1;

  if (midiPreviewIndex >= voiceHistory.length) {
    stopMidiPreview();
  }
}

function startMidiPreviewTimer() {
  if (midiPreviewTimer !== null) {
    window.clearInterval(midiPreviewTimer);
  }

  midiPreviewTimer = window.setInterval(runMidiPreviewTick, getStepDurationMs());
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

function stepForward() {
  stopMidiPreview(true, false);
  const voices = voiceEngines.map((engine, voiceIndex) => stepVoice(engine, voiceIndex));
  appendGeneration(voices);
}

function startPlayback() {
  stopMidiPreview();
  stopPlayback();
  playTimer = window.setInterval(stepForward, getStepDurationMs());
  const currentVoices = voiceHistory[voiceHistory.length - 1];
  triggerAudioForRow(currentVoices);
  playBtn.textContent = "Pause";
}

function setLaneWidth(value) {
  blockSize = normalizeBlockSize(value);
  blockSizeInput.value = String(blockSize);
  blockSizeLabel.textContent = `${blockSize} cells`;
}

function getMelodyInputs() {
  return [
    bassMelodyInput.value,
    tenorMelodyInput.value,
    altoMelodyInput.value,
  ];
}

function writeMelodiesToInputs(melodies) {
  bassMelodyInput.value = melodies[0];
  tenorMelodyInput.value = melodies[1];
  altoMelodyInput.value = melodies[2];
}

function rebuildVoiceEnginesFromInputs() {
  const melodyTexts = getMelodyInputs();
  sourceMelodies = melodyTexts.map((text, voiceIndex) => parseMelodyText(text, VOICE_MIDI_RANGES[voiceIndex]));

  voiceEngines = sourceMelodies.map((melody, voiceIndex) => createVoiceEngine(voiceIndex, melody));
}

function resetSimulationState() {
  reseedRng(rngSeedText);
  rebuildVoiceEnginesFromInputs();

  voiceHistory = [];
  activityHistory = [];
  latestDebugByVoice = [];

  const initial = createInitialRow();
  appendGeneration(initial, { render: false, triggerAudio: false });

  for (let i = 0; i < voiceEngines.length; i += 1) {
    latestDebugByVoice[i] = {
      hasRow: false,
      reason: "reset",
      current: voiceEngines[i].currentMidi,
      candidates: [],
      baseProbabilities: [],
      adjustedProbabilities: [],
      temperature: getGlobalTemperature(),
      candidate: null,
      morphed: voiceEngines[i].currentMidi,
      temperativeScale: getTemperativeScale(voiceTemperativeControls[i]),
      state: voiceEngines[i].currentMidi === null ? 0 : 2,
    };
  }
}

function applyMelodiesAndReset() {
  stopPlayback();
  stopMidiPreview();
  silenceAllVoices();
  resetSimulationState();
  renderAll();
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
  silenceAllVoices();
  resetSimulationState();
  renderAll();
});

applyMelodiesBtn.addEventListener("click", () => {
  applyMelodiesAndReset();
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
  downloadXml();
});

generateXmlBtn.addEventListener("click", () => {
  downloadXml();
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
  syncAudioToRow(currentVoices);
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

lambdaInput.addEventListener("input", () => {
  globalTemperatureControl = Number(lambdaInput.value);
  const temp = getGlobalTemperature();
  lambdaLabel.textContent = temp.toFixed(2);
});

bassLambdaInput.addEventListener("input", () => {
  voiceTemperativeControls[0] = Number(bassLambdaInput.value);
  bassLambdaLabel.textContent = getTemperativeScale(voiceTemperativeControls[0]).toFixed(2);
});

tenorLambdaInput.addEventListener("input", () => {
  voiceTemperativeControls[1] = Number(tenorLambdaInput.value);
  tenorLambdaLabel.textContent = getTemperativeScale(voiceTemperativeControls[1]).toFixed(2);
});

altoLambdaInput.addEventListener("input", () => {
  voiceTemperativeControls[2] = Number(altoLambdaInput.value);
  altoLambdaLabel.textContent = getTemperativeScale(voiceTemperativeControls[2]).toFixed(2);
});

blockSizeInput.addEventListener("input", () => {
  stopPlayback();
  stopMidiPreview();
  setLaneWidth(blockSizeInput.value);
  renderHistory();
});

bassMelodyInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    applyMelodiesAndReset();
  }
});

tenorMelodyInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    applyMelodiesAndReset();
  }
});

altoMelodyInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    applyMelodiesAndReset();
  }
});

lambdaLabel.textContent = getGlobalTemperature().toFixed(2);
bassLambdaLabel.textContent = getTemperativeScale(voiceTemperativeControls[0]).toFixed(2);
tenorLambdaLabel.textContent = getTemperativeScale(voiceTemperativeControls[1]).toFixed(2);
altoLambdaLabel.textContent = getTemperativeScale(voiceTemperativeControls[2]).toFixed(2);
volumeLabel.textContent = `${Number(volumeInput.value)}%`;
speedLabel.textContent = `${getTempoBpm()} BPM`;
setLaneWidth(blockSizeInput.value);

writeMelodiesToInputs(DEFAULT_MELODY_TEXT);
reseedRng(rngSeedInput.value);
resetSimulationState();
renderAll();
