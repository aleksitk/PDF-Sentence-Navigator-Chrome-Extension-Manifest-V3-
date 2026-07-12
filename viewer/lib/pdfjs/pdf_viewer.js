// pdfjsLib გლობალურად ხელმისაწვდომია lib/pdfjs/pdf.js-დან (window.pdfjsLib)
const pdfjsLib = window["pdfjsLib"];

pdfjsLib.GlobalWorkerOptions.workerSrc = "./lib/pdfjs/pdf.worker.js";

function getFileUrlFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const file = params.get("file");
  return file ? decodeURIComponent(file) : null;
}

async function renderPage(pdfDocument, pageNum, container) {
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

  // --- Text ფენა (ძველი, სტაბილური API) ---
  const textLayerDiv = document.createElement("div");
  textLayerDiv.className = "textLayer";
  textLayerDiv.style.width = viewport.width + "px";
  textLayerDiv.style.height = viewport.height + "px";
  pageDiv.appendChild(textLayerDiv);

  const textContent = await page.getTextContent();

  // Legacy API: ფუნქცია კლასის ნაცვლად
  pdfjsLib.renderTextLayer({
    textContent: textContent,
    container: textLayerDiv,
    viewport: viewport,
    textDivs: [],
  });

  return pageDiv;
}

async function renderPdf(url) {
  const loadingTask = pdfjsLib.getDocument(url);
  const pdfDocument = await loadingTask.promise;

  const container = document.getElementById("viewer");

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    await renderPage(pdfDocument, pageNum, container);
  }
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