// PWA 설치와 서비스 워커 업데이트 처리
if ("serviceWorker" in navigator) {
  // Worker activation must not interrupt the opening film or an active game.
  // Updated documents are used on the next normal navigation.
  addEventListener("load", async () => {
    // Leave bandwidth and decoding time to the opening film before updating.
    if (window.studioIntro) await window.studioIntro.finished;
    try {
      const registration = await navigator.serviceWorker.register("./sw.js?v=20261019-growth-balance1", { scope: "./", updateViaCache: "none" });
      await registration.update();
    } catch (error) {
      console.warn("PWA service worker registration failed", error);
    }
  });
}
