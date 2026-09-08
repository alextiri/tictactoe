import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { loadBubblesPreset } from "@tsparticles/preset-bubbles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import './index.css'
import App from './App.tsx'

const particlesInit = async (engine: Parameters<typeof loadSlim>[0]) => {
  await loadSlim(engine);
  await loadBubblesPreset(engine);
};

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ParticlesProvider init={particlesInit}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
    </ParticlesProvider>
  </React.StrictMode>
);