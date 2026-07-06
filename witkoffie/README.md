# WitKoffie — The Sound Portal

A premium 3-page interactive artist website for **WitKoffie**:
*Afrikaans electronic sound. Rebuilt for the future.*

Pure HTML + CSS + JavaScript with a Three.js 3D "Sound Portal" hero
(loaded from a CDN). No Node.js, no build step, no backend, no database —
it runs by opening `index.html` in a browser and publishes directly on
**GitHub Pages**.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home — 3D Sound Portal hero, sound capsules, music identity, featured moment, artist statement |
| `music.html` | Releases — featured release + full grid with previews and platform links |
| `contact.html` | Bookings & contact — validated form that opens a pre-filled email (mailto) |

## File structure

```
/index.html
/music.html
/contact.html
/css/style.css        ← design system (colours, typography, components)
/js/main.js           ← navigation, animations, capsules, form
/js/audio.js          ← preview audio manager (one sound at a time)
/js/portal.js         ← Three.js 3D portal (+ CSS fallback)
/js/releases.js       ← ★ EDIT YOUR SONGS HERE
/assets/images/       ← brand mark, covers, textures
/assets/audio/        ← ★ DROP YOUR MP3 PREVIEWS HERE
/assets/icons/        ← platform + social icons (Simple Icons, CC0)
/assets/credits.md    ← asset sources and licences
```

---

## 1. How to upload to GitHub

1. Create a new GitHub repository (for example `witkoffie-site`).
2. Upload **all** files and folders from this project to the repository —
   keep the structure exactly as it is, with `index.html` at the root.
   (On github.com: **Add file → Upload files**, drag everything in, then
   **Commit changes**.)

## 2. How to enable GitHub Pages

1. In the repository, go to **Settings**.
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the **main** branch.
5. Select the **/ (root)** folder.
6. Click **Save**.
7. Wait a minute or two — GitHub shows the published URL at the top of the
   Pages screen (usually `https://<username>.github.io/<repository>/`).

All internal links use relative paths (`./music.html`,
`./assets/audio/…`), so the site works at any URL and also when you
double-click `index.html` locally.

---

## 3. Where to replace images

Put your files in `assets/images/` using the same names (or update the
paths in the HTML):

- `witkoffie-mark.png` — circular logo used in the header, footer and the
  3D fallback.
- `release-placeholder.jpg` — default cover art for releases.
- `og-image.jpg` — the image shown when the site is shared on social media.
- `coffee-texture.jpg` — subtle grain overlay on the home hero.
- `favicon.png` — browser tab icon.

## 4. Where to replace audio previews

Drop short MP3 snippets (10–30 s, **never full songs**) into
`assets/audio/` with these names:

```
bass-preview.mp3
rhythm-preview.mp3
afrikaans-texture-preview.mp3
hook-preview.mp3
full-preview.mp3
```

Until a file exists, its player shows **“Preview coming soon”** — nothing
breaks. See `assets/audio/README.md` for which player uses which file.

## 5. Where to edit song links (releases)

Open **`js/releases.js`**. Every release is one object:

```js
{
  title: "Track Title",
  releaseDate: "Coming soon",
  coverImage: "./assets/images/release-placeholder.jpg",
  description: "A short premium description of the track.",
  previewAudio: "./assets/audio/full-preview.mp3",
  spotifyUrl: "#",      // "#"  → disabled "coming soon" button
  appleMusicUrl: "#",   // ""   → button hidden completely
  youtubeMusicUrl: "#", // real URL → working button
  youtubeUrl: "#",
  distrokidUrl: "",
  featured: true        // put this on ONE release to feature it
}
```

Add, remove or reorder objects — the music page rebuilds itself.
The footer platform icons are plain links in the HTML of each page;
swap their `href="#"` for your real profile URLs when they exist.

## 6. Where to edit contact details

The email address and social links appear in:

- `contact.html` — the contact cards, the "Email WitKoffie" button and the
  `mailto:` target inside `js/main.js` (search for `witkoffie@outlook.com`).
- The header and footer of all three pages (Instagram / Facebook links).

Current details: **witkoffie@outlook.com** ·
[instagram.com/witkoffie](https://www.instagram.com/witkoffie/) ·
[facebook.com/WitKoffie](https://www.facebook.com/WitKoffie)

---

## Behaviour notes

- **No autoplay.** Sound previews unlock only after the visitor clicks
  **Enter With Sound**; only one preview plays at a time.
- **3D portal.** Rendered with Three.js from a CDN. If WebGL or the CDN is
  unavailable, a CSS/image portal appears instead. Animation pauses when
  the tab is hidden and calms down for visitors with
  `prefers-reduced-motion` enabled.
- **Contact form.** Static-site friendly: it validates the fields, then
  opens the visitor's own mail app with a pre-filled message to
  `witkoffie@outlook.com`. Nothing is stored or sent by the site itself.

## Licences

See [`assets/credits.md`](./assets/credits.md) for image, icon, font and
library sources.
