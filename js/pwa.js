// PWA 설치와 서비스 워커 업데이트 처리
if ("serviceWorker" in navigator) {
  addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      registration.update();
    } catch (error) {
      console.warn("PWA service worker registration failed", error);
    }
  });
}
