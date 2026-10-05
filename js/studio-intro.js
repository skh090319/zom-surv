// Native video owns the screen until it finishes; the game starts from finished.
(() => {
  const overlay = document.getElementById("studio-intro");
  if (!overlay || window.studioIntro) return; // Preview harnesses have no intro DOM.

  const video = document.getElementById("studio-intro-video");
  const sound = document.getElementById("studio-intro-sound");
  const skip = document.getElementById("studio-intro-skip");
  const game = document.getElementById("game");
  const reloadKey = "semicolon-intro:update-reload";
  let done = false;
  let waitTimer;
  let deadlineTimer;
  let resolveFinished;
  const finished = new Promise(resolve => { resolveFinished = resolve; });
  const wasInert = game ? game.inert : false;

  function prepareForUpdateReload() {
    // Only an automatic SW reload is exempt. A later manual visit plays again.
    try { sessionStorage.setItem(reloadKey, String(Date.now())); } catch (_) {}
  }

  window.studioIntro = {
    get active() { return !done; },
    finished,
    skip: () => finish("skipped"),
    prepareForUpdateReload
  };

  function finish(reason) {
    if (done) return;
    done = true;
    clearTimeout(waitTimer);
    clearTimeout(deadlineTimer);
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp, true);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    const restoreFocus = overlay.contains(document.activeElement);
    video.pause();
    video.removeAttribute("src");
    video.load(); // Release the decoder and cancel an unfinished download.
    overlay.hidden = true;
    document.documentElement.classList.remove("studio-intro-active");
    if (game) {
      game.inert = wasInert;
      if (restoreFocus) game.focus({ preventScroll: true });
    }
    resolveFinished(reason);
  }

  function armWaitTimeout() {
    clearTimeout(waitTimer);
    if (!done && !document.hidden) waitTimer = setTimeout(() => finish("media-timeout"), 6000);
  }

  function play() {
    if (done || document.hidden) return;
    armWaitTimeout();
    try {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {
          if (!done && !document.hidden) finish("autoplay-blocked");
        });
      }
    } catch (_) { finish("media-error"); }
  }

  function onVisibilityChange() {
    if (done) return;
    if (document.hidden) {
      clearTimeout(waitTimer);
      video.pause();
    } else play();
  }

  function onKeyDown(event) {
    if (done) return;
    // The game's global hotkeys must never receive intro-control input.
    event.stopImmediatePropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      finish("skipped");
    } else if (event.key === "Tab") {
      event.preventDefault();
      (document.activeElement === sound ? skip : sound).focus({ preventScroll: true });
    }
    // Enter/Space retain their native button activation behavior.
  }

  function onKeyUp(event) {
    if (!done) event.stopImmediatePropagation();
  }

  let skipReload = false;
  try {
    const saved = sessionStorage.getItem(reloadKey);
    sessionStorage.removeItem(reloadKey);
    const age = Date.now() - Number(saved);
    skipReload = saved !== null && age >= 0 && age < 60000;
  } catch (_) {}
  if (skipReload) {
    finish("update-reload");
    return;
  }

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  overlay.hidden = false;
  document.documentElement.classList.add("studio-intro-active");
  if (game) game.inert = true;
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);
  document.addEventListener("visibilitychange", onVisibilityChange);
  video.addEventListener("ended", () => finish("ended"));
  video.addEventListener("error", () => finish("media-error"));
  video.addEventListener("playing", () => clearTimeout(waitTimer));
  video.addEventListener("waiting", armWaitTimeout);
  video.addEventListener("stalled", armWaitTimeout);
  skip.addEventListener("click", () => finish("skipped"));
  sound.addEventListener("click", () => {
    if (done) return;
    video.muted = !video.muted;
    sound.textContent = video.muted ? "소리 켜기" : "소리 끄기";
    sound.setAttribute("aria-pressed", String(!video.muted));
    if (video.paused) play();
  });
  skip.focus({ preventScroll: true });
  // Covers unsupported codecs, stalled playback, and tabs suspended mid-intro.
  deadlineTimer = setTimeout(() => finish("deadline"), 20000);
  play();
})();
