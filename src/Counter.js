export default class Counter {
    constructor() {
        this.counts = new Map()
        this.total = 0
    }

    increment(key, increment = 1) {
        this.counts.set(key, (this.counts.get(key) || 0) + increment)
        this.total += increment
    }

    get(key) {
        return this.counts.get(key) || 0
    }

    map(func) {
        return this.counts.map(func)
    }
}