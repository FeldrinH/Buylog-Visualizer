import type { GenericEvent, GenericWeaponEvent, GenericPlayerEvent } from '../src/ParsedLog'
import type ParsedLog from '../src/ParsedLog'
import Counter from '../src/Counter'
import type MultiCounter from '../src/MultiCounter'
import * as fs from 'fs'

export const validEmptyPlayers = new Set(['2020.05.21-21.48-wasteland_environment_alpha.txt', '2020.05.21-22.00-rp_clazfort.txt'])

export const locations = [
    'C:\\Users\\juhan\\BuyLog Archive\\splits',
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\GarrysMod\\garrysmod\\data\\buylogs',
    'C:\\SteamCMD\\steamapps\\common\\GarrysModDS\\garrysmod\\data\\buylogs'
]

interface MergeSpec {
    is: (id: string) => boolean,
    name: string
}

export const versionedMaps: MergeSpec[] = [
    { is: map => map.toLowerCase().includes('monk'), name: 'gm_monk' },
    { is: map => map.toLowerCase().includes('pit') || map === 'gm_oilworks', name: 'gm_pit/gm_oilworks' }
]

const paul = new Set(['Napoléon', 'Patron', 'TRUMP', 'Don Pablo', 'El Padrino', 'Mierda', 'Kim Jong-un', 'Paulo', 'Pablo'])
const leidt = new Set(['Silvio', 'kräk'])
const elias = new Set(['Wyolop', 'ElierWorks'])
const eerik = new Set(['eerik.haamer', 'Ez Hammer'])
const rauno = new Set(['User #2', 'marcusmaa', '9S', '(1)martIn1950', '(1)martin1950'])
export const userAlts : MergeSpec[] = [
    { is: map => paul.has(map), name: 'Paul' },
    { is: map => leidt.has(map), name: 'Leidt' },
    { is: map => elias.has(map), name: 'Elias' },
    { is: map => eerik.has(map), name: 'Eerik' },
    { is: map => rauno.has(map), name: 'Rauno' }
]

export function forEachLogfile(func) {
    //throw new Error('Deprecated. Iterate ../dist/logs folder.')
    for (const folder of locations) {
        for (const filename of fs.readdirSync(folder)) {
            func(filename, folder)
        }
    }
}

export function weaponCounts(eventlist: GenericEvent[], isTargetEvent: (e: GenericEvent) => e is GenericWeaponEvent) {
    const counts = new Counter()

    for (const e of eventlist) {
        if (isTargetEvent(e)) {
            const weapon = e.weapon || e.class
            counts.increment(weapon)
        }
    }

    return counts
}

export function isValidGame(rawlog: any[][], data: ParsedLog, filename: string, folder: string) {
    const playercount = data.playerlist.length
    if (playercount === 0) {
        throw new Error(`${folder}\\${filename} - ERROR: No players logged`)
    } else if (playercount <= 2) {
        console.log(`${filename} - SKIPPED: Too few players (${playercount})`)
        return false
    } else if (rawlog.length < 200) {
        console.log(`${filename} - SKIPPED: Too few events (${rawlog.length})`)
        return false
    } else {
        return true
    }
}

export function parseMap(filename: string) {
    if (filename.includes('-')) {
        const parse = filename.replace('.txt', '').split('-')
        return parse[2]
    } else {
        const parse = filename.split(' ')
        return parse[3]
    }
}

export function altToMain(name: string) {
    for (const info of userAlts) {
        if (info.is(name)) {
            return `${info.name} (total)`
        }
    }
    return name
}

export function mergeCounters(counter: Counter, mergeRules: MergeSpec[]) {
    for (const mapinfo of mergeRules) {
        const mergedMaps = []
        let total = 0
        counter.forEach((value, key) => {
            if (mapinfo.is(key)) {
                total += value
                counter.delete(key)
                mergedMaps.push(key)
            }
        })
        counter.set(`${mapinfo.name} (total)`, total)
        console.log(`Merged ${mergedMaps.join(', ')} into ${mapinfo.name}`)
    }
}

export function arrayToTSV(array: any[][]) {
    let out = ''
    array.forEach((value) => {
        out += `${value.join('\t')}\n`
    })
    return out
}

export function counterToTSV(counter: Counter) {
    let out = ''
    counter.forEach((value, key) => {
        out += `${key}\t${value}\n`
    })
    return out
}

export function mutiCounterToTSV(counter: MultiCounter, valuekeys: string[]) {
    let out = ''
    counter.forEach((values, key) => {
        out += `${key}\t${valuekeys.map(k => (values.get(k) || 0)).join('\t')}\n`
    })
    return out
}