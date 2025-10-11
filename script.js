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

    fetch('http://localhost:3000/api/contact',{

 
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
  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

 function loadCart() {
  const saved = localStorage.getItem("cart");
  if (saved) {
    const parsed = JSON.parse(saved);
    cart.items = parsed.items || [];
    cart.customer = parsed.customer || {};
  }
  confirmName.value = cart.customer.name || "";
  phoneInput.value = cart.customer.phone || "";
  deliveryMethod.value = cart.customer.delivery || "";
  confirmEmail.value = cart.customer.email || "";
  warehouseNumber.value = cart.customer.warehouseNumber || "";

  // Примусово оновлюємо маску телефону
  const event = new Event('input', { bubbles: true });
  phoneInput.dispatchEvent(event);
}

  function updateCartCount() {
    cartCount.textContent = cart.items.length;
  }

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
        saveCart();
        renderCart();
      };

      li.appendChild(removeBtn);
      cartItemsModal.appendChild(li);
      total += item.price;
    });

    totalPriceModal.textContent = `Ітого: ${total} грн`;
    updateCartCount();
  }

  window.addToCart = function (name, price, event) {
    cart.items.push({ name, price });
    saveCart();
    renderCart();
    animateToCart(event.target);
  };

   window.submitOrder = function () {
  const name = confirmName.value.trim();
  const phone = phoneInput.value.trim();
  const delivery = deliveryMethod.value;
  const email = confirmEmail.value.trim();
  const city = document.getElementById("citySelect")?.value || '';
  const warehouse = document.getElementById("warehouseSelect")?.value || '';
  const warehouseNumber = document.getElementById("warehouseNumber")?.value.trim() || '';
  const phoneDigits = phoneInput.dataset.raw || phone.replace(/\D/g, '');
 const event = new Event('input', { bubbles: true });
phoneInput.dispatchEvent(event);

  function highlightInvalid(input) {
    input.style.borderColor = 'red';
    input.style.boxShadow = '0 0 5px rgba(255,0,0,0.5)';
  }

  function clearHighlight(input) {
    input.style.borderColor = '';
    input.style.boxShadow = '';
  }

  let valid = true;
  clearHighlight(confirmName);
  clearHighlight(phoneInput);
  clearHighlight(confirmEmail);
  clearHighlight(deliveryMethod);

  if (!name) {
    highlightInvalid(confirmName);
    valid = false;
  }

  if (phoneDigits.length !== 10) {
    highlightInvalid(phoneInput);
    valid = false;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    highlightInvalid(confirmEmail);
    alert('Введіть коректну електронну адресу (наприклад: name@example.com)');
    valid = false;
  }

  if (!delivery) {
    highlightInvalid(deliveryMethod);
    valid = false;
  }

  if (delivery === "nova_poshta" && (!city || !warehouse)) {
    alert("Оберіть місто та відділення Нової Пошти.");
    valid = false;
  }

  if (!valid) {
    alert('Будь ласка, заповніть поля коректно.');
    return;
  }

  if (cart.items.length === 0) {
    alert('Додайте товари до корзини!');
    return;
  }

  cart.customer = {
    name,
    phone,
    delivery,
    email,
    city,
    warehouse,
    warehouseNumber
  };

  saveCart();

  fetch('https://shop-my-86on.onrender.com/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cart)
  })
    .then(res => {
      if (!res.ok) throw new Error('Помилка при оформленні');
      return res.json();
    })
    .then(data => {
      alert(`Замовлення №${data.orderId || 'без номера'} оформлено!`);
      const total = cart.items.reduce((sum, item) => sum + item.price, 0);

      fetch('http://localhost:3000/generate-liqpay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: total, orderId: data.orderId })
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


      cart.items = [];
      saveCart();
      renderCart();
      modal.style.display = 'none';
      orderSuccess.style.display = 'block';
      setTimeout(() => {
        orderSuccess.style.display = 'none';
      }, 5000);
    })
    .catch(err => {
      console.error('Помилка при замовленні:', err);
      alert('Помилка при відправці замовлення');
    });
};
  loadCart();
  renderCart();

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









// Показати поля Нової Пошти при виборі доставки
document.getElementById("deliveryMethod").addEventListener("change", function () {
  const npBlock = document.getElementById("npDeliveryOptions");
  npBlock.style.display = this.value === "nova_poshta" ? "block" : "none";
});

// Завантажити відділення Нової Пошти
document.getElementById("citySelect").addEventListener("change", function () {
  const city = this.value;
  fetch("https://api.novaposhta.ua/v2.0/json/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: "ВАШ_API_КЛЮЧ",
      modelName: "Address",
      calledMethod: "getWarehouses",
      methodProperties: { CityName: city }
    })
  })
  .then(res => res.json())
  .then(data => {
    const select = document.getElementById("warehouseSelect");
    select.innerHTML = '<option value="">Оберіть відділення</option>';
    data.data.forEach(w => {
      select.innerHTML += `<option value="${w.Description}">${w.Description}</option>`;
    });
  });
});

const apiKey = "ВАШ_API_КЛЮЧ"; // заміни на свій ключ

function loadCities() {
  fetch("https://api.novaposhta.ua/v2.0/json/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: apiKey,
      modelName: "Address",
      calledMethod: "getCities",
      methodProperties: {}
    })
  })
    .then(res => res.json())
    .then(data => {
      const citySelect = document.getElementById("citySelect");
      citySelect.innerHTML = '<option value="">Оберіть місто</option>';
      data.data.forEach(city => {
        citySelect.innerHTML += `<option value="${city.Description}">${city.Description}</option>`;
      });
    })
    .catch(err => {
      console.error("Помилка завантаження міст:", err);
    });
const warehouseNumber = document.getElementById("warehouseNumber").value.trim();
cart.customer.warehouseNumber = warehouseNumber;
  }


 

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

















