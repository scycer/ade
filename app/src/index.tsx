import { server } from "./server";
const runningServer = server()

console.log(`🚀 Server running at ${runningServer.url}`);