import io from 'socket.io-client';
import { CONFIG } from '../../config';
import { getUserData } from '../../utils/helpers/storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      // Get user data to extract userId
      const userData = await getUserData();
      if (!userData || !userData._id) {
        console.warn('No user data found, cannot connect socket');
        return;
      }
      
      const userId = userData._id;
      
      //  backend base url CONFIG.API_BASE_URL 
      this.socket = io(CONFIG.API_BASE_URL, {
        transports: ['polling', 'websocket'],
        auth: {
          userId: userId,
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventHandlers();
      
      return new Promise((resolve, reject) => {
        this.socket.on('connect', () => {
          console.log('Socket connected:', this.socket.id);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        // Timeout after 100 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Socket connection timeout'));
          }
        }, 100000);
      });
    } catch (error) {
      console.error('Error connecting socket:', error);
      throw error;
    }
  }

  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('reconnected', attemptNumber);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket reconnection attempt:', attemptNumber);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after', this.maxReconnectAttempts, 'attempts');
      this.emit('reconnect_failed');
    });

    // Handle authentication errors
    this.socket.on('unauthorized', (error) => {
      console.error('Socket unauthorized:', error);
      this.emit('unauthorized', error);
    });
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('Socket disconnected');
    }
  }

  /**
   * Emit an event to the server
   */
  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot emit:', event);
      return false;
    }
    
    this.socket.emit(event, data);
    return true;
  }

  /**
   * Listen to a socket event
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not initialized, cannot listen to:', event);
      return;
    }

    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    this.socket.on(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      // Remove all listeners for this event
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.forEach(cb => this.socket.off(event, cb));
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Join a room (e.g., chat room)
   */
  joinRoom(roomId) {
    return this.emit('join_room', { roomId });
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId) {
    return this.emit('leave_room', { roomId });
  }

  /**
   * Send a message
   */
  sendMessage(roomId, message, image = null) {
    return this.emit('send_message', {
      roomId,
      message,
      image,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Mark message as read
   */
  markAsRead(roomId, messageId) {
    return this.emit('mark_read', {
      roomId,
      messageId,
    });
  }

  /**
   * Typing indicator
   */
  sendTyping(roomId, isTyping) {
    return this.emit('typing', {
      roomId,
      isTyping,
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
    };
  }
}

// Export singleton instance
export default new SocketService();

