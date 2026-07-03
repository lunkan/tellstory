import { useSceneStore } from "../store/sceneStore";

class WebSocketService {
    private socket: WebSocket | null = null;

    public connect() {
        //console.log('CONNECT:', import.meta.env.VITE_WS_URL);
        this.socket = new WebSocket("ws://192.168.1.206:8080");//import.meta.env.VITE_WS_URL);//"ws://localhost:8080");

        this.socket.onopen = () => {
            console.log("Connected");
        };

        this.socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            useSceneStore.getState().handleMessage(msg);

            /*switch (msg.type) {
                case 'locationDescription':
                  
    
                    
    
                    useLocationStore.getState().addMessage(msg);
                    break;
                /*case 'adjacentSummary':
                    useAdjacentSummaryStore.getState().addUser(msg.user);
                    break;
                case "quadrantSummary":
                    useQuadrantSummaryStore.getState().add(msg);
                    break;/
                default:
                    console.log('No handled message', msg);
                    break;
            }*/

            /*
            sceneTransition,
            adjacentSummary,
            quadrantSummary,
            premises,
            adjacent,*/

            //const message = JSON.parse(event.data);
            //useLocationStore.getState().addMessage(message);
        };

        this.socket.onclose = () => {
            console.log("Disconnected");
        };
    }

    public send(data: unknown) {
        this.socket?.send(JSON.stringify(data));
    }
}

export const wsService = new WebSocketService();