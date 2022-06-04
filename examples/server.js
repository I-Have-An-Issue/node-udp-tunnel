const { Server } = require("../src")
const server = new Server(47127, 58727)

server.on("connection", (ip) => console.log(`New client connected to transport socket: ${ip}`))
server.on("error", (e) => console.log(e))

//server.on("data_in", (json) => console.log(json))
//server.on("data_out", (json) => console.log(json))

server.once("tcp_listening", (port) => console.log(`TCP listening on port ${port}`))
server.once("udp_listening", (port) => console.log(`UDP listening on port ${port}`))

server.start()
