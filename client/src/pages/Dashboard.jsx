import { useState } from 'react';
import './Dashboard.css';

function Dashboard() {
    // 1 MÁY DUY NHẤT (mock)
    const device = {
        name: 'Máy cho ăn phòng khách',
        deviceId: 'FEEDER_01',
        foodLevel: 65
    };

    const [feedAmount, setFeedAmount] = useState(1);
    const [scheduleTime, setScheduleTime] = useState('');

    return (
        <div className="dashboard">
            <h1 className="title">🐾 Smart Pet Feeder</h1>

            <div className="device-card single">
                <h2>{device.name}</h2>
                <p className="device-id">ID: {device.deviceId}</p>

                {/* Food level */}
                <div className="food-section">
                    <label>Mức thức ăn</label>
                    <div className="progress">
                        <div
                            className={`progress-bar ${
                                device.foodLevel < 20 ? 'low' : ''
                            }`}
                            style={{ width: `${device.foodLevel}%` }}
                        />
                    </div>
                    <strong>{device.foodLevel}%</strong>
                </div>

                {/* Feed amount */}
                <div className="control">
                    <label>Lượng thức ăn</label>
                    <select
                        value={feedAmount}
                        onChange={(e) => setFeedAmount(e.target.value)}
                    >
                        <option value={1}>1 phần</option>
                        <option value={2}>2 phần</option>
                        <option value={3}>3 phần</option>
                    </select>
                </div>

                {/* Schedule */}
                <div className="control">
                    <label>Hẹn giờ cho ăn</label>
                    <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                    />
                </div>

                <button
                    className="btn feed"
                    onClick={() =>
                        alert(`🍖 Cho ăn ngay\nLượng: ${feedAmount} phần`)
                    }
                >
                    🍖 Cho ăn ngay
                </button>

                <button
                    className="btn schedule"
                    onClick={() =>
                        alert(`⏰ Hẹn giờ: ${scheduleTime || 'chưa chọn'}`)
                    }
                >
                    ⏰ Hẹn giờ cho ăn
                </button>
            </div>
        </div>
    );
}

export default Dashboard;
