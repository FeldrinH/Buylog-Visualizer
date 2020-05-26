export default class MultiCounter {
    constructor() {
        this.counts = new Map()
        this.total = 0
    }

    increment(key, varname = '', increment = 1) {
        let counters = this.counts.get(key)
        if (counters === undefined) {
            counters = new Map()
            this.counts.set(key, counters)
        }

        counters.set(varname, (counters.get(varname) || 0) + increment)
        this.total += increment
    }

    get(key, varname = '') {
        const counters = this.counts.get(key)
        return counters === undefined ? 0 : (counters.get(varname) || 0)
    }

    map(func) {
        return this.counts.map(func)
    }
}