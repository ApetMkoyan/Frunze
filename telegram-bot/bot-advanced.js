const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Загрузка конфигурации
let config;
try {
  config = require('./config.js');
} catch (error) {
  console.log('⚠️ Файл config.js не найден. Используются настройки по умолчанию.');
  config = {
    BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE',
    USERS: {
      adminApet: { password: '1234', park: 'parkFrunze' },
      adminNarek: { password: '4321', park: 'parkMorVokzal' },
      adminXunk: { password: '9999', park: 'parkNeptun' },
    },
    SALARY_RATES: {
      '++': 2000, 'ст': 1000, 'касса1': 2500, 'касса2': 3000,
      '+': 1500, '1200': 1200, '1000': 1000,
    },
    PARKS: {
      parkFrunze: { name: 'Парк Фрунзе', hockeyMachines: 5, boxerMachines: 1 },
      parkMorVokzal: { name: 'Парк Морской Вокзал', hockeyMachines: 1, boxerMachines: 1 },
      parkNeptun: { name: 'Парк Нептун', hockeyMachines: 1, boxerMachines: 1 },
    },
    BOT_SETTINGS: { polling: true, parse_mode: 'HTML', disable_web_page_preview: true },
    DATA_SETTINGS: { dataFile: './bot-data.json', backupInterval: 24 * 60 * 60 * 1000 },
  };
}

const bot = new TelegramBot(config.BOT_TOKEN, config.BOT_SETTINGS);

// Структура данных
let parksData = {};
const userStates = {};

// Загрузка данных
function loadData() {
  if (fs.existsSync(config.DATA_SETTINGS.dataFile)) {
    try {
      const raw = fs.readFileSync(config.DATA_SETTINGS.dataFile);
      parksData = JSON.parse(raw);
    } catch (error) {
      console.log('❌ Ошибка загрузки данных:', error.message);
      parksData = initializeParksData();
    }
  } else {
    parksData = initializeParksData();
    saveData();
  }
}

// Инициализация данных парков
function initializeParksData() {
  const data = {};
  Object.keys(config.PARKS).forEach(parkKey => {
    data[parkKey] = { employees: [], shifts: {}, machines: [] };
  });
  return data;
}

// Сохранение данных с резервной копией
function saveData() {
  try {
    // Создание резервной копии
    if (fs.existsSync(config.DATA_SETTINGS.dataFile)) {
      const backupFile = config.DATA_SETTINGS.dataFile.replace('.json', `_backup_${Date.now()}.json`);
      fs.copyFileSync(config.DATA_SETTINGS.dataFile, backupFile);
    }
    
    fs.writeFileSync(config.DATA_SETTINGS.dataFile, JSON.stringify(parksData, null, 2));
    console.log('✅ Данные сохранены');
  } catch (error) {
    console.log('❌ Ошибка сохранения данных:', error.message);
  }
}

loadData();

// Автоматическое резервное копирование
setInterval(() => {
  saveData();
}, config.DATA_SETTINGS.backupInterval);

// Клавиатуры
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['👥 Сотрудники', '📅 Смены'],
      ['🎮 Хоккей/Боксёр', '📊 Отчёты'],
      ['⚙️ Настройки', 'ℹ️ О программе'],
      ['🚪 Выйти']
    ],
    resize_keyboard: true
  }
};

const backKeyboard = {
  reply_markup: {
    keyboard: [['🔙 Назад']],
    resize_keyboard: true
  }
};

// Утилиты
function formatCurrency(amount) {
  return new Intl.NumberFormat('ru-RU').format(amount) + '₽';
}

function validateDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

function getParkName(parkKey) {
  return config.PARKS[parkKey]?.name || parkKey;
}

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { state: 'login', step: 'username' };
  
  bot.sendMessage(chatId, 
    '🎢 Добро пожаловать в систему управления парком аттракционов!\n\n' +
    'Для входа введите логин:',
    backKeyboard
  );
});

// Обработка команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpText = `
🤖 <b>Справка по командам:</b>

/start - Начать работу с ботом
/help - Показать эту справку
/status - Показать статус системы

<b>Навигация:</b>
• Используйте кнопки для навигации
• 🔙 Назад - вернуться в предыдущее меню
• 🚪 Выйти - завершить сессию

<b>Формат ввода данных:</b>
• Смены: 7 значений через запятую
• Автоматы: тип,дата_с,дата_по,сумма
• Даты: YYYY-MM-DD

<b>Типы смен:</b>
++ (2000₽), ст (1000₽), касса1 (2500₽), касса2 (3000₽), + (1500₽), 1200 (1200₽), 1000 (1000₽)
  `;
  
  bot.sendMessage(chatId, helpText, { parse_mode: 'HTML' });
});

// Обработка команды /status
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  
  if (state && state.state === 'logged_in') {
    const park = state.park;
    const employees = parksData[park]?.employees || [];
    const machines = parksData[park]?.machines || [];
    
    const statusText = `
📊 <b>Статус системы:</b>

🏢 Парк: ${getParkName(park)}
👥 Сотрудников: ${employees.length}
🎮 Записей автоматов: ${machines.length}
💾 Данные: ${fs.existsSync(config.DATA_SETTINGS.dataFile) ? '✅ Загружены' : '❌ Ошибка'}
🤖 Бот: ✅ Работает
    `;
    
    bot.sendMessage(chatId, statusText, { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(chatId, '❌ Вы не авторизованы. Используйте /start для входа.');
  }
});

// Обработка текстовых сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (!userStates[chatId]) {
    userStates[chatId] = { state: 'login', step: 'username' };
  }
  
  const state = userStates[chatId];
  
  // Обработка выхода
  if (text === '🚪 Выйти') {
    delete userStates[chatId];
    bot.sendMessage(chatId, 'Вы вышли из системы. Введите /start для повторного входа.');
    return;
  }
  
  // Обработка возврата
  if (text === '🔙 Назад') {
    if (state.state === 'logged_in') {
      showMainMenu(chatId);
    } else {
      userStates[chatId] = { state: 'login', step: 'username' };
      bot.sendMessage(chatId, 'Введите логин:', backKeyboard);
    }
    return;
  }
  
  // Обработка авторизации
  if (state.state === 'login') {
    handleLogin(chatId, text, state);
    return;
  }
  
  // Обработка главного меню
  if (state.state === 'logged_in') {
    handleMainMenu(chatId, text, state);
    return;
  }
  
  // Обработка состояний
  handleStates(chatId, text, state);
});

// Обработка авторизации
function handleLogin(chatId, text, state) {
  if (state.step === 'username') {
    if (config.USERS[text]) {
      state.username = text;
      state.step = 'password';
      bot.sendMessage(chatId, 'Введите пароль:');
    } else {
      bot.sendMessage(chatId, '❌ Неверный логин. Попробуйте снова:');
    }
  } else if (state.step === 'password') {
    if (config.USERS[state.username] && config.USERS[state.username].password === text) {
      state.state = 'logged_in';
      state.park = config.USERS[state.username].park;
      delete state.step;
      delete state.username;
      
      bot.sendMessage(chatId, 
        `✅ Успешный вход!\n🏢 Парк: ${getParkName(state.park)}`,
        mainKeyboard
      );
      showMainMenu(chatId);
    } else {
      bot.sendMessage(chatId, '❌ Неверный пароль. Попробуйте снова:');
    }
  }
}

// Показать главное меню
function showMainMenu(chatId) {
  const state = userStates[chatId];
  const park = state.park;
  
  bot.sendMessage(chatId, 
    `🏢 Парк: ${getParkName(park)}\n\nВыберите действие:`,
    mainKeyboard
  );
}

// Обработка главного меню
function handleMainMenu(chatId, text, state) {
  switch (text) {
    case '👥 Сотрудники':
      showEmployeesMenu(chatId, state);
      break;
    case '📅 Смены':
      showShiftsMenu(chatId, state);
      break;
    case '🎮 Хоккей/Боксёр':
      showMachinesMenu(chatId, state);
      break;
    case '📊 Отчёты':
      showReports(chatId, state);
      break;
    case '⚙️ Настройки':
      showSettings(chatId, state);
      break;
    case 'ℹ️ О программе':
      showAbout(chatId);
      break;
  }
}

// Меню сотрудников
function showEmployeesMenu(chatId, state) {
  const park = state.park;
  const employees = parksData[park]?.employees || [];
  
  let message = `👥 <b>Сотрудники парка ${getParkName(park)}:</b>\n\n`;
  if (employees.length === 0) {
    message += 'Список сотрудников пуст';
  } else {
    employees.forEach((emp, index) => {
      message += `${index + 1}. ${emp}\n`;
    });
  }
  
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['➕ Добавить сотрудника'],
        ['🗑️ Удалить сотрудника'],
        ['🔙 Назад']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, { parse_mode: 'HTML' }, keyboard);
  state.currentSection = 'employees';
}

// Меню смен
function showShiftsMenu(chatId, state) {
  const park = state.park;
  const employees = parksData[park]?.employees || [];
  const shifts = parksData[park]?.shifts || {};
  
  let message = `📅 <b>Таблица смен парка ${getParkName(park)}:</b>\n\n`;
  
  if (employees.length === 0) {
    message += 'Нет сотрудников для отображения смен';
  } else {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    message += '<b>Сотрудник | ' + days.join(' | ') + ' | Зарплата</b>\n';
    message += '─'.repeat(60) + '\n';
    
    employees.forEach(name => {
      const row = shifts[name] || Array(7).fill('');
      const salary = calculateSalary(name, row);
      message += `${name} | ${row.join(' | ')} | ${formatCurrency(salary)}\n`;
    });
  }
  
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['✏️ Редактировать смены'],
        ['💰 Расчёт зарплаты'],
        ['🔙 Назад']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, { parse_mode: 'HTML' }, keyboard);
  state.currentSection = 'shifts';
}

// Меню автоматов
function showMachinesMenu(chatId, state) {
  const park = state.park;
  const machines = parksData[park]?.machines || [];
  const parkConfig = config.PARKS[park];
  
  let message = `🎮 <b>Хоккей/Боксёр парка ${getParkName(park)}:</b>\n\n`;
  message += `🏒 Хоккейных автоматов: ${parkConfig.hockeyMachines}\n`;
  message += `🥊 Боксёрских автоматов: ${parkConfig.boxerMachines}\n\n`;
  
  if (machines.length === 0) {
    message += 'История пуста';
  } else {
    message += '<b>Тип | С | По | Сумма</b>\n';
    message += '─'.repeat(40) + '\n';
    
    machines.forEach(entry => {
      const type = entry.type === 'hockey' ? '🏒 Хоккей' : '🥊 Боксёр';
      message += `${type} | ${entry.from} | ${entry.to} | ${formatCurrency(entry.amount)}\n`;
    });
  }
  
  const keyboard = {
    reply_markup: {
      keyboard: [
        ['➕ Добавить запись'],
        ['🗑️ Удалить запись'],
        ['🔙 Назад']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, { parse_mode: 'HTML' }, keyboard);
  state.currentSection = 'machines';
}

// Отчёты
function showReports(chatId, state) {
  const park = state.park;
  const employees = parksData[park]?.employees || [];
  const shifts = parksData[park]?.shifts || {};
  const machines = parksData[park]?.machines || [];
  
  // Расчёт общей зарплаты
  let totalSalary = 0;
  employees.forEach(name => {
    const row = shifts[name] || Array(7).fill('');
    totalSalary += calculateSalary(name, row);
  });
  
  // Расчёт доходов с автоматов
  const hockeyIncome = machines
    .filter(m => m.type === 'hockey')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const boxerIncome = machines
    .filter(m => m.type === 'boxer')
    .reduce((sum, m) => sum + m.amount, 0);
  
  const totalIncome = hockeyIncome + boxerIncome;
  const profit = totalIncome - totalSalary;
  
  const message = `📊 <b>Отчёт по парку ${getParkName(park)}:</b>\n\n` +
    `👥 Сотрудников: ${employees.length}\n` +
    `💰 Общая зарплата: ${formatCurrency(totalSalary)}\n` +
    `🏒 Доход с хоккея: ${formatCurrency(hockeyIncome)}\n` +
    `🥊 Доход с боксёра: ${formatCurrency(boxerIncome)}\n` +
    `📈 Общий доход: ${formatCurrency(totalIncome)}\n` +
    `💵 Прибыль: ${formatCurrency(profit)}\n\n` +
    `📅 Отчёт сформирован: ${new Date().toLocaleString('ru-RU')}`;
  
  const keyboard = {
    reply_markup: {
      keyboard: [['🔙 Назад']],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, { parse_mode: 'HTML' }, keyboard);
}

// Настройки
function showSettings(chatId, state) {
  const park = state.park;
  const parkConfig = config.PARKS[park];
  
  const message = `⚙️ <b>Настройки парка ${getParkName(park)}:</b>\n\n` +
    `🏢 Парк: ${getParkName(park)}\n` +
    `👤 Пользователь: ${Object.keys(config.USERS).find(u => config.USERS[u].park === park)}\n` +
    `🏒 Хоккейных автоматов: ${parkConfig.hockeyMachines}\n` +
    `🥊 Боксёрских автоматов: ${parkConfig.boxerMachines}\n\n` +
    `💾 Файл данных: ${config.DATA_SETTINGS.dataFile}\n` +
    `🔄 Резервное копирование: каждые ${config.DATA_SETTINGS.backupInterval / (1000 * 60 * 60)} часов\n\n` +
    `Функции настроек будут добавлены позже.`;
  
  const keyboard = {
    reply_markup: {
      keyboard: [['🔙 Назад']],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, { parse_mode: 'HTML' }, keyboard);
}

// О программе
function showAbout(chatId) {
  const message = `ℹ️ <b>О программе</b>\n\n` +
    `🎢 Система управления парком аттракционов\n` +
    `Версия: 2.0.0\n\n` +
    `📋 <b>Функции:</b>\n` +
    `• Управление сотрудниками\n` +
    `• Планирование смен\n` +
    `• Учёт доходов с автоматов\n` +
    `• Формирование отчётов\n` +
    `• Автоматическое резервное копирование\n\n` +
    `🏢 <b>Парки:</b>\n` +
    `${Object.keys(config.PARKS).map(park => `• ${getParkName(park)}`).join('\n')}\n\n` +
    `🛠️ <b>Технологии:</b>\n` +
    `• Node.js\n` +
    `• node-telegram-bot-api\n` +
    `• JSON для хранения данных`;
  
  const keyboard = {
    reply_markup: {
      keyboard: [['🔙 Назад']],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, { parse_mode: 'HTML' }, keyboard);
}

// Обработка состояний
function handleStates(chatId, text, state) {
  if (!state.currentSection) return;
  
  switch (state.currentSection) {
    case 'employees':
      handleEmployeesStates(chatId, text, state);
      break;
    case 'shifts':
      handleShiftsStates(chatId, text, state);
      break;
    case 'machines':
      handleMachinesStates(chatId, text, state);
      break;
  }
}

// Обработка состояний сотрудников
function handleEmployeesStates(chatId, text, state) {
  if (text === '➕ Добавить сотрудника') {
    state.subState = 'adding_employee';
    bot.sendMessage(chatId, 'Введите имя сотрудника:');
  } else if (text === '🗑️ Удалить сотрудника') {
    const employees = parksData[state.park]?.employees || [];
    if (employees.length === 0) {
      bot.sendMessage(chatId, 'Нет сотрудников для удаления');
      return;
    }
    
    let message = 'Выберите сотрудника для удаления:\n\n';
    employees.forEach((emp, index) => {
      message += `${index + 1}. ${emp}\n`;
    });
    
    state.subState = 'deleting_employee';
    bot.sendMessage(chatId, message);
  } else if (state.subState === 'adding_employee') {
    const park = state.park;
    if (!parksData[park].employees.includes(text)) {
      parksData[park].employees.push(text);
      parksData[park].shifts[text] = Array(7).fill('');
      saveData();
      bot.sendMessage(chatId, `✅ Сотрудник "${text}" добавлен!`);
    } else {
      bot.sendMessage(chatId, '❌ Сотрудник с таким именем уже существует!');
    }
    delete state.subState;
    showEmployeesMenu(chatId, state);
  } else if (state.subState === 'deleting_employee') {
    const park = state.park;
    const employees = parksData[park]?.employees || [];
    const index = parseInt(text) - 1;
    
    if (index >= 0 && index < employees.length) {
      const employeeName = employees[index];
      parksData[park].employees.splice(index, 1);
      delete parksData[park].shifts[employeeName];
      saveData();
      bot.sendMessage(chatId, `✅ Сотрудник "${employeeName}" удалён!`);
    } else {
      bot.sendMessage(chatId, '❌ Неверный номер сотрудника!');
    }
    delete state.subState;
    showEmployeesMenu(chatId, state);
  }
}

// Обработка состояний смен
function handleShiftsStates(chatId, text, state) {
  if (text === '✏️ Редактировать смены') {
    const employees = parksData[state.park]?.employees || [];
    if (employees.length === 0) {
      bot.sendMessage(chatId, 'Нет сотрудников для редактирования смен');
      return;
    }
    
    let message = 'Выберите сотрудника для редактирования смен:\n\n';
    employees.forEach((emp, index) => {
      message += `${index + 1}. ${emp}\n`;
    });
    
    state.subState = 'selecting_employee_for_shifts';
    bot.sendMessage(chatId, message);
  } else if (text === '💰 Расчёт зарплаты') {
    const park = state.park;
    const employees = parksData[park]?.employees || [];
    const shifts = parksData[park]?.shifts || {};
    
    let message = '💰 <b>Расчёт зарплаты:</b>\n\n';
    let totalSalary = 0;
    
    employees.forEach(name => {
      const row = shifts[name] || Array(7).fill('');
      const salary = calculateSalary(name, row);
      totalSalary += salary;
      message += `${name}: ${formatCurrency(salary)}\n`;
    });
    
    message += `\n💵 <b>Общая зарплата: ${formatCurrency(totalSalary)}</b>`;
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } else if (state.subState === 'selecting_employee_for_shifts') {
    const park = state.park;
    const employees = parksData[park]?.employees || [];
    const index = parseInt(text) - 1;
    
    if (index >= 0 && index < employees.length) {
      const employeeName = employees[index];
      state.selectedEmployee = employeeName;
      state.subState = 'editing_shifts';
      
      const shifts = parksData[park]?.shifts?.[employeeName] || Array(7).fill('');
      const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      
      let message = `Редактирование смен для ${employeeName}:\n\n`;
      days.forEach((day, i) => {
        message += `${day}: ${shifts[i] || ''}\n`;
      });
      message += '\nВведите новые значения через запятую (7 значений):';
      
      bot.sendMessage(chatId, message);
    } else {
      bot.sendMessage(chatId, '❌ Неверный номер сотрудника!');
      delete state.subState;
      showShiftsMenu(chatId, state);
    }
  } else if (state.subState === 'editing_shifts') {
    const park = state.park;
    const values = text.split(',').map(v => v.trim());
    
    if (values.length === 7) {
      const employeeName = state.selectedEmployee;
      parksData[park].shifts[employeeName] = values;
      saveData();
      
      bot.sendMessage(chatId, `✅ Смены для ${employeeName} обновлены!`);
      delete state.subState;
      delete state.selectedEmployee;
      showShiftsMenu(chatId, state);
    } else {
      bot.sendMessage(chatId, '❌ Неверный формат! Введите 7 значений через запятую.');
    }
  }
}

// Обработка состояний автоматов
function handleMachinesStates(chatId, text, state) {
  if (text === '➕ Добавить запись') {
    state.subState = 'adding_machine_record';
    bot.sendMessage(chatId, 
      'Введите данные в формате:\n' +
      'тип,дата_с,дата_по,сумма\n\n' +
      'Пример: hockey,2024-01-01,2024-01-07,5000\n' +
      'Типы: hockey, boxer'
    );
  } else if (text === '🗑️ Удалить запись') {
    const machines = parksData[state.park]?.machines || [];
    if (machines.length === 0) {
      bot.sendMessage(chatId, 'Нет записей для удаления');
      return;
    }
    
    let message = 'Выберите запись для удаления:\n\n';
    machines.forEach((entry, index) => {
      const type = entry.type === 'hockey' ? '🏒 Хоккей' : '🥊 Боксёр';
      message += `${index + 1}. ${type} | ${entry.from}-${entry.to} | ${formatCurrency(entry.amount)}\n`;
    });
    
    state.subState = 'deleting_machine_record';
    bot.sendMessage(chatId, message);
  } else if (state.subState === 'adding_machine_record') {
    const parts = text.split(',');
    if (parts.length === 4) {
      const [type, from, to, amount] = parts;
      
      if (type !== 'hockey' && type !== 'boxer') {
        bot.sendMessage(chatId, '❌ Неверный тип! Используйте hockey или boxer');
        return;
      }
      
      if (!validateDate(from) || !validateDate(to)) {
        bot.sendMessage(chatId, '❌ Неверный формат даты! Используйте YYYY-MM-DD');
        return;
      }
      
      const amountNum = parseInt(amount);
      if (isNaN(amountNum) || amountNum < 0) {
        bot.sendMessage(chatId, '❌ Неверная сумма! Введите положительное число');
        return;
      }
      
      const park = state.park;
      parksData[park].machines.push({
        type,
        from,
        to,
        amount: amountNum
      });
      saveData();
      
      const typeName = type === 'hockey' ? '🏒 Хоккей' : '🥊 Боксёр';
      bot.sendMessage(chatId, `✅ Запись добавлена: ${typeName} | ${from}-${to} | ${formatCurrency(amountNum)}`);
      delete state.subState;
      showMachinesMenu(chatId, state);
    } else {
      bot.sendMessage(chatId, '❌ Неверный формат! Используйте: тип,дата_с,дата_по,сумма');
    }
  } else if (state.subState === 'deleting_machine_record') {
    const park = state.park;
    const machines = parksData[park]?.machines || [];
    const index = parseInt(text) - 1;
    
    if (index >= 0 && index < machines.length) {
      const entry = machines[index];
      const typeName = entry.type === 'hockey' ? '🏒 Хоккей' : '🥊 Боксёр';
      
      parksData[park].machines.splice(index, 1);
      saveData();
      
      bot.sendMessage(chatId, `✅ Запись удалена: ${typeName} | ${entry.from}-${entry.to} | ${formatCurrency(entry.amount)}`);
    } else {
      bot.sendMessage(chatId, '❌ Неверный номер записи!');
    }
    delete state.subState;
    showMachinesMenu(chatId, state);
  }
}

// Функция расчёта зарплаты
function calculateSalary(name, row) {
  const total = row.reduce((sum, val) => {
    return sum + (config.SALARY_RATES[val] || 0);
  }, 0);
  return total;
}

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.log('❌ Polling error:', error);
});

bot.on('error', (error) => {
  console.log('❌ Bot error:', error);
});

console.log('🤖 Telegram бот запущен!');
console.log('🏢 Поддерживаемые парки:', Object.keys(config.PARKS).map(park => getParkName(park)).join(', '));
console.log('⚠️ Не забудьте заменить TOKEN на ваш токен бота в config.js'); 