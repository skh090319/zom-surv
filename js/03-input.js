// 키보드, 마우스, 화면 크기 입력 처리

addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  keys[key] = true;

  if (screenMode === "character" && characterDetailId && key === "escape") {
    characterDetailId = null;
    return;
  }

  if (choosingUpgrade) {
    if (upgradeAnimTime < 18 || upgradeSelectionEffect) return;
    if (key === "1") chooseUpgrade(0);
    if (key === "2") chooseUpgrade(1);
    if (key === "3") chooseUpgrade(2);
    return;
  }

  if (!e.repeat && screenMode === "game" && !paused && !gameOver) {
    if (key === "q" && selectedCharacter === "yupiter") switchYupiterWeapon();
    if (key === "e" && selectedCharacter === "yupiter") activateYupiterSkill();
    if (key === "r" && selectedCharacter === "yupiter") activateYupiterUltimate();
    if (key === "q" && selectedCharacter === "ren") deployRenShadow();
    if (key === "x" && selectedCharacter === "ren") teleportToLatestRenShadow();
    if (key === "e" && selectedCharacter === "ren") activateRenSkill();
    if (key === "r" && selectedCharacter === "ren") activateRenUltimate();
    if (key === "q" && selectedCharacter === "nightLord") activateNightLordQ();
    if (key === "e" && selectedCharacter === "nightLord") activateNightLordE();
    if (key === "x" && selectedCharacter === "nightLord") activateNightLordX();
    if (key === "r" && selectedCharacter === "nightLord") activateNightLordR();
    if (key === "q" && selectedCharacter === "zero") activateZeroQ();
    if (key === "e" && selectedCharacter === "zero") activateZeroE();
    if (key === "x" && selectedCharacter === "zero") activateZeroX();
    if (key === "r" && selectedCharacter === "zero") activateZeroR();
    if (key === "q" && selectedCharacter === "paladin") activatePaladinQ();
    if (key === "e" && selectedCharacter === "paladin") activatePaladinE();
    if (key === "x" && selectedCharacter === "paladin") activatePaladinX();
    if (key === "r" && selectedCharacter === "paladin") activatePaladinR();
    if (key === "q" && selectedCharacter === "arc") activateArcQ();
    if (key === "e" && selectedCharacter === "arc") activateArcE();
    if (key === "x" && selectedCharacter === "arc") activateArcX();
    if (key === "r" && selectedCharacter === "arc") activateArcR();
    if (key === "q" && selectedCharacter === "terra") activateTerraQ();
    if (key === "e" && selectedCharacter === "terra") activateTerraE();
    if (key === "x" && selectedCharacter === "terra") activateTerraX();
    if (key === "r" && selectedCharacter === "terra") activateTerraR();
    if (key === "q" && selectedCharacter === "void") activateVoidQ();
    if (key === "e" && selectedCharacter === "void") activateVoidE();
    if (key === "x" && selectedCharacter === "void") activateVoidX();
    if (key === "r" && selectedCharacter === "void") activateVoidR();
    if(key==="q"&&selectedCharacter==="carmilla")activateCarmillaQ();
    if(key==="q"&&selectedCharacter==="vargas")activateVargasQ();
    if(key==="e"&&selectedCharacter==="vargas")activateVargasE();
    if(key==="x"&&selectedCharacter==="vargas")activateVargasX();
    if(key==="r"&&selectedCharacter==="vargas")activateVargasR();
    if(selectedCharacter==="echo"&&key==="q")replayEchoMemory();
    if(selectedCharacter==="echo"&&key==="e")activateEchoPhase();
    if(selectedCharacter==="echo"&&key==="r")activateEchoCollapse();
    if(selectedCharacter==="aria"&&key==="q")activateAriaQ();
    if(selectedCharacter==="aria"&&key==="e")activateAriaE();
    if(selectedCharacter==="aria"&&key==="x")activateAriaX();
    if(selectedCharacter==="aria"&&key==="r")activateAriaR();
    if (key === "r" && selectedCharacter !== "yupiter" && selectedCharacter !== "ren" && selectedCharacter !== "nightLord" && selectedCharacter !== "zero" && selectedCharacter !== "paladin" && selectedCharacter !== "arc" && selectedCharacter !== "terra" && selectedCharacter !== "void" && selectedCharacter !== "vargas" && selectedCharacter !== "echo" && selectedCharacter !== "aria") reload();
  }
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



canvas.addEventListener("mousedown", event => {
  if (event.button === 2 && screenMode === "character") {
    event.preventDefault();
    for (const card of characterCards) {
      if (!pointInRect(event.clientX, event.clientY, card)) continue;
      characterDetailId = card.id;
      characterDetailOpenedAt = performance.now();
      characterDetailSkillIndex = 0;
      mouse.down = false;
      return;
    }
    return;
  }
  if (event.button !== 0) return;
  if (screenMode === "home") {
    if (pointInRect(mouse.x, mouse.y, homeStartRect)) {
      restart();
      screenMode = "game";
      paused = false;
      return;
    }

    if (pointInRect(mouse.x, mouse.y, homeCharacterRect)) {
      characterScrollY = 0;
      screenMode = "character";
      return;
    }

    return;
  }

  if (screenMode === "character") {
    if (characterDetailId) {
      if (pointInRect(event.clientX, event.clientY, characterDetailCloseRect)) {
        characterDetailId = null;
      } else {
        for (let i = 0; i < characterDetailSkillRects.length; i++) {
          if (!pointInRect(event.clientX, event.clientY, characterDetailSkillRects[i])) continue;
          characterDetailSkillIndex = i;
          characterDetailOpenedAt = performance.now();
          return;
        }
      }
      return;
    }
    if (pointInRect(mouse.x, mouse.y, characterBackRect)) {
      screenMode = "home";
      return;
    }

    if (mouse.y < 138 || mouse.y > canvas.height - 8) return;
    for (const card of characterCards) {
      if (!pointInRect(mouse.x, mouse.y, card)) continue;

      if (card.id === "default") {
        selectedCharacter = "default";
      }

      if (card.id === "suncall") {
        selectedCharacter = "suncall";
      }

      if (card.id === "luminous") {
        selectedCharacter = "luminous";
      }

      if (card.id === "yupiter") {
        selectedCharacter = "yupiter";
      }

      if (card.id === "ren") {
        selectedCharacter = "ren";
      }

      if (card.id === "nightLord") {
        selectedCharacter = "nightLord";
      }

      if (card.id === "zero") {
        selectedCharacter = "zero";
      }

      if (card.id === "paladin") {
        selectedCharacter = "paladin";
      }

      if (card.id === "arc") {
        selectedCharacter = "arc";
      }
      if (card.id === "terra") {
        selectedCharacter = "terra";
      }
      if (card.id === "void") selectedCharacter = "void";
      if(card.id==="carmilla")selectedCharacter="carmilla";
      if(card.id==="vargas")selectedCharacter="vargas";
      if(card.id==="echo")selectedCharacter="echo";
      if(card.id==="aria")selectedCharacter="aria";

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

      for (const card of pauseAugmentCardRects) {
        if (!pointInRect(mouse.x, mouse.y, card)) continue;
        selectedPauseAugmentId = selectedPauseAugmentId === card.id ? null : card.id;
        mouse.down = false;
        return;
      }

      return;
    }

    if (choosingUpgrade) {
      if (upgradeAnimTime < 18 || upgradeSelectionEffect) return;
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

canvas.addEventListener("contextmenu", event => {
  if (screenMode !== "character") return;
  event.preventDefault();
  const point = { x: event.clientX, y: event.clientY };
  for (const card of characterCards) {
    if (!pointInRect(point.x, point.y, card)) continue;
    characterDetailId = card.id;
    characterDetailOpenedAt = performance.now();
    characterDetailSkillIndex = 0;
    mouse.down = false;
    return;
  }
});

canvas.addEventListener("wheel", e => {
  if (screenMode !== "character") return;
  if (characterDetailId) return;
  e.preventDefault();
  characterScrollY = Math.max(0, Math.min(characterScrollMax, characterScrollY + e.deltaY * 0.82));
}, { passive: false });


canvas.addEventListener("mouseup", () => {
  mouse.down = false;
});

addEventListener("resize", () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});
