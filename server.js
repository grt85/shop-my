require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
let orders = [
 // { id:  name: "Іван", phone: "123456789", items: "Ноутбук", total: 15000, date: "2025-11-25" },
  //{ id:  name: "Олена", phone: "987654321", items: "Телефон", total: 8000, date: "2025-11-24" }
];
// ===== Конфіг з .env =====
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// ===== Middleware =====
app.use(cors({
  origin: ['http://127.0.0.1:5500','https://shop-my-86on.onrender.com','http://localhost:3000'],
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ===== Nodemailer =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===== Helpers =====
const ordersFile = path.join(__dirname, 'orders.json');

async function readOrders() {
  try {
    const data = await fs.readFile(ordersFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeOrders(orders) {
  await fs.writeFile(ordersFile, JSON.stringify(orders, null, 2));
}

// ===== Авторизація =====
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Немає токена' });

  const token = authHeader.split(' ')[1];
  if (token === ADMIN_TOKEN) return next();

  return res.status(403).json({ error: 'Доступ заборонено' });
}
// ===== Авторизація адміна =====
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ token: ADMIN_TOKEN });
  }

  res.status(401).json({ error: 'Невірний логін або пароль' });
});
// ===== Маршрут для адмінки =====
app.get('/admin/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await readOrders();
    res.json(orders);
  } catch (err) {
    console.error('Помилка читання orders.json:', err);
    res.status(500).json({ error: 'Помилка читання orders.json' });
  }
});

// ===== Контактна форма =====
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Всі поля обов’язкові' });
  }

  const logEntry = `
===========================
Дата: ${new Date().toLocaleString()}
Ім'я: ${name}
Email: ${email}
Повідомлення: ${message}
===========================\n`;

  try {
    await fs.appendFile(path.join(__dirname, 'messages.txt'), logEntry);
    console.log(`✉️ Нове повідомлення від ${name} (${email}): ${message}`);
  } catch (err) {
    console.error('Помилка запису повідомлення:', err);
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Нове повідомлення від ${name}`,
      text: `Ім'я: ${name}\nEmail: ${email}\nПовідомлення:\n${message}`
    });
  } catch (err) {
    console.error('Помилка надсилання email:', err);
  }

  res.status(200).json({ success: true, message: 'Повідомлення отримано!' });
});

// ===== Замовлення =====
app.post('/api/orders', async (req, res) => {
  const { items, customer } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0 || !customer?.name || !customer?.phone) {
    return res.status(400).json({ success: false, message: 'Невірні дані замовлення' });
  }

  const newOrderId = Date.now();
  const total = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  const newOrder = {
    id: newOrderId,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || 'не вказано',
    delivery: customer.delivery || 'не вказано',
    city: customer.city || 'не вказано',
    branch: customer.warehouse || 'не вказано',
    branchNumber: customer.warehouseNumber || 'не вказано',
    payment: customer.payment || 'не вказано',
    items: items.map(i => `${i.name} — ${i.price} грн × ${i.quantity || 1}`).join(', '),
    total: `${total} грн`,
    date: new Date().toLocaleString(),
    photo: 'https://via.placeholder.com/80'
  };

  try {
    const orders = await readOrders();
    orders.push(newOrder);
    await writeOrders(orders);

    console.log(`
🛒 НОВЕ ЗАМОВЛЕННЯ №${newOrderId}
Ім'я: ${newOrder.name}
Телефон: ${newOrder.phone}
Email: ${newOrder.email}
Доставка: ${newOrder.delivery}
Місто: ${newOrder.city}
Відділення: ${newOrder.branch} №${newOrder.branchNumber}
Оплата: ${newOrder.payment}
Сума: ${total} грн
Товари: ${newOrder.items}
Дата: ${newOrder.date}
---------------------------------------------
📦 Всього замовлень у базі: ${orders.length}
    `);

  } catch (err) {
    console.error("Помилка запису orders.json:", err);
  }

  // Email клієнту
  try {
    if (customer.email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: customer.email,
        subject: 'Підтвердження замовлення',
        text: `Ваше замовлення №${newOrderId} на суму ${total} грн прийнято`
      });
    }
  } catch (err) {
    console.error("Помилка надсилання email клієнту:", err);
  }

  // Email адміністратору
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Нове замовлення від ${customer.name}`,
      text: `Замовлення №${newOrderId} на суму ${total} грн`
    });
  } catch (err) {
    console.error("Помилка надсилання адміністратору:", err);
  }

  res.status(200).json({ success: true, orderId: newOrderId });
});



// ===== GET всі замовлення =====
app.get('/admin/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await readOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Помилка читання orders.json" });
  }
});

// ===== PUT оновлення замовлення =====
app.put('/admin/orders/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  let orders = await readOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: "Order not found" });

  orders[index] = { ...orders[index], ...req.body };
  await writeOrders(orders);
  res.json({ message: "Order updated", order: orders[index] });
});

// ===== DELETE видалення замовлення =====
app.delete('/admin/orders/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  let orders = await readOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ error: "Order not found" });

  orders.splice(index, 1);
  await writeOrders(orders);
  res.json({ message: "Order deleted" });
});









// 🚀 Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);

});
