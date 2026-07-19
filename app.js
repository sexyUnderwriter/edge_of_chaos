const BLOCK_SIZE = 5;
const PLAYER_NAMES = ["Bass", "Tenor", "Alto"];
const CELL_PITCHES = [
  "F", "G", "A", "B", "c",
  "c", "d", "e", "f", "g",
  "cc", "dd", "ee", "ff", "gg",
];
const BLOCK_LABELS = PLAYER_NAMES.flatMap((name) => Array(BLOCK_SIZE).fill(name));
const TOTAL_CELLS = CELL_PITCHES.length;

const seedGridEl = document.getElementById("seed-grid");
const historyGridEl = document.getElementById("history-grid");
const kernOutputEl = document.getElementById("kern-output");
const stepBtn = document.getElementById("step-btn");
const playBtn = document.getElementById("play-btn");
const resetBtn = document.getElementById("reset-btn");
const kernBtn = document.getElementById("kern-btn");
const midiBtn = document.getElementById("midi-btn");
const midiPreviewBtn = document.getElementById("midi-preview-btn");
const audioBtn = document.getElementById("audio-btn");
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

const PITCH_TO_MIDI = {
  F: 41,
  G: 43,
  A: 45,
  B: 47,
  c: 48,
  d: 50,
  e: 52,
  f: 53,
  g: 55,
  cc: 60,
  dd: 62,
  ee: 64,
  ff: 65,
  gg: 67,
};

const MIDI_TPQ = 480;
const MIDI_RECORDER_PROGRAM = 73;
const STRIKE_HOLD_PROB = 0.42;
const SUSTAIN_REST_PROB = 0.35;
const SUSTAIN_REARTICULATE_PROB = 0.18;

let seed = Array(TOTAL_CELLS).fill(0);
let current = [...seed];
let history = [[...current]];
let playTimer = null;
let midiPreviewTimer = null;
let midiPreviewIndex = 0;
let maxHistoryRows = 96;
let lambda = Number(lambdaInput.value);
let lambdaByVoice = [
  Number(bassLambdaInput.value),
  Number(tenorLambdaInput.value),
  Number(altoLambdaInput.value),
];
let audioEnabled = true;
let audioCtx = null;
let masterGain = null;
let outputCompressor = null;
const voiceSynths = Array(PLAYER_NAMES.length).fill(null);

function getVolumeScalar() {
  return Number(volumeInput.value) / 100;
}

function getMasterGainLevel() {
  return Math.min(2.4, 0.9 * getVolumeScalar());
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
  return Math.floor(index / BLOCK_SIZE) * BLOCK_SIZE;
}

function isActive(value) {
  return value === 1 || value === 2;
}

function nextState(state, lambdaByVoiceValue) {
  const next = Array(TOTAL_CELLS).fill(0);
  const suppressed = new Set();

  function lambdaForCell(index) {
    const block = Math.floor(index / BLOCK_SIZE);
    return lambdaByVoiceValue[block] ?? lambda;
  }

  // Rule B (rhythmic variant): strikes may sustain or decay to rest.
  for (let i = 0; i < TOTAL_CELLS; i += 1) {
    if (state[i] === 2) {
      const localLambda = lambdaForCell(i);
      const holdChance = Math.max(0.15, STRIKE_HOLD_PROB - localLambda * 0.25);
      next[i] = Math.random() < holdChance ? 1 : 0;
    }
  }

  // Rule B/C: sustains must move with local momentum and boundary behavior.
  for (let i = 0; i < TOTAL_CELLS; i += 1) {
    if (state[i] !== 1) {
      continue;
    }

    if (suppressed.has(i)) {
      next[i] = 0;
      continue;
    }

    // Entropy override 1: spontaneous decay can cancel movement.
    const localLambda = lambdaForCell(i);

    if (Math.random() < localLambda) {
      next[i] = 0;
      continue;
    }

    // Rhythmic variation: sustains can resolve to rest before moving.
    const restChance = Math.min(0.85, SUSTAIN_REST_PROB + localLambda * 0.2);
    if (Math.random() < restChance) {
      next[i] = 0;
      continue;
    }

    // Occasional re-articulation in place creates non-tied quarter attacks.
    if (Math.random() < SUSTAIN_REARTICULATE_PROB) {
      next[i] = 2;
      continue;
    }

    let target = -1;

    const start = blockStart(i);
    const end = start + BLOCK_SIZE - 1;
    const nextBlockStart = end + 1;

    if (i < end) {
      target = i + 1;
    } else if (nextBlockStart < TOTAL_CELLS) {
      if (state[nextBlockStart] === 0) {
        target = nextBlockStart;
      } else if (Math.random() < localLambda) {
        // Entropy override 3: quantum tunneling through occupied boundary.
        target = nextBlockStart;
        suppressed.add(nextBlockStart);
      } else {
        target = end - 1;
      }
    } else {
      target = end - 1;
    }

    next[target] = 2;
    next[i] = 0;
  }

  // Entropy override 2: spontaneous generation in quiescent cells.
  for (let i = 0; i < TOTAL_CELLS; i += 1) {
    if (state[i] === 0 && next[i] === 0 && Math.random() < lambdaForCell(i) * 0.1) {
      next[i] = 2;
    }
  }

  // Rule A: one active note per block; center cell wins when needed.
  for (let start = 0; start < TOTAL_CELLS; start += BLOCK_SIZE) {
    const active = [];
    for (let i = start; i < start + BLOCK_SIZE; i += 1) {
      if (isActive(next[i])) {
        active.push(i);
      }
    }

    if (active.length > 1) {
      const center = start + Math.floor(BLOCK_SIZE / 2);
      const centerState = next[center];
      let retained = centerState;
      if (!isActive(centerState)) {
        retained = active.some((i) => next[i] === 2) ? 2 : 1;
      }

      for (let i = start; i < start + BLOCK_SIZE; i += 1) {
        next[i] = 0;
      }
      next[center] = retained;
    }
  }

  return next;
}

function rowToVoices(row) {
  const voices = [null, null, null];

  for (let block = 0; block < PLAYER_NAMES.length; block += 1) {
    const start = block * BLOCK_SIZE;
    let foundIndex = -1;
    for (let i = start; i < start + BLOCK_SIZE; i += 1) {
      if (isActive(row[i])) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex === -1) {
      voices[block] = { state: 0, pitch: null };
    } else {
      voices[block] = { state: row[foundIndex], pitch: CELL_PITCHES[foundIndex] };
    }
  }

  return voices;
}

function voiceToken(historyRows, rowIndex, voiceIndex) {
  const currentVoices = rowToVoices(historyRows[rowIndex]);
  const voice = currentVoices[voiceIndex];

  if (voice.state === 0) {
    return "4r";
  }

  if (voice.state === 2) {
    const hasFollowingTie =
      rowIndex + 1 < historyRows.length &&
      (() => {
        const nextVoices = rowToVoices(historyRows[rowIndex + 1]);
        const nextVoice = nextVoices[voiceIndex];
        return nextVoice.state === 1 && nextVoice.pitch === voice.pitch;
      })();

    return hasFollowingTie ? `[4${voice.pitch}` : `4${voice.pitch}`;
  }

  const hasPriorTieStart =
    rowIndex > 0 &&
    (() => {
      const prevVoices = rowToVoices(historyRows[rowIndex - 1]);
      const prevVoice = prevVoices[voiceIndex];
      return prevVoice.state === 2 && prevVoice.pitch === voice.pitch;
    })();

  return hasPriorTieStart ? `4${voice.pitch}]` : `4${voice.pitch}`;
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
  // Keep harmonics bright, but avoid an overly narrow band that can vanish on
  // some devices/output chains.
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.min(4200, freq * 3.4), now);
  filter.Q.setValueAtTime(0.9, now);

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

  const voices = rowToVoices(row);
  const prevVoices = rowToVoices(prevRow);

  for (let i = 0; i < PLAYER_NAMES.length; i += 1) {
    const currentVoice = voices[i];
    const previousVoice = prevVoices[i];
    const currentSynth = voiceSynths[i];

    if (currentVoice.state === 0) {
      if (currentSynth) {
        stopVoice(i, audioCtx.currentTime);
      }
      continue;
    }

    const midi = PITCH_TO_MIDI[currentVoice.pitch];
    const isStrike = currentVoice.state === 2;
    const shouldRetrigger =
      isStrike && previousVoice.state !== 0 && previousVoice.pitch === currentVoice.pitch;

    if (!currentSynth) {
      startVoice(i, midi, isStrike ? 0.9 : 0.72, false);
      continue;
    }

    if (currentSynth.midi !== midi || shouldRetrigger) {
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

  events.push({ tick: 0, kind: "meta", bytes: [0xff, 0x03, 0x12, ...stringToBytes("Recorder Trio CA")] });
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
    let prevVoice = { state: 0, pitch: null };

    for (let step = 0; step < historyRows.length; step += 1) {
      const tick = step * MIDI_TPQ;
      const voiceData = rowToVoices(historyRows[step])[voice];
      const active = voiceData.state !== 0;

      if (!active) {
        if (currentNote !== null) {
          events.push({ tick, kind: "off", bytes: [0x80 + voice, currentNote.pitch, 0] });
          currentNote = null;
        }
      } else {
        const pitch = PITCH_TO_MIDI[voiceData.pitch];
        const velocity = getMidiVelocity(voiceData.state === 2);

        if (currentNote === null) {
          events.push({ tick, kind: "on", bytes: [0x90 + voice, pitch, velocity] });
          currentNote = { pitch };
        } else if (currentNote.pitch !== pitch) {
          events.push({ tick, kind: "off", bytes: [0x80 + voice, currentNote.pitch, 0] });
          events.push({ tick, kind: "on", bytes: [0x90 + voice, pitch, velocity] });
          currentNote = { pitch };
        } else if (voiceData.state === 2 && prevVoice.state !== 0 && prevVoice.pitch === voiceData.pitch) {
          // Re-articulate matching pitch when a new strike occurs on an already sounding note.
          events.push({ tick, kind: "off", bytes: [0x80 + voice, currentNote.pitch, 0] });
          events.push({ tick, kind: "on", bytes: [0x90 + voice, pitch, velocity] });
        }
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
  if (history.length === 0) {
    return;
  }

  const midiBytes = buildMidiFileBytes(history);
  const blob = new Blob([midiBytes], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  anchor.href = url;
  anchor.download = `recorder-trio-ca-${timestamp}.mid`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadKern() {
  const kernText = toKern(history);
  const blob = new Blob([kernText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  anchor.href = url;
  anchor.download = `recorder-trio-ca-${timestamp}.krn`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function stopMidiPreview(resetButtonState = true) {
  if (midiPreviewTimer !== null) {
    window.clearInterval(midiPreviewTimer);
    midiPreviewTimer = null;
  }

  silenceAllVoices();

  if (resetButtonState) {
    midiPreviewBtn.textContent = "Preview MIDI";
    midiPreviewBtn.classList.remove("is-active");
  }
}

function runMidiPreviewTick() {
  if (history.length === 0) {
    stopMidiPreview();
    return;
  }

  if (midiPreviewIndex >= history.length) {
    stopMidiPreview();
    return;
  }

  const row = history[midiPreviewIndex];
  const prevRow = midiPreviewIndex > 0 ? history[midiPreviewIndex - 1] : Array(TOTAL_CELLS).fill(0);
  syncAudioToRow(row, prevRow);
  midiPreviewIndex += 1;

  if (midiPreviewIndex >= history.length) {
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
  if (history.length > 1) {
    startMidiPreviewTimer();
  }
}

function renderSeedGrid() {
  seedGridEl.innerHTML = "";

  for (let i = 0; i < TOTAL_CELLS; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `seed-cell state-${seed[i]}`;
    if ((i + 1) % BLOCK_SIZE === 0 && i < TOTAL_CELLS - 1) {
      btn.classList.add("block-divider");
    }
    btn.dataset.index = String(i);
    btn.innerHTML = `<strong>${seed[i]}</strong><small>${BLOCK_LABELS[i]} ${i + 1}: ${CELL_PITCHES[i]}</small>`;
    btn.addEventListener("click", () => {
      seed[i] = (seed[i] + 1) % 3;
      current = [...seed];
      history = [[...current]];
      renderAll();
    });
    seedGridEl.appendChild(btn);
  }
}

function renderHistory() {
  historyGridEl.innerHTML = "";

  const visibleHistory = history.slice(-maxHistoryRows);
  for (const row of visibleHistory) {
    const rowEl = document.createElement("div");
    rowEl.className = "history-row";
    row.forEach((value) => {
      const cell = document.createElement("div");
      cell.className = `history-cell s${value}`;
      const i = rowEl.children.length;
      if ((i + 1) % BLOCK_SIZE === 0 && i < TOTAL_CELLS - 1) {
        cell.classList.add("block-divider");
      }
      rowEl.appendChild(cell);
    });
    historyGridEl.appendChild(rowEl);
  }

  historyGridEl.scrollTop = historyGridEl.scrollHeight;
}

function renderKern() {
  kernOutputEl.value = toKern(history);
}

function renderAll() {
  renderSeedGrid();
  renderHistory();
  renderKern();
}

function stepForward() {
  stopMidiPreview();
  const prev = [...current];
  current = nextState(current, lambdaByVoice);
  history.push([...current]);
  if (history.length > 320) {
    history = history.slice(-320);
  }
  triggerAudioForRow(current, prev);
  renderHistory();
  renderKern();
}

function stopPlayback() {
  if (playTimer !== null) {
    window.clearInterval(playTimer);
    playTimer = null;
  }
  silenceAllVoices();
  playBtn.textContent = "Play";
}

function startPlayback() {
  stopMidiPreview();
  stopPlayback();
  const ms = getStepDurationMs();
  playTimer = window.setInterval(stepForward, ms);
  const prev = history.length > 1 ? history[history.length - 2] : Array(TOTAL_CELLS).fill(0);
  triggerAudioForRow(current, prev);
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
  current = [...seed];
  history = [[...current]];
  silenceAllVoices();
  renderHistory();
  renderKern();
});

kernBtn.addEventListener("click", () => {
  downloadKern();
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
  const prev = history.length > 1 ? history[history.length - 2] : Array(TOTAL_CELLS).fill(0);
  syncAudioToRow(current, prev);
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
  lambda = Number(lambdaInput.value);
  lambdaLabel.textContent = lambda.toFixed(2);

  lambdaByVoice = [lambda, lambda, lambda];
  bassLambdaInput.value = lambda.toFixed(2);
  tenorLambdaInput.value = lambda.toFixed(2);
  altoLambdaInput.value = lambda.toFixed(2);
  bassLambdaLabel.textContent = lambda.toFixed(2);
  tenorLambdaLabel.textContent = lambda.toFixed(2);
  altoLambdaLabel.textContent = lambda.toFixed(2);
});

lambdaLabel.textContent = lambda.toFixed(2);
bassLambdaLabel.textContent = lambdaByVoice[0].toFixed(2);
tenorLambdaLabel.textContent = lambdaByVoice[1].toFixed(2);
altoLambdaLabel.textContent = lambdaByVoice[2].toFixed(2);

bassLambdaInput.addEventListener("input", () => {
  lambdaByVoice[0] = Number(bassLambdaInput.value);
  bassLambdaLabel.textContent = lambdaByVoice[0].toFixed(2);
});

tenorLambdaInput.addEventListener("input", () => {
  lambdaByVoice[1] = Number(tenorLambdaInput.value);
  tenorLambdaLabel.textContent = lambdaByVoice[1].toFixed(2);
});

altoLambdaInput.addEventListener("input", () => {
  lambdaByVoice[2] = Number(altoLambdaInput.value);
  altoLambdaLabel.textContent = lambdaByVoice[2].toFixed(2);
});

volumeLabel.textContent = `${Number(volumeInput.value)}%`;
speedLabel.textContent = `${getTempoBpm()} BPM`;

renderAll();
