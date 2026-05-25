// Code tab switching
    document.querySelectorAll(".code-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;
        document.querySelectorAll(".code-tab").forEach(t => t.classList.toggle("active", t === btn));
        document.querySelectorAll("[data-pane]").forEach(p => {
          p.hidden = p.dataset.pane !== target;
        });
      });
    });

    // Animate KPI numbers gently on first paint
    document.querySelectorAll(".text-mono.tabular").forEach(el => {
      el.style.opacity = "0";
      requestAnimationFrame(() => {
        el.style.transition = "opacity 0.6s";
        el.style.opacity = "1";
      });
    });
