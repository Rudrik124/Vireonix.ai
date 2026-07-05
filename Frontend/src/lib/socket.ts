import { io, Socket } from "socket.io-client";

// Get backend URL from environment variables, fallback to localhost for development
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;

  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (!this.isConnecting) {
      this.isConnecting = true;
      this.socket = io(BACKEND_URL, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on("connect", () => {
        console.log("[WebSocket] Connected to server:", this.socket?.id);
        this.isConnecting = false;
      });

      this.socket.on("disconnect", (reason) => {
        console.log("[WebSocket] Disconnected:", reason);
      });

      this.socket.on("connect_error", (error) => {
        console.error("[WebSocket] Connection error:", error);
        this.isConnecting = false;
      });
    }

    return this.socket!;
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new WebSocketService();
