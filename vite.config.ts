import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import os from "os";

function getLocalIP() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] ?? []) {
            if (net.family === "IPv4" && !net.internal) {
                return net.address;
            }
        }
    }
}

const ip = getLocalIP();
console.log("Vite HMR IP:", ip);

export default defineConfig({
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        port: 5173,
        proxy: {
            "/chat": "http://localhost:3000",
            "/game": "http://localhost:3000",
            "/world": "http://localhost:3000",
            "/sound": "http://localhost:3000",
            "/admin": "http://localhost:3000",
            "/settings": "http://localhost:3000",
        },
        hmr: {
            protocol: "ws",
            host: ip,
            clientPort: 5173,
        },
    },
    css: {
        modules: { localsConvention: 'camelCaseOnly' } // or 'camelCase'
    }
});

//clientPort: 5173,
