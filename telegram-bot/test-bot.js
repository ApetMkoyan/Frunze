const TelegramBot = require('node-telegram-bot-api');

// Конфигурация
const BOT_TOKEN = '8403584306:AAH4Ur6s46KYaUrjGOk3DRjT4d6AjbqKzj8';

console.log('🤖 Запуск тестового Telegram бота...');
console.log(`🔑 Токен: ${BOT_TOKEN.substring(0, 10)}...`);

// Создание бота
const bot = new TelegramBot(BOT_TOKEN, { 
  polling: true,
  parse_mode: 'HTML',
  disable_web_page_preview: true
});

console.log('✅ Бот создан');

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`📱 Получена команда /start от ${chatId}`);
  
  bot.sendMessage(chatId, 
    '🎢 Тестовый бот работает!\n\n' +
    'Это проверка работы Telegram бота на Render.\n' +
    'Если вы видите это сообщение, значит бот работает правильно!'
  );
});

// Обработка всех сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  console.log(`📨 Получено сообщение: "${text}" от ${chatId}`);
  
  if (text && text !== '/start') {
    bot.sendMessage(chatId, 
      `✅ Получено ваше сообщение: "${text}"\n\n` +
      'Бот работает корректно! 🎉'
    );
  }
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.log('❌ Polling error:', error);
});

bot.on('error', (error) => {
  console.log('❌ Bot error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  console.log('✅ Бот завершает работу');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  console.log('✅ Бот завершает работу');
  process.exit(0);
});

console.log('🚀 Тестовый Telegram бот запущен!');
console.log('📱 Найдите бота в Telegram и отправьте /start');
console.log('🔍 Проверьте логи для отладки'); 