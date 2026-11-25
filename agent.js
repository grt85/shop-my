// ===== AI AGENT =====

window.addEventListener('load', initAgent);

// =====================
// INIT
// =====================

function initAgent() {

  const agentWidget =
    document.getElementById('agentWidget');

  const agentToggle =
    document.getElementById('agentToggle');

  const agentClose =
    document.getElementById('agentClose');

  const agentSend =
    document.getElementById('agentSend');

  const agentInput =
    document.getElementById('agentInput');

  const messagesBox =
    document.getElementById('agentMessages');

  if (
    !agentWidget ||
    !agentToggle ||
    !agentClose ||
    !agentSend ||
    !agentInput ||
    !messagesBox
  ) {
    console.error(
      'Agent elements not found'
    );

    return;
  }

  addAgentMessage(`
    👋 Вітаю!

    <br><br>

    Я консультант магазину.

    <br><br>

    Можу:

    <br>• показати товари
    <br>• знайти популярні товари
    <br>• підказати доставку
    <br>• підказати оплату
    <br>• допомогти оформити замовлення

    <br><br>

    Спробуйте написати:

    <br>• Покажи товари
    <br>• Товари до 2000
    <br>• Що популярне
    <br>• Додай пилосос
    <br>• Відкрити кошик
    <br>• Оформити замовлення
  `);

  agentToggle.addEventListener(
    'click',
    () => {

      agentWidget.style.display =
        'flex';

      messagesBox.scrollTop =
        messagesBox.scrollHeight;

    }
  );

  agentClose.addEventListener(
    'click',
    () => {

      agentWidget.style.display =
        'none';

    }
  );

  agentSend.addEventListener(
    'click',
    sendAgentMessage
  );

  agentInput.addEventListener(
    'keydown',
    (e) => {

      if (e.key === 'Enter') {

        e.preventDefault();

        sendAgentMessage();

      }

    }
  );

}

// =====================
// MESSAGES
// =====================

function addAgentMessage(text) {

  const box =
    document.getElementById(
      'agentMessages'
    );

  if (!box) return;

  const div =
    document.createElement('div');

  div.className =
    'agent-message';

  div.innerHTML = text;

  box.appendChild(div);

  scrollMessages();

}

function addUserMessage(text) {

  const box =
    document.getElementById(
      'agentMessages'
    );

  if (!box) return;

  const div =
    document.createElement('div');

  div.className =
    'user-message';

  div.textContent = text;

  box.appendChild(div);

  scrollMessages();

}

function scrollMessages() {

  const box =
    document.getElementById(
      'agentMessages'
    );

  if (!box) return;

  box.scrollTop =
    box.scrollHeight;

}

// =====================
// ACTIONS
// =====================

function openCart() {

  const cartModal =
    document.getElementById(
      'cartModal'
    );

  if (!cartModal) return;

  cartModal.style.display =
    'flex';

}

function openCheckout() {

  openCart();

  setTimeout(() => {

    const input =
      document.getElementById(
        'confirmName'
      );

    if (input) {

      input.focus();

    }

  }, 300);

}

function addProductToCart(product) {

  if (
    typeof window.cart ===
      'undefined' ||
    !Array.isArray(
      window.cart.items
    )
  ) {

    console.error(
      '❌ window.cart not found'
    );

    return;

  }

  const existing =
    window.cart.items.find(
      item =>
        item.name === product.name
    );

  if (existing) {

    existing.quantity += 1;

  } else {

    window.cart.items.push({
      id:
        product.id ||
        Date.now().toString(),

      name:
        product.name,

      price:
        product.price,

      quantity: 1,

      photo:
        product.photo ||
        'imeiges/логотип для магазину.png'
    });

  }

  if (
    typeof window.refreshCartUI ===
    'function'
  ) {

    window.refreshCartUI();

  }

  if (
    typeof window.saveCart ===
    'function'
  ) {

    window.saveCart();

  }

  console.log(
    '✅ Added by agent'
  );

}

// =====================
// SEND MESSAGE
// =====================

async function sendAgentMessage() {

  const input =
    document.getElementById(
      'agentInput'
    );

  if (!input) return;

  const message =
    input.value.trim();

  if (!message) return;

  addUserMessage(message);

  input.value = '';

  try {

    const response =
      await fetch(
        'https://shop-my-86on.onrender.com/api/chat',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            message
          })
        }
      );

    if (!response.ok) {

      addAgentMessage(
        '⚠️ Сервер повернув помилку.'
      );

      return;

    }

    const data =
      await response.json();

    console.log(
      '🤖 AGENT DATA:',
      data
    );

    switch (data.action) {

      case 'open_cart':

        console.log(
          '🛒 OPEN CART'
        );

        openCart();

        break;

      case 'open_checkout':

        console.log(
          '✅ OPEN CHECKOUT'
        );

        openCheckout();

        break;

      case 'add_to_cart':

        console.log(
          '➕ ADD TO CART',
          data.product
        );

        if (data.product) {

          addProductToCart(
            data.product
          );

        }

        break;

      default:
        break;

    }

    addAgentMessage(
      data.answer ||
      '🤖 Немає відповіді.'
    );

  } catch (error) {

    console.error(
      'AGENT ERROR:',
      error
    );

    addAgentMessage(
      '⚠️ Не вдалося підключитися до консультанта.'
    );

  }

}
