const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const AdvancedCommands = require('./advanced-commands');

// Замените на ваш токен бота
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const API_BASE_URL = 'http://localhost:4000';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Хранилище сессий пользователей
const userSessions = {};

// Данные для авторизации (соответствуют серверу)
const admins = {
  'adminApet': { password: '1234', park: 'parkFrunze', parkName: 'Парк Фрунзе' },
  'adminNarek': { password: '4321', park: 'parkMorVokzal', parkName: 'Парк Морвокзал' },
  'adminXunk': { password: '9999', park: 'parkNeptun', parkName: 'Парк Нептун' }
};

// Названия дней недели
const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// Стартовая команда
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🏢 Добро пожаловать в систему управления парками аттракционов "ВОЛНА"!

Доступные команды:
/login - Войти в систему
/help - Показать все команды
/status - Проверить статус авторизации

Для начала работы используйте команду /login
  `;
  bot.sendMessage(chatId, welcomeMessage);
});

// Помощь
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📚 Доступные команды:

🔐 Авторизация:
/login - Войти в систему
/logout - Выйти из системы
/status - Статус авторизации

👥 Сотрудники:
/employees - Список всех сотрудников
/add_employee - Добавить сотрудника
/remove_employee - Удалить сотрудника

📅 Расписание смен:
/schedule - Полное расписание на неделю
/schedule_today - Кто работает сегодня
/schedule_tomorrow - Кто работает завтра
/schedule_day - Расписание на конкретный день
/employee_schedule - График конкретного сотрудника

📊 Отчеты:
/report_week - Отчет по неделе
/report_employee - Отчет по сотруднику
/stats - Статистика парка

⚙️ Управление:
/update_schedule - Обновить расписание
/backup_data - Создать резервную копию

ℹ️ Прочее:
/help - Эта справка
  `;
  bot.sendMessage(chatId, helpMessage);
});

// Авторизация
bot.onText(/\/login/, (msg) => {
  const chatId = msg.chat.id;
  
  if (userSessions[chatId] && userSessions[chatId].isAuthenticated) {
    bot.sendMessage(chatId, `Вы уже авторизованы как ${userSessions[chatId].login} (${userSessions[chatId].parkName})`);
    return;
  }
  
  bot.sendMessage(chatId, 'Введите ваш логин:');
  userSessions[chatId] = { step: 'waiting_login' };
});

// Выход
bot.onText(/\/logout/, (msg) => {
  const chatId = msg.chat.id;
  delete userSessions[chatId];
  bot.sendMessage(chatId, 'Вы вышли из системы. Используйте /login для повторной авторизации.');
});

// Статус авторизации
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  
  if (userSessions[chatId] && userSessions[chatId].isAuthenticated) {
    const session = userSessions[chatId];
    bot.sendMessage(chatId, `✅ Авторизован как: ${session.login}\n🏢 Парк: ${session.parkName}`);
  } else {
    bot.sendMessage(chatId, '❌ Вы не авторизованы. Используйте /login');
  }
});

// Список сотрудников
bot.onText(/\/employees/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!checkAuth(chatId)) return;
  
  try {
    const session = userSessions[chatId];
    const response = await axios.get(`${API_BASE_URL}/employees/${session.park}`);
    const employees = response.data;
    
    if (employees.length === 0) {
      bot.sendMessage(chatId, 'В вашем парке пока нет сотрудников.');
      return;
    }
    
    let message = `👥 Сотрудники парка ${session.parkName}:\n\n`;
    employees.forEach((employee, index) => {
      message += `${index + 1}. ${employee}\n`;
    });
    
    bot.sendMessage(chatId, message);
  } catch (error) {
    bot.sendMessage(chatId, 'Ошибка при получении списка сотрудников.');
  }
});

// Полное расписание
bot.onText(/\/schedule/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!checkAuth(chatId)) return;
  
  try {
    const session = userSessions[chatId];
    const response = await axios.get(`${API_BASE_URL}/shifts/${session.park}`);
    const shifts = response.data;
    
    if (Object.keys(shifts).length === 0) {
      bot.sendMessage(chatId, 'Расписание пустое.');
      return;
    }
    
    let message = `📅 Расписание смен - ${session.parkName}\n\n`;
    
    Object.entries(shifts).forEach(([employee, schedule]) => {
      message += `👤 ${employee}:\n`;
      schedule.forEach((shift, dayIndex) => {
        const status = shift || '🚫';
        message += `  ${daysOfWeek[dayIndex]}: ${formatShift(shift)}\n`;
      });
      message += '\n';
    });
    
    // Телеграм имеет ограничение на длину сообщения
    if (message.length > 4000) {
      const messages = splitMessage(message, 4000);
      for (const msg of messages) {
        await bot.sendMessage(chatId, msg);
      }
    } else {
      bot.sendMessage(chatId, message);
    }
  } catch (error) {
    bot.sendMessage(chatId, 'Ошибка при получении расписания.');
  }
});

// Расписание на сегодня
bot.onText(/\/schedule_today/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!checkAuth(chatId)) return;
  
  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1; // Преобразование: воскресенье=0 -> 6
  
  await sendDaySchedule(chatId, dayIndex, 'сегодня');
});

// Расписание на завтра
bot.onText(/\/schedule_tomorrow/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (!checkAuth(chatId)) return;
  
  const tomorrow = (new Date().getDay() + 1) % 7;
  const dayIndex = tomorrow === 0 ? 6 : tomorrow - 1;
  
  await sendDaySchedule(chatId, dayIndex, 'завтра');
});

// Инициализация расширенных команд
const advancedCommands = new AdvancedCommands(bot, userSessions, API_BASE_URL);

// Обработка текстовых сообщений (для процесса авторизации)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Игнорируем команды
  if (text && text.startsWith('/')) return;
  
  // Сначала проверяем расширенные команды
  const handled = await advancedCommands.handleTextMessage(msg);
  if (handled) return;
  
  const session = userSessions[chatId];
  if (!session) return;
  
  if (session.step === 'waiting_login') {
    if (admins[text]) {
      session.login = text;
      session.step = 'waiting_password';
      bot.sendMessage(chatId, 'Введите пароль:');
    } else {
      bot.sendMessage(chatId, 'Неверный логин. Попробуйте еще раз или используйте /login');
      delete userSessions[chatId];
    }
  } else if (session.step === 'waiting_password') {
    const admin = admins[session.login];
    if (admin && admin.password === text) {
      session.isAuthenticated = true;
      session.park = admin.park;
      session.parkName = admin.parkName;
      session.step = null;
      bot.sendMessage(chatId, `✅ Успешная авторизация!\nВы вошли как: ${session.login}\nПарк: ${session.parkName}\n\nИспользуйте /help для просмотра команд.`);
    } else {
      bot.sendMessage(chatId, '❌ Неверный пароль. Используйте /login для повторной попытки.');
      delete userSessions[chatId];
    }
  }
});

// Вспомогательные функции
function checkAuth(chatId) {
  if (!userSessions[chatId] || !userSessions[chatId].isAuthenticated) {
    bot.sendMessage(chatId, '❌ Необходима авторизация. Используйте /login');
    return false;
  }
  return true;
}

function formatShift(shift) {
  if (!shift) return '🚫 Выходной';
  if (shift === '+') return '✅ Работает';
  if (shift === '++') return '🔥 Двойная смена';
  if (shift.includes('касса')) return '💰 ' + shift;
  if (shift === 'ст') return '👑 Старший смены';
  return shift;
}

async function sendDaySchedule(chatId, dayIndex, dayName) {
  try {
    const session = userSessions[chatId];
    const response = await axios.get(`${API_BASE_URL}/shifts/${session.park}`);
    const shifts = response.data;
    
    let message = `📅 Расписание на ${dayName} (${daysOfWeek[dayIndex]}) - ${session.parkName}\n\n`;
    
    const workingEmployees = [];
    Object.entries(shifts).forEach(([employee, schedule]) => {
      const shift = schedule[dayIndex];
      if (shift) {
        workingEmployees.push(`👤 ${employee}: ${formatShift(shift)}`);
      }
    });
    
    if (workingEmployees.length === 0) {
      message += 'Никто не работает 😴';
    } else {
      message += workingEmployees.join('\n');
    }
    
    bot.sendMessage(chatId, message);
  } catch (error) {
    bot.sendMessage(chatId, 'Ошибка при получении расписания на день.');
  }
}

function splitMessage(message, maxLength) {
  const messages = [];
  let current = '';
  
  const lines = message.split('\n');
  for (const line of lines) {
    if ((current + line + '\n').length > maxLength) {
      if (current) {
        messages.push(current);
        current = '';
      }
    }
    current += line + '\n';
  }
  
  if (current) {
    messages.push(current);
  }
  
  return messages;
}

console.log('🤖 Telegram бот запущен!');
console.log('Не забудьте:');
console.log('1. Заменить YOUR_BOT_TOKEN_HERE на реальный токен бота');
console.log('2. Убедиться, что сервер запущен на http://localhost:4000');