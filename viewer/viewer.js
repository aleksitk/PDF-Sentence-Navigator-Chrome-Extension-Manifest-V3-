// pdfjsLib გლობალურად ხელმისაწვდომია lib/pdfjs/pdf.js-დან (window.pdfjsLib),
// რადგან viewer.html-ში ეს ჩატვირთულია <script> tag-ით (არა module-ით)
import { buildPageTextMap, segmentIntoSentences, sentenceRangeToDomRange } from "../src/sentence-segmenter.js";
import { createNavigator } from "../src/navigator.js";

const pdfjsLib = window["pdfjsLib"];

pdfjsLib.GlobalWorkerOptions.workerSrc = "./lib/pdfjs/pdf.worker.js";

function getFileUrlFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const file = params.get("file");
  return file ? decodeURIComponent(file) : null;
}

async function renderPage(pdfDocument, pageNum, container, allSentences) {
  const page = await pdfDocument.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.5 });

  const pageDiv = document.createElement("div");
  pageDiv.className = "page";
  pageDiv.style.position = "relative";
  pageDiv.style.width = viewport.width + "px";
  pageDiv.style.height = viewport.height + "px";
  container.appendChild(pageDiv);

  // --- Canvas ფენა ---
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  pageDiv.appendChild(canvas);

  await page.render({
    canvasContext: canvas.getContext("2d"),
    viewport: viewport,
  }).promise;

const textLayerDiv = document.createElement("div");
  textLayerDiv.className = "textLayer";
  textLayerDiv.style.width = viewport.width + "px";
  textLayerDiv.style.height = viewport.height + "px";
  textLayerDiv.style.setProperty("--scale-factor", viewport.scale);
  pageDiv.appendChild(textLayerDiv);

  const textContent = await page.getTextContent();

  const textDivs = [];

  const textLayerTask = pdfjsLib.renderTextLayer({
    textContentSource: textContent,
    container: textLayerDiv,
    viewport: viewport,
    textDivs: textDivs,
  });

  await textLayerTask.promise;

  // --- დროებითი ტესტი: ვნახოთ სწორად იკვრება თუ არა ტექსტი ---

  const { fullText, chunks } = buildPageTextMap(textContent, textDivs);
  const sentences = segmentIntoSentences(fullText);

  // ამ გვერდის წინადადებები დავამატოთ გლობალურ სიაში, pageDiv/chunks-ის
  // reference-ებით ერთად - რომ მოგვიანებით Range/scroll/highlight
  // შევძლოთ ნებისმიერ წინადადებაზე
  for (const s of sentences) {
    allSentences.push({
      text: s.text,
      start: s.start,
      end: s.end,
      pageNum,
      pageDiv,
      chunks,
    });
  }


  return pageDiv;
}

async function renderPdf(url) {
  const loadingTask = pdfjsLib.getDocument(url);
  const pdfDocument = await loadingTask.promise;

  const container = document.getElementById("viewer");

  // გლობალური სია ყველა წინადადებისთვის, მთელი დოკუმენტიდან,
  // თანმიმდევრობით (გვერდი 1-ის ყველა წინადადება, მერე გვერდი 2-ის და ა.შ.)
  const allSentences = [];

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    await renderPage(pdfDocument, pageNum, container, allSentences);
  }

  console.log(`სულ ჩაიტვირთა ${allSentences.length} წინადადება ${pdfDocument.numPages} გვერდზე.`);
  window.allSentences = allSentences;

  // დროებითი ტესტი: ვნახოთ navigator მუშაობს თუ არა Console-ის მეშვეობით
  const navigator = createNavigator(allSentences, (sentence, index) => {
    console.log(`[${index}] "${sentence.text}"`);
  });

  window.pdfNavigator = navigator; // დროებით, Console-იდან სატესტოდ
  // დროებით გლობალურ window-ზეც გავიტანოთ, რომ Console-იდან შევამოწმოთ
  window.allSentences = allSentences;
}

const fileUrl = getFileUrlFromQuery();

if (!fileUrl) {
  document.body.innerHTML = "<h2 style='color:white;text-align:center;margin-top:40px'>PDF ფაილი ვერ მოიძებნა URL-ში.</h2>";
} else {
  renderPdf(fileUrl).catch((err) => {
    console.error("PDF render error:", err);
    document.body.innerHTML = `<h2 style='color:white;text-align:center;margin-top:40px'>PDF-ის ჩატვირთვის შეცდომა: ${err.message}</h2>`;
  });
}

