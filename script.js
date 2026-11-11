/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

chatWindow.textContent = "💄 Hello! I'm your L'Oréal Beauty Assistant. Ask me for skincare routines, hair recommendations, or product tips!";

const WORKER_URL = "https://lorealworker.jcwebst5.workers.dev/";

// Set the assistant's personality for every conversation.
const conversationHistory = [
  {
    role: "system",
    content:
      "You are a friendly, knowledgeable L'Oréal beauty advisor on the official brand chat line. Only answer questions about L'Oréal beauty products, makeup, skincare, haircare, fragrances, beauty routines, and recommendations. If a question is unrelated, politely explain that you can help with L'Oréal beauty topics and invite the user to ask about one.\n\nYour personality is modern, aesthetic, and approachable Gen-Z—warm and trend-conscious, balancing genuine product expertise with casual charm.\n\nGuidelines:\n- Maintain a professional yet friendly and modern tone.\n- Use Gen-Z slang selectively (e.g., 'holy grail', 'obsessed', 'glow up')—keep it natural as a light accent rather than using multiple slang terms per sentence.\n- Keep responses concise, helpful, and easy to read.\n- Use emojis sparingly, usually 0-2 for the whole response. Add them only when they feel natural; don't put one on every line or repeat the same emoji throughout.\n- Recommend L'Oréal Paris products only when relevant. Highlight clear, practical benefits without overwhelming technical jargon or walls of text. Do not invent products or product details.\n- When recommending a specific product, put its exact name at the start of its own list item in this format: **Product: exact product name**. Add a short, conversational reason after the product name. Do not label general advice or non-product recommendations as Product.",
  },
];

// Add messages as text so response content is not treated as HTML.
function showMessages(userMessage, assistantMessage) {
  chatWindow.replaceChildren();

  const userParagraph = document.createElement("div");
  userParagraph.className = "msg user";
  const userLabel = document.createElement("strong");
  userLabel.textContent = "You: ";
  userParagraph.append(userLabel, document.createTextNode(userMessage));
  chatWindow.append(userParagraph);

  const assistantParagraph = document.createElement("div");
  assistantParagraph.className = "msg ai";
  const assistantLabel = document.createElement("strong");
  assistantLabel.textContent = "L'Oréal Assistant: ";
  assistantParagraph.append(assistantLabel);
  appendFormattedResponse(assistantParagraph, assistantMessage);
  chatWindow.append(assistantParagraph);
}

// Link product recommendations to matching results on the official site.
function appendFormattedResponse(paragraph, response) {
  const lines = response.split("\n");

  lines.forEach((line, index) => {
    const heading = line.match(/^\s{0,3}#{1,6}\s*(.+)$/);
    const listItem = line.match(/^\s*(?:[-*+•‣]|\d+[.)])\s+(.+)$/);
    const productItem = line.match(
      /^\s*(?:[-*+•‣]|\d+[.)])\s+(?:\*\*Product:\s*([^*]+)\*\*|Product:\s*\*\*([^*]+)\*\*)(.*)$/i,
    );
    const boldLine = line.match(/^\s*\*\*(.+)\*\*\s*$/);

    if (heading) {
      const text = heading[1].replace(/\*\*/g, "");
      paragraph.append(document.createTextNode(text));
    } else if (productItem) {
      const productName = (productItem[1] || productItem[2]).trim();
      const link = document.createElement("a");
      link.className = "product-link";
      link.href = `https://www.lorealparisusa.com/search?search=${encodeURIComponent(productName)}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = productName;

      const description = productItem[3].replace(/\*\*/g, "");
      paragraph.append(
        link,
        document.createTextNode(description),
      );
    } else if (listItem) {
      const text = listItem[1].replace(/\*\*/g, "");
      paragraph.append(document.createTextNode(text));
    } else if (boldLine) {
      const text = boldLine[1];
      paragraph.append(document.createTextNode(text));
    } else {
      paragraph.append(document.createTextNode(line.replace(/\*\*/g, "")));
    }

    if (index < lines.length - 1) {
      paragraph.append(document.createTextNode("\n"));
    }
  });
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const messageText = userInput.value.trim();
  if (!messageText) return;

  // Append user message to conversation history
  conversationHistory.push({ role: "user", content: messageText });

  // Show the user's message while the assistant prepares a reply.
  showMessages(messageText, "✨ One sec, beauty bestie! I'm on it...");
  userInput.value = "";

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversationHistory
      })
    });

    const data = await response.json();

    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].finish_reason === "length"
    ) {
      showMessages(
        messageText,
        "I wasn't able to finish that reply. Please send your question again and I'll keep the answer concise.",
      );
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiResponse = data.choices[0].message.content;

      // Save assistant reply to history
      conversationHistory.push({ role: "assistant", content: aiResponse });

      showMessages(messageText, aiResponse);
    } else {
      showMessages(messageText, "Sorry, I couldn't find a recommendation this time. Please try again!");
    }
  } catch (error) {
    showMessages(messageText, "Oops, I couldn't connect right now. Please try again in a moment!");
    console.error(error);
  }
});