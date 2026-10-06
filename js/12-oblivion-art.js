// Generated calamity artwork is demand-loaded only for Oblivion.
function oblivionCombatImage(name){
  const image=setGameImageSource(new Image(),`assets/oblivion-v4/${name}.webp`);
  image.assetGroup='oblivion';
  return image;
}
const oblivionCombatArt={
  monster:oblivionCombatImage('monster'),
  skills:[0,1,2,3].map(i=>oblivionCombatImage(`skill-${i}`)),
  joystickBase:oblivionCombatImage('joystick-base'),
  joystickThumb:oblivionCombatImage('joystick-thumb'),
  attack:oblivionCombatImage('attack'),
  skillFrame:oblivionCombatImage('skill-frame'),
  panel:oblivionCombatImage('panel'),
  hpFrame:oblivionCombatImage('hp-frame'),
  xpFrame:oblivionCombatImage('xp-frame')
};
