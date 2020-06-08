import palette from './palette.js'

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

/* Map.prototype.getset = function(key, defaultval) {
    if (!this.has(key)) {
        this.set(key, defaultval)
    }
    return this.get(key)
} */

export function mod(n, m) {
    return ((n % m) + m) % m
}

export function round(number, decimals) {
    const exp = 10 ** decimals
    return Math.round((number + Number.EPSILON) * exp) / exp
}

// isObject() and extend() taken from ApexCharts /utils/Utils.js (https://github.com/apexcharts/apexcharts.js/blob/master/src/utils/Utils.js) and optimized for a more restricted use case

function isObject(item) {
    return ( item && typeof item === 'object' && !Array.isArray(item) && item != null )   
}

// credit: http://stackoverflow.com/questions/27936772/deep-object-merging-in-es6-es7#answer-34749873
export function extend(target, source) {
    let output = target; //Object.assign({}, target)
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, {
                        [key]: source[key]
                    })
                } else {
                    output[key] = extend(target[key], source[key])
                }
            } else {
                Object.assign(output, {
                    [key]: source[key]
                })
            }
        })
    }
    return output
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