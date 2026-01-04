import { useEffect, useState } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import ScheduleManager from './ScheduleManager';
import FeedingChart from './FeedingChart';
const socket = io('http://localhost:3050'); 

function Dashboard() {
    const [devices, setDevices] = useState([]);
    const [realtimeData, setRealtimeData] = useState({}); 
    const [loadingDevices, setLoadingDevices] = useState({});
    // Lưu mức mong muốn (Target) cho từng thiết bị
    const [targetLevels, setTargetLevels] = useState({}); 

    const navigate = useNavigate();
    const BOWL_CAPACITY = 300; // Dung tích tối đa của bát
    const PRESETS = [50, 100, 150, 200]; // Các mức chọn nhanh

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login');

        fetchDevices();

        socket.on('food_level', (data) => {
            setRealtimeData(prev => ({
                ...prev,
                [data.deviceId]: { weight: data.weight } 
            }));
        });

        socket.on('feed_callback', (data) => {
            // Tắt loading cho thiết bị đó
            setLoadingDevices(prev => ({ ...prev, [data.deviceId]: false }));

            // Hiện thông báo kết quả
            if (data.status === 'success') {
                alert(`✅ THÀNH CÔNG: ${data.message}`);
            } else {
                alert(`❌ THẤT BẠI: ${data.message}`);
            }
        });

        return () => {
            socket.off('food_level');
            socket.off('feed_callback');
        };
    }, []);

    const fetchDevices = async () => {
        try {
            const res = await api.get('/devices');
            setDevices(res.data);
            // Mặc định chọn mức 100g cho tất cả thiết bị
            const initialTargets = {};
            res.data.forEach(d => initialTargets[d.deviceId] = 100);
            setTargetLevels(initialTargets);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) navigate('/login');
        }
    };

    const handleTargetChange = (deviceId, value) => {
        setTargetLevels(prev => ({ ...prev, [deviceId]: Number(value) }));
    };

    const handleFeedNow = async (deviceId, currentWeight) => {
        const target = targetLevels[deviceId] || 100;

        // Logic kiểm tra phía Frontend để tránh spam lệnh vô nghĩa
        if (target <= currentWeight) {
            alert(`⚠️ Bát đang có ${Math.round(currentWeight)}g, đã nhiều hơn mức bạn chọn (${target}g). Không cần đổ thêm!`);
            return;
        }

        setLoadingDevices(prev => ({ ...prev, [deviceId]: true }));
        try {
            // Gửi target (mức mong muốn) xuống Backend
            await api.post(`/devices/feed-now/${deviceId}`, { amount: target });
            console.log("Đã gửi lệnh, đang chờ phản hồi từ thiết bị...");
            setTimeout(() => {
                setLoadingDevices(prev => {
                    if (prev[deviceId] === true) {
                        alert(`⚠️ Hết thời gian chờ phản hồi từ ${deviceId}. Vui lòng kiểm tra lại thiết bị.`);
                        return { ...prev, [deviceId]: false };
                    }
                    return prev;
                });
            }, 25000);
        } catch (err) {
            alert('❌ Lỗi gửi lệnh: ' + (err.response?.data?.error || err.message));
            setLoadingDevices(prev => ({ ...prev, [deviceId]: false }));
        } 
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f4f7f6', padding: '40px 20px', fontFamily: 'Segoe UI, sans-serif' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: '#2c3e50', margin: 0, fontWeight: 700 }}>🍽️ Quản lý Bữa ăn</h1>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ padding: '8px 16px', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                        Đăng xuất
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' }}>
                    {devices.map(device => {
                        const currentData = realtimeData[device.deviceId] || { weight: 0 };
                        const weight = Math.round(currentData.weight); 
                        const bowlPercentage = Math.min((weight / BOWL_CAPACITY) * 100, 100);
                        const currentTarget = targetLevels[device.deviceId] || 100;
                        
                        // Kiểm tra xem bát đã đủ lượng mong muốn chưa
                        const isEnough = weight >= currentTarget;

                        const isBusy = loadingDevices[device.deviceId]; // Kiểm tra xem máy này có đang bận không
                        return (
                            <div key={device.id} style={{ background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                                
                                {/* Header thiết bị */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#333' }}>{device.name}</h2>
                                        <span style={{ fontSize: '0.85rem', color: '#888' }}>{device.deviceId}</span>
                                    </div>
                                    <div style={{ fontSize: '2rem' }}>🐱</div>
                                </div>

                                {/* Màn hình hiển thị số Gam */}
                                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                    <div style={{ fontSize: '3.5rem', fontWeight: '800', color: '#2d3436', lineHeight: 1 }}>
                                        {weight}<span style={{ fontSize: '1.5rem', color: '#b2bec3', fontWeight: 500 }}>g</span>
                                    </div>
                                    <div style={{ color: weight < 10 ? '#27ae60' : '#e67e22', fontWeight: 600, marginTop: '8px' }}>
                                        {weight < 10 ? "✨ Đĩa đang trống" : "🍖 Đang có thức ăn"}
                                    </div>
                                </div>

                                {/* Thanh hiển thị trạng thái bát */}
                                <div style={{ marginBottom: '35px' }}>
                                    <div style={{ height: '10px', background: '#ecf0f1', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                                        <div style={{ 
                                            width: `${bowlPercentage}%`, 
                                            height: '100%', 
                                            background: 'linear-gradient(90deg, #3498db, #2980b9)',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                </div>

                                {/* KHU VỰC CHỌN MỨC (Thay thế slider) */}
                                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '15px', fontWeight: 700, fontSize: '0.95rem', color: '#555' }}>
                                        🎯 Cài đặt mức thức ăn mong muốn:
                                    </label>
                                    
                                    {/* Hàng nút bấm chọn nhanh */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '15px' }}>
                                        {PRESETS.map(val => (
                                            <button 
                                                key={val}
                                                onClick={() => handleTargetChange(device.deviceId, val)}
                                                style={{
                                                    padding: '10px 5px',
                                                    borderRadius: '8px',
                                                    border: currentTarget === val ? '2px solid #3498db' : '1px solid #e0e0e0',
                                                    background: currentTarget === val ? '#ebf5fb' : '#fff',
                                                    color: currentTarget === val ? '#2980b9' : '#666',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {val}g
                                            </button>
                                        ))}
                                    </div>

                                    {/* Ô nhập thủ công (nếu muốn số lẻ) */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <span style={{fontSize: '0.9rem', color: '#777'}}>Hoặc nhập:</span>
                                        <input 
                                            type="number" 
                                            value={currentTarget}
                                            onChange={(e) => handleTargetChange(device.deviceId, e.target.value)}
                                            style={{ 
                                                width: '80px', padding: '8px', borderRadius: '6px', 
                                                border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' 
                                            }}
                                        />
                                        <span style={{fontSize: '0.9rem', color: '#777'}}>gam</span>
                                    </div>

                                    {/* Nút hành động */}
                                    <button
                                        onClick={() => handleFeedNow(device.deviceId, weight)}
                                        disabled={isBusy || isEnough} // Khóa nút khi đang bận
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            // Đổi màu xám khi đang bận
                                            background: isBusy ? '#95a5a6' : (isEnough ? '#bdc3c7' : 'linear-gradient(135deg, #2ecc71, #27ae60)'),
                                            color: '#fff', 
                                            border: 'none', borderRadius: '12px',
                                            fontSize: '1.1rem', fontWeight: 700,
                                            cursor: (isBusy || isEnough) ? 'not-allowed' : 'pointer',
                                            opacity: isBusy ? 0.8 : 1
                                        }}
                                    >
                                        {isBusy ? '⏳ Đang cho ăn... (Vui lòng đợi)' : (
                                            isEnough ? `✅ Bát đã đủ (> ${currentTarget}g)` : `🚀 Làm đầy đến ${currentTarget}g`
                                        )}
                                    </button>
                                </div>
                                <div style={{ marginTop: '30px' }}>
                                    <FeedingChart deviceId={device.deviceId} />
                                </div>
                                
                                <div style={{ marginTop: '20px' }}>
                                    <ScheduleManager deviceId={device.deviceId} />
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;