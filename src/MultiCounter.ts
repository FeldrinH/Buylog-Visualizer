export default class MultiCounter {
    counts: Map<string, Map<string, number>>
    total: number

    constructor() {
        this.counts = new Map()
        this.total = 0
    }

    increment(key: string, varname: string = '', increment: number = 1) {
        let counters = this.counts.get(key)
        if (counters === undefined) {
            counters = new Map()
            this.counts.set(key, counters)
        }

        counters.set(varname, (counters.get(varname) || 0) + increment)
        this.total += increment
    }

    get(key: string, varname: string = '') {
        const counters = this.counts.get(key)
        return counters === undefined ? 0 : (counters.get(varname) || 0)
    }

    map<T>(func: (key: string, value: Map<string, number>) => T) {
        return this.counts.map(func)
    }

    forEach(func: (value: Map<string, number>, key: string) => void) {
        this.counts.forEach(func)
    }
}