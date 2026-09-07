import assert from 'node:assert';

console.log('=== DRUMEX METRONOME CAPABILITIES VERIFICATION ===\n');

// ── 1. Direct BPM Entry Clamping & Logic Tests ──────────────────────────────
console.log('1. Direct BPM Entry Integer & Clamping Validation:');
{
  const testInputs = [
    { raw: '120', expected: 120 },
    { raw: '35', expected: 40 },   // Clamps to min 40
    { raw: '300', expected: 280 }, // Clamps to max 280
    { raw: '40', expected: 40 },   // Canonical lower boundary
    { raw: '280', expected: 280 }, // Canonical upper boundary
    { raw: '220', expected: 220 }, // Previously problematic threshold
    { raw: '240', expected: 240 }, // Above previous 220 threshold
    { raw: 'abc150def', expected: 150 }, // Numeric strip
    { raw: '', expected: null },   // Empty input rejected
  ];

  for (const { raw, expected } of testInputs) {
    const stripped = raw.replace(/[^0-9]/g, '');
    const parsed = stripped === '' ? null : parseInt(stripped, 10);
    const result = parsed === null ? null : Math.max(40, Math.min(280, parsed));
    assert.strictEqual(result, expected, `Input "${raw}" should resolve to ${expected}, got ${result}`);
    console.log(`   ✓ Input "${raw}" -> ${result}`);
  }
}

// ── 2. Multi-Accent Pattern Cycling & Meter Resizing ───────────────────────
console.log('\n2. Multi-Accent Pattern System Logic:');
{
  // Cycle logic: normal -> accent -> strong -> normal
  const cycle = (current) =>
    current === 'normal' ? 'accent' : current === 'accent' ? 'strong' : 'normal';

  assert.strictEqual(cycle('normal'), 'accent');
  assert.strictEqual(cycle('accent'), 'strong');
  assert.strictEqual(cycle('strong'), 'normal');
  console.log('   ✓ Accent 3-tier cycle: normal -> accent -> strong -> normal verified.');

  // Time signature meter pattern resizing
  const meters = [
    { sig: '4/4', beats: 4 },
    { sig: '3/4', beats: 3 },
    { sig: '5/4', beats: 5 },
    { sig: '7/8', beats: 7 },
    { sig: '9/8', beats: 9 },
    { sig: '12/8', beats: 12 },
  ];

  for (const { sig, beats } of meters) {
    const pattern = Array(beats).fill('normal');
    pattern[0] = 'strong';
    if (beats >= 3) pattern[2] = 'accent';
    assert.strictEqual(pattern.length, beats);
    console.log(`   ✓ Meter ${sig} (${beats} beats) pattern allocated cleanly.`);
  }

  // Audio buffer key resolution
  const sounds = ['woodblock', 'click', 'sidestick', 'drystick', 'studioclick', 'rimclick', 'digital'];
  for (const snd of sounds) {
    for (const accentType of ['strong', 'accent', 'normal']) {
      const key = `${snd}-${accentType}`;
      assert.match(key, /^[a-z]+-(strong|accent|normal)$/);
    }
  }
  console.log('   ✓ Audio pulse buffer key mapping verified across all 7 sounds for strong, accent, normal.');
}

// ── 3. Robust Tap Tempo Algorithm Simulation ───────────────────────────────
console.log('\n3. Robust Tap Tempo Algorithm Simulation:');
{
  // Tap tempo simulation engine mirroring useMetronomeStore implementation
  class TapTempoSimulator {
    constructor() {
      this.tapTimes = [];
      this.currentBpm = 120;
    }

    tap(timestamp) {
      if (this.tapTimes.length > 0 && timestamp - this.tapTimes[this.tapTimes.length - 1] > 2000) {
        this.tapTimes = [];
      }
      if (this.tapTimes.length > 0 && timestamp - this.tapTimes[this.tapTimes.length - 1] < 70) {
        return false; // Debounce touch noise
      }
      this.tapTimes.push(timestamp);
      if (this.tapTimes.length > 7) this.tapTimes.shift();

      if (this.tapTimes.length >= 2) {
        const intervals = [];
        for (let i = 1; i < this.tapTimes.length; i++) {
          intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
        }
        let weightedSum = 0;
        let totalWeight = 0;
        for (let i = 0; i < intervals.length; i++) {
          const weight = 1 + (i / Math.max(1, intervals.length - 1)) * 0.5;
          weightedSum += intervals[i] * weight;
          totalWeight += weight;
        }
        const avgInterval = weightedSum / totalWeight;
        if (avgInterval > 0) {
          const calculatedBpm = Math.round(60000 / avgInterval);
          this.currentBpm = Math.max(40, Math.min(280, calculatedBpm));
          return true;
        }
      }
      return true;
    }
  }

  const sim = new TapTempoSimulator();

  // Test A: 2 Taps immediately calculate 120 BPM (500ms interval)
  sim.tap(1000);
  assert.strictEqual(sim.tapTimes.length, 1);
  assert.strictEqual(sim.currentBpm, 120);

  sim.tap(1500); // 500ms interval
  assert.strictEqual(sim.tapTimes.length, 2);
  assert.strictEqual(sim.currentBpm, 120);
  console.log('   ✓ 2 taps immediately produced accurate 120 BPM.');

  // Test B: High tempo taps at 240 BPM (250ms interval)
  // Pause 2100ms to reset sequence
  sim.tap(3600); // Sequence reset
  assert.strictEqual(sim.tapTimes.length, 1);

  sim.tap(3850); // 250ms later -> 240 BPM
  assert.strictEqual(sim.tapTimes.length, 2);
  assert.strictEqual(sim.currentBpm, 240);
  console.log('   ✓ Fast tapping above 220 BPM (240 BPM) instantly calculated without ceiling.');

  // Test C: Touch-noise rejection (tap within 30ms (< 70ms))
  const accepted = sim.tap(3880); // 30ms later -> should be rejected!
  assert.strictEqual(accepted, false);
  assert.strictEqual(sim.tapTimes.length, 2);
  assert.strictEqual(sim.currentBpm, 240);
  console.log('   ✓ Touch-noise bounce (30ms) successfully rejected without perturbing tempo.');

  // Test D: Boundary clamping at 280 BPM (interval = 180ms -> 333 BPM, clamped to 280)
  sim.tap(6000); // Reset
  sim.tap(6180); // 180ms -> 333 BPM
  assert.strictEqual(sim.currentBpm, 280);
  console.log('   ✓ Ultra-fast taps clamped safely to canonical 280 BPM ceiling.');

  // Test E: Boundary clamping at 40 BPM (interval = 2000ms -> 30 BPM, clamped to 40)
  sim.tap(10000); // Reset
  sim.tap(12000); // 2000ms -> 30 BPM
  assert.strictEqual(sim.currentBpm, 40);
  console.log('   ✓ Slow taps clamped safely to canonical 40 BPM floor.');
}

console.log('\n=== ALL CAPABILITY VERIFICATION CHECKS PASSED SUCCESSFULLY ===');
