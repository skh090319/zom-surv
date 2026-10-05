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
  const elements = Object.fromEntries(['studio-intro', 'studio-intro-video', 'studio-intro-sound', 'studio-intro-skip', 'game'].map(id => [id, new Target()]));
  const overlay = elements['studio-intro'];
  const video = elements['studio-intro-video'];
  const sound = elements['studio-intro-sound'];
  const skip = elements['studio-intro-skip'];
  const game = elements.game;
  overlay.hidden = true;
  overlay.contains = node => [video, sound, skip, overlay].includes(node);
  video.attributes.set('src', 'assets/intro/semicolon-gloss-v1.mp4');
  Object.assign(video, { paused: true, plays: 0, pauses: 0, loads: 0,
    play() { this.plays++; this.paused = false; return playError ? Promise.reject(playError) : Promise.resolve(); },
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

test('native film starts muted inline, releases the decoder and resolves exactly once', async () => {
  const i = intro();
  assert.equal(i.api.active, true);
  assert.equal(i.overlay.hidden, false);
  assert.equal(i.video.muted, true);
  assert.equal(i.video.defaultMuted, true);
  assert.equal(i.video.playsInline, true);
  assert.equal(i.video.plays, 1);
  assert.equal(i.game.inert, true);
  assert.equal(i.document.activeElement, i.skip);
  i.video.emit('playing');
  assert.deepEqual([...i.timers.values()].map(timer => timer.delay), [20000]);
  i.video.emit('ended');
  assert.equal(await i.api.finished, 'ended');
  assert.equal(i.api.active, false);
  assert.equal(i.overlay.hidden, true);
  assert.equal(i.game.inert, false);
  assert.equal(i.document.activeElement, i.game);
  assert.equal(i.video.attributes.has('src'), false);
  assert.equal(i.document.documentElement.classList.size, 0);
  assert.equal(i.timers.size, 0);
  i.api.skip(); i.video.emit('error'); i.video.emit('ended');
  assert.equal(i.video.loads, 1);
});

test('sound toggle is user-controlled and keyboard controls cannot reach game hotkeys', async () => {
  const i = intro();
  i.sound.emit('click');
  assert.equal(i.video.muted, false);
  assert.equal(i.sound.textContent, '소리 끄기');
  assert.equal(i.sound.attributes.get('aria-pressed'), 'true');
  i.sound.emit('click');
  assert.equal(i.video.muted, true);
  assert.equal(i.sound.attributes.get('aria-pressed'), 'false');
  assert.equal(i.video.plays, 1);
  function key(key, type = 'keydown') {
    const event = { key, prevented: false, stopped: false,
      preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
    i.window.emit(type, event); return event;
  }
  assert.equal(key('q').stopped, true);
  assert.equal(key('q', 'keyup').stopped, true);
  assert.equal(key('Tab').prevented, true);
  assert.equal(i.document.activeElement, i.sound);
  key('Tab'); assert.equal(i.document.activeElement, i.skip);
  assert.equal(key('Enter').prevented, false);
  assert.equal(key('Escape').prevented, true);
  assert.equal(await i.api.finished, 'skipped');
  assert.equal(i.window.listeners.get('keydown').size, 0);
  assert.equal(i.window.listeners.get('keyup').size, 0);
});

test('skip, media errors, rejected autoplay and both watchdogs all unblock startup', async () => {
  for (const [action, reason] of [
    [i => i.skip.emit('click'), 'skipped'],
    [i => i.video.emit('error'), 'media-error'],
    [i => i.timeout(6000), 'media-timeout'],
    [i => { i.video.emit('playing'); i.video.emit('stalled'); i.timeout(6000); }, 'media-timeout'],
    [i => { i.video.emit('playing'); i.timeout(20000); }, 'deadline']
  ]) {
    const i = intro(); action(i);
    assert.equal(await i.api.finished, reason);
    assert.equal(i.game.inert, false);
    assert.equal(i.timers.size, 0);
  }
  const blocked = intro({ playError: new Error('Autoplay blocked') });
  assert.equal(await blocked.api.finished, 'autoplay-blocked');
  assert.equal(blocked.overlay.hidden, true);
});

test('backgrounding pauses media and returning resumes with a bounded wait', () => {
  const i = intro();
  i.document.hidden = true; i.document.emit('visibilitychange');
  assert.equal(i.video.paused, true);
  assert.deepEqual([...i.timers.values()].map(timer => timer.delay), [20000]);
  i.document.hidden = false; i.document.emit('visibilitychange');
  assert.equal(i.video.plays, 2);
  assert.equal(i.api.active, true);
  i.timeout(6000);
  assert.equal(i.api.active, false);
  assert.equal(i.document.listeners.get('visibilitychange').size, 0);
});

test('automatic update reload suppression is one-shot, short-lived and storage-optional', async () => {
  const first = intro();
  first.api.prepareForUpdateReload();
  const reload = intro({ storage: first.storage, now: 101000 });
  assert.equal(await reload.api.finished, 'update-reload');
  assert.equal(reload.video.plays, 0);
  assert.equal(reload.storage.size, 0);
  assert.equal(intro({ storage: reload.storage }).api.active, true);
  first.api.prepareForUpdateReload();
  assert.equal(intro({ storage: first.storage, now: 161000 }).api.active, true);
  const blocked = intro({ blockedStorage: true });
  blocked.api.prepareForUpdateReload(); blocked.api.skip();
  assert.equal(await blocked.api.finished, 'skipped');
});

test('existing previews without intro markup keep their normal script-loading path', () => {
  const i = intro({ missing: true });
  assert.equal(i.api, undefined);
  assert.equal(i.video.plays, 0);
  assert.equal(i.timers.size, 0);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.indexOf('js/studio-intro.js') < html.indexOf('js/00-assets.js'));
  assert.match(html, /<video[^>]*autoplay muted playsinline/);
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

test('PWA update work waits for the film and marks automatic reload before navigating', async () => {
  let resolveIntro, load, controllerChange;
  const calls = [];
  const finished = new Promise(resolve => { resolveIntro = resolve; });
  const context = {
    window: { studioIntro: { finished, prepareForUpdateReload() { calls.push('guard'); } } },
    navigator: { serviceWorker: {
      addEventListener(type, handler) { assert.equal(type, 'controllerchange'); controllerChange = handler; },
      async register() { calls.push('register'); return { async update() { calls.push('update'); } }; }
    } },
    addEventListener(type, handler) { assert.equal(type, 'load'); load = handler; },
    location: { reload() { calls.push('reload'); } }, console
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/pwa.js'), 'utf8'), context);
  const loading = load(); assert.deepEqual(calls, []);
  resolveIntro('ended'); await loading;
  assert.deepEqual(calls, ['register', 'update']);
  controllerChange(); controllerChange();
  assert.deepEqual(calls, ['register', 'update', 'guard', 'reload']);
});
