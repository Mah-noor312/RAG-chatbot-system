import { getMenuData } from "../db/mysqlReader.js";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function groupMenuByCategory(menuItems) {
  const grouped = {};

  menuItems.forEach((item) => {
    const category = item.category || "Other";

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(item);
  });

  return grouped;
}

function findMatchingMenuItems(question, menuItems) {
  const q = normalizeText(question);

  const matchedByDish = menuItems.filter((item) => {
    return q.includes(normalizeText(item.dishName));
  });

  if (matchedByDish.length > 0) {
    return matchedByDish;
  }

  const matchedByCategory = menuItems.filter((item) => {
    return q.includes(normalizeText(item.category));
  });

  return matchedByCategory;
}

function buildMenuAnswer(menuItems) {
  if (!menuItems || menuItems.length === 0) {
    return "Menu data was not found.";
  }

  const grouped = groupMenuByCategory(menuItems);

  const lines = Object.entries(grouped).map(([category, items]) => {
    const itemLines = items.map((item, index) => {
      const available = item.available ? ` - ${item.available}` : "";
      return `${index + 1}. ${item.dishName} - ${Number(item.price)}${available}`;
    });

    return `${category}
${itemLines.join("\n")}`;
  });

  return `Here is the menu:

${lines.join("\n\n")}`;
}

export async function getMenuAnswer(question = "") {
  const menuItems = await getMenuData();

  const matchedItems = findMatchingMenuItems(question, menuItems);
  const dataToUse = matchedItems.length > 0 ? matchedItems : menuItems;

  return buildMenuAnswer(dataToUse);
}

export async function getMenuContext(question = "") {
  const menuItems = await getMenuData();

  const matchedItems = findMatchingMenuItems(question, menuItems);
  const dataToUse = matchedItems.length > 0 ? matchedItems : menuItems;

  const lines = dataToUse.map((item) => {
    return `Item ID: ${item.itemId}, Dish: ${item.dishName}, Category: ${item.category}, Price: ${item.price}, Available: ${item.available}`;
  });

  return `
Restaurant Menu Data:
${lines.join("\n")}
`;
}