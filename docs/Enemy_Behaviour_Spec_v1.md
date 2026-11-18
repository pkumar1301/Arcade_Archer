# Arcade Game — Enemy Behaviour Spec v1

**Date:** 18 Nov 2026
**Status:** Draft for discussion — proposals only, nothing approved or built
**Sources:**
1. Voice note, 18 Nov 2026 — your game, the source of truth (`Arcade_Game_Redesign_Brief_v1.md`)
2. Classic inventory you pasted 18 Nov 2026 — **Carrier Air Wing (1990), Aero Fighters (1992), Twin Cobra (1987), Thunder Blade (1987)** — inspiration, not a roster to copy 1:1
3. Arcade Archer build at http://127.0.0.1:8767/ — **untested**: my cloud browser cannot reach a server on your Mac, so no behaviour in the current build has been verified

**One question that decides a lot:** is Arcade Archer the same game as the jungle runner in the voice note, or a separate build? This spec assumes yes — a jungle runner / archer, on foot, between two rows of trees — and adapts the classic flying / naval enemies to that setting. If Arcade Archer is actually a flying shooter, the reskins in §3 are wrong and the classic behaviours should be kept literally instead.

---

## 1. How to read this spec

For every enemy, behaviour is defined in the same seven fields:

- **Spawn / entry** — where it comes from, and when
- **Movement** — path, speed, does it track you?
- **Attack** — what it fires / drops, telegraph, pattern, cooldown
- **Health** — hits to kill *(all numbers in this spec are PROPOSED, in brackets, for you to change)*
- **Counter** — the intended player answer: shoot, jump, roll, sidestep, or ignore
- **Drop** — what it leaves, if anything
- **Zone scaling** — how it gets harder in later zones

Anything in **[brackets]** is a proposal I added to make the behaviour exact enough to build. It is not from your voice note or from the classic inventory. Do not treat it as decided.

A fair-hit rule runs through the whole spec, taken from the classics: **every attack that can kill you must have a visible telegraph first** — a crosshair, a flash, a wind-up, a sound — and a dodge window. No instant, off-screen, or undodgeable hit.

---

## 2. Your core roster — from the voice note, defined exactly

These six are the game. Everything in §3 is how to fill them out.

### 2.1 Land enemies

| # | Enemy | Spawn / entry | Movement | Attack | Health | Counter | Drop |
|---|---|---|---|---|---|---|---|
| L1 | Standard attacker | Ahead, on the ground, in small groups | Walks / runs toward you | Melee / short-range hit on contact | [1 hit] | Shoot it before it reaches you; sidestep if it gets close | None, usually |
| L2 | Fortification | Fixed, ahead on the ground — a bunker / turret / wall | Does not move | Fires aimed bullets in bursts; blocks your path until destroyed | [3 hits] | Shoot from range; roll through its firing gap between bursts | Sometimes a ground power-up |
| L3 | Artillery | Behind cover / at range, on the ground | Does not move, or moves slowly | Lobs arcing shells that land where you *were* — a marker / shadow shows the landing spot before impact | [2 hits] | Move off the marker; roll out; then shoot it while it reloads | None, usually |

### 2.2 Air enemies

| # | Enemy | Spawn / entry | Movement | Attack | Health | Counter | Drop |
|---|---|---|---|---|---|---|---|
| A1 | Fast flyer — "zipper" | In a wave of 5–6, fast, across the screen | Straight, very fast pass; does not turn back | No attack — the threat is that it is hard to hit before it is gone | [1 hit] | Shoot it mid-pass; aim ahead of it | **Bonus if you kill all 5–6 in the wave** — see §5 |
| A2 | Dive-bomber | From above, ahead of you | Locks onto your position, pauses briefly (telegraph), then dives at you | Contact damage on the dive itself | [1 hit] | Shoot it during the pause, or jump / sidestep out of the dive line | None |
| A3 | Air shooter | From above / ahead, stays in the air | Hovers or drifts across, keeping distance | Fires aimed shots down at you in bursts | [2 hits] | Shoot it; roll under its burst | Sometimes a ground power-up |

### 2.3 Spawn rule — as stated

No limit to the number of enemies. If you stay in one place, they keep coming, with increasing frequency over time. Proposed exact form, for you to confirm: spawn interval starts at [every 4 sec] and shortens by [~10% every 30 sec you stay still], to a floor of [every 1.5 sec]. Moving forward resets the pressure — standing still never becomes safe, but it never becomes impossible in the first minute either.

---

## 3. Classic inventory — mapped to your game

The four classic games overlap heavily. Consolidated below into one archetype per behaviour, so the same idea is not defined four times. "Classic" is what you pasted; "Arcade adaptation" is my proposal for your jungle game.

### 3.1 Carrier Air Wing

| Classic | Classic behaviour (as pasted) | Arcade adaptation — proposed | Keep / Adapt / Drop |
|---|---|---|---|
| Formation fighters | Fly in small squadrons; some dive through your path or enter from above/below. Red formations can carry pickups. | **This is your A1 zipper, plus a variant:** a squadron of 3–5 that crosses in formation; the red-marked one carries a pickup. If it dives, it becomes A2. | **Keep** — core |
| Missile fighters | Turn into your path and launch missiles your shots cannot destroy. | A fast flyer that fires one missile you **cannot shoot down** — you must sidestep / roll / jump it. Telegraph: a lock-on flash before launch. | **Keep, as a later-zone variant** — the indestructible missile is the point; do not make it shootable or it is just A3 |
| Collision-course planes | Fly directly through your position; some in narrow passages with less room to dodge. | A flyer that aims at your exact position at spawn and flies straight through it. In a narrow stretch (trees close in), the dodge window is the challenge. | **Keep** — this is A2 without the pause; use it sparingly, only where there is room to dodge |
| Large camouflage aircraft | Enter from above/below, fire three missiles rearward; later appearances have escorts. | A big, slow air enemy that crosses high and fires a **3-shot spread backward** as it passes. Escorts = 2× A1 flyers alongside it in later zones. | **Adapt** — make it a large bird / airship; keep the 3-shot rear spread |
| Stealth bombers (large/small) | Smaller bombers release bombs that burst into three-way shots. | A bomber that drops a bomb; on reaching your height it bursts into **3 shots (left / straight / right)**. Telegraph: the bomb flashes before bursting. | **Keep** — distinct from A3 because the burst, not the bomb, is the threat |
| Circle bombers | Turn back after entering high, release a bomb that bursts into an expanding ring of bullets. | Same entry, but the burst is a **full ring** — the only safe answer is to be far away or behind cover / rolling through a gap. Use rarely, as a mini-boss / zone-3+ enemy. | **Keep, rare** — a ring with no gap is unfair; propose a gap in the ring, or a long telegraph |
| Ground-bombing aircraft | Drop bombs that send flames upward; later variants fire bombs into walls in confined sections. | A flyer that drops a bomb on the ground; flames shoot **upward** from the impact point for [1 sec]. You must not be standing there, and cannot jump over the flame column. | **Keep** — the upward flame punishes standing still, which fits your spawn rule |
| Reconnaissance aircraft | Carry a large radar dish, scatter aerial mines, mark your position with a visible crosshair before attacking. | **Spotter:** does not attack directly. It shows a **crosshair on you for [1 sec]**, then calls in a strike / drops mines around that spot. Kill it first, or move after the crosshair locks. Mines stay on the ground until shot or avoided. | **Keep** — the crosshair is the clearest fair telegraph in the whole inventory; use it as the model for all telegraphed attacks |
| Attack helicopters | Fire ordinary bullets in groups; some loop around you or approach from behind and pause when lined up with you. | A hovering shooter (A3 variant) that **circles to your blind side, pauses when lined up, then fires a burst**. The pause is the tell — and your shooting window. | **Keep** — this is the best A3 variant; the pause makes it fair |
| Heavy transport helicopters | Fire spreads or curving shots; deploy smaller units below them, including tanks and missile launchers. | A large, slow air enemy that **drops L1 ground enemies and L3 artillery** as it passes. Shoot it down early or deal with what it drops. | **Keep, later zones** — it is a spawner, not just a shooter; cap what it can drop per pass at [2 units] |
| Light tanks | Move along roads, slopes, ship decks; some emerge from caves or are dropped by transports. | Your L1, but armoured and on the ground: moves along the jungle floor, fires a slow shot. Can emerge from behind trees / be dropped by the transport above. | **Keep** — fold into L1/L2, not a separate roster slot |
| Heavy two-part tanks | Fire a large cannon shot and smaller spreads; after the upper section is destroyed, the lower section can still release aerial mines. | **Two-stage ground enemy:** destroy the top [2 hits] and it keeps fighting — the base then releases **mines into the air** that drift down. You must finish it, not just wound it. | **Keep, as a boss / mini-boss** — the two-stage trick is memorable, but confusing as a regular enemy; telegraph the second stage clearly |
| Mobile missile launchers | Fire homing missiles that **can** be shot down. | A ground launcher whose missile **homes gently toward you but can be shot down mid-flight**. Counter is shooting the missile, not just dodging. This is the opposite of the Missile fighter in §3.1 — keep the contrast explicit. | **Keep** — the shootable / unshootable contrast is a good teaching pair |
| Fixed guns and launchers | Ground, wall, ceiling, ship-mounted; fire bullets, missiles, or lasers. Fighter bays release aircraft. | Your L2 fortification, with variants: bullet turret (fast, weak), missile launcher (slow, homing, shootable), laser (telegraphed line, then a beam — do not stand on the line). A "bay" variant releases A1 flyers. | **Keep** — L2 with three weapon variants, introduced one zone at a time |
| Gunboats | Some launch missiles upward; later boats use flamethrowers in tighter waterways. | Only if a zone has a river. Otherwise **drop** — no water in the jungle corridor as described. If a river zone is added, this is its fortification. | **Drop unless a river zone is added** |
| Fleet ships | Passive ships with destructible deck targets; armed ships with turrets and vehicles on deck. | **Drop as ships.** Keep the idea as a large, multi-part ground target: a destructible structure with turrets on it — essentially a big L2. | **Adapt the idea, drop the ships** |

**Carrier Air Wing large encounters** (missile walker, warship, carrier, submarine, armored train, laser fortress, three-part launch platform / shuttle / satellite finale): these are boss templates, not regular enemies. Proposed mapping to your 4–5 zone bosses (Level 6 of each zone):
- Zone 1 boss: armored train equivalent — a large ground enemy that moves along the corridor, with turrets
- Zone 2 boss: laser fortress — a fixed fortification with a telegraphed laser, plus spawning A1 flyers
- Zone 3 boss: missile walker — a tall, walking artillery enemy, with the two-stage rule from the heavy tank
- Zone 4 boss: launch platform — a three-part target; destroy the parts in order, then the core
- Zone 5 boss (if 5 zones): the finale — a multi-phase fight combining the spotter crosshair, the ring burst, and the transport's drops
All boss proposals — type, order, and phase rules are undecided.

### 3.2 Aero Fighters (1992)

Fighter jets, helicopters, boats, ground gun emplacements, hidden targets, and the space-stage roster (Station Core, then Pandora or Osaru) add no new *behaviour* beyond §3.1 — they are the same archetypes with different sprites. Two things from Aero Fighters are worth keeping, as systems, not enemies:

- **Hidden targets:** stage-specific targets revealed by shooting — propose: shootable jungle objects (a marked tree / rock / bush) that reveal a pickup or bonus. Introduces exploration without a new enemy.
- **Final-stage roster change:** the last zone plays differently (space stage in the original). Propose: your final zone changes the rules visibly — e.g. night jungle, or a new enemy mix — so the finale feels distinct, not just harder.

The large encounters named in the sprite archive (New Jersey, Super X Kai, Holly Mountain, Avro Bomber, Vazeel, Pomornik, MiG-31 Icefox) are boss names, not behaviours — no behaviour is defined for them in what you pasted, so I have not invented any.

### 3.3 Twin Cobra (1987)

Same archetypes again (small / large helicopters, large bombers, tanks, artillery / fixed guns, warships, fortified positions, fortress finale). The valuable part is the **pickup and weapon system**, in §5 below. One behaviour note worth keeping: *airborne enemies destroy you on contact, and you can fly over ground / sea units whose fire remains dangerous* — in your game: **touching an air enemy hurts you, and jumping over a ground enemy does not make its shots miss you**. State that explicitly, or players will assume jumping clears everything.

### 3.4 Thunder Blade (1987)

Helicopters, jets (with a large jet ending Stage 3), tanks (giant tank ending Stage 2), armed boats, fixed guns, battleship ending Stage 1. No new behaviours beyond §3.1. Its design lesson is the opposite of Twin Cobra's: **no collectible weapon upgrades at all** — rapid-fire cannon + air-to-ground missiles, unlimited ammo, from the start. That is the simple alternative to a pickup / shop system: if the shop and power-ups become fiddly, this is the fallback — one good weapon, and difficulty comes from enemy patterns, not from gear.

---

## 4. What does NOT transfer to a jungle runner

Be explicit about these, so they do not creep back in as literal sprites:

- **Ships, submarines, gunboats, fleet ships** — no sea in the jungle corridor as described. Drop, unless a river / coastal zone is added.
- **Jets and bombers as aircraft** — reskin as large birds / flying creatures / airships, or drop. The *behaviour* (3-way burst, ring burst, rear spread) transfers; the jet sprite does not.
- **Helicopters** — reskin as hovering flyers / drones. The *behaviour* (loop, pause when lined up, transport drops) transfers.
- **Tanks on roads / ship decks** — reskin as armoured ground crawlers on the jungle floor. The *behaviour* (slow, armoured, cannon + spread, two-stage) transfers.

If you want the game to stay a flying shooter after all, say so — then §3 should be read literally, and this section is wrong.

---

## 5. Pickups, weapons, and the shop — mapped from the classics

Your voice note says: power-ups on the ground, plus a drop from a very specific enemy. It does not say what they do. The classics give three complete models — pick one, do not mix all three at first:

### Model A — Carrier Air Wing (shop + capsules)
- **Red capsule:** wide main-gun fire, most screen coverage, slower firing
- **Blue capsule:** heavy straight missiles, narrow path
- **Green capsule:** concentrated rapid fire, between red and blue
- **POW progression:** each capsule adds 1 POW; gun levels at **0, 2, 8, 15, 23, 31 POW** (as pasted)
- **Fuel tanks (blue / green):** refill the fuel gauge — in your game, the equivalent is health / stamina, if you have a gauge at all; refill amounts unverified in the source
- **Yashichi:** refills fuel in the final mission, drops from a red turret on the launch structure — in your game: a rare full restore, dropped by a specific red-marked fortification in the final zone
- **Pre-mission shop:** two sizes of fuel-tank upgrade; shields absorbing **3 or 5 hits**; special weapons per aircraft / mission, including Missile Dispenser, Shrike / Standard missiles, Bomb, Super Bomb, Napalm Bomb, Super Napalm, Big Boy, Apache, Super Bomb Dispenser, Napalm Dispenser, Sparrow, Sidewinder, AMRAAM, Phoenix (F-14 only), and the final mission's Super Shell Pod — forward volleys, homing, ground bombing, wide-area
- **Hidden score pickups:** white astronaut, Capcom cow, snowman, red astronaut at **10,000 points each**, statuette **6,000**

### Model B — Aero Fighters
- **P:** weapon +1 level
- **F:** weapon straight to full power; full power has a limited shot count, then drops one level
- **B:** +1 use of the special attack; each life starts with 2 uses
- **Currency:** points; appearance matches the pilot's country
- **Extra life:** operator-set at **200,000 / 300,000 / 400,000 points**, or off; default **200,000**

### Model C — Twin Cobra (simplest to build)
- **Red Gun:** default forward shot; upgrades widen the stream / add bullets
- **Green Storm:** narrow straight shot, pierces certain enemies; upgrades increase damage
- **Blue Eye:** forward fan, grows to five directions
- **Yellow Cross:** fires forward, backward, left, right; upgrades widen streams / add bullets
- **Weapon cycle:** red → green → blue → yellow; switching colour **preserves your shot level**; collecting your current colour = **2,000 points**
- **S:** shot strength +1, up to level 10
- **B:** +1 bomb, hold up to 7
- **1UP:** +1 life, released by certain defeated enemies
- **Star:** 100 points immediately, +3,000 more at stage clear per star retained; losing a life resets the stage's star tally
- Losing a life resets the weapon to Red Gun and restarts you with 3 bombs

### Proposed pick for your game — for discussion
**Start with Model C (Twin Cobra), with the Carrier Air Wing shop on top of it.** Reason: four colour weapons are easy to understand mid-run, the S / B / 1UP / Star items map directly onto your ground power-ups and your specific-enemy drop, and the shop then sells shields (3-hit / 5-hit, as in Carrier Air Wing) and bomb capacity, not a second weapon system. Model A alone is heavier; Model B's F (full power, then drops a level) is a good later addition if full power feels too strong.

**Your A1 zipper bonus, defined:** kill all 5–6 fast flyers in a wave = **bonus point** — propose this is a Star (Model C: 100 points now, +3,000 at level clear per star retained) or a score bonus of [1,000 points], not a power-up. Confirm which: score, or a pickup?

**The specific enemy that drops a power-up:** propose the red-marked formation leader (Carrier Air Wing: red formations carry pickups) — and, in the final zone, the red turret / Yashichi equivalent. Confirm, or name a different enemy.

---

## 6. Decisions needed before this can be built

1. **Same game?** Is Arcade Archer the jungle runner from the voice note, or a separate flying shooter? (§4 depends on this.)
2. **Attack button:** the voice note names no shoot button; the playtest brief assumed left-click to aim / fire. Confirm: mouse aim + hold left click, keyboard, or both?
3. **Health / lives:** shields (3-hit / 5-hit), lives, or a health bar? What happens on death?
4. **Which pickup model:** A, B, or C in §5 — or Thunder Blade's no-upgrades model?
5. **Zipper bonus:** score points, a Star, or a power-up?
6. **Which enemy drops a power-up:** red formation leader, or another named enemy?
7. **Zones:** 4 or 5? And does the final zone change rules, as in Aero Fighters' space stage?
8. **Bosses:** approve, change, or replace the five boss proposals in §3.1?
9. **Numbers in [brackets]:** hits to kill, spawn intervals, bomb counts — accept as starting values for a Zone 1 prototype, or change them first?

---

*Spec v1, 18 Nov 2026. Voice note is the source of truth for your game; the classic inventory is inspiration. Nothing here is approved until you say so.*
