const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});






// Налаштування Nodemailer
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Пароль є' : '❌ Пароль не знайдено');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // или 587
  secure: true, // true для 465, false для 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  
});

app.get('/test-email', (req, res) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'Тестове повідомлення',
    text: 'Це тестове повідомлення для перевірки надсилання email через Nodemailer.'
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('❌ Помилка надсилання тестового email:', error);
      return res.status(500).send('Помилка надсилання email');
    } else {
      console.log('✅ Тестовий email надіслано:', info.response);
      return res.send('Тестовий email успішно надіслано!');
    }
  });
});





app.use(cors());
app.use(bodyParser.json());

// 📩 Обробка контактної форми
app.post('/api/contact', (req, res) => {
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

  fs.appendFile(path.join(__dirname, 'messages.txt'), logEntry, (err) => {
    if (err) {
      console.error('Помилка запису повідомлення:', err);
    } else {
      console.log('Повідомлення збережено в messages.txt');
    }
  });

  const mailOptions = {
    from: 'fffvladimir952@gmail.com',
    to: 'fffvladimir952@gmail.com',
    subject: `Нове повідомлення від ${name}`,
    text: `Ім'я: ${name}\nEmail: ${email}\nПовідомлення:\n${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Помилка надсилання email:', error);
    } else {
      console.log('Email надіслано:', info.response);
    }
  });

  res.status(200).json({ success: true, message: 'Повідомлення отримано!' });
});

// 🛒 Обробка замовлення
app.post('/api/order', (req, res) => {
  console.log('Отримано запит на замовлення:', req.body);

  const { items, customer } = req.body;

  if (
    !items || !Array.isArray(items) || items.length === 0 ||
    !customer || !customer.name || !customer.phone
  ) {
    console.error('Невірні дані замовлення');
    return res.status(400).json({ success: false, message: 'Невірні дані замовлення' });
  }

  const newOrderId = Date.now(); // ✅ створюємо ID
  const email = customer.email || '';
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const itemList = items.map(item => `• ${item.name} — ${item.price} грн`).join('\n');

  const orderLog = `
===========================
Дата: ${new Date().toLocaleString()}
Ім'я: ${customer.name}
Телефон: ${customer.phone}
Email: ${email || 'не вказано'}
Доставка: ${customer.delivery}
Товари:
${itemList}
Ітого: ${total} грн
===========================\n`;

  fs.appendFile(path.join(__dirname, 'order.txt'), orderLog, (err) => {
    if (err) {
      console.error('Помилка запису замовлення:', err);
      return res.status(500).json({ success: false, message: 'Помилка запису замовлення' });
    }

    console.log('Замовлення збережено в order.txt');

     

    // ✅ Надсилаємо email, якщо є
    if (email) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Підтвердження замовлення',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Привіт, ${customer.name}!</h2>
            <p>Ми отримали ваше замовлення. Ось його деталі:</p>
            <ul style="padding-left: 20px;">
              ${items.map(item => `<li>${item.name} — <strong>${item.price} грн</strong></li>`).join('')}
            </ul>
            <p><strong>Ітого: ${total} грн</strong></p>
            <hr />
            <p style="font-size: 12px; color: #777;">Цей лист сформовано автоматично. Якщо у вас є питання — відповідайте на нього.</p>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Помилка надсилання підтвердження:', error);
        } else {
          console.log('Підтвердження надіслано:', info.response);
        }
      });


    }
const adminMailOptions = {
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER, // твоя пошта
  subject: `Нове замовлення від ${customer.name}`,
  text: `
Нове замовлення оформлено!

Ім'я: ${customer.name}
Телефон: ${customer.phone}
Email: ${email || 'не вказано'}
Доставка: ${customer.delivery}
Товари:
${itemList}

Ітого: ${total} грн
`
};

transporter.sendMail(adminMailOptions, (error, info) => {
  if (error) {
    console.error('❌ Помилка надсилання адміністратору:', error);
  } else {
    console.log('✅ Лист адміністратору надіслано:', info.response);
  }

});


  });
// ✅ Відповідаємо клієнту
    res.status(200).json({ success: true, orderId: newOrderId });
});

// 📂 Перегляд повідомлень
app.get('/admin/messages', (req, res) => {
  fs.readFile(path.join(__dirname, 'messages.txt'), 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Помилка читання messages.txt');
    }
    res.send(`<pre>${data}</pre>`);
  });
});

// 📂 Перегляд замовлень
app.get('/admin/orders', (req, res) => {
  fs.readFile(path.join(__dirname, 'order.txt'), 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Помилка читання order.txt');
    }
    res.send(`<pre>${data}</pre>`);
  });
});


const crypto = require('crypto');




app.use(express.static(__dirname)); // или путь к папке с HTML и script.js
app.use(bodyParser.json());

app.post('/generate-liqpay', (req, res) => {
  const { amount, orderId } = req.body;

  const public_key = 'your_public_key';
  const private_key = 'your_private_key';

  const payment = {
    version: '3',
    public_key,
    action: 'pay',
    amount,
    currency: 'UAH',
    description: `Оплата замовлення №${orderId}`,
    order_id: `order_${orderId}`,
    language: 'uk'
  };

  const data = Buffer.from(JSON.stringify(payment)).toString('base64');
  const signature = Buffer.from(
    crypto.createHash('sha1').update(private_key + data + private_key).digest()
  ).toString('base64');

  res.json({ data, signature });
});





app.listen(PORT, () => {
  console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);
});

















