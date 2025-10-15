// Add vertical scroll arrows to a scrollable element
import { useEffect } from "react";

export default function useScrollArrows(ref, options = {}) {
  // Configure scroll behavior and timings
  const {
    step = 24, // Distance for single click
    holdDelay = 150, // Delay before continuous scroll
    speed = 220, // Pixels per second while holding
    initDelay = 400, // Delay before first visibility check
    isAutoScrolling = false, // Hide bottom arrow while autoscrolling
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Locate visual parent (arrows stay fixed relative to it)
    const scrollParent = el.closest(".has-scroll-parent") || el.parentElement;
    if (!scrollParent) return;

    // Create arrow button element
    const makeArrow = (cls, label) => {
      const btn = document.createElement("button");
      btn.className = `has-scroll-arrow ${cls}`;
      btn.setAttribute("aria-label", label);
      btn.style.display = "none"; // Start hidden to prevent startup flash
      scrollParent.appendChild(btn);
      return btn;
    };

    // Build both arrow buttons
    const upBtn = makeArrow("has-scroll-arrow--up", "Scroll up");
    const downBtn = makeArrow("has-scroll-arrow--down", "Scroll down");

    // Scroll instantly by pixel offset
    const scrollInstant = (offset) => (el.scrollTop += offset);

    // Scroll smoothly by pixel offset
    const scrollSmooth = (offset) =>
      el.scrollBy({ top: offset, behavior: "smooth" });

    // Attach pointer and hold-to-scroll behavior
    const attachHoldScroll = (btn, direction) => {
      let rafId, holdTimer;
      let holding = false;
      let lastTs = 0;
      let downTs = 0;

      // Perform repeated scrolling while holding
      const tick = (ts) => {
        if (!holding) return;
        if (!lastTs) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;
        scrollInstant(direction * speed * dt);
        rafId = requestAnimationFrame(tick);
      };

      // Stop continuous scrolling
      const stop = () => {
        clearTimeout(holdTimer);
        if (holding && rafId) cancelAnimationFrame(rafId);
        holding = false;
      };

      // Handle pointer press
      const onDown = (e) => {
        e.preventDefault();
        downTs = performance.now();
        holdTimer = setTimeout(() => {
          holding = true;
          lastTs = 0;
          rafId = requestAnimationFrame(tick);
        }, holdDelay);

        window.addEventListener("pointerup", onUp, { passive: true });
        window.addEventListener("pointercancel", onUp, { passive: true });
        window.addEventListener("blur", onUp, { passive: true });
      };

      // Handle pointer release
      const onUp = () => {
        const elapsed = performance.now() - downTs;
        stop();
        if (elapsed < holdDelay + 50) scrollSmooth(direction * step);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        window.removeEventListener("blur", onUp);
      };

      btn.addEventListener("pointerdown", onDown);
      btn.addEventListener("pointerleave", stop);

      // Cleanup listeners
      return () => {
        btn.removeEventListener("pointerdown", onDown);
        btn.removeEventListener("pointerleave", stop);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        window.removeEventListener("blur", onUp);
        stop();
      };
    };

    // Initialize hold logic for both directions
    const cleanupUp = attachHoldScroll(upBtn, -1);
    const cleanupDown = attachHoldScroll(downBtn, +1);

    // Update arrow visibility based on scroll state
    const updateArrows = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const hasScroll = scrollHeight > clientHeight + 1;
      if (!hasScroll) {
        upBtn.style.display = "none";
        downBtn.style.display = "none";
        return;
      }

      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

      // Hide arrows during autoscroll animation
      if (isAutoScrolling) {
        downBtn.style.display = "none";
      } else {
        downBtn.style.display = "flex";
      }

      // Always show top arrow (even during autoscroll)
      upBtn.style.display = "flex";

      // Disable edge arrows
      upBtn.disabled = atTop;
      downBtn.disabled = atBottom;

      // Fade arrows when at edges
      upBtn.style.opacity = atTop ? "0" : "1";
      downBtn.style.opacity =
        atBottom || isAutoScrolling ? "0" : "1";
    };

    // Observe scroll, resize, and DOM changes
    el.addEventListener("scroll", updateArrows);
    const resizeObs = new ResizeObserver(updateArrows);
    const mutationObs = new MutationObserver(updateArrows);
    resizeObs.observe(el);
    mutationObs.observe(el, { childList: true, subtree: true });

    // Delay first check to avoid initial flicker
    const initTimer = setTimeout(updateArrows, initDelay);

    // Cleanup observers and elements
    return () => {
      clearTimeout(initTimer);
      el.removeEventListener("scroll", updateArrows);
      resizeObs.disconnect();
      mutationObs.disconnect();
      cleanupUp?.();
      cleanupDown?.();
      upBtn.remove();
      downBtn.remove();
    };
  }, [ref, step, holdDelay, speed, initDelay, isAutoScrolling]);
}