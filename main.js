import { cart, saveCart, loadCart, addToCart, clearCart } from './cart.js';

document.addEventListener('DOMContentLoaded', function () {
  loadCart();

  // Пример использования
  window.addToCart = function (name, price, event) {
    addToCart(name, price);
    renderCart();
    animateToCart(event.target);
  };

  window.submitOrder = function () {
    const name = document.getElementById('confirmName').value.trim();
    const phone = document.getElementById('confirmPhone').value.trim();
    const delivery = document.getElementById('deliveryMethod').value;
    const email = document.getElementById('confirmEmail').value.trim();
    const phoneDigits = phone.replace(/\D/g, '');

    if (!name || phoneDigits.length !== 10 || cart.items.length === 0) {
      alert('Проверьте данные и корзину!');
      return;
    }

    cart.customer = { name, phone, delivery, email };
    saveCart();

    fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cart)
    })
      .then(res => res.json())
      .then(data => {
        alert(`Заказ №${data.orderId || 'без номера'} оформлен!`);
        clearCart();
        renderCart();
      })
      .catch(err => {
        console.error(err);
        alert('Ошибка при заказе');
      });
  };

  // Остальная логика: renderCart, animateToCart и т.д.
});