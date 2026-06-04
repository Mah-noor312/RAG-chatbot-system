import { db } from "../config/db.js";

export async function getMenuData() {
  const [rows] = await db.query(`
    SELECT
      itemId,
      category,
      dishName,
      price,
      available
    FROM menu
    ORDER BY category, itemId
  `);

  return rows;
}

export async function getSalesData() {
  const [rows] = await db.query(`
    SELECT
      saleId,
      DATE_FORMAT(date, '%Y-%m-%d') AS date,
      time,
      itemId,
      dishName,
      quantity,
      unitPrice,
      total,
      paymentMethod,
      tip
    FROM sales
    ORDER BY saleId
  `);

  return rows;
}

export async function getRecipesData() {
  const [rows] = await db.query(`
    SELECT
      dishName,
      ingredient,
      quantity,
      unit,
      instructions
    FROM recipes
    ORDER BY dishName, id
  `);

  return rows;
}