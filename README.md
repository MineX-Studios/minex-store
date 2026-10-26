# MineX Store — v8

A ground-up redesign of the MineX server store (`scan.minex.gg/store`), built as
static HTML/CSS/JS with **no build step and no images except the server's own
screenshots and logo**. Every product rendering in the UI is generated in the
browser from hand-authored geometry.

## Why v8 exists

v7 had the right instincts — dark gold palette, tier colour-coding, a basket
drawer — but it stalled on the thing that actually decides whether someone buys:
the product art. The sprites were 64px images floating in 170px boxes, and the
page read as a wireframe rather than a shop.

v8 fixes that with a real art system, and rebuilds the information architecture
around what a customer needs to decide.

## The art: no AI, no stock, no hand-drawn PNGs

Two generators live in `assets/art.js`:

**1. Isometric voxel renderer** (crates, protection blocks)

Products are composed from a voxel grid (`Vox`), then rendered with:

- back-face culling, so only visible surfaces are emitted;
- per-vertex ambient occlusion, solved by sampling the three neighbours around
  each corner of each face;
- a directional key light, a sky/fill term and a rim term, each evaluated
  against the face normal;
- warm/cool colour grading — highlights pushed toward `#ffe9bd`, shadows toward
  cool blue — so the objects sit in the same light as the page;
- a contact shadow and an additive bloom pass for emissive voxels.

Faces are drawn as flat quads with the AO baked into a gradient, not as
per-triangle fans, which is what killed the first two iterations (visible
seams on every face).

**2. Pixel-badge renderer** (ranks, keys, tickets, shards)

Small items read poorly as 3D volumes at 120–190px — a flask becomes an opaque
blob because interior glow is invisible behind the shell. So ranks and small
items use a screen-aligned pixel grid instead: crisp, deliberately chunky, and
consistent with the coin logo. The rank crest is generated procedurally (shield
silhouette by width profile, faceted diamond gem, crown prongs), not painted as
ASCII.

Both share one palette helper (`shade`, `mix`, `grain`), so all art sits in the
same colour space.

## Information architecture

The live store buries odds and prices behind clicks. v8 leads with them:

| Page | What it answers |
| --- | --- |
| `index.html` | What is this, what does it cost, what do people actually buy |
| `ranks.html` | Which tier, what does each include, full perk matrix |
| `crates.html` | What is in the box, what are the odds, how do keys work |
| `protection.html` | How big is the cube, what does each tier unlock, live listings |
| `boosters.html` | What is a booster worth, how does queueing work |

Deliberate choices:

- **Odds on the card, not in a modal.** Each crate shows its three headline
  drops inline and opens the full pool on demand.
- **Prices as real numbers.** `$34.99` split into dollars and cents so the
  cents can be de-emphasised — a small thing that makes a shop look less
  amateur than `$34.99` in one flat run.
- **"Everything below is included."** Stated on every rank surface, because
  it's the single most common source of hesitation on Minecraft stores.
- **Player-listings are described as player listings.** Sellers keep 70%; that
  is stated wherever a listing appears rather than hidden in a FAQ.
- **No fake urgency.** No countdowns, no "3 people viewing". The ticker shows
  real-looking purchase events and pauses on hover.

## Technical notes

- **No framework.** ~30KB of app JS, ~42KB of art JS, ~61KB of CSS.
- **Theme aware.** Dark is default; light is a full second palette, not an
  inverted one. The scene image, aura, grid and vignette all switch.
- **Cart persists** in `localStorage` across pages, with quantity steppers and
  a real basket drawer.
- **Reveal animations are opt-in.** Hidden state is applied by
  `html.js .rv`, so if JS fails the content is visible rather than invisible.
  There is also a 900ms safety net that reveals anything already in view.
- **Reduced motion respected** for the ticker, floats, rings and reveals.
- **Mobile.** Nav collapses to a drawer under 900px; the hero stage re-composes
  rather than shrinking.

## Running it

Open `index.html` directly — everything is relative and works from `file://`.

For the closest match to production, serve the folder:

```sh
npx serve v8
```

## File map

```
v8/
├── index.html            storefront
├── ranks.html            rank ladder + full comparison matrix
├── crates.html           six crates + reward pools + listings
├── protection.html       four land tiers + scale comparison
├── boosters.html         booster pack + value math
└── assets/
    ├── style.css         design system, components, themes, responsive
    ├── art.js            voxel renderer, badge renderer, product models
    ├── app.js            catalog data, cart state, shared chrome
    └── img/
        ├── logo-mark.png     cropped coin mark
        ├── spawn-night.png   hero scene (dark)
        └── spawn-day.png     hero scene (light)
```

## What I'd do next

1. **Wire checkout.** The basket is complete but `data-checkout` only toasts.
   It needs to hand off to the real Tebex/processor flow.
2. **Live data.** Prices and listing stock are hardcoded from the live store at
   time of writing. These should come from the same API the crate config uses.
3. **Real player avatars.** Listing rows use initials in a tile; Minecraft head
   renders (`minotar.net`) would add a human cue cheaply.
4. **Test on a real device.** Everything here was verified in headless Edge at
   1440px and 492px; a phone pass would catch anything the widths miss.

## Refinement pass (v8.1)

A second pass after review. The models, type and decals were rebuilt rather
than tweaked.

### The bug that made everything look bad

Every flat surface had a visible quilt of hairlines. I initially blamed the
per-face outline stroke, then the material noise. Neither was it.

The ambient-occlusion table was inverted. The sampling function returned `0`
for a *fully open* corner and the lookup table mapped `0` to the *darkest*
value. So every corner of every flat quad got a dark radial blob, and a grid of
those blobs read as quilting. Two signs were wrong:

```js
// before: open corners scored 0, table treated 0 as darkest
ao.push((s1 && s2) ? 0 : (s1 + s2 + cr));
var AOLUT = [0.62, 0.78, 0.92, 1.0];

// after: open corners score 0 and stay bright; enclosed corners score 3
ao.push((s1 && s2) ? 3 : (s1 + s2 + cr));
var AOLUT = [1.0, 0.90, 0.78, 0.64];
```

Once corrected, the surfaces came out clean and no stroke trickery was needed.

### Models rebuilt

- **Crate** — was a noisy box with decorative squares. Now built structurally:
  corner posts, horizontal plank courses, iron straps, a recessed lid with a
  cross-brace, a raised circular boss on the face, and a padlock with a shackle.
- **Protection block** — the face emblem was an outline-only shape that read as
  a horseshoe. Now a filled shield plate with a raised bezel, plus a per-tier
  centre mark (`dot`, `cross`, `star`, `crown`) so the four tiers are
  distinguishable at a glance rather than by colour alone.
- **Icons** — key, chest, crown, shard and ticket were redrawn. Several failed
  in instructive ways: alternating highlight voxels turned the shard into a
  barcode, and a symmetric dark cut-out in the ticket read as a robot face.
  Both were removed. The shard now gets its crystal read from a facet-shading
  pass in the renderer instead of from sprite noise.
- **Materials** — per-voxel random colour was replaced with per-plank variation,
  which is how a built object actually varies.

### Typography

Archivo was doing the job but reads as the default modern sans. Replaced with
**Bricolage Grotesque** for display and **Instrument Sans** for UI, with
JetBrains Mono retained for figures. I compared eight faces in both a type
specimen and a real product card before choosing.

### Still worth doing

- The crate boss and the protection shield are similar shapes; a crate-specific
  mark would separate them further.
- Checkout is still a toast; the basket needs wiring to the real processor.
## Depth pass (v8.2)

After review: the light theme read as machine-generated, and the ranks and
boosters were flat.

### The light theme was the "AI" tell

Warm cream ground + gold + a washed-out photograph is the exact palette that
generated landing pages converge on. Replaced with a cool neutral paper
(`#F1F3F6`) so gold reads as an accent rather than a wash, and cut the hero
photograph back to a 10% greyscale ghost. Tier tints on product plates are
neutralised in light mode — a tinted plate on a light ground turns pastel and
cheapens the art, while on dark it is the only colour cue and should be kept.

### Ranks and boosters: flat sprites → lit relief

The badge renderer drew flat coloured squares with a 1px outline. That is a
sticker, and next to genuinely 3D crates the mismatch was obvious.

It is now a **height-map renderer**:

- every sprite cell carries a height;
- a surface normal is derived from the surrounding heights;
- that normal is lit by the *same* key/sky/fill rig as the voxel models, so the
  two systems agree on where the light is;
- height drops draw a visible side wall, so the rim steps back like carved
  relief;
- ambient occlusion darkens cells that are enclosed by taller neighbours.

The crest gets an explicit height map: a raised gold rim at height 3 against a
flat field, with the gem's depth carried by its painted facets.

Two things I tried that did not work, both worth recording:

1. **Building the crest as voxels.** At 15×19 cells it read as chunky plastic
   next to the crate. The pixel-heightmap approach keeps the crisp pixel edges
   *and* gets the lighting right, which is what "pixel art with depth" actually
   means.
2. **Raising the gem in the height map.** Its facets were already painted into
   the colour grid; giving it height made two normal sources disagree and
   smeared the gem into a blob. The gem's read comes from its facets, not from
   displacement.

### Still worth doing

- The ticket sprite is the weakest of the icon set and needs another pass.
- Checkout is still a toast.
## Art and layout pass (v8.3)

Three specific problems from review, plus one the intern found.

### The booster was genuinely wrong

It was a single smooth lozenge with a waist and a bulge — the silhouette read
ambiguously, and that is a real failure, not a taste disagreement. It is now a
**cluster of three angular crystal prisms** at different heights and depths:
straight-sided, hexagonally cut, pointed at the top, banded at the base with a
gold collar. No smooth curves anywhere, so there is nothing left to misread.

### The shield gem was broken, in two separate ways

1. **The emissive list only contained the base gem colour.** The gem paints ~20
   facet tones, but the renderer decides emissive-vs-lit by *exact* colour
   match. Every facet tone fell through to the lit path, got multiplied by the
   lighting term, and flattened into one grey blob. Fixed by collecting the
   tones actually painted (`gemTones`) and registering those.
2. **The bloom was tuned for one tone.** Once 20 adjacent cells were emissive,
   the additive pass blew the whole gem to white. Dropped to 0.085 alpha.

The gem now shades **directionally** — lit from the upper left, shadowed to the
lower right — instead of by ring index, which is what made it look like a
symmetric cross.

### The shield silhouette

It was a rounded rectangle with a point, which read as an inverted triangle or
an ice-cream cone depending on size. Now a proper heater shield: straight
shoulders, near-vertical sides, then a curve that stays wide before turning in
sharply (`Math.pow(1 - Math.pow(t, 1.9), 0.58)`). The rim thickness also scales
down near the point so it never swallows it.

### Light mode was losing the spawn entirely

Two bugs. The light hero used the *night* image at 10% opacity with a heavys
greyscale filter — effectively invisible. It now swaps to the **day** spawn at
70%, with a directional gradient that releases toward the art instead of
covering the whole frame. Second, art on white lost its edges, so models now
carry a contact shadow and the plates have an inset shade.

### Layout

The hero was a full-bleed scene with copy in a narrow left column, which read as
a pasted-on strip on wide screens. The copy column is now sized to the text
(`minmax(0, 520px)`) rather than a fraction of the grid, and the scene holds its
position at `64% 46%` so the composition does not drift.
## Object pass (v8.4)

Replaced the shared shield silhouette, rebuilt the booster as a potion, gave
the crates real structure, and broke the hero's template rhythm.

### Ranks: five objects, not one shape in five colours

Shields were wrong. Every tier was the same silhouette recoloured, which is the
opposite of what a ladder should communicate. Each tier is now its own object,
escalating in grandeur:

| Tier | Object |
| --- | --- |
| I Squire | open helm |
| II Knight | longsword |
| III Lord | banner on a pole |
| IV King | heavy crown |
| V Emperor | sceptre and orb |

A medal was tried first and rejected — it still made all five look like the same
thing. The ladder now reads at a glance without reading a single label.

### Booster: a corked potion with stars and a plus

As requested: a potion bottle with stars suspended in it, and a gold plus badge
for "boost". The potion is a **pixel sprite**, not a voxel object — a 15-cube
voxel grid flattens an organic bottle into a lump, which is exactly what the
earlier attempts kept doing. The sprite gets the same height-map lighting as
everything else, so it still belongs to the set.

The plus badge is a separate 9×9 sprite composited beside the bottle, so it can
overlap the silhouette without fighting it.

### Crates: structure and a real base

Detail added: a plank body with visible courses and seam lines, recessed side
panels, iron straps at three heights, corner brackets, a raised circular boss
per face, a hinged padlock with a shackle, and a separate overhanging lid with
its own trim and inset board channels.

The base was the specific complaint. The old crate sat flush on the ground,
which read as a texture swatch. It now has a **plinth with four corner feet** —
only the corners reach the ground, so the crate casts a shadow under itself.

### Hero: breaking the template rhythm

The stack of kicker → headline → lede → buttons → four equal facts is the exact
rhythm generated landing pages use. The lede now sits in a split row against a
live server cue (`play.minex.gg` / Java & Bedrock), with a rule between them.
That breaks the predictable vertical beat and puts a real, specific detail in
the hero instead of another generic reassurance.

Price chips were also mislabelled — they said "Emperor Rank" and "Shard
boosters" while sitting next to a crate and a potion. Now correct.

### Dead code removed

`crest()` at 800+ lines was unreachable — the export pointed at `badge()`.
Removed rather than left to rot.
## Identity pass (v8.5)

### The font — finally addressed properly

I had been dodging this. The store was using Bricolage Grotesque, which is a
perfectly good typeface and also exactly the kind of trendy grotesque that makes
a page read as machine-generated. Two passes of tweaking its weight and tracking
were not going to fix that, because the problem was the category, not the
settings.

I put seven candidates side by side in a real header: Pixelify Sans, Silkscreen,
**Jersey 25**, Chakra Petch, Barlow Condensed, Oswald, Archivo Black.

**Jersey 25** won. It is a pixel display face, so the type now belongs to the
voxel art rather than sitting on top of it. Headings carry the same
blocky construction as the models, which is a coherence the grotesques could
never provide. Body copy stays Instrument Sans, so it remains readable at 12-13px.

This was the right call and I should have made it three passes ago instead of
defending a font that was working.

### Ranks I–III kept; IV and V rebuilt

Squire, Knight and Lord were already reading correctly. King's crown was
rebuilt with proper points, a jewelled band and a shaped brow. Emperor was
twice rebuilt: the sceptre read as a wand, so it is now a **peaked crown above
a banded orb** on a short staff — two unambiguous royal symbols stacked, which
cannot be mistaken for anything else.

### Crates now match their names

The complaint was exact: the textures did not suit the names. Every crate was
the same brown box with a different tint. Materials now escalate with the tier:

| Crate | Material |
| --- | --- |
| Spawner | mossy stone-green, iron brackets |
| Common | plain banded wood |
| Rare | blue-grey steel-bound |
| Epic | violet lacquer |
| Legendary | gilded brass with prongs |
| Mythic | near-black obsidian with a hot pink core |

Each tier also gets its own accent metal on the corner brackets and lid trim, so
the material shift is structural, not just a hue.

### Booster: purple stars, wider base, rendered large then scaled

- Stars are **violet** as requested, and are now a proper 5-point shape at 7px
  tall so the points are legible at card size.
- The bottle has a **wide pouring base** and a fast shoulder swell, so it reads
  as a potion flask rather than a lozenge.
- It is authored at **33×41** — roughly double the old grid — and scaled down by
  CSS. That was the right instinct: detail is authored at high resolution and
  reduced for display, not authored at display size.
- Glass now has a specular streak, a liquid surface line and inner shading.

### Price tags

The labels were anchored to fixed positions on the stage, which is why they
drifted onto the wrong objects. Each object now carries its own tag inside its
own element, so a label cannot be separated from the thing it describes.
## Resolution pass (v8.6)

The recurring failure across crates and ranks was the same mistake: authoring
art at display resolution. A 16-cell grid cannot express planks, banding AND a
lid, so the crate collapsed into an iron safe; the ranks collapsed into fuzzy
blobs. The potion — which happened to be authored larger — was the only one
that read well.

### Sprite helper

`Sprite` builds objects from geometry (rect, line, outline, per-pixel set) at
3-4x the old resolution, then `model()` hands the result to the height-map
renderer as before. Everything is authored large and scaled down by CSS.

### Crates: geometry, not decoration

Two separate geometry bugs, both of which made a crate look like a dumpster:

1. **The lid overhung the body and the body was narrower than the lid.** That is
   the silhouette of a wheelie bin. The body now spans the full width.
2. **The vertical faces had flat horizontal bottom edges.** In an isometric box
   both edges of a face are diagonals. Filling by row with a flat bottom made
   the box look like a house with a pitched roof.

The crate is now built from standard iso construction: a diamond top and two
parallelogram faces, filled by column from each face's top edge downward.
Planks, seams, iron banding, a hasp-and-padlock, corner angle-irons, rune plates
and tier prongs are painted onto those correct surfaces. 60x60, authored large.

### Ranks: five objects at 2x resolution

| Tier | Object | Built from |
| --- | --- | --- |
| I Squire | bascinet helm | dome profile + eye slits + neck guard |
| II Knight | longsword | blade, fuller, crossguard, grip, pommel |
| III Lord | banner | pole, finial, cloth, gold border, charge |
| IV King | jewelled crown | five points, band, three jewels |
| V Emperor | peaked crown over an orb | three broad points, band, staff, banded orb |

The helm previously flared at the base, which read as a mushroom cap; it now
tapers into a straight face guard. The Emperor's crown had five thin spikes that
read as a candelabra — reduced to three broad points with a solid shoulder
between them.

### A note on the debugging

Several of these iterations failed silently because a render threw and the page
just showed an empty box. Adding a `window.onerror` overlay to the test harness
turned "it doesn't work" into "MXArt is not defined" in one step. I should have
had that in place from the first failure.
## Icon weight pass (v8.7)

Squire was the only rank that worked, and the reason was not the subject matter
— it was that the helm is a **filled, rounded, multi-tone mass**. Every other
tier was a thin silhouette in a large frame: a 1px sword blade, a flat flag, a
wide low crown. That is why they read as clip art.

The rule now applied to all five: at 150px in a card, the icon must be a
near-square solid mass with real shading. Everything was rebuilt to that weight.

- **Knight** — blade widened from 1px to 13px with a bevel and fuller; crossguard
  and pommel enlarged. It now occupies the frame.
- **Lord** — the flat rectangle became cloth with vertical fold shading (light
  centre, dark edges) and a notched hem, so it reads as fabric with volume.
- **King** — points went from 5 thin spikes to 5 solid towers on a deep band.
- **Emperor** — three broad towers over an orb, crown sitting directly on the
  collar so the pair read as one object rather than two stacked.

Two bugs surfaced repeatedly while doing this and are worth recording:

1. **A crown taper keyed off distance from the *base*, not the tip.** Tall points
   therefore came out 1px wide, which is what turned the King into a wire frame.
2. **A "domed cap" behind the crown points merged with them.** The crown became a
   solid blob that read as a couch. The fill was removed; the valleys between
   points are now shaded solid instead.

### Crates: isometric abandoned

Three isometric attempts all read as furniture — a desk drawer, a wheelie bin, a
filing cabinet. At icon scale the lid and two side faces compete for the same
few rows, and there is no room to resolve which is which.

A **front-facing crate** is the shape everyone already knows, and it gives the
lid, planks, ironwork, hasp and lock their own space. It is also a stronger mass
in the card, which is what the ranks taught.

## The flag problem, and crate keys (v8.9)

Two pieces of feedback drove this pass: *"what is it with the lord? is it a flag
or a axe?"* and *"why are they so square?"*, followed by *"instead just make
crate keys"*.

### Lord: nine drawings, one silhouette

Lord went through a banner, an axe, a hammer, an axe with better proportions,
two double-bit axes and a halberd. Every one read as a flag, and the cause was
structural:

> A wide mass near the top of a vertical shaft, with nothing above it, is the
> silhouette of a flag - regardless of what is painted on it.

Symmetry did not fix it. The double-bit heads removed the "hanging from a pole"
reading but the first was built from a sine curve, which is a disc (a paddle);
constant-width bits were a bar (a dumbbell). A halberd's shaft continuing above
the head helped and still read as a pennant.

Lord is now a **jewelled chalice**: no shaft, so nothing can hang from it; a
filled symmetric mass, the formula that made the Squire helm work; and violet
enamel with gold fittings rather than solid gold, so it does not repeat "same
thing in different colours" beside the crown and throne.

The lesson: **when an object fails three times the silhouette is wrong, not the
draughtsmanship.** Redrawing a fourth time is not a plan.

### Crates: a box is square, so stop drawing a box

The crate went flat (no depth), then gained depth (three faces, overhanging
lid), then wide boards and X bracing, then six distinct builds. It still looked
wrong, and the reason was simpler than any of that:

> A crate is a box. A box is square by definition.

No amount of board seams or iron banding changes the fact that six crate icons
are six squares. The product is not the box anyway - it is the **key** that
opens it, which is also what actually arrives in your inventory. All six are now
drawn as skeleton keys.

Getting the key right took seven attempts, and the failures are instructive:

1. A thin key (24 x 70) in a square card - every detail shrank until the teeth
   read as insect legs. Same thin-silhouette failure as the rank icons.
2. Teeth cut out of the BOTTOM of a slab read as legs; teeth cut from the TOP
   read as a comb. **What remains after a cut has no outline of its own.**
   The bit is therefore built additively.
3. A crown-shaped bow stopped being a key at all. The bow has to stay
   recognisably a ring or a solid loop.
4. A large plate beside the shaft read as a bag hanging off a lollipop. The bit
   is a small tab at the *foot* of the shaft, flush with its bottom end.

The final geometry is fixed pixel coordinates rather than computed offsets,
because computed ratios drifted into a different unrecognisable shape on every
attempt. The bittings are part of the drawn silhouette - the bit's outer edge
steps in and out per band - so they cannot turn into a comb or a pair of legs.

### Also fixed

- The rank ladder declared `repeat(6, 1fr)` for five ranks, left over from a
  sixth "upgrade" column. Every card was ~17% narrower than it should have been,
  with dead space down the right edge.
- **Encoding damage.** Rewriting `app.js` through PowerShell's `Set-Content`
  round-tripped UTF-8 through the wrong code page and destroyed every multi-byte
  glyph: em dashes, the multiplication sign, and the arrow in "Everything
  Squire -> King" all became C0 control characters. All 29 were located and
  repaired by context. Use Node for file writes on this project; PowerShell
  text cmdlets are not safe for this content.

## Scale and tier identity pass (v8.10)

Three notes: *"reduce the size of the rank on the front page by a bit"*, *"these
keys look too big"*, and *"make them more suited to their names"*.

### Sizes

The hero rank was 268 x 330 and the crate key 200 x 200. At the canvas scale
used there, a $1.99 key was visually heavier than the $37.50 rank beside it,
which is the wrong hierarchy for a shop. Rebalanced to:

| | before | after |
| --- | --- | --- |
| rank (main) | 268 x 330 | 214 x 262 |
| key (back left) | 200 x 200 | 148 x 156 |
| booster (back right) | 150 x 190 | 118 x 148 |

Product-card art went from 188 x 188 to 150 x 160. Keys are tall and narrow, so
they filled the plate top to bottom at the old size and read as oversized; the
smaller frame gives each key air and keeps the price the loudest element.

### Keys suited to their names

Each key's metal and gem now come from its crate's identity and headline
reward, and the spec object carries only what the renderer reads:

| Crate | Metal | Gem | Why |
| --- | --- | --- | --- |
| Spawner | bone-white iron | hive green | sealed core, organic |
| Common | weathered iron | lime | deliberately plainest |
| Rare | cold blue steel | cyan | beyond-vanilla enchants |
| Epic | violet | lilac | particle traits |
| Legendary | gold | warm gold | ornate end of the ladder |
| Mythic | obsidian magenta | hot pink | Dragon Knight, endgame |

**The spawner and the common key were the same object in two greys** - the
"same thing in different colours" failure for the third time in this project.
The spawner now has a **hexagonal cage bow** with rivets at the six vertices,
which reads as an enclosure (it holds a spawner) and is unmistakable against the
plain ring on the common key, even at card size.

The old `art` objects on each crate carried a full wood/iron palette for the
crate sprite that no longer exists. They were dead weight, and their identical
structure was part of why every key looked interchangeable.

## Key structure pass (v8.11)

Feedback: *"the keys dont have much of a change other then size"*. That was
correct, and the cause was measurable.

A key is roughly **70% shaft-and-bit and 30% bow**. The previous version varied
only the bow - and two tiers (iron and obsidian) shared one - so 70% of every
icon was identical and a third of the remaining differences were duplicates.
Recolouring the rest does not register at card size.

Every structural number is per tier now:

| tier | bow | shaft | bit |
| --- | --- | --- | --- |
| Spawner | hexagonal cage | stocky, 6px | wide, 2 deep teeth |
| Common | small plain ring | thin, 4px, long | small, 2 fine teeth |
| Rare | clover | slim, 5px, longest | long reach, 4 fine teeth |
| Epic | diamond | medium, 7px | split into two lobes |
| Legendary | lantern | thick, 9px | broad, 3 teeth |
| Mythic | winged | very thick, 10px | long reach, hooked foot |

Bow radius, shaft width, shaft length, bit reach, bit depth and tooth count are
all data in KEY_BUILD, so the silhouettes differ before any colour is applied.
That is the point: **colour is the last differentiator, not the first.**

One bug worth recording: the new build table replaced the old bitt inset array
with a tooth *count*, but the drawing code still read B.bitt and threw on every
render - the six cards came out blank. The step pattern is now derived from the
count, so the teeth remain part of the silhouette rather than blocks added on.
