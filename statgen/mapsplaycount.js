import '../src/util.js'
import * as StatHelpers from './stathelpers.js'
import Counter from '../src/Counter.js'
import * as LegacyParser from '../src/legacyparser.js'
import parse from 'csv-parse/lib/sync.js'
import * as fs from 'fs'

const playtime = new Counter()

for (const folder of StatHelpers.locations) {
    for (const filename of fs.readdirSync(folder)) {
        const map = StatHelpers.parseMap(filename)
        const rawlog = parse(fs.readFileSync(`${folder}\\${filename}`), { skip_empty_lines: true, relax_column_count: true })
        //console.log(JSON.stringify(rawlog, null, 2))
        const data = {}
        LegacyParser.parse(rawlog, data)

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
        } else if (rawlog.length < 200) {
            console.log(`${filename} - SKIPPED: Too few events (${rawlog.length})`)
        } else {
            playtime.increment(map, 1)
            console.log(`${filename} - COUNTED: ${playercount} players on ${map}`)
        }
    }
}
StatHelpers.mergeVersionedMaps(playtime)

fs.writeFileSync('./mapcounts.csv', StatHelpers.counterToTSV(playtime))

console.log('Done.')