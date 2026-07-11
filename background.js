// მიზანი: როცა ტაბში PDF იხსნება, გადავამისამართოთ ჩვენს viewer.html-ზე

const EXTENSION_VIEWER_PATH = "viewer/viewer.html";

// გავარკვიოთ, არის თუ არა URL ჩვენი საკუთარი ვიუერი (რომ infinite loop არ მოხდეს)
function isOwnViewerUrl(url) {
  return url.includes(chrome.runtime.id) && url.includes(EXTENSION_VIEWER_PATH);
}

// გავარკვიოთ, ჰგავს თუ არა URL PDF ფაილს
function looksLikePdfUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    // მხოლოდ მთავარი frame-ის ნავიგაცია გვაინტერესებს (არა iframe-ები)
    if (details.frameId !== 0) return;

    const { url, tabId } = details;

    if (isOwnViewerUrl(url)) return; // ჩვენივე viewer.html-ია, არ გავაკეთოთ redirect
    if (!looksLikePdfUrl(url)) return; // PDF არ არის, არაფერს ვშველით

    const viewerUrl =
      chrome.runtime.getURL(EXTENSION_VIEWER_PATH) +
      "?file=" +
      encodeURIComponent(url);

    chrome.tabs.update(tabId, { url: viewerUrl });
  }
);