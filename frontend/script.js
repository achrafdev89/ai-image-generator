const API_URL = "https://ai-image-generator-aykl.onrender.com/api/generate-image";

const form = document.getElementById("imageForm");
const promptInput = document.getElementById("prompt");
const styleSelect = document.getElementById("style");
const sizeSelect = document.getElementById("size");
const qualitySelect = document.getElementById("quality");

const loader = document.getElementById("loader");
const placeholder = document.getElementById("placeholder");
const generatedImage = document.getElementById("generatedImage");
const errorBox = document.getElementById("errorBox");
const downloadBtn = document.getElementById("downloadBtn");
const gallery = document.getElementById("gallery");

let currentImage = null;

function showLoading() {
  loader.classList.remove("hidden");
  placeholder.classList.add("hidden");
  generatedImage.classList.add("hidden");
  errorBox.classList.add("hidden");
  downloadBtn.disabled = true;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
  loader.classList.add("hidden");
  placeholder.classList.remove("hidden");
}

function showImage(imageUrl) {
  currentImage = imageUrl;
  generatedImage.src = imageUrl;
  generatedImage.classList.remove("hidden");
  loader.classList.add("hidden");
  placeholder.classList.add("hidden");
  downloadBtn.disabled = false;
  addToGallery(imageUrl);
}

function addToGallery(imageUrl) {
  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = "Generated artwork";
  gallery.prepend(img);

  const saved = JSON.parse(localStorage.getItem("aiGallery")) || [];
  saved.unshift(imageUrl);
  localStorage.setItem("aiGallery", JSON.stringify(saved.slice(0, 8)));
}

function loadGallery() {
  const saved = JSON.parse(localStorage.getItem("aiGallery")) || [];
  saved.forEach((imageUrl) => {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Generated artwork";
    gallery.appendChild(img);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const prompt = promptInput.value.trim();

  if (prompt.length < 5) {
    showError("Please write a more detailed prompt.");
    return;
  }

  showLoading();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        style: styleSelect.value,
        size: sizeSelect.value,
        quality: qualitySelect.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Image generation failed.");
    }

    showImage(data.image);
  } catch (error) {
    showError(error.message);
  }
});

downloadBtn.addEventListener("click", () => {
  if (!currentImage) return;

  const link = document.createElement("a");
  link.href = currentImage;
  link.download = `ai-image-${Date.now()}.png`;
  link.click();
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    promptInput.value = button.dataset.prompt;
    promptInput.focus();
  });
});

loadGallery();