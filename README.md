# Mathematical Principles and Experiment Rules

## 1) Purpose of This Experiment

This system is a stochastic, partitioned, one-dimensional cellular automaton (CA) that drives a constrained harmonic progression derived from `wtc1p01.krn` (Bach, WTC I Prelude 1). The CA does not directly encode pitch values per cell. Instead, each player block emits gate events that advance a voice-specific harmonic state machine.

Core idea:
- Local binary CA dynamics generate gate hits.
- Gate hits trigger movement through a finite sequence of chord sets.
- Each instrument chooses a pitch from the current chord subject to range constraints.

## 2) State Spaces and Variables

### 2.1 CA State
- Three players: Bass, Tenor, Alto.
- Block size: odd integer `b` in `[3, 15]` (default `b = 5`).
- Total cells: $N = 3b$.
- Binary cell state at step $t$: $x_i(t) \in \{0,1\}$, for $i = 0,\ldots,N-1$.

### 2.2 Voice State
For each voice $v \in \{0,1,2\}$ (Bass, Tenor, Alto):
- Chord index: $k_v(t) \in \{0,\ldots,K-1\}$, where

```math
K = \left|\mathrm{SCORE\_CHORDS}\right|
```

- Active pitch token: $p_v(t)$ (Humdrum pitch string).
- Articulation state in output stream: strike/rest/sustain behavior represented in generated notation tokens.

### 2.3 Randomness
A deterministic pseudo-random generator is seeded by a text seed:
- Seed text -> 32-bit hash -> PRNG state.
- This makes runs reproducible for the same seed and settings.

## 3) CA Dynamics

Each player block evolves independently via Rule 30 with stochastic bit flips.

### 3.1 Block-local Rule 30
For a block-local index `j` with wrap-around neighbors `j-1, j, j+1`:

```math
R_{30}(l,c,r) = l \oplus (c \lor r)
```

So before noise,

```math
x'_j(t+1) = R_{30}(x_{j-1}(t), x_j(t), x_{j+1}(t))
```

### 3.2 Entropy/Noise (lambda)
Each block has a lambda parameter $\lambda_v$.
After Rule 30 is computed for a cell in voice block `v`:
- With probability $\lambda_v$, flip the bit.
- With probability $1-\lambda_v$, keep it.

Equivalent Bernoulli perturbation model:

```math
x_j(t+1) = x'_j(t+1) \oplus \eta_j(t), \qquad \eta_j(t) \sim \mathrm{Bernoulli}(\lambda_v)
```

This is a stochastic CA (SCA): deterministic local rule + independent random perturbation.

## 4) Gate Output Mapping

For each block of size `b`, the gate/output cell is the center index:

```math
g = \lfloor b/2 \rfloor
```

A gate hit for voice $v$ at time $t$ is:

```math
\mathrm{hit}_v(t) =
\begin{cases}
1, & x_{vb+g}(t)=1 \\
0, & x_{vb+g}(t)=0
\end{cases}
```
where $g=\lfloor b/2 \rfloor$ and $vb+g$ is the center-cell index for block $v$.

Thus, CA morphology is reduced to a per-voice event stream at one distinguished cell per block.

## 5) Harmonic Progression as a Finite State Machine

`SCORE_CHORDS` is the ordered chord sequence extracted from `wtc1p01.krn`.

For each voice $v$, progression is:

```math
k_v(t+1) = \min\!\bigl(K-1,\; k_v(t) + \mathrm{hit}_v(t)\bigr)
```

This creates asynchronous progression: voices may advance at different times, but always move forward, never backward.

## 6) Pitch Choice Rule Per Instrument

When a voice enters a chord state `k`, it chooses a pitch token from chord tones using range filtering.

### 6.1 Instrument Ranges (MIDI)
- Bass: `[41, 74]` (F3 to D5)
- Tenor: `[48, 76]` (C4 to E5)
- Alto: `[53, 79]` (F4 to G5)

### 6.2 Bass Omission Constraint
- For Bass only, pitch tokens `C` and `E` are omitted explicitly as out-of-range policy constraints in this experiment.

### 6.3 Literal Chord-Tone Mode
Given a chord $C_k$ at progression index $k$, the admissible pitch set for voice $v$ is:

```math
A_v(k)=\{q\in C_k:\ \mathrm{midi}(q)\in[L_v,U_v]\ \land\ (v\ne\mathrm{Bass}\ \lor\ q\notin\{C,E\})\}
```

Interpretation:
1. Only literal tokens present in the source chord are eligible.
2. No octave transposition is applied.
3. Bass-only omission rule is enforced.

If $A_v(k)$ is non-empty, the selected pitch is sampled uniformly from $A_v(k)$:

```math
p_v \sim \mathrm{Unif}(A_v(k))
```

### 6.4 No-Valid-Note Decay Rule
If $A_v(k)$ is empty, the voice does not immediately drop to rest. Instead, it applies a finite decay-life hold:

1. Let $D=8$ generations (`NO_VALID_NOTE_DECAY_LIFE = 8`).
2. If the voice currently has a pitch and remaining decay $d > 0$, it sustains that pitch and decrements $d \leftarrow d - 1$.
3. If no valid chord-tone appears before $d$ reaches 0, the voice transitions to rest.
4. Whenever a new valid pitch is selected, decay is reset to $D$.

Equivalent update sketch:

```math
d_v(t+1)=
\begin{cases}
D, & A_v(k_v(t))\neq\varnothing \\
d_v(t)-1, & A_v(k_v(t))=\varnothing \;\land\; d_v(t)>0 \\
0, & \mathrm{otherwise}
\end{cases}
```

with rest state entered when $A_v(k_v(t))=\varnothing$ and $d_v(t)=0$.

This creates a bounded-memory continuation policy for literal-mode gaps.

## 7) Output Representation Rules

### 7.1 Humdrum **kern
- Three spines: Bass, Tenor, Alto.
- Quarter-note time base.
- Strike/sustain continuity is encoded with tie-aware tokens based on neighboring equal pitches.

### 7.2 MusicXML
- Equivalent voice histories are converted to MusicXML notes/rests.
- Pitch spelling and octave are derived from Humdrum-like token conventions.

### 7.3 MIDI
- Each voice mapped to one MIDI channel.
- Note-on/note-off events generated from voice state sequence.
- Tempo is derived from BPM control.

## 8) Termination Rule and Cadential Hold

When all voices reach the final chord index $K-1$:
1. Enter final phase.
2. Hold final chord for `FINAL_CHORD_HOLD_BEATS` steps ($=8$).
3. Emit a final rest row.
4. Mark sequence complete and stop automatic progression.

This defines a finite-horizon trajectory rather than an infinite CA run.

## 9) Mathematical Characterization

This experiment combines:
- A partitioned stochastic cellular automaton (local, nearest-neighbor, periodic boundary per block).
- Event extraction via center-cell gating (dimensional reduction from $3b$ binary cells to 3 gate processes).
- A constrained, monotone finite-state harmonic automaton.
- A constrained literal sampling layer with finite-memory decay for instrument-legal pitch realization.

In short, it is a hybrid dynamical system:
1. Discrete stochastic dynamics in CA space.
2. Deterministic state-machine progression conditioned on stochastic gate events.
3. Constrained random selection over literal chord tones plus bounded hold-to-rest decay when admissible sets are empty.

## 10) Experiment-Specific Rules (Operational Summary)

1. Exactly 3 players/voices: Bass, Tenor, Alto.
2. Block size is odd and shared across players.
3. Each player block runs Rule 30 with per-block lambda noise.
4. Only the center cell of each block acts as that player's progression gate.
5. Chord progression source is `wtc1p01.krn` (ordered chord sets in `SCORE_CHORDS`).
6. On gate hit, that voice advances one chord step; otherwise it holds.
7. Pitch choice is literal-only: each voice may choose only tokens explicitly present in the current chord.
8. Bass excludes bottom `C` and `E` candidates by rule.
9. If no literal valid token exists for a voice, it holds the last valid note for up to 8 generations, then rests.
10. Voices maintain independent chord indices (asynchronous progression).
11. After all voices reach the final chord, hold for 8 beats, then rest and stop.

## 11) Notes on Reproducibility

For fixed:
- seed text,
- lambda settings,
- block size,
- initial seed pattern,

the full generated sequence (CA gates, chord transitions, pitch selections) is reproducible.

Changing any of those parameters changes the stochastic trajectory while preserving all structural constraints above.
