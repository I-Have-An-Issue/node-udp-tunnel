const net = require("net")
const dgram = require("dgram")
const { EventEmitter } = require("stream")
const ipBuffer = require("./ipBuffer")

class Server extends EventEmitter {
	constructor(host = "127.0.0.1", udpPort = 27523, tcpPort = 27523) {
		super()
		this._host = host
		this._udpPort = udpPort
		this._tcpPort = tcpPort
		this._connections = new Map()
		this._buffer = Buffer.alloc(0)
	}

	start() {
		this._transport = net.Socket()

		this._transport.on("data", (msg) => {
			const rinfo = ipBuffer.toRinfo(msg.slice(0, 6))
			let socket = this._connections.get(`${rinfo.address}:${rinfo.port}`)
			if (socket) socket.send(msg.slice(6), this._udpPort, "127.0.0.1")
			else {
				socket = dgram.createSocket("udp4")

				socket.on("message", (msg, rinfo) => {
					const incomingRinfo = ipBuffer.toBuffer(rinfo)
					this._transport.write(Buffer.concat([incomingRinfo, msg]))
				})
			}
		})

		this._transport.on("connect", () => this.emit("connect", this._host, this._tcpPort))
		this._transport.on("error", (e) => this.emit("error", e))
		this._transport.connect(this._tcpPort, this._host)
	}
}

module.exports = Server
