// 키보드, 마우스, 화면 크기 입력 처리

addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  keys[key] = true;

  if (choosingUpgrade) {
    if (key === "1") chooseUpgrade(0);
    if (key === "2") chooseUpgrade(1);
    if (key === "3") chooseUpgrade(2);
    return;
  }

  if (key === "r") reload();
  if (gameOver && key === "enter") {
    restart();
    screenMode = "game";
    paused = false;
  }
});

addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});



canvas.addEventListener("mousedown", () => {
  if (screenMode === "home") {
    if (pointInRect(mouse.x, mouse.y, homeStartRect)) {
      restart();
      screenMode = "game";
      paused = false;
      return;
    }

    if (pointInRect(mouse.x, mouse.y, homeCharacterRect)) {
      screenMode = "character";
      return;
    }

    return;
  }

  if (screenMode === "character") {
    if (pointInRect(mouse.x, mouse.y, characterBackRect)) {
      screenMode = "home";
      return;
    }

    for (const card of characterCards) {
      if (!pointInRect(mouse.x, mouse.y, card)) continue;

      if (card.id === "default") {
        selectedCharacter = "default";
      }

      if (card.id === "suncall" && isSuncallUnlocked()) {
        selectedCharacter = "suncall";
      }

      return;
    }

    return;
  }

  if (screenMode === "game") {
    if (pointInRect(mouse.x, mouse.y, pauseButtonRect)) {
      paused = !paused;
      mouse.down = false;
      return;
    }

    if (paused) {
      if (pointInRect(mouse.x, mouse.y, pauseHomeButtonRect)) {
        paused = false;
        screenMode = "home";
        mouse.down = false;
        return;
      }

      return;
    }

    if (choosingUpgrade) {
      for (let i = 0; i < upgradeCardRects.length; i++) {
        const c = upgradeCardRects[i];

        if (pointInRect(mouse.x, mouse.y, c)) {
          chooseUpgrade(i);
          return;
        }
      }

      return;
    }

    mouse.down = true;
  }
});


canvas.addEventListener("mouseup", () => {
  mouse.down = false;
});

addEventListener("resize", () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});
