

import { sentenceRangeToDomRange } from "./sentence-segmenter.js";

let currentMarkers = [];

function clearHighlight() {
  for (const marker of currentMarkers) {
    marker.remove();
  }
  currentMarkers = [];
}

/**
 * მოინიშნება მოცემული წინადადება და გადაინაცვლებს მასთან scroll-ი.
 *
 * @param {Object} sentence - allSentences-ის ერთი ელემენტი
 *        ({ text, start, end, pageNum, pageDiv, chunks })
 */
export function highlightSentence(sentence) {
  clearHighlight();

  const range = sentenceRangeToDomRange(sentence.start, sentence.end, sentence.chunks);
  if (!range) return;

  const pageRect = sentence.pageDiv.getBoundingClientRect();
  const rects = range.getClientRects();

  for (const rect of rects) {
    const marker = document.createElement("div");
    marker.className = "sentence-highlight";
    marker.style.position = "absolute";
    marker.style.left = rect.left - pageRect.left + "px";
    marker.style.top = rect.top - pageRect.top + "px";
    marker.style.width = rect.width + "px";
    marker.style.height = rect.height + "px";
    marker.style.pointerEvents = "none";
    sentence.pageDiv.appendChild(marker);
    currentMarkers.push(marker);
  }

  // ვცადოთ scroll ისე, რომ წინადადება ეკრანის ცენტრში მოხვდეს
  if (rects.length > 0) {
    const firstRect = rects[0];
    const targetY = window.scrollY + firstRect.top - window.innerHeight / 2;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  }
}