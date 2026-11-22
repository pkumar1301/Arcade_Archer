# Jungle Soldier Forest art

`art/sprites/weapon_triple.png` is the replacement Triple Shot inventory icon. It uses a transparent 256 × 144 canvas.

## Beetle Tank

Use the four front-facing sprites below for the arena. All four use a transparent 560 × 640 canvas with the same track-center anchor at (280, 624), measured from the top left. Keep the same world size and anchor when swapping textures.

| Health remaining | Sprite name | Visual cue |
| --- | --- | --- |
| Above 66% | `boss_beetle_tank_siege` | Full teal carapace and both cannons |
| Over 33%, up to 66% | `boss_beetle_tank_brood` | Torn shoulder plate, exposed ribs, and purple growths on the treads |
| Over 12%, up to 33% | `boss_beetle_tank_rampage` | Broken lower cannon, stripped shell, and exposed cyan core |
| Up to 12% while alive | `boss_beetle_tank_critical` | Two broken cannons and a charred chassis glowing orange |

The 12% threshold changes the sprite during Rampage. Use separate gameplay effects for the core vulnerability window and hatchable pods. The purple growths in the Brood sprite are baked into the tank art.

## Level-select map

`art/jungle-trail-map.webp` is a 1536 × 1024 background. Overlay level buttons on the trail using the following positions, measured from the top left of the image. Keep the image and its overlay in the same 3:2 container so the buttons stay aligned when resized.

| Stop | Horizontal | Vertical |
| --- | ---: | ---: |
| 1. Overgrown Trail | 14% | 84% |
| 2. Temple Approach | 30% | 68% |
| 3. Buggy Run | 36% | 40% |
| 4. Hive Grove | 65% | 49% |
| 5. Night of the Ancients | 62% | 28% |
| 6. The Beetle Tank | 87% | 24% |
