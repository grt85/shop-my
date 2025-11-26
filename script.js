
const cart = {
  items: [],
  customer: {
    name: '',
    phone: '',
    delivery: '',
    email: '',
    city: '',
    warehouse: '',
    warehouseNumber: ''
  }
};



document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contactForm');
  const successMessage = document.getElementById('successMessage');
  const phoneInput = document.getElementById('confirmPhone');
  const confirmEmail = document.getElementById('confirmEmail');
  const confirmName = document.getElementById('confirmName');
  const deliveryMethod = document.getElementById('deliveryMethod');
  const cartItemsModal = document.getElementById('cartItemsModal');
  const totalPriceModal = document.getElementById('totalPriceModal');
  const cartCount = document.getElementById('cartCount');
  const floatingCart = document.getElementById('floatingCart');
  const modal = document.getElementById('cartModal');
  const orderSuccess = document.getElementById('orderSuccess');
  const imageModal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');

  
  

  // 📱 Маска телефона
  phoneInput.addEventListener('input', function () {
  let digits = phoneInput.value.replace(/\D/g, '');

  // Видаляємо префікс 38, якщо є
  if (digits.startsWith('38')) digits = digits.slice(2);

  // Обмежуємо до 10 цифр
  digits = digits.slice(0, 10);

  // Формуємо маску
  let formatted = '+38 ';
  if (digits.length > 0) formatted += '(' + digits.slice(0, 3);
  if (digits.length >= 3) formatted += ') ' + digits.slice(3, 6);
  if (digits.length >= 6) formatted += '-' + digits.slice(6, 8);
  if (digits.length >= 8) formatted += '-' + digits.slice(8, 10);

  phoneInput.value = formatted;
  phoneInput.dataset.raw = digits;
});
  // 📬 Відправка форми
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email || !message || !emailRegex.test(email)) {
      alert('Будь ласка, заповніть всі поля коректно.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    fetch("https://shop-my-86on.onrender.com/api/contact", {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, message })
})
      .then(response => {
        submitBtn.disabled = false;
        if (response.ok) {
          successMessage.style.display = 'block';
          form.reset();
          setTimeout(() => {
            successMessage.style.display = 'none';
          }, 5000);
        } else {
          alert('Помилка при відправці. Спробуйте пізніше.');
        }
      })
      .catch(error => {
        submitBtn.disabled = false;
        console.error('Помилка:', error);
        alert('Помилка мережі. Перевірте підключення.');
      });
  });




    
// 🛒 Робота з корзиною
let cart = { items: [], customer: {} };

// Збереження у localStorage
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Завантаження з localStorage
function loadCart() {
  const saved = localStorage.getItem("cart");
  if (saved) {
    cart = JSON.parse(saved);
  }
  // оновлення UI
  confirmName.value = cart.customer.name || "";
  phoneInput.value = cart.customer.phone || "";
  confirmEmail.value = cart.customer.email || "";
  warehouseNumber.value = cart.customer.warehouseNumber || "";

  // оновлюємо маску телефону
  const event = new Event('input', { bubbles: true });
  phoneInput.dispatchEvent(event);

  renderCart();
}

// Оновлення лічильника
function updateCartCount() {
  cartCount.textContent = cart.items.length;
}

// Оновлення UI корзини
function renderCart() {
  cartItemsModal.innerHTML = '';
  let total = 0;

  cart.items.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = `${item.name} — ${item.price} грн`;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Видалити';
    removeBtn.onclick = () => {
      cart.items.splice(index, 1);
      refreshCartUI();
    };

    li.appendChild(removeBtn);
    cartItemsModal.appendChild(li);
    total += item.price * (item.quantity || 1);
  });

  totalPriceModal.textContent = `Ітого: ${total} грн`;
  updateCartCount();
}

// Допоміжні функції
function refreshCartUI() {
  saveCart();
  renderCart();
}

function clearCart() {
  cart.items = [];
  refreshCartUI();
}

// Додавання товару
window.addToCart = function (name, price, event) {
  cart.items.push({ name, price, quantity: 1 });
  refreshCartUI();
  animateToCart(event.target);
};

// Відправка замовлення
window.submitOrder = async function () {
  const customer = {
    name: confirmName.value.trim(),
    phone: phoneInput.value.trim(),
    email: confirmEmail.value.trim(),
    delivery: deliveryMethod.value,
    city: cityInput?.value.trim() || '',
    warehouse: warehouseInput?.value.trim() || '',
    warehouseNumber: warehouseNumber?.value.trim() || '',
    payment: document.getElementById("paymentMethod")?.value || ''
    
  };

  // базова валідація
  if (!customer.name || !customer.phone || !customer.delivery || !customer.payment) {
    alert("Будь ласка, заповніть всі обов'язкові поля");
    return;
  }
  if (cart.items.length === 0) {
    alert("Додайте товари до корзини!");
    return;
  }

  try {
    const res = await fetch("https://shop-my-86on.onrender.com/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.items, customer })
    });

    const text = await res.text();
    console.log("Raw response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Сервер повернув не JSON:", text);
      alert("Сервер повернув невалідну відповідь");
      return;
    }

    if (!data.success) {
      alert(data.message || "Помилка при оформленні");
      return;
    }

    alert(`Замовлення №${data.orderId} оформлено!`);

    // LiqPay — рахуємо total ДО очищення корзини
    const total = cart.items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    if (customer.payment === "liqpay") {
      await handleLiqPay(data.orderId, total);
    }

    // очищення корзини
    clearCart();

    // UI оновлення
    modal.style.display = "none";
    orderSuccess.style.display = "block";
    resetOrderFields();

    setTimeout(() => { orderSuccess.style.display = "none"; }, 9000);

  } catch (err) {
  console.error("Помилка при замовленні:", err.message, err);
  alert("Замовлення оформлено ✅, але виникла помилка з мережею. Очікуйте дзвінок від нашого менеджера 📞");
}
};
// LiqPay
async function handleLiqPay(orderId, total) {
  try {
    const res = await fetch("https://shop-my-86on.onrender.com/api/orders/generate-liqpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total, orderId })
    });

    const { data, signature } = await res.json();
    document.getElementById("liqpayData").value = data;
    document.getElementById("liqpaySignature").value = signature;

    // автоматичний сабміт форми
    document.querySelector("#liqpayForm button").click();
  } catch (err) {
    console.error("Помилка генерації LiqPay:", err.message, err);
    alert("Не вдалося створити платіж");
  }
}

// 🚀 Ініціалізація
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
});
  // 🪟 Модальне вікно корзини
  const closeBtn = modal.querySelector('.close');
  floatingCart.onclick = () => modal.style.display = 'block';
  closeBtn.onclick = () => modal.style.display = 'none';

  window.onclick = function (event) {
    if (event.target === modal || event.target === imageModal) {
      event.target.style.display = 'none';
    }
  };
});

// ✨ Анімація додавання
function animateToCart(button) {
  const fly = document.getElementById('flyEffect');
  const rect = button.getBoundingClientRect();
  const cartIcon = document.getElementById('floatingCart').getBoundingClientRect();

  fly.style.left = `${rect.left}px`;
  fly.style.top = `${rect.top}px`;
  fly.style.display = 'block';
  fly.style.opacity = '1';
  fly.style.transform = `translate(${cartIcon.left - rect.left}px, ${cartIcon.top - rect.top}px) scale(0.5)`;

  setTimeout(() => {
    fly.style.opacity = '0';
    fly.style.transform = 'none';
    fly.style.display = 'none';
  }, 800);

  const floatingCart = document.getElementById('floatingCart');
  floatingCart.classList.add('bounce');
  setTimeout(() => {
    floatingCart.classList.remove('bounce');
  }, 400);
}

function openImageModal(src) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  modalImg.src = src;
  modal.style.display = "flex";
}

function closeImageModal() {
  document.getElementById("imageModal").style.display = "none";
}









 

// Завантажити відділення Нової Пошти
// Показати поля Нової Пошти при виборі доставки

  // Показати поля Нової Пошти при виборі доставки


document.addEventListener("DOMContentLoaded", function () {
  const deliverySelect = document.getElementById("deliveryMethod");
  const npBlock = document.getElementById("npDeliveryOptions");

  if (deliverySelect && npBlock) {
    deliverySelect.addEventListener("change", function () {
      npBlock.style.display = this.value === "nova_poshta" ? "block" : "none";
    });
  }
});
function openCart() {
  document.getElementById("cartModal").style.display = "flex";
  renderCart();

  const deliverySelect = document.getElementById("deliveryMethod");
  if (deliverySelect) {
    deliverySelect.selectedIndex = 0; // вибрати перший варіант ("Оберіть доставку")
  }

  const npBlock = document.getElementById("npDeliveryOptions");
  if (npBlock) {
    npBlock.style.display = "none";
  }
}







// Завантажити список міст
function loadCities() {
  fetch("/api/np/cities")
    .then(res => res.json())
    .then(data => {
      const citySelect = document.getElementById("citySelect");
      citySelect.innerHTML = '<option value="">Оберіть місто</option>';
      data.forEach(city => {
        citySelect.innerHTML += `<option value="${city}">${city}</option>`;
      });
    })
    .catch(err => {
      console.error("Помилка завантаження міст:", err);
    });
}

// Завантажити відділення
document.getElementById("citySelect").addEventListener("change", function () {
  const city = this.value;
  fetch(`/api/np/warehouses?city=${encodeURIComponent(city)}`)
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("warehouseSelect");
      select.innerHTML = '<option value="">Оберіть відділення</option>';
      data.forEach(w => {
        select.innerHTML += `<option value="${w}">${w}</option>`;
      });
    });
});
 

  // 🪟 Модальне вікно корзини
  const modal = document.getElementById("cartModal");
  const closeBtn = modal.querySelector('.close');
  floatingCart.onclick = () => modal.style.display = 'block';
  closeBtn.onclick = () => modal.style.display = 'none';

  window.onclick = function (event) {
    if (event.target === modal || event.target === imageModal) {
      event.target.style.display = 'none';
    }
  };



// ✨ Анімація додавання
function animateToCart(button) {
  const fly = document.getElementById('flyEffect');
  const rect = button.getBoundingClientRect();
  const cartIcon = document.getElementById('floatingCart').getBoundingClientRect();

  fly.style.left = `${rect.left}px`;
  fly.style.top = `${rect.top}px`;
  fly.style.display = 'block';
  fly.style.opacity = '1';
  fly.style.transform = `translate(${cartIcon.left - rect.left}px, ${cartIcon.top - rect.top}px) scale(0.5)`;

  setTimeout(() => {
    fly.style.opacity = '0';
    fly.style.transform = 'none';
    fly.style.display = 'none';
  }, 800);

  const floatingCart = document.getElementById('floatingCart');
  floatingCart.classList.add('bounce');
  setTimeout(() => {
    floatingCart.classList.remove('bounce');
  }, 400);
}

function openImageModal(src) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  modalImg.src = src;
  modal.style.display = "flex";
}

function closeImageModal() {
  document.getElementById("imageModal").style.display = "none";
}

//pri zagruzki loadsities()

document.addEventListener("DOMContentLoaded", function () {
  loadCities();
 
});

  function showContacts() {
    document.getElementById("contacts").style.display = "block";
    document.getElementById("overlay").style.display = "block";
  }

  function hideContacts() {
    document.getElementById("contacts").style.display = "none";
    document.getElementById("overlay").style.display = "none";
  }




document.getElementById("paymentMethod").addEventListener("change", function () {
  const liqpayButton = document.getElementById("liqpayButton");
  liqpayButton.style.display = this.value === "liqpay" ? "inline-block" : "none";
});














