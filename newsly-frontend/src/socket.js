import { io } from "socket.io-client";

const socket = io("https://newslyai.onrender.com", {
  transports: ["websocket", "polling"],
});

export default socket;