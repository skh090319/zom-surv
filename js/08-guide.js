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
  { icon:"⌨", title:"조작법", color:"#62ddff", lines:["WASD · 캐릭터 이동","마우스 · 조준 / 좌클릭 · 기본 공격","Q · E · X · 캐릭터 스킬","R · 궁극기 또는 재장전","SPACE · 일시정지"] },
  { icon:"✦", title:"성장과 증강", color:"#ffd45e", lines:["경험치 구슬을 모으면 레벨이 오릅니다.","일반 레벨에는 보조 증강이 등장합니다.","5레벨마다 전투 증강을 하나 선택합니다.","같은 보조 증강을 4회 선택하면 초월합니다.","캐릭터 전용 증강은 해당 캐릭터에게만 등장합니다."] },
  { icon:"☣", title:"몬스터", color:"#ff6b83", lines:["일반 좀비는 플레이어를 추적해 접촉 피해를 줍니다.","큰 좀비는 더 높은 체력과 충돌 범위를 가집니다.","처치한 적은 경험치 또는 회복·자석 아이템을 남깁니다.","붉은 X 표식은 처형 가능한 적을 뜻합니다."] },
  { icon:"♛", title:"보스전", color:"#c27aff", lines:["2분·4분·6분에 보스가 등장합니다.","등장 5초 전 화면에 경고가 표시됩니다.","보스전 동안 생존 타이머와 잡몹 생성이 멈춥니다.","보스는 둔화·기절·속박·밀치기·끌어당기기에 면역입니다.","첫 보스만 제한 전투 영역을 생성합니다."] },
  { icon:"◆", title:"아이템과 생존", color:"#61e5ac", lines:["회복 아이템은 잃은 체력을 회복합니다.","자석은 맵에 남은 경험치 구슬을 끌어옵니다.","체력이 0이 되면 게임이 종료됩니다.","불사 증강을 보유하면 한 번 부활할 수 있습니다.","캐릭터별 자원과 스킬 상태는 하단 전용 UI에서 확인합니다."] }
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
  const gradient=ctx.createLinearGradient(x,y,x,y+h);gradient.addColorStop(0,exclusive?`${accent}24`:(combat?"rgba(16,43,66,.98)":"rgba(39,42,51,.98)"));gradient.addColorStop(1,"rgba(7,9,17,.98)");
  ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=pointInRect(mouse.x,mouse.y,{x,y,w,h})?18:7;drawRoundedRect(x,y,w,h,18,gradient,`${accent}b8`,2);ctx.shadowBlur=0;
  const badge=exclusive?"전용 증강":(combat?"전투 증강":(emerald?"에메랄드":"보조 증강"));drawRoundedRect(x+14,y+13,88,23,12,"rgba(0,0,0,.38)",`${accent}aa`,1);ctx.fillStyle=accent;ctx.font="bold 11px Arial";ctx.textAlign="center";ctx.fillText(badge,x+58,y+29);
  const iconSize=Math.min(82,w*.32);ctx.beginPath();ctx.arc(x+w/2,y+75,iconSize*.5+5,0,Math.PI*2);ctx.fillStyle="rgba(2,5,12,.82)";ctx.fill();ctx.strokeStyle=accent;ctx.stroke();drawAugmentIcon(u.id,x+w/2-iconSize/2,y+75-iconSize/2,iconSize,false);
  ctx.fillStyle="#fff5e7";ctx.font=`bold ${w<190?15:18}px Arial`;ctx.fillText(u.name,x+w/2,y+135);ctx.fillStyle="#c8d1e1";ctx.font=`${w<190?11:12}px Arial`;wrapTextClamped(typeof u.getDesc==="function"?u.getDesc():u.desc,x+w/2,y+158,w-28,17,combat?6:3);
  if(u.transcendName&&!combat){const ty=y+h-101;ctx.strokeStyle=`${accent}55`;ctx.beginPath();ctx.moveTo(x+15,ty-10);ctx.lineTo(x+w-15,ty-10);ctx.stroke();drawAugmentIcon(u.id,x+17,ty,48,true);ctx.textAlign="left";ctx.fillStyle="#ffe98b";ctx.font="bold 12px Arial";ctx.fillText(u.transcendName,x+73,ty+16);ctx.fillStyle="#bec7d7";ctx.font="10px Arial";wrapTextLeft(u.transcendDesc,x+73,ty+35,w-86,13);} else if(combat){ctx.fillStyle="rgba(137,240,255,.7)";ctx.font="bold 11px Arial";ctx.textAlign="center";ctx.fillText("1회 선택 · 즉시 활성화",x+w/2,y+h-21);}
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
    const size=78,gap=10,cols=Math.max(3,Math.floor((canvas.width-40)/(size+gap))),rows=Math.ceil(guideCharacterOrder.length/cols);
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

function drawGuideScreen() {
  drawGuideHeader(guidePage==="augment"?"증강 도감":"기본 게임 가이드",guidePage==="augment"?"AUGMENT ARCHIVE · 실제 게임의 모든 증강 효과":"SURVIVOR HANDBOOK · 생존에 필요한 핵심 정보");
  if(guidePage==="augment")drawAugmentGuide();else drawBasicGuide();
  if(guideScrollMax>0){const top=guideContentTop,trackH=canvas.height-top-18,thumbH=Math.max(45,trackH*trackH/(trackH+guideScrollMax)),thumbY=top+(trackH-thumbH)*guideScrollY/guideScrollMax;drawRoundedRect(canvas.width-12,top,5,trackH,3,"rgba(255,255,255,.08)");drawRoundedRect(canvas.width-12,thumbY,5,thumbH,3,"rgba(190,145,255,.7)");}
}

function handleGuideClick(x,y) {
  if(pointInRect(x,y,guideBackRect)){screenMode="home";guideScrollY=0;return;}
  for(const rect of guideTopModeRects)if(pointInRect(x,y,rect)){guidePage=rect.page;guideScrollY=0;return;}
  if(guidePage!=="augment")return;
  for(const rect of guideTabRects)if(pointInRect(x,y,rect)){guideAugmentTab=rect.tab;guideScrollY=0;return;}
  if(guideAugmentTab==="exclusive")for(const rect of guideCharacterRects)if(pointInRect(x,y,rect)){guideExclusiveCharacter=rect.id;guideScrollY=0;return;}
}
