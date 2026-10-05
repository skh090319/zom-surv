// PWA 설치와 서비스 워커 업데이트 처리
if ("serviceWorker" in navigator) {
  let refreshingForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshingForUpdate) return;
    refreshingForUpdate = true;
    if (window.studioIntro) window.studioIntro.prepareForUpdateReload();
    location.reload();
  });
  addEventListener("load", async () => {
    // Leave bandwidth and decoding time to the opening film before updating.
    if (window.studioIntro) await window.studioIntro.finished;
    try {
      const registration = await navigator.serviceWorker.register("./sw.js?v=20261006-lush-start1", { scope: "./", updateViaCache: "none" });
      await registration.update();
    } catch (error) {
      console.warn("PWA service worker registration failed", error);
    }
  });
}
