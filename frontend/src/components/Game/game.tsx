import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './game.css'

interface Game {
  id: number;
  player_x_id: number;
  player_o_id: number | null;
  game_code: string;
  current_turn: string;
  board: { cells: string[] };
  status: "ongoing" | "finished";
  winner: string | null;
  winningPattern: number[] | null;
}

export default function Game() {
    const { id } = useParams<{ id: string }>();
    const [game, setGame] = useState<Game | null>(null);
    const [winner, setWinner] = useState<string | null>(null);
    const [winningPattern, setWinningPattern] = useState<number[] | null>(null);
    const [isDraw, setIsDraw] = useState(false);
    const navigate = useNavigate();

    const WIN_PATTERNS = [
        [0,1,2],
        [3,4,5],
        [6,7,8],
        [0,3,6],
        [1,4,7],
        [2,5,8],
        [0,4,8],
        [2,4,6],
    ];

    const handleCellClick = async (index: number) => {
        if(!game || winner) return;
        
        const token = localStorage.getItem("token");
        if(!token) return;

        try {
            const res = await fetch(`http://localhost:3000/api/games/${game.id}/move`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ square: index })
            });

            if(!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to make a move");
            }

            const data = await res.json();
            setGame(data.game);
            if(data.game.status === "finished") {
                if (data.game.winner) {
                    setWinner(data.game.winner);
                    setWinningPattern(data.game.winningPattern);
                } else {
                    setIsDraw(true);
                }
            }
        } catch(err: any) {
            console.log(err.message);
        }
    }

    useEffect(() => {
        const fetchGame = async () => {
            try {
                const token = localStorage.getItem("token");
                if(!token) return;
                
                const res = await fetch(`http://localhost:3000/api/games/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if(!res.ok) throw new Error("Failed to load game")

                const data = await res.json();
                setGame(data.game);
                if (data.game.status === "finished") {
                    if (data.game.winner) {
                        setWinner(data.game.winner);
                        setWinningPattern(data.game.winningPattern);
                    } else {
                        setIsDraw(true);
                    }
                }
            } catch (err: any) {
                console.log(err);
            }
        };

        fetchGame();
    }, [id])

    if (!game) return <p>Loading game...</p>;

    return (
        <div className="game-container">
            <h1>Game Code: {game.game_code}</h1>

            {!winner && !isDraw && <p>Current turn: {game.current_turn}</p>}
            {winner && <h2 className="winner-text">Winner: {winner}</h2>}
            {isDraw && <h2 className="draw-text">It's a draw!</h2>}

            <div className={`board ${winner || isDraw ? "game-over" : ""}`}>
            
            {winningPattern && (
                <div
                className={`win-line pattern-${WIN_PATTERNS.findIndex(
                    p => JSON.stringify(p) === JSON.stringify(winningPattern)
                )}`}
                />
            )}

            {game.board.cells.map((cell, idx) => (
                <div
                key={idx}
                className={`cell ${
                    winningPattern?.includes(idx) ? "win-cell" : ""
                }`}
                onClick={() => handleCellClick(idx)}
                >
                {cell}
                </div>
            ))}
            </div>
            <button onClick={() => navigate('/profile') }>Return to Main Page</button>
        </div>
    );

}