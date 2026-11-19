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

const ui = Object.fromEntries([...document.querySelectorAll('[id]')].map(el => [el.id, el]));
const scene = new T.Scene();
// v5: cinematic dusk/night. Deep dark blue so the hero and foreground pop;
// warm gold vs cool cyan as opposing hues; value separation: dark ground,
// mid-tone foliage, bright hero/tracers/pickups. Fog haze fades the distance.
scene.background = new T.Color(0x0a1420);
scene.fog = new T.FogExp2(0x0d1f2e, 0.011);
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
scene.add(new T.HemisphereLight(0x2a4a66, 0x0e2418, 0.9)); // cool dusk sky, dark ground
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
const finish = 1620;
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
// Two rows of trees forming the corridor sides, at lateral ±7.2 from the
// corridor centre. Ground is y = 0; there are no branch landings.
for (let d = -10; d <= finish + 40; d += 10) {
  for (const side of [-1, 1]) {
    const x = center(d) + side * 7.2;
    const h = 6.5 + ((d / 10) % 3) * 1.1; // v2: varied tree heights
    beam(scenery, vector(x, 0, -d), vector(x, h, -d), .62 + ((d / 10) % 2) * .14, colors.bark);
    shape(scenery, crownGeometry, foliageMaterials[Math.abs(d / 10) % 4],
      x, h + 1.2, -d, 3 + ((d / 10) % 2), 1.5, 3);
    shape(scenery, crownGeometry, colors.lightLeaves, x + side, h + 2.4, -d, 2, 1, 2);
    shape(scenery, crownGeometry, foliageMaterials[(Math.abs(d / 10) + 1) % 4], x - side * .8, h + .4, -d + 1.2, 1.8, 1, 1.8); // v2: second crown
    if (d % 20 === 0) beam(scenery, vector(x + side * 1.4, h - .5, -d), vector(x + side * 1.2, h - 4.5, -d), .07, mossMat); // v2: hanging moss/vine
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
// v5: dense environment — skyline silhouettes (canopy-city layers), stone
// ruin arches over the path every 60 m, and overhead vine arches. The
// corridor now runs through somewhere, not an empty green tunnel.
for (let i = 0; i < 22; i++) {
  const d = 10 + i * 18, side = i % 2 ? 1 : -1;
  const h = 14 + ((i * 7) % 26);
  const tower = new T.Mesh(new T.BoxGeometry(6 + (i % 3) * 2, h, 6), skylineMat);
  tower.position.set(center(d) + side * (26 + (i % 4) * 6), h / 2 - 2, -d);
  tower.rotation.y = (i % 5) * .12;
  scene.add(tower);
}
const ruinMat = new T.MeshStandardMaterial({color:0x2a3138, roughness:.85, metalness:.15});
const ruinGlow = new T.MeshStandardMaterial({color:0xffb36a, emissive:0xff8a2a, emissiveIntensity:1.6});
for (let d = 60; d < finish; d += 60) {
  const x = center(d);
  for (const side of [-1, 1]) {
    const pillar = new T.Mesh(new T.BoxGeometry(.9, 7, .9), ruinMat);
    pillar.position.set(x + side * 6.4, 3.5, -d); pillar.castShadow = true; scene.add(pillar);
    const lamp = new T.Mesh(new T.SphereGeometry(.22, 12, 8), ruinGlow);
    lamp.position.set(x + side * 6.4, 5.6, -d); scene.add(lamp);
    addGlow(scene, x + side * 6.4, 5.6, -d, 0xffb36a, 2.2, .5);
  }
  const beamTop = new T.Mesh(new T.BoxGeometry(14, .8, .8), ruinMat);
  beamTop.position.set(x, 7.2, -d); beamTop.castShadow = true; scene.add(beamTop);
}
// v5: overhead vine arches — foliage bridges across the corridor.
for (let d = 25; d < finish; d += 30) {
  const x = center(d);
  beam(scenery, vector(x - 6.5, 6.5, -d), vector(x, 8.6, -d), .3, colors.bark);
  beam(scenery, vector(x, 8.6, -d), vector(x + 6.5, 6.5, -d), .3, colors.bark);
  shape(scenery, crownGeometry, foliageMaterials[(d/30)%4|0], x, 8.8, -d, 3, 1.2, 2);
}
// Low ground plants along the corridor edges.
for(let d=2;d<finish+36;d+=4){
  for(const side of [-1,1]){
    const x=center(d)+side*(4+random()*5);
    plant(x,0.1,-d,.85+random()*1.2,6);
    if(d%3===0) shape(scenery,crownGeometry,colors.bark,x,0.2,-d+1,1.2,.65,.88);
    // v2: bushes, ferns, flowers, mushrooms, rocks — instanced, no new draw-call types
    if(d%8===0) shape(scenery,smoothOrb,bushMat,x+side*.7,.35,-d+2,.9,.6,.9);
    if(d%12===0){ shape(scenery,pole,mushroomStem,x-side*.6,.18,-d+1.5,.14,.36,.14);
      shape(scenery,smoothOrb,mushroomCap,x-side*.6,.42,-d+1.5,.3,.18,.3); }
    if(d%16===0) shape(scenery,smoothOrb,rockMat,x+side*1.1,.22,-d-.8,.55,.4,.5);
    if(d%20===0){ beam(scenery,vector(x-side*.4,0,-d+2.5),vector(x-side*.4,.5,-d+2.5),.03,bushMat);
      shape(scenery,smoothOrb,flowerMats[(d/20)%4|0],x-side*.4,.58,-d+2.5,.16,.12,.16); }
  }
}
// Jungle floor at y = 0 (was y = -9 in the canopy build).
// v5: real PBR ground — Poly Haven CC0 "Forest Floor" (1k): diffuse +
// roughness + normal maps. The procedural canvas is the base; the real maps
// swap in on load so a failed download never leaves a blank floor.
const floorMat = new T.MeshStandardMaterial({map:groundTexture(),roughness:.9,metalness:.3,envMapIntensity:1.1});
const floorLoader = new T.TextureLoader();
floorLoader.load('art/forest_floor_diff_1k.jpg', t => {
  t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(24,32); t.anisotropy = 8;
  floorMat.map = t; floorMat.needsUpdate = true;
});
floorLoader.load('art/forest_floor_rough_1k.jpg', t => {
  t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(24,32);
  floorMat.roughnessMap = t; floorMat.needsUpdate = true;
});
floorLoader.load('art/forest_floor_nor_gl_1k.jpg', t => {
  t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(24,32);
  floorMat.normalMap = t; floorMat.normalScale.set(.6,.6); floorMat.needsUpdate = true;
});
const forestFloor = new T.Mesh(new T.PlaneGeometry(600,finish+440), floorMat);
// v5: puddles — glossy dark discs that catch the red/cyan neon.
const puddleMat = new T.MeshStandardMaterial({color:0x0a2a33, metalness:.9, roughness:.12, envMapIntensity:1.6});
for (let d = 30; d < finish; d += 34) {
  const pud = new T.Mesh(new T.CircleGeometry(1 + ((d/34)%3)*.5, 24), puddleMat);
  pud.rotation.x = -Math.PI/2;
  pud.position.set(center(d) + (d%68<34 ? -2.5 : 2.5), .02, -d);
  pud.scale.set(1.6, 1, 1);
  scene.add(pud);
}
forestFloor.rotation.x=-Math.PI/2;
forestFloor.position.set(0,0,-finish/2);
forestFloor.receiveShadow=true;
scene.add(forestFloor);
// Finish arch, on the ground.
const archX = center(finish);
for (const side of [-1, 1]) shape(scenery, pole, colors.lightWood, archX + side * 3.1, 2, -finish, .25, 4, .25);
shape(scenery, smoothOrb, colors.gold, archX, 4, -finish, 3.35, .1, .13); // rounded arch bar, was a box
// v2: arch dressed with vines, flowers and gold finials
for (const side of [-1, 1]) {
  shape(scenery, smoothOrb, glowGold, archX + side * 3.1, 4.15, -finish, .3, .3, .3);
  shape(scenery, smoothOrb, flowerMats[side < 0 ? 0 : 1], archX + side * 2.2, 4.05, -finish, .22, .16, .22);
  beam(scenery, vector(archX + side * 3.1, 3.6, -finish), vector(archX + side * 2.6, 2.2, -finish), .06, mossMat);
}
shape(scenery, crownGeometry, colors.lightLeaves, archX, 4.35, -finish, 1.4, .6, 1);

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
const muzzleGlow = addGlow(rifle, 0, 0, -.68, 0xffc46a, .9, 0); // v5: muzzle flash sprite, opacity spikes on fire
actor.traverse(part=>{if(part.isMesh) part.castShadow=true;});
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
let pressureTimer=6.25;
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
const pitMat = new T.MeshStandardMaterial({color:0x14261a, roughness:1});
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
  scene.add(bush);
  return bush;
}
const hazards = [];
const shotBlockers=[];
const combatRange=30;
const weakMaterial=new T.MeshBasicMaterial({color:0x7affdc});
const armorMaterial=new T.MeshStandardMaterial({color:0x3d5263,metalness:.65,roughness:.42});
const hazardPattern = [
  ['log',45,0],['thorn',45,3],['pothole',65,-2],
  ['log',110,0],['thorn',110,-3],['pothole',130,2],
  ['log',175,0],['thorn',175,3],['pothole',200,-2.5],
  ['log',240,0],['thorn',240,-3],['pothole',270,2.5],
  ['log',305,0],['thorn',305,3],['pothole',330,-2],
  ['log',350,0],['thorn',350,-3],
];
const hazardCourse=extendCourse(hazardPattern.map(([kind,d,x])=>[d,kind,x]));
for(let d=32,index=0;d<finish-15;d+=38,index++){
  const side=index%2?1:-1;
  hazardCourse.push([d,'pothole',side*2.6],[d,'thorn',-side*3.4]);
  if(index%2===0) hazardCourse.push([d+14,'cover',side*1.6]);
}
for(const [d,kind,x] of hazardCourse) {
  let mesh;
  if(kind==='cover'){
    mesh=shape(scene,box,colors.bark,center(d)+x,.68,-d,2.5,1.36,1.3);
    shotBlockers.push(mesh);
  } else if (kind === 'thorn') {
    // v3: thorn bush beside the log — jump the log at the centre, steer
    // around the thorns. Same d as the log, offset ±3 m to the side.
    mesh = makeThorn(x, d);
    shotBlockers.push(...mesh.children.filter(part=>part.isMesh));
  } else if (kind === 'log') {
    // Rounded log: cylinder lying across the corridor, same centre,
    // length 12 and diameter 0.8 as the old box log.
    mesh = shape(scene, pole, colors.wood, center(d), 0.4, -d, .48, 12, .48);
    mesh.rotation.z = Math.PI / 2;
    shotBlockers.push(mesh);
  } else {
    mesh = shape(scene, orb, pitMat, center(d) + x, 0.055, -d, 1.75, 0.08, 1.8);
  }
  if(kind==='pothole'){
    const rim=new T.Mesh(new T.TorusGeometry(1.75,.075,6,30),colors.wood);
    rim.rotation.x=Math.PI/2;
    rim.scale.y=1.03;
    rim.position.set(center(d)+x,.08,-d);
    scene.add(rim);
  }
  hazards.push({kind, d, x, mesh, hit:false});
}

// v5: neon path edges, from the Meridian screenshots — warm red/orange on
// the LEFT, cool cyan on the RIGHT, so left/right read at a glance and the
// dark path gets its contrast from the edges, not from daylight.
const neonRed = new T.MeshStandardMaterial({color:0xff2a1e, emissive:0xff2a1e, emissiveIntensity:2.4, roughness:.4});
const neonCyan = new T.MeshStandardMaterial({color:0x22d3ee, emissive:0x22d3ee, emissiveIntensity:2.4, roughness:.4});
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
  scene.remove(h.mesh);
  const wall=new T.Mesh(new T.CylinderGeometry(1.75,1.6,1.8,24,1,true),
    new T.MeshStandardMaterial({color:0x493c2d,side:T.DoubleSide,roughness:1}));
  wall.position.set(x,-.9,-h.d);
  scene.add(wall);
  const bottom=new T.Mesh(new T.CircleGeometry(1.6,24),pitMat);
  bottom.rotation.x=-Math.PI/2;
  bottom.position.set(x,-1.8,-h.d);
  scene.add(bottom);
}
forestFloor.geometry.dispose();
forestFloor.geometry=new T.ShapeGeometry(floorOutline,16);
const floorUV=forestFloor.geometry.attributes.uv;
for(let i=0;i<floorUV.count;i++){
  floorUV.setXY(i,floorUV.getX(i)/600+.5,floorUV.getY(i)/(finish+440)+.5);
}
floorUV.needsUpdate=true;
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
const encounters=extendCourse(encounterPlan).filter((_,index)=>index%2===0).filter((_,index)=>index%5!==4).map(([d,type,x,drop])=>({d,type,x,drop}));
const enemyMaterials={
  // v4 reskins (types/HP/behaviour unchanged): moth = small flying drone,
  // beetle = armoured crawler, turret = gun emplacement.
  moth:satin(0x4a4f55), mothWing:satin(0xffc35d),
  beetle:satin(0x4a5a2a), beetleDark:satin(0x2e3320),
  turret:satin(0x3a4048), petals:satin(0x5a6b3a)
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
const grenades = []; // v4: lobbed grenades in flight (Power Attack)
const pickups = [];
const coinGeometry = new T.CylinderGeometry(.22,.22,.075,32); // smooth coins
const coinLines = [];
for (let d = 10; d < finish; d += 20) {
  const nearest=hazardCourse.filter(([depth,kind])=>kind==='pothole')
    .reduce((best,h)=>Math.abs(h[0]-d)<Math.abs(best[0]-d)?h:best);
  const lane=Math.abs(nearest[0]-d)<12 ? -Math.sign(nearest[2])*4.7 : ((Math.floor(d/20)%3)-1)*3;
  coinLines.push({d,lane});
}
const coins = [];
const effects = [];
const ray = new T.Raycaster();
const pointer = new T.Vector2(0, 0);
const held = new Set();
const projectileSpeed = 12;
const FIRE_COOLDOWN = .12; // v4: rifle auto-fire, ~8 rounds/second
const AIM_ASSIST_ANGLE = .06; // v4: snap the centre ray to an enemy within ~3.4 deg
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
const dropNames = {shield:'Shield',auto:'Auto attack',heavy:'Power bolts',
  reload:'Quick reload',charge:'Power attack charge'};
const dropColors = Object.fromEntries(Object.entries({
  shield:0x68dfef,auto:0xbb9dff,heavy:0xff665f,reload:0x82e584,charge:0xffffff
}).map(([key,color])=>[key,new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.55,roughness:.3})]));
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
  }
  const halo=shape(mesh,orb,colors.danger,0,config.type==='turret'?.81:.22,.25,.24,.24,.24);
  halo.visible=false;
  // v4: gold ring shown around the enemy under the centre reticle.
  const targetRing=new T.Mesh(new T.TorusGeometry(.85,.05,8,32),
    new T.MeshBasicMaterial({color:0xffcc63,transparent:true,opacity:.9}));
  targetRing.position.y=config.type==='turret'?1.7:.6;
  targetRing.rotation.x=Math.PI/2;
  targetRing.visible=false;
  mesh.add(targetRing);
  const weakPoint=shape(mesh,smoothOrb,weakMaterial,0,config.type==='beetle'?.18:.4,.64,.19,.19,.13);
  weakPoint.visible=false;
  scene.add(mesh);
  return {...config,mesh,body,halo,targetRing,shell,motion,weakPoint,hp:config.type==='moth'?2:6,shot:-(config.shotDelay ?? 0),range:0,flash:0};
}
function reset() {
  for (const list of [targets, bolts, grenades, pickups, coins, effects]) {
    list.forEach(remove);
    list.length = 0;
  }
  targets.push(...encounters.map(spawn));
  for (const line of coinLines) {
    for (let i=0;i<4;i++) {
      const d=line.d-2.4+i*1.6, lane=line.lane;
      const mesh=shape(scene,coinGeometry,glowGold,
        center(d)+lane,0.73,-d,1,1,1);
      mesh.rotation.x=Math.PI/2;
      mesh.visible=false;
      coins.push({mesh,d,lane,collected:false});
    }
  }
  for (const h of hazards) h.hit=false;
  distance = lateral = jumpY = jumpVel = 0;
  recoilTimer = 0; aimSmooth.x = aimSmooth.y = 0;
  pressureTimer=6.25;
  trappedPit=null;
  pointer.set(0,0);
  ui.reticle.style.left=ui.reticle.style.top="50%";
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
  ui.levelbar.hidden = mode !== 'play';
  ui.speedo.hidden = mode !== 'play';
  if (mode !== 'play') ui.notice.textContent = '';
  if (mode === 'play') ui.start.blur();
  else ui.start.focus();
}
let displayedItems;
function formatTime(t) {
  const m = Math.floor(t / 60), sec = t - m * 60;
  return String(m).padStart(2,'0') + ':' + sec.toFixed(3).padStart(6,'0');
}
function hud() {
  ui.score.textContent = String(score).padStart(4, '0');
  ui.health.firstElementChild.style.width = health + '%';
  ui.health.setAttribute('aria-valuenow', health);
  ui.coinCount.textContent = 'COINS ' + wallet;
  ui.speed.textContent = currentSpeed.toFixed(1) + ' m/s';
  ui.distance.textContent = Math.floor(distance) + ' / ' + finish + ' m';
  // v5: Meridian-style HUD — timer top-right, big speed bottom-right, progress bottom-left.
  ui.timer.textContent = formatTime(elapsed);
  ui.speedBig.textContent = Math.round(currentSpeed * 3.6);
  ui.speedbar.style.width = Math.min(100, currentSpeed / RUN_SPEED * 100) + '%';
  ui.progress.style.width = Math.min(100, distance / finish * 100) + '%';
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
function showKillPop(text) {
  ui.killpop.textContent = text;
  ui.killpop.classList.remove('show');
  void ui.killpop.offsetWidth;
  ui.killpop.classList.add('show');
}
function end(won) {
  setMode('end');
  ui.message.textContent = (won ? 'Jungle cleared' : 'Run ended') + ' · Score ' + score + ' · Coins ' + coinCount;
  ui.start.textContent = 'Run again';
  tone(won ? 660 : 150, .35);
}
function damage(amount, cause, bypassRecovery=false) {
  // Rolling gives brief invulnerability; the post-hit recovery window
  // (0.75 s) still applies as in the original.
  if ((!bypassRecovery && recovery > 0) || rollInvuln > 0 || mode !== 'play') return;
  recovery = .75;
  if (shield > 0) {
    shield = 0;
    message('Shield absorbed the hit');
    tone(480);
    return;
  }
  health = Math.max(0, health - amount);
  shake = Math.max(shake, .22); // v5: damage shake
  message(cause + ' · −' + amount + ' health');
  tone(115,.2,.12);
  if (!health) end(false);
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
  actor.rotation.z = rollTime > 0 ? -rollDir * 0.5 : 0;
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
function updateTargets(dt) {
  pressureTimer-=dt;
  const nearby=targets.filter(e=>e.hp>0 && e.d-distance>-3 && e.d-distance<70).length;
  if(pressureTimer<=0 && nearby<=7){
    pressureTimer=6.25;
    const wave=Math.floor(elapsed/5);
    for(let i=0;i<4;i++){
      const side=i%2?1:-1;
      const d=distance+28+i*1.6;
      targets.push(spawn({d,type:i===3?'beetle':'moth',x:side*(i%3+1.5),
        entrySide:side,shotDelay:i*.22,drop:i===3?(wave%2?'shield':'heavy'):undefined}));
    }
  }
  for (const enemy of targets) {
    // Zipper moths fly toward the runner, so they close fast.
    if (enemy.type === 'moth' && enemy.hp > 0 && enemy.d-distance<70 && enemy.d-distance>-3) enemy.d -= dt * 3.5;
    const previousRange=enemy.range;
    enemy.range = enemy.d - distance;
    if(enemy.hp>0 && !enemy.passed && previousRange>0 && enemy.range<=0){
      enemy.passed=true;
      damage(8,'Enemy got past you',true);
    }
    const beat=elapsed*2.7+enemy.d;
    const beetle=enemy.type==='beetle', turret=enemy.type==='turret';
    // Beetles drift toward the runner's lateral position when close.
    if (beetle && enemy.hp > 0 && enemy.range < 20 && enemy.range > 0) {
      enemy.x += T.MathUtils.clamp(lateral - enemy.x, -dt * 1.5, dt * 1.5);
    }
    const offset=beetle ? enemy.x
      : enemy.x+(turret?0:Math.sin(beat)*1.6)+(enemy.entrySide ? enemy.entrySide*Math.max(0,enemy.range-15)*.17 : 0);
    const y=beetle ? .53 : turret ? 1.0 : 3.0+Math.sin(beat)*.42;
    enemy.mesh.position.set(center(enemy.d)+offset,y,-enemy.d);
    enemy.motion.forEach((wing,i)=>{wing.rotation.z=(i?1:-1)*Math.sin(elapsed*15)*.7;});
    enemy.mesh.visible = enemy.hp > 0 && enemy.range > -3 && enemy.range < 85;
    if (enemy.flash > 0) { enemy.flash = Math.max(0, enemy.flash - dt * 4); enemy.mesh.scale.setScalar(1 + enemy.flash * .18); }
    else enemy.mesh.scale.setScalar(1);
    const active=enemy.range>0 && enemy.range<=combatRange;
    enemy.weakPoint.visible=enemy.type!=='moth' && active && Math.sin(elapsed*1.5+enemy.d*.2)>.2;
    enemy.vulnerable=enemy.weakPoint.visible;
    enemy.halo.visible=active && enemy.range<28 && enemy.shot>.3;
    if (!enemy.mesh.visible || !dt) continue;
    // Beetle collision: horizontal proximity while low. Jumping high over
    // a beetle clears it.
    if (beetle && Math.abs(enemy.range) < 1.0 && Math.abs(lateral-enemy.x) < 0.85 && jumpY < 0.9) {
      enemy.hp = 0;
      enemy.mesh.visible = false;
      damage(35, 'Creature collision');
    }
    // Only turrets shoot in Phase 1.
    if ((!turret && !(enemy.type==='moth' && enemy.entrySide)) || enemy.range > 28 || enemy.range < 7) continue;
    enemy.shot += dt * (turret?.7:.34);
    enemy.halo.visible = enemy.shot > .42;
    enemy.halo.scale.setScalar(.2+Math.max(0,enemy.shot-.42)*.35);
    if (enemy.shot < 1.5) continue;
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
  enemy.flash = 1; // v5: hit flash (scale pulse, see updateTargets)
  burst(enemy.mesh.position,enemy.hp>0?colors.gold:enemy.halo.material,enemy.hp>0?7:15);
  if (enemy.hp>0) {
    enemy.shell.forEach(shell=>{shell.material=armorMaterial;});
    message(enemy.type==='moth'?'Hit':enemy.vulnerable?'Core exposed':'Armored · aim for the glowing core',.75);
    return;
  }
  enemy.mesh.visible=false;
  score+=enemy.type==='moth' ? 100 : 180;
  showKillPop(enemy.type==='moth' ? '+100' : '+180'); // v5: kill popup
  tone(720);
  if (!enemy.drop) return;
  // Drops land on the ground ahead, on the enemy's lateral line.
  const d=enemy.d+13, lane=enemy.x;
  if (d>=finish) return;
  const mesh=shape(scene,orb,dropColors[enemy.drop],center(d)+lane,0.7,-d,.46,.46,.46);
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
  const hitMeshes=candidates.flatMap(e=>e.weakPoint.visible?[e.body,e.weakPoint]:[e.body]);
  const sight=cameraRay.intersectObjects([...hitMeshes,...shotBlockers],false)[0];
  const aimPoint=sight?.point ?? camera.position.clone().addScaledVector(dir,combatRange);
  const shotDirection=aimPoint.clone().sub(muzzle).normalize();
  const bulletRay=new T.Raycaster(muzzle,shotDirection,0,combatRange);
  const hit=bulletRay.intersectObjects([...hitMeshes,...shotBlockers],false)[0];
  const hitPoint=hit?.point ?? muzzle.clone().addScaledVector(shotDirection,combatRange);
  tracer(muzzle,hitPoint);
  burst(muzzle,colors.gold,2);
  muzzleLight.position.copy(muzzle);
  muzzleLight.intensity=26;
  muzzleGlow.material.opacity=.95;
  recoilTimer=.08;
  tone(420,.05);
  if(!hit) return;
  burst(hitPoint,colors.gold,5);
  const enemy=candidates.find(e=>e.body===hit.object || e.weakPoint===hit.object);
  if(!enemy) return;
  const core=enemy.vulnerable && hitPoint.distanceTo(enemy.weakPoint.getWorldPosition(vector(0,0,0)))<.32;
  strike(enemy,enemy.type==='moth'?damage:core?damage*3:damage*.35);
  hitMarkerTimer=.15;
  ui.reticle.classList.add('hit');
  if(enemy.hp<=0){killMarkerTimer=.3;ui.reticle.classList.add('kill');}
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
  addGlow(scene, g.mesh.position.x, g.mesh.position.y, g.mesh.position.z, 0xff8a2a, 4, .9); // v5: explosion glow
  shake = Math.max(shake, .18); // v5: explosion shake
  tone(90, .4, .15);
  for (const e of targets) {
    if (e.hp > 0 && e.mesh.position.distanceTo(g.mesh.position) < GRENADE_RADIUS) strike(e, 3);
  }
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
  }
  powerShot = false;
  if ((pressShot || firing) && cooldown <= 0) {
    cooldown = rapid > 0 ? .09 : FIRE_COOLDOWN;
    rapid = Math.max(0, rapid - 1);
    heavy = Math.max(0, heavy - 1);
    const damage = Math.min(3, level + Number(heavy > 0)) >= 2 ? 2 : 1;
    fireBullet(direction, origin, damage);
    if (dual) fireBullet(direction.clone().applyAxisAngle(vector(0, 1, 0), .02), rifle.localToWorld(vector(-.3, 0, -.62)), damage);
  }
  pressShot = false;
  if (autoTime > 0 && autoCooldown <= 0) {
    const target = candidates.find(e => e.hp > 0 && e.range < 36);
    if (target) {
      autoCooldown = .85;
      // v4: auto-attack fires a real bullet straight at the target.
      fireBullet(target.mesh.position.clone().sub(origin).normalize(), origin, 1, false);
    }
  }
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
  if(trappedPit){
    currentSpeed=0;
    distance=trappedPit.d;
  } else {
    distance+=dt*currentSpeed;
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
    if (h.kind === 'log' && jumpY < 0.6) {
      // v3: logs no longer damage — hitting one is a stumble (brief slow only).
      slowTimer = 1.2;
      message('Stumbled over a log · no damage', 1.2);
      tone(180,.12,.06);
    } else if(h.kind==='cover' && Math.abs(lateral-h.x)<1.6 && jumpY<1.2){
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
  if (mode !== 'play') {hud();return;}
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
      if (e.hp > 0 && g.mesh.position.distanceTo(e.mesh.position) < 1.2) { boom = true; break; }
    }
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
    const collected = Math.abs(distance-item.d)<1.1 && Math.abs(lateral-item.lane)<.85 && jumpY>=0 && jumpY<.8;
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
    if (Math.abs(gap)<.85 && Math.abs(lateral-coin.lane)<.62 && jumpY>=0 && jumpY<1) {
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
  setMode('play');
  if (!resumed) reset();
  // Start and resume keep the last aim instead of aiming at the menu button.
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
      jumpVel = trappedPit ? 10.5 : JUMP_VELOCITY;
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
applyQuality(ui.quality.value); // v5: High by default (4096 shadows)
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
  } else if (mode === 'play' && dt > 0) {
    update(dt);
    camera.fov=56;
    camera.updateProjectionMatrix();
    speedLineMat.opacity=0;
    shake=0;
  }
  muzzleLight.intensity *= .82;
  muzzleGlow.material.opacity *= .8;
  pollen.position.y=Math.sin(now*.0004)*.25; // v2: gentle drift
  shaftMat.opacity=.045+Math.sin(now*.0006)*.015;
  renderer.render(scene,camera);
});
