const fs = require('fs');

// Данные парка Фрунзе из расписания
const parkFrunzeData = {
  employees: [
    'Даша касса',
    'София касса',
    'Светлана', 
    'Милена',
    'Джафар',
    'Вика',
    'Вика Д.',
    'Алина',
    'Саша ст ',
    'Дмитрий ст',
    'Андрей',
    'Алёна',
    'Кирилл медвед',
    'Роберт',
    'Ксения',
    'Анастасия',
    'Платон',
    'Стас'
  ],
  shifts: {
    'Дарыя': ['', '', '', '', '', '', ''],
    'Света': ['М', '', '', '', '', '', ''],
    'Милена': ['', '', '', '', '', '', ''],
    'Джафар': ['', '', 'М', '', '', '', ''],
    'Вика': ['', '', '', '', '', '', ''],
    'Вика Д.': ['', '', '', '', '', '', ''],
    'Алина': ['', '', '', '', '', '', ''],
    'Саша ст': ['', '', '', '', '', '', ''],
    'Дмитрий ст': ['', '', '', '', '', '', ''],
    'Андрей': ['', '', '', '', '', '', ''],
    'Алёна': ['', '', '', '', '', '', ''],
    'Кирилл медвед': ['', '', '', '', '', '', ''],
    'Роберт': ['', 'Н', '', '', '', '', ''],
    'Ксения': ['', '', '', '', 'Н', '', ''],
    'Анастасия': ['', '', '', '', 'Н', '', ''],
    'Платон': ['', '', '', '', '', '', ''],
    'Стас': ['', '', '', '', '', '', '']
  },
  machines: []
};

// Загрузка существующих данных
function loadData() {
  const DATA_FILE = './bot-data.json';
  let parksData = {};
  
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
    }
  } catch (error) {
    console.log('Ошибка загрузки данных:', error);
    parksData = {
      parkFrunze: { employees: [], shifts: {}, machines: [] },
      parkMorVokzal: { employees: [], shifts: {}, machines: [] },
      parkNeptun: { employees: [], shifts: {}, machines: [] }
    };
  }
  
  return parksData;
}

// Сохранение данных
function saveData(parksData) {
  const DATA_FILE = './bot-data.json';
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(parksData, null, 2));
    console.log('✅ Данные парка Фрунзе успешно загружены!');
  } catch (error) {
    console.log('❌ Ошибка сохранения данных:', error);
  }
}

// Обновление данных парка Фрунзе
function updateParkFrunze() {
  const parksData = loadData();
  
  // Обновляем данные парка Фрунзе
  parksData.parkFrunze = parkFrunzeData;
  
  // Сохраняем обновленные данные
  saveData(parksData);
  
  console.log('📊 Статистика загруженных данных:');
  console.log(`👥 Сотрудников: ${parkFrunzeData.employees.length}`);
  console.log(`📅 Сотрудников с расписанием: ${Object.keys(parkFrunzeData.shifts).filter(name => 
    parkFrunzeData.shifts[name].some(shift => shift !== '')
  ).length}`);
  
  console.log('\n📋 Сотрудники с назначенными сменами:');
  Object.keys(parkFrunzeData.shifts).forEach(name => {
    const shifts = parkFrunzeData.shifts[name];
    const hasShifts = shifts.some(shift => shift !== '');
    if (hasShifts) {
      const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      const shiftInfo = days.map((day, i) => shifts[i] ? `${day}:${shifts[i]}` : '').filter(info => info).join(', ');
      console.log(`  • ${name}: ${shiftInfo}`);
    }
  });
}

// Запуск обновления
console.log('🔄 Загружаем данные парка Фрунзе...');
updateParkFrunze();
console.log('\n🎯 Теперь запустите бота командой: npm start'); 