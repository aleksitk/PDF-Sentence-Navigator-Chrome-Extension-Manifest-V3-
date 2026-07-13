# PDF Sentence Navigator

A Chrome Extension (Manifest V3) that lets you navigate PDF documents sentence-by-sentence using the keyboard — `Tab` for the next sentence, `Shift+Tab` for the previous one — with the active sentence highlighted directly on the page.

Everything runs **entirely locally** in the browser. No text is ever sent to any external server.

## Why this exists

Reading long PDFs (papers, reports, contracts) top-to-bottom with a mouse and scroll wheel is slow when you actually want to move through the text one thought at a time. This extension turns `Tab` into a "next sentence" key, similar to how a screen reader or a teleprompter would step through text — but purely visual, with a highlight following along.

## How it works (architecture)

Chrome's built-in PDF viewer renders PDFs as flat images/canvas — it does **not** expose a text layer that a content script can read or manipulate. So sentence-level navigation isn't possible on top of it.

Instead, this extension bundles [PDF.js](https://github.com/mozilla/pdf.js) and ships its own viewer page (`viewer/viewer.html`). A background service worker intercepts navigation to any `.pdf` URL and redirects the tab to this custom viewer, passing the original PDF URL as a parameter. The custom viewer then:

1. Renders each page to a `<canvas>` (visual layer), using PDF.js
2. Builds a PDF.js **text layer** (`<span>` elements positioned over the canvas) so the underlying text is selectable/searchable
3. Joins all the text-layer fragments on a page into one continuous string, inferring word boundaries from the spacing/position between text fragments (PDF.js often splits a single word into several fragments due to kerning/justification)
4. Splits that string into sentences using the browser's built-in [`Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) (`granularity: "sentence"`)
5. Maps each sentence back to a DOM [`Range`](https://developer.mozilla.org/en-US/docs/Web/API/Range) — even when the sentence spans multiple text-layer fragments or wraps across lines
6. Listens for `Tab` / `Shift+Tab` globally, moves an "active sentence" index forward/backward (wrapping around at the start/end), and on each change:
   - highlights the sentence's `Range` using `getClientRects()`
   - smooth-scrolls it into view

## Project structure
pdf-sentence-navigator/
├── manifest.json
├── background.js              # Redirects .pdf navigations to our own viewer
├── viewer/
│   ├── viewer.html
│   ├── viewer.js               # Rendering + wiring segmenter/navigator/highlighter together
│   ├── viewer.css
│   └── lib/pdfjs/               # PDF.js (pdfjs-dist@3.11.174) build files
├── src/
│   ├── sentence-segmenter.js   # Text extraction + sentence splitting + Range building
│   ├── navigator.js            # Tab/Shift+Tab state machine
│   └── highlighter.js          # Draws/clears the active-sentence highlight, scrolls to it
├── icons/
└── README.md

## Installation

1. Clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the project's root folder (the one containing `manifest.json`)
5. If you want to test with local PDF files (`file:///...`), open the extension's card on `chrome://extensions`, click **Details**, and enable **"Allow access to file URLs"**

## Usage

1. Open any PDF in Chrome — a URL ending in `.pdf`, whether local (`file://`) or online (`https://.../doc.pdf`)
2. The tab will automatically redirect to the extension's own viewer
3. Press **Tab** to jump to the next sentence, **Shift+Tab** for the previous one
4. The active sentence is highlighted in yellow and scrolled into view automatically
5. Navigation wraps around: pressing `Tab` on the last sentence jumps back to the first one (and vice versa with `Shift+Tab`)

## Known limitations

- **Headings without punctuation** get merged into the sentence that follows them, since sentence segmentation relies on punctuation (`.`, `!`, `?`) to find boundaries, and headings typically have none.
- **Scanned/image-only PDFs** are not supported — if a PDF has no embedded text layer (e.g. a pure photo scan with no OCR), there is no text to segment or navigate.
- **Sentences that span a page break** are currently treated as two separate sentences (one ending at the bottom of a page, one starting at the top of the next), since text extraction is done per-page.
- Occasionally, two sentences get merged when the PDF's internal text layout places no space between them (e.g. a closing quote directly followed by an opening parenthesis) — this is inherent to how the source PDF encodes its text, not a bug in the extraction logic.

## Tech notes

- Manifest V3, vanilla JavaScript (no build step, no framework)
- PDF.js pinned to `pdfjs-dist@3.11.174` (a stable, well-tested release using the legacy `renderTextLayer` API — a newer `TextLayer` class exists in later PDF.js versions but had a documented text-width miscalculation bug on certain fonts at the time this project was built)
- No external requests: `host_permissions` are only used to read the PDF the user is already opening, never to send data anywhere

## License

MIT. Uses [PDF.js](https://github.com/mozilla/pdf.js) (Apache License 2.0).