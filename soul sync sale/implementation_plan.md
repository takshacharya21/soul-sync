# Intro Animation and Splash Screen for Soul Syync

This implementation plan details the addition of a premium, animated splash screen (intro animation) to the starting of the Soul Syync website. The intro will feature a glowing logo, animated text reading "Welcome to Soul Syync", a cosmic starfield background, scroll prevention during playback, and a smooth fade-out transition after 7 seconds to reveal the home page.

## User Review Required

> [!IMPORTANT]
> The intro animation will lock the page scroll and display a full-screen animation for exactly **7 seconds** upon the user's first landing. After 7 seconds, it will smoothly fade out and unlock scrolling. 

> [!NOTE]
> The code files will be modified in **`D:\ALL WEBSITE\soul sync web application`** which contains the full Git repository deployed to Render, rather than the empty virtual workspace directory.

## Open Questions

None. The user's requirements are clear:
- Displays "Welcome to Soul Syync"
- Text and logo are animated, with a glowing/animating logo
- No scrolling allowed during the animation
- Animation time between 5 to 10 seconds (selected: 7 seconds for a premium feel)
- Loads home page automatically after the animation finishes
- Server is live on Render, so code must be push-ready

---

## Proposed Changes

### Frontend Assets & Templates

#### [MODIFY] [index.html](file:///D:/ALL%20WEBSITE/soul%20sync%20web%20application/index.html)
- Insert the `#introOverlay` HTML structure right inside the `<body>` tag, before any other elements.
- Ensure the overlay includes container elements for the intro cosmic starfield, the logo (`/logo.png.PNG`), and the animated text.

#### [MODIFY] [style.css](file:///D:/ALL%20WEBSITE/soul%20sync%20web%20application/style.css)
- Append the CSS styles for `.intro-overlay`, `.intro-active` (to prevent scrolling), and all animations (`introLogoIn`, `introLogoPulse`, `introGlowIn`, `introGlowPulse`, `introTextReveal`, `introBlobPulse`).
- Style the layout, typography (using the theme's serif display and cinzel fonts), and gold/glow elements using the site's existing CSS variables (`--bg`, `--gold`, `--font-display`, etc.).

#### [MODIFY] [script.js](file:///D:/ALL%20WEBSITE/soul%20sync%20web%20application/script.js)
- Add the `handleIntroSplash()` self-invoking function that:
  - Locks page scroll on load by adding `intro-active` to `html` and `body`.
  - Builds a custom twinkling starfield specifically for the intro background.
  - Sets a 7-second timer to start the fade-out transition.
  - Unlocks scroll behavior and removes the overlay from the DOM after the fade transition completes.

---

## Verification Plan

### Manual Verification
1. Open the application locally (or serve via python).
2. Verify that the intro animation starts immediately upon load.
3. Confirm that scrolling is completely disabled while the intro plays.
4. Verify that "Welcome to Soul Syync" is shown with elegant keyframe animations, and the logo fades in and has a pulsing golden glow around it.
5. Verify that after exactly 7 seconds, the overlay fades out smoothly and the home page becomes fully interactive with scroll enabled.
