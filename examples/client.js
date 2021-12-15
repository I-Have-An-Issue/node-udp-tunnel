const { Client } = require("../src")
const client = new Client("127.0.0.1", 28572, 4444)

client.on("error", e => console.log(e))
client.once("connect", (host, port) => console.log(`TCP connected to ${host}:${port}`))

client.start()