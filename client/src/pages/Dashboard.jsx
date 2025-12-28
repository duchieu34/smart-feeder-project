import { useEffect, useState } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

// Kết nối Socket tới Backend (đổi port nếu server bạn khác 3050)
const socket = io('http://localhost:3050'); 

function Dashboard() {
    const [devices, setDevices] = useState([]);
    const [foodLevels, setFoodLevels] = useState({}); // Lưu % thức ăn theo deviceId
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Kiểm tra đăng nhập
        const token = localStorage.getItem('token');
        if (!token) navigate('/login');

        // 2. Lấy danh sách thiết bị từ Database thật
        fetchDevices();

        // 3. Lắng nghe sự kiện Realtime từ Backend
        socket.on('food_level', (data) => {
            console.log('⚡ Realtime Update:', data);
            setFoodLevels(prev => ({
                ...prev,
                [data.deviceId]: data.level
            }));
        });

        // 4. Lắng nghe trạng thái Online/Offline (nếu có)
        socket.on('device_status', (data) => {
            console.log('📶 Device Status:', data);
        });

        // Cleanup khi thoát trang
        return () => {
            socket.off('food_level');
            socket.off('device_status');
        };
    }, []);

    const fetchDevices = async () => {
        try {
            const res = await api.get('/devices');
            console.log("Danh sách thiết bị:", res.data);
            setDevices(res.data);
        } catch (err) {
            console.error("Lỗi tải thiết bị:", err);
            // Nếu lỗi 401 Unauthorized thì đá về login
            if (err.response && err.response.status === 401) navigate('/login');
        }
    };

    const handleFeedNow = async (deviceId) => {
        setLoading(true);
        try {
            // Gọi API kích hoạt cho ăn ngay
            await api.post(`/devices/feed-now/${deviceId}`);
            alert(`✅ Đã gửi lệnh cho ăn tới ${deviceId}!`);
        } catch (err) {
            alert('❌ Lỗi gửi lệnh: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

return (
  <div style={{
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #74ebd5, #ACB6E5)',
    padding: '40px 20px',
    fontFamily: 'Segoe UI, sans-serif'
  }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        color: '#2c3e50'
      }}>
        <h1 style={{ fontSize: '2.2rem' }}>🐾 Smart Pet Feeder</h1>
        <button
          onClick={() => { localStorage.clear(); navigate('/login'); }}
          style={{
            padding: '10px 18px',
            background: '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Đăng xuất
        </button>
      </div>

      {/* Danh sách thiết bị */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px'
      }}>
        {devices.map(device => {
          const level = foodLevels[device.deviceId] ?? 0;
          const isLow = level < 20;

          return (
            <div key={device.id} style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 15px 30px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s'
            }}>
              
              {/* Device header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '25px'
              }}>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '1.3rem',
                    color: '#34495e'
                  }}>
                    {device.name}
                  </h2>
                  <span style={{
                    fontSize: '0.85rem',
                    color: '#7f8c8d'
                  }}>
                    ID: {device.deviceId}
                  </span>
                </div>

                <div style={{ fontSize: '2.5rem' }}>
                  🐱
                </div>
              </div>

              {/* Food level */}
              <div style={{ marginBottom: '25px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontWeight: 600
                }}>
                  <span>Lượng thức ăn</span>
                  <span style={{
                    color: isLow ? '#e74c3c' : '#27ae60'
                  }}>
                    {level}%
                  </span>
                </div>

                <div style={{
                  height: '14px',
                  background: '#ecf0f1',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${level}%`,
                    height: '100%',
                    background: isLow
                      ? 'linear-gradient(90deg, #e74c3c, #ff7675)'
                      : 'linear-gradient(90deg, #2ecc71, #1abc9c)',
                    transition: 'width 0.4s'
                  }} />
                </div>

                {isLow && (
                  <div style={{
                    marginTop: '10px',
                    fontSize: '0.85rem',
                    color: '#e74c3c',
                    fontWeight: 600
                  }}>
                    ⚠️ Sắp hết thức ăn
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                onClick={() => handleFeedNow(device.deviceId)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading
                    ? '#bdc3c7'
                    : 'linear-gradient(135deg, #3498db, #2980b9)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 15px rgba(52,152,219,0.4)'
                }}
              >
                {loading ? 'Đang gửi lệnh...' : '🍖 Cho ăn ngay'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

}

export default Dashboard;