import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

interface MoveVariables {
    gameId: number;
    index: number;
    symbol: string;
}

export default function Game() {
    const { id } = useParams<{ id: string }>();
    const [errMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const fetchGame = async (): Promise<Game> => {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("You must be logged in");
        }

        const res = await fetch(`${URLS.games}/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            throw new Error("Failed to load game");
        }

        const data = await res.json();
        return data.game;
    };

    const gameQuery = useQuery({
        queryKey: ["game", id],
        queryFn: fetchGame,
    });

    const moveMutation = useMutation({
        mutationFn: async ({ gameId, index }: MoveVariables) => {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("You must be logged in");
            }

            const res = await fetch(`${URLS.games}/${gameId}/move`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    square: index,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to make move");
            }

            const data = await res.json();
            return data.game as Game;
        },
        onMutate: async ({ index, symbol }: MoveVariables) => {
            await queryClient.cancelQueries({ queryKey: ["game", id] });
            const previousGame = queryClient.getQueryData<Game>(["game", id]);

            if (!previousGame) {
                return { previousGame: undefined };
            }

            const optimisticGame = {
                ...previousGame,
                board: [...previousGame.board],
                moves: [
                    ...previousGame.moves,
                    {
                        moveNumber: previousGame.moves.length + 1,
                        playerId: user.id,
                        symbol,
                        square: index
                    }
                ]
            };

            optimisticGame.board[index] = symbol;
            queryClient.setQueryData(["game", id], optimisticGame);
            return { previousGame };
        },
        onSuccess: (updatedGame) => {
            queryClient.setQueryData(["game", id], updatedGame);
        },
        onError: (error, _variables, context) => {
            if (context?.previousGame) {
                queryClient.setQueryData(["game", id], context.previousGame);
            }

            setErrorMessage(error.message);
        },
    });

    const game = gameQuery.data ?? null;
    const winner = game?.winner ?? null;
    const winningPattern = game?.winningPattern ?? null;
    const isDraw = game?.status === "finished" && !game.winner;
    const currentTurn = game
        ? game.moves.length === 0
            ? "X"
            : game.moves[game.moves.length - 1].symbol === "X"
                ? "O"
                : "X"
        : "X";

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    
    const handleCellClick = (index: number) => {
        setErrorMessage('');
        if (!game || game.board[index] || game.status === "finished") {
            return;
        }

        moveMutation.mutate({
            gameId: game.id,
            index,
            symbol: currentTurn
        });
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const socket = new WebSocket(
            `${import.meta.env.VITE_WS_URL}/ws/games?gameId=${id}&token=${token}`
        );

        socket.onmessage = (event) => {
            const updatedGame = JSON.parse(event.data);
            queryClient.setQueryData(["game", id], updatedGame);
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
                                <p className={currentTurn === "X" ? "current-player" : ""}>
                                    X: {game.playerXUsername}
                                </p>

                                <p className={currentTurn === "O" ? "current-player" : ""}>
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
                                {game.moves.length === 0 ? (
                                    <p className="no-moves">No moves yet</p>
                                ) : (
                                    <>
                                        <h3>Moves</h3>
                                        <div className="moves-header">
                                            <span>#</span>
                                            <span>User</span>
                                            <span>Symbol</span>
                                            <span>Square</span>
                                        </div>
                                        <div className="moves-body">
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
                                        </div>
                                    </>
                                )}
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