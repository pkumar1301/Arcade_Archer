# Jungle Soldier V6 review

This package contains the published V6 game and all bundled assets.

## Play

Public game: https://pkumar1301.github.io/Arcade_Archer/

For local play, extract this ZIP and run the following from the extracted folder:

```sh
python3 -m http.server 8774 --bind 127.0.0.1
```

Open http://127.0.0.1:8774/ on the same computer.

## Current build

The level is 1,620 meters, targeting roughly four to five minutes of active play. W advances, S brakes, A/D strafe, double-tapping a direction rolls, Space jumps, and the mouse freely aims. Hold left click to fire. E or right click throws a grenade. Esc pauses and M toggles music.

The rifle range is 30 meters. Armored enemies have exposed weak points. Recurring waves continue while stationary. The latest tuning reduces enemy numbers by approximately 50%, followed by another 20%. A surviving enemy that passes the player costs 8 health. Pits trap the soldier below ground until a directional jump escapes.

## Review request

Play the build if your browser tools can access it. Check aiming, movement, shooting behind cover, enemy pressure, passing-enemy damage, pit entry and escape, restarting, and whether the menu stays usable in smaller windows. Record reproducible issues with HUD distance or elapsed time.

State which checks used browser play, code inspection, or simulation. Treat older design documents as historical references where they differ from the current code. Concept images in visuals/ are reference artwork.

Provide a prioritized issue list with reproduction steps and proposed fixes. Ask before changing game rules or publishing changes.
