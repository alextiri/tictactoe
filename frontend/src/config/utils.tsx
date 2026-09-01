const API_URL = import.meta.env.VITE_API_URL;

export const URLS = {
    login: `${API_URL}/users/login`,
    register: `${API_URL}/users/register`,
    games: `${API_URL}/games`,
};