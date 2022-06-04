const net = require("net")
const dgram = require("dgram")
const { EventEmitter } = require("stream")
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
				this._buffer = Buffer.concat([this._buffer, msg])
				if (this._buffer.length < 16) return

				let length = this._buffer.readUInt16BE()
				if (this._buffer.length - 16 < length) return

				let packet = Buffer.alloc(length)
				this._buffer.copy(packet, 0, 16, length + 16)
				this._buffer = this._buffer.slice(length + 16, this._buffer.length)

				let data = packet.toString("UTF-8")

				let fullPacket = {
					rinfo: JSON.parse(data.split("...")[0]),
					msg: data.split("...")[1],
				}

				fullPacket.msg = Buffer.from(fullPacket.msg, "base64")
				this.emit("data_in", fullPacket)

				this._socket.send(fullPacket.msg, fullPacket.rinfo.port, fullPacket.rinfo.address)

				console.log(this._buffer.length)
				this._buffer = Buffer.alloc(0)
			})

			this._socket.on("message", (msg, rinfo) => {
				let json = Buffer.from(JSON.stringify(rinfo) + "..." + msg.toString("base64"))
				this.emit("data_out", json)
				let buf = Buffer.alloc(16)
				buf.writeUInt16BE(json.length)
				transport.write(Buffer.concat([buf, json]))
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
