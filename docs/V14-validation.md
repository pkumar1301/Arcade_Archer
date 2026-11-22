# V14 validation

Headless Chromium (SwiftShader) against the game with `?test=1`, using `tools/test_v14.mjs`. Full results are in `docs/V14-test-results.json`. No page or console errors in any scenario. **16 of 16 checks pass.**

## Section 14 checklist

| Check | Result |
| --- | --- |
| L1 unchanged (V13 bot) | Pass |
| Levels as data (music, light, enemy mix) | Pass |
| L2 turret every 70-90 m with cover in front | Pass |
| Bot clears Easy on every level | Pass |
| Bot dies early on Medium and Hard | Pass |
| Buggy lane marker 1.5 s before every charge; pods take damage; ram damage matches | Pass |
| Hive bee: 3 mini-drones every 4 s; belly double; grenade clears minis | Pass |
| Spore mushroom stuns within 4 m for 2 s; cloud slows the soldier | Pass |
| Dusk fog on L3 and L4, night with lanterns on L5 | Pass |
| Boss: three phases at the right health, warnings, cover crumbles after 6 hits, death restarts at the arena | Pass |
| Boss fight length (scripted player, Medium) | Pass |
| Level select: L1 unlocked, others locked, six stops on the trail | Pass |
| Clearing a level unlocks the next; Continue goes to it | Pass |
| Beating the boss unlocks the Triple Shot; Q swaps weapons | Pass |
| Old save codes load; progress survives a reload; map shows stars and locks | Pass |
| No page or console errors | Pass |

## Bot (hold W, fire straight ahead without aiming, jump every 1.1 s, strafe ±2.5 m)

| Level | Easy | Medium | Hard |
| --- | --- | --- | --- |
| L1 | Cleared, 950 m, 196 s, 4 health | Died, 130 m, 28 s, 0 health | Died, 90 m, 21 s, 0 health |
| L2 | Cleared, 950 m, 196 s, 13 health | Died, 147 m, 32 s, 0 health | Died, 86 m, 22 s, 0 health |
| L3 | Cleared, 950 m, 177 s, 82 health | Died, 120 m, 26 s, 0 health | Died, 105 m, 21 s, 0 health |
| L4 | Cleared, 950 m, 177 s, 63 health | Died, 133 m, 30 s, 0 health | Died, 81 m, 19 s, 0 health |
| L5 | Cleared, 950 m, 177 s, 63 health | Died, 145 m, 32 s, 0 health | Died, 90 m, 21 s, 0 health |

L1 matches V13 exactly (Easy 196.1 s with 4 health; Medium dies at 130 m; Hard at 90 m). L2 on Easy finishes with 13 health, so it is the tightest Easy level; watch it in playtests.

## Rule checks (all three difficulties)
- **Leaf Buggy:** enters at 46 m, marker visible, charges 1.53 s later at 10 m/s. Ram costs 5 / 10 / 18; dodging the lane costs normal leak damage (3 / 6 / 10). Two hits destroy a pod and take 2 HP off the buggy.
- **Hive bee:** releases 3 mini-drones at 1.2 s, 5.2 s and 9.2 s while hovering 21–25 m ahead. The belly takes 2 per round against 1 on the body. A grenade cleared all mini-drones. A mini-drone that gets past costs 1 / 3 / 5.
- **Spore mushroom:** an enemy 2.5 m from the cloud is stunned for 2 s and does not move; one 7 m away is not. Soldier speed in the cloud 3.47 m/s against 6.0 outside (−42%).
- **Beetle Tank:** 80 / 120 / 160 health. Cannon warning 1.06 s before the first bolt; core open 1.5 s after the volley. A cover block crumbles on the 6th bolt. Brood at 66% (pods swell before hatching; a pod is worth 5), Rampage at 33% (lane marker 1.03 s before the charge; core open while stuck; a grenade then deals 9), critical art below 12%. Death shows Retry fight, which restarts at the arena with full tank health and all three stones.
- **Rewards:** results show 200 coins and the Triple Shot; Q then swaps to it and each trigger pull fires 3 rounds. Progress is per difficulty (Easy did not get Medium's Triple Shot).
- **Progression:** a V13 `JS1-` code with Level 1 cleared on Medium loads as Level 2 unlocked with its 2 stars. Launch Mission opens the map and clicking a stop starts that level. Progress is identical after a page reload; a new `JS2-` code restores it on another browser.

## Boss fight length (scripted player on Medium)
The scripted player hides behind the stones during volleys, steps out to shoot the open core and the pods, dodges charges and jumps slams. Aim error is random scatter on every shot.

| Player | Run 1 | Run 2 |
| --- | --- | --- |
| Aim error 0.12 | Won in 80.2 s, 93 health | Won in 79.4 s, 93 health |
| Aim error 0.25 | Won in 116.7 s, 67 health | Won in 117.8 s, 93 health |

A rifle round counts as 0.4 against the tank (`BOSS.bulletDamage` in `levels.js`). At full value (1.0) the same players won in 40–60 s, well short of the 2–3 minute target. A human with average aim should land in the 2–3 minute band; tune `bulletDamage` after playtests.

## Visual checks (screenshots from the test run)
Night (L5) and dusk (L3, L4) keep every enemy readable: enemy art ignores fog. The buggy's lane marker reads clearly on the dirt path. The tank's four damage states swap in place with no offset, and the brood pods sit over the growths painted on the treads. The dusk backdrop fades into the sky at its edges.

## Still needs a human playtest
- Level length on Medium with real aiming (the bot never aims; targets are about 3 minutes).
- Whether buggy lanes and pit gates on L3 feel fair, and whether L5 is relentless rather than unfair.
- Boss fight length and the 2:30 star.
- Whether 12–20 s of hive bee hovering is right.
