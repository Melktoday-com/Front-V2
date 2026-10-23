# PWA Map Remote Debugging & Diagnostic Guide

This guide provides step-by-step instructions for inspecting the Melktoday map and PWA Service Worker on real mobile devices (Android and iOS) and collecting diagnostics.

---

## 1. Quick On-Screen Diagnostic HUD

You can activate the non-intrusive diagnostic overlay on any device without connecting cables or opening DevTools:

1. Add `?mapdebug=1` to the URL:
   - Example: `https://melktoday.com/ads?mapdebug=1`
   - Or open DevTools console and execute: `localStorage.setItem('mapdebug', '1')`
2. An overlay appears at the top-left of the screen showing:
   - **Mode**: `standalone` (installed PWA) or `browser` (regular tab)
   - **Online**: `YES` or `NO`
   - **SW Controller**: `ACTIVE` (controlled by `public/sw.js`) or `NONE`
   - **Container**: Actual DOM width × height (`clientWidth` × `clientHeight`)
   - **Leaflet Size**: Map's internal calculated dimensions (`map.getSize()`)
   - **Tiles**: Successful tile loads vs. tile errors
3. Tap **"Copy Logs JSON"** to copy the full diagnostic event stream to your clipboard, and share the output.

---

## 2. Remote Debugging on Android via Chrome DevTools

To inspect the real installed PWA running on an Android phone:

1. **Enable Developer Options & USB Debugging on your Android Phone**:
   - Go to **Settings > About Phone**.
   - Tap **Build Number** 7 times until you see "You are now a developer".
   - Go to **Settings > Developer Options** and enable **USB Debugging**.
2. **Connect Phone to PC**:
   - Connect the phone via USB cable.
   - On the phone, accept the prompt: *"Allow USB debugging from this computer?"*.
3. **Open Chrome Inspect on your PC**:
   - In desktop Chrome, navigate to: `chrome://inspect/#devices`.
   - Ensure "Discover USB devices" is checked.
   - You will see your phone model and a list of running WebViews / PWA instances.
4. **Inspect the PWA**:
   - Open the installed Melktoday PWA on your phone.
   - In `chrome://inspect`, find "MelkToday" and click **Inspect**.
   - A full Chrome DevTools window opens mirroring your phone screen:
     - Check **Console** for `[MapDebug]` logs or runtime errors.
     - Check **Application > Service Workers** to inspect registration, active worker, and scope.
     - Check **Application > Storage > Cache Storage** to view cached tiles in `melktoday-map-tiles-v2`.
     - Check **Network** tab to see whether tile requests are served `(ServiceWorker)` or from disk/network.

---

## 3. Remote Debugging on iOS via Safari Web Inspector

To inspect the installed PWA (Home Screen Web App) on an iPhone or iPad:

1. **Enable Web Inspector on your iPhone**:
   - Go to **Settings > Safari > Advanced**.
   - Turn ON **Web Inspector**.
2. **Connect iPhone to Mac**:
   - Connect the iPhone to your Mac via Lightning / USB-C cable.
   - Unlock the iPhone and tap "Trust this computer" if prompted.
3. **Enable Developer Menu in Mac Safari**:
   - Open Safari on Mac.
   - Go to **Safari > Settings > Advanced**.
   - Check the box: *"Show features for web developers"* (or *"Show Develop menu in menu bar"*).
4. **Inspect the PWA**:
   - Open the installed Melktoday PWA from your iPhone Home Screen.
   - In Mac Safari's menu bar, click **Develop > [Your iPhone Name]**.
   - Select the web page corresponding to the Melktoday PWA.
   - Inspect:
     - **Console**: Look for errors or `[MapDebug]` entries.
     - **Storage > Cache Storage**: Inspect `melktoday-map-tiles-v2`.
     - **Elements**: Inspect `.leaflet-container` computed height and bounding rect.

---

## 4. Diagnostic Checklist for PWA Issue Reporting

When reporting map issues on mobile/PWA, please provide:
1. Exact Device & OS version (e.g. Samsung Galaxy S23 Android 14 / iPhone 15 iOS 17.5).
2. Browser engine (Chrome, Samsung Internet, Safari PWA).
3. Value of "Container" and "Leaflet Size" from the `?mapdebug=1` HUD.
4. Value of "SW Controller" (ACTIVE or NONE).
5. Output of copied Logs JSON.
