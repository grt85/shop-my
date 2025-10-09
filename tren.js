document.addEventListener("DOMContentLoaded", function () {
  const phoneInput = document.getElementById("confirmPhone");
  const confirmEmail = document.getElementById("confirmEmail");
  const confirmName = document.getElementById("confirmName");
  const deliveryMethod = document.getElementById("deliveryMethod");
  const citySelect = document.getElementById("citySelect");
  const warehouseSelect = document.getElementById("warehouseSelect");
  const warehouseNumber = document.getElementById("warehouseNumber");
  const npBlock = document.getElementById("npDeliveryOptions");
  const cartCount = document.getElementById("cartCount");
  const cartItemsModal = document.getElementById("cartItemsModal");
  const totalPriceModal = document.getElementById("totalPriceModal");
  const floatingCart = document.getElementById("floatingCart");
  const modal = document.getElementById("cartModal");
  const imageModal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");

  const cart = {
    items: [],
    customer: {
      name: "",
      phone: "",
      delivery: "",
      email: "",
      city: "",
      warehouse: "",
      warehouseNumber: ""
    }
  };

  // 📱 Маска телефону
  phoneInput.addEventListener("beforeinput", function (e) {
    const isDigit = /^[0-9]$/.test(e.data);
    const isDelete = e.inputType.includes("delete");
    const isPaste = e.inputType === "insertFromPaste";
    let digits = phoneInput.value.replace(/\D/g, "");
    if (digits.startsWith("38")) digits = digits.slice(2);
    if (!isDigit && !isDelete && !isPaste) e.preventDefault();
    if (isDigit && digits.length >= 10) e.preventDefault();
  });

  phoneInput.addEventListener("input", function () {
    let digits = phoneInput.value.replace(/\D/g, "");
    if (digits.startsWith("38")) digits = digits.slice(2);
    digits = digits.slice(0, 10);
    let formatted = "+38 ";
    if (digits.length > 0) formatted += "(" + digits.slice(0, 3);
    if (digits.length >= 3) formatted += ") " + digits.slice(3, 6);
    if (digits.length >= 6) formatted += "-" + digits.slice(6, 8);
    if (digits.length >= 8) formatted += "-" + digits.slice(8, 10);
    phoneInput.value = formatted;
    phoneInput.dataset.raw = digits;
  });

  confirmEmail.addEventListener("input", () => {
    confirmEmail.style.borderColor = "";
    confirmEmail.style.boxShadow = "";
  });

  // 📦 Показати/сховати блок Нової Пошти
  deliveryMethod.addEventListener("change", function () {
    npBlock.style.display = this.value === "nova_poshta" ? "block" : "none";
  });

  // 🏙️ Завантажити міста
  function loadCities() {
    fetch("https://api.novaposhta.ua/v2.0/json/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: "ВАШ_API_КЛЮЧ",
        modelName: "Address",
        calledMethod: "getCities",
        methodProperties: {}
      })
    })
      .then((res) => res.json())
      .then((data) => {
        citySelect.innerHTML = '<option value="">Оберіть місто</option>';
        data.data.forEach((city) => {
          citySelect.innerHTML += `<option value="${city.Description}">${city.Description}</option>`;
        });
      })
      .catch((err) => {
        console.error("Помилка завантаження міст:", err);
      });
  }

  // 🏤 Завантажити відділення
  citySelect.addEventListener("change", function () {
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
      .then((res) => res.json())
      .then((data) => {
        warehouseSelect.innerHTML = '<option value="">Оберіть відділення</option>';
        data.data.forEach((w) => {
          warehouseSelect.innerHTML += `<option value="${w.Description}">${w.Description}</option>`;
        });
      });
  });

  // 🛒 Робота з корзиною
  function saveCart() {
    cart.customer.warehouseNumber = warehouseNumber.value.trim();
    localStorage.setItem("cart", JSON.stringify(cart));
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
  }

  function updateCartCount() {
    cartCount.textContent = cart.items.length;
  }

  function renderCart() {
    cartItemsModal.innerHTML = "";
    let total = 0;
    cart.items.forEach((item, index) => {
      const li = document.createElement("li");
      li.textContent = `${item.name} — ${item.price} грн`;
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Видалити";
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

  // 🪟 Модальне вікно корзини
  const closeBtn = modal.querySelector(".close");
  floatingCart.onclick = () => (modal.style.display = "block");
  closeBtn.onclick = () => (modal.style.display = "none");
  window.onclick = function (event) {
    if (event.target === modal || event.target === imageModal) {
      event.target.style.display = "none";
    }
  };

  // ✨ Анімація додавання
  function animateToCart(button) {
    const fly = document.getElementById("flyEffect");
    const rect = button.getBoundingClientRect();
    const cartIcon = floatingCart.getBoundingClientRect();
    fly.style.left = `${rect.left}px`;
    fly.style.top = `${rect.top}px`;
    fly.style.display = "block";
    fly.style.opacity = "1";
    fly.style.transform = `translate(${cartIcon.left - rect.left}px, ${cartIcon.top - rect.top}px) scale(0.5)`;
    setTimeout(() => {
      fly.style.opacity = "0";
      fly.style.transform = "none";
      fly.style.display = "none";
    }, 800);
    floatingCart.classList.add("bounce");
    setTimeout(() => {
      floatingCart.classList.remove("bounce");
    }, 400);
  }

  // 🖼️ Модальне зображення
  window.openImageModal = function (src) {
    modalImg.src = src;
    imageModal.style.display = "flex";
  };
  window.closeImageModal = function () {
    imageModal.style.display = "none";
  };

  // 📞 Контакти
  window.showContacts = function () {
    document.getElementById("contacts").style.display = "block";
    document.getElementById("overlay").style.display = "block";
  };
  window.hideContacts = function () {
    document.getElementById("contacts").style.display = "none";
    document.getElementById("overlay").style.display = "none";
  };

  // ⏳ Старт
  loadCities();
  loadCart();
  renderCart();
});