/**
 * AI Response Handler Utility
 * Optimized for performance with caching and concurrent processing limits
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { buildContextInfo } = require("./contextBuilder");

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Performance optimizations
const responseCache = new Map();
const contextCache = new Map();
const emojiCache = new Map();
const activeRequests = new Set();
const MAX_CONCURRENT_REQUESTS = 3;
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT = 15000; // 15 seconds

async function performWebSearch(content) {
  const searchKeywords = [
    "what is",
    "who is", 
    "when did",
    "where is",
    "how to",
    "current",
    "latest",
    "news",
    "today",
    "recent",
    "weather",
    "temperature",
    "forecast",
    "score",
    "results",
    "stock",
    "price",
    "happening",
    "update"
  ];

  const needsSearch = searchKeywords.some((keyword) =>
    content.toLowerCase().includes(keyword),
  );

  if (!needsSearch) return "";

  const cacheKey = content.toLowerCase().slice(0, 100);
  if (contextCache.has(cacheKey)) {
    const cached = contextCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TIMEOUT) {
      return cached.result;
    }
    contextCache.delete(cacheKey);
  }

  try {
    const { spawn } = require("child_process");
    const python = spawn("python3", [
      "web_search.py",
      content
    ]);

    let searchOutput = "";
    python.stdout.on("data", (data) => {
      searchOutput += data.toString();
    });

    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        python.kill();
        resolve();
      }, 10000);

      python.on("close", () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    const result =
      searchOutput.trim() &&
      !searchOutput.includes("failed") &&
      !searchOutput.includes("timeout")
        ? `\n\nSearch results: ${searchOutput.trim()}`
        : "";

    contextCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  } catch (e) {
    console.error("Web search error:", e);
    return "";
  }
}

async function getEmojiMap(client, guildId) {
  if (!guildId) return {};

  const cached = emojiCache.get(guildId);
  if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
    return cached.emojis;
  }

  try {
    const guild = await client.guilds.fetch(guildId);
    const emojis = await guild.emojis.fetch();
    const emojiMap = {};

    emojis.forEach((emoji) => {
      emojiMap[emoji.name] = emoji.toString();
    });

    emojiCache.set(guildId, { emojis: emojiMap, timestamp: Date.now() });
    return emojiMap;
  } catch (err) {
    console.error("Failed to fetch emojis:", err);
    return {};
  }
}

async function generateAIResponse(
  message,
  client,
  otherData,
  content,
  conversationHistory,
) {
  if (activeRequests.size >= MAX_CONCURRENT_REQUESTS) {
    throw new Error("AI service is busy. Please try again in a moment.");
  }

  const cacheKey = `${content.slice(0, 50)}-${otherData.name || "bot"}`;
  if (responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TIMEOUT) {
      return cached.response;
    }
    responseCache.delete(cacheKey);
  }

  const requestId = `${Date.now()}-${Math.random()}`;
  activeRequests.add(requestId);

  try {
    const personalityParts = [];
    if (otherData.age) personalityParts.push(`Age: ${otherData.age}`);
    if (otherData.personality)
      personalityParts.push(`Personality: ${otherData.personality}`);
    if (otherData.likes) personalityParts.push(`Likes: ${otherData.likes}`);
    if (otherData.dislikes)
      personalityParts.push(`Dislikes: ${otherData.dislikes}`);
    if (otherData.appearance)
      personalityParts.push(`Appearance: ${otherData.appearance}`);
    if (otherData.backstory)
      personalityParts.push(`Backstory: ${otherData.backstory}`);
    if (otherData.others)
      personalityParts.push(`To Do: ${otherData.others}`);

    const personalityContext = personalityParts.join(". ");



    const searchContext = await performWebSearch(content);
    const emojiMap = await getEmojiMap(client, message.guildId);
    const emojiList = Object.entries(emojiMap)
      .map(([name, val]) => `${name}: ${val}`)
      .join("\n");

    const prompt = `You are ${otherData.name}.
    

 You are the one of the mascot of ${message.guild?.name}, ${personalityContext}

Custom emojis you can use when relevant (MAX 3 total):
${emojiList || "(none found)"}

Previous conversation history (remember this context):
${conversationHistory || "No previous conversation"}

${searchContext ? `Current web search information: ${searchContext}` : ""}

User: "${content}"

Respond naturally, using no more than 3 custom emojis by name. Use emoji placeholders in the format :emoji_name: only. Do not use underscores or raw names. Max 150 words.`;

Search context:
${searchContext}

User: "${content}"

Respond naturally, using no more than 3 custom emojis by name. Use emoji placeholders in the format :emoji_name: only. Do not use underscores or raw names. Max 150 words.`;


    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    });

    const response = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), REQUEST_TIMEOUT),
      ),
    ]);

    let reply = response.response.text() || "I'm thinking...";

    // Strip unwanted underscore-based emoji text (_shrug, _popcorn)
    reply = reply.replace(/\B_[a-zA-Z0-9]+/g, "");

    // Limit to 3 custom emojis
    const usedEmojis = new Set();
    let emojiCount = 0;
    const MAX_EMOJI_USE = 3;

    reply = reply.replace(/:([a-zA-Z0-9_]+):/g, (_, name) => {
      const emoji = emojiMap[name];
      if (!emoji) {
        return ""; // skip unknown
      }
      if (usedEmojis.has(emoji) || emojiCount >= MAX_EMOJI_USE) return "";
      usedEmojis.add(emoji);
      emojiCount++;
      return emoji;
    });

    const finalReply = reply.length > 2000 ? reply.substring(0, 2000) : reply;

    responseCache.set(cacheKey, {
      response: finalReply,
      timestamp: Date.now(),
    });

    cleanupCache();

    return finalReply;
  } catch (error) {
    console.error("AI Generation Error:", error);
    if (error.message?.includes("quota")) {
      throw new Error("AI service quota exceeded. Please try again later.");
    }
    if (error.message?.includes("timeout")) {
      throw new Error("AI response took too long. Please try again.");
    }
    throw new Error("Unable to generate AI response at this time.");
  } finally {
    activeRequests.delete(requestId);
  }
}

function cleanupCache() {
  const now = Date.now();

  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_TIMEOUT) {
      responseCache.delete(key);
    }
  }

  for (const [key, value] of contextCache.entries()) {
    if (now - value.timestamp > CACHE_TIMEOUT) {
      contextCache.delete(key);
    }
  }

  for (const [key, value] of emojiCache.entries()) {
    if (now - value.timestamp > CACHE_TIMEOUT) {
      emojiCache.delete(key);
    }
  }
}

module.exports = {
  generateAIResponse,
  performWebSearch,
  cleanupCache,
  getEmojiMap,
};
