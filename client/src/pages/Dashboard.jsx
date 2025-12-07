import { useEffect, useState } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const socket = io('http://localhost:3050'); 

function Dashboard() {
    const [devices, setDevices] = useState([]);
    const [foodLevels, setFoodLevels] = useState({}); 
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login');

        fetchDevices();

        socket.on('food_level', (data) => {
            console.log('Realtime Update:', data);
            setFoodLevels(prev => ({
                ...prev,
                [data.deviceId]: data.level
            }));
        });

        return () => {
            socket.off('food_level');
        };
    }, []);

    const fetchDevices = async () => {
        try {
            const res = await api.get('/devices');
            setDevices(res.data);
        } catch (err) {
            console.error("Lỗi tải thiết bị:", err);
        }
    };

    const handleFeedNow = async (deviceId) => {
        try {
            await api.post(`/devices/feed-now/${deviceId}`);
            alert('Đã gửi lệnh cho ăn!');
        } catch (err) {
            alert('Lỗi gửi lệnh: ' + err.message);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Quản lý Máy Cho Ăn 🐾</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {devices.map(device => (
                    <div key={device.id} style={{ border: '1px solid #ccc', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        <h3>{device.name}</h3>
                        <p style={{ color: '#666' }}>ID: {device.deviceId}</p>
                        
                        <div style={{ margin: '15px 0', padding: '10px', background: '#e9ecef', borderRadius: '5px' }}>
                            <strong>Mức thức ăn: </strong>
                            <span style={{ color: foodLevels[device.deviceId] < 20 ? 'red' : 'green', fontWeight: 'bold' }}>
                                {foodLevels[device.deviceId] !== undefined ? `${foodLevels[device.deviceId]}%` : 'Đang chờ dữ liệu...'}
                            </span>
                        </div>

                        <button 
                            onClick={() => handleFeedNow(device.deviceId)}
                            style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            🍖 Cho ăn ngay
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;