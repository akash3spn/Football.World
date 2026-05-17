import { io } from 'socket.io-client';

const socketUrl = window.location.origin;
export const socket = io(socketUrl, {
  autoConnect: false, // Wait until we're ready
});
