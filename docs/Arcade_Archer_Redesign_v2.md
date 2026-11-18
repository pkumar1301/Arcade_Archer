# Arcade Archer — Redesign v2

**Date:** 18 Nov 2026
**Status:** Draft for approval — no game code has been changed
**Decision taken:** Replace the canopy branch run with the ground jungle run from the voice note. Arcade Archer *is* the jungle runner.
**Sources:** Voice note 18 Nov 2026 (`Arcade_Game_Redesign_Brief_v1.md`), Carrier Air Wing / Aero Fighters / Twin Cobra / Thunder Blade inventory you pasted, `Enemy_Behaviour_Spec_v1.md`, and `Arcade_Archer_Essence_Gap_v1.md` (code-verified current build).

All numbers in **[brackets]** are starting proposals for a Zone 1 prototype, not decisions. The fair-hit rule from Spec v1 stands: every attack that can hurt you has a visible telegraph first, and a dodge window.

---

## 1. The redesign in one line

Keep the shooting — mouse aim, hold left click to fire, crossbow, coins, shop — and replace everything else: no more auto-forward branch-hopping in the canopy. You run on the jungle floor, between two rows of trees, at a speed you control. You can stop, sidestep, roll, and jump, and the game punishes standing still.

That is the Carrier Air Wing essence, translated: a forward shooter where *movement is the defence* — you dodge patterns by moving, not by picking a lane at a branch point — with a pre-mission shop, weapon levels, and a boss at the end of each zone.

## 2. Core loop (v2)

1. **Run forward** through a jungle corridor, at your speed.
2. **Shoot** land and air enemies while you move — aiming with the mouse, firing by holding left click.
3. **Dodge** hazards and telegraphed attacks by strafing, rolling, or jumping.
4. **Collect** coins and ground power-ups; a specific enemy drops one.
5. **Spend** coins in the shop — before a level, and at a mid-run outpost.
6. **Finish** the level by reaching its end, then fight the boss on level 6 of each zone.
7. **Do not stand still** — enemies keep coming, faster the longer you stay in one place.

A level ends by reaching its end, not by killing everything. Killing is how you earn coins, score, and drops — and how you stay alive — not the level goal. That keeps the run moving forward, like Carrier Air Wing.

## 3. Controls (v2 — proposed)

This merges the voice note with the current build. The one conflict is Space: the voice note says Space = jump, the current build uses Space = Power Attack. This proposal gives jump to Space, and moves Power Attack to **E / right click**.

| Input | v2 action | Notes |
|---|---|---|
| **W / ↑** | Run forward | Hold to run. Release to slow to a stop — you do not auto-run. |
| **S / ↓** | Stop / brake | Hold to brake to a stop. **No reverse** — see Decision 1. |
| **A / D, ← / →** | Strafe left / right | Free sideways movement across the corridor, not lane choice. |
| **Double-tap A / D** | Roll | [Roll distance ~3 m, cooldown ~1.2 s, brief invulnerability ~0.4 s during the roll.] |
| **Space** | Jump | [Jump over logs; air time long enough to clear a log and a pothole, not to stay airborne.] |
| **Mouse** | Aim | As now. |
| **Hold left click** | Fire | As now. Cooldown [0.31 s], [0.17 s] with Quick reload. |
| **E / right click** | Power Attack | Was Space. Damage 3, pierces up to 8 enemies, uses 1 charge, max 3 charges. |
| **Esc** | Pause | As now. |
| **M** | Music on/off | As now. |

Why no reverse: in a forward runner, moving backwards breaks the camera, the spawn pressure, and the level-end goal. "Back = stop" in the voice note reads as a brake, not a reverse gear. If you want a slow step-back, say so — it is Decision 1 below.

## 4. Ground and environment (v2)

- **Setting:** jungle floor, not canopy. The camera drops to behind and just above the runner, looking forward down the corridor.
- **Corridor:** two rows of trees forming the sides, as in the voice note. Proposed width **[~12 m]** — wide enough to strafe, roll, and dodge a 3-way burst, narrow enough that a ring burst or a flame column matters.
- **Ground:** flat jungle floor at y = 0. The current forest floor at y −9, and the branch landings every 20 m, are removed.
- **Level length:** keep the current template, **[380 m per regular level]**, for Zone 1. Boss levels are arena-style, not a run — see §7.
- **Camera:** keep the current third-person follow, lowered to ground level. No more branch-to-branch jump arcs.

### Hazards

| Hazard | Behaviour | Counter | Proposed cost if hit |
|---|---|---|---|
| Log | Lies across the corridor, at ground level | Jump over it | [20 health] + stumble / brief slow |
| Pothole | A hole in the floor, visible ahead | Strafe around it; jumping over it also works, but a jump landing in it still counts | [25 health] + brief slow |
| Flame column | From a ground-bomber (see §5) — flames shoot upward from an impact point for [1 s] | Do not stand there; you cannot jump over the column | [30 health] |

Jumping over a ground enemy does **not** make its shots miss you (Twin Cobra rule, from Spec v1). Touching an air enemy hurts you.

## 5. Enemies (v2)

### 5.1 What survives from the current build

| Current enemy | v2 role | Change |
|---|---|---|
| Moth (1 HP, 100 pts, no attack) | **Zipper / fast flyer** | Now in waves of 5–6, very fast, straight pass. Kill all 5–6 = bonus (see §8). |
| Beetle (2 HP, 180 pts, collision 35) | **Standard ground attacker** | Walks toward you on the ground; contact damage kept at [35], but now you can shoot it from range or sidestep it — it is no longer tied to a landing. |
| Turret (2 HP, 180 pts, shoots 7–38 m, halo telegraph) | **Fortification** | Fixed on the ground, as now, but at ground level, not y −8.05. Keep the halo telegraph and the 7–38 m firing range. Variants by zone: bullet, missile (homing, shootable), laser (telegraphed line, then beam). |
| Glider (2 HP, 180 pts, shoots, sine sway) | **Air shooter** | Hovers / drifts, fires aimed bursts down at you. Keep the sine sway and the same shooting timing. A later variant loops around you and pauses when lined up, then fires — the pause is your shooting window. |

### 5.2 What is added, and when

Introduced one or two at a time, so Zone 1 stays learnable. Full behaviour definitions are in `Enemy_Behaviour_Spec_v1.md` §3 — this is the introduction order.

| Zone | New enemies |
|---|---|
| **Zone 1** | Standard (beetle), Fortification (turret), Zipper wave (moth, 5–6), Air shooter (glider). Plus logs and potholes. |
| **Zone 2** | **Artillery** — lobs arcing shells at where you were; a marker / shadow shows the landing spot first. **Dive-bomber** — locks on, pauses (telegraph), then dives; shoot it in the pause or jump / sidestep out of the line. **Mobile missile launcher** — homing missile you *can* shoot down. |
| **Zone 3** | **Spotter / Recon** — shows a crosshair on you for [1 s], then calls a strike / drops mines around that spot. Kill it first, or move after the lock. **Stealth bomber** — drops a bomb that bursts into 3 shots (left / straight / right). **Transport** — large, slow, drops [up to 2] ground enemies as it passes. |
| **Zone 4** | **Missile fighter** — fires a missile you *cannot* shoot down; you must dodge it. The deliberate contrast to Zone 2's shootable missile. **Circle bomber** — bomb bursts into a ring, with a gap in it; rare. **Two-part tank** — destroy the top and the base keeps fighting, releasing mines; a mini-boss, not a regular. |
| **Zone 5 (if 5 zones)** | No new regulars. Finale mix of everything, at higher density and speed. |

Dropped: gunboats and fleet ships (no water in the jungle corridor, unless a river zone is added later). Jets / helicopters / tanks are reskins only — large bird / hovering flyer / armoured crawler — the behaviours above are what transfer.

### 5.3 Spawn pressure (v2 — proposed)

Scripted encounters (the current 32-encounter plan, adapted to ground distances) **plus** endless pressure:

- If you move forward, you meet the scripted encounters for that stretch.
- If you stay in one place, extra enemies spawn: first extra after [4 s] still, then the interval shortens by [~10% every 30 s] still, to a floor of [every 1.5 s].
- Moving forward resets the pressure timer. Standing still is never safe, and never impossible in the first minute.

## 6. Health, lives, and death (v2 — proposed)

- **Health:** 100, as now. Recovery / invulnerability [0.75 s] after a hit, as now. Shield absorbs hits (see §8).
- **Damage (kept from the current build):** enemy projectile [30], beetle collision [35]. Log [20], pothole [25], flame column [30].
- **Lives:** **[3 lives.]** On death, lose a life, restart the current level, weapon resets to Red Gun, Power Attack charges reset to 3 (Twin Cobra rule). Game over at 0 lives.
- This is a proposal — the current build has health only, no lives. See Decision 3.

## 7. Zones, levels, and bosses (v2 — proposed)

- **Zones: [4].** The voice note says 4–5; 4 keeps the build achievable, and a 5th finale zone can be added later without changing the earlier four.
- **Each zone: 6 levels** — 5 regular runs ([380 m] each, as now) + level 6 is a boss arena.
- **Total: 24 levels, 4 bosses.**
- **Difficulty:** each zone has more enemies, faster spawns, and harder variants than the last — more artillery and missile fighters, fewer plain standards, tighter telegraph windows (never below a fair dodge window).
- **Final zone change:** like Aero Fighters' space stage, the last zone changes visibly — propose **night jungle** (darker, torches / muzzle flashes matter, spotter crosshairs glow). It is a look-and-feel change, not a new ruleset.

### Bosses (from Spec v1 §3.1, unchanged in outline)

| Zone | Boss | Core mechanic |
|---|---|---|
| 1 | Armoured train equivalent — large ground enemy moving along the corridor | Turrets on it; destroy them, then the core |
| 2 | Laser fortress — fixed fortification | Telegraph line, then beam; spawns zipper waves while you dodge |
| 3 | Missile walker — tall, walking artillery | Two-stage: destroy the top, the base keeps fighting and releases mines |
| 4 | Launch platform — three-part target | Destroy the parts in order, then the core; finale combines spotter crosshair, ring burst, and transport drops |

Boss health, phase counts, and exact attacks are not set in this draft — they are set when each boss is built, in its own phase.

## 8. Pickups, weapons, and shop (v2 — proposed)

**Pickup model: Twin Cobra colour cycle, with the Carrier Air Wing shop on top** (the recommendation from Spec v1 §5). One system in the run, one system between runs — not two weapon systems at once.

### Weapons (crossbow bolts, by colour)

| Colour | Shot | Notes |
|---|---|---|
| **Red** | Default forward shot | Start of every life. Upgrades widen the stream / add bullets. |
| **Green** | Narrow, straight, piercing | Pierces certain enemies; upgrades increase damage. |
| **Blue** | Forward fan | Grows to five directions with upgrades. |
| **Yellow** | Four-way (forward, back, left, right) | Upgrades widen the streams / add bullets. |

- Collecting a colour switches to it; **switching preserves your shot level**.
- Collecting your current colour = **[2,000 points]**.
- **S item:** shot strength +1, up to level 10.
- Power Attack charges are the **B item**: +1 charge, hold up to [7] (current build caps at 3 — raise it, or keep 3; see Decision 5).

### Ground power-ups and drops

- Power-ups lie on the ground, as in the voice note. Walk over one to collect it.
- **The specific enemy that drops one:** the red-marked formation leader (Carrier Air Wing: red formations carry pickups). In the final zone, the red turret drops the rare full restore (the Yashichi equivalent).
- **Zipper bonus:** kill all 5–6 fast flyers in a wave = a **Star** — [100 points now, +3,000 at level clear per star retained]; losing a life resets the level's star tally.
- **Hidden targets:** shootable jungle objects (a marked tree / rock / bush) that reveal a pickup or bonus. From Aero Fighters, and cheap to add once shooting works on the ground.
- **1UP:** +1 life, released by certain defeated enemies (rare).

### Shop (v2)

Two shops, not one:

1. **Pre-level shop** (new, Carrier Air Wing style) — spend coins carried over from earlier levels, before a level starts. Sells: shield upgrades, Power Attack capacity, bolt level, and special weapons (see below).
2. **Mid-run outpost** (kept) — the current shop at **120 / 380 m**, same five offers, updated prices in brackets.

| Offer | v2 cost | v2 limit |
|---|---|---|
| Extra crossbow (dual) | [8 coins] | once |
| Power bolts (bolt level +1) | [7 coins] | level < 3 in-run; shop can raise the cap |
| Power attack charge | [4 coins] | max [3] in-run, [7] with shop capacity |
| Quick reload · 12 shots | [4 coins] | only if none active |
| Shield | [3 coins] | **Shield now absorbs [3 hits] (small) or [5 hits] (large, higher cost)** — Carrier Air Wing's 3/5-hit shields, replacing the current 1-hit shield |

Special weapons in the pre-level shop (Carrier Air Wing list, adapted to a crossbow): forward volley, homing bolts, ground bomb, wide-area burst. Exact list and costs are set in Phase 2, once the base weapon feels right — do not add them in Phase 1.

## 9. What to keep, change, and remove from the current code

| Current code | v2 |
|---|---|
| Three.js scene, lighting, fog, canopy art, music loop | **Keep** — reuse the renderer, lights, and art where they fit; re-ground the scenery to the floor |
| Mouse aim, hold-left-click fire, raycast, tracer, burst effects | **Keep** |
| Coins on the route, wallet, score, HUD (health / score / coins / distance / speed) | **Keep** — HUD gains: zone / level, lives, weapon colour + level, charges |
| Moth / beetle / turret / glider meshes and behaviours | **Keep as the base**, adapted to the ground (§5.1) |
| Shop offers (dual, level, charge, reload, shield) | **Keep**, with 3/5-hit shields (§8) |
| Route landings every 20 m, branch choice, midair switch, jump arcs | **Remove** — replaced by free ground movement (§3–§4) |
| Auto-forward speed, W = faster / S = slower | **Remove** — replaced by W = run, S = stop (§3) |
| Space = Power Attack | **Change** — Space = jump; Power Attack moves to E / right click (§3) |
| Turret at y −8.05, forest floor at y −9 | **Remove** — ground is y = 0 (§4) |
| Fixed 32-encounter plan, no spawn pressure, no zones / boss | **Change** — scripted encounters + pressure spawns, 4 zones × 6 levels (§5.3, §7) |
| Health only, no lives | **Change** — 3 lives, Twin Cobra reset on death (§6, Decision 3) |

## 10. Build plan (phases — no code changes until you approve this doc)

- **Phase 0 — this doc.** You approve, change, or reject the decisions in §11. Nothing is built yet.
- **Phase 1 — Zone 1, Level 1 ground prototype only.** Free movement (W/S/A/D, roll, jump), mouse aim / fire, logs + potholes, three enemies (standard, turret, zipper wave), coins. No shop, no zones, no boss, no new weapons. Goal: test whether the *feel* of running and shooting on the ground is right.
- **Phase 2 — Full Zone 1.** All 6 levels, boss 1, pre-level shop + mid-run outpost, Twin Cobra weapon colours, drops, lives, hidden targets.
- **Phase 3 — Zones 2–4.** New enemies per §5.2, bosses 2–4, night jungle in Zone 4, difficulty scaling.
- **Phase 4 — Polish + playtest.** GitHub Pages publish (when you are ready), full playthrough, HUD-distance bug list, balance pass on the [bracketed] numbers.

## 11. Decisions needed before Phase 1

1. **Back button:** S = stop only (recommended), or S = step backwards as well?
2. **Zones:** 4 (recommended) or 5?
3. **Lives:** 3 lives with a level restart on death (recommended), or health-only as now, with game over on 0 health?
4. **Power Attack:** E / right click (recommended), or another key?
5. **Power Attack capacity:** keep the current cap of 3, or raise it to 7 (Twin Cobra's bomb cap)?
6. **Shield:** 3-hit / 5-hit shields in the shop (recommended), or keep the current 1-hit shield?
7. **Level length:** keep [380 m] per regular level, or change it?
8. **Night jungle in the final zone:** yes (recommended), or keep every zone in daylight?

Answer these in your own words — a tap on "approve" is approval of this doc as the plan, not of the bracketed numbers, which are tuned in Phase 1 playtesting.

---

*Redesign v2, 18 Nov 2026. Voice note is the source of truth; the gap file is what is wrong with the current build; this doc is the plan to fix it. No game code has been changed.*
