// Annual/monthly
    const bm = document.getElementById("bm"), by = document.getElementById("by");
    bm.addEventListener("click", () => {
      bm.style.background = "rgba(199,247,81,0.1)"; bm.style.color = "var(--accent)";
      by.style.background = ""; by.style.color = "var(--text-muted)";
      document.querySelectorAll("[data-price]").forEach(el => {
        const m = parseInt(el.dataset.price, 10);
        el.textContent = m === 0 ? "$0" : "$" + m;
      });
    });
    by.addEventListener("click", () => {
      by.style.background = "rgba(199,247,81,0.1)"; by.style.color = "var(--accent)";
      bm.style.background = ""; bm.style.color = "var(--text-muted)";
      document.querySelectorAll("[data-price]").forEach(el => {
        const m = parseInt(el.dataset.price, 10);
        const y = Math.round(m * 0.8);
        el.textContent = m === 0 ? "$0" : "$" + y;
      });
    });

    // Calculator
    const pages = document.getElementById("pages");
    const render = document.getElementById("render");
    const extract = document.getElementById("extract");
    const pagesOut = document.getElementById("pages-out");
    const renderOut = document.getElementById("render-out");
    const extractOut = document.getElementById("extract-out");
    const ogPrice = document.getElementById("og-price");
    const vsPrice = document.getElementById("vs-price");
    const save = document.getElementById("save");
    const credits = document.getElementById("credits");
    let planType = "developer";

    // Map slider value 0-100 → pages (logarithmic 10K → 100M)
    const pagesFromSlider = v => Math.round(10000 * Math.pow(10000, v / 100));

    function fmtMoney(n) {
      if (n >= 1000) return "$" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
      return "$" + Math.round(n).toLocaleString();
    }
    function fmtPages(n) {
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
      if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
      return n.toLocaleString();
    }
    function fmtCredits(n) {
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
      if (n >= 1_000) return Math.round(n / 1_000) + "K";
      return n.toLocaleString();
    }

    function update() {
      const p = pagesFromSlider(+pages.value);
      const rPct = +render.value, ePct = +extract.value;
      pagesOut.textContent = fmtPages(p) + " pages";
      renderOut.textContent = rPct + "%";
      extractOut.textContent = ePct + "%";

      // Update slider bg
      [pages, render, extract].forEach(s => s.style.setProperty("--pct", s.value + "%"));

      // OG pricing: 1 credit/page static, +4 stealth, +1 extract → average credits per page
      const avgCredits = 1 + 3 * (rPct/100) + 1 * (ePct/100);
      const totalCredits = p * avgCredits;
      credits.textContent = fmtCredits(totalCredits);

      // Pricing tiers: Developer $49 + $0.40/1K credits beyond 100K
      let og;
      if (planType === "developer") {
        const billable = Math.max(0, totalCredits - 100000);
        og = 49 + (billable / 1000) * 0.40;
      } else {
        og = (totalCredits / 1000) * 0.32; // ent
      }
      // Firecrawl-ish: $0.0011 per page-equiv at this mix
      const fc = p * (0.0011 + 0.0018 * (rPct/100));

      ogPrice.textContent = fmtMoney(og);
      vsPrice.textContent = fmtMoney(fc);
      const pct = fc > 0 ? Math.round((1 - og / fc) * 100) : 0;
      save.textContent = (pct >= 0 ? "−" : "+") + Math.abs(pct) + "%";
      save.style.color = pct >= 0 ? "var(--green)" : "var(--rose)";
    }

    [pages, render, extract].forEach(el => el.addEventListener("input", update));
    document.querySelectorAll(".plan-toggle").forEach(b => {
      b.addEventListener("click", () => {
        document.querySelectorAll(".plan-toggle").forEach(x => x.classList.toggle("active", x === b));
        planType = b.dataset.plan;
        update();
      });
    });
    update();
