import { openai, AI_MODEL } from "../config/openai.js";

export async function createChatStream({ messages, restaurantContext }) {
  const systemMessage = `
You are a restaurant data assistant.

Rules:
- Always answer in English.
- Use ONLY the provided restaurant data.
- If the question asks multiple things, answer each part using the relevant restaurant data.
- Do not add assumptions.
- Do not invent dish names, sales, prices, recipes, availability, or quantities.
- Never mention any dish or category that is not present in the provided data.
- If data is not found, only say it was not found after checking the provided data.
- Keep answers short, clean, and direct.
`;

  const finalMessages = [
    {
      role: "system",
      content: systemMessage,
    },
  ];

  if (restaurantContext) {
    finalMessages.push({
      role: "system",
      content: `
Use this restaurant data to answer the user's question:

${restaurantContext}

Important:
Answer only from this data. Do not add anything extra.
`,
    });
  }

  finalMessages.push(...messages);

  return await openai.chat.completions.create({
    model: AI_MODEL,
    messages: finalMessages,
    temperature: 0,
    stream: true,
  });
}