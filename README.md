# au

A specialized, in-browser utility for decoding raw `GSM 06.10` payloads. Designed for reverse engineers, this tool utilizes the actual `ffmpeg.wasm` engine to ensure accurate, non-destructive decoding of binary dumps.

---

## <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <!-- Clipboard Body -->
  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  <!-- Clipboard Clip -->
  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
</svg>
 Table of Contents
1. [Overview](#-overview)
2. [Features](#-features)
3. [Prerequisites](#-prerequisites)
4. [How to Use](#-how-to-use)
5. [Technical Notes](#-technical-notes)
6. [Troubleshooting](#-troubleshooting)

---

## 🚀 Overview
The **AU Extractor** is a web-based forensic tool built to handle proprietary partition dumps and raw audio streams. Unlike heuristic or "hand-written" codecs, it bridges the gap between binary data and playable audio by leveraging WebAssembly-based FFmpeg.

**Strict Header Validation:** This tool requires files to contain a valid `AU` (`0x41 0x55`) header to initiate processing, protecting the user from attempting to parse incompatible formats like `.snd` or raw data footers.

---

## ✨ Features
*   **True Codec Implementation:** Uses genuine `GSM 06.10` decoding via `ffmpeg.wasm`.
*   **Header Alignment Scanner:** Automated brute-force scanning of file offsets to identify the correct starting byte for stateful audio streams.
*   **Spectral Analysis:** Real-time generation of waveform visualizations and frequency analysis to verify audio integrity post-decode.
*   **Client-Side Processing:** All operations run locally in your browser. No files are uploaded to a server, ensuring complete privacy for your firmware dumps.

---

## 🛠 Prerequisites
To use this tool, ensure your environment supports **SharedArrayBuffer**. 
*   **Cross-Origin Isolation:** The browser must be in a cross-origin isolated state.
*   **Required Script:** The `coi-serviceworker.js` file must be present in the same directory as this HTML file to enable the necessary HTTP headers (`COOP`/`COEP`) on static hosts like GitHub Pages.

---

## 📖 How to Use
1.  **Load:** Drop your binary file directly into the designated drop zone. The tool will verify the `AU` header immediately.
2.  **Configure:** Adjust the **Header Size** (if known), **Sample Rate** (defaults to 8000Hz), and **Analysis Window**.
3.  **Decode:** Click the **Decode** button to process the payload.
4.  **Align:** If the output sounds like white noise or is corrupted, click **Scan header alignment**. The tool will test multiple offsets and highlight the one yielding the highest signal score.
5.  **Export:** Download the resulting audio as a standard `.wav` file.

---

## ⚙ Technical Notes
*   **GSM Frames:** GSM 06.10 frames are exactly 33 bytes.
*   **Statefulness:** GSM is stateful; this means each frame is dependent on the filter state of the previous frame. If your binary dump starts in the middle of a stream, the audio will be severely corrupted until the codec synchronizes.
*   **Spectral Scoring:** The scanner uses a combination of speech-band frequency analysis (250Hz–3400Hz) and RMS-based activity detection to calculate a "validity score" for each tested offset.

---

## ⚠️ Troubleshooting
*   **No "AU" header detected:** Ensure your file is a valid raw `AU` format dump. The tool explicitly rejects files lacking this specific magic byte signature.
*   **Audio Truncation:** If the output duration is shorter than expected, it likely indicates that frames were dropped or the offset provided is inaccurate.
*   **Missing ffmpeg:** If the library fails to load, check your browser console. Ad-blockers or restrictive network policies may be blocking access to `unpkg.com` or `jsdelivr.net`.
