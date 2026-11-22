# V13 validation

Headless Chromium (SwiftShader) against the game module with `?test=1`. No page errors or console errors in any scenario.

## Bot (hold W, fire straight ahead without aiming, jump every 1.1 s, strafe +-2.5 m)

| Difficulty | Result | Distance | Time | Health | V12 |
| --- | --- | --- | --- | --- | --- |
| Easy | Cleared | 950 m | 196.1 s | 4 | Cleared, 10 health |
| Medium | Died | 130 m (13.7%) | 28.2 s | 0 | 130 m |
| Hard | Died | 90 m (9.5%) | 20.6 s | 0 | 87 m |

The 70 m range did not make the non-aiming bot stronger, so wave size and fire rate were not changed. Easy still finishes with little health for a bot that never aims; a human aiming player will do far better, but watch Easy in playtests.

## Rule checks (unchanged from V12, all pass)
No regeneration (health stays 83 after 10 s); shot / collision / two-leak damage 4/6/6, 7/12/12, 10/20/20; earned-drop caps; no wave before 55 m; log contact sets speed to 0.

## V13 checks
- Wave entrance: 12 frames after spawning, drones are 46-50 m ahead at 5.5-6.2 m height (dropping); after 30 frames they level out near 3 m. The crawler starts at the path edge and moves in.
- Wave warning: red double chevron drawn on the wave's side during the 2 s warning.
- Finish: crossing enters `finish`, enemies are cleared, results open with 3 stars for a 94-health, 1-leak test run; tally rows and star states render.
- Finish camera: arcs round the soldier (no clipping through him); the banner reads correctly from beyond the gate.
- Menu renders; results card hidden outside results.

## Still needs a human playtest
Feel of the entrances and warning sounds, the final wave timing, results pacing, and Medium completion time with real aiming.
