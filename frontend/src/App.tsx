import { Routes, Route } from 'react-router-dom';
import './App.css'
import Home from './components/Home/home'
import Profile from './components/Profile/profile';
import Register from './components/Register/register';
import Game from './components/Game/game';
import AuthenticatedLayout from './components/AuthenticatedLayout/AuthenticatedLayout';

function App() {
    return (
        <div className='app-container'>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />

                <Route element={<AuthenticatedLayout />}>
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/game/:id" element={<Game />} />
                </Route>
            </Routes>
        </div>
    )
}

export default App