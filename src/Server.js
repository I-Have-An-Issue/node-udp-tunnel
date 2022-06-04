const net = require("net")
const dgram = require("dgram")
const { EventEmitter } = require("stream")
const ipBuffer = require("./ipBuffer")

class Server extends EventEmitter {
	constructor(udpPort = 27523, tcpPort = 27523) {
		super()
		this._udpPort = udpPort
		this._tcpPort = tcpPort
		this._buffer = Buffer.alloc(0)
	}

	start() {
		this._transport = net.createServer()
		this._socket = dgram.createSocket("udp4")

		this._transport.on("connection", (transport) => {
			this.emit("connection", transport.remoteAddress)

			transport.on("data", (msg) => {
				const rinfo = ipBuffer.toRinfo(msg.slice(0, 6))
				const packet = msg.slice(6, msg.length - 1)
				this._socket.send(packet, rinfo.port, rinfo.address)
			})

			this._socket.on("message", (msg, rinfo) => {
				const rinfoBuffer = ipBuffer.toBuffer(rinfo)
				const packet = Buffer.concat([rinfoBuffer, msg])
				transport.write(packet)
			})

			transport.on("error", (e) => this.emit("error", e))
		})

		this._transport.on("listening", () => this.emit("tcp_listening", this._tcpPort))
		this._socket.on("listening", () => this.emit("udp_listening", this._udpPort))

		this._socket.bind(this._udpPort)
		this._transport.listen(this._tcpPort)
	}
}

module.exports = Server
