const localeSettings = ["en-US", {timeZone: "America/New_York", hour12: false}]

module.exports = (... args) => {
    console.log([new Date().toLocaleString(... localeSettings), ... args.map(a => a === Object(a) ? JSON.stringify(a, null, 2) : a)].filter(a => a).join(" | "))
}