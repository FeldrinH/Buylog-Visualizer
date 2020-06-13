import '../src/util.js'
import * as StatHelpers from './stathelpers.js'
import Counter from '../src/Counter.js'
import * as Parser from '../src/parser.js'
import { ParseKill, ParseBuy } from '../src/currentparsefuncs.js'
import { ParseJoinLeaveStandardized, ParseTimestampedHumanReadable, ParseLoggingStandardized } from '../src/legacyparsefuncs.js'
import parse from 'csv-parse/lib/sync.js'
import * as fs from 'fs'

function getPlaytime(eventlist, endTimestamp) {
    let totalTime = 0
    
    let activeCount = 0
    let lastTimestamp = null
    const appendEvent = (activeDelta, curTimestamp) => {
        if (activeCount > 2) {
            const diff = curTimestamp.diff(lastTimestamp, 'hours', true)
            if (diff < 0 || diff > 8) {
                throw new Error(`Unexpected difference between timestamps: ${diff}h`)
            }
            totalTime += diff
        }
        lastTimestamp = curTimestamp
        activeCount = activeCount + activeDelta
    }

    for (const e of eventlist) {
        if (e.category === 'joinleave') {
            if (e.type === 'join') {
                appendEvent(1, e.timestamp)
            } else if (e.type === 'leave') {
                appendEvent(-1, e.timestamp)
            } else if (e.type === 'afk-enter') {
                appendEvent(-1, e.timestamp)
            } else if (e.type === 'afk-leave') {
                appendEvent(1, e.timestamp)
            } else {
                console.log(`Unknown player state change event '${e.type} (${e.category})'`)
            }
        }
    }
    appendEvent(-50, endTimestamp)

    return totalTime
}

const parseFuncs = [ParseJoinLeaveStandardized, ParseLoggingStandardized, ParseTimestampedHumanReadable]

const counts = new Counter()

StatHelpers.forEachLogfile((filename, folder) => {
    //console.log(`PROCESSING: ${folder}\\${filename}`)
    const map = StatHelpers.parseMap(filename)
    const rawlog = parse(fs.readFileSync(`${folder}\\${filename}`), { skip_empty_lines: true, relax_column_count: true })
    const data = Parser.parse(rawlog, parseFuncs, false)
    
    if (StatHelpers.isValidGame(rawlog, data, filename, folder)) {
        const playtime = getPlaytime(data.log, data.endtimestamp)
        if (playtime > 0) {
            counts.increment(map, playtime)
            console.log(`${filename} - PROCESSED: Playtime ${playtime}h`)
        } else {
            console.log(`${filename} - SKIPPED: Invalid playtime ${playtime}h`)
        }   
    }
})

StatHelpers.mergeVersionedMaps(counts)

fs.writeFileSync('./mapplaytime.tsv', StatHelpers.counterToTSV(counts))

console.log('Done.')