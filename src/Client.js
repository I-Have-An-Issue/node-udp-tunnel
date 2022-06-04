const net = require("net")
const dgram = require("dgram")
const { EventEmitter } = require("stream")

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

			let udpsock = this._connections.get(`${fullPacket.rinfo.address}:${fullPacket.rinfo.port}`)
			if (udpsock) udpsock.send(fullPacket.msg, this._udpPort, "127.0.0.1")
			else {
				udpsock = dgram.createSocket("udp4")

				udpsock.on("message", (msg, rinfo) => {
					let payload = Buffer.from(JSON.stringify(fullPacket.rinfo) + "..." + msg.toString("base64"))
					this.emit("data_out", payload)
					let buf = Buffer.alloc(16)
					buf.writeUInt16BE(payload.length)
					this._transport.write(Buffer.concat([buf, payload]))
				})

				udpsock.once("listening", () => udpsock.send(json.msg, this._udpPort, "127.0.0.1"))

				udpsock.bind()
				this._connections.set(`${json.rinfo.address}:${json.rinfo.port}`, udpsock)
			}
		})

		this._transport.on("connect", () => this.emit("connect", this._host, this._tcpPort))
		this._transport.on("error", (e) => this.emit("error", e))
		this._transport.connect(this._tcpPort, this._host)
	}
}

module.exports = Server
