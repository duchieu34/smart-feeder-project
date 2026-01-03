import { useState, useEffect } from 'react';
import api from '../services/api';

function ScheduleManager({ deviceId }) {
    const [schedules, setSchedules] = useState([]);
    const [time, setTime] = useState('07:00'); // Mặc định 7h sáng
    const [amount, setAmount] = useState(50);  // Mặc định 50g
    const [loading, setLoading] = useState(false);

    // 1. Tải danh sách lịch khi mở
    useEffect(() => {
        if (deviceId) loadSchedules();
    }, [deviceId]);

    const loadSchedules = async () => {
        try {
            const res = await api.getSchedules(deviceId);
            // Lọc chỉ lấy lịch của máy hiện tại (Do API backend đang trả về tất cả)
            const mySchedules = res.data.filter(s => s.deviceId === deviceId || s.device?.deviceId === deviceId);
            setSchedules(mySchedules);
        } catch (err) {
            console.error("Lỗi tải lịch:", err);
        }
    };

    // 2. Hàm chuyển giờ (HH:MM) sang Cron (Min Hour * * *)
    const timeToCron = (timeStr) => {
        const [hour, minute] = timeStr.split(':');
        return `${minute} ${hour} * * *`; // Ví dụ: "30 8 * * *"
    };

    // 3. Hàm chuyển Cron sang giờ để hiển thị
    const cronToTime = (cronStr) => {
        const parts = cronStr.split(' ');
        if (parts.length < 2) return "??:??";
        const minute = parts[0].padStart(2, '0');
        const hour = parts[1].padStart(2, '0');
        return `${hour}:${minute}`;
    };

    // 4. Xử lý Thêm lịch
    const handleAdd = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const cronFormat = timeToCron(time);
            await api.createSchedule(deviceId, {
                deviceId: deviceId, // Gửi chuỗi ESP8266-xxx
                timeCron: cronFormat,
                amount: parseInt(amount)
            });
            alert('✅ Đã đặt lịch thành công!');
            loadSchedules(); // Tải lại danh sách
        } catch (err) {
            alert('❌ Lỗi: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    // 5. Xử lý Xóa lịch
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa lịch này?")) return;
        try {
            await api.deleteSchedule(id);
            loadSchedules();
        } catch (err) {
            alert('Lỗi xóa lịch');
        }
    };

    return (
        <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '15px' }}>
            <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
                📅 Lịch trình cho ăn tự động
            </h3>

            {/* Form Thêm Lịch */}
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'end' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Giờ ăn:</label>
                    <input 
                        type="time" 
                        value={time} 
                        onChange={e => setTime(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                        required
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Lượng (g):</label>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', width: '80px' }}
                        min="1"
                        required
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ 
                        padding: '10px 20px', 
                        background: '#27ae60', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? 'Đang lưu...' : '➕ Thêm lịch'}
                </button>
            </form>

            {/* Danh sách lịch */}
            {schedules.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#7f8c8d' }}>Chưa có lịch nào được đặt.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {schedules.map(sch => (
                        <div key={sch.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            background: 'white',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                            <div>
                                <strong style={{ fontSize: '1.2rem', color: '#2980b9' }}>
                                    ⏰ {cronToTime(sch.timeCron)}
                                </strong>
                                <span style={{ marginLeft: '15px', color: '#7f8c8d' }}>
                                    🥣 {sch.amount} gram
                                </span>
                            </div>
                            <button 
                                onClick={() => handleDelete(sch.id)}
                                style={{
                                    background: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    padding: '5px 10px',
                                    cursor: 'pointer'
                                }}
                            >
                                🗑 Xóa
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ScheduleManager;