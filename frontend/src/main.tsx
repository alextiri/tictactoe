import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { loadBubblesPreset } from "@tsparticles/preset-bubbles";
import './index.css'
import App from './App.tsx'

const particlesInit = async (engine: Parameters<typeof loadSlim>[0]) => {
    await loadSlim(engine);
    await loadBubblesPreset(engine);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ParticlesProvider init={particlesInit}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ParticlesProvider>
  </React.StrictMode>
);