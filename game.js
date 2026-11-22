// Jungle Soldier — Phase 1 prototype, visual pass v5: Meridian-level polish.
// v5: cinematic dusk/night, real PBR ground + dusk HDRI environment, neon
// path edges (red left / cyan right), dense skyline/ruins, showcase menu,
// minimal Meridian-style HUD, camera shake / FOV kick / speed lines.
// CONTRAST FIRST: deep dark blue night, warm gold vs cool cyan, strong rim
// light, value separation (dark ground, mid foliage, bright hero/tracers),
// fog haze so distance fades and near stays crisp. Definition: edge trim,
// panel seams, bolts, vents, varied materials — procedural, not a real model.
// v4: the crossbow archer is now a soldier with an assault rifle. v3's
// arrows missed because they flew at 55 m/s with gravity arc from an offset
// sight while the reticle floated anywhere on screen. v4 is direct
// line-of-sight gunplay: centre-screen reticle, over-the-shoulder camera,
// near-instant raycast bullets with a visible tracer from the muzzle, small
// aim assist, and a grenade Power Attack. All other gameplay constants
// unchanged from Phase 1. Smooth stylized visuals stay (v2/v3).
// Zone 1, Level 1 only: ground jungle run, 380 m. No shop, no zones/boss,
// no new weapon colours, no lives. Health 100; death ends the run.
// Ground at y = 0. Corridor ~12 m wide between two rows of trees.
// Controls: W/Up run, S/Down brake, A/D strafe, double-tap A/D roll,
// Space jump, mouse aims, hold left click to fire the rifle,
// E / right click throws a grenade (Power Attack).
import * as T from './vendor/three.module.min.js';
import { HDRLoader } from './vendor/HDRLoader.js'; // v5: real dusk HDRI (r180 example loader)
import { initProfiles, recordRun, activeProfile, saveSetting } from './profiles.js'; // V7
import { loadSoldier } from './soldier.js'; // V10: animated Mixamo soldier
import { createMusic } from './music.js'; // V11: original chiptune soundtrack
import { LEVELS, NEW_DAMAGE, BUGGY, BEE, MINI, MUSHROOM, BOSS, WEAPONS } from './levels.js'; // V14: Forest campaign data
import { progressFor, recordLevel } from './profiles.js'; // V14

const ui = Object.fromEntries([...document.querySelectorAll('[id]')].map(el => [el.id, el]));
const scene = new T.Scene();
// v5: cinematic dusk/night. Deep dark blue so the hero and foreground pop;
// warm gold vs cool cyan as opposing hues; value separation: dark ground,
// mid-tone foliage, bright hero/tracers/pickups. Fog haze fades the distance.
scene.background = new T.Color(0x0a1420);
scene.fog = new T.FogExp2(0x55604c, 0.012); // V8: warm green haze to meet the sunrise sky
const camera = new T.PerspectiveCamera(56, 1, 0.1, 240);
let renderer;
try {
  renderer = new T.WebGLRenderer({ antialias: true });
} catch (error) {
  ui.message.textContent = 'This game needs a desktop browser with WebGL enabled.';
  ui.start.textContent = 'Graphics unavailable';
  throw error;
}
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.35; // v5: dusk, richer contrast
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
ui.view.append(renderer.domElement);
// v5: real dusk HDRI environment (Poly Haven CC0, Qwantani Dusk 1, 1k) drives
// reflections on metal/glass. Procedural env is the fallback if it fails.
const pmrem = new T.PMREMGenerator(renderer);
function proceduralEnv() {
  const env = new T.Scene();
  env.background = new T.Color(0x0a1420);
  const warm = new T.Mesh(new T.SphereGeometry(4, 8, 8), new T.MeshBasicMaterial({color:0xffb36a}));
  warm.position.set(-6, 3, -4); env.add(warm);
  const cool = new T.Mesh(new T.SphereGeometry(5, 8, 8), new T.MeshBasicMaterial({color:0x2266aa}));
  cool.position.set(6, 5, 4); env.add(cool);
  const top = new T.Mesh(new T.SphereGeometry(6, 8, 8), new T.MeshBasicMaterial({color:0x0e2a44}));
  top.position.set(0, 9, 0); env.add(top);
  scene.environment = pmrem.fromScene(env, .04).texture;
}
new HDRLoader().load('art/qwantani_dusk_1_1k.hdr', tex => {
  tex.mapping = T.EquirectangularReflectionMapping;
  scene.environment = pmrem.fromEquirectangular(tex).texture;
  scene.environmentIntensity = .55;
  tex.dispose(); pmrem.dispose();
}, undefined, () => proceduralEnv());
const hemi = new T.HemisphereLight(0x8fa3b0, 0x1e2a16, 1.0); scene.add(hemi); // V8: brighter morning sky fill // cool dusk sky, dark ground
const sun = new T.DirectionalLight(0xffb36a, 2.2); // low warm dusk sun
sun.position.set(-20, 27, -8);
sun.castShadow=true;
sun.shadow.mapSize.set(4096,4096); // v5: sharper shadows (quality setting can lower this)
Object.assign(sun.shadow.camera,{left:-13,right:13,top:16,bottom:-16,near:1,far:55});
sun.shadow.bias=-.0004;
sun.shadow.normalBias=.035;
scene.add(sun,sun.target);
const rim=new T.DirectionalLight(0x66e0ff,1.8); // v5: strong cool cyan rim — separates the hero from the background
const bounce=new T.DirectionalLight(0xffe6b8,0.35); // soft warm bounce from ahead, no shadow
bounce.position.set(0,3,10);
scene.add(bounce);
rim.position.set(8,5,7);
scene.add(rim);
const accentLight = new T.PointLight(0x22d3ee, 14, 34, 1.6); // v5: cyan accent glow down the corridor
accentLight.position.set(-4, 3, -10);
scene.add(accentLight);
const muzzleLight = new T.PointLight(0xffc46a, 0, 14, 1.8); // v5: muzzle flash light, spikes on fire
scene.add(muzzleLight);

const box = new T.BoxGeometry();
const orb = new T.IcosahedronGeometry(1, 3); // smooth: detail 1 -> 3
const pole = new T.CylinderGeometry(.84, 1, 1, 32); // smooth: 12 -> 32 sides
const vector = (x, y, z) => new T.Vector3(x, y, z);
const material = color => new T.MeshStandardMaterial({ color, roughness: .55 }); // smooth shading: flatShading removed
const colors = {
  wood: material(0x8a5f3a), lightWood: material(0xc09a62), bark: material(0x6b4a30),
  vine: material(0x6b8a4a), leaves: material(0x2f6b3f), lightLeaves: material(0x6faf5a),
  moss: material(0x8ab85e), leather: material(0x5d4034), cape: material(0xc65a38),
  cream: material(0xf2d3a0),
  camo: material(0x5a6b3a), camoDark: material(0x3d4a26), olive: material(0x6b7a3f),
  helmet: material(0x4a5a30), vest: material(0x2e3320), gunmetal: material(0x3a4048),
  gold: new T.MeshBasicMaterial({color:0xffcc63}),
  danger: new T.MeshBasicMaterial({color:0xff623e})
};
function shape(parent, geometry, mat, x, y, z, sx, sy, sz) {
  const object = new T.Mesh(geometry, mat);
  object.position.set(x, y, z);
  object.scale.set(sx, sy, sz);
  object.receiveShadow=true;
  parent.add(object);
  return object;
}
function beam(parent, a, b, radius, mat) {
  const center = a.clone().lerp(b, .5);
  const object = shape(parent, pole, mat, ...center, radius, a.distanceTo(b), radius);
  object.quaternion.setFromUnitVectors(vector(0, 1, 0), b.clone().sub(a).normalize());
  return object;
}
const finish = 950;
function extendCourse(pattern) {
  const result=[];
  for(let section=0;section<finish;section+=380){
    for(const [d,type,x,...rest] of pattern){
      if(section+d<finish-5) result.push([section+d,type,section%760 ? -x : x,...rest]);
    }
  }
  return result;
}

const center = d => Math.sin(d * .036) * 3.4 + Math.sin(d * .078) * .7;
// Phase 1 movement tuning (Redesign v2 §3, bracketed starting values).
const RUN_SPEED = 6, STRAFE_SPEED = 4, CORRIDOR_HALF = 5.5;
const GRAVITY = 20, JUMP_VELOCITY = 7.5; // apex ~1.4 m, air time ~0.75 s
const ROLL_COOLDOWN = 1.2, ROLL_TIME = 0.4, ROLL_SPEED = 7.5, ROLL_INVULN = 0.4;
// V7: difficulty modes. Hard is exactly the V6 tuning. Every number the
// difficulty touches lives here so Codex/balance passes only edit this table.
const DIFFICULTIES = {
  easy: {
    label: 'Easy', blurb: 'Learn the jungle. Health returns only through green drops.',
    hazardScale: .35, shotDamage: 4, leakDamage: 3, collisionDamage: 6,
    warmupDistance: 55, tutorialDistance: 25, logPromptDistance: 4, healRevealDistance: 25, breatherDistance: 150, finalWaveExtra: 1,
    healAmount: 20, freeDrops: 3, freeDropFractions: [.25,.5,.75], healCollectRadius: 1.6, earnedDropsMax: 4, earnedDropFade: 12, jumpPrompts: Infinity, aimLineLead: Infinity, warningRing: true, warningSound: true, edgePointers: true,      // projectile, collision and hazard damage
             // enemy slips past you
    turretsPass: false,    // walking past a fixed emplacement costs nothing
    waveInterval: 40, initialWaveDelay: 18,      // seconds between recurring waves
    waveMoths: 1,          // drones per recurring wave (beetle always added)
    waveShooters: 1,       // how many of those drones fire (V11: was 1, so almost nothing fired on Easy)
    waveDistance: 50,      // V13: waves enter at least 45 m ahead (rifle range is 70)
    maxNearby: 4,          // no new wave while this many enemies are ahead
    turretRate: .45, mothRate: .25, boltSpeed: 9,
    encounterShooters: .34, firstShot: .7, // V11: some fixed drones fire too; first shot comes sooner
    aimAssist: .12, startCharges: 3, encounterKeep: .15,
    featureKeep: .5, pitKeep: .5, beeHoverTime: 12 // V14: L2-L5 keep half their new enemies and loose pits on Easy
  },
  medium: {
    label: 'Medium', blurb: 'Aim carefully. Health returns only through green drops.',
    hazardScale: .55, shotDamage: 7, leakDamage: 6, collisionDamage: 12,
    warmupDistance: 55, tutorialDistance: 25, logPromptDistance: 4, healRevealDistance: 25, breatherDistance: 150, finalWaveExtra: 1,
    healAmount: 20, freeDrops: 2, freeDropFractions: [.4,.75], healCollectRadius: 1.6, earnedDropsMax: 3, earnedDropFade: 8, jumpPrompts: 3, aimLineLead: .6, warningRing: true, warningSound: true, edgePointers: true, turretsPass: false,
    waveInterval: 10, initialWaveDelay: 0, waveMoths: 3, waveShooters: 2, waveDistance: 48, maxNearby: 5,
    turretRate: .7, mothRate: .38, boltSpeed: 10.5,
    encounterShooters: .34, firstShot: .4,
    aimAssist: .08, startCharges: 2, encounterKeep: .8,
    featureKeep: 1, pitKeep: 1, beeHoverTime: 16
  },
  hard: {
    label: 'Hard', blurb: 'Relentless pressure. Aim, dodge, and protect your health.',
    hazardScale: 1, shotDamage: 10, leakDamage: 10, collisionDamage: 20,
    warmupDistance: 55, tutorialDistance: 25, logPromptDistance: 4, healRevealDistance: 25, breatherDistance: 150, finalWaveExtra: 1,
    healAmount: 20, freeDrops: 1, freeDropFractions: [.55], healCollectRadius: 1.6, earnedDropsMax: 3, earnedDropFade: 6, jumpPrompts: 0, aimLineLead: 0, warningRing: true, warningSound: true, edgePointers: true, turretsPass: true,
    waveInterval: 6.25, initialWaveDelay: 0, waveMoths: 3, waveShooters: 3, waveDistance: 45, maxNearby: 7,
    turretRate: .7, mothRate: .34, boltSpeed: 12,
    encounterShooters: 0, firstShot: 0, // Hard stays exactly V6
    aimAssist: .06, startCharges: 1, encounterKeep: 1,
    featureKeep: 1, pitKeep: 1, beeHoverTime: 20
  }
};
let difficultyKey = 'medium';
let DIFF = DIFFICULTIES[difficultyKey];

let seed = 711;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
function localRandom(seedValue) {
  // Own seeded RNG for textures, so texture work does not shift the
  // global random() sequence used for scenery layout.
  let a = seedValue >>> 0;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}
function barkTexture() {
  const canvas=document.createElement('canvas');
  canvas.width=1024;
  canvas.height=1024;
  const context=canvas.getContext('2d');
  const rnd=localRandom(711);
  context.fillStyle='#b08a5e';
  context.fillRect(0,0,1024,1024);
  // Soft warm undertones, then bark strokes.
  for(let i=0;i<260;i++) {
    context.fillStyle=rnd()<.5?'#c49a6b22':'#7a523022';
    context.beginPath();
    context.ellipse(rnd()*1024,rnd()*1024,40+rnd()*120,20+rnd()*60,rnd()*Math.PI,0,Math.PI*2);
    context.fill();
  }
  for(let i=0;i<3800;i++) {
    const x=rnd()*1024, y=rnd()*1024, length=40+rnd()*700;
    context.strokeStyle=rnd()<.48?'#4a301a55':'#e8c99a66';
    context.lineWidth=.8+rnd()*3.5;
    context.beginPath();
    context.moveTo(x,y);
    context.bezierCurveTo(x-14,y+length*.2,x+12,y+length*.75,x,y+length);
    context.stroke();
  }
  for(let i=0;i<46;i++){ // v2: dark cracks
    let x=rnd()*1024, y=rnd()*1024;
    context.strokeStyle='#2e1c0e88'; context.lineWidth=1+rnd()*2.5;
    context.beginPath(); context.moveTo(x,y);
    for(let k=0;k<6;k++){ y+=30+rnd()*60; x+=(rnd()-.5)*36; context.lineTo(x,y); }
    context.stroke();
  }
  for(let i=0;i<26;i++){ // v2: knots, concentric rings
    const x=rnd()*1024, y=rnd()*1024;
    for(let r=16;r>0;r-=4){ context.strokeStyle='#4a301a66'; context.lineWidth=2;
      context.beginPath(); context.ellipse(x,y,r*1.4,r,0,0,Math.PI*2); context.stroke(); }
  }
  const texture=new T.CanvasTexture(canvas);
  texture.colorSpace=T.SRGBColorSpace;
  texture.anisotropy=4;
  return texture;
}
function groundTexture() {
  // Procedural jungle floor: soft grass green with dirt patches and
  // speckles, 1024px, tiled. No flat colour plane any more.
  const canvas=document.createElement('canvas');
  canvas.width=1024;
  canvas.height=1024;
  const context=canvas.getContext('2d');
  const rnd=localRandom(2024);
  context.fillStyle='#3f7040';
  context.fillRect(0,0,1024,1024);
  for(let i=0;i<320;i++) {
    context.fillStyle=rnd()<.5?'#4d84482e':'#35603a2e';
    context.beginPath();
    context.ellipse(rnd()*1024,rnd()*1024,50+rnd()*160,30+rnd()*90,rnd()*Math.PI,0,Math.PI*2);
    context.fill();
  }
  for(let i=0;i<90;i++) { // warm dirt patches
    context.fillStyle='#7a5a3826';
    context.beginPath();
    context.ellipse(rnd()*1024,rnd()*1024,30+rnd()*110,20+rnd()*70,rnd()*Math.PI,0,Math.PI*2);
    context.fill();
  }
  for(let i=0;i<9000;i++) { // grass / leaf speckle
    context.fillStyle=rnd()<.5?'#6faf5a55':'#2c523355';
    context.fillRect(rnd()*1024,rnd()*1024,2+rnd()*4,2+rnd()*4);
  }
  for(let i=0;i<2600;i++){ // v2: grass blades
    const x=rnd()*1024, y=rnd()*1024;
    context.strokeStyle=rnd()<.5?'#7fc46a99':'#3a6b3a99'; context.lineWidth=1.4;
    context.beginPath(); context.moveTo(x,y); context.lineTo(x+(rnd()-.5)*8,y-6-rnd()*10); context.stroke();
  }
  for(let i=0;i<420;i++){ // v2: fallen leaf litter, warm orange/brown
    context.fillStyle=['#c98a3e55','#a86a2e55','#d9a85a44','#8a5a2e44'][i%4];
    context.beginPath(); context.ellipse(rnd()*1024,rnd()*1024,4+rnd()*9,2+rnd()*5,rnd()*Math.PI,0,Math.PI*2); context.fill();
  }
  for(let i=0;i<130;i++){ // v2: small stones with a light top edge
    const x=rnd()*1024, y=rnd()*1024, r=3+rnd()*7;
    context.fillStyle='#8a8f8a88'; context.beginPath(); context.arc(x,y,r,0,Math.PI*2); context.fill();
    context.fillStyle='#c9cfc9aa'; context.beginPath(); context.arc(x-r*.25,y-r*.3,r*.45,0,Math.PI*2); context.fill();
  }
  const texture=new T.CanvasTexture(canvas);
  texture.colorSpace=T.SRGBColorSpace;
  texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.repeat.set(24,32);
  texture.anisotropy=8;
  return texture;
}
function mothWingTexture(){ // v2: gold wing with spots and eye-spots
  const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=512;
  const context=canvas.getContext('2d'); const rnd=localRandom(99);
  context.fillStyle='#ffc35d'; context.fillRect(0,0,512,512);
  for(let i=0;i<40;i++){ context.fillStyle=rnd()<.5?'#e0a04066':'#ffe08a66';
    context.beginPath(); context.ellipse(rnd()*512,rnd()*512,20+rnd()*60,12+rnd()*40,rnd()*Math.PI,0,Math.PI*2); context.fill(); }
  for(const [x,y,r] of [[130,150,34],[380,140,30],[150,360,28],[370,370,36]]){
    context.fillStyle='#8a5a1e'; context.beginPath(); context.arc(x,y,r,0,Math.PI*2); context.fill();
    context.fillStyle='#ffe08a'; context.beginPath(); context.arc(x,y,r*.55,0,Math.PI*2); context.fill();
    context.fillStyle='#2e1c0e'; context.beginPath(); context.arc(x,y,r*.25,0,Math.PI*2); context.fill(); }
  const t=new T.CanvasTexture(canvas); t.colorSpace=T.SRGBColorSpace; return t;
}
// v5: glow sprites (fake bloom — no post-processing library in vendor/;
// UnrealBloomPass is not shipped, so emissive + additive sprites do the glow).
function makeGlowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.35,'rgba(255,255,255,.55)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0,0,128,128);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
const glowTex = makeGlowTexture();
function addGlow(parent, x, y, z, color, scale, opacity=.8) {
  const sp = new T.Sprite(new T.SpriteMaterial({map:glowTex, color, transparent:true, opacity, blending:T.AdditiveBlending, depthWrite:false}));
  sp.position.set(x, y, z); sp.scale.setScalar(scale); parent.add(sp); return sp;
}
// V8: concept-art sprites (art/sprites/, cut from the Codex PNGs). Each is a
// camera-facing billboard. Gameplay hitboxes stay as invisible meshes, so
// aiming, cover and balance are unchanged from V7.
const spriteLoader = new T.TextureLoader();
let envTracking = true, envCourse = false; const envSprites = []; // V14: scenery sprites, tinted per lighting preset
const spriteTextures = {};
function spriteTexture(name) {
  if (!spriteTextures[name]) {
    const t = spriteLoader.load(name.includes('/') ? 'art/' + name + '.png' : 'art/sprites/' + name + '.png'); // V14: 'jungle-biome/x' paths
    t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
    spriteTextures[name] = t;
  }
  return spriteTextures[name];
}
const SPRITE_ASPECT = {"drone_rotor":1.6203,"crawler_armored":1.9296,"turret_flower":0.9935,"enemy_hive_bee":1.6769,"enemy_lantern_drone":1.1212,"enemy_leaf_buggy":1.4741,"enemy_vine_serpent":1.5515,"enemy_mech_raptor":1.4328,"enemy_manta":2.5859,"enemy_stone_tortoise":1.0226,"enemy_eye_wisp":0.8542,"boss_beetle_tank":1.2152,"drone_front":1.701,"crawler_front":1.5315,"turret_front":0.907,"drone_angle":1.557,"crawler_angle":1.561,"turret_angle":1.0236,"prop_log":2.5983,"prop_thorn":1.835,"prop_fern":1.8624,"prop_rocks":2.527,"prop_pit":2.5296,"soldier_front":0.4427,"soldier_back":0.4245,"soldier_side":0.2357,"icon_multishot":1.024,"icon_fire_rain":0.9961,"icon_orb_blaster":1.0119,"icon_light_cannon":1.0802,"icon_prism":0.9258,"icon_heart":1.1584,"icon_gem_shield":0.9688,"icon_gem_shield_plus":1.9394,"weapon_rifle":1.4798,"weapon_dual":1.1963,"weapon_launcher":1.2075,"weapon_triple":1.7778,"weapon_lance":1.9248,"weapon_orb":1.1963,"icon_grenade":0.8828,"icon_charge_cell":0.8086,"icon_dual":1.1636,"icon_auto":0.9727,"icon_click":0.9883,"icon_reload":0.8984,"icon_shield":1.0,"icon_charge":1.0039,"icon_power1":1.0039,"icon_power2":0.7305,"icon_power3":0.7969,"icon_coin":0.9609,"icon_magnet":1.148,"icon_health":0.9258,"tree_kapok":1.0446,"tree_fig":0.8134,"tree_palm":0.6334,"tree_hardwood":0.9406,"canopy_vines":2.0237,"log_cross":3.9844,"cover_stump":1.0145,"cover_boulder":1.0883,"cover_stone":1.0907,"plant_monstera":1.1222,"plant_paradise":1.0924,"plant_bromeliad":1.2937,"plant_grass":1.0098,"plant_mushroom_blue":0.9929,"plant_mushroom_orange":1.1078,"plant_broadleaf":1.2366,"plant_flowerbush":1.1174,"ruin_arch":1.2816,"ruin_tower":0.6387,"pit_rim":1.0044,"vfx_muzzle":1.0,"vfx_spark":1.0,"vfx_explosion_small":1.0,"vfx_explosion_big":1.0,"vfx_bolt":1.0,"vfx_heal":1.0,"vfx_coin":1.0,"vfx_shield":1.0,
  // V14: Forest campaign art
  "jungle-biome/enemy_leaf_buggy_front":1.0908,"jungle-biome/prop_temple_lantern":.4345,"jungle-biome/vfx_spore_cloud_green":2.5382,
  "jungle-biome/brood_pod_sealed":.872,"jungle-biome/brood_pod_hatching":.872,"jungle-biome/bg_temple_clearing_dusk":3.1787,
  "boss_beetle_tank_siege":.875,"boss_beetle_tank_brood":.875,"boss_beetle_tank_rampage":.875,"boss_beetle_tank_critical":.875};
// Unlit sprites read too bright against the dusk scene, so tint them down.
function makeSprite(name, width, {tint=0xc9c9c9, own=false, bottom=null, height=null}={}) {
  const material = new T.SpriteMaterial({map: spriteTexture(name), color: tint, transparent: true, alphaTest: .12, depthWrite: true});
  const sp = new T.Sprite(material);
  const aspect = SPRITE_ASPECT[name] || 1;
  sp.scale.set(width, height ?? width / aspect, 1);
  if (bottom !== null) sp.center.set(.5, 0); // anchor the sprite's bottom edge
  sp.userData.own = own;
  if (envTracking && !own) envSprites.push({sp, base: new T.Color(tint), course: envCourse}); // V14: scenery dims with the level's lighting
  return sp;
}
// V9: additive effect sprites (black background art from vfx.png).
function makeFx(name, size) {
  const sp = new T.Sprite(new T.SpriteMaterial({map: spriteTexture(name), transparent: true, depthWrite: false, blending: T.AdditiveBlending}));
  sp.scale.setScalar(size);
  return sp;
}
function spawnFx(name, at, size, life) {
  const mesh = makeFx(name, size);
  mesh.position.copy(at);
  scene.add(mesh);
  effects.push({mesh, life, max: life, size, fx: true});
  return mesh;
}
const pick = list => list[Math.floor(random() * list.length)];
// Invisible but still raycastable: keeps the original hit/cover volumes.
const ghostMaterial = new T.MeshBasicMaterial({colorWrite: false, depthWrite: false});
function ghostify(object, keep = []) {
  object.traverse(o => { if (o.isMesh && !keep.includes(o)) { o.material = ghostMaterial; o.castShadow = false; } });
}
// v5: skyline windows — one canvas texture on tall dark boxes reads as a
// living skyline/canopy layer at a glance, cheaply.
function skylineTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const x = c.getContext('2d'); const rnd = localRandom(77);
  x.fillStyle = '#0b1626'; x.fillRect(0,0,256,512);
  for (let i=0;i<260;i++) {
    x.fillStyle = rnd()<.6 ? '#ffb36a' : '#66e0ff';
    x.globalAlpha = .35 + rnd()*.65;
    x.fillRect(6+rnd()*240, 8+rnd()*496, 3+rnd()*7, 2+rnd()*5);
  }
  x.globalAlpha = 1;
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
const skylineTex = skylineTexture();
const skylineMat = new T.MeshStandardMaterial({map:skylineTex, emissive:0xffffff, emissiveMap:skylineTex, emissiveIntensity:.55, roughness:.8, metalness:.2});
const glowGold=new T.MeshStandardMaterial({color:0xffcc63,emissive:0xcc8a1a,emissiveIntensity:.65,roughness:.3,metalness:.4}); // v2: glowing coins/pickups
colors.bark.map=barkTexture();
colors.wood.map=colors.bark.map;
for(const surface of [colors.wood,colors.bark]){
  surface.bumpMap=surface.map;
  surface.bumpScale=.13;
  surface.roughness=.93;
}
const crownGeometry=new T.IcosahedronGeometry(1,3); // smooth crowns
const smoothOrb=new T.SphereGeometry(1,48,32); // smooth: 24x16 -> 48x32
const satin=color=>new T.MeshStandardMaterial({color,roughness:.38}); // softer, satin finish
const scenery = new T.Group();
scene.add(scenery);
const leafGeometry=new T.BufferGeometry();
leafGeometry.setAttribute('position',new T.Float32BufferAttribute([
  0,0,0, -.23,.04,-.37, 0,.14,-.46,
  0,0,0, 0,.14,-.46, .23,.04,-.37,
  -.23,.04,-.37, 0,0,-1, 0,.14,-.46,
  0,.14,-.46, 0,0,-1, .23,.04,-.37
],3));
leafGeometry.computeVertexNormals();
const foliageMaterials=[0x3d7040,0x5a8f4a,0x7aa854,0x9dbb6a] // softened, brighter greens
  .map(color=>new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.74}));
// v2 detail materials (all rounded, instanced with the rest of the scenery)
const flowerMats=[0xff7a9e,0xffb84d,0xff8a5c,0xe88aff].map(c=>new T.MeshStandardMaterial({color:c,roughness:.45,emissive:c,emissiveIntensity:.12}));
const mushroomCap=new T.MeshStandardMaterial({color:0xd94f3d,roughness:.5});
const mushroomStem=new T.MeshStandardMaterial({color:0xf2e3c2,roughness:.6});
const rockMat=new T.MeshStandardMaterial({color:0x8a8f88,roughness:.95});
const bushMat=new T.MeshStandardMaterial({color:0x4a7a3a,roughness:.8});
const mossMat=new T.MeshStandardMaterial({color:0x7aa854,roughness:.9});
function plant(x,y,z,scale,count) {
  const phase=random()*Math.PI*2;
  for(let i=0;i<count;i++){
    const leaf=shape(scenery,leafGeometry,foliageMaterials[i%4],x,y,z,scale,scale,scale*(.65+random()*.62));
    leaf.rotation.set(.18+random()*.43,phase+i*2.4,0);
  }
}
// V9: concept-art scenery. Everything here is a billboard sprite.
// Near tree line, just outside the corridor.
const TREES = ['tree_kapok','tree_fig','tree_hardwood','tree_palm'];
for (let d = -10, i = 0; d <= finish + 40; d += 9, i++) {
  for (const side of [-1, 1]) {
    const name = TREES[(i * 2 + (side > 0 ? 1 : 0) + Math.floor(random() * 2)) % 4];
    const h = 10 + random() * 4;
    const tree = makeSprite(name, h * SPRITE_ASPECT[name], {bottom: true, tint: 0xbfc4b8});
    tree.position.set(center(d) + side * (9.6 + random() * 1.6), -.1, -d + random() * 3);
    scene.add(tree);
  }
}
// Second, darker row for depth.
for (let d = -6; d <= finish + 60; d += 12) {
  for (const side of [-1, 1]) {
    const name = pick(TREES), h = 13 + random() * 6;
    const tree = makeSprite(name, h * SPRITE_ASPECT[name], {bottom: true, tint: 0x8f9a8c});
    tree.position.set(center(d) + side * (16 + random() * 9), -.1, -d + random() * 5);
    scene.add(tree);
  }
}
// Distant temple towers replace the old skyline boxes.
for (let i = 0; i < 16; i++) {
  const d = 40 + i * 100 + random() * 40, side = i % 2 ? 1 : -1, h = 18 + random() * 12;
  const tower = makeSprite('ruin_tower', h * SPRITE_ASPECT.ruin_tower, {bottom: true, tint: 0x8a9488});
  tower.position.set(center(d) + side * (32 + random() * 14), -.5, -d);
  scene.add(tower);
}
// Temple archways over the path every 60 m, with lantern glow.
const archPillars = [];
for (let d = 60; d < finish; d += 60) {
  const w = 20, arch = makeSprite('ruin_arch', w, {bottom: true, tint: 0xd0d0c8}); // V11: wider so the opening fits the path
  arch.position.set(center(d), -.05, -d);
  scene.add(arch);
  for (const side of [-1, 1]) {
    addGlow(scene, center(d) + side * w * .31, w / SPRITE_ASPECT.ruin_arch * .54, -d + .1, 0xffb36a, 1.6, .45);
    archPillars.push({d, x: side * (w * .2 + 1.6), hw: 1.6, hd: .6, h: 99}); // V11: pillars are solid
  }
}
// Hanging vine canopies between the arches.
for (let d = 30; d < finish; d += 60) {
  const canopy = makeSprite('canopy_vines', 15, {tint: 0xbcc6b4});
  canopy.position.set(center(d), 9.2, -d);
  scene.add(canopy);
}
// V8: concept-art ferns and rock piles along the corridor edges.
for (let d = 3; d < finish + 30; d += 3.5) {
  for (const side of [-1, 1]) {
    const r = random();
    const x = center(d) + side * (6.4 + random() * 2.4); // V11: kept outside the walkable strip
    const PLANTS = ['plant_monstera','plant_paradise','plant_bromeliad','plant_grass','plant_broadleaf','plant_flowerbush','plant_mushroom_blue','plant_mushroom_orange'];
    const sp = r < .45 ? makeSprite('prop_fern', 1.8 + random() * 1.4, {bottom:true, tint:0xb8c2b0})
             : r < .88 ? makeSprite(pick(PLANTS), 1.1 + random() * 1.1, {bottom:true, tint:0xc4c8bc})
                       : makeSprite('prop_rocks', 1.6 + random() * 1.2, {bottom:true, tint:0xb0b0b0});
    sp.position.set(x, -.05, -d + random() * 1.5);
    scene.add(sp);
  }
}
envTracking = false; // V14: shared scenery is registered; course sprites register in buildCourse
// Jungle floor at y = 0 (was y = -9 in the canopy build).
// v5: real PBR ground — Poly Haven CC0 "Forest Floor" (1k): diffuse +
// roughness + normal maps. The procedural canvas is the base; the real maps
// swap in on load so a failed download never leaves a blank floor.
// V9: ground blends the dirt path (corridor) into forest floor (sides), in world space.
const groundTex = name => { const t = spriteLoader.load('art/sprites/' + name + '.jpg'); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; return t; };
const floorMat = new T.MeshStandardMaterial({roughness:.95,metalness:0,envMapIntensity:.6});
floorMat.onBeforeCompile = shader => {
  shader.uniforms.pathMap = {value: groundTex('ground_path')};
  shader.uniforms.forestMap = {value: groundTex('ground_forest')};
  shader.vertexShader = 'varying vec3 vWorldPos;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  shader.fragmentShader = 'uniform sampler2D pathMap; uniform sampler2D forestMap; varying vec3 vWorldPos;\n' + shader.fragmentShader.replace('#include <map_fragment>', `
    float cx = sin(-vWorldPos.z * 0.036) * 3.4 + sin(-vWorldPos.z * 0.078) * 0.7;
    vec2 uvw = vWorldPos.xz / 6.0;
    float wobble = (texture2D(forestMap, uvw * 0.11).g - 0.4) * 2.2;
    float k = smoothstep(4.0, 6.6, abs(vWorldPos.x - cx) + wobble);
    diffuseColor *= mix(texture2D(pathMap, uvw), texture2D(forestMap, uvw * 0.85), k);`);
};
floorMat.customProgramCacheKey = () => 'jungle-floor-v9';
const floorLoader = new T.TextureLoader();
if(false) floorLoader.load('art/forest_floor_diff_1k.jpg', t => {
  t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(24,32); t.anisotropy = 8;
  floorMat.map = t; floorMat.needsUpdate = true;
});
if(false) floorLoader.load('art/forest_floor_rough_1k.jpg', t => {
  t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(24,32);
  floorMat.roughnessMap = t; floorMat.needsUpdate = true;
});
if(false) floorLoader.load('art/forest_floor_nor_gl_1k.jpg', t => {
  t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(24,32);
  floorMat.normalMap = t; floorMat.normalScale.set(.6,.6); floorMat.needsUpdate = true;
});
const forestFloor = new T.Mesh(new T.PlaneGeometry(600,finish+440), floorMat);
forestFloor.rotation.x=-Math.PI/2;
forestFloor.position.set(0,0,-finish/2);
forestFloor.receiveShadow=true;
scene.add(forestFloor);
// V13: finish gate and checkered line (art/sprites/finish_gate.png, finish_line_checker.png).
// The gate is a fixed panel across the path (not a billboard), 14 m wide, opening ~10 m, lanterns glow through the fog.
const GATE_W=14, GATE_H=14/2.417;
const finishYaw=-Math.atan((center(finish+1)-center(finish-1))/2);
const gateMat=new T.MeshBasicMaterial({map:spriteTexture('finish_gate'),color:0xcfc8bc,transparent:true,alphaTest:.25,fog:false,opacity:0});
const finishGate=new T.Mesh(new T.PlaneGeometry(GATE_W,GATE_H),gateMat);
finishGate.position.set(center(finish),GATE_H/2-.05,-finish);finishGate.rotation.y=finishYaw;scene.add(finishGate);
const gateBack=new T.Mesh(finishGate.geometry,gateMat);gateBack.rotation.y=Math.PI;gateBack.position.z=-.02;finishGate.add(gateBack); // back face, so FINISH reads correctly from beyond the gate
const checkerMat=new T.MeshStandardMaterial({map:spriteTexture('finish_line_checker'),transparent:true,alphaTest:.2,roughness:1,polygonOffset:true,polygonOffsetFactor:-2});
const finishLine=new T.Mesh(new T.PlaneGeometry(12,12/6.8947),checkerMat);
finishLine.rotation.set(-Math.PI/2,0,finishYaw);finishLine.position.set(center(finish),.03,-finish);scene.add(finishLine);
const gateLanterns=[-1,1].map(side=>{
  const g=addGlow(scene,0,0,0,0xffb347,2.6,.85);g.material.fog=false;
  const local=vector(side*GATE_W*(.5-.085),GATE_H*(1-320/809)-GATE_H/2,.05).applyAxisAngle(vector(0,1,0),finishYaw);
  g.position.copy(finishGate.position).add(local);return g;});
const gatePosts=[-1,1].map(side=>({d:finish,x:side*5.75,hw:.7,hd:.4,h:6})); // posts are solid (added to solids below)

// ---- v2: light shafts + floating pollen/fireflies (cheap: 12 planes + 1 Points draw) ----
const shaftMat=new T.MeshBasicMaterial({color:0xffe9b0,transparent:true,opacity:.055,side:T.DoubleSide,depthWrite:false});
const shafts=new T.Group(); scene.add(shafts);
for(let i=0;i<12;i++){
  const d=20+i*32, shaft=new T.Mesh(new T.PlaneGeometry(2.2,14),shaftMat);
  shaft.position.set(center(d),5,-d); shaft.rotation.set(.35,.5,0); shafts.add(shaft);
}
const pollenGeo=new T.BufferGeometry();
{ const pts=[]; const rnd=localRandom(4242);
  for(let i=0;i<160;i++) pts.push((rnd()-.5)*24, .5+rnd()*7, -(rnd()*finish));
  pollenGeo.setAttribute('position',new T.Float32BufferAttribute(pts,3)); }
const pollen=new T.Points(pollenGeo,new T.PointsMaterial({color:0xffe08a,size:.14,transparent:true,opacity:.75,depthWrite:false}));
scene.add(pollen);

// ---- Actor (kept from the original) ----
const actor = new T.Group();
scene.add(actor);
// v4: soldier — camouflage uniform, helmet, vest, backpack, assault rifle.
// No hood, cape, quiver or crossbow any more.
const cloth=new T.MeshStandardMaterial({color:0x5a6b3a,roughness:.75}); // camo uniform
const darkMetal=new T.MeshStandardMaterial({color:0x343642,roughness:.37,metalness:.59});
const brass=new T.MeshStandardMaterial({color:0xbb8944,roughness:.33,metalness:.57});
const wraps=satin(0x3d4a26);
const trim=satin(0x555d69);
shape(actor,smoothOrb,cloth,0,1.02,0,.27,.43,.18); // torso
shape(actor,smoothOrb,colors.cream,0,1.50,0,.07,.09,.07); // v6: neck — bridges torso (top ~1.45) to head (~1.56)
shape(actor,smoothOrb,colors.vest,0,1.15,-.10,.24,.3,.12); // v6: tactical vest — FRONT chest (-z), was +.10 on the back with the backpack
shape(actor,smoothOrb,colors.helmet,0,1.78,0,.24,.18,.24); // helmet
shape(actor,smoothOrb,colors.cream,0,1.66,-.12,.16,.12,.08); // face — front (-z), tucked under the helmet, not floating forward
shape(actor,smoothOrb,colors.vest,0,1.15,.28,.22,.3,.12); // backpack
shape(actor,smoothOrb,wraps,0,.83,0,.24,.05,.18);
// v6: arms are built below as articulated arm groups (upper arm / elbow /
// forearm / hand). The old shoulder blobs and the boots at hip height are gone.
const legs=[-1,1].map(side=>{
  const leg=new T.Group();
  leg.position.set(side*.14,.78,0);
  actor.add(leg);
  beam(leg,vector(0,0,0),vector(0,-.37,-.025),.105,cloth);
  beam(leg,vector(0,-.30,-.02),vector(0,-.67,.02),.08,wraps);
  shape(leg,smoothOrb,cloth,0,-.70,-.07,.088,.08,.16); // foot (cloth, under the boot)
  shape(leg,smoothOrb,darkMetal,0,-.72,-.03,.11,.07,.20); // v6: boot — in the LEG group, world y ~.06 at the foot, toe forward (-z). Was a dark box on the actor at y=.81 (hip height).
  shape(leg,smoothOrb,colors.vest,0,-.36,-.10,.11,.08,.05); // v6: knee pad — in the LEG group at leg-local y -.36 (knee, world ~.42), front (-z). Was static on the actor at y=.55 while the legs swung through it.
  for(let i=0;i<3;i++) shape(leg,box,trim,0,-.42-i*.066,-.048,.133,.022,.041); // shin trim, front (-z)
  return leg;
});
// v4: assault rifle, held forward (-z). Muzzle is at local (0, 0, -.62).
const rifle = new T.Group();
rifle.position.set(.28,1.25,-.3);
actor.add(rifle);
shape(rifle,smoothOrb,colors.gunmetal,0,0,0,.07,.09,.45); // receiver
shape(rifle,smoothOrb,colors.gunmetal,0,0,-.28,.05,.05,.06); // handguard
beam(rifle,vector(0,0,-.35),vector(0,0,-.62),.035,colors.gunmetal); // barrel
shape(rifle,smoothOrb,darkMetal,0,-.12,.05,.05,.14,.08); // magazine
shape(rifle,smoothOrb,colors.wood,0,0,.28,.06,.08,.15); // stock
shape(rifle,smoothOrb,brass,0,.1,-.05,.03,.05,.08); // sight
// v6: articulated arms. Shoulder pivots at (+/-.27, 1.38, 0); upper arm down-forward,
// elbow, forearm to the rifle, hand on the rifle. Rifle is held across the chest,
// pointing forward (-z): right hand (+x side) on the grip at (.28, 1.25, -.30),
// left hand (-x side) reaches across to the handguard at (.28, 1.25, -.55).
// Arms are parented to the actor (they do not swing with the legs), in their own
// arm groups per side, so nothing floats free of the shoulder.
const arms = [-1, 1].map(side => {
  const arm = new T.Group();
  arm.position.set(side * .27, 1.38, 0); // shoulder pivot
  actor.add(arm);
  const hand = side > 0 ? vector(.01, -.13, -.30) : vector(.55, -.13, -.58); // local target on the rifle
  const elbow = side > 0 ? vector(0, -.24, -.08) : vector(.18, -.20, -.24); // elbow, down-forward (left elbow crosses toward the rifle)
  beam(arm, vector(0, 0, 0), elbow, .062, cloth); // upper arm
  shape(arm, smoothOrb, cloth, elbow.x, elbow.y, elbow.z, .07, .07, .07); // elbow
  beam(arm, elbow, hand, .055, cloth); // forearm
  shape(arm, smoothOrb, colors.cream, hand.x, hand.y, hand.z, .06, .06, .07); // hand on the rifle
  shape(arm, smoothOrb, brass, 0, -.12, -.03, .03, .03, .02); // v6: brass cuff trim on the upper arm (moved from the old shoulder blob)
  return arm;
});
// v5: definition — edge trim, straps, buckles, scope, vents. Small telling
// details so the soldier reads as built, not as smooth blobs.
shape(actor,smoothOrb,brass,0,1.02,-.19,.2,.03,.02); // v6: belt buckle strip — FRONT (-z), was +.19 on the back
for(const side of [-1,1]){
  shape(actor,smoothOrb,colors.vest,side*.16,1.32,-.12,.05,.16,.03); // v6: shoulder straps — FRONT (-z), over the vest
  shape(actor,smoothOrb,brass,side*.16,1.32,-.15,.03,.03,.02); // v6: strap buckles — FRONT (-z)
  beam(actor,vector(side*.24,1.86,0),vector(side*.24,1.94,0),.02,brass); // helmet edge trim
}
shape(rifle,smoothOrb,brass,0,.13,-.62,.04,.04,.04); // barrel tip
shape(rifle,smoothOrb,darkMetal,0,.16,-.05,.05,.04,.1); // scope
for(let i=0;i<3;i++) shape(rifle,box,darkMetal,0,-.05,-.2+i*.09,.06,.02,.03); // handguard vents
shape(rifle,smoothOrb,brass,0,-.06,.14,.03,.03,.03); // trigger guard pin
// v5: cyan rim strip on the helmet — the hero's edge against the dark.
shape(actor,smoothOrb,new T.MeshStandardMaterial({color:0x22d3ee,emissive:0x22d3ee,emissiveIntensity:1.4}),0,1.9,-.14,.2,.03,.03);
const muzzleGlow = addGlow(rifle, 0, 0, -.68, 0xffffff, .9, 0);
muzzleGlow.material.map = spriteTexture('vfx_muzzle'); // V9: painted muzzle flash // v5: muzzle flash sprite, opacity spikes on fire
actor.traverse(part=>{if(part.isMesh) part.castShadow=true;});
// V11: power-up effects shown on the soldier.
const powerFx = new T.Group(); actor.add(powerFx);
const shieldBubble = makeFx('vfx_shield', 2.7); shieldBubble.position.y = 1.0; powerFx.add(shieldBubble);
const autoDrone = makeSprite('icon_auto', .5, {tint: 0xffffff}); powerFx.add(autoDrone);
const heavyGlow = addGlow(rifle, 0, 0, -.35, 0xff3a24, 1.1, 0);
const rapidRing = new T.Mesh(new T.RingGeometry(.55, .72, 40), new T.MeshBasicMaterial({color: 0x6dff8a, transparent: true, opacity: .6, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide}));
rapidRing.rotation.x = -Math.PI / 2; rapidRing.position.y = .04; powerFx.add(rapidRing);
function updatePowerFx(t) {
  const on = mode === 'play' || mode === 'pause';
  shieldBubble.visible = on && shield > 0;
  shieldBubble.material.opacity = .45 + Math.sin(t * 4) * .15;
  autoDrone.visible = on && autoTime > 0;
  autoDrone.position.set(Math.cos(t * 3) * .75, 2.15 + Math.sin(t * 6) * .08, Math.sin(t * 3) * .75);
  heavyGlow.material.opacity = on && heavy > 0 ? .55 + Math.sin(t * 10) * .2 : 0;
  rapidRing.visible = on && rapid > 0;
  rapidRing.rotation.z = t * 2; rapidRing.scale.setScalar(1 + Math.sin(t * 8) * .06);
}
// V10: animated soldier. The procedural soldier above stays as a fallback
// until the model loads (or if it fails); the procedural rifle is kept and
// follows the model's right hand, still pointing at the aim point.
let soldier = null, soldierState = '', soldierShot = null;
const handPos = new T.Vector3();
loadSoldier().then(s => {
  soldier = s;
  s.root.scale.setScalar(1.05);
  actor.add(s.root);
  for (const child of actor.children) if (child !== rifle && child !== s.root && child !== powerFx) child.visible = false; // V11: keep power-up effects
  playSoldier('idle', 0);
}).catch(err => console.warn('Soldier model failed to load; keeping the procedural soldier.', err));
function playSoldier(name, fade = .15, timeScale = 1) {
  if (!soldier) return;
  const next = soldier.actions[name], prev = soldier.actions[soldierState];
  next.reset(); next.setEffectiveTimeScale(timeScale); next.setEffectiveWeight(1); next.play();
  if (prev && prev !== next) { if (fade > 0) prev.crossFadeTo(next, fade, false); else prev.stop(); }
  soldierState = name;
}
function soldierAction(name, timeScale = 1) { // one-shot: hit, grenade
  if (!soldier) return;
  soldierShot = {name, t: soldier.clips[name].duration / timeScale};
  soldierState = '';
  playSoldier(name, .1, timeScale);
}
function resetSoldier() {
  if (!soldier) return;
  soldier.mixer.stopAllAction(); soldierState = ''; soldierShot = null;
  rifle.visible = true;
  playSoldier('idle', 0);
}
function animateSoldier(dt) {
  if (!soldier) return;
  let want = 'idle', ts = 1;
  const strafing = held.has('KeyA') || held.has('KeyD') || held.has('ArrowLeft') || held.has('ArrowRight');
  if (mode === 'end' && health <= 0) want = 'death';
  else if (mode === 'play') {
    if (soldierShot && soldierShot.t > 0 && rollTime <= 0 && grounded) { soldierShot.t -= dt; want = soldierShot.name; }
    else if (rollTime > 0) { soldierShot = null; want = 'roll'; ts = soldier.clips.roll.duration / ROLL_TIME; }
    else if (!grounded && !trappedPit) { soldierShot = null; want = 'jump'; ts = .85; }
    else if (currentSpeed > 1.2) { soldierShot = null; want = 'run'; ts = T.MathUtils.clamp(currentSpeed / 4, .7, 1.5); }
    else if (strafing) want = (held.has('KeyD') || held.has('ArrowRight')) ? 'strafeRight' : 'strafeLeft';
    else if (firing) want = 'fire';
  }
  if (want !== soldierState && !(soldierShot && want === soldierShot.name)) playSoldier(want, want === 'death' ? .1 : .15, ts);
  else if (want === 'run') soldier.actions.run.setEffectiveTimeScale(ts);
  soldier.mixer.update(dt);
  if (mode === 'play') {
    const spine = soldier.bone('Spine2'); // lean the chest with the aim pitch
    if (spine) spine.rotateX(-aimPitch * .45);
  }
  rifle.visible = want !== 'death';
  // Rifle grip follows the right hand; place() keeps it pointed at the aim point.
  soldier.bone('RightHand').getWorldPosition(handPos);
  actor.worldToLocal(handPos);
  rifle.position.set(handPos.x - .02, handPos.y - .03, handPos.z - .1 + recoilTimer * .9);
}
// v5: showcase turntable — Meridian-style. The soldier stands on a dark
// glossy disc with a cyan neon ring, lit by a warm spotlight, so he pops
// against the dark menu background.
const platform = new T.Group();
platform.position.set(0, 0, 0);
scene.add(platform);
const disc = new T.Mesh(new T.CylinderGeometry(2.4, 2.6, .18, 48),
  new T.MeshStandardMaterial({color:0x141c26, roughness:.25, metalness:.8, envMapIntensity:1.4}));
disc.position.y = -.09; disc.receiveShadow = true; platform.add(disc);
const ringCyan = new T.Mesh(new T.TorusGeometry(2.4, .05, 8, 64),
  new T.MeshStandardMaterial({color:0x22d3ee, emissive:0x22d3ee, emissiveIntensity:2.2}));
ringCyan.rotation.x = Math.PI/2; ringCyan.position.y = .02; platform.add(ringCyan);
const ringGold = new T.Mesh(new T.TorusGeometry(1.9, .03, 8, 64),
  new T.MeshStandardMaterial({color:0xffb36a, emissive:0xff8a2a, emissiveIntensity:1.4}));
ringGold.rotation.x = Math.PI/2; ringGold.position.y = .02; platform.add(ringGold);
const showSpot = new T.SpotLight(0xffe0a0, 80, 30, .55, .45, 1.2);
showSpot.position.set(3, 7, 4);
showSpot.target = actor;
scene.add(showSpot);
const showRim = new T.SpotLight(0x22d3ee, 50, 30, .7, .5, 1.2);
showRim.position.set(-4, 4, -5);
showRim.target = actor;
scene.add(showRim);
let pressureTimer=DIFF.waveInterval;
let trappedPit=null;
let menuAngle = 0, shake = 0; // v5: showcase orbit + camera shake
// v5: speed lines — thin streaks parented to the camera, fading in with speed.
scene.add(camera);
const speedLines = new T.Group();
const speedLineMat = new T.MeshBasicMaterial({color:0xbfefff, transparent:true, opacity:0, blending:T.AdditiveBlending, depthWrite:false});
for (let i = 0; i < 26; i++) {
  const a = (i / 26) * Math.PI * 2;
  const line = new T.Mesh(new T.BoxGeometry(.012, .012, 1.6), speedLineMat);
  line.position.set(Math.cos(a) * (1.4 + (i % 3) * .5), Math.sin(a) * (1.0 + (i % 2) * .4), -2.5 - (i % 4) * .7);
  speedLines.add(line);
}
camera.add(speedLines);
const batches = new Map();
for (const mesh of scenery.children) {
  const segment = Math.floor(-mesh.position.z / 35);
  const key = [segment, mesh.geometry.id, mesh.material.id].join(':');
  if (!batches.has(key)) batches.set(key, []);
  batches.get(key).push(mesh);
}
scenery.clear();
for (const meshes of batches.values()) {
  const {geometry, material} = meshes[0];
  const batch = new T.InstancedMesh(geometry, material, meshes.length);
  meshes.forEach((mesh,index) => {
    mesh.updateMatrix();
    batch.setMatrixAt(index,mesh.matrix);
  });
  batch.computeBoundingSphere();
  batch.castShadow=material!==colors.gold;
  batch.receiveShadow=true;
  scenery.add(batch);
}

// ---- Hazards: logs to jump, potholes to avoid (Phase 1) ----
// A log spans the corridor: jump over it (jumpY >= 0.6 when crossing).
// A pothole is at one lateral position: strafe around it, or jump over it
// (jumpY >= 0.5 when crossing and |lateral - x| < 1.1 while grounded).
const pitMat = new T.MeshStandardMaterial({color:0x140d08, roughness:1});
const pitRimGeometry = new T.PlaneGeometry(6.6, 6.6); // inner opening = 1.65 m radius, matches the trap radius
const pitRimTexture = spriteTexture('pit_rim'); pitRimTexture.anisotropy = 16;
const pitRimMaterial = new T.MeshStandardMaterial({map: pitRimTexture, transparent: true, alphaTest: .35, roughness: .9, polygonOffset: true, polygonOffsetFactor: -2});
// v3: thorny bush — dark green spiky ball with red thorns, clearly readable
// as a damage hazard (unlike a plain log). Cones are deliberately pointed.
const thornMat = new T.MeshStandardMaterial({color:0x2a4a22, roughness:.8});
const thornRedMat = new T.MeshStandardMaterial({color:0x9e2b25, roughness:.6});
const thornCone = new T.ConeGeometry(.09,.55,8);
function makeThorn(x, d) {
  const bush = new T.Group();
  bush.position.set(center(d)+x, .55, -d);
  shape(bush, smoothOrb, thornMat, 0, 0, 0, .62, .55, .62);
  for (let i=0;i<9;i++) {
    const a = i/9*Math.PI*2, up = i%3===0;
    const cone = shape(bush, thornCone, i%2 ? thornRedMat : thornMat,
      Math.cos(a)*.5, up?.35:.1, Math.sin(a)*.5, 1, 1, 1);
    cone.rotation.set(Math.sin(a)*.9, 0, -Math.cos(a)*.9);
    if (up) cone.rotation.x = -.5;
  }
  ghostify(bush);
  const art = makeSprite('prop_thorn', 2.6, {bottom:true});
  art.position.y = -.55;
  bush.add(art);
  courseGroup.add(bush);
  return bush;
}
const hazards = [];
const solids = []; // V11: things you can't walk through {d, x, hw, hd, h}; jump clears them if h is low enough
solids.push(...gatePosts); // V13: finish gate posts
const softZones = []; // V11: ferns in the path slow you down
const shotBlockers=[];
const combatRange=70; // V13: anything fully visible (fade-in ends at 70 m) can be shot
const FADE_START=85, FADE_END=70; // V13: enemies fade in between 85 m and 70 m
function radialTexture(glow=false) {
  const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,0,64,64,64);
  if(glow){g.addColorStop(0,'#65efffcc');g.addColorStop(.35,'#20cfff88');g.addColorStop(1,'#12cfff00');}
  else {g.addColorStop(0,'#ffffff');g.addColorStop(.25,'#d5ffff');g.addColorStop(.7,'#36e7ff');g.addColorStop(.9,'#078dab');g.addColorStop(1,'#024354');}
  x.fillStyle=g;x.beginPath();x.arc(64,64,63,0,Math.PI*2);x.fill();
  if(!glow){x.fillStyle='#fff';x.beginPath();x.arc(45,43,7,0,Math.PI*2);x.fill();}
  return new T.CanvasTexture(c);
}
const weakTexture=radialTexture(), weakGlowTexture=radialTexture(true);
const armorMaterial=new T.MeshStandardMaterial({color:0x3d5263,metalness:.65,roughness:.42});
const hazardPattern = [
  ['log',45,0],['thorn',45,3],['pothole',65,-2],
  ['log',110,0],['thorn',110,-3],['pothole',130,2],
  ['log',175,0],['thorn',175,3],['pothole',200,-2.5],
  ['log',240,0],['thorn',240,-3],['pothole',270,2.5],
  ['log',305,0],['thorn',305,3],['pothole',330,-2],
  ['log',350,0],['thorn',350,-3],
];
// V14: the course (hazards, cover, rocks, ferns, pits, coins) is built per level
// into courseGroup. L1 is built first at load with the same random sequence as V13,
// so Overgrown Trail is unchanged; its seed is kept so it rebuilds identically.
const courseGroup = new T.Group(); scene.add(courseGroup);
let hazardCourse = [], courseSeedL1 = null, currentLevel = LEVELS[0];
function courseHazards(level) {
  const H = level.hazards || {};
  const course = extendCourse(hazardPattern.map(([kind,d,x])=>[d,kind,x]));
  for(let d=32,index=0;d<finish-15;d+=38,index++){
    const side=index%2?1:-1;
    if((H.base!=='v13-light' && !(level.id>1 && DIFF.pitKeep<1)) || index%2===0) course.push([d,'thorn',-side*3.4]); // L3 and Easy L2-L5: every other thorn row // V12: retain the authored pits, remove redundant extra pit pairs.
    if(index%2===0) course.push([d+14,'cover',side*1.6]);
  }
  if (H.base === 'v13-light') for (let i = course.length - 1; i >= 0; i--) if (course[i][1] === 'pothole') course.splice(i, 1); // pit gates replace the loose pits
  if (level.id > 1 && DIFF.pitKeep < 1) { let acc = 0; for (let i = 0; i < course.length; i++) if (course[i][1] === 'pothole') { acc += DIFF.pitKeep; if (acc >= 1) acc -= 1; else course.splice(i--, 1); } } // Easy: fewer loose pits
  const near = (d, x, gap = 7, lat = 3.4) => course.some(([hd,, hx]) => Math.abs(hd - d) < gap && Math.abs(hx - x) < lat);
  // L3: pit gates. Two pits across the path leave one safe lane; buggies charge down lanes.
  const gates = [[-3.4, .4], [-.4, 3.4], [-3.6, 3.6], [-3.4, .4], [-.6, 3.6], [-3.6, 3.6], [-.4, 3.4]];
  for (let i = 0; i < (H.pitGates || 0); i++) {
    const d = 120 + i * 105;
    if (d > finish - 70) break;
    for (const x of gates[i % gates.length].slice(0, DIFF.pitKeep < 1 ? 1 : 2)) course.push([d, 'pothole', x]); // Easy: one pit per gate
  }
  // L5: denser pits and thorns.
  for (let i = 0; i < Math.round((H.extraPits || 0) * DIFF.featureKeep); i++) {
    let d = 150 + i * 120, x = i % 2 ? 3 : -3;
    while (near(d, x, 9)) d += 4;
    if (d < finish - 70) course.push([d, 'pothole', x]);
  }
  for (let i = 0; i < Math.round((H.extraThorns || 0) * DIFF.featureKeep); i++) {
    let d = 95 + i * 101, x = i % 2 ? -1.8 : 1.8;
    while (near(d, x, 5, 2.4)) d += 3;
    if (d < finish - 65) course.push([d, 'thorn', x]);
  }
  // L2: a turret every 70-90 m, each with cover in front of it.
  const tur = level.enemies?.turrets;
  if (tur) for (const t of turretPlan(level)) {
    let d = t.d - tur.coverGap, x = T.MathUtils.clamp(t.x * .55, -2.6, 2.6);
    while (near(d, x, 4, 2.8)) d -= 2;
    course.push([d, 'cover', x]);
  }
  return course;
}
// L2 turret gauntlet positions (shared by the course and the encounter list).
function turretPlan(level) {
  const tur = level.enemies?.turrets; if (!tur) return [];
  const out = [], [a, b] = tur.every;
  for (let d = tur.start, i = 0; d < finish - 65; d += a + ((i * 37) % (b - a + 1)), i++) out.push({d, x: i % 2 ? 3.2 : -3.2});
  return out;
}
function buildCourse(level) {
  currentLevel = level; builtFor = DIFF;
  for (let i = envSprites.length - 1; i >= 0; i--) if (envSprites[i].course) envSprites.splice(i, 1);
  envTracking = envCourse = true;
  courseGroup.clear();
  hazards.length = 0; solids.length = 0; solids.push(...gatePosts); softZones.length = 0; shotBlockers.length = 0;
  if (courseSeedL1 === null) courseSeedL1 = seed; // first build at load is L1
  seed = level.id === 1 ? courseSeedL1 : 9000 + level.id * 131;
  hazardCourse = level.boss ? [] : courseHazards(level);
for(const [d,kind,x] of hazardCourse) {
  let mesh;
  if(kind==='cover'){
    mesh=shape(courseGroup,box,colors.bark,center(d)+x,.68,-d,2.5,1.36,1.3);
    shotBlockers.push(mesh);
    solids.push({d, x, hw:1.25, hd:.65, h:1.36, cover:true}); // V11: cover is solid
    mesh.material=ghostMaterial; // V8: fallen-log art over the same cover box
    const art=makeSprite(pick(['cover_stump','cover_boulder','cover_stone']),2.7,{bottom:true,height:1.75,tint:0xd0d0c8});
    art.position.set(center(d)+x,0,-d+.2);
    courseGroup.add(art);
  } else if (kind === 'thorn') {
    // v3: thorn bush beside the log — jump the log at the centre, steer
    // around the thorns. Same d as the log, offset ±3 m to the side.
    mesh = makeThorn(x, d);
    shotBlockers.push(...mesh.children.filter(part=>part.isMesh));
  } else if (kind === 'log') {
    // Rounded log: cylinder lying across the corridor, same centre,
    // length 12 and diameter 0.8 as the old box log.
    mesh = shape(courseGroup, pole, colors.wood, center(d), 0.4, -d, .48, 12, .48);
    mesh.rotation.z = Math.PI / 2;
    shotBlockers.push(mesh);
    solids.push({d, x:0, hw:7, hd:.45, h:.7}); // V11: logs block you until you jump them
    mesh.material = ghostMaterial; // V9: log art over the same blocker
    const art = makeSprite('log_cross', 12.8, {bottom: true, height: 1.85, tint: 0xd2d2ca});
    art.position.set(center(d), -.12, -d + .3);
    courseGroup.add(art);
  } else {
    mesh = shape(courseGroup, orb, pitMat, center(d) + x, 0.055, -d, 1.75, 0.08, 1.8);
  }
  if(kind==='pothole'){
    // V9: painted pit rim lying flat; its centre is transparent so the real pit shows.
    const rim=new T.Mesh(pitRimGeometry,pitRimMaterial);
    rim.rotation.x=-Math.PI/2;
    rim.rotation.z=random()*Math.PI*2;
    rim.position.set(center(d)+x,.035,-d);
    courseGroup.add(rim);
  }
  hazards.push({kind, d, x, mesh, hit:false});
}

// V11: rock piles (solid, jumpable) and fern clumps (slow you) in the path.
if (!level.boss) {
  const lanes = [-3.8, -1.4, 1.4, 3.8];
  const clear = (d, x) => !hazards.some(h => Math.abs(h.d - d) < 6 && Math.abs(h.x - x) < 3.2)
    && Math.abs(((d + 30) % 60) - 30) > 4 && d > 20 && d < finish - 15;
  for (let d = 18, i = 0; d < finish; d += 21, i++) {
    const x = lanes[(i * 3 + (i >> 1)) % 4];
    if (!clear(d, x)) continue;
    if (i % 2 === 0) {
      const art = makeSprite('prop_rocks', 2.0, {bottom: true, tint: 0xb4b4b0});
      art.position.set(center(d) + x, -.04, -d); courseGroup.add(art);
      shotBlockers.push(shape(courseGroup, box, ghostMaterial, center(d) + x, .35, -d, 1.6, .7, 1.1));
      solids.push({d, x, hw: .8, hd: .55, h: .7});
      hazards.push({kind: 'rock', d, x, mesh: art, hit: true});
    } else {
      const art = makeSprite('prop_fern', 2.2, {bottom: true, tint: 0xb8c2b0});
      art.position.set(center(d) + x, -.04, -d); courseGroup.add(art);
      softZones.push({d, x, hw: 1.0, hd: .8});
      hazards.push({kind: 'fern', d, x, mesh: art, hit: true});
    }
  }
}
  // L5: temple lanterns light the night route (prop_temple_lantern).
  nightLanterns.length = 0;
  for (let i = 0; i < (level.hazards?.lanterns || 0); i++) {
    const d = 30 + i * (finish - 60) / Math.max(1, level.hazards.lanterns - 1), side = i % 2 ? 1 : -1;
    const lamp = makeSprite('jungle-biome/prop_temple_lantern', 1.15, {bottom: true, tint: 0xd8c8b0});
    lamp.position.set(center(d) + side * 7.0, -.05, -d); courseGroup.add(lamp);
    const glow = addGlow(courseGroup, center(d) + side * 7.0, 1.65, -d + .05, 0xffa640, 2.4, .9); glow.material.fog = false;
    nightLanterns.push({d, x: center(d) + side * 7.0});
  }
  if (level.boss) buildArena(); else if (arena.group) arena.group.visible = false;
  finishGate.visible = finishLine.visible = !level.boss;
  for (const g of gateLanterns) g.visible = !level.boss;
  rebuildFloor();
  buildCoinLines();
  envTracking = envCourse = false;
  applyLighting(level.light);
}
const nightLanterns = []; let builtFor = null;
// v5: neon path edges, from the Meridian screenshots — warm red/orange on
// the LEFT, cool cyan on the RIGHT, so left/right read at a glance and the
// dark path gets its contrast from the edges, not from daylight.
// V9: toned down so the edges still read without glowing like neon on the dirt path.
const neonRed = new T.MeshStandardMaterial({color:0xb4553a, emissive:0xff5a2e, emissiveIntensity:.55, roughness:.6});
const neonCyan = new T.MeshStandardMaterial({color:0x4c9aa6, emissive:0x22d3ee, emissiveIntensity:.55, roughness:.6});
const neonGeo = new T.BoxGeometry(.14, .07, 9.6);
for (let d = 5; d < finish; d += 10) {
  for (const [side, mat] of [[-1, neonRed], [1, neonCyan]]) {
    const strip = new T.Mesh(neonGeo, mat);
    strip.position.set(center(d) + side * 5.6, .06, -d);
    strip.rotation.y = -Math.atan((center(d+5)-center(d-5))/10);
    scene.add(strip);
  }
  if (d % 40 === 5) {
    addGlow(scene, center(d) - 5.6, .3, -d, 0xff2a1e, 2.5, .55);
    addGlow(scene, center(d) + 5.6, .3, -d, 0x22d3ee, 2.5, .55);
  }
}
// v5: lantern posts — warm left, cyan right — every 40 m.
for (let d = 40; d < finish; d += 40) {
  for (const [side, mat, glow] of [[-1, neonRed, 0xff8a2a], [1, neonCyan, 0x22d3ee]]) {
    beam(scene, vector(center(d)+side*6.2, 0, -d), vector(center(d)+side*6.2, 2.6, -d), .09, colors.bark);
    const lamp = new T.Mesh(new T.SphereGeometry(.2, 12, 8), mat);
    lamp.position.set(center(d)+side*6.2, 2.75, -d); scene.add(lamp);
    addGlow(scene, center(d)+side*6.2, 2.75, -d, glow, 2.4, .5);
  }
}
// Cut pit openings into the ground so the soldier can visibly fall below it.
function rebuildFloor() {
const floorOutline=new T.Shape();
const floorHalfLength=(finish+440)/2;
floorOutline.moveTo(-300,-floorHalfLength);
floorOutline.lineTo(300,-floorHalfLength);
floorOutline.lineTo(300,floorHalfLength);
floorOutline.lineTo(-300,floorHalfLength);
floorOutline.closePath();
for(const h of hazards.filter(h=>h.kind==='pothole')){
  const x=center(h.d)+h.x;
  const hole=new T.Path();
  hole.absarc(x,h.d-finish/2,1.75,0,Math.PI*2,true);
  floorOutline.holes.push(hole);
  courseGroup.remove(h.mesh);
  const wall=new T.Mesh(new T.CylinderGeometry(1.75,1.6,1.8,24,1,true),
    new T.MeshStandardMaterial({color:0x3a2616,side:T.DoubleSide,roughness:1}));
  wall.position.set(x,-.9,-h.d);
  courseGroup.add(wall);
  const bottom=new T.Mesh(new T.CircleGeometry(1.6,24),pitMat);
  bottom.rotation.x=-Math.PI/2;
  bottom.position.set(x,-1.8,-h.d);
  courseGroup.add(bottom);
}
forestFloor.geometry.dispose();
forestFloor.geometry=new T.ShapeGeometry(floorOutline,16);
const floorUV=forestFloor.geometry.attributes.uv;
for(let i=0;i<floorUV.count;i++){
  floorUV.setXY(i,floorUV.getX(i)/600+.5,floorUV.getY(i)/(finish+440)+.5);
}
floorUV.needsUpdate=true;
}
// ---- Enemies, Phase 1 only: beetle (standard), turret (fortification),
// moth in waves of 5 (zipper). No glider in Phase 1 — it is deferred.
// x is the lateral offset from the corridor centre. Moth waves are listed
// individually, staggered by 2 m so the wave crosses quickly.
const encounterPlan=[
  [25,'moth',-3,'reload'],[27,'moth',0],[29,'moth',3],[31,'moth',-1.5],[33,'moth',1.5],
  [37,'turret',-3,'shield'],
  [55,'moth',2],[57,'moth',-2],[59,'moth',0],[61,'moth',3],[63,'moth',-3],
  [70,'beetle',2],
  [85,'moth',-2,'heavy'],[87,'moth',2],[89,'moth',0],[91,'moth',-3],[93,'moth',3],
  [105,'turret',3,'charge'],
  [115,'moth',0],[117,'moth',-3],[119,'moth',3],[121,'moth',-1],[123,'moth',1],
  [145,'turret',-3,'auto'],
  [155,'beetle',-2],
  [170,'moth',3,'reload'],[172,'moth',-3],[174,'moth',0],[176,'moth',1.5],[178,'moth',-1.5],
  [195,'turret',3,'shield'],
  [210,'beetle',2],
  [225,'moth',-2],[227,'moth',2],[229,'moth',0],[231,'moth',-3],[233,'moth',3],
  [250,'turret',-3,'charge'],
  [265,'beetle',-2,'heavy'],
  [280,'moth',1,'auto'],[282,'moth',-1],[284,'moth',3],[286,'moth',-3],[288,'moth',0],
  [305,'turret',3,'shield'],
  [320,'beetle',2],
  [335,'moth',-3,'reload'],[337,'moth',3],[339,'moth',0],[341,'moth',-1.5],[343,'moth',1.5],
  [360,'turret',-3,'charge'],
  [372,'beetle',0]
];
const allEncounters=extendCourse(encounterPlan).filter((_,index)=>index%2===0).filter((_,index)=>index%5!==4).map(([d,type,x,drop])=>({d,type,x,drop})).filter(e=>e.d>=85 && e.d<finish-60); // V13: last 60 m is a clear run
// V7: easier modes keep an evenly spread fraction of the fixed encounters.
function encountersFor(keep){
  if(keep>=1) return allEncounters;
  let acc=0; return allEncounters.filter(()=>{acc+=keep; if(acc>=1){acc-=1; return true;} return false;});
}
const enemyMaterials={
  // v4 reskins (types/HP/behaviour unchanged): moth = small flying drone,
  // beetle = armoured crawler, turret = gun emplacement.
  moth:satin(0x4a4f55), mothWing:satin(0xffc35d),
  beetle:satin(0x4a5a2a), beetleDark:satin(0x2e3320),
  turret:satin(0x3a4048), petals:satin(0x5a6b3a)
};
const iconPositions={dual:'0',level:'1',heavy:'1',auto:'2',charge:'4',reload:'5',shield:'6',shieldOffer:'6'};
const ICON_ART={dual:'icon_dual',level:'icon_power2',heavy:'icon_power2',auto:'icon_auto',
  charge:'icon_grenade',reload:'icon_reload',shield:'icon_shield',shieldOffer:'icon_shield'};
function itemIcon(key) {
  const icon=document.createElement('span');
  icon.className='item-icon';
  icon.dataset.tile=iconPositions[key];
  if(ICON_ART[key]) icon.style.backgroundImage='url(art/sprites/'+ICON_ART[key]+'.png)'; // V8
  icon.setAttribute('aria-hidden','true');
  return icon;
}
const targets = [];
const bolts = [];
const grenades = []; // v4: lobbed grenades in flight (Power Attack)
const pickups = [];
const coinGeometry = new T.CylinderGeometry(.22,.22,.075,32); // smooth coins
const coinLines = [];
function buildCoinLines() {
coinLines.length = 0;
if (currentLevel.boss) return;
const pits = hazardCourse.filter(([depth,kind])=>kind==='pothole');
for (let d = 10; d < finish; d += 20) {
  const nearest=pits.length ? pits.reduce((best,h)=>Math.abs(h[0]-d)<Math.abs(best[0]-d)?h:best) : [1e9,'',0];
  const lane=Math.abs(nearest[0]-d)<12 ? -Math.sign(nearest[2])*4.7 : ((Math.floor(d/20)%3)-1)*3;
  coinLines.push({d,lane});
}
}
const coins = [];
const effects = [];
const ray = new T.Raycaster();
const pointer = new T.Vector2(0, 0);
const held = new Set();
const projectileSpeed = 12;
const FIRE_COOLDOWN = .12; // v4: rifle auto-fire, ~8 rounds/second
let AIM_ASSIST_ANGLE = .06; // v4: snap the centre ray to an enemy within ~3.4 deg
const GRENADE_SPEED = 16, GRENADE_GRAVITY = 12, GRENADE_RADIUS = 3.5; // v4
let aimYaw = 0, aimPitch = 0, hitMarkerTimer = 0, killMarkerTimer = 0; // v4
const movementKeys = new Set([
  'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS'
]);
// Phase 1 state. distance/lateral are the run position; jumpY is height
// above the ground (0 = on the ground). No auto-run: currentSpeed is 0
// unless W/Up is held.
let mode = 'menu', distance = 0, lateral = 0, jumpY = 0, jumpVel = 0, grounded = true;
let rollTime = 0, rollDir = 0, rollCooldown = 0, rollInvuln = 0, slowTimer = 0;
let recoilTimer = 0; // v4: rifle recoil after firing
const aimSmooth = {x: 0, y: 0}; // v4: smoothed mouse-aim offset, -1..1
let currentSpeed = 0;
let health = 100, score = 0, coinCount = 0;
let shield = 0, recovery = 0, notice = 0, cooldown = 0, firing = false, elapsed = 0;
let resumed = false, audio;
let wallet, level, dual, rapid, heavy, autoTime, autoCooldown, charges, pressShot, powerShot;
const lastTap = {};
const DROP_CYCLE = ['shield','heavy','reload','auto','charge']; // V11
let dropCycle = 0;
const DROP_HELP = {health:'Health +20 · unused health is lost',shield:'Shield · blocks the next hit', heavy:'Power bolts · next 8 shots do double damage',
  reload:'Rapid fire · next 12 shots fire faster', auto:'Auto attack · fires at targets for 15 s', charge:'Grenade +1 · press E or right click'};
const dropNames = {health:'Health',shield:'Shield',auto:'Auto attack',heavy:'Power bolts',
  reload:'Rapid fire',charge:'Power attack charge'};
const dropColors = Object.fromEntries(Object.entries({
  shield:0x68dfef,auto:0xbb9dff,heavy:0xff665f,reload:0x82e584,charge:0xffffff
}).map(([key,color])=>[key,new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.55,roughness:.3})]));
function collectDrop(key) {
  switch (key) {
    case 'health': { const gain=Math.min(DIFF.healAmount,100-health); health+=gain; healthFeedback('+'+gain,'heal'); break; }
    case 'shield': shield=1; break;
    case 'auto': autoTime=15; break;
    case 'heavy': heavy=8; break;
    case 'reload': rapid=12; break;
    case 'charge': charges=Math.min(3,charges+1); break;
  }
  message(DROP_HELP[key] || dropNames[key]+' collected', 3.5);
  spawnFx(key==='shield' ? 'vfx_shield' : 'vfx_heal', actor.position.clone().add(vector(0,1,0)), 2.2, .5); // V9
  ui.notice.prepend(itemIcon(key));
  tone(880,.22);
}

let musicEnabled=true;
// V11: playlist. Menu theme, level tracks rotating each run (per level once the
// level system lands), boss theme reserved for boss fights, win/lose jingles.
const music = createMusic();
const LEVEL_TRACKS = ['jungle', 'canopy', 'night'];
let runCount = 0, levelTrack = 'jungle';
function syncMusic(){
  if (audio) music.init(audio);
  if (!musicEnabled || mode === 'pause') music.stop();
  else if (mode === 'play') music.play(levelTrack);
  else if (mode === 'menu') music.play('menu');
  ui.musicToggle.textContent=musicEnabled?'Music on · M':'Music off · M';
  ui.musicToggle.setAttribute('aria-pressed',musicEnabled);
}
function toggleMusic(){
  musicEnabled=!musicEnabled;
  syncMusic();
}
ui.musicToggle.onclick=toggleMusic;
// v5: graphics quality — High is the Meridian look (4096 shadows, pixel
// ratio 2); Medium 2048/1.5; Low 1024/1 with light shafts off.
function applyQuality(q) {
  if (q === 'low') { sun.shadow.mapSize.set(1024,1024); renderer.setPixelRatio(1); shafts.visible = false; }
  else if (q === 'medium') { sun.shadow.mapSize.set(2048,2048); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); shafts.visible = true; }
  else { sun.shadow.mapSize.set(4096,4096); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); shafts.visible = true; }
  if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
}
ui.quality.addEventListener('change', e => applyQuality(e.target.value));

function tone(pitch, length = .1, volume = .045) {
  if (!audio || audio.state !== 'running') return;
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.frequency.value = pitch;
  osc.frequency.exponentialRampToValueAtTime(pitch * .65, audio.currentTime + length);
  gain.gain.setValueAtTime(volume, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + length);
}
function message(text, seconds = 2.2) {
  ui.notice.textContent = text;
  notice = seconds;
}
function remove(entry) {
  scene.remove(entry.mesh);if(entry.aimLine)scene.remove(entry.aimLine);if(entry.marker)scene.remove(entry.marker.mesh);stopChargeSound(entry);
}
function membrane(points, camber) {
  const contour=new T.Shape(points.map(([x,z])=>new T.Vector2(x,z)));
  const geometry=new T.ShapeGeometry(contour,32); // smoother wing membranes
  const vertices=geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i), z=vertices.getY(i);
    vertices.setXYZ(i,x,Math.sin(x*Math.PI*.54)*camber,z);
  }
  geometry.computeVertexNormals();
  return geometry;
}
const mothWing=membrane([[0,0],[.25,.47],[.85,.69],[1.45,.42],[1.52,.15],[1.2,-.16],[.8,-.58],[.54,-.59],[.25,-.28]],.105);
const horn=new T.TubeGeometry(new T.CatmullRomCurve3([
  vector(0,0,0),vector(.08,.15,.19),vector(.15,.35,.37),vector(.13,.66,.52)
]),32,.085,16,false); // smoother horns
const goldWing=new T.MeshStandardMaterial({map:mothWingTexture(),side:T.DoubleSide,roughness:.4}); // v2: patterned wings
function spawn(config) {
  const mesh=new T.Group(), motion=[];
  const mat=enemyMaterials;
  let body, shell=[];
  const eyes=(x,y,z,r)=> {
    for(const side of [-1,1]) shape(mesh,smoothOrb,colors.gold,side*x,y,z,r,r*.76,r);
  };
  switch(config.type){
    case 'moth':
      body=shape(mesh,smoothOrb,mat.moth,0,0,0,.3,.28,.57);
      eyes(.115,.075,.49,.063);
      for(const side of [-1,1]){
        beam(mesh,vector(side*.1,.16,.38),vector(side*.31,.47,.65),.022,mat.mothWing);
      }
      const edgeRing = shape(mesh, new T.TorusGeometry(.34,.02,6,24), goldWing, 0,0,0, 1,1,1);
      edgeRing.rotation.x = Math.PI/2; // v5: glowing edge ring — drone reads at a glance
      for(const side of [-1,1]){
        const wing=new T.Group();
        mesh.add(wing);
        shape(wing,mothWing,goldWing,0,.01,0,side,1,1);
        beam(wing,vector(0,.06,.12),vector(side*1.25,.06,.31),.03,mat.moth);
        for(let vein=0;vein<3;vein++){
          beam(wing,vector(side*.11,.06,.06),vector(side*(.88+vein*.15),.06,.34-vein*.26),.013,mat.moth);
        }
        motion.push(wing);
      }
      break;
    case 'beetle':
      body=shape(mesh,smoothOrb,mat.beetleDark,0,-.04,0,.76,.52,.94);
      eyes(.25,.1,.84,.08);
      shell=[-1,1].map(side=>shape(mesh,smoothOrb,mat.beetle,side*.32,.18,-.12,.48,.52,.83));
      for(let seg=0;seg<3;seg++) shape(mesh,smoothOrb,mat.beetleDark,0,.42,-.55+seg*.5,.5,.08,.28); // v2: shell segments
      for(let s=0;s<2;s++) shape(mesh,smoothOrb,mat.beetleDark,0,.5,-.3+s*.6,.52,.03,.3); // v5: shell panel seams
      for(let b=0;b<4;b++) shape(mesh,smoothOrb,colors.gold,Math.cos(b*1.57)*.6,-.3,Math.sin(b*1.57)*.6,.06,.06,.06); // v5: bolts
      for(const side of [-1,1]) shape(mesh,smoothOrb,colors.gold,side*.45,.3,.3,.07,.07,.07); // v2: shell spots
      for(const side of [-1,1]){
        shape(mesh,horn,mat.beetle,side*.22,.11,.48,side,1,1);
        for(let band=0;band<3;band++){
          shape(mesh,smoothOrb,mat.beetle,side*.38,.36,-.5+band*.31,.36,.25,.18);
        }
        for(const z of [-.55,0,.44]){
          beam(mesh,vector(side*.5,0,z),vector(side*.94,-.37,z+.16),.10,mat.beetleDark);
        }
      }
      break;
    case 'turret':
      body=shape(mesh,smoothOrb,mat.turret,0,0,0,.55,1.02,.58);
      shape(mesh,smoothOrb,colors.gold,0,.28,.5,.14,.14,.1); // v2: turret eye
      for(let i=0;i<4;i++){ const a=i*Math.PI/2; shape(mesh,smoothOrb,colors.leaves,Math.cos(a)*.5,-.7,Math.sin(a)*.5,.28,.12,.28); } // v2: base leaves
      for(let i=0;i<6;i++){
        const angle=i*Math.PI/3;
        const x=Math.cos(angle),z=Math.sin(angle);
        beam(mesh,vector(0,-.46,0),vector(x*1.2,-.92,z*1.2),.15,mat.turret);
        const petal=shape(mesh,smoothOrb,mat.petals,x*.43,.62,z*.43,.31,.46,.18);
        petal.rotation.y=-angle;
        shape(mesh,smoothOrb,colors.gold,x*.55,.35,z*.55,.05,.05,.05); // v5: panel bolts
      }
      break;
    // V14: Forest campaign enemies. Hit volumes are invisible; the art is a sprite.
    case 'buggy': body=shape(mesh,box,mat.beetle,0,1.0,0,2.3,1.55,1.3); break;
    case 'bee': body=shape(mesh,smoothOrb,mat.beetle,0,.1,0,1.55,.9,.7); break;
    case 'mini': body=shape(mesh,smoothOrb,mat.moth,0,0,0,.34,.26,.32); break;
    case 'mushroom': body=shape(mesh,smoothOrb,mat.petals,0,.8,0,.75,.75,.55); break;
  }
  const parts=[]; // V14: separate weak points (buggy seed pods, hive bee belly)
  const partGlow=(x,y,z,size)=>{const g=new T.Sprite(new T.SpriteMaterial({map:weakGlowTexture,blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));g.position.set(x,y,z);g.scale.set(size,size,1);mesh.add(g);return g;};
  if(config.type==='buggy'){
    const W=2.8,H=W/SPRITE_ASPECT['jungle-biome/enemy_leaf_buggy_front'];
    for(const fx of [.25,.42,.59,.76]){const x=(fx-.5)*W,y=(1-.13)*H;parts.push({mesh:shape(mesh,smoothOrb,mat.beetle,x,y,.35,.28,.28,.28),glow:partGlow(x,y,.45,.62),hp:BUGGY.podHp,x,y});}
  }
  if(config.type==='bee'){const W=4,H=W/SPRITE_ASPECT.enemy_hive_bee,bx=(.55-.5)*W,by=-.12*H;const dot=new T.Sprite(new T.SpriteMaterial({map:weakTexture,depthWrite:false,fog:false}));dot.position.set(bx,by,.6);dot.scale.set(.42,.42,1);mesh.add(dot);
    parts.push({mesh:shape(mesh,smoothOrb,mat.beetle,bx,by,.4,.5,.45,.35),glow:partGlow(bx,by,.55,1.4),dot,belly:true,hp:Infinity});}
  const halo=new T.Mesh(new T.TorusGeometry(.75,.025,8,48), new T.MeshBasicMaterial({color:0xff2a3a,transparent:true,opacity:1,depthTest:false,depthWrite:false}));
  const haloGlow=new T.Mesh(new T.TorusGeometry(.75,.065,8,48),new T.MeshBasicMaterial({color:0xff2a3a,transparent:true,opacity:.3,blending:T.AdditiveBlending,depthTest:false,depthWrite:false}));haloGlow.renderOrder=99;halo.add(haloGlow);
  halo.position.set(0,config.type==='turret'?.81:.22,.25);halo.renderOrder=100;mesh.add(halo);
  const fireCore=shape(mesh,smoothOrb,new T.MeshBasicMaterial({color:0xffffff,depthTest:false,depthWrite:false}),0,halo.position.y,.25,.15,.15,.15);fireCore.renderOrder=101;fireCore.visible=false;
  const aimLine=new T.Line(new T.BufferGeometry().setFromPoints([vector(0,0,0),vector(0,0,0)]),new T.LineBasicMaterial({color:0xff2a3a,transparent:true,opacity:0,depthTest:false,depthWrite:false}));aimLine.renderOrder=99;scene.add(aimLine);
  halo.visible=false;
  // v4: gold ring shown around the enemy under the centre reticle.
  const targetRing=new T.Mesh(new T.TorusGeometry(.85,.05,8,32),
    new T.MeshBasicMaterial({color:0x66dfff,transparent:true,opacity:.9}));
  targetRing.position.y=config.type==='turret'?1.7:.6;
  targetRing.rotation.x=Math.PI/2;
  targetRing.visible=false;
  mesh.add(targetRing);
  const weakPoint=new T.Sprite(new T.SpriteMaterial({map:weakTexture,depthWrite:false}));
  weakPoint.position.set(0,config.type==='beetle'?.18:.4,.7); weakPoint.scale.set(.44,.44,1); mesh.add(weakPoint);
  const weakGlow=new T.Sprite(new T.SpriteMaterial({map:weakGlowTexture,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));
  weakGlow.position.copy(weakPoint.position); weakGlow.scale.set(.95,.95,1); mesh.add(weakGlow);
  weakPoint.visible=false;
  // V8: concept art replaces the procedural model. Sizes match the old silhouettes.
  ghostify(mesh, [halo, haloGlow, fireCore, targetRing, weakPoint, weakGlow]);
  const art = config.type==='moth' ? makeSprite('drone_front', 2.2, {own:true})
    : config.type==='beetle' ? makeSprite('crawler_front', 2.1, {own:true})
    : config.type==='buggy' ? makeSprite('jungle-biome/enemy_leaf_buggy_front', 2.8, {own:true, bottom:true})
    : config.type==='bee' ? makeSprite('enemy_hive_bee', 4, {own:true})
    : config.type==='mini' ? makeSprite('drone_front', 2.2*MINI.scale, {own:true})
    : config.type==='mushroom' ? makeSprite('plant_mushroom_blue', 1.7, {own:true, bottom:true})
    : makeSprite('turret_front', 2.3, {own:true});
  if (config.type==='beetle') art.position.y = 2.1/SPRITE_ASPECT.crawler_front/2 - .55;
  if (config.type==='turret') art.position.y = 2.3/SPRITE_ASPECT.turret_front/2 - 1.0;
  mesh.add(art);
  motion.length = 0;
  scene.add(mesh);
  art.material.fog=false; // V13: enemies stay readable at range; they fade in instead
  if(!config.training && !config.minor) runStats.spawned++; // V14: mini-drones and mushrooms are not counted
  const hp={moth:2,buggy:BUGGY.hp,bee:BEE.hp,mini:MINI.hp,mushroom:MUSHROOM.hp}[config.type] ?? 6;
  return {...config,mesh,body,halo,fireCore,aimLine,targetRing,shell,motion,weakPoint,weakGlow,art,parts,hp,maxHp:hp,shot:-(config.shotDelay ?? 0)+(config.firstShot ?? 0),range:0,flash:0,stun:0};
}
// V12: red means incoming fire; cyan means an exposed weak point.
const warningCanvas=document.createElement('canvas');warningCanvas.id='shotWarnings';ui.game.append(warningCanvas);
const warningContext=warningCanvas.getContext('2d'),hitDirections=[];
function predictedImpact(enemy){
  const start=enemy.mesh.position;let flight=enemy.range/(Math.max(currentSpeed,.1)+DIFF.boltSpeed);const at=vector(0,0,0);
  for(let i=0;i<4;i++){const future=distance+flight*currentSpeed;at.set(center(future)+lateral,jumpY+.85,-future);flight=at.distanceTo(start)/DIFF.boltSpeed;}
  return at;
}
function stopChargeSound(enemy){
  if(!enemy.chargeTone)return;try{enemy.chargeTone.gain.gain.setTargetAtTime(0,audio.currentTime,.015);enemy.chargeTone.osc.stop(audio.currentTime+.06);}catch{}enemy.chargeTone=null;
}
function updateChargeWarning(enemy,rate){
  const charging=enemy.shot>.42,progress=T.MathUtils.clamp((enemy.shot-.42)/1.08,0,1),remaining=(1.5-enemy.shot)/rate;
  enemy.charging=charging;enemy.chargeProgress=progress;
  enemy.halo.visible=charging && DIFF.warningRing;
  enemy.halo.quaternion.copy(camera.quaternion);enemy.halo.scale.setScalar(Math.max(.04,1-progress));
  enemy.halo.material.color.set(remaining<=.2?0xffffff:0xff2a3a);
  enemy.fireCore.visible=charging && remaining<=.2 || elapsed<(enemy.fireFlashUntil||0);
  enemy.aimLine.visible=charging && DIFF.aimLineLead>0 && remaining<=DIFF.aimLineLead;
  if(enemy.aimLine.visible){const a=enemy.mesh.position,b=predictedImpact(enemy),v=enemy.aimLine.geometry.attributes.position;v.setXYZ(0,a.x,a.y,a.z);v.setXYZ(1,b.x,b.y,b.z);v.needsUpdate=true;enemy.aimLine.geometry.computeBoundingSphere();enemy.aimLine.material.opacity=.25+progress*.75;}
  if(charging && DIFF.warningSound && audio?.state==='running' && !enemy.chargeTone){
    const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(280+progress*300,audio.currentTime);osc.frequency.linearRampToValueAtTime(950,audio.currentTime+Math.max(.02,remaining));gain.gain.value=Math.max(.008,.045*(1-enemy.range/40));osc.connect(gain).connect(audio.destination);osc.start();enemy.chargeTone={osc,gain};
  }
  if(!charging)stopChargeSound(enemy);
}
function drawWarningEdges(){
  if(warningCanvas.width!==innerWidth || warningCanvas.height!==innerHeight){warningCanvas.width=innerWidth;warningCanvas.height=innerHeight;}
  const x=warningContext,w=warningCanvas.width,h=warningCanvas.height;x.clearRect(0,0,w,h);
  for(const enemy of targets){if(!DIFF.edgePointers || !enemy.mesh.visible || !enemy.charging || enemy.hp<=0 || enemy.range<7 || enemy.range>28)continue;
    const p=enemy.mesh.position.clone().project(camera);if(Math.abs(p.x)<.82 && Math.abs(p.y)<.82 && p.z<1)continue;
    let dx=p.x,dy=-p.y;if(p.z>1){dx=-dx;dy=-dy;}const k=Math.min((w/2-24)/Math.max(.001,Math.abs(dx)*w/2),(h/2-24)/Math.max(.001,Math.abs(dy)*h/2));
    const sx=w/2+dx*w/2*k,sy=h/2+dy*h/2*k;x.save();x.translate(sx,sy);x.rotate(Math.atan2(dy*h,dx*w));x.globalAlpha=.6+.4*Math.sin(elapsed*12)**2;x.strokeStyle='#ff2a3a';x.shadowColor='#ff2a3a';x.shadowBlur=12;x.lineWidth=4;x.beginPath();x.moveTo(-10,-10);x.lineTo(0,0);x.lineTo(-10,10);x.stroke();x.restore();
  }
  if(incomingWave && DIFF.edgePointers && mode==='play'){ // V13: double chevron on the side a wave is coming from
    const sx=incomingWave.side>0?w-30:30,sy=h*.46;x.save();x.translate(sx,sy);if(incomingWave.side<0)x.scale(-1,1);
    x.globalAlpha=.55+.45*Math.sin(elapsed*10)**2;x.strokeStyle='#ff2a3a';x.shadowColor='#ff2a3a';x.shadowBlur=14;x.lineWidth=5;x.lineCap='round';
    for(const off of [-12,4]){x.beginPath();x.moveTo(off-8,-16);x.lineTo(off+8,0);x.lineTo(off-8,16);x.stroke();}
    x.restore();
  }
  for(let i=hitDirections.length-1;i>=0;i--){const hit=hitDirections[i];if(elapsed>=hit.until){hitDirections.splice(i,1);continue;}const p=hit.source.clone().project(camera);const a=Math.atan2(-p.y,p.x)+(p.z>1?Math.PI:0);x.save();x.translate(w/2,h/2);x.scale(w/2-18,h/2-18);x.strokeStyle='#ff2a3a';x.globalAlpha=(hit.until-elapsed)*2;x.lineWidth=.025;x.beginPath();x.arc(0,0,1,a-.2,a+.2);x.stroke();x.restore();}
}
// V12: finite health economy. All placement and combat values come from DIFFICULTIES.
let earnedDrops=0, exposedDrops=[], leakWarned=false;
const damageEvents=[];
const healthGroups=new Map(), logPrompts=new Set();
function healthFeedback(text,kind) {
  const el=document.createElement('span');el.className='health-feedback '+kind;el.textContent=text;
  ui.health.parentElement.append(el);setTimeout(()=>el.remove(),1300);
}
function leakEnemy(enemy) {
  runStats.leaks++; // V13
  const lost=damage(DIFF.leakDamage,'Enemy got past you',true,true);
  ui.game.classList.remove('leak-flash');void ui.game.offsetWidth;ui.game.classList.add('leak-flash');
  if(lost) healthFeedback('−'+lost+' LEAK','leak');
  if(!leakWarned){leakWarned=true;saveSetting('leakWarningSeen',true);message('Enemies that get past you cost health.',4);}
}
function addHealthDrop(d,lane,earned) {
  if(earned && earnedDrops>=DIFF.earnedDropsMax) return false;
  if(earned) earnedDrops++;
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  x.shadowColor='#63ff9b';x.shadowBlur=14;x.fillStyle='#fff';
  x.fillRect(43,9,42,110);x.fillRect(9,43,110,42);x.shadowBlur=0;x.fillStyle='#20d36c';
  x.fillRect(51,17,26,94);x.fillRect(17,51,94,26);
  const mesh=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}));
  mesh.scale.set(1.35,1.35,1);mesh.position.set(center(d)+lane,.9,-d);scene.add(mesh);
  pickups.push({mesh,d,lane,y:.2,key:'health',expiresAt:earned?elapsed+DIFF.earnedDropFade:undefined});return true;
}
function registerHealthGroup(e){if(!healthGroups.has(e.groupId))healthGroups.set(e.groupId,{members:[],failed:false,rewarded:false});healthGroups.get(e.groupId).members.push(e);}
function completeHealthGroup(enemy){
  const g=healthGroups.get(enemy.groupId);
  if(g && !g.failed && !g.rewarded && g.members.length>=2 && g.members.every(e=>e.hp<=0)) {
    g.rewarded=true;addHealthDrop(Math.max(distance+1.5,enemy.d),enemy.x,true);
  }
}
function reset() {
  for (const list of [targets, bolts, grenades, pickups, coins, effects]) {
    list.forEach(remove);
    list.length = 0;
  }
  clearSpores(); waveCount=0; // V14
  resetFinish(); // V14: before spawning, so the run's stats count this level's enemies
  const lvl=currentLevel;
  if(!lvl.boss){
  targets.push(spawn({d:DIFF.tutorialDistance,type:'moth',x:0,training:true,shooter:false}));
  targets.push(...levelEncounters(lvl).map((e,i)=>{const t=spawn({...e, shooter: e.type==='moth' && ((i*0.618)%1) < DIFF.encounterShooters, firstShot: DIFF.firstShot});if(e.type==='buggy')t.state='wait';return t;}));
  if(lvl.waves.crawler) for(const d of (difficultyKey==='easy'?[520]:[180,520,840])) for(let i=0;i<3;i++) targets.push(spawn({d:d+i*2,type:'beetle',x:(i-1)*1.5,groupId:'pack-'+d}));
  }
  dropCycle=0; earnedDrops=0; healthGroups.clear(); logPrompts.clear(); bumpNotice=0;
  leakWarned=Boolean(activeProfile()?.settings?.leakWarningSeen);
  if(!lvl.boss) for(let i=0;i<DIFF.freeDrops;i++) { let d=finish*DIFF.freeDropFractions[i]; while(hazards.some(h=>Math.abs(h.d-d)<4 && Math.abs(h.x)<2) || solids.some(o=>Math.abs(o.d-d)<4 && Math.abs(o.x)<2)) d+=1; addHealthDrop(d,0,false); }
  exposedDrops=lvl.boss?[]:hazards.filter(h=>h.kind==='thorn' && h.d>finish*.25 && h.d<finish*.8).filter((h,i)=>i%8===0).slice(0,DIFF.earnedDropsMax).map(h=>({d:h.d+3,lane:h.x,spawned:false}));
  for (const e of targets.filter(e=>e.type==='beetle')) { e.groupId ||= 'fixed-'+Math.floor(e.d/80); registerHealthGroup(e); }
  for (const line of coinLines) {
    for (let i=0;i<4;i++) {
      const d=line.d-2.4+i*1.6, lane=line.lane;
      const mesh=makeSprite('icon_coin',.5,{tint:0xffffff}); // V8: coin art
      mesh.position.set(center(d)+lane,0.73,-d); scene.add(mesh);
      mesh.visible=false;
      coins.push({mesh,d,lane,collected:false});
    }
  }
  for (const h of hazards) h.hit=false;
  distance = lateral = jumpY = jumpVel = 0;
  recoilTimer = 0; shake=0; aimSmooth.x = aimSmooth.y = 0;
  incomingWave=null;finalWaveState=0;waveSide=1; // V13
  pressureTimer=DIFF.initialWaveDelay;
  trappedPit=null;
  pointer.set(0,0);
  ui.reticle.style.left=ui.reticle.style.top="50%";
  grounded = true;
  rollTime = rollDir = rollCooldown = rollInvuln = slowTimer = 0;
  currentSpeed = 0;
  score = coinCount = shield = recovery = cooldown = elapsed = 0;
  health = 100;damageEvents.length=0;hitDirections.length=0;
  wallet=rapid=heavy=autoTime=autoCooldown=0;
  charges=DIFF.startCharges; // V7: per difficulty

  AIM_ASSIST_ANGLE=DIFF.aimAssist;
  level=1;
  dual=false;
  bank=progressFor(difficultyKey).coins; if(!weaponUnlocked(weapon)) weapon='rifle'; weaponHud(); // V14
  ui.levelLabel.textContent=lvl.boss?'FOREST BOSS · '+lvl.name.toUpperCase():'LEVEL '+lvl.id+' / 5 · '+lvl.name.toUpperCase();
  if(lvl.boss){ distance=ARENA_D; startBoss(); } else { stopBoss();
  message(lvl.id===1?'W to run · S to stop · Space to jump · Hold left click to fire.':'L'+lvl.id+' · '+lvl.name, 3); }
  place(1);
  updateTargets(0);
  resetSoldier(); // V10
  hud();
}
function setMode(next) {
  mode = next;
  firing = pressShot = powerShot = false;
  if(next!=='play')for(const enemy of targets)stopChargeSound(enemy);
  held.clear();
  ui.game.classList.toggle('active', mode === 'play');
  syncMusic();
  ui.menu.hidden = mode === 'play' || mode === 'finish' || mode === 'results' || mode === 'map';
  ui.results.hidden = mode !== 'results'; // V13
  ui.levelSelect.hidden = mode !== 'map'; // V14
  ui.bossbar.hidden = !(boss.active && (mode === 'play' || mode === 'finish' || mode === 'pause'));
  ui.mapButton.hidden = mode === 'pause';
  if (mode === 'menu' || mode === 'end') refreshMenuWeapons();
  warningCanvas.hidden=mode!=='play';
  ui.reticle.hidden = mode !== 'play';
  ui.hud.hidden = mode === 'menu' || mode === 'results' || mode === 'map';
  ui.levelbar.hidden = mode !== 'play' && mode !== 'finish';
  ui.speedo.hidden = mode !== 'play' && mode !== 'finish';
  if (mode !== 'play') ui.notice.textContent = '';
  if (mode === 'play' || mode === 'finish') ui.start.blur();
  else if (mode === 'results') ui.resultsRetry.focus();
  else if (mode === 'map') ui.start.blur();
  else ui.start.focus();
}
let displayedItems;
function formatTime(t) {
  const m = Math.floor(t / 60), sec = t - m * 60;
  return String(m).padStart(2,'0') + ':' + sec.toFixed(3).padStart(6,'0');
}
function powerHud() { // V11: what is active, and for how long
  const chips = [];
  if (shield > 0) chips.push(['icon_shield', 'SHIELD', 'next hit']);
  if (heavy > 0) chips.push(['icon_power2', 'POWER BOLTS', heavy + ' shots']);
  if (rapid > 0) chips.push(['icon_reload', 'RAPID FIRE', rapid + ' shots']);
  if (autoTime > 0) chips.push(['icon_auto', 'AUTO ATTACK', Math.ceil(autoTime) + ' s']);
  const sig = chips.map(c => c.join(':')).join('|');
  if (sig === powerHud.sig) return;
  powerHud.sig = sig;
  ui.powerbar.replaceChildren(...chips.map(([icon, name, left]) => {
    const el = document.createElement('div'); el.className = 'power-chip';
    el.innerHTML = '<span style="background-image:url(art/sprites/' + icon + '.png)"></span><b>' + name + '</b><small>' + left + '</small>';
    return el;
  }));
}
function hud() {
  powerHud();
  ui.score.textContent = String(score).padStart(4, '0');
  ui.health.firstElementChild.style.width = health + '%';
  ui.health.setAttribute('aria-valuenow', Math.round(health));
  ui.coinCount.textContent = 'COINS ' + (bank + wallet); // V14: banked coins carry over between levels
  ui.speed.textContent = currentSpeed.toFixed(1) + ' m/s';
  ui.distance.textContent = currentLevel.boss ? 'ARENA' : Math.floor(distance) + ' / ' + finish + ' m';
  // v5: Meridian-style HUD — timer top-right, big speed bottom-right, progress bottom-left.
  ui.timer.textContent = formatTime(elapsed);
  ui.speedBig.textContent = Math.round(currentSpeed * 3.6);
  ui.speedbar.style.width = Math.min(100, currentSpeed / RUN_SPEED * 100) + '%';
  ui.progress.style.width = (currentLevel.boss ? Math.max(0, 100 - (boss.hp / (boss.max || 1)) * 100) : Math.min(100, distance / finish * 100)) + '%';
  const activeItems=[
    dual&&'dual',shield&&'shield',rapid>0&&'reload',heavy>0&&'heavy',
    autoTime>0&&'auto',charges>0&&'charge'
  ].filter(Boolean);
  const signature=activeItems.join(',');
  if(signature!==displayedItems){
    ui.activeItems.replaceChildren(...activeItems.map(itemIcon));
    displayedItems=signature;
  }
  ui.shield.textContent = [

    dual && 'DUAL', shield>0 && 'SHIELD', rapid>0 && 'RAPID '+rapid,
    heavy>0 && 'POWER BOLTS '+heavy, autoTime>0 && 'AUTO '+Math.ceil(autoTime)+'s',
    'CHARGES '+charges
  ].filter(Boolean).join(' · ');
}
function showKillPop(text) {
  ui.killpop.textContent = text;
  ui.killpop.classList.remove('show');
  void ui.killpop.offsetWidth;
  ui.killpop.classList.add('show');
}
function end(won) {
  setMode('end');
  const best = recordRun({won, score, coins: coinCount, distance: Math.floor(distance), time: elapsed, difficulty: difficultyKey, level: currentLevel.id});
  if (musicEnabled && audio) music.play(won ? 'win' : 'lose', () => { if (mode === 'end' && musicEnabled) music.play('menu'); });
  if (currentLevel.boss) { bossToneOff(); ui.message.textContent = 'The Beetle Tank won · ' + DIFF.label + ' · tank health ' + Math.ceil(boss.hp) + ' / ' + boss.max + ' · Checkpoint: the fight restarts at the arena'; ui.start.textContent = 'Retry fight'; }
  else { ui.message.textContent = (won ? 'Jungle cleared' : 'Run ended') + ' · L' + currentLevel.id + ' ' + currentLevel.name + ' · ' + DIFF.label + ' · Score ' + score + ' · ' + Math.floor(distance) + ' m' + (best ? ' · New best!' : ''); ui.start.textContent = 'Retry level'; }
  tone(won ? 660 : 150, .35);
}
function damage(amount, cause, bypassRecovery=false, flat=false) {
  // Rolling gives brief invulnerability; the post-hit recovery window
  // (0.75 s) still applies as in the original.
  if ((!bypassRecovery && recovery > 0) || rollInvuln > 0 || mode !== 'play') return 0;
  recovery = .75;
  if (shield > 0) {
    shield = 0;
    message('Shield absorbed the hit');
    tone(480);
    return 0;
  }
  if (!flat) amount = Math.max(1, Math.round(amount * DIFF.hazardScale));

  if(new URLSearchParams(location.search).has('test')) damageEvents.push({amount,cause,distance});
  health = Math.max(0, health - amount);
  shake = Math.max(shake, .22); // v5: damage shake
  message(cause + ' · −' + amount + ' health');
  if (health > 0 && grounded && rollTime <= 0 && currentSpeed < 1.2) soldierAction('hit', 1.4); // V10
  tone(115,.2,.12);
  if (!health) end(false);
  return amount;
}
function place(smoothing) {
  actor.position.set(center(distance) + lateral, jumpY, -distance);
  // v4: mouse aim is a yaw/pitch offset from straight ahead. The soldier
  // turns to face it, the rifle pitches with it, and the camera sits
  // over the soldier's right shoulder (soldier on the left third of frame).
  aimSmooth.x += (pointer.x - aimSmooth.x) * smoothing;
  aimSmooth.y += (pointer.y - aimSmooth.y) * smoothing;
  aimYaw = -aimSmooth.x * .85;
  aimPitch = aimSmooth.y * .65;
  actor.rotation.y = -Math.atan((center(distance+1)-center(distance-1))/2) + aimYaw;
  rifle.rotation.x = -aimPitch * .5;
  rifle.position.z = -.3 + recoilTimer * .9; // v4: recoil kick
  actor.rotation.z = rollTime > 0 && !soldier ? -rollDir * 0.5 : 0; // V10: the roll animation replaces the tilt
  if (!grounded || rollTime > 0) {
    legs[0].rotation.x = -.64;
    legs[1].rotation.x = -.64;
  } else if (currentSpeed > 0.5) {
    legs[0].rotation.x = Math.sin(distance*1.3)*.52;
    legs[1].rotation.x = -legs[0].rotation.x;
  } else {
    legs[0].rotation.x = 0;
    legs[1].rotation.x = 0;
  }
  sun.position.set(actor.position.x-11,17,-distance+4);
  sun.target.position.set(actor.position.x,0,-distance-5);
  const camPos=vector(center(distance)+lateral*.5+1.05,jumpY*.3+2.65,-distance+4.8);
  camera.position.lerp(camPos,smoothing);
  camera.up.set(0,1,0);
  camera.lookAt(center(distance+18)+lateral*.22,1.5,-distance-18);
  camera.updateMatrixWorld();
  actor.updateMatrixWorld();
  ray.setFromCamera(pointer,camera);
  const aimWorld=ray.ray.at(combatRange,vector(0,0,0));
  const aimLocal=actor.worldToLocal(aimWorld).sub(rifle.position).normalize();
  rifle.quaternion.setFromUnitVectors(vector(0,0,-1),aimLocal);
}
// V13: recurring waves. Each wave enters from one side, ~2 s after a warning.
const WAVE_WARNING=2, ENTRANCE_TIME=1.1;
let incomingWave=null, waveSide=1, finalWaveState=0;
let waveCount=0; // V14: per-level wave mix (levels.js waves)
function spawnWave(drones, side, final=false){
  const W=currentLevel.waves, wave=Math.floor(elapsed/5), group='wave-'+wave+'-'+Math.floor(distance)+(final?'-final':'');
  waveCount++;
  drones+=W.extraDrones;
  if(W.buggyEvery && waveCount%W.buggyEvery===0){ // this wave brings a Leaf Buggy as well
    const d=distance+DIFF.waveDistance;
    const b=spawn({d,type:'buggy',x:0,groupId:group}); b.enterAt=Math.max(BUGGY.enterRange[0],DIFF.waveDistance-2); b.state='wait'; targets.push(b); registerHealthGroup(b);
  }
  const count=drones+(W.crawler?1:0); // last one is the crawler
  for(let i=0;i<count;i++){
    const beetleSlot=W.crawler && i===count-1, memberSide=beetleSlot?side:(i%2?-side:side);
    const d=distance+DIFF.waveDistance+i*1.6;
    const enemy=spawn({d,type:beetleSlot?'beetle':'moth',x:beetleSlot?side*2.4:memberSide*(i%3+1.5),
      entrySide:memberSide,shooter:!beetleSlot && i<DIFF.waveShooters+(final?1:0),shotDelay:i*.22,firstShot:DIFF.firstShot,
      groupId:group,drop:beetleSlot?DROP_CYCLE[dropCycle++%DROP_CYCLE.length]:undefined});
    enemy.enter=0;
    if(beetleSlot){const at=vector(center(d)+side*8.5,.6,-d);burst(at,colors.leaves,16);burst(at,colors.lightLeaves,10);}
    targets.push(enemy);registerHealthGroup(enemy);
  }
  incomingWave=null;
}
function announceWave(side){
  incomingWave={side,until:elapsed+WAVE_WARNING+.6};
  waveSound(side);
}
function waveSound(side){
  if(!audio || audio.state!=='running') return;
  const t=audio.currentTime, pan=audio.createStereoPanner?audio.createStereoPanner():null, out=audio.createGain();
  out.gain.value=.9; if(pan){pan.pan.value=side*.85;out.connect(pan).connect(audio.destination);} else out.connect(audio.destination);
  // rotor hum: buzzy low saw with a fast tremolo, rising in pitch and volume
  const osc=audio.createOscillator(),g=audio.createGain(),lfo=audio.createOscillator(),lg=audio.createGain();
  osc.type='sawtooth';osc.frequency.setValueAtTime(70,t);osc.frequency.linearRampToValueAtTime(115,t+WAVE_WARNING);
  lfo.frequency.value=22;lg.gain.value=.5;lfo.connect(lg).connect(g.gain);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+WAVE_WARNING*.9);g.gain.linearRampToValueAtTime(0,t+WAVE_WARNING+.3);
  osc.connect(g).connect(out);osc.start(t);lfo.start(t);osc.stop(t+WAVE_WARNING+.35);lfo.stop(t+WAVE_WARNING+.35);
  // crawler: rustle and crunch of leaves (filtered noise bursts)
  const len=Math.floor(audio.sampleRate*.12),buf=audio.createBuffer(1,len,audio.sampleRate),ch=buf.getChannelData(0);
  for(let i=0;i<len;i++)ch[i]=(Math.random()*2-1)*(1-i/len);
  for(let k=0;k<5;k++){const src=audio.createBufferSource(),f=audio.createBiquadFilter(),ng=audio.createGain(),at=t+.6+k*.28;
    src.buffer=buf;f.type='bandpass';f.frequency.value=1800+k*300;f.Q.value=.8;ng.gain.value=.05+k*.02;
    src.connect(f).connect(ng).connect(out);src.start(at);}
}
function updateTargets(dt) {
  const course=!currentLevel.boss; // V14: the boss arena has no waves, final stretch or finish
  if(course && distance>=DIFF.warmupDistance && distance<finish-DIFF.breatherDistance) pressureTimer-=dt;
  const nearby=targets.filter(e=>e.hp>0 && !e.minor && e.d-distance>-3 && e.d-distance<70).length;
  const waveZone=course && distance>=DIFF.warmupDistance && distance<finish-DIFF.breatherDistance;
  // V13: announce a wave ~2 s before it arrives (sound from its side + edge pointer).
  if(waveZone && !incomingWave && pressureTimer<=WAVE_WARNING && nearby<=DIFF.maxNearby) announceWave(waveSide=-waveSide);
  if(waveZone && pressureTimer<=0 && nearby<=DIFF.maxNearby){
    pressureTimer=DIFF.waveInterval*currentLevel.waves.intervalScale;
    spawnWave(DIFF.waveMoths, incomingWave?.side ?? (waveSide=-waveSide));
  }
  // V13: one final wave as the gate comes into view, then a clear run.
  if(course && finalWaveState===0 && distance>=finish-DIFF.breatherDistance-12){finalWaveState=1;announceWave(waveSide=-waveSide);}
  if(finalWaveState===1 && distance>=finish-DIFF.breatherDistance){finalWaveState=2;spawnWave(DIFF.waveMoths+DIFF.finalWaveExtra,incomingWave?.side ?? waveSide,true);}
  if(incomingWave && elapsed>incomingWave.until) incomingWave=null;
  for (const enemy of targets) {
    if(distance<DIFF.warmupDistance && !enemy.training) {enemy.mesh.visible=false;stopChargeSound(enemy);continue;}
    if(enemy.stun>0) enemy.stun-=dt; // V14: spore cloud stun
    const stunned=enemy.stun>0;
    if(SPECIAL_UPDATE[enemy.type]){ SPECIAL_UPDATE[enemy.type](enemy,dt,stunned); continue; }
    // Zipper moths fly toward the runner, so they close fast.
    if (enemy.type === 'moth' && !stunned && !enemy.training && enemy.hp > 0 && enemy.d-distance<70 && enemy.d-distance>-3) enemy.d -= dt * 3.5;
    if (enemy.walker && !stunned && enemy.hp > 0) enemy.d -= dt * BOSS.brood.crawlerSpeed; // V14: hatched crawlers walk at you
    const previousRange=enemy.range;
    enemy.range = enemy.d - distance;
    if(enemy.hp>0 && !enemy.passed && previousRange>0 && enemy.range<=0){
      enemy.passed=true;
      if(enemy.groupId) healthGroups.get(enemy.groupId).failed=true;
      if(enemy.type!=='turret' || DIFF.turretsPass) leakEnemy(enemy);
    }
    const beat=elapsed*2.7+enemy.d;
    const beetle=enemy.type==='beetle', turret=enemy.type==='turret';
    // Beetles drift toward the runner's lateral position when close.
    if (beetle && !stunned && enemy.hp > 0 && enemy.range < 20 && enemy.range > 0) {
      enemy.x += T.MathUtils.clamp(lateral - enemy.x, -dt * 1.5, dt * 1.5);
    }
    const offset=enemy.training ? 0 : beetle ? enemy.x
      : enemy.x+(turret?0:Math.sin(beat)*1.6)+(enemy.entrySide ? enemy.entrySide*Math.max(0,enemy.range-15)*.17 : 0);
    let y=beetle ? .53 : turret ? 1.0 : 3.0+Math.sin(beat)*.42;
    let drawX=offset;
    if(enemy.enter!==undefined && enemy.enter<1){ // V13: entrances
      enemy.enter=Math.min(1,enemy.enter+dt/ENTRANCE_TIME);
      const e=1-(1-enemy.enter)**3;
      if(beetle) drawX=T.MathUtils.lerp(enemy.entrySide*8.5,offset,e); // bursts out of the foliage at the path edge
      else y+=(1-e)*11; // drops in from above the canopy
    }
    enemy.mesh.position.set(center(enemy.d)+drawX,y,-enemy.d);
    enemy.motion.forEach((wing,i)=>{wing.rotation.z=(i?1:-1)*Math.sin(elapsed*15)*.7;});
    enemy.mesh.visible = enemy.hp > 0 && enemy.range > -3 && enemy.range < FADE_START;
    enemy.art.material.opacity = T.MathUtils.clamp((FADE_START - enemy.range) / (FADE_START - FADE_END), 0, 1); // V13: fade in, no pop
    if (enemy.flash > 0) { enemy.flash = Math.max(0, enemy.flash - dt * 4); enemy.mesh.scale.setScalar(1 + enemy.flash * .18); }
    else enemy.mesh.scale.setScalar(1);
    // V8: hit flash tints the art warm; drones bank as they weave.
    enemy.art.material.color.setRGB(.79 + enemy.flash * .21, .79 - enemy.flash * .35, .79 - enemy.flash * .45);
    if (stunned) enemy.art.material.color.setRGB(.45, .95, .45); // V14: stunned enemies glow toxic green
    if (enemy.type==='moth') enemy.art.material.rotation = Math.cos(beat) * .14;
    const active=enemy.range>0 && enemy.range<=combatRange;
    enemy.weakPoint.visible=enemy.type!=='moth' && active && Math.sin(elapsed*1.5+enemy.d*.2)>.2;
    if(enemy.weakPoint.visible && !enemy.vulnerable) enemy.coreFlare=.18;
    enemy.coreFlare=Math.max(0,(enemy.coreFlare||0)-dt);
    const pulse=1+.1*Math.sin(elapsed*Math.PI*4)+(enemy.coreFlare||0);
    enemy.weakPoint.scale.set(.44*pulse,.44*pulse,1);
    enemy.weakGlow.visible=enemy.weakPoint.visible; enemy.weakGlow.scale.set(.95*pulse,.95*pulse,1);
    enemy.vulnerable=enemy.weakPoint.visible;
    enemy.halo.visible=false;enemy.aimLine.visible=false;enemy.fireCore.visible=elapsed<(enemy.fireFlashUntil||0);
    if (!enemy.mesh.visible || !dt) {stopChargeSound(enemy);continue;}
    // Beetle collision: horizontal proximity while low. Jumping high over
    // a beetle clears it.
    if (beetle && Math.abs(enemy.range) < 1.0 && Math.abs(lateral-enemy.x) < 0.85 && jumpY < 0.9) {
      if(enemy.groupId) healthGroups.get(enemy.groupId).failed=true;
      enemy.hp = 0;
      enemy.mesh.visible = false;
      damage(DIFF.collisionDamage, 'Creature collision', false, true);
    }
    // Only turrets shoot in Phase 1.
    if ((!turret && !(enemy.type==='moth' && enemy.shooter)) || enemy.range > 28 || enemy.range < 7 || stunned) {stopChargeSound(enemy);continue;}
    enemy.shot += dt * (turret?DIFF.turretRate:DIFF.mothRate);
    updateChargeWarning(enemy,turret?DIFF.turretRate:DIFF.mothRate);
    if (enemy.shot < 1.5) continue;
    enemy.shot = -.65; enemy.fireFlashUntil=elapsed+.12;
    enemy.halo.visible = false;enemy.aimLine.visible=false;stopChargeSound(enemy);
    enemy.fireCore.visible=true;
    const start=enemy.mesh.position.clone(), intercept=predictedImpact(enemy);
    const mesh = makeFx('vfx_bolt', 1.3); // V9: painted energy bolt
    mesh.position.copy(start); scene.add(mesh);
    burst(start,colors.danger,6);
    bolts.push({mesh, source:start.clone(), velocity:intercept.sub(start).normalize().multiplyScalar(DIFF.boltSpeed)});
    tone(185,.16);
  }
}

// ---- V14: Forest campaign enemies (brief section 14) ----
// Red ground lane marker: a ribbon that follows the curved path along one lane.
function makeLaneMarker(halfWidth) {
  const N=28, pos=new Float32Array((N+1)*2*3), idx=[];
  for(let i=0;i<N;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setIndex(idx);
  const mesh=new T.Mesh(geo,new T.MeshBasicMaterial({color:0xff2a3a,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false}));
  mesh.renderOrder=5;mesh.frustumCulled=false;scene.add(mesh);
  return {mesh,update(dFrom,dTo,x,opacity){
    for(let i=0;i<=N;i++){const d=dFrom+(dTo-dFrom)*i/N,c=center(d)+x;pos.set([c-halfWidth,.06,-d,c+halfWidth,.06,-d],i*6);}
    geo.attributes.position.needsUpdate=true;geo.computeBoundingSphere();mesh.material.opacity=opacity;mesh.visible=opacity>0;}};
}
function enemyFade(enemy){
  enemy.mesh.visible = enemy.hp > 0 && enemy.range > -3 && enemy.range < FADE_START;
  enemy.art.material.opacity = T.MathUtils.clamp((FADE_START - enemy.range) / (FADE_START - FADE_END), 0, 1);
  if (enemy.flash > 0) { enemy.flash = Math.max(0, enemy.flash - (enemy.lastDt||0) * 4); enemy.mesh.scale.setScalar(1 + enemy.flash * .12); } else enemy.mesh.scale.setScalar(1);
  enemy.art.material.color.setRGB(.79 + enemy.flash * .21, .79 - enemy.flash * .35, .79 - enemy.flash * .45);
  if (enemy.stun > 0) enemy.art.material.color.setRGB(.45, .95, .45);
  enemy.weakPoint.visible = enemy.weakGlow.visible = false; enemy.halo.visible = enemy.aimLine.visible = false;
  for (const p of enemy.parts) { p.glow.visible = enemy.mesh.visible && p.hp > 0; if (p.dot) p.dot.visible = p.glow.visible; const k = 1 + .12 * Math.sin(elapsed * 9 + p.x * 3); p.glow.scale.set(p.glow.userData.s ??= p.glow.scale.x, p.glow.userData.s, 1); p.glow.scale.multiplyScalar(k); }
}
function crossed(enemy, previousRange){ return enemy.hp>0 && !enemy.passed && previousRange>0 && enemy.range<=0; }
function laneFor(x){ return [-3.3,0,3.3].reduce((a,b)=>Math.abs(b-x)<Math.abs(a-x)?b:a); }
const SPECIAL_UPDATE = {
  // Leaf Buggy: enters 45-50 m ahead, shows its lane for 1.5 s, then charges at 10 m/s.
  buggy(e, dt, stunned) {
    e.lastDt = dt;
    const prev = e.range;
    if (e.state === 'wait') {
      e.range = e.d - distance; e.mesh.visible = false;
      if (e.hp > 0 && e.range <= (e.enterAt ?? BUGGY.enterRange[1])) {
        e.state = 'marker'; e.timer = BUGGY.markerTime; e.enter = 0; e.x = laneFor(lateral); e.entrySide = e.x >= 0 ? 1 : -1;
        e.marker ||= makeLaneMarker(BUGGY.laneHalfWidth);
        const at = vector(center(e.d) + e.entrySide * 8.5, .6, -e.d); burst(at, colors.leaves, 14); burst(at, colors.lightLeaves, 8);
        tone(160, .3, .05);
      }
      return;
    }
    if (e.state === 'marker' && !stunned) { e.timer -= dt; if (e.timer <= 0) { e.state = 'charge'; e.speed = 2; tone(120, .4, .06); } }
    if (e.state === 'charge' && !stunned && e.hp > 0) { e.speed = Math.min(BUGGY.chargeSpeed, e.speed + dt * 14); e.d -= e.speed * dt; }
    e.range = e.d - distance;
    if (crossed(e, prev)) {
      e.passed = true;
      if (e.groupId) healthGroups.get(e.groupId).failed = true;
      if (Math.abs(lateral - e.x) < BUGGY.laneHalfWidth + .35 && jumpY < 1.3) {
        e.hp = 0; spawnFx('vfx_explosion_small', e.mesh.position.clone().add(vector(0, 1, 0)), 3, .4);
        const lost = damage(NEW_DAMAGE.buggyRam[difficultyKey], 'Leaf Buggy ram', false, true);
        if (lost) healthFeedback('−' + lost + ' RAM', 'leak');
      } else leakEnemy(e);
    }
    let drawX = e.x;
    if (e.enter < 1) { e.enter = Math.min(1, e.enter + dt / .6); drawX = T.MathUtils.lerp(e.entrySide * 8.5, e.x, 1 - (1 - e.enter) ** 3); }
    e.mesh.position.set(center(e.d) + drawX, e.state === 'charge' ? Math.abs(Math.sin(elapsed * 30)) * .05 : 0, -e.d);
    e.mesh.rotation.y = -Math.atan((center(e.d + 1) - center(e.d - 1)) / 2);
    enemyFade(e);
    const showing = e.hp > 0 && (e.state === 'marker' || e.state === 'charge') && e.range > -2;
    if (showing) e.marker.update(distance - 3, e.d - 1, e.x, (e.state === 'marker' ? .55 : .3) + .25 * Math.sin(elapsed * 14) ** 2);
    else e.marker.mesh.visible = false;
  },
  // Hive bee: hovers 20-25 m ahead and releases 3 mini-drones every 4 s.
  bee(e, dt, stunned) {
    e.lastDt = dt;
    e.range = e.d - distance;
    if (!e.active && e.hp > 0 && e.range <= BEE.hover[1] && !targets.some(o => o !== e && o.type === 'bee' && o.active && o.hp > 0)) { e.active = true; e.release = 1.2; e.leaveAt = elapsed + DIFF.beeHoverTime; message('Hive bee · shoot the glowing belly', 2.4); }
    if (e.active && e.hp > 0 && (distance > finish - 75 || elapsed > e.leaveAt)) { // it flies off after a while, and before the clear run
      e.hp = 0; e.mesh.visible = false; spawnFx('vfx_spark', e.mesh.position, 2, .3); message('The hive bee flew off', 1.2); return;
    }
    if (e.active && e.hp > 0 && !stunned) {
      const want = distance + (BEE.hover[0] + BEE.hover[1]) / 2 + Math.sin(elapsed * .7 + e.seed) * (BEE.hover[1] - BEE.hover[0]) / 2;
      e.d += T.MathUtils.clamp(want - e.d, -dt * 7, dt * 7);
      e.release -= dt;
      if (e.release <= 0) {
        e.release = BEE.releaseEvery;
        for (let i = 0; i < BEE.minis; i++) {
          const m = spawn({d: e.d - .5, type: 'mini', x: e.drawX + (i - 1) * 1.4, minor: true, groupId: undefined});
          m.y0 = e.mesh.position.y - .4; m.seed = i * 2.1 + e.d; m.enter = 0; targets.push(m);
        }
        burst(e.mesh.position, colors.gold, 10); tone(520, .12, .05);
      }
    }
    e.range = e.d - distance;
    e.drawX = e.x + (stunned ? 0 : Math.sin(elapsed * 1.1 + e.seed) * 1.6);
    e.mesh.position.set(center(e.d) + e.drawX, 3.7 + Math.sin(elapsed * 2.3 + e.seed) * .3, -e.d);
    enemyFade(e);
    e.art.material.rotation = Math.sin(elapsed * 1.7 + e.seed) * .08;
  },
  // Mini-drone: half-size drone, 1 HP, never shoots; flies at you and leaks.
  mini(e, dt, stunned) {
    e.lastDt = dt;
    const prev = e.range;
    if (!stunned && e.hp > 0) e.d -= dt * MINI.speed;
    e.range = e.d - distance;
    if (crossed(e, prev)) {
      e.passed = true;
      const lost = damage(NEW_DAMAGE.miniLeak[difficultyKey], 'Mini-drone got past', true, true);
      if (lost) healthFeedback('−' + lost + ' LEAK', 'leak');
    }
    e.enter = Math.min(1, (e.enter ?? 1) + dt / .5);
    const y = T.MathUtils.lerp(e.y0 ?? 3, 2.3 + Math.sin(elapsed * 5 + e.seed) * .25, e.enter);
    e.mesh.position.set(center(e.d) + e.x + (stunned ? 0 : Math.sin(elapsed * 3.3 + e.seed) * .9), y, -e.d);
    enemyFade(e);
    if (e.range < -3) e.hp = 0;
  },
  // Spore mushroom: shoot it to release a stunning cloud.
  mushroom(e, dt) {
    e.lastDt = dt;
    e.range = e.d - distance;
    e.mesh.position.set(center(e.d) + e.x, 0, -e.d);
    enemyFade(e);
  }
};
// Spore clouds: stun enemies within 4 m for 2 s; the soldier walking through is slowed by 40%.
const sporeClouds = [];
function releaseSpores(at) {
  const fx = new T.Sprite(new T.SpriteMaterial({map: spriteTexture('jungle-biome/vfx_spore_cloud_green'), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false}));
  fx.scale.set(7, 7 / SPRITE_ASPECT['jungle-biome/vfx_spore_cloud_green'], 1); fx.position.copy(at).setY(1.3); scene.add(fx);
  const cloud = {mesh: fx, at: fx.position.clone(), d: -at.z, until: elapsed + MUSHROOM.cloudTime, stunned: new Set()};
  sporeClouds.push(cloud); stunNear(cloud);
  tone(240, .35, .06); message('Spore cloud · enemies inside are stunned', 1.6);
}
function stunNear(cloud) {
  for (const e of targets) {
    if (e.hp <= 0 || e.type === 'mushroom' || cloud.stunned.has(e)) continue;
    const p = e.mesh.position;
    if (Math.hypot(p.x - cloud.at.x, p.z - cloud.at.z) < MUSHROOM.stunRadius) { e.stun = MUSHROOM.stunTime; cloud.stunned.add(e); e.charging = false; stopChargeSound(e); }
  }
}
function updateSpores(dt) {
  for (let i = sporeClouds.length - 1; i >= 0; i--) {
    const c = sporeClouds[i], left = c.until - elapsed;
    if (left <= 0) { scene.remove(c.mesh); sporeClouds.splice(i, 1); continue; }
    c.mesh.material.opacity = Math.min(1, left / .6, (MUSHROOM.cloudTime - left) / .25 + .2);
    c.mesh.scale.set(7 + (MUSHROOM.cloudTime - left) * .6, (7 + (MUSHROOM.cloudTime - left) * .6) / SPRITE_ASPECT['jungle-biome/vfx_spore_cloud_green'], 1);
    stunNear(c);
  }
}
function inSporeCloud() {
  const x = center(distance) + lateral;
  return sporeClouds.some(c => Math.hypot(c.at.x - x, c.at.z + distance) < MUSHROOM.cloudRadius);
}
function clearSpores() { for (const c of sporeClouds) scene.remove(c.mesh); sporeClouds.length = 0; }
function tracer(from, to, mat = colors.gold) {
  const mesh = beam(scene,from,to,heavy > 0 ? .04 : .024,mat);
  effects.push({mesh, life:.075});
}
function burst(at, material, count) {
  for(let i=0;i<count;i++){
    const angle=i*2.399;
    const speed=1.6+random()*3.8;
    const mesh=shape(scene,orb,material,...at,.072,.072,.072);
    effects.push({mesh,life:.24+random()*.34,
      velocity:vector(Math.cos(angle)*speed,1+random()*3,Math.sin(angle)*speed)});
  }
}
function strike(enemy, amount) {
  if (enemy.hp<=0) return;
  enemy.hp-=amount;
  enemy.flash = 1; // v5: hit flash (scale pulse, see updateTargets)
  burst(enemy.mesh.position,enemy.hp>0?colors.gold:enemy.halo.material,enemy.hp>0?7:15);
  if (enemy.hp>0) {
    const hitText={buggy:'Armored · shoot the glowing seed pods',bee:'Hit · the glowing belly takes double',mini:'Hit'}[enemy.type]; // V14
    message(hitText || (enemy.type==='moth'?'Hit':enemy.vulnerable?'Core exposed':'Armored · aim for the glowing core'),.75);
    return;
  }
  enemy.mesh.visible=false;enemy.aimLine.visible=false;enemy.halo.visible=false;stopChargeSound(enemy);
  if(enemy.marker) enemy.marker.mesh.visible=false;
  if(enemy.type==='mushroom'){ releaseSpores(enemy.mesh.position.clone()); return; } // V14
  if(!enemy.training && !enemy.minor) runStats.kills++; // V13
  const points={moth:100,buggy:220,bee:250,mini:25}[enemy.type] ?? 180; // V14
  spawnFx('vfx_explosion_small', enemy.mesh.position.clone().add(vector(0,enemy.type==='buggy'?1.2:0,0)), enemy.type==='moth' ? 2.2 : enemy.type==='mini' ? 1.4 : 3, .4); // V9
  score+=points;
  showKillPop('+'+points); // v5: kill popup
  tone(720);
  completeHealthGroup(enemy);
  if (!enemy.drop) return;
  // Drops land on the ground ahead, on the enemy's lateral line.
  const d=enemy.d+13, lane=enemy.x;
  if (d>=finish) return;
  const mesh=makeSprite(ICON_ART[enemy.drop]||'icon_power2',.95,{tint:0xffffff}); // V8: icon art
  mesh.position.set(center(d)+lane,0.7,-d); scene.add(mesh);
  pickups.push({mesh,d,lane,y:0,key:enemy.drop});
  message(dropNames[enemy.drop]+' ahead · '+(lane<0?'left':lane>0?'right':'center'));
}
// v4: direct line-of-sight rifle fire. The hit is a raycast from the
// camera centre — what the centre reticle is on is what gets hit. No arc,
// no drop. A fast tracer from the rifle muzzle to the hit point, a muzzle
// flash and a short recoil make the shot visible without slowing it down.
function fireBullet(direction,muzzle,damage,assist=true){
  const dir=direction.clone().normalize();
  // The camera selects an aim point. The muzzle owns the actual bullet path.
  const cameraRay=new T.Raycaster(camera.position,dir,0,combatRange);
  const candidates=targets.filter(e=>e.hp>0 && e.mesh.visible && e.range>0 && e.range<=combatRange);
  // V14: hit parts. Bodies and V13 weak points as before, plus seed pods, bee bellies and the boss.
  const parts=[];
  for(const e of candidates){parts.push({mesh:e.body,e});if(e.weakPoint.visible)parts.push({mesh:e.weakPoint,e});for(const p of e.parts)if(p.hp>0)parts.push({mesh:p.mesh,e,part:p});}
  if(boss.active) parts.push(...bossParts());
  const hitMeshes=parts.map(p=>p.mesh);
  cameraRay.camera=camera;
  const sight=cameraRay.intersectObjects([...hitMeshes,...shotBlockers],false)[0];
  const aimPoint=sight?.point ?? camera.position.clone().addScaledVector(dir,combatRange);
  const shotDirection=aimPoint.clone().sub(muzzle).normalize();
  const bulletRay=new T.Raycaster(muzzle,shotDirection,0,combatRange);
  bulletRay.camera=camera;
  const hit=bulletRay.intersectObjects([...hitMeshes,...shotBlockers],false)[0];
  const hitPoint=hit?.point ?? muzzle.clone().addScaledVector(shotDirection,combatRange);
  tracer(muzzle,hitPoint,heavy>0?colors.danger:colors.gold); // V11: power bolts fire red tracers
  burst(muzzle,colors.gold,2);
  muzzleLight.position.copy(muzzle);
  muzzleLight.intensity=26;
  muzzleGlow.material.opacity=.95;
  recoilTimer=.08;
  tone(420,.05);
  if(!hit) return;
  burst(hitPoint,colors.gold,5);
  spawnFx('vfx_spark', hitPoint, .9, .12); // V9
  const part=parts.find(p=>p.mesh===hit.object);
  if(!part) return;
  if(part.boss){ bossHit(part,damage); hitMarkerTimer=.15; ui.reticle.classList.add('hit'); return; }
  const enemy=part.e;
  if(part.part){ strikePart(enemy,part.part,damage); }
  else if(enemy.type==='buggy') strike(enemy,damage*.35); // armour; the seed pods are the weak point
  else if(enemy.type==='bee'||enemy.type==='mini'||enemy.type==='mushroom') strike(enemy,damage);
  else {
  const core=enemy.vulnerable && hitPoint.distanceTo(enemy.weakPoint.getWorldPosition(vector(0,0,0)))<.32;
  strike(enemy,enemy.type==='moth'?damage:core?damage*3:damage*.35);
  }
  hitMarkerTimer=.15;
  ui.reticle.classList.add('hit');
  if(enemy.hp<=0){killMarkerTimer=.3;ui.reticle.classList.add('kill');}
}
function strikePart(enemy, p, amount) { // V14
  if (p.belly) { strike(enemy, amount * BEE.bellyMultiplier); return; }
  const dealt = Math.min(p.hp, amount); p.hp -= amount;
  burst(p.mesh.getWorldPosition(vector(0,0,0)), colors.lightLeaves, 6);
  if (p.hp <= 0) { p.glow.visible = false; spawnFx('vfx_spark', p.mesh.getWorldPosition(vector(0,0,0)), 1.2, .2); tone(980, .06, .04); }
  strike(enemy, dealt);
}
// v4: grenade Power Attack — visible lobbed grenade, explodes on impact
// (or on landing) for damage 3 in a small area. Charges unchanged.
function throwGrenade(origin, direction) {
  const mesh = new T.Group();
  shape(mesh, smoothOrb, colors.vest, 0, 0, 0, .16, .16, .16);
  shape(mesh, smoothOrb, darkMetal, 0, .16, 0, .06, .06, .06);
  mesh.position.copy(origin);
  scene.add(mesh);
  grenades.push({mesh,
    velocity: direction.clone().normalize().multiplyScalar(GRENADE_SPEED).add(vector(0, 5, 0)),
    life: 0});
  tone(150, .2, .1);
}
function explodeGrenade(g) {
  burst(g.mesh.position, colors.danger, 22);
  burst(g.mesh.position, colors.gold, 12);
  spawnFx('vfx_explosion_big', g.mesh.position, GRENADE_RADIUS * 2, .65); // V9: replaces a glow that was never removed
  shake = Math.max(shake, .18); // v5: explosion shake
  tone(90, .4, .15);
  for (const e of targets) {
    if (e.hp > 0 && e.mesh.position.distanceTo(g.mesh.position) < GRENADE_RADIUS) strike(e, 3);
  }
  // V14: a grenade clears every mini-drone near the blast
  for (const e of targets) if (e.hp > 0 && e.type === 'mini' && e.mesh.position.distanceTo(g.mesh.position) < BEE.grenadeClearRadius) strike(e, 3);
  if (boss.active) bossGrenade(g.mesh.position);
}
function shoot(dt) {
  const candidates = targets.filter(e => e.mesh.visible && e.range > 0 && e.range<=combatRange);
  scene.updateMatrixWorld();
  // v4: reticle is locked to the screen centre; the ray is cast from there.
  ray.setFromCamera(pointer, camera);
  const direction = ray.ray.direction.clone();
  const first = ray.intersectObjects(candidates.map(e => e.body), false)[0];
  const highlighted = first ? candidates.find(e => e.body === first.object) : null;
  for (const e of candidates) e.targetRing.visible = (e === highlighted);
  ui.reticle.classList.toggle('target', Boolean(first));
  cooldown -= dt;
  autoCooldown -= dt;
  const origin = rifle.localToWorld(vector(0, 0, -.62));
  if (powerShot && charges > 0) {
    charges--;
    throwGrenade(origin, direction);
    if (grounded && rollTime <= 0 && currentSpeed < 1.2) soldierAction('grenade', 1.7); // V10
  }
  powerShot = false;
  if ((pressShot || firing) && cooldown <= 0) {
    const w = WEAPONS[weapon]; // V14: rifle or Triple Shot
    cooldown = rapid > 0 ? .09 : weapon === 'rifle' ? FIRE_COOLDOWN : w.cooldown;
    rapid = Math.max(0, rapid - 1);
    heavy = Math.max(0, heavy - 1);
    const damage = Math.min(3, level + Number(heavy > 0)) >= 2 ? 2 : 1;
    if (weapon === 'rifle') fireBullet(direction, origin, damage);
    else for (const yaw of w.pellets) fireBullet(direction.clone().applyAxisAngle(vector(0, 1, 0), yaw), origin, damage);
    if (dual) fireBullet(direction.clone().applyAxisAngle(vector(0, 1, 0), .02), rifle.localToWorld(vector(-.3, 0, -.62)), damage);
  }
  pressShot = false;
  if (autoTime > 0 && autoCooldown <= 0) {
    const target = candidates.find(e => e.hp > 0 && e.range < 36 && e.type !== 'mushroom');
    if (target) {
      autoCooldown = .85;
      // v4: auto-attack fires a real bullet straight at the target.
      fireBullet(target.mesh.position.clone().sub(origin).normalize(), origin, 1, false);
    }
  }
}
function boltBlocked(pos) { // V14
  const d = -pos.z, lat = pos.x - center(d);
  for (const o of solids) {
    if (!o.cover || Math.abs(o.d - d) > o.hd + .2 || Math.abs(lat - o.x) > o.hw + .1 || pos.y > o.h + .05) continue;
    if (o.arena) coverHit(o);
    return true;
  }
  return false;
}
function startRoll(dir) {
  if(trappedPit) return;
  if (rollCooldown > 0 || rollTime > 0) return;
  rollDir = dir;
  rollTime = ROLL_TIME;
  rollCooldown = ROLL_COOLDOWN;
  rollInvuln = ROLL_INVULN;
  message(dir < 0 ? 'Roll left' : 'Roll right', .6);
}
// V11: push the soldier out of solid obstacles (cover, logs, rock piles, arch pillars).
let bumpNotice = 0;
function resolveSolids() {
  const R = .35;
  for (const list of [solids, archPillars]) for (const o of list) {
    if (Math.abs(o.d - distance) > o.hd + R + .5 || jumpY >= o.h - .1) continue;
    const dx = lateral - o.x, dd = distance - o.d;
    const px = o.hw + R - Math.abs(dx), pd = o.hd + R - Math.abs(dd);
    if (px <= 0 || pd <= 0) continue;
    if (pd < px) {
      distance = o.d + (dd < 0 ? -1 : 1) * (o.hd + R);
      if (dd < 0) {
        currentSpeed = 0;
        if (elapsed > bumpNotice) { message(o.h < 1 ? 'Blocked · jump over it' : o.h < 2 ? 'Blocked · go around or jump' : 'Blocked · go through the arch', 1.2); bumpNotice = elapsed + 1.5; tone(140, .06, .05); shake=Math.max(shake,.15); soldierAction('hit',1.4); }
      }
    } else lateral = o.x + (dx < 0 ? -1 : 1) * (o.hw + R);
  }
}
function updateEffects(dt) {
  for (let i=effects.length-1;i>=0;i--) {
    const effect=effects[i];
    if(effect.fx){ // V9: effect sprites grow and fade
      const t = 1 - Math.max(0, effect.life) / effect.max;
      effect.mesh.material.opacity = 1 - t * t;
      effect.mesh.scale.setScalar(effect.size * (.65 + t * .55));
    }
    if(effect.velocity){
      effect.velocity.y-=8*dt;
      effect.mesh.position.addScaledVector(effect.velocity,dt);
      effect.mesh.scale.multiplyScalar(Math.exp(-dt*3.8));
    }
    effect.life-=dt;
    if (effects[i].life > 0) continue;
    remove(effects[i]);
    effects.splice(i,1);
  }
}
function update(dt) {
  elapsed += dt;
  // --- Ground movement: W runs, S brakes, release slows to a stop.
  // No auto-run. ---
  const forward = held.has('KeyW') || held.has('ArrowUp');
  const brake = held.has('KeyS') || held.has('ArrowDown');
  let targetSpeed = forward ? RUN_SPEED : 0;
  if (brake) targetSpeed = 0;
  if (slowTimer > 0) { targetSpeed *= 0.5; slowTimer -= dt; }
  if (jumpY < .4 && softZones.some(z => Math.abs(z.d - distance) < z.hd && Math.abs(z.x - lateral) < z.hw)) targetSpeed *= .8; // V11: ferns
  const spored = sporeClouds.length > 0 && inSporeCloud(); // V14: walking through a spore cloud slows you by 40%
  if (spored) targetSpeed *= 1 - MUSHROOM.soldierSlow;
  if (currentLevel.boss && brake) targetSpeed = -STRAFE_SPEED; // V14: in the arena S steps back
  const rate = targetSpeed > currentSpeed ? 5 : 8;
  currentSpeed = T.MathUtils.lerp(currentSpeed,targetSpeed,1-Math.exp(-dt*rate));
  const right = held.has('KeyD') || held.has('ArrowRight');
  const left = held.has('KeyA') || held.has('ArrowLeft');
  const turn=Number(right)-Number(left);
  if (rollTime > 0) {
    lateral += rollDir * ROLL_SPEED * dt;
    rollTime -= dt;
    if (rollTime <= 0) rollDir = 0;
  } else {
    lateral += turn * STRAFE_SPEED * (spored ? 1 - MUSHROOM.soldierSlow : 1) * dt;
  }
  const half = currentLevel.boss ? BOSS.arenaHalfWidth : CORRIDOR_HALF; // V14: the arena is 16 m wide
  lateral = T.MathUtils.clamp(lateral, -half, half);
  rollCooldown -= dt;
  rollInvuln -= dt;
  const previousDistance = distance;
  if(trappedPit){
    currentSpeed=0;
    distance=trappedPit.d;
  } else {
    distance+=dt*currentSpeed;
    resolveSolids();
    if (currentLevel.boss) distance = T.MathUtils.clamp(distance, ARENA_D - BOSS.stepRange, ARENA_D + BOSS.stepRange); // forward running stops in the arena
  }
  // --- Jump physics ---
  if (!grounded) {
    jumpVel -= GRAVITY * dt;
    jumpY += jumpVel * dt;
    const floor=trappedPit?-1.8:0;
    if(jumpY<=floor){jumpY=floor;jumpVel=0;grounded=true;}
  }
  if(trappedPit){
    const offset=lateral-trappedPit.x;
    if(jumpY>=.08 && Math.abs(offset)>1.98){
      trappedPit=null;
      message('Escaped the pit');
    } else {
      const limit=jumpY>.08?2.2:1.35;
      lateral=T.MathUtils.clamp(lateral,trappedPit.x-limit,trappedPit.x+limit);
    }
  }
  // --- Hazards: checked once, as the runner crosses each one ---
  for (const h of hazards) {
    if (h.hit || previousDistance >= h.d || distance < h.d) continue;
    h.hit = true;
    if (false && h.kind === 'log') { // V11: logs are solid now (resolveSolids)
      // v3: logs no longer damage — hitting one is a stumble (brief slow only).
      slowTimer = 1.2;
      message('Stumbled over a log · no damage', 1.2);
      tone(180,.12,.06);
    } else if(false && h.kind==='cover'){ // V11: cover is solid now (resolveSolids)
      damage(15,'Trunk collision');
      slowTimer=1;
    } else if (h.kind === 'thorn' && Math.abs(lateral - h.x) < 1.2 && jumpY < 1.0) {
      // v3: thorny bushes are the damage hazard (20). Jump the log at the
      // centre and steer around them; only a very high jump (jumpY >= 1.0)
      // clears the thorns.
      damage(20, 'Thorn bush');
      slowTimer = 1;
    } else if (h.kind === 'pothole' && jumpY < 0.5 && Math.abs(lateral - h.x) < 1.7) {
      damage(25, 'Pothole');
      trappedPit=h;
      distance=h.d;
      currentSpeed=0;
      grounded=false;
      jumpVel=-1;
      rollTime=rollInvuln=0;
      message('In a pit · Space + A / D to climb out',4);
    }
  }
  if(!trappedPit && jumpY<.35 && jumpVel<=0){
    const pit=hazards.find(h=>h.kind==='pothole' &&
      Math.hypot(distance-h.d,lateral-h.x)<1.65);
    if(pit){
      trappedPit=pit;pit.hit=true;distance=pit.d;currentSpeed=0;
      grounded=false;jumpVel=-1;rollTime=rollInvuln=0;
      damage(25,'Fell into pit');
      message('In a pit · Space + A / D to climb out',4);
    }
  }
  recovery -= dt;
  recoilTimer = Math.max(0, recoilTimer - dt); // v3
  autoTime-=dt;
  notice -= dt;
  if (notice <= 0) ui.notice.textContent = '';
  place(1 - Math.exp(-dt*9));
  updateTargets(dt);
  updateSpores(dt); // V14
  if (boss.active) updateBoss(dt); // V14
  if (mode !== 'play') {drawWarningEdges();hud();return;}
  drawWarningEdges();
  updateLanternLights();
  shoot(dt);
  // v4: fly the grenades — lobbed arc, explode on impact or landing.
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i];
    g.life += dt;
    g.velocity.y -= GRENADE_GRAVITY * dt;
    g.mesh.position.addScaledVector(g.velocity, dt);
    g.mesh.rotation.x += dt * 9;
    let boom = g.life > 2.5 || g.mesh.position.y <= .15;
    if (!boom) for (const e of targets) {
      if (e.hp > 0 && e.type !== 'mushroom' && g.mesh.position.distanceTo(e.mesh.position) < 1.2) { boom = true; break; }
    }
    if (!boom && boss.active && bossNear(g.mesh.position)) boom = true; // V14
    if (boom) {
      explodeGrenade(g);
      remove(g);
      grenades.splice(i, 1);
    }
  }
  hitMarkerTimer -= dt; killMarkerTimer -= dt;
  if (hitMarkerTimer <= 0) ui.reticle.classList.remove('hit');
  if (killMarkerTimer <= 0) ui.reticle.classList.remove('kill');
  for (let i=bolts.length-1;i>=0;i--) {
    const bolt = bolts[i];
    bolt.mesh.position.addScaledVector(bolt.velocity,dt);
    { // V9: point the streak along its on-screen direction
      const a = bolt.mesh.position.clone().project(camera), b = bolt.mesh.position.clone().addScaledVector(bolt.velocity, .05).project(camera);
      bolt.mesh.material.rotation = Math.atan2(b.y - a.y, (b.x - a.x) * camera.aspect);
    }
    const hit = bolt.mesh.position.distanceTo(vector(actor.position.x,actor.position.y+.85,-distance)) < .67;
    if (hit) {burst(bolt.mesh.position,colors.danger,7);const lost=damage(DIFF.shotDamage,bolt.cause||'Projectile hit',false,true);if(lost) hitDirections.push({source:bolt.source.clone(),until:elapsed+.5});}
    const blocked = !hit && currentLevel.coverBlocksShots && boltBlocked(bolt.mesh.position); // V14: cover stops enemy fire
    if (blocked) {burst(bolt.mesh.position,colors.gold,6);spawnFx('vfx_spark',bolt.mesh.position,1,.15);tone(300,.05,.03);}
    if (hit || blocked || bolt.mesh.position.z > actor.position.z + 8) {
      remove(bolt);
      bolts.splice(i,1);
    }
  }
  for(const item of exposedDrops) if(!item.spawned && item.d-distance<=DIFF.healRevealDistance && item.d>distance) { item.spawned=true; addHealthDrop(item.d,item.lane,true); }
  for(const [i,h] of hazards.filter(h=>h.kind==='log').entries()) if(i<DIFF.jumpPrompts && h.d-distance>0 && h.d-distance<=DIFF.logPromptDistance && !logPrompts.has(h)) {logPrompts.add(h); message('JUMP · log ahead',1.1);}
  for (let i=pickups.length-1;i>=0;i--) {
    const item = pickups[i];
    if(item.key==='health') item.mesh.material.rotation=Math.sin(elapsed*1.6)*.12; else item.mesh.rotation.y += dt*3;
    item.mesh.position.y = item.y+.7+Math.sin(elapsed*6)*.15;
    const expired=item.expiresAt!==undefined && elapsed>=item.expiresAt;
    const collected = !expired && Math.abs(distance-item.d)<1.1 && Math.abs(lateral-item.lane)<(item.key==='health'?DIFF.healCollectRadius:.85) && jumpY>=0 && jumpY<.8;
    if (collected) {
      collectDrop(item.key);
    }
    if (collected || distance>item.d+3 || expired) {
      remove(item);
      pickups.splice(i,1);
    }
  }
  updateEffects(dt); // V13: shared with the finish sequence
  for (const coin of coins) {
    const gap = coin.d-distance;
    coin.mesh.visible = !coin.collected && gap > -2 && gap < 55;
    if (!coin.mesh.visible) continue;
    coin.mesh.rotateZ(dt * 4);
    if (Math.abs(gap)<.85 && Math.abs(lateral-coin.lane)<.62 && jumpY>=0 && jumpY<1) {
      coin.collected=true;
      coin.mesh.visible=false;
      coinCount++;
      spawnFx('vfx_coin', coin.mesh.position, .9, .3); // V9
      wallet++;
      score+=25;
      tone(1040,.07,.025);
    }
  }
  if (!currentLevel.boss) {
    updateFinishApproach();
    if (distance >= finish && mode === 'play') startFinish(); // V13: celebration, then results
  }
  hud();
}

function aim(event) {
  // v4: mouse position (relative to screen centre) is the aim offset;
  // the reticle itself stays locked to the centre of the screen.
  pointer.set(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2);
  ui.reticle.style.left = event.clientX+'px';
  ui.reticle.style.top = event.clientY+'px';
}
function pause() {
  if (mode !== 'play') return;
  setMode('pause');
  ui.message.textContent = 'Run paused';
  ui.start.textContent = 'Resume run';
}
ui.start.onclick = event => {
  resumed = mode === 'pause';
  if (!audio && window.AudioContext) audio = new AudioContext();
  audio?.resume().catch(() => {});
  if (resumed) { setMode('play'); return; } // Start and resume keep the last aim instead of aiming at the menu button.
  setDifficulty(ui.difficulty.value);
  if (mode === 'end') { startLevel(currentLevel.id); return; } // V14: retry the level (the boss restarts at the arena)
  openMap(); // V14: the title screen leads to the level-select map
};
addEventListener('pointermove', aim);
// V11: browsers only allow sound after a click or key press; start the menu theme then.
const wakeAudio = () => {
  if (!audio && window.AudioContext) audio = new AudioContext();
  audio?.resume().catch(() => {});
  syncMusic();
  removeEventListener('pointerdown', wakeAudio); removeEventListener('keydown', wakeAudio);
};
addEventListener('pointerdown', wakeAudio); addEventListener('keydown', wakeAudio);
renderer.domElement.addEventListener('pointerdown', e => {
  if (mode !== 'play') return;
  aim(e);
  if (e.button === 0) {
    firing = true;
    pressShot = true;
  } else if (e.button === 2) {
    powerShot = true; // right click = Power Attack
  }
});
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('pointerup', () => {firing = false;});
addEventListener('pointercancel', () => {firing = false;});
addEventListener('keydown', e => {
  if (mode === 'play' && movementKeys.has(e.code)) {
    e.preventDefault();
    held.add(e.code);
    // Double-tap A/D (or Left/Right) to roll, within 300 ms.
    if (!e.repeat && (e.code==='KeyA' || e.code==='KeyD' || e.code==='ArrowLeft' || e.code==='ArrowRight')) {
      const now = performance.now();
      const dir = (e.code==='KeyD' || e.code==='ArrowRight') ? 1 : -1;
      if (now - (lastTap[e.code] || 0) < 300) startRoll(dir);
      lastTap[e.code] = now;
    }
  }
  if (mode==='play' && e.code==='Space') {
    e.preventDefault();
    if (!e.repeat && grounded) {
      grounded = false;
      jumpVel = trappedPit ? 10.5 : JUMP_VELOCITY;
    }
  }
  if (mode==='play' && e.code==='KeyE') {
    e.preventDefault();
    if (!e.repeat) powerShot=true; // E = Power Attack (was Space)
  }
  if (mode==='play' && e.code==='KeyQ' && !e.repeat) { e.preventDefault(); swapWeapon(); } // V14
  if (e.code==='KeyM' && !e.repeat) toggleMusic();
  if (e.code === 'Escape') pause();
});
addEventListener('keyup', e => held.delete(e.code));
addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => {if (document.hidden) pause();});
const panorama = new T.TextureLoader().load('art/sprites/sky_jungle_sunrise.jpg', texture => {
  texture.colorSpace=T.SRGBColorSpace;
  if(lightingKey==='sunrise') scene.background=texture; // V14: dusk and night use their own skies
  resizePanorama();
});
function resizePanorama() {
  if(!panorama.image) return;
  const imageAspect=panorama.image.width/panorama.image.height;
  const x=Math.min(1,camera.aspect/imageAspect);
  const y=Math.min(1,imageAspect/camera.aspect);
  panorama.repeat.set(x,y);
  panorama.offset.set((1-x)/2,(1-y)/2);
}
function resize() {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  resizePanorama();
}
addEventListener('resize',resize);
resize();
ui.reticle.style.left = ui.reticle.style.top = '50%';
place(1);
applyQuality(ui.quality.value); // v5: High by default (4096 shadows)
// ---- V13: finish line, celebration and results ----
const runStats={kills:0,spawned:0,leaks:0};
let finishT=0, finishCam=null, stretchShown=false, resultsTimer=null;
const CONFETTI=[0xffcc63,0x6faf5a,0xff623e,0xf2d3a0,0x22d3ee].map(c=>new T.MeshBasicMaterial({color:c,side:T.DoubleSide}));
function resetFinish(){
  runStats.kills=runStats.spawned=runStats.leaks=0;
  finishT=0;finishCam=null;stretchShown=false;clearTimeout(resultsTimer);
  ui.stretchBanner.classList.remove('show');
  for(const g of gateLanterns) g.scale.setScalar(2.6);
}
function updateFinishApproach(){
  const toGate=finish-distance;
  gateMat.opacity=T.MathUtils.clamp((180-toGate)/30,0,1); // gate (and its lanterns) appear from ~150 m
  for(const g of gateLanterns){g.visible=gateMat.opacity>0;g.material.opacity=.85*gateMat.opacity;}
  if(!stretchShown && toGate<=100){
    stretchShown=true;
    ui.stretchBanner.classList.remove('show');void ui.stretchBanner.offsetWidth;ui.stretchBanner.classList.add('show');
    music.lift(1.12);tone(660,.12,.06);setTimeout(()=>tone(880,.18,.06),130);
  }
}
function startFinish(){
  mode='finish';finishT=0;
  firing=pressShot=powerShot=false;held.clear();
  ui.reticle.hidden=true;warningCanvas.hidden=true;ui.notice.textContent='';ui.stretchBanner.classList.remove('show');
  // every enemy still alive vanishes; nothing can hurt the soldier now
  for(const e of targets){stopChargeSound(e);if(e.hp>0){if(e.mesh.visible)spawnFx('vfx_explosion_small',e.mesh.position,1.6,.35);e.hp=0;e.mesh.visible=false;}e.aimLine.visible=false;e.halo.visible=false;}
  for(const b of bolts)remove(b);bolts.length=0;
  incomingWave=null;
  // confetti and leaves burst from the banner
  const top=finishGate.position.clone().add(vector(0,GATE_H*.32,0));
  for(let i=0;i<90;i++){
    const m=shape(scene,box,i%3?CONFETTI[i%CONFETTI.length]:colors.lightLeaves,top.x+(random()-.5)*7,top.y,top.z+(random()-.5),.12,.02,.08);
    m.rotation.set(random()*6,random()*6,random()*6);
    effects.push({mesh:m,life:1.6+random()*1.2,velocity:vector((random()-.5)*7,2+random()*5,2+random()*5)});
  }
  spawnFx('vfx_heal',top,4,.6);
  if(musicEnabled && audio) music.play('win',()=>{if(mode==='results'&&musicEnabled)music.play('menu');});
  tone(990,.25,.07);
}
function finishUpdate(dt){
  if(currentLevel.boss){ bossFinishUpdate(dt); return; } // V14
  finishT+=dt;
  const slow=finishT<.6?.3:1, g=dt*slow; // 0.6 s of slow motion as he passes under the banner
  const target=finishT<1.3?RUN_SPEED:0;
  currentSpeed=T.MathUtils.lerp(currentSpeed,target,1-Math.exp(-g*(target?6:3.2)));
  distance+=currentSpeed*g;
  lateral=T.MathUtils.lerp(lateral,0,1-Math.exp(-g*2));
  pointer.set(0,0);
  for(const l of gateLanterns){const f=finishT<1.2?2.6+Math.sin(Math.min(1,finishT/1.2)*Math.PI)*3.2:2.6;l.scale.setScalar(f);}
  updateEffects(g);
  place(1-Math.exp(-g*9));
  // camera swings round to the soldier's face: an arc around him, never through him
  const s=T.MathUtils.smoothstep(finishT,.7,2.3);
  if(s>0){
    const ang=s*Math.PI, r=T.MathUtils.lerp(4.9,4.3,s), side=Math.sin(ang)*r, back=Math.cos(ang)*r;
    actor.rotation.y=-Math.atan((center(distance+1)-center(distance-1))/2);
    camera.position.set(actor.position.x+side*.9+1.05*(1-s),T.MathUtils.lerp(2.65,1.8,s)+Math.sin(ang)*.5,actor.position.z+back);
    const look=actor.position.clone().add(vector(0,1.45,0));
    const follow=vector(center(distance+18)+lateral*.22,1.5,-distance-18);
    camera.lookAt(follow.lerp(look,Math.min(1,s*1.6)));
  }
  camera.updateMatrixWorld();
  hud();
  if(finishT>=2.9 && mode==='finish'){menuAngle=Math.PI;showResults();}
}
// V14: boss stars are win, 50+ health and under 2:30.
function starsFor(){const b=currentLevel.boss;return {clear:true,health:health>=50,fast:b?elapsed<BOSS.starTime:elapsed<180 && runStats.leaks<=3};}
function showResults(){
  const isBoss=currentLevel.boss, limit=isBoss?BOSS.starTime:180, limitText=isBoss?'2:30':'3:00';
  const healthBonus=Math.round(health)*10, timeBonus=Math.max(0,Math.ceil(limit-elapsed))*20;
  const total=score+healthBonus+timeBonus, stars=starsFor(), count=[stars.clear,stars.health,stars.fast].filter(Boolean).length;
  const reward=isBoss?BOSS.reward.coins:0;
  recordRun({won:true,score:total,coins:coinCount,distance:Math.floor(isBoss?0:finish),time:elapsed,difficulty:difficultyKey,stars:count,level:currentLevel.id});
  const hadTriple=weaponUnlocked('triple');
  const best=recordLevel({difficulty:difficultyKey,level:currentLevel.id,score:total,stars:count,time:elapsed,coins:coinCount+reward,weapon:isBoss?BOSS.reward.weapon:null}); // V14: unlocks the next stop
  bank=progressFor(difficultyKey).coins; wallet=0;
  setMode('results');
  ui.resultsTitle.textContent=(isBoss?'Beetle Tank destroyed':'L'+currentLevel.id+' · '+currentLevel.name+' cleared')+' · '+DIFF.label;
  const rows=isBoss?[
    ['Time',formatTime(elapsed)],
    ['Crawlers',runStats.kills+' / '+runStats.spawned+' destroyed'],
    ['Health bonus',Math.round(health)+' × 10',healthBonus],
    ['Time bonus',timeBonus?Math.ceil(limit-elapsed)+' s under '+limitText+' × 20':'Over '+limitText,timeBonus],
    ['Reward',reward+' coins'+(hadTriple?'':' · Triple Shot unlocked')],
    ['Total score','',total]]:[
    ['Time',formatTime(elapsed)],
    ['Kills',runStats.kills+' / '+runStats.spawned],
    ['Leaks',String(runStats.leaks)],
    ['Health bonus',Math.round(health)+' × 10',healthBonus],
    ['Time bonus',timeBonus?Math.ceil(180-elapsed)+' s under 3:00 × 20':'Over 3:00',timeBonus],
    ['Total score','',total]];
  ui.resultsRows.replaceChildren(...rows.map(([label,detail,points],i)=>{
    const tr=document.createElement('tr');tr.style.setProperty('--i',i);
    if(label==='Total score')tr.className='total';
    tr.innerHTML='<th>'+label+'</th><td>'+detail+'</td><td class="pts">'+(points===undefined?'':'<span data-to="'+points+'">0</span>')+'</td>';
    return tr;}));
  const starInfo=[[stars.clear,isBoss?'Won':'Cleared'],[stars.health,'50+ health'],[stars.fast,isBoss?'Under 2:30':'Under 3:00 · ≤3 leaks']];
  ui.resultsStars.replaceChildren(...starInfo.map(([got,label],i)=>{const el=document.createElement('div');el.className='star'+(got?' got':'');el.style.setProperty('--i',i);el.innerHTML='<b>★</b><small>'+label+'</small>';return el;}));
  ui.resultsBest.textContent=(best?'New best! ':'')+(isBoss&&!hadTriple?'Triple Shot unlocked · press Q to swap weapons in every level':'');
  const next=LEVELS[currentLevel.id]; // V14: Continue goes to the next stop (no Quartermaster yet)
  ui.resultsContinue.disabled=false; ui.resultsContinue.removeAttribute('title');
  ui.resultsContinue.textContent=isBoss?'Continue · Map':'Continue · '+(next.boss?'The Beetle Tank':'L'+next.id+' '+next.name);
  // tally: rows appear one by one, points count up
  const spans=[...ui.resultsRows.querySelectorAll('[data-to]')];
  spans.forEach((sp,k)=>{const to=+sp.dataset.to,start=performance.now()+400+k*350;
    const step=now=>{const t=Math.min(1,Math.max(0,(now-start)/600));sp.textContent=Math.round(to*t);if(t<1&&mode==='results')requestAnimationFrame(step);};requestAnimationFrame(step);});
  resultsTimer=setTimeout(()=>{for(let k=0;k<count;k++)setTimeout(()=>tone(700+k*180,.15,.06),k*260);},1600);
}
ui.resultsRetry.onclick=()=>startLevel(currentLevel.id); // V14
ui.resultsMenu.onclick=()=>{ setMode('menu'); ui.message.textContent=currentLevel.name+' cleared · '+DIFF.label; ui.start.textContent='LAUNCH MISSION'; };

// ---- V14: lighting presets (sunrise, dusk fog, night with temple lanterns) ----
function gradientSky(top, mid, horizon) {
  const c = document.createElement('canvas'); c.width = 8; c.height = 256;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, top); g.addColorStop(.55, mid); g.addColorStop(1, horizon);
  x.fillStyle = g; x.fillRect(0, 0, 8, 256);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
const LIGHTING = {
  sunrise: {fog: 0x55604c, density: .012, hemi: [0x8fa3b0, 0x1e2a16, 1.0], sun: [0xffb36a, 2.2], rim: 1.8, bounce: .35, accent: 14, exposure: 1.35, env: .55, tint: [1, 1, 1], hazardTint: [1, 1, 1], sky: null},
  dusk: {fog: 0x5b4148, density: .021, hemi: [0x9c7c8c, 0x22160e, .72], sun: [0xff7a3a, 1.5], rim: 1.25, bounce: .22, accent: 10, exposure: 1.22, env: .4, tint: [.8, .68, .66], hazardTint: [.9, .82, .8], sky: () => gradientSky('#1e1830', '#6a3e4a', '#c86a42')},
  night: {fog: 0x0a1220, density: .02, hemi: [0x3a4c70, 0x05070a, .26], sun: [0x8aa2d0, .32], rim: .9, bounce: .08, accent: 6, exposure: 1.05, env: .18, tint: [.24, .28, .4], hazardTint: [.62, .64, .76], sky: () => gradientSky('#02040a', '#0a1428', '#16243a')}
};
const skyCache = {};
// V14: load the Forest campaign art up front so stage swaps (tank damage states, pods, clouds) never show an empty frame.
for (const name of ['boss_beetle_tank_siege', 'boss_beetle_tank_brood', 'boss_beetle_tank_rampage', 'boss_beetle_tank_critical', 'jungle-biome/brood_pod_sealed', 'jungle-biome/brood_pod_hatching',
  'jungle-biome/enemy_leaf_buggy_front', 'jungle-biome/vfx_spore_cloud_green', 'jungle-biome/bg_temple_clearing_dusk', 'jungle-biome/prop_temple_lantern', 'enemy_hive_bee', 'plant_mushroom_blue', 'weapon_triple', 'cover_stone']) spriteTexture(name);
let lightingKey = 'sunrise';
const lanternLights = [0, 1, 2].map(() => { const l = new T.PointLight(0xffa850, 0, 16, 1.6); scene.add(l); return l; });
function applyLighting(key) {
  const L = LIGHTING[key] || LIGHTING.sunrise; lightingKey = LIGHTING[key] ? key : 'sunrise';
  scene.fog.color.set(L.fog); scene.fog.density = L.density;
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2];
  sun.color.set(L.sun[0]); sun.intensity = L.sun[1];
  rim.intensity = L.rim; bounce.intensity = L.bounce; accentLight.intensity = L.accent;
  renderer.toneMappingExposure = L.exposure; scene.environmentIntensity = L.env;
  if (L.sky) scene.background = skyCache[key] ||= L.sky();
  else if (panorama.image) scene.background = panorama;
  else scene.background = new T.Color(0x0a1420);
  for (const {sp, base, course} of envSprites) {
    const k = course ? L.hazardTint : L.tint;
    sp.material.color.setRGB(base.r * k[0], base.g * k[1], base.b * k[2]);
  }
  for (const l of lanternLights) l.intensity = 0;
}
function updateLanternLights() {
  if (!nightLanterns.length) return;
  const near = nightLanterns.filter(l => l.d > distance - 10 && l.d < distance + 40).slice(0, 3);
  lanternLights.forEach((light, i) => {
    const l = near[i];
    light.intensity = l ? 22 : 0;
    if (l) light.position.set(l.x, 2.2, -l.d);
  });
}

// ---- V14: the Beetle Tank (boss) ----
const ARENA_D = finish + 50; // the arena is built past the finish gate, in the clearing
const arena = {group: null, covers: []};
const TANK_W = 6.2, TANK_H = TANK_W / .875, TANK_BASE = 16 / 640;
const tankLocal = (fx, fy, z) => vector((fx - .5) * TANK_W, (1 - fy - TANK_BASE) * TANK_H, z);
function buildArena() {
  if (!arena.group) {
    arena.group = new T.Group(); scene.add(arena.group);
    const W = 76, H = W / SPRITE_ASPECT['jungle-biome/bg_temple_clearing_dusk'], d = ARENA_D + 50;
    const fade = document.createElement('canvas'); fade.width = fade.height = 128; // soft edges so the backdrop melts into the dusk sky
    const fx = fade.getContext('2d'), gx = fx.createLinearGradient(0, 0, 128, 0), gy = fx.createLinearGradient(0, 0, 0, 128);
    gx.addColorStop(0, '#000'); gx.addColorStop(.16, '#fff'); gx.addColorStop(.84, '#fff'); gx.addColorStop(1, '#000');
    fx.fillStyle = gx; fx.fillRect(0, 0, 128, 128);
    gy.addColorStop(0, '#000'); gy.addColorStop(.3, '#0000'); fx.fillStyle = gy; fx.fillRect(0, 0, 128, 128);
    const backdrop = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({map: spriteTexture('jungle-biome/bg_temple_clearing_dusk'), alphaMap: new T.CanvasTexture(fade), transparent: true, fog: false, color: 0xc4b4ac, depthWrite: false}));
    backdrop.position.set(center(d), H / 2 - .15, -d); backdrop.rotation.y = Math.atan2(center(ARENA_D) - center(d), d - ARENA_D); // faces the arena; stands behind the tank, never under the floor
    backdrop.renderOrder = -1; arena.group.add(backdrop);
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) { // ruins frame the clearing
      const dd = ARENA_D + 6 + i * 9, tw = makeSprite(i % 2 ? 'ruin_tower' : 'tree_kapok', i % 2 ? 6 : 12, {bottom: true, tint: 0x9a8c8c});
      tw.position.set(center(dd) + side * (11.5 + (i % 3)), -.1, -dd); arena.group.add(tw);
    }
  }
  arena.group.visible = true;
  arena.covers = [];
  for (const x of BOSS.cover.lanes) { // three carved stone blocks; they crumble after 6 hits
    const d = ARENA_D + BOSS.cover.range;
    const mesh = shape(courseGroup, box, ghostMaterial, center(d) + x, .75, -d, 2.4, 1.5, 1.2); shotBlockers.push(mesh);
    const art = makeSprite('cover_stone', 2.8, {bottom: true, height: 1.85, tint: 0xd4ccc4}); art.position.set(center(d) + x, 0, -d + .3); courseGroup.add(art);
    const o = {d, x, hw: 1.2, hd: .6, h: 1.5, cover: true, arena: true, hits: 0, mesh, art};
    solids.push(o); arena.covers.push(o);
  }
}
function coverHit(o, crumble = false) {
  if (o.hits >= BOSS.cover.hits) return;
  o.hits = crumble ? BOSS.cover.hits : o.hits + 1;
  const left = 1 - o.hits / BOSS.cover.hits;
  o.art.material.color.setRGB(.5 + .34 * left, .45 + .35 * left, .42 + .35 * left);
  o.art.scale.y = 1.85 * (.55 + .45 * left);
  burst(o.art.position.clone().setY(1), rockMat, 5);
  if (o.hits >= BOSS.cover.hits) {
    spawnFx('vfx_explosion_small', o.art.position.clone().setY(.9), 3, .45); burst(o.art.position.clone().setY(.8), rockMat, 18);
    o.art.visible = false; solids.splice(solids.indexOf(o), 1); shotBlockers.splice(shotBlockers.indexOf(o.mesh), 1);
    message('Cover crumbled', 1.2); tone(110, .3, .08);
  }
}
const boss = {active: false};
const bossGroup = new T.Group(); bossGroup.visible = false; scene.add(bossGroup);
const tankArt = makeSprite('boss_beetle_tank_siege', TANK_W, {own: true}); tankArt.center.set(.5, TANK_BASE); tankArt.material.fog = false; bossGroup.add(tankArt);
const tankArmour = shape(bossGroup, box, ghostMaterial, 0, 3.1, 0, 5.2, 6.2, 2.2);
const tankCore = shape(bossGroup, smoothOrb, ghostMaterial, ...tankLocal(.564, .425, 1.3).toArray(), .62, .62, .62);
const coreGlow = new T.Sprite(new T.SpriteMaterial({map: weakGlowTexture, blending: T.AdditiveBlending, depthWrite: false, transparent: true, fog: false}));
coreGlow.position.copy(tankLocal(.564, .425, 1.4)); bossGroup.add(coreGlow);
const coreDot = new T.Sprite(new T.SpriteMaterial({map: weakTexture, depthWrite: false, fog: false})); coreDot.position.copy(tankLocal(.564, .425, 1.45)); coreDot.scale.set(.7, .7, 1); bossGroup.add(coreDot);
const cannons = [tankLocal(.87, .31, .8), tankLocal(.87, .42, .8)].map(at => {
  const halo = new T.Mesh(new T.TorusGeometry(.75, .04, 8, 48), new T.MeshBasicMaterial({color: 0xff2a3a, transparent: true, depthTest: false, depthWrite: false}));
  halo.renderOrder = 100; halo.position.copy(at); bossGroup.add(halo); halo.visible = false;
  return {at, halo};
});
const tankAim = new T.Line(new T.BufferGeometry().setFromPoints([vector(0, 0, 0), vector(0, 0, 0)]), new T.LineBasicMaterial({color: 0xff2a3a, transparent: true, opacity: 0, depthTest: false, depthWrite: false}));
tankAim.renderOrder = 99; scene.add(tankAim);
const pods = [tankLocal(.24, .78, 1.5), tankLocal(.77, .78, 1.5)].map(at => {
  const art = makeSprite('jungle-biome/brood_pod_sealed', 1.25, {own: true}); art.position.copy(at); art.material.fog = false; bossGroup.add(art);
  const hitMesh = shape(bossGroup, smoothOrb, ghostMaterial, at.x, at.y, at.z + .2, .62, .62, .62);
  return {at, art, mesh: hitMesh, hp: 0};
});
const chargeMarker = makeLaneMarker(BOSS.rampage.laneHalfWidth);
const slamRing = new T.Mesh(new T.RingGeometry(.86, 1, 64), new T.MeshBasicMaterial({color: 0xff2a3a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false}));
slamRing.rotation.x = -Math.PI / 2; slamRing.visible = false; scene.add(slamRing);
let bossTone = null;
function bossToneOn(progress, remaining) {
  if (!DIFF.warningSound || audio?.state !== 'running' || bossTone) return;
  const osc = audio.createOscillator(), gain = audio.createGain(); osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140 + progress * 120, audio.currentTime); osc.frequency.linearRampToValueAtTime(620, audio.currentTime + Math.max(.05, remaining));
  gain.gain.value = .035; osc.connect(gain).connect(audio.destination); osc.start(); bossTone = {osc, gain};
}
function bossToneOff() { if (!bossTone) return; try { bossTone.gain.gain.setTargetAtTime(0, audio.currentTime, .015); bossTone.osc.stop(audio.currentTime + .06); } catch {} bossTone = null; }
function bossPos() { return vector(center(boss.d) + boss.x, 0, -boss.d); }
function startBoss() {
  Object.assign(boss, {active: true, dead: false, max: BOSS.hp[difficultyKey], hp: BOSS.hp[difficultyKey], phase: 1, rangeBase: BOSS.tankRange,
    d: ARENA_D + BOSS.tankRange, x: 0, timer: 2.4, volley: null, coreOpen: 0, hatch: BOSS.brood.hatchEvery, rstate: 'idle', rtimer: 1.6,
    laneX: 0, slamR: 0, rammed: false, flash: 0, art: '', killT: 0, podsDestroyed: 0});
  for (const p of pods) { p.hp = 0; p.art.visible = false; }
  bossGroup.visible = true; tankAim.material.opacity = 0; chargeMarker.mesh.visible = false; slamRing.visible = false;
  setTankArt(); placeBoss(); ui.bossbar.hidden = false; bossBar();
  message('Hide behind the stones · shoot the core when it opens', 4.5);
}
function stopBoss() {
  boss.active = false; bossGroup.visible = false; bossToneOff(); tankAim.material.opacity = 0;
  chargeMarker.mesh.visible = false; slamRing.visible = false; ui.bossbar.hidden = true;
  for (const c of cannons) c.halo.visible = false;
}
function setTankArt() {
  const f = boss.hp / boss.max;
  const name = f > .66 ? 'siege' : f > .33 ? 'brood' : f > BOSS.rampage.criticalAt ? 'rampage' : 'critical';
  if (name !== boss.art) { boss.art = name; tankArt.material.map = spriteTexture('boss_beetle_tank_' + name); tankArt.material.needsUpdate = true; }
}
function placeBoss() {
  bossGroup.position.copy(bossPos());
  bossGroup.rotation.y = -Math.atan((center(boss.d + 1) - center(boss.d - 1)) / 2);
  bossGroup.updateMatrixWorld(true);
}
function bossBar() {
  ui.bossFill.style.width = Math.max(0, boss.hp / boss.max * 100) + '%';
  ui.bossPhase.textContent = ['', 'SIEGE', 'BROOD', 'RAMPAGE'][boss.phase] + ' · ' + Math.max(0, Math.ceil(boss.hp)) + ' / ' + boss.max;
}
function coreIsOpen() { return boss.coreOpen > 0 || boss.rstate === 'stuck'; }
function bossParts() {
  const list = [{mesh: tankArmour, boss: true, kind: 'armour'}];
  if (coreIsOpen()) list.push({mesh: tankCore, boss: true, kind: 'core'});
  for (const p of pods) if (p.hp > 0) list.push({mesh: p.mesh, boss: true, kind: 'pod', pod: p});
  return list;
}
function bossHit(part, amount) {
  if (part.kind === 'pod') {
    part.pod.hp -= amount; burst(part.pod.mesh.getWorldPosition(vector(0, 0, 0)), colors.danger, 6);
    if (part.pod.hp <= 0) { part.pod.art.visible = false; boss.podsDestroyed++; spawnFx('vfx_explosion_small', part.pod.mesh.getWorldPosition(vector(0, 0, 0)), 2, .35); bossDamage(BOSS.podTankDamage, 'Pod destroyed · −' + BOSS.podTankDamage); }
    return;
  }
  amount *= BOSS.bulletDamage; // a rifle round against the tank (tuned so the fight lasts 2-3 minutes)
  bossDamage(part.kind === 'core' ? amount * BOSS.core : amount * BOSS.armour, part.kind === 'core' ? 'Core hit' : 'Armored · wait for the cyan core');
}
function bossNear(pos) { return pos.distanceTo(bossPos().add(vector(0, 2.6, 0))) < 3.8; }
function bossGrenade(pos) {
  if (!bossNear(pos) && !pods.some(p => p.hp > 0 && p.mesh.getWorldPosition(vector(0, 0, 0)).distanceTo(pos) < 2.6)) return;
  for (const p of pods) if (p.hp > 0 && p.mesh.getWorldPosition(vector(0, 0, 0)).distanceTo(pos) < 2.6) { p.hp = 0; p.art.visible = false; boss.podsDestroyed++; bossDamage(BOSS.podTankDamage, 'Pod destroyed'); }
  if (bossNear(pos)) bossDamage(boss.rstate === 'stuck' ? 3 * BOSS.rampage.grenadeMultiplier : 3 * BOSS.armour, boss.rstate === 'stuck' ? 'Grenade · triple damage while it is stuck' : 'Grenade on armour');
}
function bossDamage(n, text) {
  if (!boss.active || boss.dead) return;
  boss.hp -= n; boss.flash = 1; score += Math.round(n * 10);
  if (text) message(text, .8);
  const f = boss.hp / boss.max, phase = f > .66 ? 1 : f > .33 ? 2 : 3;
  if (phase !== boss.phase && boss.hp > 0) {
    boss.phase = phase; boss.volley = null; boss.coreOpen = 0; bossToneOff();
    for (const c of cannons) c.halo.visible = false; tankAim.material.opacity = 0;
    if (phase === 2) { boss.timer = 2.5; boss.hatch = BOSS.brood.hatchEvery; for (const p of pods) { p.hp = BOSS.podHp; p.art.visible = true; } message('BROOD · shoot the swelling pods before they hatch', 3.5); }
    if (phase === 3) { for (const p of pods) { p.hp = 0; p.art.visible = false; } boss.rstate = 'idle'; boss.rtimer = 1.4; charges = Math.min(3, charges + BOSS.rampage.grenadeBonus); message('RAMPAGE · dodge the red lane, jump the shockwave · +' + BOSS.rampage.grenadeBonus + ' grenades', 4); }
    shake = Math.max(shake, .3); tone(90, .5, .12);
  }
  setTankArt(); bossBar();
  if (boss.hp <= 0) bossDefeated();
}
function fireVolleyBolt(i) {
  const c = cannons[i % 2], start = c.at.clone().applyMatrix4(bossGroup.matrixWorld);
  const aimX = center(distance) + lateral + (i - 1) * .45, target = vector(aimX, .9 + jumpY * .3, -distance);
  const mesh = makeFx('vfx_bolt', 1.6); mesh.position.copy(start); scene.add(mesh);
  burst(start, colors.danger, 6); spawnFx('vfx_muzzle', start, 1.4, .12);
  bolts.push({mesh, source: start.clone(), velocity: target.sub(start).normalize().multiplyScalar(DIFF.boltSpeed * 1.15), cause: 'Tank cannon bolt'});
  tone(150, .14, .06);
}
function updateVolley(dt) {
  const S = BOSS.siege, every = boss.phase === 1 ? S.volleyEvery : BOSS.brood.volleyEvery;
  if (!boss.volley) {
    boss.timer -= dt;
    if (boss.timer <= 0) boss.volley = {t: 0, fired: 0};
  }
  const v = boss.volley;
  if (!v) { for (const c of cannons) c.halo.visible = false; tankAim.material.opacity = 0; return; }
  v.t += dt;
  const progress = Math.min(1, v.t / S.chargeTime), remaining = S.chargeTime - v.t;
  for (const c of cannons) { c.halo.visible = DIFF.warningRing && v.t < S.chargeTime; c.halo.quaternion.copy(camera.quaternion); c.halo.scale.setScalar(Math.max(.08, 1.15 - progress)); c.halo.material.color.set(remaining < .2 ? 0xffffff : 0xff2a3a); }
  if (v.t < S.chargeTime) {
    const a = cannons[0].at.clone().applyMatrix4(bossGroup.matrixWorld), b = vector(center(distance) + lateral, .9, -distance), pos = tankAim.geometry.attributes.position;
    pos.setXYZ(0, a.x, a.y, a.z); pos.setXYZ(1, b.x, b.y, b.z); pos.needsUpdate = true; tankAim.geometry.computeBoundingSphere();
    tankAim.material.opacity = DIFF.aimLineLead > 0 || remaining < .6 ? .3 + progress * .7 : 0;
    bossToneOn(progress, remaining);
    return;
  }
  bossToneOff(); tankAim.material.opacity = 0;
  while (v.fired < S.bolts && v.t >= S.chargeTime + v.fired * S.boltGap) fireVolleyBolt(v.fired++);
  if (v.fired >= S.bolts) {
    boss.volley = null; boss.timer = Math.max(.6, every - S.chargeTime - S.bolts * S.boltGap);
    if (boss.phase === 1) { boss.coreOpen = S.coreOpen; message('Core open · shoot it now', 1.2); tone(1200, .08, .04); }
  }
}
function updateBrood(dt) {
  const B = BOSS.brood;
  boss.hatch -= dt;
  for (const p of pods) {
    if (p.hp <= 0) continue;
    const swell = boss.hatch < B.swell ? 1 - boss.hatch / B.swell : 0;
    p.art.scale.set(1.25 * (1 + swell * .3 + Math.sin(elapsed * (6 + swell * 14)) * .06 * swell), 1.25 / .872 * (1 + swell * .3), 1);
    const want = swell > .5 ? 'hatching' : 'sealed';
    if (p.state !== want) { p.state = want; p.art.material.map = spriteTexture('jungle-biome/brood_pod_' + want); p.art.material.needsUpdate = true; }
    p.art.material.color.setRGB(.8 + swell * .2, .8, .8 + swell * .2);
  }
  if (boss.hatch <= 0) {
    for (const p of pods) if (p.hp > 0) {
      const at = p.mesh.getWorldPosition(vector(0, 0, 0));
      const c = spawn({d: boss.d - 2, type: 'beetle', x: at.x - center(boss.d - 2), walker: true}); c.passed = false; targets.push(c);
      burst(at, colors.leaves, 12); spawnFx('vfx_explosion_small', at, 1.8, .3);
    }
    boss.hatch = B.hatchEvery;
    for (const p of pods) { p.hp = BOSS.podHp; p.art.visible = true; p.state = ''; }
    tone(200, .3, .06);
  }
}
function updateRampage(dt) {
  const R = BOSS.rampage, base = ARENA_D + boss.rangeBase;
  boss.rangeBase = Math.max(BOSS.rampageMinRange, boss.rangeBase - BOSS.creepSpeed * dt); // creeps forward
  boss.rtimer -= dt;
  const toward = (want, speed) => { boss.d += T.MathUtils.clamp(want - boss.d, -speed * dt, speed * dt); };
  switch (boss.rstate) {
    case 'idle': toward(base, 4); boss.x += T.MathUtils.clamp(-boss.x, -dt * 3, dt * 3);
      if (boss.rtimer <= 0) { boss.rstate = 'warn'; boss.rtimer = R.markerTime; boss.laneX = T.MathUtils.clamp(lateral, -6, 6); message('Horn charge · get out of the red lane', 1.2); tone(90, .9, .08); }
      break;
    case 'warn': boss.x += T.MathUtils.clamp(boss.laneX - boss.x, -dt * 8, dt * 8);
      if (Math.random() < dt * 12) burst(bossPos().add(vector((Math.random() - .5) * 4, 1.2, 1)), rockMat, 3); // revs and smokes
      if (boss.rtimer <= 0) { boss.rstate = 'charge'; boss.rammed = false; boss.x = boss.laneX; shake = Math.max(shake, .2); }
      break;
    case 'charge': {
      toward(ARENA_D + R.chargeEnd, R.chargeSpeed);
      for (const o of arena.covers) if (o.hits < BOSS.cover.hits && Math.abs(o.x - boss.laneX) < R.laneHalfWidth + 1.2 && boss.d < o.d + 1.2) coverHit(o, true);
      if (!boss.rammed && boss.d - distance < 2.2) {
        boss.rammed = true;
        if (Math.abs(lateral - boss.laneX) < R.laneHalfWidth + .35 && jumpY < 1.3) { const lost = damage(DIFF.collisionDamage, 'Horn charge', false, true); if (lost) healthFeedback('−' + lost + ' CHARGE', 'leak'); }
      }
      if (boss.d <= ARENA_D + R.chargeEnd + .05) { boss.rstate = 'stuck'; boss.rtimer = R.stuck; shake = Math.max(shake, .3); tone(70, .5, .12); message('STUCK · core open · grenades do triple damage', 2); }
      break; }
    case 'stuck': if (boss.rtimer <= 0) { boss.rstate = 'back'; } break;
    case 'back': toward(base, 6); boss.x += T.MathUtils.clamp(-boss.x, -dt * 4, dt * 4);
      if (Math.abs(boss.d - base) < .1) { boss.rstate = 'slamWarn'; boss.rtimer = R.slamWarn; message('Ground slam · JUMP the shockwave', 1.2); tone(80, .9, .08); }
      break;
    case 'slamWarn': if (Math.random() < dt * 12) burst(bossPos().add(vector((Math.random() - .5) * 4, 1.2, 1)), rockMat, 3);
      if (boss.rtimer <= 0) { boss.rstate = 'slam'; boss.slamR = 1; boss.slamHit = false; shake = Math.max(shake, .35); spawnFx('vfx_explosion_big', bossPos().add(vector(0, .5, 0)), 6, .5); tone(60, .6, .14); }
      break;
    case 'slam': {
      boss.slamR += R.slamSpeed * dt;
      const me = vector(center(distance) + lateral, 0, -distance), gap = me.distanceTo(bossPos());
      if (!boss.slamHit && boss.slamR >= gap) { boss.slamHit = true; if (jumpY < R.slamJump) { const lost = damage(DIFF.collisionDamage, 'Ground slam', false, true); if (lost) healthFeedback('−' + lost + ' SLAM', 'leak'); } }
      if (boss.slamR > 34) { boss.rstate = 'idle'; boss.rtimer = 1.4; }
      break; }
  }
  const showLane = boss.rstate === 'warn' || boss.rstate === 'charge';
  if (showLane) chargeMarker.update(ARENA_D - BOSS.stepRange - 1, boss.d - 1, boss.laneX - center(boss.d) + center(boss.d), .45 + .35 * Math.sin(elapsed * 16) ** 2);
  else chargeMarker.mesh.visible = false;
  const slamWarn = boss.rstate === 'slamWarn', slam = boss.rstate === 'slam';
  slamRing.visible = slamWarn || slam;
  if (slamRing.visible) {
    const r = slam ? boss.slamR : 4 + Math.sin(elapsed * 18) * .4;
    slamRing.position.copy(bossPos()).setY(.07); slamRing.scale.setScalar(r);
    slamRing.material.opacity = slam ? .85 : .35 + .3 * Math.sin(elapsed * 14) ** 2;
  }
}
function updateBoss(dt) {
  if (boss.dead) return;
  boss.coreOpen = Math.max(0, boss.coreOpen - dt);
  if (boss.phase === 1 || boss.phase === 2) updateVolley(dt);
  if (boss.phase === 2) updateBrood(dt);
  if (boss.phase === 3) updateRampage(dt);
  else { boss.x += T.MathUtils.clamp(-boss.x, -dt * 3, dt * 3); boss.d += T.MathUtils.clamp(ARENA_D + boss.rangeBase - boss.d, -dt * 3, dt * 3); }
  placeBoss();
  const open = coreIsOpen(), pulse = 1 + .14 * Math.sin(elapsed * 12);
  coreGlow.visible = coreDot.visible = open; coreGlow.scale.set(2.1 * pulse, 2.1 * pulse, 1); coreDot.scale.set(.75 * pulse, .75 * pulse, 1);
  boss.flash = Math.max(0, boss.flash - dt * 4);
  const shakeX = (boss.rstate === 'warn' || boss.rstate === 'slamWarn') ? Math.sin(elapsed * 70) * .08 : 0;
  tankArt.position.x = shakeX;
  const red = boss.art === 'critical' ? .1 : 0;
  tankArt.material.color.setRGB(.86 + boss.flash * .14 + red, .84 - boss.flash * .3, .84 - boss.flash * .4);
}
function bossDefeated() {
  boss.dead = true; boss.hp = 0; bossToneOff(); bossBar();
  for (const c of cannons) c.halo.visible = false; tankAim.material.opacity = 0; chargeMarker.mesh.visible = false; slamRing.visible = false;
  for (const e of targets) if (e.hp > 0) { e.hp = 0; e.mesh.visible = false; stopChargeSound(e); }
  for (const b of bolts) remove(b); bolts.length = 0;
  mode = 'finish'; finishT = 0; firing = pressShot = powerShot = false; held.clear();
  ui.reticle.hidden = true; warningCanvas.hidden = true;
  if (musicEnabled && audio) music.play('win', () => { if (mode === 'results' && musicEnabled) music.play('menu'); });
  message('Beetle Tank destroyed', 3);
}
function bossFinishUpdate(dt) { // a large explosion and a short slow-motion beat, then the results
  finishT += dt;
  const g = dt * (finishT < .9 ? .25 : 1);
  if (Math.floor((finishT - dt) / .18) !== Math.floor(finishT / .18) && finishT < 1.6) {
    const at = bossPos().add(vector((Math.random() - .5) * 5, 1 + Math.random() * 5, 1));
    spawnFx('vfx_explosion_big', at, 5 + Math.random() * 3, .7); burst(at, colors.danger, 10); tone(70 + Math.random() * 40, .3, .1);
  }
  if (finishT > 1.1) { bossGroup.visible = finishT < 1.25 ? Math.floor(finishT * 30) % 2 === 0 : false; }
  shake = Math.max(0, .4 - finishT * .2);
  updateEffects(g);
  place(1 - Math.exp(-g * 9));
  camera.position.x += Math.sin(finishT * 60) * shake * .1;
  camera.updateMatrixWorld();
  hud();
  if (finishT >= 2.6 && mode === 'finish') { stopBoss(); menuAngle = Math.PI; showResults(); }
}

// ---- V14: levels, level-select map, progression and weapons ----
function levelEncounters(level) {
  const E = level.enemies;
  let list = encountersFor(DIFF.encounterKeep);
  if (E.base === 'v13-no-turrets' || E.base === 'v13-drones-crawlers') list = list.filter(e => e.type !== 'turret');
  if (E.base === 'v13-drones-turrets') list = list.filter(e => e.type !== 'beetle');
  list = list.map(e => ({...e}));
  let acc = 0; const keep = () => { acc += DIFF.featureKeep; if (acc >= 1 - 1e-9) { acc -= 1; return true; } return false; }; // Easy keeps an even share
  if (E.turrets) turretPlan(level).forEach((t, i) => keep() && list.push({d: t.d, type: 'turret', x: t.x, drop: ['shield', 'charge', 'heavy'][i % 3]}));
  const every = (spec, fn) => { if (!spec) return; const [a, b] = spec.every; for (let d = spec.start, i = 0; d < finish - 70; d += a + ((i * 29) % (b - a + 1)), i++) if (keep()) fn(d, i); };
  every(E.buggies, (d, i) => list.push({d, type: 'buggy', x: 0, enterAt: BUGGY.enterRange[0] + (i * 7) % 6, drop: i % 3 === 1 ? 'charge' : undefined}));
  every(E.bees, (d, i) => {
    const side = i % 2 ? 1 : -1;
    list.push({d, type: 'bee', x: side * 1.4, seed: i * 1.7, drop: 'shield'});
    for (let k = 0; k < (E.mushrooms?.perBee || 0); k++) list.push({d: d - 6 + k * 5, type: 'mushroom', x: side * (4.4 + (k % 2) * .4), minor: true});
  });
  if (E.sideBySide) for (const x of [-1.2, 1.2]) list.push({d: E.sideBySide.d, type: 'beetle', x, groupId: 'side-by-side'});
  return list.sort((a, b) => a.d - b.d);
}
let weapon = 'rifle', bank = 0;
function weaponUnlocked(key) { return key === 'rifle' || progressFor(difficultyKey).weapons.includes(key); }
function swapWeapon() {
  if (!weaponUnlocked('triple')) { message('Beat the Beetle Tank to unlock the Triple Shot', 1.6); return; }
  weapon = weapon === 'rifle' ? 'triple' : 'rifle';
  saveSetting('weapon', weapon); weaponHud(); tone(660, .06, .05);
  message(WEAPONS[weapon].name + ' · Q to swap', 1.2);
}
function weaponHud() {
  if (!weaponUnlocked(weapon)) weapon = 'rifle';
  const w = WEAPONS[weapon];
  ui.weaponChip.hidden = !weaponUnlocked('triple');
  ui.weaponChip.innerHTML = '<span style="background-image:url(art/sprites/' + w.icon + '.png)"></span><b>' + w.name.toUpperCase() + '</b><small>Q to swap</small>';
}
function refreshMenuWeapons() {
  ui.tripleCard.hidden = !weaponUnlocked('triple');
  ui.menuCoins.textContent = progressFor(difficultyKey).coins + ' coins banked · ' + DIFF.label;
}
function startLevel(id) {
  const level = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, id - 1))];
  if (!audio && window.AudioContext) audio = new AudioContext();
  audio?.resume().catch(() => {});
  if (boss.active) stopBoss();
  buildCourse(level); // rebuilt each run: difficulty sets L2-L5 pit density, and the arena cover is restored
  levelTrack = level.music;
  setMode('play');
  reset();
}
function openMap() {
  setMode('map');
  renderMap();
}
function stars(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }
function renderMap() {
  const pr = progressFor(difficultyKey);
  ui.mapDifficulty.value = difficultyKey;
  ui.mapCoins.textContent = pr.coins + ' coins' + (pr.weapons.includes('triple') ? ' · Triple Shot unlocked' : '');
  ui.mapStops.replaceChildren(...LEVELS.map(level => {
    const open = level.id <= pr.unlocked, best = pr.levels[level.id];
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'map-stop' + (level.boss ? ' boss' : '') + (open ? '' : ' locked') + (best ? ' cleared' : '');
    b.style.left = level.hazards.mapStop[0] + '%'; b.style.top = level.hazards.mapStop[1] + '%';
    b.disabled = !open; b.dataset.level = level.id;
    b.setAttribute('aria-label', (level.boss ? 'Boss: ' : 'Level ' + level.id + ': ') + level.name + (open ? ', ' + (best ? best.stars + ' of 3 stars' : 'not cleared') : ', locked'));
    b.innerHTML = '<i>' + (open ? (level.boss ? '☠' : level.id) : '🔒') + '</i><span><b>' + (level.boss ? 'Boss · ' : '') + level.name + '</b><small>' + (open ? stars(best?.stars || 0) : 'Locked') + '</small></span>';
    b.onclick = () => startLevel(level.id);
    b.onmouseenter = b.onfocus = () => { ui.mapInfo.textContent = level.idea + (best ? ' · Best ' + best.score + ' pts' : ''); };
    return b;
  }));
  ui.mapInfo.textContent = 'Pick a stop on the trail. Clearing a level on any difficulty unlocks the next.';
  (ui.mapStops.querySelector('.map-stop:not(.locked):not(.cleared)') || ui.mapStops.querySelector('.map-stop'))?.focus();
}
ui.mapBack.onclick = () => { setMode('menu'); ui.message.textContent = 'Forest campaign · ' + DIFF.label; ui.start.textContent = 'LAUNCH MISSION'; };
ui.mapDifficulty.addEventListener('change', e => { setDifficulty(e.target.value); renderMap(); });
ui.mapButton.onclick = () => openMap();
ui.resultsContinue.onclick = () => {
  if (currentLevel.boss) { openMap(); return; }
  startLevel(currentLevel.id + 1);
};

function setDifficulty(key) {
  difficultyKey = DIFFICULTIES[key] ? key : 'medium';
  DIFF = DIFFICULTIES[difficultyKey];
  ui.difficulty.value = difficultyKey;
  ui.difficultyBlurb.textContent = DIFF.blurb;
  saveSetting('difficulty', difficultyKey);
  if (ui.mapDifficulty) ui.mapDifficulty.value = difficultyKey;
  refreshMenuWeapons(); // V14
}
ui.difficulty.addEventListener('change', e => setDifficulty(e.target.value));
buildCourse(LEVELS[0]); // V14: Overgrown Trail, built with the same random sequence as V13
initProfiles(ui, profile => { weapon = profile?.settings?.weapon === 'triple' ? 'triple' : 'rifle'; setDifficulty(profile?.settings?.difficulty || 'medium'); });
ui.start.disabled = false;
ui.start.textContent = 'LAUNCH MISSION'; // v5: Meridian-style launch button
if (ui.loader) ui.loader.classList.add('done'); // v5: loading screen lifts after the first frame
let previous = performance.now();
renderer.setAnimationLoop(now => {
  const dt = Math.min(.05, (now-previous)/1000);
  previous = now;
  if (mode === 'menu') {
    // v5: showcase orbit — slow turntable around the soldier on the platform.
    menuAngle += dt * .22;
    actor.rotation.y += dt * .35;
    camera.position.set(actor.position.x + Math.sin(menuAngle) * 5.2, 2.6, actor.position.z + Math.cos(menuAngle) * 5.2);
    camera.lookAt(actor.position.x, 1.35, actor.position.z);
    camera.updateMatrixWorld();
  } else if (mode === 'results') {
    // V13: slow orbit around the soldier behind the results card
    menuAngle += dt * .18;
    camera.position.set(actor.position.x + Math.sin(menuAngle) * 5.4, 2.3, actor.position.z + Math.cos(menuAngle) * 5.4);
    camera.lookAt(actor.position.x, 1.3, actor.position.z);
    camera.updateMatrixWorld();
  } else if (mode === 'finish' && dt > 0) {
    finishUpdate(dt); // V13
  } else if (mode === 'play' && dt > 0) {
    update(dt);
    camera.fov=56;
    camera.updateProjectionMatrix();
    speedLineMat.opacity=0;
    if(shake>0) { camera.position.x+=Math.sin(now*.08)*shake*.1; camera.position.y+=Math.cos(now*.07)*shake*.07; shake=Math.max(0,shake-dt); }
  }
  if (mode !== 'pause') animateSoldier(dt); // V10
  updatePowerFx(now / 1000); // V11
  muzzleLight.intensity *= .82;
  muzzleGlow.material.opacity *= .8;
  pollen.position.y=Math.sin(now*.0004)*.25; // v2: gentle drift
  shaftMat.opacity=.045+Math.sin(now*.0006)*.015;
  renderer.render(scene,camera);
});

if(new URLSearchParams(location.search).has('test')) window.gameTest={
  start(key,id=1){setDifficulty(key);if(currentLevel.id!==id||id===6||builtFor!==DIFF)buildCourse(LEVELS[id-1]);levelTrack=currentLevel.music;reset();setMode('play');renderer.setAnimationLoop(null);},
  step(dt){if(mode==='play')update(dt);else if(mode==='finish')finishUpdate(dt);},
  bot(key,id=1){this.start(key,id);let jumpAt=0;for(let t=0;t<700 && mode==='play';t+=1/30){held.clear();held.add('KeyW');const desired=Math.sin(t*1.2)*2.5;if(Math.abs(desired-lateral)>.12)held.add(desired>lateral?'KeyD':'KeyA');firing=true;pointer.set(0,0);if(t>=jumpAt){if(grounded){grounded=false;jumpVel=trappedPit?10.5:JUMP_VELOCITY;}jumpAt=t+1.1;}update(1/30);}return this.state();},
  state(){return {mode,health,distance,elapsed,finish,difficultyKey,earnedDrops,damageEvents,pickups:pickups.map(p=>({key:p.key,d:p.d,lane:p.lane,expiresAt:p.expiresAt})),targets:targets.map(e=>({d:e.d,type:e.type,hp:e.hp,training:e.training})),diff:DIFF};},
  damage(n,source){recovery=rollInvuln=shield=0;damage(n,source,false,true);},
  collectHealth(){collectDrop('health');},
  groupTest(leaked){const a={groupId:'test',hp:0,d:100,x:0},b={...a};registerHealthGroup(a);registerHealthGroup(b);healthGroups.get('test').failed=leaked;completeHealthGroup(b);return earnedDrops;},
  render(){place(1);scene.updateMatrixWorld(true);renderer.render(scene,camera);},
  menu(){setMode('menu');},
  view(d){distance=d;lateral=0;jumpY=0;currentSpeed=0;updateTargets(0);updateFinishApproach();place(1);scene.updateMatrixWorld(true);renderer.render(scene,camera);drawWarningEdges();return gateMat.opacity;},
  waveView(frames=18){held.clear();distance=300;lateral=0;currentSpeed=0;pressureTimer=0;for(let k=0;k<frames;k++)update(1/30);place(1);scene.updateMatrixWorld(true);renderer.render(scene,camera);drawWarningEdges();return targets.filter(e=>e.enter!==undefined).map(e=>({type:e.type,enter:+e.enter.toFixed(2),range:+e.range.toFixed(1),y:+e.mesh.position.y.toFixed(2)}));},
  debugNear(){return targets.filter(e=>Math.abs(e.d-distance)<60).map(e=>({type:e.type,d:+e.d.toFixed(1),range:+e.range.toFixed(1),vis:e.mesh.visible,hp:e.hp,op:+e.art.material.opacity.toFixed(2),artVis:e.art.visible,pos:e.mesh.position.toArray().map(v=>+v.toFixed(1))}));},
  warnView(){distance=300;lateral=0;elapsed=10;announceWave(1);place(1);scene.updateMatrixWorld(true);renderer.render(scene,camera);drawWarningEdges();return incomingWave;},
  finishFrame(sec){distance=finish-.1;lateral=0;currentSpeed=6;update(1/30);const n=Math.round(sec*30);for(let i=0;i<n;i++)finishUpdate(1/30);scene.updateMatrixWorld(true);renderer.render(scene,camera);return {mode,finishT};},
  finishRun(){distance=finish-.1;currentSpeed=6;update(1/30);for(let i=0;i<120;i++)finishUpdate(1/30);return {mode,results:ui.resultsRows.textContent,stars:ui.resultsStars.querySelectorAll('.got').length,stats:{...runStats}};},
  advance(d){distance=d;updateTargets(0);},
  healthDrop(d,lane,earned){return addHealthDrop(d,lane,earned);},
  rules(key){this.start(key);damage(17,'test',false,true);for(let i=0;i<300;i++)update(1/30);const noRegen=health;collectDrop('health');const capped=health;collectDrop('health');const fullHealthWaste=health;
    const sources={};for(const [name,n] of [['shot',DIFF.shotDamage],['collision',DIFF.collisionDamage]]){health=100;recovery=rollInvuln=shield=0;damage(n,name,false,true);sources[name]=100-health;}
    health=100;recovery=rollInvuln=shield=0;leakEnemy({});leakEnemy({});sources.twoLeaks=100-health;
    this.start(key);for(let i=0;i<DIFF.earnedDropsMax+2;i++)addHealthDrop(100,4,true);const cappedEarned=earnedDrops;update(DIFF.earnedDropFade+.01);const expired=pickups.filter(p=>p.expiresAt!==undefined).length;
    this.start(key);distance=54.9;pressureTimer=-1;const before=targets.length;updateTargets(.1);const noWarmupWave=before===targets.length;distance=55;updateTargets(.1);const warmupWave=targets.length>before;
    this.start(key);elapsed=1;distance=44.3;lateral=0;jumpY=0;currentSpeed=6;resolveSolids();const log={speed:currentSpeed,shake,flinch:soldierShot?.name};
    return {noRegen,capped,fullHealthWaste,sources,cappedEarned,expired,noWarmupWave,warmupWave,log};},
  async sound(){audio ||= new AudioContext();await audio.resume();const enemy=targets.find(e=>e.type==='turret');enemy.shot=.8;enemy.range=20;updateChargeWarning(enemy,DIFF.turretRate);const running=Boolean(enemy.chargeTone);stopChargeSound(enemy);return {running,stopped:enemy.chargeTone===null,state:audio.state};},
  // ---- V14 checks ----
  levelInfo(){return {id:currentLevel.id,name:currentLevel.name,light:lightingKey,music:levelTrack,fog:scene.fog.density,hazards:hazards.filter(h=>h.kind==='pothole'||h.kind==='thorn').length,covers:solids.filter(o=>o.cover).length,
    types:targets.reduce((a,e)=>(a[e.type]=(a[e.type]||0)+1,a),{}),lanterns:nightLanterns.length};},
  turretCover(){const t=targets.filter(e=>e.type==='turret');return t.map(e=>({d:e.d,x:e.x,cover:solids.filter(o=>o.cover&&o.d<e.d&&e.d-o.d<20).map(o=>({d:o.d,x:o.x}))}));},
  clearTargets(){for(const e of targets)remove(e);targets.length=0;for(const b of bolts)remove(b);bolts.length=0;pressureTimer=1e9;finalWaveState=2;},
  buggy(key,inLane=true){this.start(key,3);this.clearTargets();distance=300;lateral=1.2;currentSpeed=0;held.clear();
    const b=spawn({d:346,type:'buggy',x:0,enterAt:47});b.state='wait';targets.push(b);const log={};let t=0;
    for(;t<6&&b.state!=='charge';t+=1/30){update(1/30);if(b.state==='marker'&&log.markerAt===undefined){log.markerAt=+t.toFixed(2);log.range=+b.range.toFixed(1);log.lane=b.x;log.markerVisible=b.marker.mesh.visible;}}
    log.chargeAfter=+(t-log.markerAt).toFixed(2);
    const before=health;if(!inLane)lateral=b.x+3.2;recovery=rollInvuln=shield=0;
    for(let k=0;k<180&&!b.passed;k++){update(1/30);if(b.state==='charge'&&log.speed===undefined&&b.speed>=BUGGY.chargeSpeed-.01)log.speed=b.speed;}
    log.lost=before-health;log.passed=b.passed;log.cause=damageEvents.at(-1)?.cause;
    const c=spawn({d:distance+40,type:'buggy',x:0});const pod=c.parts[0];strikePart(c,pod,1);strikePart(c,pod,1);log.pod={podHp:pod.hp,buggyHp:c.hp,glow:pod.glow.visible};strike(c,1);log.bodyArmour=null;remove(c);
    return log;},
  bee(key){this.start(key,4);this.clearTargets();distance=400;lateral=0;currentSpeed=0;held.clear();
    const b=spawn({d:420,type:'bee',x:0,seed:0});targets.push(b);const log={releases:[]};let last=0;
    for(let t=0;t<12.6;t+=1/30){update(1/30);const n=targets.filter(e=>e.type==='mini').length;if(n>last){log.releases.push({t:+t.toFixed(2),count:n-last,range:+b.range.toFixed(1)});last=n;}}
    log.hover=+b.range.toFixed(1);
    const fresh=spawn({d:distance+22,type:'bee',x:0,seed:1});const hp=fresh.hp;strikePart(fresh,fresh.parts[0],1);log.belly=hp-fresh.hp;const hp2=fresh.hp;strike(fresh,1);log.body=hp2-fresh.hp;remove(fresh);
    const minis=targets.filter(e=>e.type==='mini'&&e.hp>0);log.minisAlive=minis.length;
    const at=minis[0]?.mesh.position.clone();if(at)explodeGrenade({mesh:{position:at}});log.minisAfterGrenade=targets.filter(e=>e.type==='mini'&&e.hp>0).length;
    b.hp=0;b.mesh.visible=false;for(const e of targets)if(e.type==='mini')e.hp=0;
    const m=spawn({d:distance+1,type:'mini',x:lateral,minor:true});targets.push(m);recovery=rollInvuln=shield=0;const h=health;for(let k=0;k<30;k++)update(1/30);log.miniLeak=h-health;
    return log;},
  spores(key){this.start(key,4);this.clearTargets();distance=400;lateral=0;currentSpeed=0;held.clear();
    const m=spawn({d:430,type:'mushroom',x:4.4,minor:true});const near=spawn({d:431,type:'moth',x:2.5,shooter:true});const far=spawn({d:437,type:'moth',x:-2});targets.push(m,near,far);
    update(1/30);strike(m,1);const log={near:+near.stun.toFixed(2),far:+far.stun.toFixed(2),cloud:sporeClouds.length};
    const d0=near.d;for(let k=0;k<30;k++)update(1/30);log.nearMovedWhileStunned=+(d0-near.d).toFixed(2);
    for(let k=0;k<45;k++)update(1/30);log.stunEndsAfter2s=near.stun<=0;
    this.clearTargets();clearSpores();distance=400;lateral=0;releaseSpores(vector(center(400)+0,1,-400));held.clear();held.add('KeyW');currentSpeed=0;
    for(let k=0;k<20;k++){update(1/30);distance=400;}log.speedInCloud=+currentSpeed.toFixed(2);clearSpores();for(let k=0;k<40;k++){update(1/30);}log.speedOutside=+currentSpeed.toFixed(2);held.clear();
    return log;},
  boss(key){this.start(key,6);const log={start:{hp:boss.hp,max:boss.max,distance,phase:boss.phase,art:boss.art,covers:arena.covers.length,bar:!ui.bossbar.hidden}};
    held.clear();lateral=-5;distance=ARENA_D+3;let warn=null,firstBolt=null;
    for(let t=0;t<4;t+=1/30){update(1/30);if(warn===null&&cannons[0].halo.visible)warn=+t.toFixed(2);if(firstBolt===null&&bolts.length){firstBolt=+t.toFixed(2);log.boltCause=bolts[0].cause;}if(firstBolt!==null&&boss.coreOpen>0&&log.coreOpen===undefined)log.coreOpen=+boss.coreOpen.toFixed(2);}
    log.volley={warnAt:warn,firstBoltAt:firstBolt};
    const cv=arena.covers[1];let hits=0;while(solids.includes(cv)&&hits<10){boltBlocked(vector(center(cv.d)+cv.x,.9,-cv.d));hits++;}log.coverCrumbledAfter=hits;
    const armourHp=boss.hp;bossHit({kind:'armour'},3);log.armour=+(armourHp-boss.hp).toFixed(2);boss.coreOpen=1;const ch=boss.hp;bossHit({kind:'core'},1);log.core=+(ch-boss.hp).toFixed(2);
    bossDamage(boss.hp-boss.max*.66+.01);log.phase2={phase:boss.phase,art:boss.art,pods:pods.filter(p=>p.hp>0).length};
    const p0=pods[0];bossHit({kind:'pod',pod:p0},1);const hpBeforePod=boss.hp;bossHit({kind:'pod',pod:p0},1);log.podDamage=+(hpBeforePod-boss.hp).toFixed(2);
    const crawlersBefore=targets.filter(e=>e.walker).length;let swell=false;for(let t=0;t<8.2;t+=1/30){update(1/30);if(pods[1].state==='hatching')swell=true;if(mode!=='play')break;}log.hatched=targets.filter(e=>e.walker).length-crawlersBefore;log.swellBeforeHatch=swell;
    this.clearTargets();health=100;
    bossDamage(boss.hp-boss.max*.33+.01);log.phase3={phase:boss.phase,art:boss.art,charges};
    let marker=null,charge=null,stuck=null,slamWarn=null;lateral=0;distance=ARENA_D;
    for(let t=0;t<12;t+=1/30){if(boss.rstate==='warn')lateral=boss.laneX>0?-6:6;if(boss.rstate==='slam'&&boss.slamR>3)jumpY=Math.max(jumpY,0);update(1/30);
      if(marker===null&&boss.rstate==='warn'){marker=+t.toFixed(2);log.markerVisible=chargeMarker.mesh.visible;}
      if(charge===null&&boss.rstate==='charge')charge=+t.toFixed(2);if(stuck===null&&boss.rstate==='stuck'){stuck=+t.toFixed(2);log.coreOpenWhenStuck=coreIsOpen();const h=boss.hp;bossGrenade(bossPos().add(vector(0,2,0)));log.stuckGrenade=+(h-boss.hp).toFixed(2);}
      if(slamWarn===null&&boss.rstate==='slamWarn'){slamWarn=+t.toFixed(2);log.slamRing=slamRing.visible;}}
    log.rampage={markerAt:marker,chargeAt:charge,warnTime:charge!==null&&marker!==null?+(charge-marker).toFixed(2):null,stuckAt:stuck,slamWarnAt:slamWarn,damageTaken:100-health};
    bossDamage(boss.hp-boss.max*.1);log.critical=boss.art;
    health=1;recovery=rollInvuln=shield=0;damage(5,'test',false,true);log.death={mode,start:ui.start.textContent};
    startLevel(6);renderer.setAnimationLoop(null);log.restart={mode,hp:boss.hp,phase:boss.phase,distance,covers:arena.covers.filter(o=>solids.includes(o)).length,level:currentLevel.id};
    return log;},
  defeatBoss(key){this.start(key,6);elapsed=100;health=80;bossDamage(boss.hp+1);const m1=mode;for(let i=0;i<100&&mode==='finish';i++)finishUpdate(1/30);
    return {afterKill:m1,mode,title:ui.resultsTitle.textContent,rows:ui.resultsRows.textContent,stars:ui.resultsStars.querySelectorAll('.got').length,best:ui.resultsBest.textContent,cont:ui.resultsContinue.textContent,progress:JSON.parse(JSON.stringify(progressFor(key)))};},
  weapons(key){this.start(key,1);const before=weapon;swapWeapon();const after=weapon;const n=effects.length;pressShot=true;cooldown=0;scene.updateMatrixWorld();shoot(1/30);const tracers=effects.length-n;swapWeapon();return {unlocked:weaponUnlocked('triple'),before,after,back:weapon,chip:!ui.weaponChip.hidden,tracers};},
  finishLevel(key,id){this.start(key,id);elapsed=170;health=90;distance=finish-.1;currentSpeed=6;update(1/30);for(let i=0;i<120&&mode==='finish';i++)finishUpdate(1/30);
    return {mode,title:ui.resultsTitle.textContent,stars:ui.resultsStars.querySelectorAll('.got').length,cont:ui.resultsContinue.textContent,progress:JSON.parse(JSON.stringify(progressFor(key)))};},
  continueNext(){ui.resultsContinue.click();renderer.setAnimationLoop(null);return {mode,level:currentLevel.id,name:currentLevel.name};},
  map(key){setDifficulty(key);openMap();return [...ui.mapStops.children].map(b=>({text:b.textContent,locked:b.disabled,left:b.style.left,top:b.style.top}));},
  progress(key){return JSON.parse(JSON.stringify(progressFor(key)));},
  lightView(id,d){this.start('medium',id);this.clearTargets();if(id<6){distance=d;lateral=0;jumpY=0;currentSpeed=0;}place(1);updateTargets(0);updateLanternLights();scene.updateMatrixWorld(true);renderer.render(scene,camera);return this.levelInfo();},
  closeUp(){distance=300;lateral=0;held.clear();const b=spawn({d:312,type:'buggy',x:-2.2});b.state='marker';b.enter=1;b.timer=99;b.marker=makeLaneMarker(BUGGY.laneHalfWidth);targets.push(b);
    const bee=spawn({d:309,type:'bee',x:2.2,seed:0});bee.active=true;bee.release=99;bee.leaveAt=1e9;targets.push(bee);const m=spawn({d:306,type:'mushroom',x:4.6,minor:true});targets.push(m);
    const mini=spawn({d:304,type:'mini',x:.6,minor:true});mini.enter=1;targets.push(mini);update(1/30);bee.d=309;place(1);scene.updateMatrixWorld(true);renderer.render(scene,camera);},
  scene(fn){fn&&fn();scene.updateMatrixWorld(true);place(1);renderer.render(scene,camera);drawWarningEdges();},
  buggyView(){this.start('medium',3);this.clearTargets();distance=300;lateral=0;currentSpeed=0;const b=spawn({d:346,type:'buggy',x:0,enterAt:47});b.state='wait';targets.push(b);for(let k=0;k<30;k++)update(1/30);place(1);scene.updateMatrixWorld(true);renderer.render(scene,camera);return {state:b.state,range:b.range};},
  beeView(){this.start('medium',4);this.clearTargets();distance=400;lateral=0;currentSpeed=0;const b=spawn({d:421,type:'bee',x:0,seed:0});targets.push(b);const m=spawn({d:412,type:'mushroom',x:-4.4,minor:true});targets.push(m);for(let k=0;k<75;k++)update(1/30);place(1);scene.updateMatrixWorld(true);renderer.render(scene,camera);return targets.filter(e=>e.hp>0).map(e=>e.type);},
  sporeView(){const m=targets.find(e=>e.type==='mushroom'&&e.hp>0);if(m)strike(m,1);for(let k=0;k<8;k++)update(1/30);place(1);scene.updateMatrixWorld(true);renderer.render(scene,camera);return sporeClouds.length;},
  bossView(phase=1){this.start('medium',6);held.clear();if(phase>1)bossDamage(boss.hp-boss.max*(phase===2?.6:.3));if(phase===4)bossDamage(boss.hp-boss.max*.1);
    for(let k=0;k<(phase===1?50:phase===2?200:20);k++)update(1/30);if(phase===1){while(!cannons[0].halo.visible&&mode==='play')update(1/30);for(let k=0;k<12;k++)update(1/30);}
    if(phase===3){while(boss.rstate!=='warn'&&mode==='play')update(1/30);for(let k=0;k<10;k++)update(1/30);}
    place(1);scene.updateMatrixWorld(true);renderer.render(scene,camera);return {phase:boss.phase,art:boss.art,rstate:boss.rstate};},
  aimError:.12,
  bossBot(key,aimError){if(aimError!==undefined)this.aimError=aimError; // a competent scripted player: hides behind the stones, peeks to hit the open core, shoots pods, dodges charges, jumps slams
    this.start(key,6);let t=0;const dt=1/30;
    let rs=(this.bossSeed=(this.bossSeed||7)+1)*97;const rnd=()=>((rs=(Math.imul(rs,1664525)+1013904223)>>>0)/4294967296);const jitter=()=>(rnd()+rnd()+rnd()-1.5)*this.aimError;
    const aimAt=p=>{const v=p.clone().project(camera);pointer.set(T.MathUtils.clamp(v.x+jitter()/camera.aspect,-1,1),T.MathUtils.clamp(v.y+jitter(),-1,1));};
    for(;t<400&&mode==='play';t+=dt){
      held.clear();firing=false;
      const cover=arena.covers.filter(o=>solids.includes(o)).sort((a,b)=>Math.abs(a.x-lateral)-Math.abs(b.x-lateral))[0];
      let wantX=cover?cover.x:0, wantD=ARENA_D+BOSS.stepRange;
      if(boss.phase<3){
        const exposed=coreIsOpen()||pods.some(p=>p.hp>0&&boss.hatch<3.5);
        if(exposed||!boss.volley&&boss.timer>.6) wantX=(cover?cover.x:0)+(cover&&cover.x>0?-2.3:2.3);
        if(coreIsOpen()) aimAt(tankCore.getWorldPosition(vector(0,0,0)));
        else {const pod=pods.find(p=>p.hp>0);aimAt(pod?pod.mesh.getWorldPosition(vector(0,0,0)):tankArmour.getWorldPosition(vector(0,0,0)));}
        firing=wantX!==(cover?cover.x:0);
        const crawler=targets.find(e=>e.walker&&e.hp>0&&e.range<15);if(crawler){aimAt(crawler.mesh.position);firing=true;}
      } else {
        wantD=ARENA_D;
        if(boss.rstate==='warn'||boss.rstate==='charge') wantX=boss.laneX>0?-6.5:6.5; else wantX=lateral;
        aimAt(coreIsOpen()?tankCore.getWorldPosition(vector(0,0,0)):tankArmour.getWorldPosition(vector(0,0,0)));firing=true;
        if(boss.rstate==='stuck'&&charges>0&&!this._threw){powerShot=true;this._threw=true;} if(boss.rstate!=='stuck')this._threw=false;
        if(boss.rstate==='slam'&&grounded){const gap=vector(center(distance)+lateral,0,-distance).distanceTo(bossPos());if(boss.slamR>gap-3.2&&boss.slamR<gap)held.add('Space'),grounded=false,jumpVel=JUMP_VELOCITY;}
      }
      if(Math.abs(wantX-lateral)>.15)held.add(wantX>lateral?'KeyD':'KeyA');
      if(wantD>distance+.2)held.add('KeyW');else if(wantD<distance-.2)held.add('KeyS');
      update(dt);
    }
    return {mode,time:+t.toFixed(1),health,bossHp:+boss.hp.toFixed(1),phase:boss.phase,causes:damageEvents.reduce((a,e)=>(a[e.cause]=(a[e.cause]||0)+e.amount,a),{})};},
  warning(key,remaining=0.4,side=0){this.start(key);distance=100;const enemy=spawn({d:120,type:'turret',x:side});targets.push(enemy);enemy.range=20;enemy.mesh.position.set(center(120)+side,1,-120);place(1);enemy.shot=1.5-remaining*DIFF.turretRate;updateChargeWarning(enemy,DIFF.turretRate);drawWarningEdges();scene.updateMatrixWorld(true);renderer.render(scene,camera);return {ring:enemy.halo.visible,line:enemy.aimLine.visible,color:enemy.halo.material.color.getHexString(),size:enemy.halo.scale.x,core:enemy.fireCore.visible};}

};

const menuContent=document.querySelector('.menu-main'),menuActions=document.querySelector('.menu-actions');
const moreHint=document.createElement('div');moreHint.className='menu-more';moreHint.textContent='▼ more';ui.menu.append(moreHint);
function updateMenuOverflow(){
  menuContent.style.setProperty('--actions-height',menuActions.getBoundingClientRect().height+'px');
  const more=menuContent.scrollHeight-menuContent.clientHeight-menuContent.scrollTop>2;
  ui.menu.classList.toggle('has-more',more);
  moreHint.style.bottom=(document.querySelector('.controls').getBoundingClientRect().height+menuActions.getBoundingClientRect().height+4)+'px';
}
menuContent.addEventListener('scroll',updateMenuOverflow);new ResizeObserver(updateMenuOverflow).observe(menuContent);new ResizeObserver(updateMenuOverflow).observe(menuActions);updateMenuOverflow();
