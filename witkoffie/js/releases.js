/* ==========================================================================
   WitKoffie — Releases data
   EDIT THIS FILE to add or update songs. No other code changes needed.

   For each release:
   - title         : song title
   - releaseDate   : e.g. "12 September 2026" or "Coming soon"
   - coverImage    : path to cover art (square works best)
   - description   : one or two short premium sentences
   - previewAudio  : short MP3 snippet (NOT the full song)
   - platform URLs : ""  -> button is hidden
                     "#" -> disabled "Coming soon" button
                     real link -> working button
   - featured      : true on ONE release to pin it as the featured latest release
   ========================================================================== */

window.WK_RELEASES = [
  {
    title: 'Warm Asem',
    releaseDate: '2026',
    coverImage: './assets/images/release-placeholder.jpg',
    description: 'The first official WitKoffie release — warm breath, Afrikaans texture, deep bass and a groove built for modern speakers.',
    previewAudio: './assets/audio/full-preview.mp3',
    spotifyUrl: 'https://open.spotify.com/album/0Dbfg4zUArZwjRBXHvDnNX',
    appleMusicUrl: '#',
    youtubeMusicUrl: '#',
    youtubeUrl: '#',
    distrokidUrl: '',
    featured: true
  },
  {
    title: 'Nagskof',
    releaseDate: 'Coming soon',
    coverImage: './assets/images/release-placeholder.jpg',
    description: 'Late-night movement. Deep low-end pressure under an Afrikaans electronic hook.',
    previewAudio: './assets/audio/hook-preview.mp3',
    spotifyUrl: '#',
    appleMusicUrl: '#',
    youtubeMusicUrl: '#',
    youtubeUrl: '#',
    distrokidUrl: ''
  },
  {
    title: 'Stoomtrein',
    releaseDate: 'Coming soon',
    coverImage: './assets/images/release-placeholder.jpg',
    description: 'Rolling rhythm and heritage echoes, rebuilt as a forward-moving club groove.',
    previewAudio: './assets/audio/rhythm-preview.mp3',
    spotifyUrl: '#',
    appleMusicUrl: '#',
    youtubeMusicUrl: '#',
    youtubeUrl: '#',
    distrokidUrl: ''
  }
];
