import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

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

    return <Outlet />;
}