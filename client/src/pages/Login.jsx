import { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Gọi API thật từ Backend
            const res = await api.post('/users/login', { email, password });
            
            // Lưu token thật
            localStorage.setItem('token', res.data.token);
            if (res.data.user) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
            }
            
            alert('Đăng nhập thành công!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Đăng nhập thất bại. Kiểm tra lại email/pass.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', 
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
        }}>
            <div style={{ 
                background: 'white', padding: '40px', borderRadius: '15px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '350px' 
            }}>
                <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>🔐 Đăng Nhập</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
                        type="email" placeholder="Email" required 
                        value={email} onChange={e => setEmail(e.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
                    />
                    <input 
                        type="password" placeholder="Mật khẩu" required 
                        value={password} onChange={e => setPassword(e.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        style={{ 
                            padding: '12px', background: '#3498db', color: 'white', 
                            border: 'none', borderRadius: '8px', cursor: 'pointer', 
                            fontWeight: 'bold', fontSize: '16px' 
                        }}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                    Chưa có tài khoản? <Link to="/register" style={{ color: '#3498db', fontWeight: 'bold' }}>Đăng ký ngay</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;