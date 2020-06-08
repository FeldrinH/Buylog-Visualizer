export default class Counter {
    constructor() {
        this.counts = new Map()
        this.total = 0
    }

    increment(key, increment = 1) {
        this.counts.set(key, (this.counts.get(key) || 0) + increment)
        this.total += increment
    }

    set(key, value) {
        this.total -= (this.counts.get(key) || 0)
        this.total += value
        return this.counts.set(key, value)
    }

    delete(key) {
        this.total -= (this.counts.get(key) || 0)
        return this.counts.delete(key)
    }

    get(key) {
        return this.counts.get(key) || 0
    }

    map(func) {
        return this.counts.map(func)
    }

    forEach(func) {
        return this.counts.forEach(func)
    }
}