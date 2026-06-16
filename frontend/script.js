/* ============================================================
   VisionForge — AI Image Studio
   ============================================================ */

const API_URL = "https://ai-image-generator-aykl.onrender.com/api/generate-image";

/* ── DOM refs ───────────────────────────────────────────────── */
const form          = document.getElementById("imageForm");
const promptInput   = document.getElementById("prompt");
const loader        = document.getElementById("loader");
const placeholder   = document.getElementById("placeholder");
const generatedImg  = document.getElementById("generatedImage");
const errorBox      = document.getElementById("errorBox");
const downloadBtn   = document.getElementById("downloadBtn");
const galleryGrid   = document.getElementById("galleryGrid");
const statusPill    = document.getElementById("statusPill");
const statusText    = statusPill.querySelector(".status-text");
const charCount     = document.getElementById("charCount");
const generateBtn   = document.getElementById("generateBtn");
const progressBar   = document.getElementById("progressBar");
const clearBtn      = document.getElementById("clearGallery");

let currentImage    = null;
let progressTimer   = null;





/* ── Character counter ─────────────────────────────────────── */
promptInput.addEventListener("input", () => {
  const len = promptInput.value.length;
  charCount.textContent = `${len} / 500`;
  charCount.classList.toggle("warn", len > 450);
});

/* ── Custom radio card selectors ────────────────────────────── */
function initRadioGroup(selector) {
  document.querySelectorAll(selector).forEach(card => {
    card.addEventListener("click", () => {
      card.parentElement.querySelectorAll(selector).forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      card.querySelector("input").checked = true;
    });
  });
}

initRadioGroup(".style-card");
initRadioGroup(".size-btn");
initRadioGroup(".quality-btn");

/* ── Prompt chips ───────────────────────────────────────────── */
document.querySelectorAll(".chip[data-prompt]").forEach(chip => {
  chip.addEventListener("click", () => {
    promptInput.value = chip.dataset.prompt;
    charCount.textContent = `${chip.dataset.prompt.length} / 500`;
    charCount.classList.toggle("warn", chip.dataset.prompt.length > 450);
    promptInput.focus();
  });
});

/* ── Status helpers ─────────────────────────────────────────── */
function setStatus(type, label) {
  statusPill.className = `status-pill ${type}`;
  statusText.textContent = label;
}

/* ── Progress bar ───────────────────────────────────────────── */
function startProgress() {
  let pct = 0;
  progressBar.style.width = "0%";
  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    pct = Math.min(pct + Math.random() * 5, 88);
    progressBar.style.width = `${pct}%`;
  }, 280);
}

function finishProgress(cb) {
  clearInterval(progressTimer);
  progressBar.style.width = "100%";
  setTimeout(cb, 420);
}

/* ── State renderers ────────────────────────────────────────── */
function showLoading() {
  loader.classList.remove("hidden");
  placeholder.classList.add("hidden");
  generatedImg.classList.add("hidden");
  errorBox.classList.add("hidden");
  downloadBtn.disabled = true;
  generateBtn.disabled = true;
  setStatus("busy", "Generating");
  startProgress();
}

function showError(msg) {
  finishProgress(() => {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
    loader.classList.add("hidden");
    placeholder.classList.remove("hidden");
    setStatus("idle", "Error");
    generateBtn.disabled = false;
  });
}

function showImage(url) {
  finishProgress(() => {
    currentImage = url;
    generatedImg.src = url;
    generatedImg.classList.remove("hidden");
    loader.classList.add("hidden");
    placeholder.classList.add("hidden");
    downloadBtn.disabled = false;
    generateBtn.disabled = false;
    setStatus("done", "Done");
    addToGallery(url, promptInput.value.trim());
  });
}

/* ── Form submit ────────────────────────────────────────────── */
form.addEventListener("submit", async e => {
  e.preventDefault();

  const prompt = promptInput.value.trim();

  if (prompt.length < 5) {
    showError("Please write a more descriptive prompt (at least 5 characters).");
    return;
  }

  const style   = (document.querySelector(".style-card.active input")   || {}).value || "cinematic";
  const size    = (document.querySelector(".size-btn.active input")     || {}).value || "1024x1024";
  const quality = (document.querySelector(".quality-btn.active input")  || {}).value || "medium";

  showLoading();

  try {
    const res  = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt, style, size, quality }),







    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Image generation failed.");





    showImage(data.image);
  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.");
  }
});

/* ── Download ───────────────────────────────────────────────── */
downloadBtn.addEventListener("click", () => {
  if (!currentImage) return;
  const a = document.createElement("a");
  a.href     = currentImage;
  a.download = `visionforge-${Date.now()}.png`;
  a.click();
});

/* ── Gallery ────────────────────────────────────────────────── */
function makeGalleryItem(url, prompt) {
  const item    = document.createElement("div");
  item.className = "gallery-item";
  item.setAttribute("role", "listitem");

  const img   = document.createElement("img");
  img.src     = url;
  img.alt     = prompt ? `Generated: ${prompt.slice(0, 60)}` : "AI-generated image";
  img.loading = "lazy";

  const overlay = document.createElement("div");
  overlay.className = "gallery-item-overlay";
  overlay.setAttribute("aria-hidden", "true");
  const p   = document.createElement("p");
  p.textContent = prompt || "AI-generated image";
  overlay.appendChild(p);

  item.append(img, overlay);
  return item;
}

function removeEmptyState() {
  const empty = document.getElementById("galleryEmpty");
  empty?.remove();
}

function addToGallery(url, prompt) {
  removeEmptyState();
  galleryGrid.prepend(makeGalleryItem(url, prompt));

  const saved = JSON.parse(localStorage.getItem("vf_gallery") || "[]");
  saved.unshift({ url, prompt });
  localStorage.setItem("vf_gallery", JSON.stringify(saved.slice(0, 16)));
}

function loadGallery() {
  const saved = JSON.parse(localStorage.getItem("vf_gallery") || "[]");
  if (!saved.length) return;
  removeEmptyState();
  saved.forEach(({ url, prompt }) => galleryGrid.append(makeGalleryItem(url, prompt)));
}

clearBtn?.addEventListener("click", () => {
  localStorage.removeItem("vf_gallery");
  galleryGrid.innerHTML = "";
  const empty = document.createElement("div");
  empty.id        = "galleryEmpty";
  empty.className = "gallery-empty";
  empty.innerHTML = `
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="8" y="16" width="48" height="36" rx="4" stroke="#2E2E4E" stroke-width="2"/>
      <path d="M8 38l12-10 10 8 10-12 14 18" stroke="#2E2E4E" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="22" cy="27" r="3" stroke="#2E2E4E" stroke-width="2"/>
    </svg>
    <p>Gallery cleared — generate your first image above.</p>
  `;
  galleryGrid.appendChild(empty);
});

/* ── Neural Canvas Animation ────────────────────────────────── */
(function initNeuralCanvas() {
  const canvas = document.getElementById("neuralCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let w, h, nodes, raf;
  const COUNT = 42;
  const MAX_DIST = 130;

  function resize() {
    w = canvas.offsetWidth;
    h = canvas.offsetHeight;
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    spawnNodes();
  }

  function spawnNodes() {
    nodes = Array.from({ length: COUNT }, () => ({
      x:  Math.random() * w,
      y:  Math.random() * h,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      r:  Math.random() * 2.2 + 1.4,
      t:  Math.random() * Math.PI * 2,
      ts: Math.random() * 0.025 + 0.01,
      mint: Math.random() > 0.65,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    nodes.forEach(n => {
      n.t  += n.ts;
      n.x  += n.vx;
      n.y  += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    });

    /* connections */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx   = nodes[i].x - nodes[j].x;
        const dy   = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > MAX_DIST) continue;

        const t = 1 - dist / MAX_DIST;
        const pulse = (Math.sin(nodes[i].t) + 1) * 0.5;

        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = `rgba(123,47,224,${t * 0.28 * (0.4 + pulse * 0.6)})`;
        ctx.lineWidth   = 0.75;
        ctx.stroke();
      }
    }

    /* nodes */
    nodes.forEach(n => {
      const pulse = (Math.sin(n.t) + 1) * 0.5;
      const r     = n.r * (0.82 + pulse * 0.36);

      /* outer glow */
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4.5);
      grd.addColorStop(0, n.mint
        ? `rgba(0,201,167,${0.22 * pulse})`
        : `rgba(123,47,224,${0.25 * pulse})`);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 4.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      /* core dot */
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = n.mint
        ? `rgba(0,201,167,${0.55 + pulse * 0.45})`
        : `rgba(185,140,255,${0.55 + pulse * 0.45})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  }

  /* pause when tab hidden to save GPU */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); }
    else { draw(); }
  });


  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  resize();
  draw();
})();

/* ── Boot ───────────────────────────────────────────────────── */
loadGallery();