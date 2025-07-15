import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './Components/LoginPage/LoginPage';
import ShiftTable from './Components/ShiftTable/ShiftTable';
import Employees from './Components/Employes/Employes';
import Home from './Components/HomePage/HomePage';
import Reports from './Components/Reports/Reports';
import Settings from './Components/Settings/Settings';
import About from './Components/About/About';
import './App.css';

function App() {


  const [loggedInPark, setLoggedInPark] = useState(() => {
    return localStorage.getItem('loggedInPark');
  });


  const handleLogin = (parkName) => {
    setLoggedInPark(parkName);
    localStorage.setItem('loggedInPark', parkName);
  };

  const getLocalEmployees = () => {
    const saved = localStorage.getItem(`${loggedInPark}_employees`);
    return saved ? JSON.parse(saved) : [];
  };

  const [employees, setEmployees] = useState([]);

  React.useEffect(() => {
    if (loggedInPark) {
      setEmployees(getLocalEmployees());
    }
  }, [loggedInPark]);

  React.useEffect(() => {
    if (loggedInPark) {
      localStorage.setItem(`${loggedInPark}_employees`, JSON.stringify(employees));
    }
  }, [employees, loggedInPark]);

  if (!loggedInPark) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="App">
        <header className="header">
          <h1>Парк Аттракционов ВОЛНА</h1>
          <h2>{loggedInPark}</h2>
          <button onClick={() => {
            localStorage.removeItem('loggedInPark');
            setLoggedInPark(null);
          }}>Выйти</button>

        </header>

        <nav className="menu">
          <Link to="/">Главная</Link>
          <Link to="/shift-table">Смены</Link>
          <Link to="/employees">Сотрудники</Link>
          <Link to="/reports">Отчёты</Link>
          <Link to="/settings">Настройки</Link>
        </nav>

        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/shift-table"
              element={<ShiftTable employees={employees} park={loggedInPark} />}
            />
            <Route
              path="/employees"
              element={<Employees employees={employees} setEmployees={setEmployees} park={loggedInPark} />}
            />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;