// 홈 화면 증강 도감과 기본 게임 가이드

let guidePage = "augment";
let guideAugmentTab = "support";
let guideExclusiveCharacter = "yupiter";
let guideScrollY = 0;
let guideScrollMax = 0;
let guideContentTop = 162;
let guideBackRect = { x: 0, y: 0, w: 150, h: 48 };
let guideTopModeRects = [];
let guideTabRects = [];
let guideCharacterRects = [];

const exclusiveAugmentOwners = {
  recall:"yupiter", swordAura:"yupiter",
  afterimage:"ren", darkDevour:"ren",
  nightReach:"nightLord", nightBlood:"nightLord", nightExecution:"nightLord",
  zeroThrust:"zero", zeroVital:"zero", zeroJudgment:"zero",
  paladinCombo:"paladin", paladinSpeed:"paladin", paladinRelease:"paladin",
  arcBrand:"arc", arcCorona:"arc", arcHeat:"arc",
  terraResonance:"terra", terraFault:"terra", terraRampart:"terra",
  voidCapacity:"void", voidTerrain:"void", voidChain:"void",
  carmillaPreserve:"carmilla", carmillaResonance:"carmilla", carmillaFeast:"carmilla",
  vargasPredator:"vargas", vargasSkeleton:"vargas", vargasPulse:"vargas",
  echoAfterimage:"echo", echoPitch:"echo", echoArchive:"echo",
  ariaSoil:"aria", ariaThorn:"aria", ariaNight:"aria",
  moiraThread:"moira", moiraNeedle:"moira", moiraDoll:"moira",
  mareDepth:"mare", mareCurrent:"mare", mareFoam:"mare"
};

const guideCharacterOrder = ["yupiter","ren","nightLord","zero","paladin","arc","terra","void","carmilla","vargas","echo","aria","moira","mare"];

const basicGuideSections = [
  { icon:"⌨", title:"조작법", color:"#62ddff", lines:["WASD · 캐릭터 이동","마우스 · 조준 / 좌클릭 · 기본 공격","Q · E · X · 캐릭터 스킬","R · 궁극기 또는 재장전","우측 상단 Ⅱ 버튼 · 일시정지"] },
  { icon:"✦", title:"성장과 증강", color:"#ffd45e", lines:["경험치 구슬을 모으면 레벨이 오릅니다.","일반 레벨에는 보조 증강이 등장합니다.","5레벨마다 전투 증강을 하나 선택합니다.","같은 보조 증강을 4회 선택하면 초월합니다.","캐릭터 전용 증강은 해당 캐릭터에게만 등장합니다."] },
  { icon:"☣", title:"몬스터", color:"#ff6b83", lines:["일반 좀비는 플레이어를 추적해 접촉 피해를 줍니다.","큰 좀비는 더 높은 체력과 충돌 범위를 가집니다.","처치한 적은 경험치 또는 회복·자석 아이템을 남깁니다.","붉은 X 표식은 처형 가능한 적을 뜻합니다."] },
  { icon:"♛", title:"보스전", color:"#c27aff", lines:["2분·4분·6분에 보스가 등장합니다.","등장 5초 전 화면에 경고가 표시됩니다.","보스전 동안 생존 타이머와 잡몹 생성이 멈춥니다.","보스는 둔화·기절·속박·밀치기·끌어당기기에 면역입니다.","첫 보스만 제한 전투 영역을 생성합니다."] },
  { icon:"◆", title:"아이템과 생존", color:"#61e5ac", lines:["회복 아이템은 잃은 체력을 회복합니다.","자석은 맵에 남은 경험치 구슬을 끌어옵니다.","체력이 0이 되면 게임이 종료됩니다.","불사 증강을 보유하면 한 번 부활할 수 있습니다.","캐릭터별 자원과 스킬 상태는 하단 전용 UI에서 확인합니다."] }
];

const monsterGuideEntries = [
  { name:"일반 좀비", tag:"COMMON INFECTED", color:"#73e36f", sprite:"zombie", spriteIndex:0, desc:"가장 흔한 감염체. 플레이어를 끈질기게 추적해 접촉 피해를 줍니다.", tips:["빠른 처치로 포위를 방지", "경험치 구슬을 남김"] },
  { name:"대형 좀비", tag:"HEAVY INFECTED", color:"#ff665f", sprite:"zombie", spriteIndex:1, desc:"높은 체력과 큰 충돌 범위를 지닌 강화 감염체입니다.", tips:["처형 표식을 적극 활용", "일반 좀비보다 높은 보상"] },
  { name:"아마란스", tag:"BOSS 01 · VENOM BLOOM", color:"#9cff4e", sprite:"boss", spriteIndex:0, desc:"움직이지 않는 맹독 식물. 캐릭터 주변에 독 지대를 만들고 분열 독탄과 속박 덩굴을 발사합니다.", tips:["덩굴 적중 시 독탄 연계", "전용 제한 영역 생성"] },
  { name:"모르스", tag:"BOSS 02 · WINGED REAPER", color:"#b96cff", sprite:"boss", spriteIndex:1, desc:"고속으로 추격하는 사신. 돌진과 왕복 대낫을 사용하고 작은 분신 다섯을 소환합니다.", tips:["돌아오는 낫은 더 위험", "분신도 이동 방해 면역"] },
  { name:"사신의 분신", tag:"BOSS MINION", color:"#d8a2ff", sprite:"boss", spriteIndex:1, desc:"모르스와 같은 모습을 한 소형 소환체. 체력과 피해는 낮지만 무리를 지어 추격합니다.", tips:["모든 이동 방해 효과 면역", "광역 공격으로 빠르게 정리"] },
  { name:"녹스", tag:"BOSS 03 · ABYSS EXECUTOR", color:"#795cff", sprite:"boss", spriteIndex:2, desc:"어둠 구체와 연속 낙뢰를 사용하며, 붉은 예고 영역 끝까지 세 차례 즉사 돌진합니다.", tips:["낙뢰 원에서 즉시 이탈", "붉은 대시 영역은 즉사"] }
];

function openGuideScreen(page) {
  guidePage = page;
  guideScrollY = 0;
  screenMode = "guide";
  mouse.down = false;
}

function drawGuidePill(rect, label, active, color) {
  const hover = pointInRect(mouse.x, mouse.y, rect);
  drawRoundedRect(rect.x,rect.y,rect.w,rect.h,12,active?`${color}25`:(hover?"rgba(255,255,255,.08)":"rgba(255,255,255,.035)"),active?color:"rgba(193,207,232,.25)",active?2:1);
  ctx.fillStyle=active?"#fff":"#aebbd0";ctx.font="bold 14px Arial";ctx.textAlign="center";ctx.fillText(label,rect.x+rect.w/2,rect.y+rect.h/2+5);
}

function getGuideAugments() {
  if (guideAugmentTab === "combat") return upgrades.filter(u=>u.category==="combat");
  if (guideAugmentTab === "exclusive") return upgrades.filter(u=>exclusiveAugmentOwners[u.id]===guideExclusiveCharacter);
  return upgrades.filter(u=>(u.category==="support"&&!exclusiveAugmentOwners[u.id])||u.category==="emerald");
}

function drawGuideAugmentCard(u,x,y,w,h) {
  const exclusive=Boolean(exclusiveAugmentOwners[u.id]), combat=u.category==="combat", emerald=u.category==="emerald";
  const accent=exclusive?(characterSkillGuide[exclusiveAugmentOwners[u.id]]?.color||"#c27aff"):(combat?"#47dcec":(emerald?"#35e89a":"#ffd45e"));
  const gradient=ctx.createLinearGradient(x,y,x,y+h);gradient.addColorStop(0,"rgba(23,27,38,.98)");gradient.addColorStop(.48,exclusive?`${accent}0b`:(combat?"rgba(20,43,54,.28)":"rgba(39,37,29,.2)"));gradient.addColorStop(1,"rgba(7,9,16,.99)");
  const hovered=pointInRect(mouse.x,mouse.y,{x,y,w,h});ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=hovered?9:2;drawRoundedRect(x,y,w,h,18,gradient,hovered?`${accent}9a`:`${accent}62`,hovered?2:1.25);ctx.shadowBlur=0;
  const badge=exclusive?"전용 증강":(combat?"전투 증강":(emerald?"에메랄드":"보조 증강"));drawRoundedRect(x+14,y+13,88,23,12,"rgba(6,8,14,.72)",`${accent}72`,1);ctx.fillStyle=`${accent}d8`;ctx.font="bold 11px Arial";ctx.textAlign="center";ctx.fillText(badge,x+58,y+29);
  const iconSize=Math.min(82,w*.32);ctx.beginPath();ctx.arc(x+w/2,y+75,iconSize*.5+5,0,Math.PI*2);ctx.fillStyle="rgba(2,5,12,.9)";ctx.fill();ctx.strokeStyle=`${accent}74`;ctx.lineWidth=1.25;ctx.stroke();drawAugmentIcon(u.id,x+w/2-iconSize/2,y+75-iconSize/2,iconSize,false);
  ctx.fillStyle="#edf1f8";ctx.font=`bold ${w<190?15:18}px Arial`;ctx.fillText(u.name,x+w/2,y+135);ctx.fillStyle="#aeb9ca";ctx.font=`${w<190?11:12}px Arial`;wrapTextClamped(typeof u.getDesc==="function"?u.getDesc():u.desc,x+w/2,y+158,w-28,17,combat?6:3);
  if(u.transcendName&&!combat){const ty=y+h-101;ctx.strokeStyle="rgba(255,255,255,.1)";ctx.beginPath();ctx.moveTo(x+15,ty-10);ctx.lineTo(x+w-15,ty-10);ctx.stroke();drawAugmentIcon(u.id,x+17,ty,48,true);ctx.textAlign="left";ctx.fillStyle="#ddc77d";ctx.font="bold 12px Arial";ctx.fillText(u.transcendName,x+73,ty+16);ctx.fillStyle="#9faabc";ctx.font="10px Arial";wrapTextLeft(u.transcendDesc,x+73,ty+35,w-86,13);} else if(combat){ctx.fillStyle="rgba(151,203,214,.68)";ctx.font="bold 11px Arial";ctx.textAlign="center";ctx.fillText("1회 선택 · 즉시 활성화",x+w/2,y+h-21);}
  ctx.restore();
}

function drawGuideHeader(title, subtitle) {
  drawMenuBackdrop(.3);ctx.save();const g=ctx.createLinearGradient(0,0,canvas.width,0);g.addColorStop(0,"rgba(6,9,18,.98)");g.addColorStop(.5,"rgba(20,18,38,.96)");g.addColorStop(1,"rgba(6,9,18,.98)");ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,94);ctx.textAlign="center";ctx.fillStyle="#f4f7ff";ctx.shadowColor="#8d6cff";ctx.shadowBlur=18;ctx.font=`900 ${Math.min(38,canvas.width*.048)}px Arial`;ctx.fillText(title,canvas.width/2,42);ctx.shadowBlur=0;ctx.fillStyle="#9eabc2";ctx.font="12px Arial";ctx.fillText(subtitle,canvas.width/2,66);
  guideBackRect={x:22,y:22,w:132,h:44};drawGuidePill(guideBackRect,"← 홈으로",false,"#8d7cff");
  guideTopModeRects=[];ctx.restore();
}

function drawAugmentGuide() {
  const navY=105,navW=Math.min(150,(canvas.width-64)/3),navGap=10,startX=canvas.width/2-(navW*3+navGap*2)/2;guideTabRects=[{x:startX,y:navY,w:navW,h:42,tab:"support"},{x:startX+navW+navGap,y:navY,w:navW,h:42,tab:"combat"},{x:startX+(navW+navGap)*2,y:navY,w:navW,h:42,tab:"exclusive"}];
  drawGuidePill(guideTabRects[0],"보조",guideAugmentTab==="support","#ffd45e");drawGuidePill(guideTabRects[1],"전투",guideAugmentTab==="combat","#47dcec");drawGuidePill(guideTabRects[2],"전용",guideAugmentTab==="exclusive","#c27aff");
  let contentTop=162;guideCharacterRects=[];
  if(guideAugmentTab==="exclusive"){
    const size=78,gap=10,cols=Math.max(3,Math.min(7,Math.floor((canvas.width-40)/(size+gap)))),rows=Math.ceil(guideCharacterOrder.length/cols);
    guideCharacterOrder.forEach((id,i)=>{const row=Math.floor(i/cols),count=Math.min(cols,guideCharacterOrder.length-row*cols),sx=canvas.width/2-(count*size+(count-1)*gap)/2,col=i%cols;const rect={x:sx+col*(size+gap),y:160+row*96,w:size,h:90,id};guideCharacterRects.push(rect);const active=id===guideExclusiveCharacter,color=characterSkillGuide[id].color,hover=pointInRect(mouse.x,mouse.y,rect);ctx.save();ctx.shadowColor=active||hover?color:"transparent";ctx.shadowBlur=active?18:(hover?11:0);drawRoundedRect(rect.x,rect.y,size,size,15,active?`${color}30`:(hover?`${color}16`:"rgba(255,255,255,.045)"),active?color:(hover?`${color}aa`:"rgba(255,255,255,.2)"),active?3:(hover?2:1));ctx.restore();const img=getCharacterPreviewSprite(id);if(img?.complete&&img.naturalWidth){const sc=Math.min((size-10)/img.naturalWidth,(size-10)/img.naturalHeight);ctx.drawImage(img,rect.x+(size-img.naturalWidth*sc)/2,rect.y+(size-img.naturalHeight*sc)/2,img.naturalWidth*sc,img.naturalHeight*sc);}ctx.fillStyle=active?color:(hover?"#ffffff":"#c2ccdc");ctx.font="bold 12px Arial";ctx.textAlign="center";ctx.fillText(characterSkillGuide[id].name,rect.x+size/2,rect.y+89);});contentTop=168+rows*96;
  }
  guideContentTop=contentTop;
  const items=getGuideAugments(),gap=16,cols=Math.max(2,Math.min(4,Math.floor((canvas.width-52)/220))),cardW=Math.min(230,(canvas.width-44-gap*(cols-1))/cols),cardH=302,totalRows=Math.ceil(items.length/cols),contentH=totalRows*(cardH+gap)-gap;guideScrollMax=Math.max(0,contentH-(canvas.height-contentTop-20));guideScrollY=Math.min(guideScrollY,guideScrollMax);const rowW=cols*cardW+(cols-1)*gap,sx=canvas.width/2-rowW/2;
  ctx.save();ctx.beginPath();ctx.rect(0,contentTop-5,canvas.width,canvas.height-contentTop+5);ctx.clip();items.forEach((u,i)=>{const x=sx+(i%cols)*(cardW+gap),y=contentTop+Math.floor(i/cols)*(cardH+gap)-guideScrollY;if(y+cardH>=contentTop&&y<=canvas.height)drawGuideAugmentCard(u,x,y,cardW,cardH);});ctx.restore();
}

function drawBasicGuide() {
  const top=108,gap=18,cols=canvas.width<760?1:2,cardW=Math.min(500,(canvas.width-54-gap*(cols-1))/cols),cardH=214,totalRows=Math.ceil(basicGuideSections.length/cols),contentH=totalRows*(cardH+gap)-gap;guideScrollMax=Math.max(0,contentH-(canvas.height-top-20));guideScrollY=Math.min(guideScrollY,guideScrollMax);const sx=canvas.width/2-(cols*cardW+(cols-1)*gap)/2;
  guideContentTop=top;
  ctx.save();ctx.beginPath();ctx.rect(0,top-5,canvas.width,canvas.height-top+5);ctx.clip();basicGuideSections.forEach((section,i)=>{const x=sx+(i%cols)*(cardW+gap),y=top+Math.floor(i/cols)*(cardH+gap)-guideScrollY;const grad=ctx.createLinearGradient(x,y,x+cardW,y+cardH);grad.addColorStop(0,`${section.color}16`);grad.addColorStop(1,"rgba(7,9,17,.97)");drawRoundedRect(x,y,cardW,cardH,18,grad,`${section.color}88`,1.5);ctx.fillStyle=section.color;ctx.font="bold 26px Arial";ctx.textAlign="center";ctx.fillText(section.icon,x+35,y+42);ctx.textAlign="left";ctx.fillStyle="#f2f5fc";ctx.font="bold 20px Arial";ctx.fillText(section.title,x+65,y+39);ctx.strokeStyle=`${section.color}55`;ctx.beginPath();ctx.moveTo(x+18,y+57);ctx.lineTo(x+cardW-18,y+57);ctx.stroke();ctx.font="13px Arial";section.lines.forEach((line,j)=>{ctx.fillStyle=section.color;ctx.fillText("•",x+22,y+84+j*24);ctx.fillStyle="#c6d0df";ctx.fillText(line,x+38,y+84+j*24);});});ctx.restore();
}

function drawMonsterGuide() {
  const top=108,gap=16;
  const normalEntries=monsterGuideEntries.filter(entry=>entry.sprite==="zombie"||entry.tag==="BOSS MINION");
  const bossEntries=monsterGuideEntries.filter(entry=>entry.tag.startsWith("BOSS 0"));
  const normalCols=canvas.width<720?1:(canvas.width<1080?2:3),normalW=Math.min(350,(canvas.width-48-gap*(normalCols-1))/normalCols),normalH=242;
  const normalRows=Math.ceil(normalEntries.length/normalCols),normalSectionH=normalRows*(normalH+gap)-gap;
  const bossW=Math.min(960,canvas.width-48),bossH=310,bossStart=top+normalSectionH+48;
  const contentH=normalSectionH+48+bossEntries.length*(bossH+gap)-gap;
  guideContentTop=top;guideScrollMax=Math.max(0,contentH-(canvas.height-top-20));guideScrollY=Math.min(guideScrollY,guideScrollMax);
  const normalX=canvas.width/2-(normalCols*normalW+(normalCols-1)*gap)/2,bossX=canvas.width/2-bossW/2;
  ctx.save();ctx.beginPath();ctx.rect(0,top-5,canvas.width,canvas.height-top+5);ctx.clip();

  normalEntries.forEach((entry,i)=>{const x=normalX+(i%normalCols)*(normalW+gap),y=top+Math.floor(i/normalCols)*(normalH+gap)-guideScrollY;if(y+normalH<top||y>canvas.height)return;const g=ctx.createLinearGradient(x,y,x+normalW,y+normalH);g.addColorStop(0,`${entry.color}18`);g.addColorStop(1,"rgba(7,10,18,.98)");drawRoundedRect(x,y,normalW,normalH,18,g,`${entry.color}70`,1.4);
    ctx.fillStyle=entry.color;ctx.font="bold 10px Arial";ctx.textAlign="left";ctx.fillText(entry.tag,x+17,y+23);ctx.fillStyle="#f5f7ff";ctx.font="900 21px Arial";ctx.fillText(entry.name,x+17,y+50);
    const imageX=x+normalW-111,imageY=y+16;ctx.save();ctx.beginPath();ctx.arc(imageX+45,imageY+45,43,0,Math.PI*2);ctx.clip();ctx.fillStyle="rgba(2,5,11,.88)";ctx.fillRect(imageX,imageY,90,90);if(entry.sprite==="zombie"&&zombieSpriteAtlas.complete&&zombieSpriteAtlas.naturalWidth){const sw=zombieSpriteAtlas.naturalWidth/2,sh=zombieSpriteAtlas.naturalHeight;ctx.drawImage(zombieSpriteAtlas,entry.spriteIndex*sw,0,sw,sh,imageX+7,imageY+7,76,76);}else{const img=raidBossImages[entry.spriteIndex];if(img?.complete&&img.naturalWidth){const sc=Math.min(80/img.naturalWidth,80/img.naturalHeight);ctx.drawImage(img,imageX+45-img.naturalWidth*sc/2,imageY+45-img.naturalHeight*sc/2,img.naturalWidth*sc,img.naturalHeight*sc);}}ctx.restore();ctx.strokeStyle=entry.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(imageX+45,imageY+45,43,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#b9c5d7";ctx.font="12px Arial";wrapTextLeft(entry.desc,x+17,y+80,normalW-142,19);ctx.strokeStyle=`${entry.color}38`;ctx.beginPath();ctx.moveTo(x+17,y+132);ctx.lineTo(x+normalW-17,y+132);ctx.stroke();ctx.fillStyle=entry.color;ctx.font="bold 12px Arial";ctx.fillText("생존 요령",x+17,y+156);entry.tips.forEach((tip,n)=>{ctx.fillStyle=entry.color;ctx.fillText("◆",x+19,y+184+n*25);ctx.fillStyle="#ced6e4";ctx.font="12px Arial";ctx.fillText(tip,x+39,y+184+n*25);});
  });

  const bossTitleY=bossStart-18-guideScrollY;if(bossTitleY>top-30&&bossTitleY<canvas.height+20){ctx.textAlign="left";ctx.fillStyle="#ff6d82";ctx.font="900 13px Arial";ctx.fillText("RAID BOSS ARCHIVE",bossX,bossTitleY);ctx.fillStyle="rgba(225,232,246,.58)";ctx.font="11px Arial";ctx.fillText("강력 개체 상세 분석",bossX+145,bossTitleY);}
  bossEntries.forEach((entry,i)=>{const x=bossX,y=bossStart+i*(bossH+gap)-guideScrollY;if(y+bossH<top||y>canvas.height)return;
    const artW=Math.min(360,bossW*.43),cx=x+artW/2,cy=y+bossH/2-6;const aura=ctx.createRadialGradient(cx,cy,12,cx,cy,artW*.54);aura.addColorStop(0,`${entry.color}72`);aura.addColorStop(.48,`${entry.color}25`);aura.addColorStop(1,`${entry.color}00`);ctx.fillStyle=aura;ctx.fillRect(x-10,y,artW+20,bossH);ctx.save();ctx.translate(cx,cy);ctx.shadowColor=entry.color;ctx.shadowBlur=12;ctx.strokeStyle=`${entry.color}68`;ctx.lineWidth=1.7;for(let ring=0;ring<4;ring++){ctx.beginPath();ctx.ellipse(0,99-ring*9,artW*.43-ring*15,24-ring*4,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
    const img=raidBossImages[entry.spriteIndex];if(img?.complete&&img.naturalWidth){const maxW=artW*.9,maxH=bossH*.9,sc=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight);ctx.save();ctx.shadowColor=entry.color;ctx.shadowBlur=34;ctx.drawImage(img,cx-img.naturalWidth*sc/2,cy-img.naturalHeight*sc/2-12,img.naturalWidth*sc,img.naturalHeight*sc);ctx.restore();}
    const tx=x+artW+28,tw=bossW-artW-48;ctx.textAlign="left";ctx.fillStyle=entry.color;ctx.shadowColor=entry.color;ctx.shadowBlur=8;ctx.font="bold 11px Arial";ctx.fillText(entry.tag,tx,y+44);ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.font="900 31px Arial";ctx.fillText(entry.name,tx,y+82);ctx.fillStyle="#c5cede";ctx.font="14px Arial";wrapTextLeft(entry.desc,tx,y+118,tw,22);ctx.strokeStyle=`${entry.color}4c`;ctx.beginPath();ctx.moveTo(tx,y+182);ctx.lineTo(x+bossW-12,y+182);ctx.stroke();ctx.fillStyle=entry.color;ctx.font="bold 12px Arial";ctx.fillText("생존 요령",tx,y+208);entry.tips.forEach((tip,n)=>{ctx.fillStyle=entry.color;ctx.fillText("◆",tx+2,y+238+n*28);ctx.fillStyle="#e0e6f0";ctx.font="13px Arial";ctx.fillText(tip,tx+23,y+238+n*28);});if(i<bossEntries.length-1){ctx.strokeStyle="rgba(255,255,255,.09)";ctx.beginPath();ctx.moveTo(x+28,y+bossH+gap/2);ctx.lineTo(x+bossW-28,y+bossH+gap/2);ctx.stroke();}
  });ctx.restore();
}

function drawGuideScreen() {
  const title=guidePage==="augment"?"증강 도감":guidePage==="monsters"?"몬스터 도감":"기본 게임 가이드";
  const subtitle=guidePage==="augment"?"AUGMENT ARCHIVE · 실제 게임의 모든 증강 효과":guidePage==="monsters"?"THREAT ARCHIVE · 감염체와 보스 대응 정보":"SURVIVOR HANDBOOK · 생존에 필요한 핵심 정보";
  drawGuideHeader(title,subtitle);
  if(guidePage==="augment")drawAugmentGuide();else if(guidePage==="monsters")drawMonsterGuide();else drawBasicGuide();
  if(guideScrollMax>0){const top=guideContentTop,trackH=canvas.height-top-18,thumbH=Math.max(45,trackH*trackH/(trackH+guideScrollMax)),thumbY=top+(trackH-thumbH)*guideScrollY/guideScrollMax;drawRoundedRect(canvas.width-12,top,5,trackH,3,"rgba(255,255,255,.08)");drawRoundedRect(canvas.width-12,thumbY,5,thumbH,3,"rgba(190,145,255,.7)");}
}

function handleGuideClick(x,y) {
  if(pointInRect(x,y,guideBackRect)){screenMode="home";guideScrollY=0;return;}
  for(const rect of guideTopModeRects)if(pointInRect(x,y,rect)){guidePage=rect.page;guideScrollY=0;return;}
  if(guidePage!=="augment")return;
  for(const rect of guideTabRects)if(pointInRect(x,y,rect)){guideAugmentTab=rect.tab;guideScrollY=0;return;}
  if(guideAugmentTab==="exclusive")for(const rect of guideCharacterRects)if(pointInRect(x,y,rect)){guideExclusiveCharacter=rect.id;guideScrollY=0;return;}
}
