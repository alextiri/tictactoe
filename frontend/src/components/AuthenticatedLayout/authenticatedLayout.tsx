import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
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
                queryClient.invalidateQueries({
                    queryKey: ["sentGameInvitations"],
                });

                return;
            }

            if (event.data.startsWith("game-invitation:declined:")) {
                queryClient.invalidateQueries({
                    queryKey: ["sentGameInvitations"],
                });

                return;
            }

            if (event.data.startsWith("game-invitation:cancelled:")) {
                queryClient.invalidateQueries({
                    queryKey: ["gameInvitations"],
                });

                return;
            }

            const [status, userId] = event.data.split(":");

            queryClient.setQueryData(
                ["friends", user.id],
                (friends: any[] | undefined) => {
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
    }, [queryClient]);

    return (
        <>
            <Outlet />
        </>
    );
}