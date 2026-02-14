const container = document.getElementById("cardContainer");
const mockContainer = document.getElementById("mockContainer");
let isDragging = false;
let startX = 0;
let startY = 0;
let startTime = 0;
let currentCard = null;
let cards = [];
let dy = 0;

async function fetchCardData() {
  const res = await fetch("https://dog.ceo/api/breeds/image/random");
  const data = await res.json();
  const urlParts = data.message.split("/");
  const breed = urlParts[urlParts.length - 2];
  return { name: breed, image: data.message };
}

async function loadCards() {
  const initialCards = 2;
  for (let i = 0; i < initialCards; i++) {
    const cardData = await fetchCardData();
    cards.push(cardData);
  }
}

loadCards().then(() => {
  for (let i = 0; i < cards.length; i++) {
    const cardData = cards[i];
    const card = document.createElement("div");
    card.className = "card";
    const content = document.createElement("div");
    content.className = "card-content";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = cardData.name;

    const img = document.createElement("img");
    img.className = "card-image";
    img.loading = "lazy";
    img.crossOrigin = "anonymous";
    img.src = cardData.image;
    img.alt = cardData.name;
    content.appendChild(img);
    content.appendChild(title);
    card.appendChild(content);
    container.appendChild(card);
  }
});

function startDrag(x, y) {
  currentCard = container.lastElementChild;
  isDragging = true;
  startX = x;
  startY = y;
  startTime = performance.now();
  currentCard.style.transition = "none";
}

function moveDrag(x, y) {
  if (!isDragging) return;

  const dx = x - startX;
  dy = y - startY;
  currentCard.style.transform = `translateX(${dx}px) translateY(${dy}px) rotate(${dx / 20}deg)`;
}

function endDrag(x) {
  if (!isDragging) return;

  const dx = x - startX;
  const dt = performance.now() - startTime;
  isDragging = false;
  handleSwipe(dx, dt);
}

async function handleSwipe(dx, dt) {
  const distance = Math.abs(dx);
  const velocity = distance / dt;
  const DIST = 65;
  const VEL = 0.6;

  if (distance < DIST && velocity < VEL) {
    currentCard.style.transition = "transform .4s ease";
    currentCard.style.transform = "translateX(0) rotate(0)";
    return;
  }

  const dir = dx > 0 ? 1 : -1;
  const card = currentCard;
  const flyOutDistance = window.innerWidth * 1.1;

  const rect = card.getBoundingClientRect();
  const clone = card.cloneNode(true);
  clone.style.width = rect.width + "px";
  clone.style.height = rect.height + "px";
  clone.style.transition = "transform .4s ease-out";
  mockContainer.appendChild(clone);

  // Force layout
  clone.getBoundingClientRect();

  requestAnimationFrame(() => {
    clone.style.transform = `translateX(${dir * flyOutDistance}px) translateY(${dy}px) rotate(${dir * 25}deg)`;
  });

  clone.addEventListener("transitionend", () => {
    clone.remove();
  });

  // Recycle the card immediately
  card.style.transform = "";
  container.insertBefore(card, container.firstChild);

  // Swap card data
  const newCardData = await fetchCardData();
  card.querySelector(".card-title").textContent = newCardData.name;
  const card_image = card.querySelector(".card-image");
  card_image.src = newCardData.image;
  card_image.alt = newCardData.name;
}

container.addEventListener("mousedown", (e) => startDrag(e.clientX, e.clientY));
window.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY));
window.addEventListener("mouseup", (e) => endDrag(e.clientX));

container.addEventListener("touchstart", (e) => startDrag(e.touches[0].clientX, e.touches[0].clientY));
container.addEventListener("touchmove", (e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY));
container.addEventListener("touchend", (e) => endDrag(e.changedTouches[0].clientX));

let autoEnabled = false;
let autoTimer = null;
const AUTO_INTERVAL = 8000;
const AUTO_DISTANCE = 70;

function autoSwipe() {
  if (isDragging) return;
  if (!container.lastElementChild) return;

  currentCard = container.lastElementChild;
  currentCard.style.transition = "none";
  handleSwipe(AUTO_DISTANCE, 200);
}

const toggleBtn = document.getElementById("autoToggle");

toggleBtn.addEventListener("click", () => {
  autoEnabled = !autoEnabled;
  if (autoEnabled) {
    autoTimer = setInterval(autoSwipe, AUTO_INTERVAL);
  } else {
    clearInterval(autoTimer);
    autoTimer = null;
  }
});
