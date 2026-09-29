# Astra ultimate realm

Created with the built-in image generation tool (not the API/CLI), using the user's attached celestial landscape as a mood reference rather than copying its composition.

Runtime asset: `assets/astra-ultimate-nebula-v1.webp`.

Optimized export: 1672 × 941 pixels, 183,058 bytes, WebP quality 86. The original generated PNG remains in the local image-generation archive.

## Final generation prompt

Use case: stylized-concept.
Asset type: full-screen landscape backdrop for Astra's temporary cosmic ultimate in a polished 2D survival action game, 2048x1152 wide 16:9.
Primary request: an original magnificent deep-space realm of planets, luminous stellar clouds and distant stars. The user's attached picture is a mood reference only: warm orange-gold nebula, violet and cyan starlight, large planetary silhouette, awe-inspiring depth. Create a new composition, not a reconstruction or watermark removal.
Scene: an immense dusky aubergine planet entering from the lower-left edge, a smaller rim-lit moon above it, beautifully detailed luminous amber and rose nebula cloud pillars in the upper left-center, spacious indigo-violet starfield across the middle and right, a subtle cyan nebula high on the right and a luminous purple cosmic horizon along the lower-right with distant jagged rocky silhouettes.
Style: premium hand-painted cinematic fantasy game environment, elegant nuanced volumetric clouds, painterly surface detail with crisp clean edges, beautiful subtle stars. Epic, celestial, otherworldly.
Composition: edge-to-edge panorama with depth; keep the central gameplay zone relatively calm and medium-dark so bright characters and skill effects remain readable. Brighter gold/violet focal lights offset toward edges, not a blown-out white center. Clearly visible rich colored background, NOT an almost-black image. Keep important masses visible with modest ultrawide crop.
Constraints: environment ONLY, no characters, no user interface, no circles/rings indicating skills, no text, lettering, logos, signatures, watermarks, borders or frames. Opaque background.

## Integration

- Feathered radial reveal grows from the player's actual screen position in 54 game ticks and retracts over the final 60 ticks of the 360-tick capture duration. Camera-edge positions and mobile zoom use the same world-to-screen transform as the character.
- Drawn behind combat, warnings, skills and HUD. One reused offscreen surface isolates the reveal mask from combat; the fully revealed realm skips the mask pass.
- Aspect-ratio-preserving screen cover for desktop, tablet and phone.
- Demand-loaded for Astra, preloaded when Astra is selected in the lobby, runtime-cached by the PWA.
- Delayed image load eases in rather than appearing abruptly; failed load leaves the ordinary map visible.

## Verification

- 114 automated tests pass. Coverage includes reveal endpoints, bounded expansion steps, late/failed image loading, pause/portrait/upgrade gates, reset, demand-loading, non-stretched cover geometry, moving/off-center origins, radial mask feathering, surface reuse and independent damage/pull multipliers.
- Production renderer checked in `tests/astra-preview.html` at 1280 × 760 and 844 × 390: player-centered ripple entrance, full realm, 50% retraction and restored map. Boss arena tint and health bars remain above the background.
- No browser console errors in the refreshed review page.

## Balance follow-up

- Basic attack projectiles: previous damage × 2.
- Passive orbit-star contact and Q outward/return damage: previous damage × 6, including their existing upgrade coefficients.
- E black-hole pull: original pull strength × 6 (twice the previously deployed ×3 value), with a center-distance clamp to prevent overshoot. Range, tick damage, collapse damage and boss/summon control immunity are unchanged.
- Shared `player.damage` is unchanged so the independent requested multipliers do not stack into × 12 or buff E/R damage unintentionally.
- Base orbit radius: 120. Q cooldown: 240 frames (4 seconds at 60 fps).
- Passive orbit contact applies 18 units of outward knockback to ordinary enemies. Q outward/return hits never apply knockback, and boss/control-immune targets still take passive orbit damage without displacement.
