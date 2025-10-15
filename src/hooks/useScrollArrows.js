// Add scroll arrows to a scrollable element
import { useEffect } from "react";

export default function useScrollArrows(ref, options = {}) {
  // Configure scroll step and hold timing
  const step = options.step || 24;
  const holdDelay = options.holdDelay || 150;
  const speed = options.speed || 220; // Pixels per second while holding
  const initDelay = options.initDelay || 400; // Wait before first visibility check

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Find nearest scroll parent (has-scroll-parent)
    const scrollParent = el.closest(".has-scroll-parent") || el.parentElement;
    if (!scrollParent) return;

    // Create arrow elements
    const upBtn = document.createElement("button");
    const downBtn = document.createElement("button");

    // Apply shared classes
    upBtn.className = "has-scroll-arrow has-scroll-arrow--up";
    downBtn.className = "has-scroll-arrow has-scroll-arrow--down";
    upBtn.setAttribute("aria-label", "Scroll up");
    downBtn.setAttribute("aria-label", "Scroll down");

    // Start hidden to prevent flash before first update
    upBtn.style.display = "none";
    downBtn.style.display = "none";

    // Append to scroll parent (not the scrolling content)
    scrollParent.appendChild(upBtn);
    scrollParent.appendChild(downBtn);

    // Scroll instantly by offset (used during hold)
    const scrollInstant = (offset) => {
      el.scrollTop = el.scrollTop + offset;
    };

    // Scroll smoothly by offset (used for single click)
    const scrollSmooth = (offset) => {
      el.scrollBy({ top: offset, behavior: "smooth" });
    };

    // Attach pointer-driven click and hold behavior
    const attachPointerScroll = (btn, direction) => {
      let rafId = null;
      let holdTimer = null;
      let holding = false;
      let lastTs = 0;
      let downTs = 0;

      const tick = (ts) => {
        if (!holding) return;
        if (!lastTs) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;
        const delta = direction * speed * dt;
        scrollInstant(delta);
        rafId = requestAnimationFrame(tick);
      };

      const onPointerDown = (e) => {
        e.preventDefault();
        downTs = performance.now();
        lastTs = 0;
        holding = false;

        holdTimer = setTimeout(() => {
          holding = true;
          rafId = requestAnimationFrame(tick);
        }, holdDelay);

        window.addEventListener("pointerup", onPointerUp, { passive: true });
        window.addEventListener("pointercancel", onPointerUp, { passive: true });
        window.addEventListener("blur", onPointerUp, { passive: true });
      };

      const onPointerUp = () => {
        clearTimeout(holdTimer);
        holdTimer = null;

        if (holding) {
          holding = false;
          if (rafId) cancelAnimationFrame(rafId);
          rafId = null;
        } else {
          const elapsed = performance.now() - downTs;
          if (elapsed < holdDelay + 50) {
            scrollSmooth(direction * step);
          }
        }

        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("blur", onPointerUp);
      };

      btn.addEventListener("pointerdown", onPointerDown);
      btn.addEventListener("pointerleave", () => {
        if (holding) onPointerUp();
      });

      return () => {
        btn.removeEventListener("pointerdown", onPointerDown);
        btn.removeEventListener("pointerleave", onPointerUp);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("blur", onPointerUp);
        if (rafId) cancelAnimationFrame(rafId);
        if (holdTimer) clearTimeout(holdTimer);
      };
    };

    // Attach scrolling logic
    const cleanupUp = attachPointerScroll(upBtn, -1);
    const cleanupDown = attachPointerScroll(downBtn, +1);

    // Update arrow visibility
    const updateArrows = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const hasScroll = scrollHeight > clientHeight + 1;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if (!hasScroll) {
        upBtn.style.display = "none";
        downBtn.style.display = "none";
        return;
      }

      upBtn.style.display = "flex";
      downBtn.style.display = "flex";

      upBtn.disabled = atTop;
      downBtn.disabled = atBottom;

      upBtn.style.opacity = atTop ? "0" : "1";
      downBtn.style.opacity = atBottom ? "0" : "1";
    };

    // Observe scroll and layout
    el.addEventListener("scroll", updateArrows);
    const resizeObs = new ResizeObserver(updateArrows);
    resizeObs.observe(el);
    const mutationObs = new MutationObserver(updateArrows);
    mutationObs.observe(el, { childList: true, subtree: true });

    // Delay first visibility update to avoid startup flash
    const initTimer = setTimeout(updateArrows, initDelay);

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
  }, [ref, step, holdDelay, speed]);
}