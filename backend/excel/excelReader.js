import path from "path";
import xlsx from "xlsx";

const excelPath = path.join(process.cwd(), "data", "restaurant-data.xlsx");

export function readSheet(sheetName) {
  const workbook = xlsx.readFile(excelPath);
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetName}`);
  }

  return xlsx.utils.sheet_to_json(sheet);
}

export function getMenuData() {
  return readSheet("Menu");
}

export function getSalesData() {
  return readSheet("Sales");
}

export function getRecipesData() {
  return readSheet("Recipes");
}