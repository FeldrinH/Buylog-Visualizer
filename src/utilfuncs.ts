declare global {
    interface Map<K,V> {
        map<U>(callbackfn: (key: K, value: V) => U): U[]
    }

    interface Array<T> {
        count(callbackfn: (value: T) => boolean): number
        sum(callbackfn: (value: T) => number): number
        findLast(callbackfn: (value: T) => boolean): T
    }
}


Map.prototype.map = function(func) {
    const ret = []
    this.forEach((value, key) => {
        ret.push(func(key, value))
    })
    return ret
}

Array.prototype.count = function(func) {
    let count = 0
    for (const elem of this) {
        if (func(elem)) {
            count += 1
        }
    }
    return count
}

Array.prototype.sum = function(func) {
    let total = 0
    for (const elem of this) {
        total += func(elem)
    }
    return total
}

Array.prototype.findLast = function(func) {
    for (let i = this.length - 1; i >=0; i--) {
        if (func(this[i])) {
            return this[i]
        }
    }
    return undefined
}

/* Map.prototype.getset = function(key, defaultval) {
    if (!this.has(key)) {
        this.set(key, defaultval)
    }
    return this.get(key)
} */

export {}