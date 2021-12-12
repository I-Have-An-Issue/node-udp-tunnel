const net = require("net")
const dgram = require("dgram")

class Server {
    constructor(host = "LOL", udpPort = 27523, tcpPort = 27523) {
        this._host = host
        this._udpPort = udpPort
        this._tcpPort = tcpPort
        this._connections = new Map()
    }

    start() {
        this._transport = net.Socket()
        // A connection has been made upstream
        this._transport.on("connect", () => console.log("connected to host"))

        this._transport.on("data", msg => {
            // Re-encode the data
            let data = []
            for (let packet of msg.toString().split("[end]")) {
                try { data.push(JSON.parse(packet)) }
                catch (e) { console.log(packet) }
            }

            // Fixes strange buffer grouping
            for (let packet of data) {
                let buf = Buffer.from(packet.msg, "base64")
                console.log(`[${packet.rinfo.address} -> localhost] ${packet.msg.slice(0, 45)}`)

                // Check if that port is already open and send the data if it is
                if (this._connections.has(packet.rinfo.port)) {
                    this._connections.get(packet.rinfo.port).send(buf, this._udpPort, "127.0.0.1")
                } else {
                    const sock = dgram.createSocket("udp4")
    
                    // If the internal client sends data, send that data to it's intended recipient
                    sock.on("message", (msg2, rinfo) => {
                        console.log(`[${packet.rinfo.address} <- localhost] ${packet.msg.slice(0, 45)}`)
                        this._transport.write(Buffer.from(
                            JSON.stringify({
                                rinfo: packet.rinfo, 
                                msg: msg2.toString("base64")
                            }) + "[end]"
                        ))
                    })
    
                    sock.bind()
    
                    // Send the data to the internal client
                    sock.send(buf, this._udpPort, "127.0.0.1")
                    this._connections.set(packet.rinfo.port, sock)
                }
            }
        })

        this._transport.on("error", e => console.log(e))
        this._transport.connect(this._tcpPort, this._host)
    }
}

module.exports = Server
