# Jungle Soldier V11: bug fixes and soundtrack

Built on V10.

## Bug fixes
1. **Walking through obstacles.** New `solids` list + `resolveSolids()`: cover pieces, cross logs and temple-arch pillars now stop you.
   Logs and rock piles are cleared by jumping; cover by a full jump; arch pillars never. A "Blocked" tip appears when you bump.
   Decoration (ferns, plants, rocks at the edges) moved outside the walkable strip. Arches widened to 20 m so the opening fits the path.
   New: rock piles (solid, jumpable, block low shots) and fern clumps (20% slowdown) placed in the path every ~21 m, kept clear of other hazards.
2. **Enemies not firing (Easy).** Easy: 2 of 2 wave drones fire (was 1), drone fire rate .2 -> .45, turret .4 -> .65; a third of fixed drones also fire;
   first shot comes sooner (`firstShot`). Medium raised slightly. Hard unchanged (V6 tuning). Easy damage scale unchanged, so it stays easy.
3. **No power-up effect on the soldier.** Shield = cyan bubble, auto attack = purple drone orbiting his head, power bolts = red rifle glow and red tracers,
   quick reload = green ring at his feet (`updatePowerFx`).
4. **Only one power-up type.** Drops now cycle shield -> power bolts -> quick reload -> auto attack -> grenade.
   Pickup message explains each one; a HUD bar above the tips shows what is active and how many shots / seconds remain.

## Soundtrack (music.js)
Original chiptune music synthesized live with Web Audio (no audio files): pulse-wave lead with echo, triangle bass, arpeggios, synthesized drums.
| Track | Use | Tempo |
|---|---|---|
| Mission Briefing | Menu | 128 BPM |
| Jungle Rush | Level playlist | 160 BPM |
| Canopy Charge | Level playlist | 168 BPM |
| Night Patrol | Level playlist | 150 BPM |
| Iron Beetle | Boss fights (reserved for the boss level) | 176 BPM |
| Victory / Game Over | Jingles at the end of a run | |
- The level track rotates each run now; once the level system exists, each level picks its own track.
- Menu theme starts on the first click or key press (browser rule). M toggles music. The old `canopy-loop.wav` is no longer played.
