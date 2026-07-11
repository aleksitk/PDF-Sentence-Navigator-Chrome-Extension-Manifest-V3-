# PDF Sentence Navigator — Chrome Extension (Manifest V3)

## Project Structure

```
pdf-sentence-navigator/
├── manifest.json
├── background.js
├── viewer/
│   ├── viewer.html
│   ├── viewer.js
│   ├── viewer.css
│   └── lib/
│       └── pdfjs/
├── src/
│   ├── sentence-segmenter.js
│   ├── navigator.js
│   └── highlighter.js
├── icons/
├── README.md
└── LICENSE
```

---

## Phase 1 — Setup

- [ ] Install Node.js
- [ ] Create a GitHub repository: `pdf-sentence-navigator`
- [ ] Clone the repository locally
- [ ] Download the latest stable PDF.js build
- [ ] Copy the required files into `viewer/lib/pdfjs/`
  - `pdf.mjs`
  - `pdf.worker.mjs`
  - `pdf_viewer.mjs`
  - `pdf_viewer.css`

---

## Phase 2 — Manifest

- [X] Set `manifest_version` to 3
- [X] Add `webNavigation` and `storage` permissions
- [X] Add host permissions for `file://`, `http://`, and `https://`
- [X] Configure `background.service_worker`
- [X] Add `viewer/*` and `viewer/lib/pdfjs/*` to `web_accessible_resources`
- [X] Configure Content Security Policy
- [X] Document the "Allow access to file URLs" requirement

---

## Phase 3 — PDF Redirect

- [X] Listen for PDF navigation in `background.js`
- [X] Detect PDF URLs
- [X] Redirect to `viewer/viewer.html`
- [X] Prevent redirect loops
- [ ] Test local `file://` PDFs

---

## Phase 4 — PDF.js Integration

- [ ] Load `pdf.mjs`
- [ ] Configure `workerSrc`
- [ ] Read the `file` URL parameter
- [ ] Open the document using `getDocument()`
- [ ] Render all pages
- [ ] Generate the text layer
- [ ] Verify scrolling and zoom

---

## Phase 5 — Sentence Segmentation

- [ ] Collect text from all text-layer spans
- [ ] Preserve references to spans
- [ ] Use `Intl.Segmenter`
- [ ] Add regex fallback
- [ ] Handle abbreviations
- [ ] Handle multi-line sentences
- [ ] Handle page boundaries
- [ ] Handle tables and multi-column layouts
- [ ] Store sentence id
- [ ] Store start/end offsets
- [ ] Store DOM Range

---

## Phase 6 — Keyboard Navigation

- [ ] Create `activeSentenceIndex`
- [ ] Listen for keyboard events
- [ ] Handle `Tab`
- [ ] Handle `Shift + Tab`
- [ ] Prevent default browser focus behavior
- [ ] Navigate across page boundaries
- [ ] Keep the active sentence centered

---

## Phase 7 — Highlight

- [ ] Remove the previous highlight
- [ ] Highlight the active sentence
- [ ] Support multi-line highlights
- [ ] Apply visible highlight styling

---

## Phase 8 — Testing

- [ ] Test a simple PDF
- [ ] Test a multi-page PDF
- [ ] Test abbreviations
- [ ] Test Georgian text
- [ ] Test scanned PDFs
- [ ] Verify browser focus behavior
- [ ] Test local and remote PDFs
- [ ] Check the Network tab for external requests

---

## Phase 9 — README

- [ ] Add project overview
- [ ] Add installation instructions
- [ ] Add usage instructions
- [ ] Document known limitations
- [ ] Explain the architecture
- [ ] Add license information

---

## Phase 10 — GitHub

- [ ] Add `.gitignore`
- [ ] Commit the initial version
- [ ] Push to GitHub
- [ ] Add repository description and topics
- [ ] Record a short demo

---

## Extra Tasks

- [ ] Progress indicator
- [ ] Popup UI
- [ ] Custom keyboard shortcuts
- [ ] Convert to TypeScript
- [ ] Add unit tests