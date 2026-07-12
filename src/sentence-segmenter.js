
const SPACE_GAP_THRESHOLD_RATIO = 0.15;

function shouldInsertSpace(currentItem, nextItem) {
  if (!nextItem) return false;

  // თუ span-ის ტექსტი უკვე space-ით მთავრდება, PDF.js-მა უკვე გვითხრა
  // რომ აქ space არის - მეორეს აღარ დავამატებთ.
  if (/\s$/.test(currentItem.str)) return false;

  // სხვა ხაზზეა გადასული ტექსტი - ეს ყოველთვის word-boundary-ია.
  if (currentItem.hasEOL) return true;

  const currentEndX = currentItem.transform[4] + currentItem.width;
  const nextStartX = nextItem.transform[4];
  const gap = nextStartX - currentEndX;

  const approxFontSize = currentItem.height || 1;
  return gap > approxFontSize * SPACE_GAP_THRESHOLD_RATIO;
}

/**
 * @param {Object} textContent - page.getTextContent()-ის შედეგი
 * @param {HTMLElement[]} textDivs - pdfjsLib.renderTextLayer-ის მიერ
 *        შექმნილი span-ები (იგივე თანმიმდევრობით/რაოდენობით, რაც
 *        textContent.items)
 * @returns {{ fullText: string, chunks: Array }}
 *   chunks[i] = { item, div, start, end } — start/end არის offset-ები
 *   fullText-ში, რომელიც ამ კონკრეტულ span-ს ეკუთვნის (დამატებული
 *   space-ის გარეშე)
 */
export function buildPageTextMap(textContent, textDivs) {
  const items = textContent.items;
  let fullText = "";
  const chunks = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const div = textDivs[i];

    if (!item.str || !div) continue; // ცარიელი/არარსებული span-ები გამოტოვე

    const start = fullText.length;
    fullText += item.str;
    const end = fullText.length;

    chunks.push({ item, div, start, end });

    if (shouldInsertSpace(item, items[i + 1])) {
      fullText += " ";
    }
  }

  return { fullText, chunks };
}

/**
 * ჰყოფს სრულ ტექსტს წინადადებებად Intl.Segmenter-ის გამოყენებით.
 *
 * @param {string} fullText
 * @returns {Array<{ text: string, start: number, end: number }>}
 *   თითოეული წინადადების ტექსტი და მისი offset-ები fullText-ში
 */
export function segmentIntoSentences(fullText) {
  if (typeof Intl === "undefined" || !Intl.Segmenter) {
    // Fallback უფრო ძველი გარემოსთვის (თუმცა Chrome-ს დიდი ხანია აქვს ეს)
    return fallbackSegmentIntoSentences(fullText);
  }

  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
  const sentences = [];

  for (const segment of segmenter.segment(fullText)) {
    const trimmedStart = segment.segment.search(/\S/); // პირველი non-whitespace
    if (trimmedStart === -1) continue; // მთლიანად whitespace-ია, გამოტოვე

    const trimmedEnd = segment.segment.replace(/\s+$/, "").length;

    const start = segment.index + trimmedStart;
    const end = segment.index + trimmedEnd;

    if (end > start) {
      sentences.push({
        text: fullText.slice(start, end),
        start,
        end,
      });
    }
  }

  return sentences;
}

function fallbackSegmentIntoSentences(fullText) {
  const sentences = [];
  const regex = /[^.!?]+[.!?]+(\s|$)/g;
  let match;
  let lastEnd = 0;

  while ((match = regex.exec(fullText)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = start + raw.trimEnd().length;
    sentences.push({ text: fullText.slice(start, end), start, end });
    lastEnd = regex.lastIndex;
  }

  if (lastEnd < fullText.length) {
    const rest = fullText.slice(lastEnd).trim();
    if (rest.length > 0) {
      sentences.push({
        text: rest,
        start: lastEnd + fullText.slice(lastEnd).indexOf(rest),
        end: fullText.length,
      });
    }
  }

  return sentences;
}

/**
 * გარდაქმნის სენტენს {start, end} offset-ს (fullText-ის კოორდინატებში)
 * რეალურ DOM Range ობიექტად, chunks-ის დახმარებით.
 *
 * @param {number} start
 * @param {number} end
 * @param {Array} chunks - buildPageTextMap-ის მიერ დაბრუნებული chunks
 * @returns {Range|null}
 */
export function sentenceRangeToDomRange(start, end, chunks) {
  const range = document.createRange();
  let startSet = false;
  let endSet = false;

  for (const chunk of chunks) {
    // გამოტოვე chunk-ები, რომლებიც სენტენსის დიაპაზონს საერთოდ არ კვეთენ
    if (chunk.end <= start || chunk.start >= end) continue;

    const textNode = chunk.div.firstChild;
    if (!textNode) continue;

    // სად იწყება/მთავრდება ეს konkretuli chunk ჩვენი სენტენსის შიგნით
    const localStart = Math.max(0, start - chunk.start);
    const localEnd = Math.min(chunk.item.str.length, end - chunk.start);

    if (!startSet) {
      range.setStart(textNode, localStart);
      startSet = true;
    }

    // ბოლო chunk-ს ყოველ ჯერზე ვაახლებთ - ბოლოს დარჩება ის, რაც სენტენსს ბოლოში ეხება
    range.setEnd(textNode, localEnd);
    endSet = true;
  }

  if (!startSet || !endSet) return null;

  return range;
}