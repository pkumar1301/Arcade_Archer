# Jungle Soldier

[Play the game](https://pkumar1301.github.io/Arcade_Archer/)

The current build is V15: the complete campaign. Six zones of five levels and a boss (36 stages): the Forest, Sunken Dunes, Frozen Reach, Ashen Caldera, Dead Orbit and the Hive Capital, ending with the Overmind, a 90s celebration, cast-roll credits and New Game+. Between levels the Quartermaster sells 16 weapons, weapon tiers, 12 soldier upgrades, gear and uniforms. See CHANGES_V15.md.

## Controls

- Hold W or Up to run. Release to stop, or use S or Down to brake.
- A/D or Left/Right strafe. Double-tap to roll.
- Space jumps. Use Space with A/D to escape a pit.
- Move the mouse to aim and hold left click to fire.
- E or right click throws a grenade.
- Q swaps between the primary and secondary weapon (set them in the Quartermaster's Loadout tab). Hold fire to charge the Light Cannon.
- In the boss arena, S steps back.
- Esc pauses. M toggles music.

Surviving enemies cost health when they pass the player (3 / 6 / 10 by difficulty). See CHANGES_V14.md for the latest changes and CHANGES_V10.md for animation limitations.

## Local play

Run this command from the repository folder, then open http://127.0.0.1:8774/.

```sh
python3 -m http.server 8774 --bind 127.0.0.1
```

## Assets and design references

Three.js is bundled in vendor/ with its license. The included ground textures and dusk environment originate from Poly Haven. Earlier design notes and concept images in docs/ and visuals/ describe several development phases. The concept images are visual references.

V12 removes health regeneration. Green health drops restore up to 20 health. Incoming fire uses red closing rings and directional warnings; exposed weak points glow cyan. The Rapid fire pickup temporarily increases the firing rate.

Automated checks are in tools/test_v15.mjs and docs/V15-validation.md (earlier versions: docs/V12 to V14).

V13 adds enemy entrances (drones drop from the canopy, crawlers burst from the foliage), a fade-in instead of pop-in, a sound and edge warning before each wave, a final wave and finish gate, and a results tally with up to three stars per difficulty. The jungle biome sprite pack for later levels is in art/jungle-biome/.

V14 adds Leaf Buggies (red lane marker, then a charge), hive bees with mini-drones, spore mushrooms that stun, dusk and night lighting, and the three-phase Beetle Tank. Level data lives in levels.js. Automated checks are in tools/test_v14.mjs and docs/V14-validation.md.
