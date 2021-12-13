const net = require("net")
const dgram = require("dgram")
const log = require("./log")

class Server {
    constructor(udpPort = 27523, tcpPort = 27523) {
        this._udpPort = udpPort
        this._tcpPort = tcpPort
        this._buffer = Buffer.allocUnsafe(0)
    }

    start() {
        this._transport = net.createServer()
        this._socket = dgram.createSocket("udp4")

        this._transport.on("connection", transport => {
            log(`New transport connection: ${transport.remoteAddress}`)

            transport.on("data", msg => {
                this._buffer = Buffer.concat([this._buffer, msg])
                if(this._buffer.length < 3) return

                let length = this._buffer.readUInt16BE()
                if(this._buffer.length - 3 < length) return

                let json = null
                try { json = JSON.parse(this._buffer.toString("UTF-8", 3, 3 + length)) } 
                catch (err) { console.log(err) }

                this._buffer = Buffer.allocUnsafe(0)

                if (!json) return
                json.msg = Buffer.from(json.msg, "base64")

                this._socket.send(json.msg, json.rinfo.port, json.rinfo.address)
            })

            this._socket.on("message", (msg, rinfo) => {
                let json = Buffer.from(JSON.stringify({ rinfo, msg: msg.toString("base64") }))
                let buf = Buffer.allocUnsafe(2)
                buf.writeUInt16BE(json.length)
                transport.write(Buffer.concat([ buf, json ]))
            })

            transport.on("error", e => console.log(e))
        })

        this._socket.bind(this._udpPort)
        this._transport.listen(this._tcpPort)
    }
}

module.exports = Server
