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

    // Progressive reveal — opt-in via [data-reveal] (ASCII reference)
    (function () {
      const revealables = document.querySelectorAll("[data-reveal]");
      if (!revealables.length) return;
      if (!("IntersectionObserver" in window)) {
        revealables.forEach((el) => el.setAttribute("data-revealed", ""));
        return;
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.setAttribute("data-revealed", "");
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      revealables.forEach((el) => io.observe(el));
    })();

    // Copy feedback — adds .copied + "copied" via CSS ::after
    document.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pane = btn.closest(".code-block, .codeblock, .api-frame, .surface");
        let target = null;
        if (btn.hasAttribute("data-copy")) {
          const sel = btn.getAttribute("data-copy");
          target = sel ? document.querySelector(sel) : null;
        } else {
          target = pane ? pane.querySelector("[data-pane]:not([hidden]) code, pre code, code") : null;
        }
        const text = target ? target.textContent : "";
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            btn.classList.add("copied");
            setTimeout(() => btn.classList.remove("copied"), 1400);
          });
        }
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
