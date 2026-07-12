export function createNavigator(allSentences, onActiveSentenceChange) {
  let activeIndex = -1; // -1 ნიშნავს "ჯერ არაფერი აქტიური არაა"

  function goTo(index) {
    if (allSentences.length === 0) return;

    // cycle/loop: თუ დიაპაზონს გავცდით, დავბრუნდეთ მეორე ბოლოდან
    if (index < 0) {
      index = allSentences.length - 1;
    } else if (index >= allSentences.length) {
      index = 0;
    }

    activeIndex = index;
    onActiveSentenceChange(allSentences[activeIndex], activeIndex);
  }

  function next() {
    goTo(activeIndex + 1);
  }

  function previous() {
    goTo(activeIndex - 1);
  }

  function handleKeydown(event) {
    if (event.key !== "Tab") return;

    // ჩვეულებრივ Tab-ს ბრაუზერი focus-ის გადასატანად იყენებს -
    // ჩვენ ეს ქცევა უნდა ავიცილოთ, რომ ჩვენი საკუთარი ნავიგაცია იმუშაოს
    event.preventDefault();

    if (event.shiftKey) {
      previous();
    } else {
      next();
    }
  }

  document.addEventListener("keydown", handleKeydown);

  return {
    next,
    previous,
    goTo,
    getActiveIndex: () => activeIndex,
    destroy: () => document.removeEventListener("keydown", handleKeydown),
  };
}