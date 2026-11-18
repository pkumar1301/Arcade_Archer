// Arcade Archer — Phase 1 prototype, smooth stylized visual pass (Redesign v2, §10)
// Visual only: smooth shading, rounded geometry, procedural textures,
// warmer light, softer fog. Gameplay constants unchanged from Phase 1.
// Zone 1, Level 1 only: ground jungle run, 380 m. No shop, no zones/boss,
// no new weapon colours, no lives. Health 100; death ends the run.
// Ground at y = 0. Corridor ~12 m wide between two rows of trees.
// Controls: W/Up run, S/Down brake, A/D strafe, double-tap A/D roll,
// Space jump, mouse aim, hold left click fire, E / right click Power Attack.
import * as T from './vendor/three.module.min.js';

const ui = Object.fromEntries([...document.querySelectorAll('[id]')].map(el => [el.id, el]));
const scene = new T.Scene();
scene.background = new T.Color(0xadc9a2);
scene.fog = new T.FogExp2(0x9db88a, 0.008); // softer fog: distant trees stay visible
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
renderer.toneMappingExposure=1.15; // slightly brighter, Pixar-like
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap; // softer shadow edges
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
ui.view.append(renderer.domElement);
scene.add(new T.HemisphereLight(0xffeecf, 0x4a6b3a, 1.7)); // warm sky, soft green ground bounce
const sun = new T.DirectionalLight(0xffd9a0, 3.6); // warmer sun
sun.position.set(-20, 27, -8);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-13,right:13,top:16,bottom:-16,near:1,far:55});
sun.shadow.bias=-.0004;
sun.shadow.normalBias=.035;
scene.add(sun,sun.target);
const rim=new T.DirectionalLight(0x9fd0ff,1.45); // stronger cool rim/fill
const bounce=new T.DirectionalLight(0xffe6b8,0.5); // soft warm bounce from ahead, no shadow
bounce.position.set(0,3,10);
scene.add(bounce);
rim.position.set(8,5,7);
scene.add(rim);

const box = new T.BoxGeometry();
const orb = new T.IcosahedronGeometry(1, 3); // smooth: detail 1 -> 3
const pole = new T.CylinderGeometry(.84, 1, 1, 32); // smooth: 12 -> 32 sides
const vector = (x, y, z) => new T.Vector3(x, y, z);
const material = color => new T.MeshStandardMaterial({ color, roughness: .55 }); // smooth shading: flatShading removed
const colors = {
  wood: material(0x8a5f3a), lightWood: material(0xc09a62), bark: material(0x6b4a30),
  vine: material(0x6b8a4a), leaves: material(0x2f6b3f), lightLeaves: material(0x6faf5a),
  moss: material(0x8ab85e), leather: material(0x5d4034), cape: material(0xc65a38),
  cream: material(0xf2d3a0), gold: new T.MeshBasicMaterial({color:0xffcc63}),
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
const finish = 380;
const center = d => Math.sin(d * .036) * 3.4 + Math.sin(d * .078) * .7;
// Phase 1 movement tuning (Redesign v2 §3, bracketed starting values).
const RUN_SPEED = 6, STRAFE_SPEED = 4, CORRIDOR_HALF = 5.5;
const GRAVITY = 20, JUMP_VELOCITY = 7.5; // apex ~1.4 m, air time ~0.75 s
const ROLL_COOLDOWN = 1.2, ROLL_TIME = 0.4, ROLL_SPEED = 7.5, ROLL_INVULN = 0.4;
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
  const texture=new T.CanvasTexture(canvas);
  texture.colorSpace=T.SRGBColorSpace;
  texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.repeat.set(24,32);
  texture.anisotropy=8;
  return texture;
}
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
function plant(x,y,z,scale,count) {
  const phase=random()*Math.PI*2;
  for(let i=0;i<count;i++){
    const leaf=shape(scenery,leafGeometry,foliageMaterials[i%4],x,y,z,scale,scale,scale*(.65+random()*.62));
    leaf.rotation.set(.18+random()*.43,phase+i*2.4,0);
  }
}
// Two rows of trees forming the corridor sides, at lateral ±7.2 from the
// corridor centre. Ground is y = 0; there are no branch landings.
for (let d = -10; d <= finish + 40; d += 10) {
  for (const side of [-1, 1]) {
    const x = center(d) + side * 7.2;
    beam(scenery, vector(x, 0, -d), vector(x, 7, -d), .7, colors.bark);
    shape(scenery, crownGeometry, foliageMaterials[Math.abs(d / 10) % 4],
      x, 8.2, -d, 3, 1.5, 3);
    shape(scenery, crownGeometry, colors.lightLeaves, x + side, 9.4, -d, 2, 1, 2);
  }
}
// Distant jungle, kept from the original for depth.
for (let d = -8; d < finish + 60; d += 5) {
  for (const side of [-1, 1]) {
    const x = center(d) + side * (17 + random() * 24), z = -d + random() * 4;
    const radius = .65 + random() * 1.15, crown = 3 + random() * 10;
    beam(scenery, vector(x + side * 2, -24, z), vector(x, crown, z), radius, colors.bark);
    beam(scenery, vector(x, -4, z), vector(x + side * 4, crown - 3, z - 4), radius * .43, colors.wood);
    for (let i = 0; i < 3; i++) {
      const foliage = shape(scenery, crownGeometry, i === 1 ? colors.lightLeaves : colors.leaves,
        x + side * (i - 1) * 2.6, crown + random() * 2, z + i * 2, 3 + random() * 3, 1.5 + random() * 2, 3.2 + random() * 2);
      foliage.rotation.y = random() * Math.PI;
    }
    if (d % 3 === 0) beam(scenery, vector(x - side * 2, crown, z), vector(x - side * 2.2, crown - 9, z + .4), .1, colors.vine);
  }
}
// Low ground plants along the corridor edges.
for(let d=2;d<finish+36;d+=4){
  for(const side of [-1,1]){
    const x=center(d)+side*(4+random()*5);
    plant(x,0.1,-d,.85+random()*1.2,6);
    if(d%3===0) shape(scenery,crownGeometry,colors.bark,x,0.2,-d+1,1.2,.65,.88);
  }
}
// Jungle floor at y = 0 (was y = -9 in the canopy build).
const forestFloor = new T.Mesh(new T.PlaneGeometry(600,finish+440),
  new T.MeshStandardMaterial({map:groundTexture(),roughness:.9}));
forestFloor.rotation.x=-Math.PI/2;
forestFloor.position.set(0,0,-finish/2);
forestFloor.receiveShadow=true;
scene.add(forestFloor);
// Finish arch, on the ground.
const archX = center(finish);
for (const side of [-1, 1]) shape(scenery, pole, colors.lightWood, archX + side * 3.1, 2, -finish, .25, 4, .25);
shape(scenery, smoothOrb, colors.gold, archX, 4, -finish, 3.35, .1, .13); // rounded arch bar, was a box

// ---- Actor (kept from the original) ----
const actor = new T.Group();
scene.add(actor);
const cloth=new T.MeshStandardMaterial({color:0x232838,roughness:.75}); // softer cloth, slightly lighter
cloth.bumpMap=colors.bark.map;
cloth.bumpScale=.009;
const darkMetal=new T.MeshStandardMaterial({color:0x343642,roughness:.37,metalness:.59});
const brass=new T.MeshStandardMaterial({color:0xbb8944,roughness:.33,metalness:.57});
const wraps=satin(0x242935);
const trim=satin(0x555d69);
shape(actor,smoothOrb,cloth,0,1.02,0,.27,.43,.18);
shape(actor,smoothOrb,cloth,0,1.58,-.055,.213,.255,.205);
shape(actor,smoothOrb,colors.cream,0,1.62,-.239,.142,.055,.032);
shape(actor,smoothOrb,cloth,0,1.53,-.21,.185,.102,.063);
shape(actor,smoothOrb,wraps,0,.83,0,.24,.05,.18); // rounded torso, was a box
for(const side of [-1,1]){
  shape(actor,smoothOrb,wraps,side*.22,1.23,.018,.139,.144,.164);
  beam(actor,vector(side*.19,1.29,.18),vector(-side*.18,.86,.18),.033,trim);
  shape(actor,box,darkMetal,side*.218,.81,.135,.10,.14,.12);
  shape(actor,smoothOrb,brass,side*.19,1.23,.155,.032,.032,.021);
}
beam(actor,vector(-.17,.88,.19),vector(.14,1.35,.21),.063,colors.wood);
for(let i=0;i<3;i++){
  beam(actor,vector(.07+i*.047,1.15,.24),vector(.22+i*.04,1.49,.245),.013,wraps);
}
const cape=new T.Group();
cape.position.set(0,1.42,.165);
actor.add(cape);
for(const side of [-1,1]){
  const tail=shape(cape,smoothOrb,cloth,side*.06,-.19,.075,.064,.24,.028);
  tail.rotation.z=side*.21;
}
const legs=[-1,1].map(side=>{
  const leg=new T.Group();
  leg.position.set(side*.14,.78,0);
  actor.add(leg);
  beam(leg,vector(0,0,0),vector(0,-.37,-.025),.105,cloth);
  beam(leg,vector(0,-.30,-.02),vector(0,-.67,.02),.08,wraps);
  shape(leg,smoothOrb,cloth,0,-.70,-.07,.088,.08,.16);
  for(let i=0;i<3;i++) shape(leg,box,trim,0,-.42-i*.066,.048,.133,.022,.041);
  return leg;
});
for(const side of [-1,1]){
  beam(actor,vector(side*.22,1.25,0),vector(side*.38,1.03,-.11),.087,cloth);
  beam(actor,vector(side*.38,1.03,-.11),vector(side*.45,1.02,-.36),.067,wraps);
  shape(actor,smoothOrb,cloth,side*.45,1.02,-.36,.075,.073,.08);
}
function makeCrossbow(side) {
  const crossbow = new T.Group();
  crossbow.position.set(side*.45,1,-.18);
  actor.add(crossbow);
  shape(crossbow,smoothOrb,colors.wood,0,0,-.22,.07,.06,.32); // rounded stock, was a box
  shape(crossbow,smoothOrb,darkMetal,0,.063,-.22,.06,.02,.30); // rounded rail, was a box
  shape(crossbow,smoothOrb,brass,0,.075,-.31,.05,.015,.06); // rounded fitting, was a box
  beam(crossbow,vector(0,.10,-.12),vector(0,.1,-.55),.013,brass);
  for (const sign of [-1,1]) {
    beam(crossbow,vector(0,.02,-.48),vector(sign*.34,.02,-.32),.034,colors.lightWood);
    beam(crossbow,vector(sign*.34,.02,-.32),vector(0,.02,-.16),.009,colors.cream);
  }
  return crossbow;
}
const crossbow = makeCrossbow(1);
const secondCrossbow = makeCrossbow(-1);
secondCrossbow.visible = false;
actor.traverse(part=>{if(part.isMesh) part.castShadow=true;});
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
const pitMat = new T.MeshStandardMaterial({color:0x14261a, roughness:1});
const hazards = [];
for (const [kind, d, x] of [
  ['log',45,0],['pothole',65,-2],['log',110,0],['pothole',130,2],
  ['log',175,0],['pothole',200,-2.5],['log',240,0],['pothole',270,2.5],
  ['log',305,0],['pothole',330,-2],['log',350,0],
]) {
  let mesh;
  if (kind === 'log') {
    // Rounded log: cylinder lying across the corridor, same centre,
    // length 12 and diameter 0.8 as the old box log.
    mesh = shape(scene, pole, colors.wood, center(d), 0.4, -d, .48, 12, .48);
    mesh.rotation.z = Math.PI / 2;
  } else {
    mesh = shape(scene, orb, pitMat, center(d) + x, 0.05, -d, 1.2, 0.15, 1.2);
  }
  hazards.push({kind, d, x, mesh, hit:false});
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
const encounters=encounterPlan.map(([d,type,x,drop])=>({d,type,x,drop}));
const enemyMaterials={
  moth:satin(0xc38b32), mothWing:satin(0xffc35d),
  beetle:satin(0x226f78), beetleDark:satin(0x26373e),
  turret:satin(0x67864a), petals:satin(0x984b39)
};
const iconPositions={dual:'0',level:'1',heavy:'1',auto:'2',charge:'4',reload:'5',shield:'6',shieldOffer:'6'};
function itemIcon(key) {
  const icon=document.createElement('span');
  icon.className='item-icon';
  icon.dataset.tile=iconPositions[key];
  icon.setAttribute('aria-hidden','true');
  return icon;
}
const targets = [];
const bolts = [];
const pickups = [];
const coinGeometry = new T.CylinderGeometry(.22,.22,.075,32); // smooth coins
const coinLines = [];
for (let d = 10; d < finish; d += 20) {
  coinLines.push({d, lane: ((Math.floor(d / 20) % 3) - 1) * 3});
}
const coins = [];
const effects = [];
const ray = new T.Raycaster();
const pointer = new T.Vector2(0, 0);
const held = new Set();
const projectileSpeed = 12;
const movementKeys = new Set([
  'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS'
]);
// Phase 1 state. distance/lateral are the run position; jumpY is height
// above the ground (0 = on the ground). No auto-run: currentSpeed is 0
// unless W/Up is held.
let mode = 'menu', distance = 0, lateral = 0, jumpY = 0, jumpVel = 0, grounded = true;
let rollTime = 0, rollDir = 0, rollCooldown = 0, rollInvuln = 0, slowTimer = 0;
let currentSpeed = 0;
let health = 100, score = 0, coinCount = 0;
let shield = 0, recovery = 0, notice = 0, cooldown = 0, firing = false, elapsed = 0;
let resumed = false, audio;
let wallet, level, dual, rapid, heavy, autoTime, autoCooldown, charges, pressShot, powerShot;
const lastTap = {};
const dropNames = {shield:'Shield',auto:'Auto attack',heavy:'Power bolts',
  reload:'Quick reload',charge:'Power attack charge'};
const dropColors = Object.fromEntries(Object.entries({
  shield:0x68dfef,auto:0xbb9dff,heavy:0xff665f,reload:0x82e584,charge:0xffffff
}).map(([key,color])=>[key,new T.MeshBasicMaterial({color})]));
function collectDrop(key) {
  switch (key) {
    case 'shield': shield=1; break;
    case 'auto': autoTime=15; break;
    case 'heavy': heavy=8; break;
    case 'reload': rapid=12; break;
    case 'charge': charges=Math.min(3,charges+1); break;
  }
  message(dropNames[key]+' collected');
  ui.notice.prepend(itemIcon(key));
  tone(880,.22);
}

let musicEnabled=true;
function syncMusic(){
  if(musicEnabled && mode==='play'){
    ui.music.volume=.27;
    ui.music.play()?.catch(()=>{});
  } else {
    ui.music.pause();
  }
  ui.musicToggle.textContent=musicEnabled?'Music on · M':'Music off · M';
  ui.musicToggle.setAttribute('aria-pressed',musicEnabled);
}
function toggleMusic(){
  musicEnabled=!musicEnabled;
  syncMusic();
}
ui.musicToggle.onclick=toggleMusic;

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
  scene.remove(entry.mesh);
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
const goldWing=new T.MeshStandardMaterial({color:0xe0a040,side:T.DoubleSide,roughness:.4});
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
      for(let i=0;i<6;i++){
        const angle=i*Math.PI/3;
        const x=Math.cos(angle),z=Math.sin(angle);
        beam(mesh,vector(0,-.46,0),vector(x*1.2,-.92,z*1.2),.15,mat.turret);
        const petal=shape(mesh,smoothOrb,mat.petals,x*.43,.62,z*.43,.31,.46,.18);
        petal.rotation.y=-angle;
      }
      break;
  }
  const halo=shape(mesh,orb,colors.danger,0,config.type==='turret'?.81:.22,.25,.24,.24,.24);
  halo.visible=false;
  scene.add(mesh);
  return {...config,mesh,body,halo,shell,motion,hp:config.type==='moth'?1:2,shot:0,range:0};
}
function reset() {
  for (const list of [targets, bolts, pickups, coins, effects]) {
    list.forEach(remove);
    list.length = 0;
  }
  targets.push(...encounters.map(spawn));
  for (const line of coinLines) {
    for (let i=0;i<4;i++) {
      const d=line.d-2.4+i*1.6, lane=line.lane;
      const mesh=shape(scene,coinGeometry,colors.gold,
        center(d)+lane,0.73,-d,1,1,1);
      mesh.rotation.x=Math.PI/2;
      mesh.visible=false;
      coins.push({mesh,d,lane,collected:false});
    }
  }
  for (const h of hazards) h.hit=false;
  distance = lateral = jumpY = jumpVel = 0;
  grounded = true;
  rollTime = rollDir = rollCooldown = rollInvuln = slowTimer = 0;
  currentSpeed = 0;
  score = coinCount = shield = recovery = cooldown = elapsed = 0;
  health = 100;
  wallet=rapid=heavy=autoTime=autoCooldown=0;
  charges=1; // Phase 1: start with one Power Attack charge so it is testable.
  level=1;
  dual=false;
  message('W to run · S to stop · Space to jump · Hold left click to fire.', 4);
  place(1);
  updateTargets(0);
  hud();
}
function setMode(next) {
  mode = next;
  firing = pressShot = powerShot = false;
  held.clear();
  ui.game.classList.toggle('active', mode === 'play');
  syncMusic();
  ui.menu.hidden = mode === 'play';
  ui.reticle.hidden = mode !== 'play';
  ui.hud.hidden = mode === 'menu';
  if (mode !== 'play') ui.notice.textContent = '';
  if (mode === 'play') ui.start.blur();
  else ui.start.focus();
}
let displayedItems;
function hud() {
  ui.score.textContent = String(score).padStart(4, '0');
  ui.health.firstElementChild.style.width = health + '%';
  ui.health.setAttribute('aria-valuenow', health);
  ui.coinCount.textContent = 'COINS ' + wallet;
  ui.speed.textContent = currentSpeed.toFixed(1) + ' m/s';
  ui.distance.textContent = Math.floor(distance) + ' / ' + finish + ' m';
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
    'BOLT LV '+level, cooldown>0 ? 'RELOADING' : 'READY',
    dual && 'DUAL', shield>0 && 'SHIELD', rapid>0 && 'QUICK '+rapid,
    heavy>0 && 'POWER BOLTS '+heavy, autoTime>0 && 'AUTO '+Math.ceil(autoTime)+'s',
    'CHARGES '+charges
  ].filter(Boolean).join(' · ');
}
function end(won) {
  setMode('end');
  ui.message.textContent = (won ? 'Jungle cleared' : 'Run ended') + ' · Score ' + score + ' · Coins ' + coinCount;
  ui.start.textContent = 'Run again';
  tone(won ? 660 : 150, .35);
}
function damage(amount, cause) {
  // Rolling gives brief invulnerability; the post-hit recovery window
  // (0.75 s) still applies as in the original.
  if (recovery > 0 || rollInvuln > 0 || mode !== 'play') return;
  recovery = .75;
  if (shield > 0) {
    shield = 0;
    message('Shield absorbed the hit');
    tone(480);
    return;
  }
  health = Math.max(0, health - amount);
  message(cause + ' · −' + amount + ' health');
  tone(115,.2,.12);
  if (!health) end(false);
}
function place(smoothing) {
  actor.position.set(center(distance) + lateral, jumpY, -distance);
  actor.rotation.y = -Math.atan((center(distance+1)-center(distance-1))/2);
  actor.rotation.z = rollTime > 0 ? -rollDir * 0.5 : 0;
  secondCrossbow.visible=dual;
  crossbow.position.z=-.18+Math.max(0,cooldown-.12)*.32;
  secondCrossbow.position.z=crossbow.position.z;
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
  cape.rotation.x = (!grounded ? -.88 : -.35) + Math.sin(elapsed*9)*.17;
  cape.rotation.z=Math.sin(elapsed*4)*.12;
  sun.position.set(actor.position.x-11,17,-distance+4);
  sun.target.position.set(actor.position.x,0,-distance-5);
  camera.position.lerp(vector(center(distance)+lateral*.53,jumpY*.5+3.2,-distance+6.5), smoothing);
  camera.lookAt(center(distance+15)*.8+lateral*.17,1.2,-distance-15);
  camera.updateMatrixWorld();
}
function updateTargets(dt) {
  for (const enemy of targets) {
    // Zipper moths fly toward the runner, so they close fast.
    if (enemy.type === 'moth' && enemy.hp > 0) enemy.d -= dt * 2;
    enemy.range = enemy.d - distance;
    const beat=elapsed*2.7+enemy.d;
    const beetle=enemy.type==='beetle', turret=enemy.type==='turret';
    // Beetles drift toward the runner's lateral position when close.
    if (beetle && enemy.hp > 0 && enemy.range < 20 && enemy.range > 0) {
      enemy.x += T.MathUtils.clamp(lateral - enemy.x, -dt * 1.5, dt * 1.5);
    }
    const offset=beetle ? enemy.x
      : enemy.x+(turret?0:Math.sin(beat)*1.6);
    const y=beetle ? .53 : turret ? 1.0 : 3.0+Math.sin(beat)*.42;
    enemy.mesh.position.set(center(enemy.d)+offset,y,-enemy.d);
    enemy.motion.forEach((wing,i)=>{wing.rotation.z=(i?1:-1)*Math.sin(elapsed*15)*.7;});
    enemy.mesh.visible = enemy.hp > 0 && enemy.range > -3 && enemy.range < 85;
    if (!enemy.mesh.visible || !dt) continue;
    // Beetle collision: horizontal proximity while low. Jumping high over
    // a beetle clears it.
    if (beetle && Math.abs(enemy.range) < 1.0 && Math.abs(lateral-enemy.x) < 0.85 && jumpY < 0.9) {
      enemy.hp = 0;
      enemy.mesh.visible = false;
      damage(35, 'Creature collision');
    }
    // Only turrets shoot in Phase 1.
    if (!turret || enemy.range > 38 || enemy.range < 7) continue;
    enemy.shot += dt * .5;
    enemy.halo.visible = enemy.shot > .42;
    enemy.halo.scale.setScalar(.2+Math.max(0,enemy.shot-.42)*.35);
    if (enemy.shot < 1.4) continue;
    enemy.shot = -.65;
    enemy.halo.visible = false;
    const start = enemy.mesh.position.clone();
    // Predict where the runner will meet the bolt if they keep going.
    let flight = enemy.range / (Math.max(currentSpeed, 0.1) + projectileSpeed);
    const intercept = vector(0,0,0);
    for (let i = 0; i < 4; i++) {
      const future = distance + flight * currentSpeed;
      intercept.set(center(future)+lateral,jumpY+.85,-future);
      flight = intercept.distanceTo(start) / projectileSpeed;
    }
    const mesh = shape(scene,orb,colors.danger,...start,.22,.22,.22);
    burst(start,colors.danger,6);
    bolts.push({mesh, velocity:intercept.sub(start).normalize().multiplyScalar(projectileSpeed)});
    tone(185,.16);
  }
}

function tracer(from, to) {
  const mesh = beam(scene,from,to,.024,colors.gold);
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
  burst(enemy.mesh.position,enemy.hp>0?colors.gold:enemy.halo.material,enemy.hp>0?7:15);
  if (enemy.hp>0) {
    enemy.shell.forEach(shell=>{shell.material=colors.danger; shell.scale.multiplyScalar(.86);});
    message(enemy.shell.length?'Armor broken':'Hit',.75);
    return;
  }
  enemy.mesh.visible=false;
  score+=enemy.type==='moth' ? 100 : 180;
  tone(720);
  if (!enemy.drop) return;
  // Drops land on the ground ahead, on the enemy's lateral line.
  const d=enemy.d+13, lane=enemy.x;
  if (d>=finish) return;
  const mesh=shape(scene,orb,dropColors[enemy.drop],center(d)+lane,0.7,-d,.46,.46,.46);
  pickups.push({mesh,d,lane,y:0,key:enemy.drop});
  message(dropNames[enemy.drop]+' ahead · '+(lane<0?'left':lane>0?'right':'center'));
}
function fireRay(origin, direction, damage, pierce, candidates, muzzle) {
  ray.set(origin,direction);
  const hits=ray.intersectObjects(candidates.filter(e=>e.hp>0).map(e=>e.body),false);
  const last=hits[Math.min(hits.length,pierce)-1];
  tracer(muzzle,last?.point || ray.ray.at(70,vector(0,0,0)));
  for (const hit of hits.slice(0,pierce)) {
    strike(candidates.find(e=>e.body===hit.object),damage);
  }
}
function shoot(dt) {
  const candidates=targets.filter(e=>e.mesh.visible && e.range>0);
  scene.updateMatrixWorld();
  ray.setFromCamera(pointer,camera);
  const direction=ray.ray.direction.clone();
  const sightOrigin=ray.ray.origin.clone();
  const first=ray.intersectObjects(candidates.map(e=>e.body),false)[0];
  ui.reticle.classList.toggle('target',Boolean(first));
  cooldown-=dt;
  autoCooldown-=dt;
  const origin=actor.localToWorld(vector(.45,1,-.36));
  if (powerShot && charges>0) {
    charges--;
    fireRay(sightOrigin,direction,3,8,candidates,origin);
    tone(125,.25,.12);
  }
  powerShot=false;
  if ((pressShot || firing) && cooldown<=0) {
    const rank=Math.min(3,level+Number(heavy>0));
    cooldown=rapid>0 ? .17 : .31;
    rapid=Math.max(0,rapid-1);
    heavy=Math.max(0,heavy-1);
    const damage=rank>=2 ? 2 : 1;
    fireRay(sightOrigin,direction,damage,rank===3 ? 2 : 1,candidates,origin);
    if (dual) {
      const spread=direction.clone().applyAxisAngle(vector(0,1,0),.043);
      fireRay(sightOrigin,spread,damage,rank===3 ? 2 : 1,candidates.filter(e=>e.body!==first?.object),
        actor.localToWorld(vector(-.45,1,-.36)));
    }
    tone(285,.07);
  }
  pressShot=false;
  if (autoTime>0 && autoCooldown<=0) {
    const target=candidates.find(e=>e.hp>0 && e.range<36 && e.body!==first?.object)
      ?? candidates.find(e=>e.hp>0 && e.range<36);
    if (target) {
      autoCooldown=.85;
      tracer(origin,target.mesh.position);
      strike(target,1);
    }
  }
}
function startRoll(dir) {
  if (rollCooldown > 0 || rollTime > 0) return;
  rollDir = dir;
  rollTime = ROLL_TIME;
  rollCooldown = ROLL_COOLDOWN;
  rollInvuln = ROLL_INVULN;
  message(dir < 0 ? 'Roll left' : 'Roll right', .6);
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
    lateral += turn * STRAFE_SPEED * dt;
  }
  lateral = T.MathUtils.clamp(lateral, -CORRIDOR_HALF, CORRIDOR_HALF);
  rollCooldown -= dt;
  rollInvuln -= dt;
  const previousDistance = distance;
  distance += dt * currentSpeed;
  // --- Jump physics ---
  if (!grounded) {
    jumpVel -= GRAVITY * dt;
    jumpY += jumpVel * dt;
    if (jumpY <= 0) { jumpY = 0; jumpVel = 0; grounded = true; }
  }
  // --- Hazards: checked once, as the runner crosses each one ---
  for (const h of hazards) {
    if (h.hit || previousDistance >= h.d || distance < h.d) continue;
    h.hit = true;
    if (h.kind === 'log' && jumpY < 0.6) {
      damage(20, 'Log hit');
      slowTimer = 1;
    } else if (h.kind === 'pothole' && jumpY < 0.5 && Math.abs(lateral - h.x) < 1.1) {
      damage(25, 'Pothole');
      slowTimer = 1.5;
    }
  }
  recovery -= dt;
  autoTime-=dt;
  notice -= dt;
  if (notice <= 0) ui.notice.textContent = '';
  place(1 - Math.exp(-dt*9));
  updateTargets(dt);
  if (mode !== 'play') {hud();return;}
  shoot(dt);
  for (let i=bolts.length-1;i>=0;i--) {
    const bolt = bolts[i];
    bolt.mesh.position.addScaledVector(bolt.velocity,dt);
    const hit = bolt.mesh.position.distanceTo(vector(actor.position.x,actor.position.y+.85,-distance)) < .67;
    if (hit) {burst(bolt.mesh.position,colors.danger,7);damage(30,'Projectile hit');}
    if (hit || bolt.mesh.position.z > actor.position.z + 8) {
      remove(bolt);
      bolts.splice(i,1);
    }
  }
  for (let i=pickups.length-1;i>=0;i--) {
    const item = pickups[i];
    item.mesh.rotation.y += dt*3;
    item.mesh.position.y = item.y+.7+Math.sin(elapsed*6)*.15;
    const collected = Math.abs(distance-item.d)<1.1 && Math.abs(lateral-item.lane)<.85 && jumpY<.8;
    if (collected) {
      collectDrop(item.key);
    }
    if (collected || distance>item.d+3) {
      remove(item);
      pickups.splice(i,1);
    }
  }
  for (let i=effects.length-1;i>=0;i--) {
    const effect=effects[i];
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
  for (const coin of coins) {
    const gap = coin.d-distance;
    coin.mesh.visible = !coin.collected && gap > -2 && gap < 55;
    if (!coin.mesh.visible) continue;
    coin.mesh.rotateZ(dt * 4);
    if (Math.abs(gap)<.85 && Math.abs(lateral-coin.lane)<.62 && jumpY<1) {
      coin.collected=true;
      coin.mesh.visible=false;
      coinCount++;
      wallet++;
      score+=25;
      tone(1040,.07,.025);
    }
  }
  if (distance >= finish && mode === 'play') end(true);
  hud();
}

function aim(event) {
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
  setMode('play');
  if (!resumed) reset();
  if (event.detail) aim(event);
};
addEventListener('pointermove', aim);
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
      jumpVel = JUMP_VELOCITY;
    }
  }
  if (mode==='play' && e.code==='KeyE') {
    e.preventDefault();
    if (!e.repeat) powerShot=true; // E = Power Attack (was Space)
  }
  if (e.code==='KeyM' && !e.repeat) toggleMusic();
  if (e.code === 'Escape') pause();
});
addEventListener('keyup', e => held.delete(e.code));
addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => {if (document.hidden) pause();});
const panorama = new T.TextureLoader().load('art/distant-canopy.jpg', texture => {
  texture.colorSpace=T.SRGBColorSpace;
  scene.background=texture;
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
ui.start.disabled = false;
ui.start.textContent = 'Enter the jungle';
let previous = performance.now();
renderer.setAnimationLoop(now => {
  const dt = Math.min(.05, (now-previous)/1000);
  previous = now;
  if (mode === 'play' && dt>0) update(dt);
  renderer.render(scene,camera);
});
