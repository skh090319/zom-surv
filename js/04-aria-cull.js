// 화면 밖 화원은 그리지 않되 상태와 판정은 그대로 유지한다.
function drawAriaEffectsV3(){
  if(selectedCharacter!=="aria")return;
  const soils=ariaSoils,effects=ariaEffects,pad=560,minX=camera.x-pad,maxX=camera.x+getCameraViewWidth()+pad,minY=camera.y-pad,maxY=camera.y+getCameraViewHeight()+pad;
  ariaSoils=soils.filter(s=>s.x>minX&&s.x<maxX&&s.y>minY&&s.y<maxY);
  ariaEffects=effects.filter(e=>e.type==="petalStep"||e.type==="eternal"||(e.x>minX&&e.x<maxX&&e.y>minY&&e.y<maxY));
  drawAriaEffectsV2();ariaSoils=soils;ariaEffects=effects;
}
