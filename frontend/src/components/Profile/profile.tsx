import { useNavigate } from "react-router-dom"
import { useState } from "react";
import './profile.css'

export default function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    }
    
    const handleNewGame = async () => {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        if(!token) {
            setError('You must be logged in to create a game');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if(!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to create game");
            }

            const data = await res.json();
            console.log("New game created:", data.game);

            navigate(`/game/${data.game.id}`)
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }


    return (
        <div>
            <h1>This is your profile</h1>
            <p>Game 1</p>
            <p>Game 2</p>
            <p>Game 3</p>
            <button onClick={handleNewGame}>
                {loading ? "Creating..." : "New game"}
            </button>
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
}