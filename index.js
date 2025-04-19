require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Совет по одежде в зависимости от температуры
function getClothingAdvice(feelsLike, description) {
    let advice = "";
  
    if (feelsLike < 0) {
      advice = "🥶 Очень холодно! Надень тёплую куртку, шапку и перчатки.";
    } else if (feelsLike < 10) {
      advice = "🧥 Прохладно. Лучше надеть куртку и закрытую обувь.";
    } else if (feelsLike < 20) {
      advice = "👕 Немного прохладно. Надень кофту или толстовку.";
    } else if (feelsLike < 25) {
      advice = "😊 Комфортно. Подойдёт лёгкая одежда.";
    } else {
      advice = "🥵 Жарко! Надень футболку и возьми воду.";
    }
  
    if (description.includes("дожд") || description.includes("душ")) {
      advice += " ☔ Также захвати зонт — может пойти дождь.";
    }
  
    if (description.includes("снег")) {
      advice += " ❄️ Идёт снег, одевайся теплее и обувь не скользкую!";
    }
  
    return advice;
  }
  


async function getWeather(city) {
    const apiKey=process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=ru`;

    try {
        const response =await axios.get(url);
        const data =response.data;

        const temp =data.main.temp;
        const feelsLike = data.main.feels_like;
        const desc =data.weather[0].description;
        const advice = getClothingAdvice(feelsLike, desc);

        return  `
        🌤 Погода в городе ${data.name}:
        🌡 Температура: ${temp}°C
        🤔 Ощущается как: ${feelsLike}°C
        📋 Описание: ${desc}
        🧠 Совет: ${advice}
        `;

        

    } catch (error) {
        return "❌ Не удалось найти город. Попробуй ещё раз.";
    }
}

bot.on("message", async(msg)=>{
    const chatID =msg.chat.id;
    const text=msg.text;

    const weather =await getWeather(text);
    bot.sendMessage(chatID,weather)
})
