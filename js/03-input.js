// 키보드, 마우스, 화면 크기 입력 처리

let desktopControlMode = loadDesktopControlMode();
let desktopMoveTarget = null;
let desktopMoveHold = null;
const DESKTOP_MOVE_HOLD_DELAY = 160;
function loadDesktopControlMode() {
  try { return localStorage.getItem('zombieSurvivalDesktopControls') === 'rightClick' ? 'rightClick' : 'wasd'; } catch(error) { return 'wasd'; }
}
function setDesktopControlMode(mode) {
  desktopControlMode = mode === 'rightClick' ? 'rightClick' : 'wasd';
  desktopMoveTarget = null; desktopMoveHold = null; mouse.down = false;
  for (const key of Object.keys(keys)) keys[key] = false;
  try { localStorage.setItem('zombieSurvivalDesktopControls', desktopControlMode); } catch(error) {}
}
function getDesktopSkillOrder(character = selectedCharacter) {
  if (character === 'ren') return ['q','x','e','r'];
  if (character === 'yupiter') return ['e','r'];
  if (character === 'echo') return ['q','e','r'];
  if (character === 'carmilla') return ['q'];
  return ['q','e','x','r'];
}
function getSkillHotkey(key, character = selectedCharacter) {
  const internal = String(key).toLowerCase();
  if (!['q','e','x','r'].includes(internal)) return key;
  if (desktopControlMode !== 'rightClick') return internal.toUpperCase();
  if (internal === 'r') return 'R';
  const index = getDesktopSkillOrder(character).filter(k=>k!=='r').indexOf(internal);
  return index < 0 ? key : ['Q','W','E'][index];
}
function resolveSkillInputKey(event) {
  // Touch buttons carry their actual skill ID, independent of desktop bindings.
  if (event.gameSkillKey) return event.gameSkillKey;
  const key = event.key.toLowerCase();
  if (desktopControlMode !== 'rightClick') return key;
  if (['q','w','e','r','x'].includes(key)) return getDesktopSkillOrder().find(skill=>getSkillHotkey(skill).toLowerCase()===key) || '';
  return key;
}
function formatSkillControlText(text, character = selectedCharacter) {
  return String(text).replace(/\b[QEXR]\b/g,key=>getSkillHotkey(key,character));
}
function setDesktopMoveTarget(event) {
  if (desktopControlMode !== 'rightClick' || screenMode !== 'game' || paused || gameOver || choosingUpgrade || (typeof raidVictory!=='undefined'&&raidVictory)) return false;
  const rect = canvas.getBoundingClientRect(), scale = getWorldViewScale();
  const x = (event.clientX-rect.left)*canvas.width/rect.width/scale+camera.x;
  const y = (event.clientY-rect.top)*canvas.height/rect.height/scale+camera.y;
  desktopMoveTarget = {x:Math.max(player.r,Math.min(WORLD.width-player.r,x)),y:Math.max(player.r,Math.min(WORLD.height-player.r,y)),at:desktopMoveHold?.tracking?desktopMoveHold.startedAt:performance.now()};
  event.preventDefault();
  return true;
}
function updateDesktopMoveHold() {
  if (!desktopMoveHold) return;
  if (desktopControlMode!=='rightClick'||screenMode!=='game'||paused||gameOver||choosingUpgrade||(typeof raidVictory!=='undefined'&&raidVictory)) {
    desktopMoveHold=null;return;
  }
  if(performance.now()-desktopMoveHold.startedAt<DESKTOP_MOVE_HOLD_DELAY)return;
  desktopMoveHold.tracking=true;
  // Reproject every simulation step, even without mousemove: the camera follows us.
  setDesktopMoveTarget({clientX:desktopMoveHold.clientX,clientY:desktopMoveHold.clientY,preventDefault(){}});
}
function endDesktopMoveHold(event) {
  if(!desktopMoveHold)return;
  if(performance.now()-desktopMoveHold.startedAt>=DESKTOP_MOVE_HOLD_DELAY&&Number.isFinite(event.clientX)&&Number.isFinite(event.clientY)) {
    setDesktopMoveTarget(event);
  }
  desktopMoveHold=null;
}
function drawDesktopMoveTarget() {
  if (desktopControlMode!=='rightClick'||!desktopMoveTarget) return;
  const scale=getWorldViewScale(),x=(desktopMoveTarget.x-camera.x)*scale,y=(desktopMoveTarget.y-camera.y)*scale;
  const age=(performance.now()-desktopMoveTarget.at)/1000,r=9+Math.max(0,1-age*3)*10;
  ctx.save();ctx.strokeStyle='rgba(135,231,218,.78)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.ellipse(x,y,r,r*.55,0,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*4,y+Math.sin(a)*4);ctx.lineTo(x+Math.cos(a)*7,y+Math.sin(a)*7);ctx.stroke();}
  ctx.restore();
}

addEventListener("keydown", e => {
  const key = resolveSkillInputKey(e);
  if(typeof runResultsIsOpen==='function'&&runResultsIsOpen())return;

  if(homeDifficultyOpen&&key==="escape"){homeDifficultyOpen=false;return;}
  keys[e.key.toLowerCase()] = true;

  if (screenMode === "character" && characterDetailId && key === "escape") {
    characterDetailId = null;
    return;
  }

  if (screenMode === "guide" && key === "escape") {
    screenMode = "home";
    guideScrollY = 0;
    return;
  }

  if(screenMode==="mobileSettings"&&key==="escape"){leaveMobileSettingsPage();return;}

  if (choosingUpgrade) {
    if (upgradeAnimTime < 18 || upgradeSelectionEffect) return;
    if (key === "1") chooseUpgrade(0);
    if (key === "2") chooseUpgrade(1);
    if (key === "3") chooseUpgrade(2);
    return;
  }

  if (!e.repeat && screenMode === "game" && !paused && !gameOver) {
    if(selectedCharacter==='suncall'){
      if(key==='q')activateSuncallQ();if(key==='e')activateSuncallE();if(key==='x')activateSuncallX();if(key==='r')activateSuncallR();
    }
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
    if(selectedCharacter==="moira"&&key==="q")activateMoiraQ();
    if(selectedCharacter==="moira"&&key==="e")activateMoiraE();
    if(selectedCharacter==="moira"&&key==="x")activateMoiraX();
    if(selectedCharacter==="moira"&&key==="r")activateMoiraR();
    if(selectedCharacter==="mare"&&key==="q")activateMareQ();
    if(selectedCharacter==="mare"&&key==="e")activateMareE();
    if(selectedCharacter==="mare"&&key==="x")activateMareX();
    if(selectedCharacter==="mare"&&key==="r")activateMareR();
    if(selectedCharacter==="nullZero"&&key==="q")activateNullZeroQ();
    if(selectedCharacter==="nullZero"&&key==="e")activateNullZeroE();
    if(selectedCharacter==="nullZero"&&key==="x")activateNullZeroX();
    if(selectedCharacter==="nullZero"&&key==="r")activateNullZeroR();
    if(selectedCharacter==="astra"&&key==="q")activateAstraQ();
    if(selectedCharacter==="astra"&&key==="e")activateAstraE();
    if(selectedCharacter==="astra"&&key==="x")activateAstraX();
    if(selectedCharacter==="astra"&&key==="r")activateAstraR();
    if (key === "r" && selectedCharacter !== "suncall" && selectedCharacter !== "yupiter" && selectedCharacter !== "ren" && selectedCharacter !== "nightLord" && selectedCharacter !== "zero" && selectedCharacter !== "paladin" && selectedCharacter !== "arc" && selectedCharacter !== "terra" && selectedCharacter !== "void" && selectedCharacter !== "carmilla" && selectedCharacter !== "vargas" && selectedCharacter !== "echo" && selectedCharacter !== "aria" && selectedCharacter !== "moira" && selectedCharacter !== "mare" && selectedCharacter !== "nullZero" && selectedCharacter !== "astra" && selectedCharacter !== "oblivion") reload();
  }
});

addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  if(desktopMoveHold){
    if(typeof e.buttons==='number'&&!(e.buttons&2))endDesktopMoveHold(e);
    else {desktopMoveHold.clientX=e.clientX;desktopMoveHold.clientY=e.clientY;}
  }
});



canvas.addEventListener("mousedown", event => {
  if (event.button === 2 && setDesktopMoveTarget(event)) {
    desktopMoveHold={clientX:event.clientX,clientY:event.clientY,startedAt:performance.now(),tracking:false};
    return;
  }
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
    if(homeDifficultyOpen){
      if(homeWorldCloseRect&&pointInRect(event.clientX,event.clientY,homeWorldCloseRect)){homeDifficultyOpen=false;return;}
      const choice=homeDifficultyChoiceRects.find(rect=>pointInRect(event.clientX,event.clientY,rect));
      if(choice){
        selectWorldStage(choice.world,choice.value);
        return;
      }
      homeDifficultyOpen=false;return;
    }
    if(pointInRect(event.clientX,event.clientY,homeSettingsRect)){
      openMobileSettings();return;
    }
    if(pointInRect(event.clientX,event.clientY,homeDifficultyRect)){homeDifficultyOpen=true;return;}
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

    if (pointInRect(event.clientX, event.clientY, homeCodexRect)) {
      openGuideScreen();
      return;
    }

    if (pointInRect(event.clientX, event.clientY, homeRelicRect)) {
      if (typeof openRelicInventory === "function") openRelicInventory();
      return;
    }

    return;
  }

  if (screenMode === "guide") {
    handleGuideClick(event.clientX, event.clientY);
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

      if (card.id === "suncall") {
        selectedCharacter = "suncall";
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
      if(card.id==="moira")selectedCharacter="moira";
      if(card.id==="mare")selectedCharacter="mare";
      if(card.id==="nullZero")selectedCharacter="nullZero";
      if(card.id==="oblivion")selectedCharacter="oblivion";
      if(card.id==="astra")selectedCharacter="astra";
      if(card.id==="lush")selectedCharacter="lush";

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
  if (desktopControlMode==='rightClick'&&screenMode==='game') { event.preventDefault(); return; }
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
  if (screenMode === "guide") {
    e.preventDefault();
    guideScrollY = Math.max(0, Math.min(guideScrollMax, guideScrollY + e.deltaY * 0.82));
    return;
  }
  if (screenMode !== "character") return;
  if (characterDetailId) return;
  e.preventDefault();
  characterScrollY = Math.max(0, Math.min(characterScrollMax, characterScrollY + e.deltaY * 0.82));
}, { passive: false });


canvas.addEventListener("mouseup", event => {
  if(event.button!==2)mouse.down = false;
  if(event.button===2)endDesktopMoveHold(event);
});
// A release outside the canvas must also end cursor tracking.
addEventListener('mouseup',event=>{
  if(event.button===2)endDesktopMoveHold(event);
  if(event.button===0)mouse.down=false;
});

addEventListener('blur',()=>{
  desktopMoveTarget=null;desktopMoveHold=null;mouse.down=false;
  for(const key of Object.keys(keys))keys[key]=false;
});

addEventListener("resize", () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});
