import { useLocationStore } from "../store/locationStore";

class WebSocketService {
  private socket: WebSocket | null = null;

  public connect() {
    this.socket = new WebSocket("ws://localhost:8080");

    this.socket.onopen = () => {
      console.log("Connected");
    };

    this.socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log('MSG:', msg.descriptionType);
        switch (msg.type) {
            case 'locationDescription':
                useLocationStore.getState().addMessage(msg);
                break;
            /*case 'adjacentSummary':
                useAdjacentSummaryStore.getState().addUser(msg.user);
                break;
            case "quadrantSummary":
                useQuadrantSummaryStore.getState().add(msg);
                break;*/
            default:
                console.log('No handled message', msg);
                break;
        }

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