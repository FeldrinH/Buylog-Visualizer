import palette from './palette.js'

Map.prototype.map = function(func) {
    const ret = []
    this.forEach((value, key) => {
        ret.push(func(key, value))
    })
    return ret
}

Map.prototype.getset = function(key, defaultval) {
    if (!this.has(key)) {
        this.set(key, defaultval)
    }
    return this.get(key)
}

export function mod(n, m) {
    return ((n % m) + m) % m
}

export function findFirstMatching(iterlist, start, step, filter, inLimit) {
    for (let i = start; i >= 0 && i < iterlist.length; i += step) {
        if (!inLimit(iterlist[i])) {
            break
        } else if (filter(iterlist[i])) {
            return iterlist[i]
        }
    }
    return null
}

export function findLastMatching(iterlist, start, step, filter, inLimit) {
    let lastMatching = null
    for (let i = start; i >= 0 && i < iterlist.length; i += step) {
        if (!inLimit(iterlist[i])) {
            break
        } else if (filter(iterlist[i])) {
            lastMatching = iterlist[i]
        }
    }
    return lastMatching
}

export function findInRange(iterlist, start, end, isbackwards, filter) {
    let rangeReached = false
    for (let i = isbackwards ? iterlist.length-1 : 0; i >= 0 && i < iterlist.length; i += isbackwards ? -1 : 1) {
        const event = iterlist[i]
        if (event.time >= start && event.time <= end) {
            if (filter(event)) {
                return event
            }
            rangeReached = true
        } else if (rangeReached) {
            return null
        }
    }
    return null
}

export function getLoopingPaletteGenerator() {
    const cache = new Map()
    let index = 0
    return (str) => {
        let ret = cache.get(str)
        if (ret) {
            return ret
        }
        ret = palette[index % palette.length]
        cache.set(str, ret)
        index += 1
        return ret
    }
}