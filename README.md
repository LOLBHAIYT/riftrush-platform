# RiftRush Tournament Platform

This project now uses a separate backend data layer instead of browser local storage.

## Included

- Responsive Free Fire tournament website
- User signup/login with backend API
- Squad registration flow
- QR-based deposit flow with `Rs 10` to `Rs 1000` validation
- Random referral code for every new user
- `Rs 5` referral reward for both users after deposit plus one tournament join
- Private admin login and separate admin data view
- Website-based app install flow with `Install App` button
- Installable web app support with `manifest.webmanifest` and `service-worker.js`
- Separate persistent data files in `data/`

## Project Files

- `index.html`
- `styles.css`
- `script.js`
- `server.js`
- `package.json`
- `capacitor.config.json`
- `payment-qr.jpg`
- `manifest.webmanifest`
- `service-worker.js`
- `data/users.json`
- `data/deposits.json`
- `data/registrations.json`

## Run Locally

1. Run `npm start`
2. Open `http://localhost:3000`

## Public App Download Flow

After deploying this project on a public HTTPS website:

1. User opens your website
2. User goes to `Install App`
3. User taps `Install App`
4. Browser installs RiftRush like an app
5. User opens the installed app and joins tournaments

This is a PWA install flow, not a Play Store APK.
If the direct prompt does not appear, use the browser menu and choose `Install app` or `Add to Home Screen`.

## Android APK Ready Setup

This project is now prepared for Android app wrapping with Capacitor.

### App Identity

- App name: `RiftRush`
- App ID: `com.riftrush.play`
- Live website used by app wrapper: `https://arenax-platform.onrender.com`

### Build Flow

1. Install Node.js and Android Studio
2. Run `npm install`
3. Run `npx cap add android`
4. Run `npm run app:sync`
5. Run `npm run app:open`
6. Build APK from Android Studio

### Important

- The APK will load the live RiftRush website inside the app wrapper
- If your final website link changes, update `capacitor.config.json`
- This setup prepares the project for APK generation, but does not generate the APK by itself inside this workspace

## Separate Data Storage

All user, deposit, referral, and registration records are stored separately here:

- `data/users.json`
- `data/deposits.json`
- `data/registrations.json`

## Hardcoded Admin Access

- Admin email: `admin@riftrushplay.com`
- Admin password/key: `RiftRushHost@2026`

These are hardcoded in [server.js](/C:/Users/DELL/Documents/New%20project/server.js).

## How To Host A Tournament

1. Run the project with `npm start`
2. Open the site at `http://localhost:3000`
3. Click `Admin Login`
4. Login with the hardcoded admin ID and password above
5. Open the private admin panel
6. Use `Host Tournament` form
7. Fill title, mode, description, date, entry fee, prize pool
8. Select `Public` if you want it visible to everyone immediately
9. Click `Create Tournament`

Published tournaments show in the public tournament section automatically.

## Important

- This is now backend-driven, but still a starter project.
- For public launch, deploy this on a Node-compatible host such as Render, Railway, or VPS.
- For stronger security and scale, next step should be database + real auth + payment verification.
