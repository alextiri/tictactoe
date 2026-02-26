import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react";
import './profile.css'
import "@radix-ui/themes/styles.css";
import * as Popover from "@radix-ui/react-popover";


interface Move {
  moveNumber: number;
  symbol: string;
  square: number;
  username: string;
}

interface GameHistoryEntry {
  gameId: number;
  gameCode: string;
  winner: string | null;
  createdAt: string;
  moves: Move[];
}

export default function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [joinCode, setJoinCode] = useState("");
    const [joinError, setJoinError] = useState<string | null>(null);

    const [history, setHistory] = useState<GameHistoryEntry[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    
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
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    const handleJoinGame = async () => {
        if(!joinCode) {
            setJoinError("Please enter a game code");
            setJoinCode("");
            return;
        }
        if(joinCode.length !== 6) {
            setJoinError("Please enter a valid, 6-digit game code");
            setJoinCode("");
            return;
        }

        const token = localStorage.getItem("token");
        if(!token) {
            setJoinError("You must be logged in");
            return;
        }

        try {
            setJoinError(null);
            const res = await fetch("http://localhost:3000/api/games/join/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ gameCode: joinCode })
            });

            const data = await res.json();
            if(!res.ok) {
                throw new Error(data.message || "Failed to join game");
            }
            console.log("Joined game", data.game);
            navigate(`/game/${data.game.id}`)
        } catch(err: any) {
            setJoinError(err.message || "Could not join game");
            setJoinCode("");
        }
    };

    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem("token");
            if(!token) return;

            try {
                const res = await fetch("http://localhost:3000/api/games/history", {
                    headers: { Authorization: `Bearer ${token}`}
                });
                if(!res.ok) throw new Error("Failed to fetch game history");
                interface HistoryResponse {
                    history: GameHistoryEntry[];
                }

                const data: HistoryResponse = await res.json();
                setHistory(data.history);
            } catch(error) {
                console.error(error);
            }
        };
        fetchHistory();
    }, [])

    const totalPages = Math.ceil(history.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentGames = history.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="profile">
            <h1 className="profile-title">
                {user ? `Welcome back, ${user.username}` : "Welcome back"}
            </h1>
            <h2 className="history-title">Game History</h2>
            {currentGames.length === 0 ? (
                <p className="no-games">No games played yet</p>
            ) : (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Game Code</th>
                            <th>Winner</th>
                            <th>Started At</th>
                            <th>Moves</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentGames.map((game) => (
                            <tr key={game.gameId}>
                                <td>{game.gameCode}</td>
                                <td>
                                    {game.winner
                                        ? game.winner
                                        : game.moves.length === 9
                                        ? "Draw"
                                        : "Pending"}
                                </td>
                                <td>{new Date(game.createdAt).toLocaleString()}</td>
                                <td>
                                    <Popover.Root>
                                        <Popover.Trigger asChild>
                                            <button className="profile-moves-btn">Moves</button>
                                        </Popover.Trigger>
                                        <Popover.Portal>
                                            <Popover.Content className="profile-popover" side="right" align="start" sideOffset={8}>
                                                <div className="profile-popover-header">
                                                    <strong>Game {game.gameCode}</strong>
                                                </div>
                                                <div className="profile-moves-header">
                                                    <span className="mh-num">#</span>
                                                    <span className="mh-user">User</span>
                                                    <span className="mh-symbol">Symbol</span>
                                                    <span className="mh-square">Square</span>
                                                </div>
                                                <div className="profile-popover-body">
                                                    {game.moves.length === 0 ? (
                                                        <p>No moves yet</p>
                                                    ) : (
                                                        <ul className="profile-moves-list">
                                                            {game.moves.map((move) => (
                                                                <li key={`${game.gameId}-${move.moveNumber}-${move.square}`}>
                                                                    <span className="move-num">#{move.moveNumber}</span>
                                                                    <span className="move-user">{move.username}</span>
                                                                    <span className="move-symbol">{move.symbol}</span>
                                                                    <span className="move-square">{move.square+1}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                <Popover.Arrow className="profile-popover-arrow"/>
                                            </Popover.Content>
                                        </Popover.Portal>
                                    </Popover.Root>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {totalPages > 1 && (
                <div className="pagination" style={{ marginTop: "10px" }}>
                <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <span style={{ margin: "0 10px" }}>Page {currentPage} of {totalPages}</span>
                <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
                </div>
            )}
            <div className="join-game">
                <button onClick={handleNewGame}>
                    {loading ? "Creating..." : "New game"}
                </button>
                <input
                    type="text"
                    placeholder="Enter game code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
                <button onClick={handleJoinGame}>Join Game</button>
            </div>
            {joinError && (
                <p className="join-error">{joinError}</p>
            )}
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
}