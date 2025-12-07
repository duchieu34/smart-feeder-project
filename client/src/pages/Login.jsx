import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/users/log-in', { email, password });
            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.error || 'Đăng nhập thất bại');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Đăng Nhập</h2>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="example@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn">
                        Đăng nhập
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
