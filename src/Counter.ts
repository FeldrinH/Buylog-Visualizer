export default class Counter {
    counts: Map<string, number>
    total: number

    constructor() {
        this.counts = new Map()
        this.total = 0
    }

    increment(key: string, increment: number = 1) {
        this.counts.set(key, (this.counts.get(key) || 0) + increment)
        this.total += increment
    }

    set(key: string, value: number) {
        this.total -= (this.counts.get(key) || 0)
        this.total += value
        this.counts.set(key, value)
    }

    delete(key: string) {
        this.total -= (this.counts.get(key) || 0)
        return this.counts.delete(key)
    }

    get(key: string) {
        return this.counts.get(key) || 0
    }

    map<T>(func: (key: string, value: number) => T) {
        return this.counts.map(func)
    }

    forEach(func: (value: number, key: string, map: Map<string, number>) => void) {
        this.counts.forEach(func)
    }
}