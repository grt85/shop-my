require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Конфіг з .env =====
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// ===== Middleware =====
app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000'
  ],
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));


app.use(express.static(__dirname));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Вимикаємо кеш для всіх відповідей
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

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
console.log("📂 Шлях до файлу orders.json:", ordersFile);

async function readOrders() {
  try {
    const data = await fs.readFile(ordersFile, 'utf8');
    if (!data.trim()) {
      console.warn("⚠️ Файл orders.json порожній, повертаю []");
      return [];
    }
    const orders = JSON.parse(data);
    if (!Array.isArray(orders)) {
      console.warn("⚠️ Вміст orders.json не є масивом");
      return [];
    }
    console.log("📦 Прочитано замовлень:", orders.length);
    return orders;
  } catch (err) {
    console.error("❌ Помилка читання orders.json:", err);
    return [];
  }
}

async function writeOrders(orders) {
  try {
    await fs.writeFile(ordersFile, JSON.stringify(orders, null, 2), 'utf8');
    console.log("💾 Замовлення збережено у orders.json");
  } catch (err) {
    console.error("❌ Помилка запису orders.json:", err);
  }
}

// Безпечна відправка пошти
async function safeSendMail(options) {
  try {
    await transporter.sendMail(options);
    return true;
  } catch (err) {
    console.error("⚠️ Помилка надсилання email:", err.message);
    return false;
  }
}

// Красивий лог замовлення
function logOrder(order, total, count) {
  // Форматуємо товари
  let itemsText = "Немає даних";
  if (Array.isArray(order.items)) {
    itemsText = order.items.map(i =>
      `🛍️ ${i.name} — ${i.price} грн × ${i.quantity}`
    ).join("\n");
  } else if (typeof order.items === "string") {
    itemsText = order.items;
  }

  console.log(`
🛒 НОВЕ ЗАМОВЛЕННЯ №${order.id}
---------------------------------------------
👤 Ім'я:        ${order.name}
📞 Телефон:    ${order.phone}
📧 Email:      ${order.email || "не вказано"}
📦 Доставка:   ${order.delivery}
🏙️ Місто:      ${order.city || "не вказано"}
🏤 Відділення: ${order.branch || "не вказано"} №${order.branchNumber || "не вказано"}
💳 Оплата:     ${order.payment}
💰 Сума:       ${total} грн
🛍️ Товари:
${itemsText}
🕒 Дата:       ${order.date}
---------------------------------------------
📦 Всього замовлень у базі: ${count}
  `);
}


const axios = require('axios');

// ===== SMS через TurboSMS =====
async function sendSMS(to, text) {
  try {
    const res = await axios.post("https://api.turbosms.ua/message/send.json", {
      sender: "ShopBot",   // ваш підпис відправника
      recipient: to,
      text: text
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.TURBOSMS_TOKEN}`,
        "Content-Type": "application/json"
      }
    });
    console.log("📲 SMS надіслано:", res.data);
    return true;
  } catch (err) {
    console.error("❌ Помилка SMS:", err.message);
    return false;
  }
}

// ===== Viber через Infobip =====
async function sendViber(to, text) {
  try {
    const res = await axios.post("https://api.infobip.com/viber/1/message/text", {
      messages: [{
        from: "ShopBot",   // ім’я відправника
        to: to,
        text: text
      }]
    }, {
      headers: {
        "Authorization": `App ${process.env.VIBER_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    console.log("📲 Viber надіслано:", res.data);
    return true;
  } catch (err) {
    console.error("❌ Помилка Viber:", err.message);
    return false;
  }
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
    console.error('❌ Помилка читання orders.json:', err);
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
  safeSendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `Нове повідомлення від ${name}`,
    text: `Ім'я: ${name}\nEmail: ${email}\nПовідомлення:\n${message}`
  });
  res.status(200).json({ success: true, message: 'Повідомлення отримано!' });
});

// ===== Замовлення =====
app.post('/api/orders', async (req, res) => {
  try {
    const { items, customer } = req.body;

    // Валідація
    if (!items || !Array.isArray(items) || items.length === 0 || !customer?.name || !customer?.phone) {
      return res.status(400).json({ success: false, message: 'Невірні дані замовлення' });
    }

    // 🔧 Спочатку створюємо ID
    const newOrderId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const total = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

    // Формуємо нове замовлення
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
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity || 1,
        photo: i.photo ? i.photo : '/imeiges/логотип для магазину.png'
      })),
      total: `${total} грн`,
      date: new Date().toLocaleString()
    };

    // Запис у файл
    const orders = await readOrders();
    orders.push(newOrder);
    await writeOrders(orders);

    // Лог
    logOrder(newOrder, total, orders.length);

    // Email клієнту
    if (customer.email) {
      safeSendMail({
        from: process.env.EMAIL_USER,
        to: customer.email,
        subject: 'Підтвердження замовлення',
        text: `Ваше замовлення №${newOrderId} на суму ${total} грн прийнято`
      });
    }

    // SMS клієнту
    if (customer.phone) {
      sendSMS(customer.phone, `Ваше замовлення №${newOrderId} на суму ${total} грн прийнято ✅`);
    }

    // Viber клієнту
    if (customer.phone) {
      sendViber(customer.phone, `Ваше замовлення №${newOrderId} на суму ${total} грн прийнято ✅`);
    }

    res.status(200).json({ success: true, orderId: newOrderId });
  } catch (err) {
    console.error("❌ Помилка у /api/orders:", err);
    res.status(500).json({ success: false, message: "Помилка сервера" });
  }
});
// ===== DELETE замовлення =====
app.delete('/admin/orders/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    let orders = await readOrders();
    const index = orders.findIndex(o => o.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    orders.splice(index, 1);
    await writeOrders(orders);

    res.json({ message: "Order deleted" });
  } catch (err) {
    console.error("❌ Помилка у DELETE /admin/orders:", err);
    res.status(500).json({ success: false, message: "Помилка сервера" });
  }
});

// ===== Завантаження файлів =====
const multer = require('multer');

const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

app.post('/upload', upload.single('imeiges'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Файл не завантажено' });
  }

  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`
    }
  });
});

// Віддавати статичні файли з папки uploads
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/imeiges', express.static(path.join(__dirname, 'imeiges')));
// ===== Error handler =====
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Server error" });
});

// 🚀 Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);
});