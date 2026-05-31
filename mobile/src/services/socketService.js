import { io } from 'socket.io-client';
import { storage } from '../utils/storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.handlers = {};
  }

  async connect() {
    if (this.socket?.connected) return;

    const token = await storage.getAccessToken();
    if (!token) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.log('Socket connection error:', err.message);
    });

    // Re-attach handlers if any
    Object.entries(this.handlers).forEach(([event, handler]) => {
      this.socket.on(event, handler);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlers = {};
  }

  on(event, handler) {
    this.handlers[event] = handler;
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event) {
    delete this.handlers[event];
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  joinHouseRoom(houseId) {
    if (this.socket?.connected) {
      this.socket.emit('join:house', houseId);
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;
