// client/src/pages/Register.jsx
import { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            alert("⚠️ Mật khẩu xác nhận không khớp!");
            return;
        }

        setIsLoading(true);
        try {
            // Gọi API đăng ký từ Backend
            const res = await api.post('/users/signup', formData);
            
            // Backend trả về message yêu cầu kích hoạt email
            alert('✅ ' + res.data.message);
            
            // Chuyển về trang đăng nhập
            navigate('/login');
        } catch (err) {
            console.error(err);
            alert('❌ Đăng ký thất bại: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', 
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '20px'
        }}>
            <div style={{ 
                background: 'white', padding: '40px', borderRadius: '15px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' 
            }}>
                <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>📝 Đăng Ký Tài Khoản</h2>
                
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
                        type="text" name="fullname" placeholder="Họ và tên" required 
                        value={formData.fullname} onChange={handleChange}
                        style={inputStyle}
                    />
                    <input 
                        type="email" name="email" placeholder="Email" required 
                        value={formData.email} onChange={handleChange}
                        style={inputStyle}
                    />
                    <input 
                        type="password" name="password" placeholder="Mật khẩu" required 
                        value={formData.password} onChange={handleChange}
                        style={inputStyle}
                    />
                    <input 
                        type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" required 
                        value={formData.confirmPassword} onChange={handleChange}
                        style={inputStyle}
                    />
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        style={{ 
                            padding: '12px', background: '#27ae60', color: 'white', 
                            border: 'none', borderRadius: '8px', cursor: 'pointer', 
                            fontWeight: 'bold', fontSize: '16px', marginTop: '10px',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                    Đã có tài khoản? <Link to="/login" style={{ color: '#3498db', fontWeight: 'bold' }}>Đăng nhập tại đây</Link>
                </div>
            </div>
        </div>
    );
}

const inputStyle = {
    padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px'
};

export default Register;