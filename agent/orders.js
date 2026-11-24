const fs = require('fs').promises;
const path = require('path');

const ordersFile =
  path.join(__dirname, '../orders.json');

async function getOrders() {

  try {

    const data =
      await fs.readFile(
        ordersFile,
        'utf8'
      );

    return JSON.parse(data);

  } catch {

    return [];

  }

}

module.exports = {
  getOrders
};