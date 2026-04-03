const container = document.getElementById("cardContainer");
const mockContainer = document.getElementById("mockContainer");
let isDragging = false;
let startX = 0;
let startY = 0;
let startTime = 0;
let currentCard = null;
let dy = 0;

const MAX_CARDS_QUEUE = 64;
const REFILL_THRESHOLD = 32;
let dataQueue = [];
let fillingQueue = false;

async function fetchCardData(num) {
  const res = await fetch(`https://dog.ceo/api/breeds/image/random/${num}`);
  const data = await res.json();
  return data.message.map((url) => {
    const parts = url.split("/");
    const breed = parts[parts.length - 2];
    return { breed, url };
  });
}

async function refillQueue(num) {
  if (dataQueue.length >= MAX_CARDS_QUEUE || fillingQueue) return;
  fillingQueue = true;
  const newData = await fetchCardData(num);
  dataQueue.push(...newData);
  fillingQueue = false;
}

function addNextCard() {
  if (dataQueue.length === 0) return;
  const data = dataQueue.shift();
  const card = document.createElement("div");
  card.className = "card";
  const content = document.createElement("div");
  content.className = "card-content";
  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = data.breed;
  const img = document.createElement("img");
  img.className = "card-image";
  img.crossOrigin = "anonymous";
  img.src = data.url;
  img.alt = data.breed;
  content.appendChild(img);
  content.appendChild(title);
  card.appendChild(content);
  container.insertBefore(card, container.firstChild);
}

async function loadCards() {
  await refillQueue(REFILL_THRESHOLD);
  addNextCard();
  addNextCard();
}

loadCards();

function startDrag(x, y) {
  currentCard = container.lastElementChild;
  if (!currentCard) return;
  isDragging = true;
  startX = x;
  startY = y;
  startTime = performance.now();
  currentCard.style.transition = "none";
  document.body.classList.toggle("dragging", true);
}

function moveDrag(x, y) {
  if (!isDragging || !currentCard) return;
  const dx = x - startX;
  dy = y - startY;
  currentCard.style.transform = `translateX(${dx}px) translateY(${dy}px) rotate(${dx / 20}deg)`;
}

function endDrag(x) {
  if (!isDragging || !currentCard) return;

  const dx = x - startX;
  const dt = performance.now() - startTime;
  isDragging = false;
  document.body.classList.toggle("dragging", false);

  const distance = Math.abs(dx);
  const velocity = distance / dt;
  const DIST = 65;
  const VEL = 0.6;

  if (distance < DIST && velocity < VEL) {
    currentCard.style.transition = "transform .4s ease";
    currentCard.style.transform = "translateX(0) rotate(0)";
    return;
  }

  const card = currentCard;
  const dir = dx > 0 ? 1 : -1;
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

  clone.addEventListener("transitionend", () => clone.remove());
  card.remove();

  addNextCard();
  if (dataQueue.length < REFILL_THRESHOLD) {
    refillQueue(MAX_CARDS_QUEUE);
  }
}

container.addEventListener("mousedown", e=>startDrag(e.clientX, e.clientY));
window.addEventListener("mousemove", e=>moveDrag(e.clientX, e.clientY));
window.addEventListener("mouseup", e=>endDrag(e.clientX));
container.addEventListener("touchstart", e=>startDrag(e.touches[0].clientX, e.touches[0].clientY));
container.addEventListener("touchmove", e=> moveDrag(e.touches[0].clientX, e.touches[0].clientY));
container.addEventListener("touchend", e=>endDrag(e.changedTouches[0].clientX));

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

document.getElementById("autoToggle").addEventListener("click", () => {
  autoEnabled = !autoEnabled;
  if (autoEnabled) {
    autoTimer = setInterval(autoSwipe, AUTO_INTERVAL);
  } else {
    clearInterval(autoTimer);
    autoTimer = null;
  }
});