// 증강, 몬스터와 추가 수집 정보를 한곳에서 확인하는 통합 도감.

let guidePage = "augment";
let guideAugmentTab = "support";
let guideExclusiveCharacter = "yupiter";
let guideScrollY = 0;
let guideScrollMax = 0;
let guideContentTop = 162;
let guideSectionTop = 153;
let guideBackRect = { x: 0, y: 0, w: 150, h: 48 };
let guideTopModeRects = [];
let guideTabRects = [];
let guideCharacterRects = [];

const guideSections = [
  { id:"augment", label:"증강", color:"#d5b264", subtitle:"AUGMENT ARCHIVE · 실제 게임의 모든 증강 효과", draw:drawAugmentGuide },
  { id:"monsters", label:"몬스터", color:"#f27989", subtitle:"THREAT ARCHIVE · 감염체와 보스 대응 정보", draw:drawMonsterGuide }
];

function registerGuideSection(section) {
  if (!section?.id || typeof section.draw !== "function") return;
  const index = guideSections.findIndex(entry => entry.id === section.id);
  if (index >= 0) guideSections[index] = section;
  else guideSections.push(section);
}

const exclusiveAugmentOwners = {
  suncallCrystal:'suncall',suncallCircuit:'suncall',suncallGuard:'suncall',
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
  mareDepth:"mare", mareCurrent:"mare", mareFoam:"mare",
  nullZeroPacket:"nullZero", nullZeroQuarantine:"nullZero", nullZeroFork:"nullZero",
  astraRed:"astra", astraBlue:"astra", astraHorizon:"astra"
};

const guideCharacterOrder = ["suncall","yupiter","ren","nightLord","zero","paladin","arc","terra","void","carmilla","vargas","echo","aria","moira","mare","nullZero","astra"];

const monsterGuideEntries = [
  { name:"일반 좀비", tag:"COMMON INFECTED", color:"#73e36f", sprite:"zombie", spriteIndex:0, desc:"가장 흔한 감염체. 플레이어를 끈질기게 추적해 접촉 피해를 줍니다.", tips:["빠른 처치로 포위를 방지", "경험치 구슬을 남김"] },
  { name:"대형 좀비", tag:"HEAVY INFECTED", color:"#ff665f", sprite:"zombie", spriteIndex:1, desc:"높은 체력과 큰 충돌 범위를 지닌 강화 감염체입니다.", tips:["처형 표식을 적극 활용", "일반 좀비보다 높은 보상"] },
  { name:"아마란스", tag:"BOSS 01 · VENOM BLOOM", color:"#9cff4e", sprite:"boss", spriteIndex:0, desc:"움직이지 않는 맹독 식물. 캐릭터 주변에 독 지대를 만들고 분열 독탄과 속박 덩굴을 발사합니다.", tips:["덩굴 적중 시 독탄 연계", "전용 제한 영역 생성"] },
  { name:"모르스", tag:"BOSS 02 · WINGED REAPER", color:"#b96cff", sprite:"boss", spriteIndex:1, desc:"고속으로 추격하는 사신. 돌진과 왕복 대낫을 사용하고 작은 분신 다섯을 소환합니다.", tips:["돌아오는 낫은 더 위험", "분신 면역 · 아스트라 궁극기 둔화 예외"] },
  { name:"사신의 분신", tag:"BOSS MINION", color:"#d8a2ff", sprite:"boss", spriteIndex:1, desc:"모르스와 같은 모습을 한 소형 소환체. 체력과 피해는 낮지만 무리를 지어 추격합니다.", tips:["이동 방해 면역 · 아스트라 R 둔화 예외", "광역 공격으로 빠르게 정리"] },
  { name:"녹스", tag:"BOSS 03 · ABYSS EXECUTOR", color:"#795cff", sprite:"boss", spriteIndex:2, desc:"어둠 구체와 연속 낙뢰를 사용하며, 붉은 예고 영역 끝까지 세 차례 즉사 돌진합니다.", tips:["낙뢰 원에서 즉시 이탈", "붉은 대시 영역은 즉사"] }
];

function openGuideScreen(page = guidePage) {
  guidePage = guideSections.some(section => section.id === page) ? page : "augment";
  guideScrollY = 0;
  guideScrollMax = 0;
  guideTabRects = [];
  guideCharacterRects = [];
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
  const compact=typeof isMobileTouchDevice==="function"&&isMobileTouchDevice()&&canvas.width>canvas.height&&canvas.height<520;
  drawMenuBackdrop(.3);ctx.save();const g=ctx.createLinearGradient(0,0,canvas.width,0);g.addColorStop(0,"rgba(6,9,18,.98)");g.addColorStop(.5,"rgba(20,18,38,.96)");g.addColorStop(1,"rgba(6,9,18,.98)");ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,compact?59:94);ctx.textAlign="center";ctx.fillStyle="#f4f7ff";ctx.shadowColor="#8d6cff";ctx.shadowBlur=compact?10:18;ctx.font=`900 ${compact?26:Math.min(38,canvas.width*.048)}px Arial`;ctx.fillText(title,canvas.width/2,compact?27:42);ctx.shadowBlur=0;ctx.fillStyle="#9eabc2";ctx.font=compact?"11px Arial":"12px Arial";ctx.fillText(subtitle,canvas.width/2,compact?48:66);
  guideBackRect=compact?{x:16,y:10,w:108,h:36}:{x:22,y:22,w:132,h:44};drawGuidePill(guideBackRect,"← 홈으로",false,"#8d7cff");
  const gap=10,count=guideSections.length,width=Math.min(174,(canvas.width-44-gap*(count-1))/count),startX=(canvas.width-count*width-gap*(count-1))/2;
  guideTopModeRects=guideSections.map((section,index)=>({x:startX+index*(width+gap),y:compact?65:101,w:width,h:compact?34:38,page:section.id}));
  guideSections.forEach((section,index)=>drawGuidePill(guideTopModeRects[index],section.label,guidePage===section.id,section.color));
  guideSectionTop=compact?110:153;
  ctx.restore();
}

function drawAugmentGuide() {
  const navY=guideSectionTop,navW=Math.min(150,(canvas.width-64)/3),navGap=10,startX=canvas.width/2-(navW*3+navGap*2)/2;guideTabRects=[{x:startX,y:navY,w:navW,h:42,tab:"support"},{x:startX+navW+navGap,y:navY,w:navW,h:42,tab:"combat"},{x:startX+(navW+navGap)*2,y:navY,w:navW,h:42,tab:"exclusive"}];
  drawGuidePill(guideTabRects[0],"보조",guideAugmentTab==="support","#ffd45e");drawGuidePill(guideTabRects[1],"전투",guideAugmentTab==="combat","#47dcec");drawGuidePill(guideTabRects[2],"전용",guideAugmentTab==="exclusive","#c27aff");
  const contentTop=navY+57;
  const size=78,characterGap=10,characterCols=Math.max(3,Math.min(7,Math.floor((canvas.width-40)/(size+characterGap)))),characterRows=Math.ceil(guideCharacterOrder.length/characterCols);
  const characterHeaderH=guideAugmentTab==="exclusive"?characterRows*96+8:0;
  guideCharacterRects=[];guideContentTop=contentTop;
  const items=getGuideAugments(),gap=16,cols=Math.max(2,Math.min(4,Math.floor((canvas.width-52)/220))),cardW=Math.min(230,(canvas.width-44-gap*(cols-1))/cols),cardH=302,totalRows=Math.ceil(items.length/cols),contentH=characterHeaderH+Math.max(0,totalRows*(cardH+gap)-gap);
  guideScrollMax=Math.max(0,contentH-(canvas.height-contentTop-20));guideScrollY=Math.min(guideScrollY,guideScrollMax);
  const rowW=cols*cardW+(cols-1)*gap,sx=canvas.width/2-rowW/2;
  ctx.save();ctx.beginPath();ctx.rect(0,contentTop-5,canvas.width,canvas.height-contentTop+5);ctx.clip();
  if(guideAugmentTab==="exclusive"){
    guideCharacterOrder.forEach((id,i)=>{
      const row=Math.floor(i/characterCols),count=Math.min(characterCols,guideCharacterOrder.length-row*characterCols),rowX=canvas.width/2-(count*size+(count-1)*characterGap)/2,col=i%characterCols;
      const rect={x:rowX+col*(size+characterGap),y:contentTop+row*96-guideScrollY,w:size,h:90,id};
      if(rect.y+rect.h<contentTop||rect.y>canvas.height)return;
      guideCharacterRects.push(rect);
      const active=id===guideExclusiveCharacter,color=characterSkillGuide[id].color,hover=mouse.y>=contentTop&&pointInRect(mouse.x,mouse.y,rect);
      ctx.save();ctx.shadowColor=active||hover?color:"transparent";ctx.shadowBlur=active?18:(hover?11:0);drawRoundedRect(rect.x,rect.y,size,size,15,active?`${color}30`:(hover?`${color}16`:"rgba(255,255,255,.045)"),active?color:(hover?`${color}aa`:"rgba(255,255,255,.2)"),active?3:(hover?2:1));ctx.restore();
      const img=getCharacterPreviewSprite(id,true);if(img?.complete&&img.naturalWidth){const sc=Math.min((size-10)/img.naturalWidth,(size-10)/img.naturalHeight);ctx.drawImage(img,rect.x+(size-img.naturalWidth*sc)/2,rect.y+(size-img.naturalHeight*sc)/2,img.naturalWidth*sc,img.naturalHeight*sc);}
      ctx.fillStyle=active?color:(hover?"#ffffff":"#c2ccdc");ctx.font="bold 12px Arial";ctx.textAlign="center";ctx.fillText(characterSkillGuide[id].name,rect.x+size/2,rect.y+89);
    });
  }
  items.forEach((u,i)=>{const x=sx+(i%cols)*(cardW+gap),y=contentTop+characterHeaderH+Math.floor(i/cols)*(cardH+gap)-guideScrollY;if(y+cardH>=contentTop&&y<=canvas.height)drawGuideAugmentCard(u,x,y,cardW,cardH);});ctx.restore();
}

function drawMonsterGuide() {
  const top=guideSectionTop,gap=16;
  const normalEntries=monsterGuideEntries.filter(entry=>entry.sprite==="zombie"||entry.tag==="BOSS MINION");
  const bossEntries=monsterGuideEntries.filter(entry=>entry.tag.startsWith("BOSS 0"));
  const normalCols=canvas.width<720?1:(canvas.width<1080?2:3),normalW=Math.min(350,(canvas.width-48-gap*(normalCols-1))/normalCols),normalH=242;
  const normalRows=Math.ceil(normalEntries.length/normalCols),normalSectionH=normalRows*(normalH+gap)-gap;
  const bossW=Math.min(960,canvas.width-48),bossH=326,bossGap=48,bossHeaderSpace=82,bossStart=top+normalSectionH+bossHeaderSpace;
  const contentH=normalSectionH+bossHeaderSpace+bossEntries.length*(bossH+bossGap)-bossGap;
  guideContentTop=top;guideScrollMax=Math.max(0,contentH-(canvas.height-top-20));guideScrollY=Math.min(guideScrollY,guideScrollMax);
  const normalX=canvas.width/2-(normalCols*normalW+(normalCols-1)*gap)/2,bossX=canvas.width/2-bossW/2;
  ctx.save();ctx.beginPath();ctx.rect(0,top-5,canvas.width,canvas.height-top+5);ctx.clip();

  normalEntries.forEach((entry,i)=>{const x=normalX+(i%normalCols)*(normalW+gap),y=top+Math.floor(i/normalCols)*(normalH+gap)-guideScrollY;if(y+normalH<top||y>canvas.height)return;const g=ctx.createLinearGradient(x,y,x+normalW,y+normalH);g.addColorStop(0,`${entry.color}18`);g.addColorStop(1,"rgba(7,10,18,.98)");drawRoundedRect(x,y,normalW,normalH,18,g,`${entry.color}70`,1.4);
    ctx.fillStyle=entry.color;ctx.font="bold 10px Arial";ctx.textAlign="left";ctx.fillText(entry.tag,x+17,y+23);ctx.fillStyle="#f5f7ff";ctx.font="900 21px Arial";ctx.fillText(entry.name,x+17,y+50);
    const imageX=x+normalW-111,imageY=y+16;ctx.save();ctx.beginPath();ctx.arc(imageX+45,imageY+45,43,0,Math.PI*2);ctx.clip();ctx.fillStyle="rgba(2,5,11,.88)";ctx.fillRect(imageX,imageY,90,90);if(entry.sprite==="zombie"&&zombieSpriteAtlas.complete&&zombieSpriteAtlas.naturalWidth){const sw=zombieSpriteAtlas.naturalWidth/2,sh=zombieSpriteAtlas.naturalHeight;ctx.drawImage(zombieSpriteAtlas,entry.spriteIndex*sw,0,sw,sh,imageX+7,imageY+7,76,76);}else{const img=raidBossImages[entry.spriteIndex];if(img?.complete&&img.naturalWidth){const sc=Math.min(80/img.naturalWidth,80/img.naturalHeight);ctx.drawImage(img,imageX+45-img.naturalWidth*sc/2,imageY+45-img.naturalHeight*sc/2,img.naturalWidth*sc,img.naturalHeight*sc);}}ctx.restore();ctx.strokeStyle=entry.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(imageX+45,imageY+45,43,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#b9c5d7";ctx.font="12px Arial";wrapTextLeft(entry.desc,x+17,y+80,normalW-142,19);ctx.strokeStyle=`${entry.color}38`;ctx.beginPath();ctx.moveTo(x+17,y+132);ctx.lineTo(x+normalW-17,y+132);ctx.stroke();ctx.fillStyle=entry.color;ctx.font="bold 12px Arial";ctx.fillText("생존 요령",x+17,y+156);entry.tips.forEach((tip,n)=>{ctx.fillStyle=entry.color;ctx.fillText("◆",x+19,y+184+n*25);ctx.fillStyle="#ced6e4";ctx.font="12px Arial";ctx.fillText(tip,x+39,y+184+n*25);});
  });

  const bossTitleY=bossStart-40-guideScrollY;if(bossTitleY>top-30&&bossTitleY<canvas.height+20){const archiveLabel="RAID BOSS ARCHIVE";ctx.textAlign="left";ctx.fillStyle="#ff6d82";ctx.font="900 13px Arial";ctx.fillText(archiveLabel,bossX,bossTitleY);const archiveLabelWidth=ctx.measureText(archiveLabel).width;ctx.fillStyle="rgba(225,232,246,.58)";ctx.font="11px Arial";ctx.fillText("강력 개체 상세 분석",bossX+archiveLabelWidth+24,bossTitleY);}
  bossEntries.forEach((entry,i)=>{const x=bossX,y=bossStart+i*(bossH+bossGap)-guideScrollY;if(y+bossH<top||y>canvas.height)return;
    const artW=Math.min(360,bossW*.43),cx=x+artW/2,cy=y+bossH/2-6;const aura=ctx.createRadialGradient(cx,cy,12,cx,cy,artW*.54);aura.addColorStop(0,`${entry.color}72`);aura.addColorStop(.48,`${entry.color}25`);aura.addColorStop(1,`${entry.color}00`);ctx.fillStyle=aura;ctx.fillRect(x-10,y,artW+20,bossH);ctx.save();ctx.translate(cx,cy);ctx.shadowColor=entry.color;ctx.shadowBlur=12;ctx.strokeStyle=`${entry.color}68`;ctx.lineWidth=1.7;for(let ring=0;ring<4;ring++){ctx.beginPath();ctx.ellipse(0,99-ring*9,artW*.43-ring*15,24-ring*4,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
    const particleTime=performance.now()*.001;ctx.save();ctx.globalCompositeOperation="screen";for(let particle=0;particle<15;particle++){const lane=(particle*7)%15,px=x+artW*(.06+lane/16)+Math.sin(particleTime*(.55+particle*.018)+particle*2.1)*12,travel=(particleTime*(15+particle%4*3)+particle*47)%(bossH-42),py=y+bossH-18-travel,size=1.4+(particle%4)*.65,alphaHex=particle%3===0?"cc":"86";ctx.fillStyle=`${entry.color}${alphaHex}`;ctx.shadowColor=entry.color;ctx.shadowBlur=particle%3===0?12:7;if(particle%3===0){ctx.beginPath();ctx.moveTo(px,py-size*2.2);ctx.lineTo(px+size*.75,py-size*.45);ctx.lineTo(px+size*2,py);ctx.lineTo(px+size*.75,py+size*.45);ctx.lineTo(px,py+size*2.2);ctx.lineTo(px-size*.75,py+size*.45);ctx.lineTo(px-size*2,py);ctx.lineTo(px-size*.75,py-size*.45);ctx.closePath();ctx.fill();}else{ctx.beginPath();ctx.arc(px,py,size,0,Math.PI*2);ctx.fill();}}ctx.restore();
    const img=raidBossImages[entry.spriteIndex];if(img?.complete&&img.naturalWidth){const maxW=artW*.9,maxH=bossH*.9,sc=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight),drawW=img.naturalWidth*sc,drawH=img.naturalHeight*sc,platformY=cy+99;ctx.save();ctx.shadowColor=entry.color;ctx.shadowBlur=34;ctx.drawImage(img,cx-drawW/2,platformY-drawH+4,drawW,drawH);ctx.restore();}
    const tx=x+artW+42,tw=bossW-artW-66;ctx.textAlign="left";ctx.fillStyle=entry.color;ctx.shadowColor=entry.color;ctx.shadowBlur=8;ctx.font="bold 11px Arial";ctx.fillText(entry.tag,tx,y+52);ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.font="900 31px Arial";ctx.fillText(entry.name,tx,y+92);ctx.fillStyle="#c5cede";ctx.font="14px Arial";wrapTextLeft(entry.desc,tx,y+134,tw,23);ctx.strokeStyle=`${entry.color}4c`;ctx.beginPath();ctx.moveTo(tx,y+202);ctx.lineTo(x+bossW-12,y+202);ctx.stroke();ctx.fillStyle=entry.color;ctx.font="bold 12px Arial";ctx.fillText("생존 요령",tx,y+230);entry.tips.forEach((tip,n)=>{ctx.fillStyle=entry.color;ctx.fillText("◆",tx+2,y+262+n*29);ctx.fillStyle="#e0e6f0";ctx.font="13px Arial";ctx.fillText(tip,tx+23,y+262+n*29);});if(i<bossEntries.length-1){ctx.strokeStyle="rgba(255,255,255,.09)";ctx.beginPath();ctx.moveTo(x+28,y+bossH+bossGap/2);ctx.lineTo(x+bossW-28,y+bossH+bossGap/2);ctx.stroke();}
  });ctx.restore();
}

function drawGuideScreen() {
  const section=guideSections.find(entry=>entry.id===guidePage)||guideSections[0];
  guidePage=section.id;
  drawGuideHeader("도감",section.subtitle||section.label);
  section.draw();
  if(guideScrollMax>0){const top=guideContentTop,trackH=canvas.height-top-18,thumbH=Math.max(45,trackH*trackH/(trackH+guideScrollMax)),thumbY=top+(trackH-thumbH)*guideScrollY/guideScrollMax;drawRoundedRect(canvas.width-12,top,5,trackH,3,"rgba(255,255,255,.08)");drawRoundedRect(canvas.width-12,thumbY,5,thumbH,3,"rgba(190,145,255,.7)");}
}

function handleGuideClick(x,y) {
  if(pointInRect(x,y,guideBackRect)){screenMode="home";guideScrollY=0;return;}
  for(const rect of guideTopModeRects)if(pointInRect(x,y,rect)){openGuideScreen(rect.page);return;}
  const section=guideSections.find(entry=>entry.id===guidePage);
  if(typeof section?.onClick==="function"){section.onClick(x,y);return;}
  if(guidePage!=="augment")return;
  for(const rect of guideTabRects)if(pointInRect(x,y,rect)){guideAugmentTab=rect.tab;guideScrollY=0;return;}
  if(guideAugmentTab==="exclusive"&&y>=guideContentTop)for(const rect of guideCharacterRects)if(pointInRect(x,y,rect)){guideExclusiveCharacter=rect.id;return;}
}
