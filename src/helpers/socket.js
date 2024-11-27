import { io } from "socket.io-client";

// export const baseUrl="http://209.126.2.9:4004"
export const baseUrl="http://localhost:4004"
const socket = io(baseUrl);
export default socket;
