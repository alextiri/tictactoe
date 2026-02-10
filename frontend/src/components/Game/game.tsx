import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import './game.css'

interface Game {
  id: number;
  player_x_id: number;
  player_o_id: number | null;
  game_code: string;
  current_turn: string;
  board: { cells: string[] };
}

export default function Game() {
    const { id } = useParams<{ id: string }>();
    const [game, setGame] = useState<Game | null>(null);
    const [winner, setWinner] = useState<string | null>(null);
    const [winningPattern, setWinningPattern] = useState<number[] | null>(null);
    const [isDraw, setIsDraw] = useState(false);

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

    const handleCellClick = (index: number) => {
        if(!game || winner) return;

        const cells = [...game.board.cells];
        if(cells[index] !== "") return;

        cells[index] = game.current_turn;

        const result = checkWinner(cells);
        if(Array.isArray(result)) {
            setWinner(game.current_turn);
            setWinningPattern(result);
        } else if(result === "DRAW") {
            setIsDraw(true);
        }

        const nextTurn = game.current_turn === "X" ? "O" : "X";

        setGame({
            ...game,
            board: { cells },
            current_turn: nextTurn
        });
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
            } catch (err: any) {
                console.log(err);
            }
        };

        fetchGame();
    }, [id])

    const checkWinner = (cells: string[]) => {
        for(const pattern of WIN_PATTERNS) {
            const [a, b, c] = pattern;
            if(
                cells[a] &&
                cells[a] === cells[b] &&
                cells[a] === cells[c]
            ) {
                return pattern;
            }
        }

        if(cells.every(cell => cell !== "")) {
            return "DRAW";
        }

        return null;
    }

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
            <button>Return to Main Page</button>
        </div>
    );

}