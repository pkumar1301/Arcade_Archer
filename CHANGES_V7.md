# Jungle Soldier V7 — difficulty modes and profiles

## Difficulty (game.js, `DIFFICULTIES` table near the top)
Easy / Medium / Hard, picked on the menu and remembered per profile. Hard is the exact V6 tuning.
All difficulty numbers live in that one table: damage scale, passing-enemy damage, whether walking past a turret counts as "passing", wave interval/size/shooters/spawn distance, enemy fire rates, bolt speed, health regeneration, aim assist, starting grenade charges, share of fixed encounters kept.

Why V6 felt impossible: the "enemy got past you" penalty (8 health, ignores the hit-recovery window) was the main killer, not enemy fire. It also triggered when walking past any surviving turret. Easy and Medium no longer count turrets as passing; Hard still does.

Bot check (holds W, fires straight ahead without aiming, jumps every 1.1 s, strafes side to side, never targets enemies):
- Hard: dies at ~67–93 m (~12–16 s)
- Medium: dies at ~220–340 m (~40–60 s): a non-shooter fails, so aiming is required
- Easy: clears 1,620 m in ~5:20 with health left
These are starting values; tune from human play.

## Profiles (profiles.js, new file)
- Create a profile with just a call sign. No email or password.
- Saved in the browser's localStorage: best distance/score/clear time per difficulty, runs, total coins, chosen difficulty.
- "Copy save code" exports the profile as a checksummed code; "Load save code" imports it on another browser/device.
- Guest play still works (nothing saved).
- All storage is in load()/persist() in profiles.js, so a cloud backend can replace it without touching game.js.

## Menu
Profile panel + Difficulty selector added. On screens shorter than 980 px the stat/weapon cards are hidden so the controls stay visible.
