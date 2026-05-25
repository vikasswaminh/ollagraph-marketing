document.querySelectorAll("#code-tabs button").forEach(btn => {
      btn.addEventListener("click", () => {
        const t = btn.dataset.tab;
        document.querySelectorAll("#code-tabs button").forEach(b => b.classList.toggle("active", b === btn));
        document.querySelectorAll("[data-pane]").forEach(p => p.hidden = p.dataset.pane !== t);
      });
    });
