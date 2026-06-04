import { getMenuContext } from "./menuService.js";
import { getRecipeContext } from "./recipeService.js";
import { getSalesContext } from "./salesService.js";
import { getSpecialityContext } from "./specialityService.js";

function hasAnyWord(question, words) {
  const q = question.toLowerCase();

  return words.some((word) => q.includes(word));
}

export async function getRestaurantContext(question) {
  const contexts = [];

  const salesWords = [
    "sale",
    "sales",
    "sold",
    "revenue",
    "earning",
    "income",
    "quantity",
    "record",
    "records",
    "transaction",
    "transactions",
    "sale id",
    "saleid",
    "sale number",
    "new sales",
    "latest sales",
    "recent sales",
    "din pehle",
    "days ago",
    "today",
    "aaj",
    "yesterday",
    "kal",
    "month",
    "monthly",
    "date",
    "dates",
    "cash",
    "card",
  ];

  const menuWords = [
    "menu",
    "price",
    "cost",
    "available",
    "availability",
    "dish",
    "dishes",
    "item",
    "items",
    "dessert",
    "desserts",
    "drink",
    "drinks",
    "burger",
    "pizza",
    "rice",
    "desi",
    "bread",
    "snack",
    "snacks",
    "sandwich",
    "hot drinks",
  ];

  const recipeWords = [
    "recipe",
    "ingredient",
    "ingredients",
    "make",
    "cook",
    "banane",
    "banani",
    "kaise banti",
  ];

  const specialityWords = [
    "speciality",
    "specialty",
    "popular",
    "best item",
    "best dish",
    "recommended",
    "recommend",
    "famous",
    "top item",
    "top dish",
    "most sold",
    "after that",
    "next",
    "second",
    "third",
    "ranking",
    "rank",
  ];

  if (hasAnyWord(question, specialityWords)) {
    contexts.push(await getSpecialityContext());
  }

  if (hasAnyWord(question, salesWords)) {
    contexts.push(await getSalesContext(question));
  }

  if (hasAnyWord(question, recipeWords)) {
    contexts.push(await getRecipeContext(question));
  }

  if (hasAnyWord(question, menuWords)) {
    contexts.push(await getMenuContext(question));
  }

  return contexts.join("\n\n");
}