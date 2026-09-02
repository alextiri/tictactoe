const API_URL = import.meta.env.VITE_API_URL;

export const URLS = {
    login: `${API_URL}/auth/login`,
    register: `${API_URL}/auth/register`,
    games: `${API_URL}/games`,
};