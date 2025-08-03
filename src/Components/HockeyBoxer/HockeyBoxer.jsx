import React, { useState, useEffect } from 'react';
import './HockeyBoxer.css';

const HockeyBoxer = ({ park }) => {
    const isFrunze = park === 'parkFrunze';
    const hockeyCount = isFrunze ? 5 : 1;

    const [hockeyValues, setHockeyValues] = useState(Array(hockeyCount).fill(''));
    const [boxerValue, setBoxerValue] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (park) {
            fetch(`http://localhost:4000/machines/${park}/history`)
                .then(res => res.json())
                .then(setHistory);
        }
    }, [park]);

    const handleHockeyChange = (index, value) => {
        const newValues = [...hockeyValues];
        newValues[index] = value;
        setHockeyValues(newValues);
    };

    const calculateHockeyTotal = () => {
        return hockeyValues.reduce((sum, val) => sum + Number(val || 0), 0);
    };
    const handleDelete = async (index) => {
        const res = await fetch(`http://localhost:4000/machines/${park}/history/${index}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            const updated = await fetch(`http://localhost:4000/machines/${park}/history`).then(r => r.json());
            setHistory(updated);
        } else {
            alert('Не удалось удалить запись');
        }
    };
    const handleSave = async () => {
        if (!fromDate || !toDate) {
            alert('Выберите дату "С" и "По"');
            return;
        }

        const hockeyAmount = calculateHockeyTotal();
        const boxerAmount = Number(boxerValue || 0);

        const payload = {
            from: fromDate,
            to: toDate,
            hockeyAmount,
            boxerAmount,
        };

        const res = await fetch(`http://localhost:4000/machines/${park}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            const updated = await fetch(`http://localhost:4000/machines/${park}/history`).then(r => r.json());
            setHistory(updated);
            setHockeyValues(Array(hockeyCount).fill(''));
            setBoxerValue('');
            setFromDate('');
            setToDate('');
        } else {
            alert('Ошибка сохранения данных');
        }
    };

    return (
        <div className="hockey-boxer">
            <h2>Учёт Хоккей и Боксёр</h2>

            <div className="date-inputs">
                <label>С даты:
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                </label>
                <label>По дату:
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                </label>
            </div>

            <div className="hockey-section">
                <h3>Хоккей</h3>
                {hockeyValues.map((val, idx) => (
                    <div key={idx}>
                        Аппарат {idx + 1}: <input type="number" value={val} onChange={(e) => handleHockeyChange(idx, e.target.value)} />
                    </div>
                ))}
                <div className="total">Общая сумма: {calculateHockeyTotal()} ₽</div>
            </div>

            <div className="boxer-section">
                <h3>Боксёр</h3>
                <label>Сумма:
                    <input type="number" value={boxerValue} onChange={e => setBoxerValue(e.target.value)} />
                </label>
            </div>

            <button onClick={handleSave}>Сохранить</button>

            <div className="history-table">
                <h3>История</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Тип</th>
                            <th>С</th>
                            <th>По</th>
                            <th>Сумма</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((entry, idx) => (
                            <tr key={idx}>
                                <td>{entry.type === 'hockey' ? 'Хоккей' : 'Боксёр'}</td>
                                <td>{entry.from}</td>
                                <td>{entry.to}</td>
                                <td>{entry.amount} ₽</td>
                                <td>
                                    <button onClick={() => handleDelete(idx)}>Удалить</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HockeyBoxer;