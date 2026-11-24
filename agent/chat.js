const { getOrders } = require('./orders');
const { getProducts } = require('./products');
const { detectCommand } = require('./commands');

async function askAgent(message) {

  console.log('\n🤖 CHAT ENGINE');
  console.log('💬 USER:', message);

  const cmd =
    detectCommand(message);

  console.log('🎯 COMMAND:', cmd);

  let products =
    await getProducts();

  // прибираємо дублікати

  products = products.filter(
    (product, index, self) =>
      index ===
      self.findIndex(
        p => p.name === product.name
      )
  );

  console.log(
    `🛍️ PRODUCTS LOADED: ${products.length}`
  );

  const text =
    message.toLowerCase();

  // ======================
  // ПРИВІТАННЯ
  // ======================

  if (cmd === 'hello') {

    return {
      answer:
        '👋 Вітаю! Чим можу допомогти?'
    };

  }

  // ======================
  // ДОСТАВКА
  // ======================

  if (cmd === 'delivery') {

    return {
      answer:
        '🚚 Доставка: Нова Пошта, Укрпошта або самовивіз.'
    };

  }

  // ======================
  // ОПЛАТА
  // ======================

  if (cmd === 'payment') {

    return {
      answer:
        '💳 Оплата при отриманні або через LiqPay.'
    };

  }

  // ======================
  // ВІДКРИТИ КОШИК
  // ======================

  if (cmd === 'cart') {

    return {

      action: 'open_cart',

      answer:
        '🛒 Відкриваю кошик.'

    };

  }

  // ======================
  // ОФОРМИТИ ЗАМОВЛЕННЯ
  // ======================

  if (cmd === 'checkout') {

    return {

      action: 'open_checkout',

      answer:
        '✅ Відкриваю форму оформлення замовлення.'

    };

  }

  // ======================
  // ФІЛЬТР ПО ЦІНІ
  // ======================

  const byPrice =
    text.match(/до\s*(\d+)/i);

  if (byPrice) {

    const maxPrice =
      Number(byPrice[1]);

    console.log(
      `💰 PRICE FILTER: ${maxPrice}`
    );

    const filtered =
      products.filter(
        p => p.price <= maxPrice
      );

    console.log(
      `🛍️ FOUND: ${filtered.length}`
    );

    if (!filtered.length) {

      return {
        answer:
          `😔 Товарів до ${maxPrice} грн не знайдено.`
      };

    }

    return {

      answer:
        `💰 Товари до ${maxPrice} грн:<br><br>` +
        filtered
          .map(
            p =>
              `🛍️ ${p.name} — ${p.price} грн`
          )
          .join('<br>')

    };

  }

  // ======================
  // УСІ ТОВАРИ
  // ======================

  if (cmd === 'products') {

    if (!products.length) {

      return {
        answer:
          '😔 Товари не знайдені.'
      };

    }

    return {

      answer:
        products
          .map(
            p =>
              `🛍️ ${p.name} — ${p.price} грн`
          )
          .join('<br>')

    };

  }

  // ======================
  // ПОПУЛЯРНІ ТОВАРИ
  // ======================

  if (cmd === 'popular') {

    const orders =
      await getOrders();

    console.log(
      `📦 ORDERS: ${orders.length}`
    );

    const stats = {};

    orders.forEach(order => {

      if (!order.items) return;

      order.items.forEach(item => {

        stats[item.name] =
          (stats[item.name] || 0) +
          (item.quantity || 1);

      });

    });

    const popular =
      Object.entries(stats)
        .sort(
          (a, b) => b[1] - a[1]
        );

    if (!popular.length) {

      return {
        answer:
          '📦 Продажів поки немає.'
      };

    }

    return {

      answer:
        `🔥 Найпопулярніший товар: ${popular[0][0]} (${popular[0][1]} продажів)`

    };

  }

  // ======================
  // ДОДАТИ В КОШИК
  // ======================

  if (cmd === 'add') {

    const search =
      text
        .replace('додай', '')
        .replace('купити', '')
        .replace('замовити', '')
        .replace('в кошик', '')
        .trim();

    console.log(
      '\n➕ ADD TO CART'
    );

    console.log(
      '🔍 SEARCH:',
      search
    );
if (cmd === 'cart_count') {

  return {
    action: 'cart_count'
  };

}
    // пошук за повною або частковою назвою

    const product =
      products.find(product => {

        const productName =
          product.name.toLowerCase();

        return (
          productName.includes(search) ||
          search.includes(productName) ||

          productName.includes('праска') &&
          search.includes('праск') ||

          productName.includes('пилосос') &&
          search.includes('пилосос') ||

          productName.includes('пральна') &&
          search.includes('машин')
        );

      });

    console.log(
      '📦 PRODUCT:',
      product
    );

    if (!product) {

      return {
        answer:
          `😔 Товар "${search}" не знайдено.`
      };

    }

    return {

      action: 'add_to_cart',

      product,

      answer:
        `✅ ${product.name} додано до кошика.`

    };

  }

  // ======================
  // НЕВІДОМА КОМАНДА
  // ======================

  return {

    answer:
`🤖 Я можу допомогти.

<br><br>

• Покажи товари
<br>
• Товари до 2000
<br>
• Яка доставка
<br>
• Яка оплата
<br>
• Що популярне
<br>
• Додай праску
<br>
• Додай пилосос
<br>
• Відкрити кошик
<br>
• Оформити замовлення`

  };

}

module.exports = {
  askAgent
};