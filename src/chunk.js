module.exports = (buf, max = 1000) => {
	if (buf.length <= max) return [buf]
	let arr = []
	for (let i = 0; i < Math.ceil(buf.length / max); i++) {
		arr.push(buf.slice(i * max, Math.min((i + 1) * max, buf.length)))
	}

	return arr
}
