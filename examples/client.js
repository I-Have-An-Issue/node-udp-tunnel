const { Client } = require("../src")
const client = new Client("207.244.242.68", 28572, 10370)

client.on("error", e => console.log(e))
client.once("connect", (host, port) => console.log(`TCP connected to ${host}:${port}`))

client.start()