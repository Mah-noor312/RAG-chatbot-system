import { addMessage, getMessages } from "../memory/sessionStore.js";
import { parseUserQueryWithAI } from "../services/aiQueryParserService.js";
import { createChatStream } from "../services/openaiService.js";
import { detectQueryType } from "../services/queryRouterService.js";
import { getRecipeAnswer } from "../services/recipeService.js";
import { getRestaurantContext } from "../services/restaurantAnswerService.js";
import {
  getSalesAnswer,
  getSalesAnswerFromParsedQuery,
  getSalesDishNames,
} from "../services/salesService.js";
import { getSpecialityAnswer } from "../services/specialityService.js";

const lastSalesQuestionBySession = {};

function isDateFollowUp(message) {
  const q = String(message || "").toLowerCase().trim();

  return (
    q === "with date" ||
    q === "with dates" ||
    q === "date wise" ||
    q === "date-wise" ||
    q === "show with dates" ||
    q === "show date wise" ||
    q === "daily" ||
    q === "by date"
  );
}

function isMixedRecipeQuestion(message) {
  const q = String(message || "").toLowerCase();

  return (
    q.includes("menu") ||
    q.includes("available") ||
    q.includes("dessert") ||
    q.includes("desserts") ||
    q.includes("drink") ||
    q.includes("drinks") ||
    q.includes("price") ||
    q.includes("sale") ||
    q.includes("sales")
  );
}

export async function chatController(req, res) {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({
      error: "sessionId and message are required",
    });
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");

  try {
    addMessage(sessionId, "user", message);

    /*
      1. First handle follow-up like:
      User: january 2027 sales record
      User: with dates
    */
    if (isDateFollowUp(message)) {
      if (!lastSalesQuestionBySession[sessionId]) {
        const answer =
          "Please mention the month, date, range, or dish name. Example: Chicken Roll sales from 12 jan to 31 march with dates.";

        addMessage(sessionId, "assistant", answer);
        res.end(answer);
        return;
      }

      const salesQuestion = `${lastSalesQuestionBySession[sessionId]} with dates`;
      const answer = await getSalesAnswer(salesQuestion);

      addMessage(sessionId, "assistant", answer);
      res.end(answer);
      return;
    }

    /*
      2. Detect sales BEFORE AI parser.
      This prevents Groq from converting "total sales" into only 2026.
      Now "total sales" will directly go to salesService.js and use all 20k records.
    */
    const queryType = detectQueryType(message);

    if (queryType === "sales") {
      lastSalesQuestionBySession[sessionId] = message;

      const answer = await getSalesAnswer(message);

      addMessage(sessionId, "assistant", answer);
      res.end(answer);
      return;
    }

    /*
      3. Direct speciality route.
    */
    if (queryType === "speciality") {
      const answer = await getSpecialityAnswer();

      addMessage(sessionId, "assistant", answer);
      res.end(answer);
      return;
    }

    /*
      4. Direct recipe route.
    */
    if (queryType === "recipe") {
      if (!isMixedRecipeQuestion(message)) {
        const answer = await getRecipeAnswer(message);

        addMessage(sessionId, "assistant", answer);
        res.end(answer);
        return;
      }
    }

    /*
      5. AI parser only for cases not handled above.
      If Groq rate limit happens, chatbot will not break.
    */
    try {
      const dishNames = await getSalesDishNames();
      const parsedQuery = await parseUserQueryWithAI(message, dishNames);

      if (parsedQuery.type === "sales") {
        const answer = await getSalesAnswerFromParsedQuery(parsedQuery, message);

        if (answer) {
          lastSalesQuestionBySession[sessionId] = message;

          addMessage(sessionId, "assistant", answer);
          res.end(answer);
          return;
        }
      }
    } catch (error) {
      console.error("AI parser skipped:", error.message);
    }

    /*
      6. Fallback AI response for general/menu/mixed questions.
    */
    const messages = getMessages(sessionId);
    const restaurantContext = await getRestaurantContext(message);

    const stream = await createChatStream({
      messages,
      restaurantContext,
    });

    let assistantReply = "";

    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content || "";

      if (text) {
        assistantReply += text;
        res.write(text);
      }
    }

    addMessage(sessionId, "assistant", assistantReply);

    res.end();
  } catch (error) {
    console.error("Chatbot API Error:", error);

    res.end(
      "Sorry, I could not generate a response. Please check the backend terminal."
    );
  }
}