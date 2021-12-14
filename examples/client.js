const { Client } = require("../src")
const client = new Client("127.0.0.1", 28572, 4444)

client.on("error", e => console.log(e))

client.once("tcp_listening", port => console.log(`TCP listening on port ${port}`))
client.once("udp_listening", port => console.log(`UDP listening on port ${port}`))

client.start()