const net = require("net")
const dgram = require("dgram")

class Server {
    constructor(udpPort = 27523, tcpPort = 27523) {
        this._udpPort = udpPort
        this._tcpPort = tcpPort
    }

    start() {
        this._transport = net.createServer()
        this._socket = dgram.createSocket("udp4")

        // A connection has been made downsteam
        this._transport.on("connection", transport => {
            // The server needs to send this data to the external client
            transport.on("data", msg => {
                // Re-encode the data
                let data = []
                for (let packet of msg.toString().split("[end]")) {
                    try { if (packet !== "") data.push(JSON.parse(packet)) }
                    catch (e) { console.log(packet) }
                }

                // Fixes strange buffer grouping
                for (let packet of data) {
                    let buf = Buffer.from(packet.msg, "hex")

                    // Send the data to the external client
                    this._socket.send(buf, packet.rinfo.port, packet.rinfo.address)
                }
            })

            transport.on("error", e => {
                console.log(e)
            })

            // The server should wrap this data up and send it downstream
            this._socket.on("message", (msg, rinfo) => {
                transport.write(Buffer.from(
                    JSON.stringify({
                        rinfo, 
                        msg: msg.toString("hex")
                    }) + "[end]"
                ))
            })
        })

        this._socket.bind(this._udpPort)
        this._transport.listen(this._tcpPort)
    }
}

module.exports = Server
