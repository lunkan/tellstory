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
        // Fail loudly instead of silently moving to 5174: the hardcoded
        // hmr.clientPort below means an already-open tab can only reconnect
        // (and auto-reload) if we are always on the same port.
        strictPort: true,
        open: true,
        proxy: {
            "/api": {
                target: "http://127.0.0.1:3000",
                configure: (proxy) => {
                    // The API server takes a few seconds longer to boot than Vite does,
                    // so early requests hit a closed port. Answer 503 instead of killing
                    // the request, so the client can retry until the server is listening.
                    proxy.on("error", (_err, _req, res) => {
                        if ("writeHead" in res && !res.headersSent) {
                            res.writeHead(503, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ error: "API server not ready" }));
                        }
                    });
                },
            },
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
