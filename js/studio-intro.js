// Only a completed film unlocks the lobby.
(() => {
  const overlay = document.getElementById("studio-intro");
  if (!overlay || window.studioIntro) return;
  const video = document.getElementById("studio-intro-video");
  const start = document.getElementById("studio-intro-start");
  const status = document.getElementById("studio-intro-status");
  const game = document.getElementById("game");
  const wasInert = game ? game.inert : false;
  let done = false, started = false, attempt = 0, waitTimer, resolveFinished;
  const finished = new Promise(resolve => { resolveFinished = resolve; });
  window.studioIntro = { get active() { return !done; }, finished };
  function prompt(message, label = "다시 재생") {
    if (done || document.hidden) return;
    clearTimeout(waitTimer);
    status.textContent = message;
    start.textContent = label;
    start.hidden = false;
    start.focus({ preventScroll: true });
  }
  function watchLoading() {
    clearTimeout(waitTimer);
    if (!done && !document.hidden) waitTimer = setTimeout(() => {
      prompt("영상을 불러오는 중입니다. 연결을 확인하고 다시 재생해 주세요.");
    }, 12000);
  }
  function play() {
    if (done || document.hidden) return;
    const token = ++attempt;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    start.hidden = true;
    status.textContent = started ? "" : "오프닝을 불러오는 중…";
    watchLoading();
    function failed(error) {
      if (token !== attempt || done || document.hidden) return;
      prompt(error && error.name === "NotAllowedError"
        ? "소리와 함께 오프닝을 재생하려면 터치해 주세요."
        : "영상 재생을 시작하지 못했습니다. 다시 시도해 주세요.", "터치하여 재생");
    }
    try {
      const result = video.play();
      if (result && typeof result.catch === "function") result.catch(failed);
    } catch (error) { failed(error); }
  }
  function finish() {
    if (done || !started || !Number.isFinite(video.duration) || video.duration <= 0 || video.currentTime < video.duration - 0.15) return;
    done = true;
    ++attempt;
    clearTimeout(waitTimer);
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp, true);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    video.pause();
    video.removeAttribute("src");
    video.load();
    overlay.hidden = true;
    document.documentElement.classList.remove("studio-intro-active");
    if (game) { game.inert = wasInert; game.focus({ preventScroll: true }); }
    resolveFinished("ended");
  }
  function onVisibilityChange() {
    if (done) return;
    if (document.hidden) { ++attempt; clearTimeout(waitTimer); video.pause(); }
    else play();
  }
  function onKeyDown(event) {
    if (done) return;
    event.stopImmediatePropagation();
    if (event.key === "Escape") event.preventDefault();
    if (event.key === "Tab") {
      event.preventDefault();
      (start.hidden ? overlay : start).focus({ preventScroll: true });
    }
  }
  function onKeyUp(event) { if (!done) event.stopImmediatePropagation(); }
  video.playsInline = true;
  overlay.hidden = false;
  document.documentElement.classList.add("studio-intro-active");
  if (game) game.inert = true;
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);
  document.addEventListener("visibilitychange", onVisibilityChange);
  video.addEventListener("playing", () => {
    if (done) return;
    started = true;
    clearTimeout(waitTimer);
    overlay.setAttribute("data-playing", "true");
    status.textContent = "";
    start.hidden = true;
  });
  video.addEventListener("ended", finish);
  video.addEventListener("error", () => prompt("영상을 불러오지 못했습니다. 연결을 확인하고 다시 재생해 주세요."));
  video.addEventListener("waiting", watchLoading);
  video.addEventListener("stalled", watchLoading);
  start.addEventListener("click", () => {
    if (video.error) video.load();
    play();
  });
  overlay.focus({ preventScroll: true });
  play();
})();
