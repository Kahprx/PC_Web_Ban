const REVEAL_SELECTOR = "[data-reveal]";

export function applyRevealMotion(root = document) {
  if (typeof window === "undefined" || !root?.querySelectorAll) {
    return () => {};
  }

  const revealNodes = Array.from(root.querySelectorAll(REVEAL_SELECTOR));
  if (!revealNodes.length) {
    return () => {};
  }

  document.documentElement.classList.add("motion-enabled");

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  revealNodes.forEach((node, index) => {
    if (!node.style.getPropertyValue("--motion-delay")) {
      node.style.setProperty("--motion-delay", `${Math.min(index * 60, 360)}ms`);
    }
  });

  if (prefersReducedMotion) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        activeObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  revealNodes.forEach((node) => observer.observe(node));

  return () => observer.disconnect();
}
