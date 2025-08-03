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
      parkFrunze: { employees: [], shifts: {}, machines: [] },
      parkMorVokzal: { employees: [], shifts: {}, machines: [] },
      parkNeptun: { employees: [], shifts: {}, machines: [] }
    };
    saveData();
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(parksData, null, 2));
}

loadData();

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

app.get('/employees/:park', (req, res) => {
  const park = req.params.park;
  res.json(parksData[park]?.employees || []);
});

app.post('/employees/:park', (req, res) => {
  const park = req.params.park;
  const { name } = req.body;
  if (!parksData[park].employees.includes(name)) {
    parksData[park].employees.push(name);
    parksData[park].shifts[name] = Array(7).fill('');
    saveData();
  }
  res.json({ success: true });
});

app.delete('/employees/:park/:name', (req, res) => {
  const { park, name } = req.params;
  parksData[park].employees = parksData[park].employees.filter(n => n !== name);
  delete parksData[park].shifts[name];
  saveData();
  res.json({ success: true });
});

app.get('/shifts/:park', (req, res) => {
  const park = req.params.park;
  res.json(parksData[park]?.shifts || {});
});

app.post('/shifts/:park', (req, res) => {
  const park = req.params.park;
  const { shifts } = req.body;
  parksData[park].shifts = shifts;
  saveData();
  res.json({ success: true });
});

// >>> МАШИНЫ: сохранение и история
app.post('/machines/:park/history', (req, res) => {
  const park = req.params.park;
  const { from, to, hockeyAmount, boxerAmount } = req.body;

  if (!parksData[park].machines) parksData[park].machines = [];

  if (hockeyAmount) {
    parksData[park].machines.push({ type: 'hockey', from, to, amount: hockeyAmount });
  }

  if (boxerAmount) {
    parksData[park].machines.push({ type: 'boxer', from, to, amount: boxerAmount });
  }

  saveData();
  res.json({ success: true });
});

app.get('/machines/:park/history', (req, res) => {
  const park = req.params.park;
  res.json(parksData[park]?.machines || []);
});

app.get('/', (req, res) => {
  res.send('Сервер работает. Используйте API через клиентское приложение.');
});

app.delete('/machines/:park/history/:index', (req, res) => {
  const park = req.params.park;
  const index = parseInt(req.params.index);

  if (!data.machines[park] || !data.machines[park].history) {
    return res.status(404).json({ message: 'История не найдена' });
  }

  data.machines[park].history.splice(index, 1);
  saveData();
  res.json({ message: 'Удалено' });
});
app.listen(PORT, () => {
  console.log(`🚀 Сервер работает на http://localhost:${PORT}`);
});