import { getSalesData } from "../db/mysqlReader.js";

function getNumber(value) {
  const cleanedValue = String(value || "")
    .replace(/,/g, "")
    .trim();

  const num = Number(cleanedValue);

  return Number.isNaN(num) ? 0 : num;
}

function getSaleRevenue(sale) {
  const quantity = getNumber(sale.quantity);
  const unitPrice = getNumber(sale.unitPrice);

  return quantity * unitPrice;
}

function summarizeItems(sales) {
  const summary = {};

  sales.forEach((sale) => {
    const dishName = String(sale.dishName || "Unknown Item").trim();

    if (!summary[dishName]) {
      summary[dishName] = {
        quantity: 0,
        revenue: 0,
      };
    }

    summary[dishName].quantity += getNumber(sale.quantity);
    summary[dishName].revenue += getSaleRevenue(sale);
  });

  return Object.entries(summary).map(([dishName, data]) => {
    return {
      dishName,
      quantity: data.quantity,
      revenue: data.revenue,
    };
  });
}

export async function getSpecialityAnswer() {
  const sales = await getSalesData();

  if (!sales || sales.length === 0) {
    return "Speciality data was not found in the restaurant sales data.";
  }

  const itemSummary = summarizeItems(sales);

  const mostSoldItems = [...itemSummary]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);

  const highestRevenueItems = [...itemSummary]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  const mostSoldLines = mostSoldItems.map((item, index) => {
    return `${index + 1}. ${item.dishName} - ${item.quantity} units sold`;
  });

  const revenueLines = highestRevenueItems.map((item, index) => {
    return `${index + 1}. ${item.dishName} - revenue ${item.revenue}`;
  });

  return `Our speciality is based on restaurant sales data.

Most Sold Items:
${mostSoldLines.join("\n")}

Highest Revenue Items:
${revenueLines.join("\n")}`;
}

export async function getSpecialityContext() {
  return await getSpecialityAnswer();
}