const fs = require('fs').promises;
const path = require('path');

async function getProducts() {

  const files = [
    'index.html',
    'products.html'
  ];

  const products = [];

  for (const file of files) {

    try {

      const html = await fs.readFile(
        path.join(__dirname, '..', file),
        'utf8'
      );

      const regex =
        /<h3>(.*?)<\/h3>[\s\S]*?Ціна:\s*([\d\s]+)\s*грн/gi;

      let match;

      while ((match = regex.exec(html))) {

        products.push({
          id: products.length + 1,
          name: match[1].trim(),
          price: Number(
            match[2].replace(/\s/g, '')
          )
        });

      }

    } catch (err) {

      console.log(
        `⚠️ Файл ${file} не знайдено`
      );

    }

  }

  return products;
}

module.exports = {
  getProducts
};