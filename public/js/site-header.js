(() => {
  const header = document.querySelector(".site-header");
  if (!header) {
    return;
  }

  const updateScrollState = () => {
    header.classList.toggle("site-header--scrolled", window.scrollY > 24);
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
})();
