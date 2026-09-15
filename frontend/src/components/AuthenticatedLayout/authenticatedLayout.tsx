import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import './authenticatedLayout.css'

export default function AuthenticatedLayout() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            return;
        }

        const user = JSON.parse(storedUser);

        const socket = new WebSocket(
            `${import.meta.env.VITE_WS_URL}/ws/presence?token=${token}`
        );

        const handleLogout = () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send("logout");
            }

            socket.close();
        };

        window.addEventListener("logout", handleLogout);

        socket.onopen = () => {
            console.log("Presence WebSocket connected");
        };

        socket.onclose = () => {
            console.log("Presence WebSocket disconnected");
        };

        socket.onmessage = (event) => {
            console.log(
                "Presence message received by user",
                user.id,
                ":",
                event.data
            );
            if (event.data === "game-invitation:new") {
                queryClient.invalidateQueries({
                    queryKey: ["gameInvitations"],
                });

                return;
            }

            if (event.data.startsWith("game-invitation:accepted:")) {
                queryClient.refetchQueries({
                    queryKey: ["gameInvitations", user.id],
                });

                queryClient.refetchQueries({
                    queryKey: ["gameHistory", user.id],
                });

                return;
            }

            if (event.data.startsWith("game-invitation:declined:")) {
                queryClient.invalidateQueries({
                    queryKey: ["gameInvitations"],
                });

                return;
            }

            if (event.data.startsWith("game-invitation:cancelled:")) {
                queryClient.invalidateQueries({
                    queryKey: ["gameInvitations"],
                });

                return;
            }

            if (event.data === "friend-request:new") {
                queryClient.invalidateQueries({
                    queryKey: ["friendRequests", user.id],
                });

                return;
            }

            if (event.data === "friend-request:accepted") {
                queryClient.invalidateQueries({
                    queryKey: ["friends", user.id],
                });

                queryClient.invalidateQueries({
                    queryKey: ["friendNotifications", user.id],
                });

                return;
            }

            if (event.data === "friend-request:declined") {
                queryClient.invalidateQueries({
                    queryKey: ["friendNotifications", user.id],
                });

                return;
            }

            if (event.data === "friend:removed") {
                queryClient.invalidateQueries({
                    queryKey: ["friends", user.id],
                });

                return;
            }

            const [status, userId] = event.data.split(":");

            queryClient.setQueryData(
                ["friends", user.id],
                (old: any) => {
                    if (!old) {
                        return old;
                    }

                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            friends: page.friends.map((friend: any) =>
                                friend.userId === Number(userId)
                                    ? {
                                        ...friend,
                                        online: status === "online"
                                    }
                                    : friend
                            )
                        }))
                    };
                }
            );
        };

        return () => {
            window.removeEventListener("logout", handleLogout);
            socket.close();
        };
    }, [queryClient]);

    return (
        <>
            <Outlet />
        </>
    );
}