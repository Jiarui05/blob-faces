# Contributing

Thanks for wanting to make more blobs! The most common contribution is a new part, so that's covered first.

## Setup

```bash
npm install
npm run dev        # playground at http://localhost:5199
npm test           # run before opening a PR
npm run typecheck
```

## Adding a part

Built-in parts live in `src/core/parts/`, one file per kind. Each file registers itself with `defineParts(kind, { … })`.

### Coordinates

The face is drawn in a 120 × 120 box with the **face center at (0, 0)**. The blob's radius is about 46.

| Kind | Origin of `draw()` | Notes |
|---|---|---|
| `eyes` | center of one eye — placed at `(±16, -4)` | `side` is `-1` (left) or `1` (right). Set `blink: true` if it should blink. |
| `brows` | center of one brow — placed at `(±16, -17)` | Use `side` so the inner end points toward the nose. |
| `mouth` | center of the mouth — placed at `(0, 17)` | |
| `extras` | **face center** | Pick a `layer`: `under`, `over` or `out`. Use the `at(x, y, svg, className)` helper to position pieces. |

### Style rules

- Use the `S()` stroke helper so lines match: `S()` is a 4.5 px round stroke in the ink color; `S(3, '#fff')` changes width and color; `S(3, ink, ink)` also fills.
- Use `ink` for outlines instead of hard-coding the navy color, so custom ink colors keep working.
- Keep it flat: solid fills, round caps, no gradients or filters.
- For a part-level animation, add a `bf-` class and its keyframes to `src/core/faces.css`. The animated element must not carry its own `transform` attribute — wrap it with `at()`.

### Checklist

1. Add the part to the right file in `src/core/parts/`.
2. Add its key to the matching `Builtin*` union in `src/core/types.ts`.
3. Optionally list it in a mood in `src/core/moods.ts`.
4. Add a label for each language in `src/playground/i18n.ts` (`part.<kind>.<key>`).
5. `npm test` — every built-in part is rendered automatically and checked for broken output.

## Adding a language to the playground

Add an entry to `LANGS` and a dictionary with the same shape to `DICT` in `src/playground/i18n.ts`. Missing keys fall back to English.

## Architecture

- `src/core` must stay DOM-free and dependency-free: it only builds strings.
- `src/playground` modules never import each other's implementations. They talk through the typed event bus in `bus.ts`; `main.ts` is the only place that wires them together.
- `src/audio` and `src/react` are optional adapters on top of the core.
