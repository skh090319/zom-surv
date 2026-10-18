const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const introSource = fs.readFileSync(path.join(root, 'js/studio-intro.js'), 'utf8');

function intro({ storage = new Map(), now = 100000, playError, missing = false, blockedStorage = false } = {}) {
  const timers = new Map();
  let nextTimer = 1;
  class Target {
    constructor() { this.listeners = new Map(); this.attributes = new Map(); }
    addEventListener(type, callback) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(callback);
    }
    removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
    emit(type, event = {}) { for (const callback of this.listeners.get(type) || []) callback(event); }
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) { this.attributes.delete(name); }
    focus() { document.activeElement = this; }
  }
  const document = new Target();
  const window = new Target();
  const elements = Object.fromEntries(['studio-intro', 'studio-intro-video', 'studio-intro-start', 'studio-intro-status', 'game'].map(id => [id, new Target()]));
  const overlay = elements['studio-intro'];
  const video = elements['studio-intro-video'];
  const sound = elements['studio-intro-start'];
  const skip = elements['studio-intro-status'];
  const game = elements.game;
  overlay.hidden = true;
  overlay.contains = node => [video, sound, skip, overlay].includes(node);
  video.attributes.set('src', 'assets/intro/semicolon-gloss-v1.mp4');
  Object.assign(video, { duration: 6, currentTime: 0, paused: true, plays: 0, pauses: 0, loads: 0,
    play() { this.plays++; this.paused = false; return playError && !this.muted ? Promise.reject(playError) : Promise.resolve(); },
    pause() { this.pauses++; this.paused = true; },
    load() { this.loads++; }
  });
  game.inert = false;
  document.hidden = false;
  document.activeElement = null;
  document.documentElement = { classList: new Set() };
  document.documentElement.classList.remove = value => document.documentElement.classList.delete(value);
  document.getElementById = id => missing && id === 'studio-intro' ? null : elements[id];
  const context = { window, document, Promise, Date: { now: () => now },
    setTimeout(callback, delay) { const id = nextTimer++; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    sessionStorage: {
      getItem(key) { if (blockedStorage) throw new Error('Storage disabled'); return storage.get(key) ?? null; },
      setItem(key, value) { if (blockedStorage) throw new Error('Storage disabled'); storage.set(key, value); },
      removeItem(key) { if (blockedStorage) throw new Error('Storage disabled'); storage.delete(key); }
    }
  };
  vm.runInNewContext(introSource, context);
  return { ...context, api: window.studioIntro, overlay, video, sound, skip, game, timers, storage,
    timeout(delay) {
      const entry = [...timers].find(([, value]) => value.delay === delay);
      assert.ok(entry, `Expected ${delay}ms timeout`);
      timers.delete(entry[0]); entry[1].callback();
    }
  };
}

test('audible playback completes only after the actual final frame', async () => {
  const i = intro();
  assert.equal(i.video.muted, false);
  assert.equal(i.video.defaultMuted, false);
  assert.equal(i.video.volume, 1);
  assert.equal(i.game.inert, true);
  assert.equal(i.api.skip, undefined);
  i.video.emit('ended');
  assert.equal(i.api.active, true);
  i.video.emit('playing');
  i.video.currentTime = 6;
  i.video.emit('ended');
  assert.equal(await i.api.finished, 'ended');
  assert.equal(i.overlay.hidden, true);
  assert.equal(i.game.inert, false);
  assert.equal(i.video.loads, 1);
  i.video.emit('ended');
  assert.equal(i.video.loads, 1);
});

test('autoplay rejection, errors and loading watchdog never skip the opening', async () => {
  const i = intro({playError: Object.assign(new Error('blocked'), {name: 'NotAllowedError'})});
  await Promise.resolve();
  assert.equal(i.api.active, true);
  assert.equal(i.sound.hidden, true);
  assert.equal(i.video.plays, 2);
  assert.equal(i.video.muted, true);
  assert.doesNotMatch(i.skip.textContent, /터치/);
  i.video.emit('error');
  assert.equal(i.api.active, true);
  const stalled = intro();
  stalled.timeout(12000);
  assert.equal(stalled.api.active, true);
  assert.equal(stalled.game.inert, true);
  assert.equal(stalled.sound.hidden, false);
  stalled.sound.emit('click');
  assert.equal(stalled.video.plays, 2);
  assert.equal(stalled.video.muted, false);
});

test('backgrounding preserves playback time and Escape cannot skip', () => {
  const i = intro();
  i.video.currentTime = 2;
  i.document.hidden = true;
  i.document.emit('visibilitychange');
  assert.equal(i.video.paused, true);
  assert.equal(i.timers.size, 0);
  i.document.hidden = false;
  i.document.emit('visibilitychange');
  assert.equal(i.video.plays, 2);
  assert.equal(i.video.currentTime, 2);
  let stopped = false, prevented = false;
  i.window.emit('keydown', {key: 'Escape', stopImmediatePropagation() {stopped = true;}, preventDefault() {prevented = true;}});
  assert.equal(stopped && prevented, true);
  assert.equal(i.api.active, true);
  assert.equal(intro({storage:new Map([['semicolon-intro:update-reload','100000']])}).api.active, true);
});

test('existing previews without intro markup keep their normal script-loading path', () => {
  const i = intro({ missing: true });
  assert.equal(i.api, undefined);
  assert.equal(i.video.plays, 0);
  assert.equal(i.timers.size, 0);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.indexOf('js/studio-intro.js') < html.indexOf('js/00-assets.js'));
  assert.match(html, /<video[^>]*playsinline/);
  assert.doesNotMatch(html, /studio-intro-skip|autoplay muted/);
  assert.match(html, /<script src="js\/12-lush-integration\.js[^>]*defer/);
});

test('game startup schedules no simulation, draw or RAF until intro completion and resets elapsed time', async () => {
  const source = fs.readFileSync(path.join(root, 'js/09-main.js'), 'utf8');
  for (const mobile of [false, true]) {
    let resolve, now = 0;
    const finished = new Promise(done => { resolve = done; });
    const calls = { restart: 0, update: 0, draw: 0, frames: [] };
    const context = { window: { studioIntro: { finished } }, performance: { now: () => now },
      restart() { calls.restart++; }, update() { calls.update++; }, draw() { calls.draw++; },
      requestAnimationFrame(callback) { calls.frames.push(callback); }, isMobileTouchDevice: () => mobile };
    vm.runInNewContext(source.slice(source.indexOf('let lastLoopTime')), context);
    assert.deepEqual(calls, { restart: 0, update: 0, draw: 0, frames: [] });
    now = 8500; resolve('ended'); await finished;
    assert.equal(calls.restart, 1);
    assert.equal(calls.draw, 1);
    assert.equal(calls.update, mobile ? 0 : 1);
    assert.equal(calls.frames.length, 1);
    assert.equal(context.screenMode, 'home');
    assert.equal(context.paused, false);
    calls.frames.shift()(now + 17);
    assert.equal(calls.update, mobile ? 1 : 2);
    context.restart(); context.screenMode = 'home';
    assert.equal(calls.frames.length, 1, 'run restart must not schedule another intro or loop');
  }
  let started = 0;
  vm.runInNewContext(source.slice(source.indexOf('let lastLoopTime')), {
    performance: { now: () => 0 }, restart() { started++; }, update() {}, draw() {}, requestAnimationFrame() {}
  });
  assert.equal(started, 1);
});

test('PWA waits for film completion and never force-reloads the opening', async () => {
  let resolveIntro, load;
  const calls = [];
  const finished = new Promise(resolve => {resolveIntro = resolve;});
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/pwa.js'), 'utf8'), {
    window: {studioIntro: {finished}},
    navigator: {serviceWorker: {
      async register() {calls.push('register'); return {async update() {calls.push('update');}};}
    }},
    addEventListener(type, handler) {assert.equal(type, 'load'); load = handler;},
    console
  });
  const pending = load();
  assert.deepEqual(calls, []);
  resolveIntro('ended');
  await pending;
  assert.deepEqual(calls, ['register','update']);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'js/pwa.js'), 'utf8'), /location.reload/);
});
