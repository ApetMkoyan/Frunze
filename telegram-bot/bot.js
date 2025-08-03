const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Конфигурация
const TOKEN = '8403584306:AAH4Ur6s46KYaUrjGOk3DRjT4d6AjbqKzj8';
const bot = new TelegramBot(TOKEN, { polling: true });

// Структура данных
const DATA_FILE = './bot-data.json';
let parksData = {};

// Пользователи системы
const users = {
  adminApet: { password: '1234', park: 'parkFrunze' },
  adminNarek: { password: '4321', park: 'parkMorVokzal' },
  adminXunk: { password: '9999', park: 'parkNeptun' },
};

// Состояния пользователей
const userStates = {};

// Загрузка данных
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE);
      parksData = JSON.parse(raw);
    } else {
      parksData = {
        parkFrunze: { employees: [], shifts: {}, machines: [] },
        parkMorVokzal: { employees: [], shifts: {}, machines: [] },
        parkNeptun: { employees: [], shifts: {}, machines: [] }
      };
      saveData();
    }
  } catch (error) {
    console.log('Ошибка загрузки данных:', error);
    parksData = {
      parkFrunze: { employees: [], shifts: {}, machines: [] },
      parkMorVokzal: { employees: [], shifts: {}, machines: [] },
      parkNeptun: { employees: [], shifts: {}, machines: [] }
    };
  }
}

// Сохранение данных
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(parksData, null, 2));
    console.log('Данные сохранены');
  } catch (error) {
    console.log('Ошибка сохранения данных:', error);
  }
}

loadData();

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
    if (users[text]) {
      state.username = text;
      state.step = 'password';
      bot.sendMessage(chatId, 'Введите пароль:');
    } else {
      bot.sendMessage(chatId, '❌ Неверный логин. Попробуйте снова:');
    }
  } else if (state.step === 'password') {
    if (users[state.username] && users[state.username].password === text) {
      state.state = 'logged_in';
      state.park = users[state.username].park;
      delete state.step;
      delete state.username;
      
      bot.sendMessage(chatId, 
        `✅ Успешный вход!\nПарк: ${state.park}`,
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
    `🏢 Парк: ${park}\n\nВыберите действие:`,
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
  
  let message = '👥 Сотрудники:\n\n';
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
  
  bot.sendMessage(chatId, message, keyboard);
  state.currentSection = 'employees';
}

// Меню смен
function showShiftsMenu(chatId, state) {
  const park = state.park;
  const employees = parksData[park]?.employees || [];
  const shifts = parksData[park]?.shifts || {};
  
  let message = '📅 Таблица смен:\n\n';
  
  if (employees.length === 0) {
    message += 'Нет сотрудников для отображения смен';
  } else {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    message += 'Сотрудник | ' + days.join(' | ') + ' | Зарплата\n';
    message += '─'.repeat(50) + '\n';
    
    employees.forEach(name => {
      const row = shifts[name] || Array(7).fill('');
      const salary = calculateSalary(name, row);
      message += `${name} | ${row.join(' | ')} | ${salary}₽\n`;
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
  
  bot.sendMessage(chatId, message, keyboard);
  state.currentSection = 'shifts';
}

// Меню автоматов
function showMachinesMenu(chatId, state) {
  const park = state.park;
  const machines = parksData[park]?.machines || [];
  
  let message = '🎮 Хоккей/Боксёр:\n\n';
  
  if (machines.length === 0) {
    message += 'История пуста';
  } else {
    message += 'Тип | С | По | Сумма\n';
    message += '─'.repeat(30) + '\n';
    
    machines.forEach(entry => {
      const type = entry.type === 'hockey' ? 'Хоккей' : 'Боксёр';
      message += `${type} | ${entry.from} | ${entry.to} | ${entry.amount}₽\n`;
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
  
  bot.sendMessage(chatId, message, keyboard);
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
  
  const message = `📊 Отчёт по парку ${park}:\n\n` +
    `👥 Сотрудников: ${employees.length}\n` +
    `💰 Общая зарплата: ${totalSalary}₽\n` +
    `🏒 Доход с хоккея: ${hockeyIncome}₽\n` +
    `🥊 Доход с боксёра: ${boxerIncome}₽\n` +
    `📈 Общий доход: ${hockeyIncome + boxerIncome}₽\n` +
    `💵 Прибыль: ${hockeyIncome + boxerIncome - totalSalary}₽`;
  
  const keyboard = {
    reply_markup: {
      keyboard: [['🔙 Назад']],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
}

// Настройки
function showSettings(chatId, state) {
  const message = `⚙️ Настройки\n\n` +
    `Парк: ${state.park}\n` +
    `Пользователь: ${Object.keys(users).find(u => users[u].park === state.park)}\n\n` +
    `Функции настроек будут добавлены позже.`;
  
  const keyboard = {
    reply_markup: {
      keyboard: [['🔙 Назад']],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
}

// О программе
function showAbout(chatId) {
  const message = `ℹ️ О программе\n\n` +
    `🎢 Система управления парком аттракционов\n` +
    `Версия: 1.0.0\n\n` +
    `Функции:\n` +
    `• Управление сотрудниками\n` +
    `• Планирование смен\n` +
    `• Учёт доходов с автоматов\n` +
    `• Формирование отчётов\n\n` +
    `Парки: parkFrunze, parkMorVokzal, parkNeptun`;
  
  const keyboard = {
    reply_markup: {
      keyboard: [['🔙 Назад']],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, message, keyboard);
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
    
    let message = '💰 Расчёт зарплаты:\n\n';
    let totalSalary = 0;
    
    employees.forEach(name => {
      const row = shifts[name] || Array(7).fill('');
      const salary = calculateSalary(name, row);
      totalSalary += salary;
      message += `${name}: ${salary}₽\n`;
    });
    
    message += `\n💵 Общая зарплата: ${totalSalary}₽`;
    bot.sendMessage(chatId, message);
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
      const type = entry.type === 'hockey' ? 'Хоккей' : 'Боксёр';
      message += `${index + 1}. ${type} | ${entry.from}-${entry.to} | ${entry.amount}₽\n`;
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
      
      const park = state.park;
      parksData[park].machines.push({
        type,
        from,
        to,
        amount: parseInt(amount)
      });
      saveData();
      
      const typeName = type === 'hockey' ? 'Хоккей' : 'Боксёр';
      bot.sendMessage(chatId, `✅ Запись добавлена: ${typeName} | ${from}-${to} | ${amount}₽`);
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
      const typeName = entry.type === 'hockey' ? 'Хоккей' : 'Боксёр';
      
      parksData[park].machines.splice(index, 1);
      saveData();
      
      bot.sendMessage(chatId, `✅ Запись удалена: ${typeName} | ${entry.from}-${entry.to} | ${entry.amount}₽`);
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
    if (val === '++') return sum + 2000;
    if (val === 'ст') return sum + 1000;
    if (val === 'касса1') return sum + 2500;
    if (val === 'касса2') return sum + 3000;
    if (val === '+') return sum + 1500;
    if (val === '1200') return sum + 1200;
    if (val === '1000') return sum + 1000;
    return sum;
  }, 0);
  return total;
}

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.log('Polling error:', error);
});

bot.on('error', (error) => {
  console.log('Bot error:', error);
});

console.log('🤖 Telegram бот запущен!');
console.log('🏢 Поддерживаемые парки: parkFrunze, parkMorVokzal, parkNeptun');
console.log('⚠️ Не забудьте заменить TOKEN на ваш токен бота'); 