// Анимация в телефоне — только пока её видно: на мобильном трафике и
// батарее ролик не крутится за краем экрана. Без движения — кадр-заставка.
const loop = document.querySelector(".hero video");
if (loop) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    loop.removeAttribute("autoplay");
    loop.pause();
  } else if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? loop.play().catch(() => {}) : loop.pause())).observe(loop);
  }
}
