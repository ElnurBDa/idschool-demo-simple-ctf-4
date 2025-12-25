Retro Arcade Blog — Static Demo

This is a single-page, frontend-only static site demo that implements a small blog about retro games (20-30 years ago). It includes a fake `/api/login` and `/api/logout` implemented in client-side JavaScript so login forms work while serving statically.

How it works
- Entry point: `index.html`
- Styles: `css/styles.css` (contains a CSS custom property with a hex-encoded key fragment used to decrypt obfuscated passwords)
- Script: `js/app.js` (renders posts, intercepts `/api/login` and `/api/logout`, handles session in `localStorage`)

Users
- admin — password is `chillguy` (obfuscated in code)
- chillguy — password is `password123` (obfuscated in code)

Notes
- This is a deliberately self-contained, static demo. All passwords and logic exist on the frontend and are obfuscated for the purposes of the demo. This is NOT secure for real applications.
- If you want to run locally, use a static file server such as `python3 -m http.server 8000` from the project folder and open `http://localhost:8000`.

Files added
- `index.html` — main UI
- `css/styles.css` — retro arcade theme plus obfuscation key hex
- `js/app.js` — app logic and auth emulation

Hints
- After logging in as `chillguy`, the Admin Dashboard shows a hint: "the admin password is already on this site." The decryption key is stored (hex-encoded) in the CSS file as a custom property — the JS reads it at runtime and uses it to deobfuscate stored credentials.
