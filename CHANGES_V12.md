# Jungle Soldier V12

Based on V11 and the supplied V12 change brief.

- Shortened Level 1 to 950 m without increasing movement speed. Retained the scenery and animated soldier, recurring encounters, turret ambushes, crawler packs and an end breather. Removed redundant extra pit placements.
- Removed regeneration. Enemy bolts, leaks and collisions use the separate Easy/Medium/Hard damage values from the brief. Hazards retain their existing scaling.
- Added persistent main-path health drops and limited, expiring earned drops behind thorns and from fully cleared enemy groups. A leaked or collided group earns no health reward. Green plus pickups heal up to 20, cap at 100, and are wasted at full health.
- Reserved the opening 55 m for the non-firing tutorial drone. Added persistent first-leak guidance and repeated red edge flashes with actual health lost.
- Removed the rifle readiness/reloading display. Renamed the pickup Rapid fire while retaining internal asset keys for compatibility.
- Replaced the orange warning orb with a red closing ring, difficulty-specific predicted aim line, rising charge sound, white firing cue, edge chevrons and projectile hit-direction arcs. Cyan weak points pulse and flare.
- Log contact stops forward speed and plays a bump, restrained camera shake and hit flinch. Jump prompts follow the difficulty table.
- Added action-height padding and a scroll fade/more hint to the menu. Kept profile save compatibility, including the transferred first-leak warning flag.

Easy encounter pressure was reduced during testing to compensate for removing regeneration. Damage values were not reduced. Health pickup radius and fixed main-path fractions are in DIFFICULTIES. Medium and Hard remain deliberately unforgiving for a bot that never aims.

The human Medium timing target still requires a playtest. Boss levels do not exist yet. See docs/V12-validation.md.
