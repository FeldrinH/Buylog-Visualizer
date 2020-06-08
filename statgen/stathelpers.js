export const validEmptyPlayers = new Set(['2020.05.21-21.48-wasteland_environment_alpha.txt', '2020.05.21-22.00-rp_clazfort.txt'])

export const locations = [
    'C:\\Users\\juhan\\BuyLog Archive\\splits',
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\GarrysMod\\garrysmod\\data\\buylogs',
    'C:\\SteamCMD\\steamapps\\common\\GarrysModDS\\garrysmod\\data\\buylogs'
]

export const versionedMaps = [
    { is: map => map.toLowerCase().includes('monk'), name: 'gm_monk' },
    { is: map => map.toLowerCase().includes('pit') || map === 'gm_oilworks', name: 'gm_pit/gm_oilworks' }
]

export function parseMap(filename) {
    if (filename.includes('-')) {
        const parse = filename.replace('.txt', '').split('-')
        return parse[2]
    } else {
        const parse = filename.split(' ')
        return parse[3]
    }
}

export function mergeVersionedMaps(counter) {
    for (const mapinfo of versionedMaps) {
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

export function counterToTSV(counter) {
    let out = ''
    counter.forEach((value, key) => {
        out += `${key}\t${value}\n`
    })
    return out
}