// V10: animated soldier built from the Mixamo export (art/soldier/).
// Uses only three.js core: SkinnedMesh, Skeleton, AnimationMixer.
import * as T from './vendor/three.module.min.js';

export async function loadSoldier(base = 'art/soldier/') {
  const [rig, clipData, buf, tex] = await Promise.all([
    fetch(base + 'soldier_rig.json').then(r => r.json()),
    fetch(base + 'soldier_clips.json').then(r => r.json()),
    fetch(base + 'soldier_rig.bin').then(r => r.arrayBuffer()),
    new T.TextureLoader().loadAsync(base + 'soldier_texture.jpg')
  ]);
  const n = rig.vertexCount, f = rig.triangleCount;
  let o = 0;
  const take = (Type, count) => { const a = new Type(buf, o, count); o += count * Type.BYTES_PER_ELEMENT; return a; };
  const position = take(Float32Array, n * 3), normal = take(Float32Array, n * 3), uv = take(Float32Array, n * 2);
  const skinIndex = take(Uint16Array, n * 4), skinWeight = take(Float32Array, n * 4), index = take(Uint32Array, f * 3);
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(position, 3));
  g.setAttribute('normal', new T.BufferAttribute(normal, 3));
  g.setAttribute('uv', new T.BufferAttribute(uv, 2));
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(skinIndex, 4));
  g.setAttribute('skinWeight', new T.BufferAttribute(skinWeight, 4));
  g.setIndex(new T.BufferAttribute(index, 1));
  g.computeBoundingSphere();

  tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
  const material = new T.MeshStandardMaterial({map: tex, roughness: .82, metalness: .05, side: T.DoubleSide}); // double-sided hides a few inward-facing triangles from the 3D scan
  const bones = rig.bones.map(b => {
    const bone = new T.Bone(); bone.name = b.name;
    bone.position.fromArray(b.t); bone.quaternion.fromArray(b.q);
    return bone;
  });
  rig.bones.forEach((b, i) => { if (b.parent >= 0) bones[b.parent].add(bones[i]); });

  // root: centimetres -> metres; Mixamo faces +Z, the game runs toward -Z.
  const root = new T.Group();
  const rigRoot = new T.Group(); rigRoot.scale.setScalar(.01); rigRoot.rotation.y = Math.PI;
  root.add(rigRoot);
  const mesh = new T.SkinnedMesh(g, material);
  mesh.castShadow = true; mesh.frustumCulled = false;
  rigRoot.add(bones[0], mesh);
  root.updateMatrixWorld(true);
  mesh.bind(new T.Skeleton(bones)); // rest pose == bind pose (verified in conversion)

  const clips = {};
  for (const c of clipData.clips) {
    const times = Float32Array.from({length: c.frames}, (_, i) => i / c.fps);
    const tracks = [new T.VectorKeyframeTrack('mixamorigHips.position', times, c.hips)];
    for (const [name, q] of Object.entries(c.q)) tracks.push(new T.QuaternionKeyframeTrack(name.replace(':', '') + '.quaternion', times, q));
    clips[c.name] = new T.AnimationClip(c.name, c.duration, tracks);
    clips[c.name].userData = {loop: c.loop};
  }
  // three's track parser does not allow ':' in node names, so rename bones to match.
  bones.forEach(b => { b.name = b.name.replace(':', ''); });
  const mixer = new T.AnimationMixer(rigRoot);
  const actions = {};
  for (const [name, clip] of Object.entries(clips)) {
    const a = mixer.clipAction(clip);
    if (!clip.userData.loop) { a.setLoop(T.LoopOnce, 1); a.clampWhenFinished = true; }
    actions[name] = a;
  }
  const bone = name => bones.find(b => b.name === 'mixamorig' + name);
  return {root, rigRoot, mesh, mixer, actions, clips, bone, bones};
}
