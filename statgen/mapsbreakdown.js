import * as Util from '../src/util.js'
import Counter from '../src/Counter.js'
import * as LegacyParser from '../src/legacyparser.js'
import parse from 'csv-parse/lib/sync.js'
import * as fs from 'fs'

function ParseMap(filename) {
    if (filename.includes('-')) {
        const parse = filename.replace('.txt', '').split('-')
        return parse[2]
    } else {
        const parse = filename.split(' ')
        return parse[3]
    }
}

const validEmptyPlayers = new Set(['2020.05.21-21.48-wasteland_environment_alpha.txt', '2020.05.21-22.00-rp_clazfort.txt'])

const playtime = new Counter()

const locations = ['C:\\Users\\juhan\\BuyLog Archive\\splits', 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\GarrysMod\\garrysmod\\data\\buylogs', 'C:\\SteamCMD\\steamapps\\common\\GarrysModDS\\garrysmod\\data\\buylogs']

for (const folder of locations) {
    for (const filename of fs.readdirSync(folder)) {
        //console.log(`${filename} - PROCESSING`)

        const map = ParseMap(filename)
        const rawlog = parse(fs.readFileSync(`${folder}\\${filename}`), { skip_empty_lines: true, relax_column_count: true })
        //console.log(JSON.stringify(rawlog, null, 2))
        //console.log(`CSV parsed`)
        const data = {}
        LegacyParser.parse(rawlog, data)
        //console.log(`Buylog parsed`)

        const playercount = data.playerlist.length
        if (playercount === 0) {
            if (!filename.includes('[0]')) {
                //console.log(JSON.stringify(rawlog, null, 2))
                throw new Error(`${folder}\\${filename} - ERROR: No players logged`)
            } else {
                console.log(`${filename} - SKIPPED: No players logged`)
            }
        } else if (playercount <= 2) {
            console.log(`${filename} - SKIPPED: Too few players (${playercount})`)
        } else {
            if (data.log[data.log.length - 1].type !== 'logging-ended') {
                console.log(`${filename} - WARNING: No logging end event`)
            }

            let totaltime = 0
            data.players.forEach((info, id) => {
                const playertime = info.stateblocks.sum(x => x.state == 'active' ? x.end.diff(x.start, 'hours', true) : 0)
                if (playertime <= 0 && !validEmptyPlayers.has(filename) && data.log[data.log.length - 1].type === 'logging-ended') {
                    throw new Error(`${folder}\\${filename} - ERROR: ${Util.round(playertime, 2)}h playtime for ${id} on ${map}`)
                }
                totaltime += playertime
            })
            if (totaltime > 0) {
                playtime.increment(map, totaltime)
                console.log(`${filename} - PROCESSED: ${Util.round(totaltime, 2)}h playtime on ${map}`)
            } else {
                throw new Error(`${folder}\\${filename} - ERROR: ${Util.round(totaltime, 2)}h playtime on ${map}`)
            }
        }
    }
}

let out = ''
playtime.forEach((value, key) => {
    out += `${key}\t${value}\n`
})
fs.writeFileSync('./maptimes.csv', out)

console.log('Done.')