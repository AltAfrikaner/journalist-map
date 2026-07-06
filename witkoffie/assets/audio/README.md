# Audio previews

Drop your short MP3 snippets (10–30 seconds, **not** full songs) into this folder
with exactly these file names:

| File | Used by |
|---|---|
| `bass-preview.mp3` | "Bass" capsule on the home page |
| `rhythm-preview.mp3` | "Rhythm" capsule + "Stoomtrein" release preview |
| `afrikaans-texture-preview.mp3` | "Afrikaans Texture" capsule |
| `hook-preview.mp3` | "Hook" capsule + "Nagskof" release preview |
| `full-preview.mp3` | "Full Preview" capsule, Featured Moment player + featured release |

Until the files exist, every player simply shows **“Preview coming soon”** —
nothing breaks.

To point a release at a different file, edit `previewAudio` in `js/releases.js`.
