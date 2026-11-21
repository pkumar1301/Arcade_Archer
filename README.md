# Jungle Soldier

[Play the game](https://pkumar1301.github.io/Arcade_Archer/)

The current build is V11, with an animated soldier, difficulty settings, local player profiles, solid obstacles, visible power-up effects, an original synthesized soundtrack, and a 1,620 m jungle level, free mouse aiming, a 30 m rifle range, armored weak points, recurring enemy waves, and pits that require a directional jump to escape.

## Controls

- Hold W or Up to run. Release to stop, or use S or Down to brake.
- A/D or Left/Right strafe. Double-tap to roll.
- Space jumps. Use Space with A/D to escape a pit.
- Move the mouse to aim and hold left click to fire.
- E or right click throws a grenade.
- Esc pauses. M toggles music.

Surviving enemies cost 8 health when they pass the player. Enemy volume includes the latest two reductions. See CHANGES_V11.md for the latest changes and CHANGES_V10.md for animation limitations.

## Local play

Run this command from the repository folder, then open http://127.0.0.1:8774/.

```sh
python3 -m http.server 8774 --bind 127.0.0.1
```

## Assets and design references

Three.js is bundled in vendor/ with its license. The included ground textures and dusk environment originate from Poly Haven. Earlier design notes and concept images in docs/ and visuals/ describe several development phases. The concept images are visual references.
