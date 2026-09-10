import { useNavigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react";
import './profile.css'
import "@radix-ui/themes/styles.css";
import * as Popover from "@radix-ui/react-popover";
import { URLS } from "../../config/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import BubbleBackground from "../BubbleBackground";

interface Friend {
    userId: number;
    username: string;
    friendsSince: string;
    online: boolean;
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
    const [joinCode, setJoinCode] = useState("");

    const [showFriendRequests, setShowFriendRequests] = useState(false);
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendUsername, setFriendUsername] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    const presenceSocket = useRef<WebSocket | null>(null);
    
    const handleLogout = () => {
        presenceSocket.current?.send("logout");
        presenceSocket.current?.close();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        queryClient.clear();
        navigate('/');
    }

    const fetchFriends = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            return;
        }

        const res = await fetch(`${URLS.friends}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Failed to fetch friends");
        }

        const data: Friend[] = await res.json();
        return data;
    };

    const fetchFriendRequests = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            return [];
        }

        const res = await fetch(`${URLS.friends}/requests`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Failed to fetch friend requests");
        }

        const data: FriendRequestResponse[] = await res.json();
        return data;
    };

    const fetchHistory = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("You must be logged in");
        }

        const res = await fetch(`${URLS.games}/history`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Failed to fetch game history");
        }

        interface HistoryResponse {
            history: GameHistoryEntry[];
        }

        const data: HistoryResponse = await res.json();
        return data.history;
    };

    const queryClient = useQueryClient();

    const friendsQuery = useQuery({
        queryKey: ["friends", user?.id],
        queryFn: fetchFriends
    });

    const friendRequestsQuery = useQuery({
        queryKey: ["friendRequests", user?.id],
        queryFn: fetchFriendRequests
    });

    const historyQuery = useQuery({
        queryKey: ["gameHistory", user?.id],
        queryFn: fetchHistory
    });

    const newGameMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("You must be logged in to create a game");
            }

            const res = await fetch(URLS.games, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to create game");
            }

            return await res.json();
        },
        onSuccess: (data) => {
            navigate(`/game/${data.game.id}`);
        },
    });

    const joinGameMutation = useMutation({
        mutationFn: async (gameCode: string) => {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("You must be logged in");
            }

            const res = await fetch(`${URLS.games}/join`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ gameCode }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to join game");
            }

            return data;
        },
        onSuccess: (data) => {
            navigate(`/game/${data.game.id}`);
        },
    });

    const addFriendMutation = useMutation({
        mutationFn: async (username: string) => {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("You must be logged in");
            }

            const res = await fetch(
                `${URLS.friends}/requests?username=${encodeURIComponent(username)}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(
                    data.message || "Failed to send friend request"
                );
            }
        },
        onSuccess: () => {
            setFriendUsername("");
            setShowAddFriend(false);
        }
    });

    const acceptFriendMutation = useMutation({
        mutationFn: async (username: string) => {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("You must be logged in");
            }

            const res = await fetch(
                `${URLS.friends}/requests?username=${encodeURIComponent(username)}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(
                    data.message || "Failed to accept friend request"
                );
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["friends"]
            });

            queryClient.invalidateQueries({
                queryKey: ["friendRequests"]
            });

            if (friendRequestsQuery.data?.length === 1) {
                setShowFriendRequests(false);
            }
        }
    });

    const removeFriendMutation = useMutation({
        mutationFn: async (friendId: number) => {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("You must be logged in");
            }

            const res = await fetch(`${URLS.friends}?friendId=${friendId}`, {
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
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["friends"]
            });
        }
    });

    const declineFriendMutation = useMutation({
        mutationFn: async (senderId: number) => {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("You must be logged in");
            }

            const res = await fetch(
                `${URLS.friends}/requests?senderId=${senderId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(
                    data.message || "Failed to decline friend request"
                );
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["friendRequests"]
            });
        }
    });

    const handleNewGame = () => {
        newGameMutation.mutate();
    };

    const handleJoinGame = () => {
        if (!joinCode) {
            joinGameMutation.reset();
            setJoinCode("");
            return;
        }

        if (joinCode.length !== 6) {
            joinGameMutation.reset();
            setJoinCode("");
            return;
        }

        joinGameMutation.mutate(joinCode);
    };

    const handleAddFriend = () => {
        addFriendMutation.mutate(friendUsername);
    };

    const handleAcceptFriend = async (request: FriendRequestResponse) => {
        acceptFriendMutation.mutate(request.username);
    };

    const handleDeclineFriend = async (request: FriendRequestResponse) => {
        declineFriendMutation.mutate(request.userId);
    };

    const handleRemoveFriend = async (friend: Friend) => {
        removeFriendMutation.mutate(friend.userId);
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            return;
        }

        const socket = new WebSocket(
            `${import.meta.env.VITE_WS_URL}/ws/presence?token=${token}`
        );

        presenceSocket.current = socket;

        socket.onopen = () => {
            console.log("Presence WebSocket connected");
        };

        socket.onclose = () => {
            console.log("Presence WebSocket disconnected");
        };

        socket.onmessage = (event) => {
            const [status, userId] = event.data.split(":");

            queryClient.setQueryData<Friend[]>(
                ["friends", user?.id],
                (friends) => {
                    if (!friends) {
                        return friends;
                    }

                    return friends.map((friend) =>
                        friend.userId === Number(userId)
                            ? {
                                ...friend,
                                online: status === "online"
                            }
                            : friend
                    );
                }
            );
        };

        return () => {
            socket.close();
        };
    }, []);

    const totalPages = Math.ceil((historyQuery.data?.length ?? 0) / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentGames = historyQuery.data?.slice(startIndex, startIndex + itemsPerPage) ?? [];

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
                            {friendRequestsQuery.data?.map((request) => (
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
                        {friendsQuery.isLoading ? (
                            <p className="loading-friends">Loading your friend list...</p>
                        ) : friendsQuery.data?.length === 0 ? (
                            <p className="no-friends">No friends yet</p>
                        ) : (
                            <ul className="friends-list">
                                {friendsQuery.data?.map((friend) => (
                                    <li key={friend.userId}>
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "50%",
                                                    backgroundColor: friend.online ? "green" : "red",
                                                }}
                                            />
                                            {friend.username}
                                        </span>

                                        <button onClick={() => handleRemoveFriend(friend)}>
                                            Unfriend
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {friendRequestsQuery.data && friendRequestsQuery.data.length > 0 && (
                            <button className="friend-requests-button" onClick={() => setShowFriendRequests(true)}>
                                {friendRequestsQuery.data.length} pending friend request
                                {friendRequestsQuery.data.length !== 1 ? "s" : ""}
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
                    {historyQuery.isLoading ? (
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
                            {newGameMutation.isPending ? "Creating..." : "New game"}
                        </button>
                        <input
                            type="text"
                            placeholder="Enter game code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        />
                        <button onClick={handleJoinGame}>Join Game</button>
                    </div>
                    {joinGameMutation.error && (
                        <p className="join-error">{joinGameMutation.error.message}</p>
                    )}
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </div>
        </div>
    )
}