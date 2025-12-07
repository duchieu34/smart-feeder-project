import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/users/log-in', { email, password });
            
            localStorage.setItem('token', res.data.token);
            alert('Đăng nhập thành công!');
            
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Đăng nhập thất bại');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
            <h2>Đăng Nhập</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
                <input 
                    type="email" placeholder="Email" required 
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{ padding: '10px' }}
                />
                <input 
                    type="password" placeholder="Mật khẩu" required 
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={{ padding: '10px' }}
                />
                <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Đăng nhập
                </button>
            </form>
        </div>
    );
}

export default Login;