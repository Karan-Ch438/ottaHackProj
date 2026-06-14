# Wait Your Turn

A uOttaHack project that turns Google Meet captions into lightweight communication feedback.

Wait Your Turn is a Chrome extension that watches live Google Meet captions, estimates when the user interrupts another speaker, tracks filler-word usage, and generates a simple meeting report after the call.

## Features

- **Google Meet caption listener:** uses the Google Meet captions DOM to build a local transcript during a call.
- **Interruption detection:** flags a possible interruption when the user starts speaking after another speaker's unfinished sentence.
- **Filler-word analysis:** counts common filler words like “um,” “uh,” “like,” and “so.”
- **Speaking-frequency stats:** tracks how many times the user contributed.
- **Post-meeting report:** opens a local HTML report with interruption count, filler-word percentage, and speaking stats.
- **Local-first prototype:** stores transcript data in Chrome local storage and does not require a backend.

## Demo flow

1. Load the extension in Chrome.
2. Join a Google Meet.
3. Turn captions on.
4. Participate in the meeting normally.
5. End the call.
6. Review the generated communication stats page.

## Setup

1. Clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `extension/` folder.
6. Visit a Google Meet and keep captions enabled.

## Repository structure

```text
.
├── extension/
│   ├── manifest.json      # Chrome extension manifest
│   ├── content.js         # Meet caption observer and interruption detection
│   ├── background.js      # report generation and Chrome storage handling
│   ├── popup.html         # extension popup instructions
│   └── icon.png           # extension icon
└── images/                # project/demo assets
```

## How it works

- `content.js` runs on `https://meet.google.com/*` pages.
- It waits for Google Meet's captions area and observes DOM mutations.
- Caption changes are grouped into speaker/transcript entries.
- If another speaker's text does not appear sentence-complete before “You” starts speaking, the extension increments the interruption count.
- On call end or page unload, the transcript and stats are saved to Chrome local storage.
- `background.js` reads the saved data and opens a local report page.

## Limitations

This was built for a hackathon, so the detection is heuristic and depends on Google Meet's current DOM structure. It may break if Meet changes class names or caption markup. It also estimates interruptions from punctuation and speaker changes, so it should be treated as communication feedback rather than a definitive measurement.

## Credits

Started from a Chrome extension transcript template inspired by TranscripTonic / create-chrome-ext patterns, then adapted into a meeting communication coach for uOttaHack.

## My role

Implemented the Google Meet caption parsing flow, interruption heuristic, filler-word analysis, report generation, and extension polish as part of the hackathon team.

## Future improvements

- Add automated tests around transcript parsing and interruption detection.
- Make Google Meet selectors more resilient.
- Add a persistent dashboard for meeting history.
- Let users configure filler words and interruption sensitivity.
- Add screenshots or a short demo GIF to the README.
