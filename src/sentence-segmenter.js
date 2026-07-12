
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