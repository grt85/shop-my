function detectCommand(text) {

  text = text.toLowerCase().trim();

  // ====================
  // ПОПУЛЯРНІ ТОВАРИ
  // ====================

  if (
    text.includes('популяр') ||
    text.includes('найпопуляр') ||
    text.includes('що купують') ||
    text.includes('часто купують') ||
    text.includes('топ продаж')
  ) {
    return 'popular';
  }

  // ====================
  // ДОСТАВКА
  // ====================

  if (
    text.includes('доставка') ||
    text.includes('доставк') ||
    text.includes('нова пошта') ||
    text.includes('укрпошта') ||
    text.includes('самовивіз')
  ) {
    return 'delivery';
  }

  // ====================
  // ОПЛАТА
  // ====================

  if (
    text.includes('оплата') ||
    text.includes('оплат') ||
    text.includes('liqpay') ||
    text.includes('післяплата')
  ) {
    return 'payment';
  }

  // ====================
  // КОШИК
  // ====================

  if (
    text.includes('кошик') ||
    text.includes('відкрити кошик') ||
    text.includes('показати кошик')
  ) {
    return 'cart';
  }

  // ====================
  // ОФОРМЛЕННЯ
  // ====================

  if (
    text.includes('оформити') ||
    text.includes('оформлення') ||
    text.includes('замовлення') ||
    text.includes('допомогти оформити')
  ) {
    return 'checkout';
  }

  // ====================
  // ДОДАТИ В КОШИК
  // ====================

  if (
    text.includes('додай') ||
    text.includes('купити') ||
    text.includes('замовити') ||
    text.includes('в кошик')
  ) {
    return 'add';
  }

  // ====================
  // ТОВАРИ
  // ====================

  if (
    text.includes('товари') ||
    text.includes('товар') ||
    text.includes('каталог') ||
    text.includes('асортимент') ||
    text.includes('показати товари')
  ) {
    return 'products';
  }

  // ====================
  // ПРИВІТАННЯ
  // ====================

  if (
    text.includes('привіт') ||
    text.includes('вітаю') ||
    text.includes('доброго дня') ||
    text.includes('добрий день') ||
    text.includes('добрий вечір')
  ) {
    return 'hello';
  }

  // ====================
  // НЕ ВІДОМО
  // ====================

  return 'unknown';
}

module.exports = {
  detectCommand
};