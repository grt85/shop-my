
let cart = [];

try {
  const storedCart = JSON.parse(localStorage.getItem('cart'));
  cart = Array.isArray(storedCart) ? storedCart : [];
} catch (e) {
  cart = [];
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}


function addToCart(name, price, event) {
  const productEl = event.target.closest('.product');
  if (!productEl) return;

  // якщо немає data-id, призначаємо унікальний
  if (!productEl.dataset.id) {
    productEl.dataset.id = Date.now().toString();
  }

  const productId = productEl.dataset.id;
  const photoEl = productEl.querySelector('img');
  // беремо саме атрибут src, щоб зберігати відносний шлях "/imeiges/..."
  const photoSrc = photoEl?.getAttribute('src') || '/imeiges/логотип для магазину.png';

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id: productId, name, price, quantity: 1, photo: photoSrc });
  }

  saveCart();
  renderCart();
  alert(`${name} додано до кошика!`);
}


function openCart() {
  renderCart();
  document.getElementById("cartModal").style.display = "flex";
}

function closeCart() {
  document.getElementById("cartModal").style.display = "none";
}

function renderCart() {
  const list = document.getElementById("cartItemsList");
  const totalDisplay = document.getElementById("cartTotal");
  list.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
  <img src="${item.photo}" alt="${item.name}" width="50">
  <span>${item.name} — ${item.price} грн × ${item.quantity}</span>
  <div>
    <button onclick="decreaseQuantity(${index})">➖</button>
    <button onclick="increaseQuantity(${index})">➕</button>
    <button onclick="removeItem(${index})">🗑️</button>
  </div>
`;
    list.appendChild(li);
    total += item.price * item.quantity;
  });

  totalDisplay.textContent = `Ітого: ${total} грн`;

  updateCartCount(); // 🔥 додати тут
}
cart = [];
saveCart();
renderCart();
function increaseQuantity(index) {
  cart[index].quantity++;
  saveCart();
  renderCart();
}

function decreaseQuantity(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
  } else {
    removeItem(index);
    return;
  }
  saveCart();
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const counter = document.getElementById("cartCount");
  if (counter) {
    counter.textContent = count;
  }
}

function validateOrderForm(name, phone, email, delivery, city, warehouse) {
  const phoneDigits = phone.replace(/\D/g, '');

  if (!name || phoneDigits.length !== 10) {
    alert("Введіть коректне ім’я та телефон (10 цифр).");
    return false;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert("Некоректна електронна адреса.");
    return false;
  }

  if (!delivery) {
    alert("Оберіть спосіб доставки.");
    return false;
  }

  if (delivery === "nova_poshta" && (!city || !warehouse)) {
    alert("Вкажіть місто та відділення Нової Пошти.");
    return false;
  }

  if (cart.length === 0) {
    alert("Кошик порожній.");
    return false;
  }

  return true;
}
function showMessage(id, duration = 9000) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'block';
    setTimeout(() => {
      el.style.display = 'none';
    }, duration);
  }
}

function submitOrder() {
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  const delivery = document.getElementById("deliveryMethod").value;
  const payment = document.getElementById("paymentMethod")?.value || '';
  const city = document.getElementById("city")?.value.trim();
  const warehouse = document.getElementById("warehouse")?.value.trim();
  const warehouseNumber = document.getElementById("warehouseNumber")?.value.trim();

  if (!validateOrderForm(name, phone, email, delivery, city, warehouse)) return;
  if (!payment) {
    alert("Оберіть спосіб оплати.");
    return;
  }

  const order = {
    customer: { name, phone, email, delivery, city, warehouse, warehouseNumber, payment },
    items: cart,
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  };

  fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  })
    .then(res => {
      if (!res.ok) throw new Error(`Помилка сервера: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (!data.success) {
        showMessage("orderError"); // показати повідомлення про помилку
        return;
      }

      alert(`Замовлення №${data.orderId} оформлено ✅`);

      // Очищення кошика
      cart = [];
      saveCart();
      renderCart();
      document.getElementById("cartModal").style.display = 'none';

      // Повідомлення про успіх
      showMessage("orderSuccess");
    })
    .catch(err => {
      console.error("❌ Помилка при замовленні:", err.message);
      showMessage("orderError"); // показати повідомлення про помилку
    });
}

      



// Доставка: показати/сховати поля Нової Пошти
document.getElementById("deliveryMethod").addEventListener("change", function () {
  const npBlock = document.getElementById("npOptions");
  npBlock.style.display = this.value === "nova_poshta" ? "block" : "none";
});

// Галерея
let galleryImages = [];
let currentImageIndex = 0;

function openGallery(images) {
  galleryImages = images;
  currentImageIndex = 0;
  updateGalleryImage();
  document.getElementById("galleryModal").style.display = "block";
  document.getElementById("galleryOverlay").style.display = "block";
}

function closeGallery() {
  document.getElementById("galleryModal").style.display = "none";
  document.getElementById("galleryOverlay").style.display = "none";
}

function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
  updateGalleryImage();
}

function prevImage() {
  currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
  updateGalleryImage();
}

function updateGalleryImage() {
  const img = document.getElementById("galleryImage");
  img.src = galleryImages[currentImageIndex];
}

// Swipe-навігація
let touchStartX = 0;

document.getElementById("galleryModal").addEventListener("touchstart", e => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.getElementById("galleryModal").addEventListener("touchend", e => {
  const touchEndX = e.changedTouches[0].screenX;
  const diff = touchEndX - touchStartX;
  if (diff > 50) prevImage();
  else if (diff < -50) nextImage();
}, { passive: true });
// Ініціалізація
updateCartCount();



