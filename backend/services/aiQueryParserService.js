import { AI_MODEL, openai } from "../config/openai.js";

function extractJson(text) {
  const match = String(text || "").match(/\{[\s\S]*\}/);

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    return null;
  }
}

function cleanGroupBy(value) {
  const allowed = ["none", "date", "month", "item"];

  if (allowed.includes(value)) {
    return value;
  }

  return "none";
}

function cleanPaymentMethod(value) {
  if (value === "cash" || value === "card" || value === "online") {
    return value;
  }

  return null;
}

function cleanParsedQuery(parsed) {
  const groupBy = cleanGroupBy(parsed?.groupBy);
  const saleIdNumber = Number(parsed?.saleId);

  return {
    type: parsed?.type || "general",
    saleId:
      Number.isInteger(saleIdNumber) && saleIdNumber > 0
        ? saleIdNumber
        : null,
    dishName: parsed?.dishName || null,
    requestedDishName: parsed?.requestedDishName || null,
    unknownDish: Boolean(parsed?.unknownDish),
    startDate: parsed?.startDate || null,
    endDate: parsed?.endDate || null,
    paymentMethod: cleanPaymentMethod(parsed?.paymentMethod),
    groupBy,
    groupByDate: groupBy === "date",
    includeItems: Boolean(parsed?.includeItems),
    needsItemsSold: Boolean(parsed?.includeItems),
    needsDishName: Boolean(parsed?.needsDishName),
  };
}

export async function parseUserQueryWithAI(question, dishNames = []) {
  const systemPrompt = `
You are a query parser for a restaurant MySQL chatbot.

Your job:
Convert the user's question into JSON only.
Do not answer the user's question.
Do not calculate anything.
Do not invent data.

Available dish names:
${dishNames.join(", ")}

Return JSON only in this exact format:
{
  "type": "sales" | "menu" | "recipe" | "speciality" | "general",
  "saleId": number | null,
  "dishName": string | null,
  "requestedDishName": string | null,
  "unknownDish": boolean,
  "startDate": "YYYY-MM-DD" | null,
  "endDate": "YYYY-MM-DD" | null,
  "paymentMethod": "cash" | "card" | "online" | null,
  "groupBy": "none" | "date" | "month" | "item",
  "includeItems": boolean,
  "needsDishName": boolean
}

Rules:
- Dates may be between 2026 and 2030.
- If year is not mentioned, use 2026.
- Convert dates like "12 jan", "12th january", "1st jan", "31 march" into YYYY-MM-DD.
- Convert ranges like "12 jan to 31 march", "12 jan se 31 march tak", "from 1st january to 15 march".
- If only one date is given, set startDate and endDate to the same date.
- If a full month is asked with year, set startDate to first day and endDate to last day of that month and year.
- If a full month is asked without year, use 2026.
- If "jan to march" is asked, use 2026 unless another year is mentioned.
- If "2026 sales summary" is asked without a specific month/range, set startDate "2026-01-01" and endDate "2026-12-31".
- If "2027 sales summary" is asked without a specific month/range, set startDate "2027-01-01" and endDate "2027-12-31".
- If user asks "sale number 9999", "sale id 9999", "saleId 9999", "transaction 9999", "detail of sale number 9999", set saleId 9999.
- If saleId is present, set type "sales", groupBy "none", includeItems false.

Grouping rules:
- If user asks "with dates", "date wise", "daily", "by date", set groupBy "date".
- If user asks "each month", "by month", "month wise", "month-wise", "monthly summary", "har month", "hr month", "month ki summary", set groupBy "month".
- If user asks "item wise", "item-wise", "items sold", "sold items", "item breakdown", set groupBy "item" or includeItems true.
- If no grouping is requested, set groupBy "none".

Items rules:
- If user asks "without sold items", "without items", "no sold items", "no items", "summary only", "only summary", "totals only", "sirf summary", "items mat dikhao", "sold items mat dikhao", set includeItems false.
- If user asks "with items", "with sold items", "items sold", "item-wise", or "item breakdown", set includeItems true.
- If user asks only "sales summary", "sales record", "total sales", or does not clearly ask for items, set includeItems false.

Payment rules:
- If user asks for cash sales, set paymentMethod "cash".
- If user asks for card sales, set paymentMethod "card".
- If user asks for online sales, set paymentMethod "online".

Dish rules:
- Match dishName only from available dish names.
- If user asks sales/record/summary for a dish/product name that is NOT in the available dish names, set dishName null, requestedDishName to the user's mentioned dish name, and unknownDish true.
- If no dish is clearly mentioned, dishName must be null.
- If user asks for one product/dish but does not mention dish name, set needsDishName true.

Return JSON only.
`;

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: question,
      },
    ],
    temperature: 0,
  });

  const rawText = response.choices?.[0]?.message?.content || "";
  const parsed = extractJson(rawText);

  if (!parsed) {
    return cleanParsedQuery({
      type: "general",
    });
  }

  return cleanParsedQuery(parsed);
}