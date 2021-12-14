const { Server } = require("../src")
const server = new Server(28572, 4444)

server.on("connection", ip => console.log(`New client connected to transport socket: ${ip}`))
server.on("error", e => console.log(e))

server.once("tcp_listening", port => console.log(`TCP listening on port ${port}`))
server.once("udp_listening", port => console.log(`UDP listening on port ${port}`))

server.start()