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

function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  saveCart();
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
}

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

function submitOrder() {
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  const delivery = document.getElementById("deliveryMethod").value;
  const city = document.getElementById("city")?.value.trim();
  const warehouse = document.getElementById("warehouse")?.value.trim();

  if (!validateOrderForm(name, phone, email, delivery, city, warehouse)) return;

  const order = {
    customer: {
      name,
      phone,
      email,
      delivery,
      city: delivery === "nova_poshta" ? city : null,
      warehouse: delivery === "nova_poshta" ? warehouse : null
    },
    items: cart,
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  };

  fetch('https://uneloping-jeanna-erythrismal.ngrok-free.dev
/api/order',{
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  })
    .then(res => {
      if (!res.ok) throw new Error('Помилка при оформленні');
      return res.json();
    })
    .then(data => {
      alert(`Замовлення №${data.orderId || 'без номера'} оформлено!`);

      // ✅ Замість prepareLiqPay — викликаємо бекенд
      fetch('http://localhost:3000/generate-liqpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: order.total, orderId: data.orderId })
      })
        .then(res => res.json())
        .then(({ data, signature }) => {
          document.getElementById("liqpayData").value = data;
          document.getElementById("liqpaySignature").value = signature;
          document.querySelector("#liqpayForm button").click();
        })
        .catch(err => {
          console.error('Помилка генерації LiqPay:', err);
          alert('Не вдалося створити платіж');
        });

      cart = [];
      saveCart();
      renderCart();
      document.getElementById("cartModal").style.display = 'none';
      const orderSuccess = document.getElementById("orderSuccess");
      orderSuccess.style.display = 'block';
      setTimeout(() => {
        orderSuccess.style.display = 'none';
      }, 5000);
    })
    .catch(err => {
      console.error('Помилка при замовленні:', err);
      alert('Помилка при відправці замовлення');
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
});

document.getElementById("galleryModal").addEventListener("touchend", e => {
  const touchEndX = e.changedTouches[0].screenX;
  const diff = touchEndX - touchStartX;
  if (diff > 50) prevImage();
  else if (diff < -50) nextImage();
});

// Ініціалізація

updateCartCount();


