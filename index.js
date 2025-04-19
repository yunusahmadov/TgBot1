require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 📦 Получение AI-совета от OpenRouter через Mistral
async function getAIClothingAdvice(city, temp, feelsLike, description) {
  const prompt = `В городе ${city} сейчас ${temp}°C (ощущается как ${feelsLike}°C), на улице ${description}.
Что бы ты посоветовал надеть человеку? Напиши кратко и дружелюбно.`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-small-3.1-24b-instruct:free",
        messages: [
          { role: "system", content: "Ты доброжелательный погодный помощник." },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://yourapp.com", 
          "X-Title": "WeatherBot",
        },
      }
    );

    const message = response.data.choices?.[0]?.message?.content;
    return message || "🤖 AI не смог дать совет.";
  } catch (err) {
    console.error("Ошибка AI:", err.response?.data || err.message);
    return "🤖 Не удалось получить совет от AI.";
  }
}

// 🌤 Получение погоды и советов
async function getWeather(city) {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${apiKey}&units=metric&lang=ru`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    const temp = data.main.temp;
    const feelsLike = data.main.feels_like;
    const desc = data.weather[0].description;

    const aiAdvice = await getAIClothingAdvice(data.name, temp, feelsLike, desc);

    return `
🌤 Погода в городе ${data.name}:
🌡 Температура: ${temp}°C
🤔 Ощущается как: ${feelsLike}°C
📋 Описание: ${desc}

Совет:
${aiAdvice}
    `;
  } catch (error) {
    console.error("Ошибка погоды:", error.message);
    return "❌ Не удалось найти город. Попробуй ещё раз.";
  }
}

// 🤖 Обработка сообщений
bot.on("message", async (msg) => {
  const chatID = msg.chat.id;
  const text = msg.text;

  const weather = await getWeather(text);
  bot.sendMessage(chatID, weather);
});
