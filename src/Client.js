const net = require("net")
const dgram = require("dgram")
const log = require("./log")

class Server {
    constructor(host = "LOL", udpPort = 27523, tcpPort = 27523) {
        this._host = host
        this._udpPort = udpPort
        this._tcpPort = tcpPort
        this._connections = new Map()
        this._buffer = Buffer.allocUnsafe(0)
    }

    start() {
        this._transport = net.Socket()

        this._transport.on("data", msg => {
            this._buffer = Buffer.concat([this._buffer, msg])
            if(this._buffer.length < 3) return

            let length = this._buffer.readUInt16BE()
            if(this._buffer.length - 3 < length) return

            let json = null
            try { json = JSON.parse(this._buffer.toString("utf-8", 2, 2 + length)) } 
            catch (err) { console.log(err) }

            this._buffer = Buffer.allocUnsafe(0)

            if (!json) return
            json.msg = Buffer.from(json.msg, "base64")

            if (this._connections.has(`${json.rinfo.address}:${json.rinfo.port}`)) {
                this._connections.get(`${json.rinfo.address}:${json.rinfo.port}`).send(json.msg, null, null, this._udpPort, "127.0.0.1")
            } else {
                let sock = dgram.createSocket()

                sock.on("message", (msg, rinfo) => {
                    let json = Buffer.from(JSON.stringify({ rinfo: json.rinfo, msg: msg.toString("base64") }))
                    let buf = Buffer.allocUnsafe(2)
                    buf.writeUInt16BE(json.length)
                    transport.write(Buffer.concat([ buf, json ]))
                })

                sock.send(json.msg, null, null, this._udpPort, "127.0.0.1")
                sock.bind()
                this._connections.set(`${json.rinfo.address}:${json.rinfo.port}`, sock)
            }
        })

        this._transport.on("connect", () => log(`Connected to transport socket: ${this._host}`))
        this._transport.on("error", e => console.log(e))
        this._transport.connect(this._tcpPort, this._host)
    }
}

module.exports = Server
