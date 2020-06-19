import '../src/util.js'
import * as StatHelpers from './stathelpers.js'
import Counter from '../src/Counter.js'
import * as Parser from '../src/parser.js'
import { ParseJoinLeaveStandardized, ParseTimestampedHumanReadable, ParseLoggingStandardized } from '../src/legacyparsefuncs.js'
import parse from 'csv-parse/lib/sync.js'
import * as fs from 'fs'

const parseFuncs = [ParseJoinLeaveStandardized, ParseLoggingStandardized, ParseTimestampedHumanReadable]

const counts = new Counter()

StatHelpers.forEachLogfile((filename, folder) => {
    //console.log(`PROCESSING: ${folder}\\${filename}`)
    const map = StatHelpers.parseMap(filename)
    const rawlog = parse(fs.readFileSync(`${folder}\\${filename}`), { skip_empty_lines: true, relax_column_count: true })
    const data = Parser.parse(rawlog, parseFuncs, false)

    if (StatHelpers.isValidGame(rawlog, data, filename, folder)) {
        counts.increment(map, 1)
        console.log(`${filename} - COUNTED: ${data.playerlist.length} players on ${map}`)
    }
})

StatHelpers.mergeCounters(counts, StatHelpers.versionedMaps)

fs.writeFileSync('./mapcounts.tsv', StatHelpers.counterToTSV(counts))

console.log('Done.')