import React, { useState, useEffect } from 'react';
import './ShiftTable.css';

const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const ShiftTable = ({ park }) => {
  const [shifts, setShifts] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:4000/employees/${park}`)
      .then(res => res.json())
      .then(setEmployees);

    fetch(`http://localhost:4000/shifts/${park}`)
      .then(res => res.json())
      .then(setShifts);
  }, [park]);

  useEffect(() => {
    // Удаляем смены для удалённых сотрудников
    const filteredShifts = {};
    employees.forEach(name => {
      filteredShifts[name] = shifts[name] || Array(7).fill('');
    });
    setShifts(filteredShifts);
  }, [employees]);

  const handleChange = (name, dayIdx, value) => {
    const updated = {
      ...shifts,
      [name]: shifts[name].map((s, i) => (i === dayIdx ? value : s)),
    };
    setShifts(updated);
  };

  const calculateSalary = (row) => {
    return row.reduce((sum, val) => {
      if (val === '++') return sum + 2000;
      if (val === 'ст') return sum + 1000;
      if (val === 'касса1') return sum + 2500;
      if (val === 'касса2') return sum + 3000;
      if (val === '+') return sum + 1500;
      if (val === '1200') return sum + 1200;
      if (val === '1000') return sum + 1000;
      return sum;
    }, 0);
  };

  const handleSave = async () => {
    await fetch(`http://localhost:4000/shifts/${park}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shifts }),
    });
    setEditMode(false);
  };

  return (
    <div className='bodyTable'>
      <h2>Таблица смен</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Сотрудник</th>
            {days.map((d, i) => <th key={i}>{d}</th>)}
            <th>Зарплата</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((name, i) => (
            <tr key={name}>
              <td>{i + 1}</td>
              <td>{name}</td>
              {shifts[name]?.map((s, j) => (
                <td key={j}>
                  {editMode ? (
                    <input
                      value={s}
                      onChange={(e) => handleChange(name, j, e.target.value)}
                      style={{ width: '50px' }}
                    />
                  ) : s}
                </td>
              ))}
              <td>{calculateSalary(shifts[name] || [])}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Сохранить' : 'Редактировать'}
        </button>
        {editMode && <button onClick={handleSave} style={{ marginLeft: 10 }}>Сохранить в базу</button>}
      </div>
    </div>
  );
};

export default ShiftTable;