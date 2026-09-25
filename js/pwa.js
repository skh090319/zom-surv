// PWA 설치와 서비스 워커 업데이트 처리
if ("serviceWorker" in navigator) {
  let refreshingForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshingForUpdate) return;
    refreshingForUpdate = true;
    location.reload();
  });
  addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js?v=20260926-17", { scope: "./", updateViaCache: "none" });
      await registration.update();
    } catch (error) {
      console.warn("PWA service worker registration failed", error);
    }
  });
}
