import { useNavigate } from "react-router-dom"
import { useState } from "react";
import './register.css'

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async () => {
        setError('');

        if(!email || !password) {
            setError('All fields are required');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            if(!response.ok) {
                setError(data.message || 'Registration failed');
                return;
            }
            navigate('/', {
                state: { successMessage: 'Account created succesfully. You can now log in.'}
            });
        } catch (err) {
            setError('Something went wrong. Please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register">
            <h1 className="r-title">Register here</h1>
            <div>
                <div className="username">
                    <p>Username</p>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div className="email">
                    <p>Email</p>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="password">
                    <p>Password</p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="register-buttons">
                <button onClick={handleRegister} disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
                </button>
                <button onClick={() => navigate('/')}>Return to main page</button>
            </div>
        </div>
    )
}