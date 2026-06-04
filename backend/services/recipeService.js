import { getRecipesData } from "../db/mysqlReader.js";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function findDishNameFromQuestion(question, recipes) {
  const q = normalizeText(question);

  const dishNames = [
    ...new Set(
      recipes
        .map((recipe) => recipe.dishName)
        .filter(Boolean)
        .map((dishName) => String(dishName).trim())
    ),
  ];

  const sortedDishNames = dishNames.sort((a, b) => {
    return normalizeText(b).length - normalizeText(a).length;
  });

  return sortedDishNames.find((dishName) => {
    return q.includes(normalizeText(dishName));
  });
}

function buildRecipeAnswer(dishName, recipes) {
  if (!dishName || !recipes || recipes.length === 0) {
    return "Recipe was not found in the provided restaurant data.";
  }

  const ingredientLines = recipes.map((recipe, index) => {
    return `${index + 1}. ${recipe.ingredient} - ${recipe.quantity} ${recipe.unit}`;
  });

  const instructionLines = recipes.map((recipe, index) => {
    return `${index + 1}. ${recipe.instructions}`;
  });

  return `Recipe for ${dishName}:

Ingredients:
${ingredientLines.join("\n")}

Instructions:
${instructionLines.join("\n")}`;
}

export async function getRecipeAnswer(question) {
  const recipes = await getRecipesData();

  const dishName = findDishNameFromQuestion(question, recipes);

  if (!dishName) {
    return "Recipe was not found in the provided restaurant data.";
  }

  const matchedRecipes = recipes.filter((recipe) => {
    return normalizeText(recipe.dishName) === normalizeText(dishName);
  });

  return buildRecipeAnswer(dishName, matchedRecipes);
}

export async function getRecipeContext(question) {
  const recipes = await getRecipesData();

  const dishName = findDishNameFromQuestion(question, recipes);

  const dataToUse = dishName
    ? recipes.filter((recipe) => {
        return normalizeText(recipe.dishName) === normalizeText(dishName);
      })
    : recipes;

  const lines = dataToUse.map((recipe) => {
    return `Dish: ${recipe.dishName}, Ingredient: ${recipe.ingredient}, Quantity: ${recipe.quantity} ${recipe.unit}, Instructions: ${recipe.instructions}`;
  });

  return `
Restaurant Recipe Data:
${lines.join("\n")}
`;
}