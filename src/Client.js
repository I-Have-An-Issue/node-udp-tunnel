const net = require("net")
const dgram = require("dgram")

class Server {
    constructor(host = "LOL", udpPort = 27523, tcpPort = 27523) {
        this._host = host
        this._udpPort = udpPort
        this._tcpPort = tcpPort
        this._connections = new Map()
        this._socket
    }

    start() {
        this._transport = net.createConnection()

        // A connection has been made upstream
        this._transport.on("connection", socket => this._socket = socket)

        // The server needs to send this data to the internal client
        this._socket.on("data", msg => {
            // Re-encode the data
            let data = JSON.parse(msg.toString())
            let buf = Buffer.from(data.msg, "base64")

            // Check if that port is already open and send the data if it is
            if (this._connections.has(data.rinfo.port)) this._connections.get(data.rinfo.port).send(buf, this._udpPort, "127.0.0.1")
            else {
                let sock = dgram.createSocket("udp4")

                sock.on("message", (msg2, rinfo) => {
                    this._socket.write(Buffer.from(
                        JSON.stringify({
                            rinfo: data.rinfo, 
                            msg: msg2.toString("base64")
                        })
                    ))
                })

                sock.bind(data.rinfo.port)

                this._connections.set(data.rinfo.port, sock)
            }
        })

        this._transport.connect(this._tcpPort)
    }
}

module.exports = Server