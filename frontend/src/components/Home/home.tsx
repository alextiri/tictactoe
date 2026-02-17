import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './home.css'

export default function Home() {
    const [mail, setMail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [flashMessage, setFlashMessage] = useState<string | null>(null);

    useEffect(() => {
        const state = location.state as { successMessage?: string } | null;
        if (state?.successMessage) {
            setFlashMessage(state.successMessage);
        }
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/profile');
        }
    }, []);

    const clearFlash = () => setFlashMessage(null);

    const handleLogin = async() => {
        clearFlash();
        try {
            setLoading(true);
            setErrorMessage(null);

            const res = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: mail,
                    password: password
                })
            });

            const data = await res.json();
            if(!res.ok) {
                setErrorMessage(data.message || 'Login failed');
                setLoading(false);
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/profile');
        } catch(err) {
            console.log('Login error:', err);
            setErrorMessage('Server error: Please try again');
        } finally {
            setLoading(false);
        }
    }

    return (
    <div className='home'>
        <h1>TicTacToes</h1>
        <h2>(mmm toes...)</h2>
        <p>Login here</p>
        <div className='login-card'>
            <div className='login-comp'>
                <p>E-mail</p>
                <input
                type='email'
                onChange={(e) => setMail(e.target.value)}></input>
            </div>
            <div className='login-comp'>
                <p>Password</p>
                <input
                type='password'
                onChange={(e) => setPassword(e.target.value)}>
                </input>
            </div>
            <div className='login-buttons'>
                <button onClick={handleLogin}>{loading ? 'Logging in...' : 'Login'}</button>
                <button onClick={() => navigate('/register')}>Register</button>
            </div>
        </div>
        {errorMessage && (
            <p className="error-message">{errorMessage}</p>
        )}
        {flashMessage && (
            <p className='success-message'>{flashMessage}</p>
        )}
    </div>
    )
}