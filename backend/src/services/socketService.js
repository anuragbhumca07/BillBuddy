let io = null;

/**
 * Initialize Socket.io and attach event handlers.
 *
 * @param {import('socket.io').Server} socketIo
 */
const init = (socketIo) => {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Client sends { houseId } to subscribe to house events
    socket.on('join:house', (houseId) => {
      if (typeof houseId === 'string' && houseId.trim()) {
        socket.join(`house:${houseId}`);
        console.log(`[Socket] Socket ${socket.id} joined house:${houseId}`);
      }
    });

    socket.on('leave:house', (houseId) => {
      socket.leave(`house:${houseId}`);
      console.log(`[Socket] Socket ${socket.id} left house:${houseId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

/**
 * Emit an event to all sockets in a house room.
 *
 * @param {string} houseId
 * @param {string} event
 * @param {*} data
 */
const emitToHouse = (houseId, event, data) => {
  if (!io) return;
  io.to(`house:${houseId}`).emit(event, data);
};

/**
 * Emit to a specific socket (by socket id).
 *
 * @param {string} socketId
 * @param {string} event
 * @param {*} data
 */
const emitToSocket = (socketId, event, data) => {
  if (!io) return;
  io.to(socketId).emit(event, data);
};

module.exports = { init, emitToHouse, emitToSocket };
