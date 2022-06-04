module.exports.toBuffer = (rinfo) => {
	let ip = rinfo.address.split(".")
	let buf = Buffer.alloc(6)
	buf.writeUInt8(parseInt(ip[0]), 0)
	buf.writeUInt8(parseInt(ip[1]), 1)
	buf.writeUInt8(parseInt(ip[2]), 2)
	buf.writeUInt8(parseInt(ip[3]), 3)
	buf.writeUInt16BE(parseInt(rinfo.port), 4)
	return buf
}

module.exports.toRinfo = (buf) => {
	return {
		address: `${buf.readUInt8(0)}.${buf.readUInt8(1)}.${buf.readUInt8(2)}.${buf.readUInt8(3)}`,
		port: buf.readUInt16BE(4),
	}
}
