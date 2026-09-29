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

- Crossfade uses game ticks: 54-frame smooth entrance; 60-frame smooth exit inside the 360-frame capture duration.
- Drawn behind combat, warnings, skills and HUD; no changes to skill damage or targeting.
- Aspect-ratio-preserving screen cover for desktop, tablet and phone.
- Demand-loaded for Astra, preloaded when Astra is selected in the lobby, runtime-cached by the PWA.
- Delayed image load eases in rather than appearing abruptly; failed load leaves the ordinary map visible.

## Verification

- 109 automated tests pass, including fade endpoints, bounded opacity steps, late/failed image loading, pause/portrait/upgrade gates, reset, demand-loading and non-stretched cover geometry.
- Production renderer checked in `tests/astra-preview.html` at 1280 × 760 and 844 × 390: 50% entrance, full realm, 50% exit and restored map. Boss arena tint and health bars remain above the background.
- No browser console errors in the refreshed review page.
