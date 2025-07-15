const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const DATA_FILE = './data.json';

let parksData = {};

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE);
    parksData = JSON.parse(raw);
  } else {
    parksData = {
      parkFrunze: { employees: [], shifts: {} },
      parkMorVokzal: { employees: [], shifts: {} },
      parkNeptun: { employees: [], shifts: {} },
    };
    saveData();
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(parksData, null, 2));
}

// Загрузить данные при запуске
loadData();

// Пользователи и парки
const users = {
  adminApet: { password: '1234', park: 'parkFrunze' },
  adminNarek: { password: '4321', park: 'parkMorVokzal' },
  adminXunk: { password: '9999', park: 'parkNeptun' },
};

app.post('/login', (req, res) => {
  const { login, password } = req.body;
  const user = users[login];
  if (user && user.password === password) {
    res.json({ success: true, park: user.park });
  } else {
    res.status(401).json({ success: false });
  }
});

// Получение сотрудников
app.get('/employees/:park', (req, res) => {
  const park = req.params.park;
  res.json(parksData[park]?.employees || []);
});

// Добавление сотрудника
app.post('/employees/:park', (req, res) => {
  const park = req.params.park;
  const { name } = req.body;

  if (!name || !park) return res.status(400).json({ success: false });

  if (!parksData[park].employees.includes(name)) {
    parksData[park].employees.push(name);
    parksData[park].shifts[name] = Array(7).fill('');
    saveData();
  }

  res.json({ success: true });
});

// Удаление сотрудника
app.delete('/employees/:park/:name', (req, res) => {
  const { park, name } = req.params;
  parksData[park].employees = parksData[park].employees.filter(n => n !== name);
  delete parksData[park].shifts[name];
  saveData();
  res.json({ success: true });
});

// Получение смен
app.get('/shifts/:park', (req, res) => {
  const park = req.params.park;
  res.json(parksData[park]?.shifts || {});
});

// Сохранение смен
app.post('/shifts/:park', (req, res) => {
  const park = req.params.park;
  const { shifts } = req.body;
  parksData[park].shifts = shifts;
  saveData();
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.send('Сервер работает. Используйте API через клиентское приложение.');
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});