# Arcade Game — Redesign Brief v1

**Source:** Voice note, Wed 18 Nov 2026 (~2½ min, `Landsdowne_St.m4a`)
**Cleaned transcript:** `transcript-cleaned.md` in this folder
**Status:** Draft for discussion — nothing built or changed yet

This brief captures only what was said in the voice note. Anything not in the note is listed under Open decisions, not assumed.

---

## 1. The change in one line

No longer a jumping game. Now a player-controlled run through a wide, open space in the browser — the protagonist has room to move, stop, sidestep, roll, and jump, while fighting land and air enemies.

This is a different game from The Last Hearth (Dragon Village) — a separate arcade game, previously the jumping one. Confirm if that is right.

## 2. Core movement

- **Open space, not an auto-runner.** The player controls movement; the protagonist does not run forward automatically.
- **Up button — go forward**
- **Back button — stop** *(see Open decision 1 — see below)*
- **Side buttons — move left / right**
- **Double-click a side button — roll**
- **Space — jump**

Design intent, as stated: give the protagonist a space to move in.

## 3. Environment

- **Setting:** jungle
- **Layout:** running between two rows of trees
- The trees form the corridor / boundaries of the play space.

## 4. Ground hazards

| Hazard | What the player does |
|---|---|
| Logs | Jump over them |
| Potholes | Avoid them |

No other hazards were named. No consequence was stated for hitting a log or falling in a pothole (damage, slow-down, death — undecided).

## 5. Enemies

### Land enemies

| Type | As described |
|---|---|
| Standard enemies | Come and attack you |
| Fortification enemies | Named, but not described further — presumably static / defensive |
| Artillery enemies | Use artillery-like attacks on you |

### Air enemies

| Type | As described |
|---|---|
| Small, very fast flyers | Zip past; you have to kill them. Kill all 5–6 of them and you get a bonus point. |
| Dive-bombers | Attack towards you / dive-bomb you. Shoot them out, or jump out of the way. |
| Air shooters | Shoot at you |

### Spawn rule — stated explicitly

- **No limit to the number of enemies.**
- If you keep staying in one place, they keep coming at you, with increasing frequency as time goes by.
- So standing still is not a safe strategy; pressure builds over time.

## 6. Power-ups

- Found on the ground.
- Also dropped by a very specific enemy when killed — the dropped power-up then lies on the ground and can be picked up.
- What the power-ups do, and which enemy drops one, were not named.

## 7. Structure

- **Each zone: 6 levels**
  - Levels 1–5: regular levels
  - Level 6: boss level
- **Number of zones: 4–5**
- **Difficulty curve:** each zone has many more enemies, and more difficult enemies, than the one before.
- Total, as stated: 24–30 levels (4–5 zones × 6), including 4–5 bosses.

## 8. What was NOT stated — open decisions

These need your call before building, so I have not filled them in:

1. **Back button:** does it move the protagonist backwards, or is it only a brake / stop? The note says "you can stop" — not "go back".
2. **How do you attack / shoot?** Killing and shooting are required (especially for the fast flyers and dive-bombers), but no shoot / attack button was named. Is there a weapon, a shoot key, melee, or auto-fire?
3. **Health, lives, damage:** how much damage do enemies, artillery, potholes, and logs do? What happens on death — restart level, lose a life, game over?
4. **Roll:** what is it for — dodging attacks, passing through enemies, speed? Does it give any invulnerability?
5. **Power-up types:** health, weapon upgrade, shield, speed, points — which ones, and which specific enemy drops one?
6. **Fortification enemies:** static turrets / walls / bunkers? Can they be destroyed, or must they be avoided?
7. **Level completion:** how does a level end — reach the end of the jungle stretch, kill a set number, survive a timer?
8. **Bosses:** one boss per zone, but no boss type, attack, or weakness was named.
9. **Zones:** 4 or 5? And what changes between zones besides enemy count / difficulty — new jungle look, new enemy types, new hazards?
10. **Controls / platform:** keyboard arrows / WASD in the browser? Touch controls as well? Which keys exactly?
11. **Bonus point:** the 5–6 fast flyers give "a bonus point" — a point, or a bonus (score, power-up, extra life)?
12. **Scoring:** points for kills, pickups, level completion — not stated.

## 9. Suggested next step

Discuss the open decisions above first — especially #1, #2, and #7, since movement, attacking, and how a level ends shape everything else — then build a playable prototype of Zone 1, Level 1 only, to test the feel of the controls before building out zones and bosses.

---

*Brief v1, 18 Nov 2026. Source of truth remains the voice note transcript.*
