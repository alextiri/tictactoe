import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './game.css'
import { URLS } from "../../config/utils";
import BubbleBackground from "../BubbleBackground";

interface Game {
    id: number;
    playerXId: number;
    playerOId: number | null;
    playerXUsername: string;
    playerOUsername: string | null;
    moves: Move[];
    gameCode: string;
    currentTurn: string;
    board: string[];
    status: "ongoing" | "finished";
    winner: string | null;
    winningPattern: number[] | null;
}

interface Move {
    moveNumber: number;
    playerId: number;
    symbol: string;
    square: number;
}

export default function Game() {
    const { id } = useParams<{ id: string }>();
    const [game, setGame] = useState<Game | null>(null);
    const [winner, setWinner] = useState<string | null>(null);
    const [winningPattern, setWinningPattern] = useState<number[] | null>(null);
    const [isDraw, setIsDraw] = useState(false);
    const [errMessage, setErrorMessage] = useState('');
    const [moveLoading, setMoveLoading] = useState(false);
    const navigate = useNavigate();

    const handleCellClick = async (index: number) => {
        setErrorMessage('');
        if (!game || winner || moveLoading) return;
        
        const token = localStorage.getItem("token");
        if (!token) return;

        setMoveLoading(true);

        try {
            const res = await fetch(`${URLS.games}/${game.id}/move`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ square: index })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to make a move");
            }

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
            setErrorMessage(err.message);
        } finally {
            setMoveLoading(false);
        }
    }

    useEffect(() => {
        const fetchGame = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                
                const res = await fetch(`${URLS.games}/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Failed to load game");

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

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const socket = new WebSocket(
            `${import.meta.env.VITE_WS_URL}/ws/games?gameId=${id}&token=${token}`
        );

        socket.onmessage = (event) => {
            const updatedGame = JSON.parse(event.data);
            setGame(updatedGame);

            if (updatedGame.status === "finished") {
                if (updatedGame.winner) {
                    setWinner(updatedGame.winner);
                    setWinningPattern(updatedGame.winningPattern);
                } else {
                    setIsDraw(true);
                }
            }
        };

        socket.onopen = () => {
            console.log("WebSocket connected");
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
        };

        return () => {
            socket.close();
        };
    }, [id]);

    return (
        <div className="game-page">
            <BubbleBackground />
            <div className="game-container">
                {!game ? (
                    <div className="loading-card">
                        <p>Loading game...</p>
                    </div>
                ) : (
                    <>
                        <h1 className="game-code">
                            Game Code: {game.gameCode}
                        </h1>

                        {winner && (
                            <h2 className="winner-text">
                                Winner: {winner}
                            </h2>
                        )}

                        {isDraw && (
                            <h2 className="draw-text">
                                It's a draw!
                            </h2>
                        )}

                        <div className="game-area">
                            <div className="players">
                                <p className={game.currentTurn === "X" ? "current-player" : ""}>
                                    X: {game.playerXUsername}
                                </p>

                                <p className={game.currentTurn === "O" ? "current-player" : ""}>
                                    O: {game.playerOUsername ?? "Waiting for player..."}
                                </p>
                            </div>

                            <div className={`board ${winner || isDraw ? "game-over" : ""}`}>
                                {game.board.map((cell, idx) => (
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

                            <div className="moves">
                                <h3>Moves</h3>

                                <div className="moves-header">
                                    <span>#</span>
                                    <span>User</span>
                                    <span>Symbol</span>
                                    <span>Square</span>
                                </div>

                                <div className="moves-body">
                                    {game.moves.length === 0 ? (
                                        <p>No moves yet</p>
                                    ) : (
                                        <ul className="moves-list">
                                            {game.moves.map((move) => (
                                                <li key={move.moveNumber}>
                                                    <span>#{move.moveNumber}</span>

                                                    <span>
                                                        {move.symbol === "X"
                                                            ? game.playerXUsername
                                                            : game.playerOUsername}
                                                    </span>

                                                    <span>{move.symbol}</span>

                                                    <span>{move.square + 1}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button onClick={() => navigate('/profile')}>
                            Return to Main Page
                        </button>

                        {errMessage && (
                            <p className="error-message">
                                {errMessage}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}