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
			const packet = msg.slice(6, msg.length)
			let socket = this._connections.get(`${rinfo.address}:${rinfo.port}`)
			if (socket) socket.send(packet, this._udpPort, "127.0.0.1")
			else {
				socket = dgram.createSocket("udp4")
				this._connections.set(`${rinfo.address}:${rinfo.port}`, socket)

				socket.on("message", (msg2, rinfo) => {
					const incomingRinfo = ipBuffer.toBuffer(rinfo)
					const packet = Buffer.concat([incomingRinfo, msg2])
					console.log("[client in]", packet.length)
					this._transport.write(packet)
				})

				socket.on("listening", () => {
					socket.send(packet, this._udpPort, "127.0.0.1")
				})
			}
			console.log("[client out]", msg.length)
		})

		this._transport.on("connect", () => this.emit("connect", this._host, this._tcpPort))
		this._transport.on("error", (e) => this.emit("error", e))
		this._transport.connect(this._tcpPort, this._host)
	}
}

module.exports = Server
