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
        this._transport.on("connection", socket => {
            // The server needs to send this data to the external client
            socket.on("data", msg => {
                // Re-encode the data
                let data = JSON.parse(msg.toString())
                let buf = Buffer.from(data.msg, "base64")

                // Send the data to the external client
                this._socket.send(buf, data.rinfo.port, data.rinfo.address)
            })

            // The server should wrap this data up and send it downstream
            this._socket.on("message", (msg, rinfo) => {
                socket.write(Buffer.from(
                    JSON.stringify({
                        rinfo, 
                        msg: msg.toString("base64")
                    })
                ))
            })
        })

        this._socket.bind(this._udpPort)
        this._transport.listen(this._tcpPort)
    }
}

module.exports = Server