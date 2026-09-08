import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react";
import './profile.css'
import "@radix-ui/themes/styles.css";
import * as Popover from "@radix-ui/react-popover";
import { URLS } from "../../config/utils";
import BubbleBackground from "../BubbleBackground";

interface Friend {
    userId: number;
    username: string;
    friendsSince: string;
}

interface FriendRequestResponse {
    userId: number;
    username: string;
    createdAt: string;
}

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

    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequestResponse[]>([]);
    const [showFriendRequests, setShowFriendRequests] = useState(false);
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendUsername, setFriendUsername] = useState("");
    const [friendsLoading, setFriendsLoading] = useState(true);

    const [history, setHistory] = useState<GameHistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
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
            const res = await fetch(URLS.games, {
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
            const res = await fetch(`${URLS.games}/join`, {
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

    const handleAddFriend = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        try {
            const userRes = await fetch(`${URLS.friends}/user?username=${encodeURIComponent(friendUsername)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!userRes.ok) {
                throw new Error("User not found");
            }

            const receiverId: number = await userRes.json();
            const res = await fetch(`${URLS.friends}/requests?receiverId=${receiverId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to send friend request");
            }

            setFriendUsername("");
            setShowAddFriend(false);
        } catch (error: any) {
            console.error(error);
        }
    };

    const handleAcceptFriend = async (request: FriendRequestResponse) => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        try {
            const res = await fetch(
                `${URLS.friends}/requests?receiverId=${request.userId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to accept friend request");
            }

            setFriendRequests((requests) => {
                const remainingRequests = requests.filter(
                    (r) => r.userId !== request.userId
                );

                if (remainingRequests.length === 0) {
                    setShowFriendRequests(false);
                }

                return remainingRequests;
            });

            setFriends((friends) => [
                ...friends,
                {
                    userId: request.userId,
                    username: request.username,
                    friendsSince: new Date().toISOString()
                }
            ]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeclineFriend = async (request: FriendRequestResponse) => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        try {
            const res = await fetch(
                `${URLS.friends}/requests?senderId=${request.userId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to decline friend request");
            }

            setFriendRequests((requests) => {
                const remainingRequests = requests.filter(
                    (r) => r.userId !== request.userId
                );

                if (remainingRequests.length === 0) {
                    setShowFriendRequests(false);
                }

                return remainingRequests;
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveFriend = async (friend: Friend) => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        try {
            const res = await fetch(
                `${URLS.friends}?friendId=${friend.userId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to remove friend");
            }

            setFriends((friends) =>
                friends.filter((f) => f.userId !== friend.userId)
            );
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem("token");
            if(!token) {
                setHistoryLoading(false);
                return;
            }

            try {
                const res = await fetch(`${URLS.games}/history`, {
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
            } finally {
                setHistoryLoading(false);
            }
        };

        const fetchFriends = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                return;
            }

            try {
                const res = await fetch(`${URLS.friends}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch friends");
                }

                const data: Friend[] = await res.json();
                setFriends(data);
                setFriendsLoading(false);
            } catch (error) {
                console.error(error);
            }
        };

        const fetchFriendRequests = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                return;
            }

            try {
                const res = await fetch(`${URLS.friends}/requests`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch friend requests");
                }

                const data: FriendRequestResponse[] = await res.json();
                setFriendRequests(data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchHistory();
        fetchFriends();
        fetchFriendRequests();
    }, [])

    const totalPages = Math.ceil(history.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentGames = history.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="profile">
            <BubbleBackground/>
            <div className="friends-panel">
                {showAddFriend ? (
                    <div>
                        <h2 className="friends-title">Add Friend</h2>
                        <input
                            type="text"
                            placeholder="Username"
                            value={friendUsername}
                            onChange={(e) => setFriendUsername(e.target.value)}
                        />
                        <div className="add-friend-actions">
                            <button className="add-friend-button" onClick={handleAddFriend}>
                                Send Request
                            </button>
                            <button className="back-to-friends-button" onClick={() => setShowAddFriend(false)}>
                                Back
                            </button>
                        </div>
                    </div>
                ) : (
                    showFriendRequests ? (
                    <>
                        <h2 className="friends-title">Pending Requests</h2>
                        <ul className="friends-list">
                            {friendRequests.map((request) => (
                                <li key={request.userId}>
                                    <span>{request.username}</span>
                                    <div className="friend-request-actions">
                                        <button onClick={() => handleAcceptFriend(request)}>
                                            Accept
                                        </button>
                                        <button onClick={() => handleDeclineFriend(request)}>
                                            Decline
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <button className="back-to-friends-button" onClick={() => setShowFriendRequests(false)}>
                            Back
                        </button>
                    </> 
                    ) : (
                    <>
                        <h2 className="friends-title">Friends</h2>
                        {friendsLoading ? (
                            <p className="loading-friends">Loading your friend list...</p>
                        ) : friends.length === 0 ? (
                            <p className="no-friends">No friends yet</p>
                        ) : (
                            <ul className="friends-list">
                                {friends.map((friend) => (
                                    <li key={friend.userId}>
                                        {friend.username}
                                        <button onClick={() => handleRemoveFriend(friend)}>
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {friendRequests.length > 0 && (
                            <button className="friend-requests-button" onClick={() => setShowFriendRequests(true)}>
                                {friendRequests.length} pending friend request
                                {friendRequests.length !== 1 ? "s" : ""}
                            </button>
                        )}

                        <button className="add-friend-button" onClick={() => setShowAddFriend(true)}>
                            Add Friend
                        </button>
                    </>
                ))}
            </div>
            <div className="profile-center">
                <div className="profile-header">
                    <h1 className="profile-title">
                        {user ? `Welcome back, ${user.username}` : "Welcome back"}
                    </h1>
                </div>
                <h2 className="history-title">Game History</h2>
                <div className="history-content">
                    {historyLoading ? (
                        <p className="no-games">Loading your game history...</p>
                    ) : currentGames.length === 0 ? (
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
                                {Array.from({ length: 5 }, (_, index) => {
                                    const game = currentGames[index];
                                    return game ? (
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
                                                        <Popover.Content
                                                            className="profile-popover"
                                                            side="right"
                                                            align="start"
                                                            sideOffset={8}
                                                        >
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
                                                                            <li
                                                                                key={`${game.gameId}-${move.moveNumber}-${move.square}`}
                                                                            >
                                                                                <span className="move-num">
                                                                                    #{move.moveNumber}
                                                                                </span>
                                                                                <span className="move-user">
                                                                                    {move.username}
                                                                                </span>
                                                                                <span className="move-symbol">
                                                                                    {move.symbol}
                                                                                </span>
                                                                                <span className="move-square">
                                                                                    {move.square + 1}
                                                                                </span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </div>
                                                            <Popover.Arrow className="profile-popover-arrow" />
                                                        </Popover.Content>
                                                    </Popover.Portal>
                                                </Popover.Root>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={`empty-${index}`}>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="pagination-slot">
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <span>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
                <div className="game-actions">
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
            </div>
        </div>
    )
}