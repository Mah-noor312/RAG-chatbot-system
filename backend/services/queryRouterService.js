export function detectQueryType(question) {
  const q = String(question || "").toLowerCase();

  const monthRegex =
    /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\b/;

  const hasMonth = monthRegex.test(q);
  const hasYear = /\b20\d{2}\b/.test(q);

  const hasDateRange =
    /\d{1,2}\s*(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s*(to|-|se|tak)\s*\d{1,2}\s*(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)/.test(
      q
    );

  const hasIsoDateRange =
    /\d{4}-\d{2}-\d{2}\s*(to|-|se|tak)\s*\d{4}-\d{2}-\d{2}/.test(q);

  const hasSaleId =
    /\b(?:sale\s*(?:id|number|num|no)?|saleid|transaction\s*(?:id|number|num|no)?)\s*#?\s*\d+\b/.test(
      q
    );

  const salesWords = [
    "sale",
    "sales",
    "sold",
    "revenue",
    "earning",
    "income",
    "quantity",
    "quantity sold",
    "record",
    "records",
    "transaction",
    "transactions",
    "summary",
    "separate",
    "month",
    "monthly",
    "year",
    "years",
    "with date",
    "with dates",
    "date wise",
    "date-wise",
    "daily",
    "by date",
    "day wise",
    "day-wise",
    "cash",
    "card",
    "online",
    "tips",
    "tip",
    "accuracy",
    "verify",
    "check sales",
    "sales count",
    "total records",
    "sale id",
    "saleid",
    "today",
    "aaj",
    "yesterday",
    "kal",
    "days ago",
    "din pehle",
  ];

  const hasSalesIntent = salesWords.some((word) => q.includes(word));

  if (
    hasDateRange ||
    hasIsoDateRange ||
    hasSaleId ||
    hasSalesIntent ||
    (hasMonth && hasYear)
  ) {
    return "sales";
  }

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
  ];

  if (specialityWords.some((word) => q.includes(word))) {
    return "speciality";
  }

  if (recipeWords.some((word) => q.includes(word))) {
    return "recipe";
  }

  if (menuWords.some((word) => q.includes(word))) {
    return "menu";
  }

  return "general";
}