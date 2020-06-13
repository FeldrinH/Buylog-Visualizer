import '../src/util.js'
import * as StatHelpers from './stathelpers.js'
import MultiCounter from '../src/MultiCounter.js'
import * as Parser from '../src/parser.js'
import { ParseKill, ParseDeath } from '../src/currentparsefuncs.js'
import { ParseJoinLeaveStandardized, ParseTimestampedHumanReadable, ParseLoggingStandardized } from '../src/legacyparsefuncs.js'
import parse from 'csv-parse/lib/sync.js'
import * as fs from 'fs'

const parseFuncs = [ParseKill, ParseDeath, ParseJoinLeaveStandardized, ParseLoggingStandardized, ParseTimestampedHumanReadable]

function countKills(counts, eventlist, year) {
    for (const e of eventlist) {
        if (e.type === 'kill') {
            counts.increment(StatHelpers.altToMain(e.player), `${year}_kill`)
        } else if (e.type === 'death') {
            counts.increment(StatHelpers.altToMain(e.player), `${year}_death`)
        }
    }
}

const kdcounts = new MultiCounter()

StatHelpers.forEachLogfile((filename, folder) => {
    //console.log(`PROCESSING: ${folder}\\${filename}`)
    //const map = StatHelpers.parseMap(filename)
    const rawlog = parse(fs.readFileSync(`${folder}\\${filename}`), { skip_empty_lines: true, relax_column_count: true })
    const data = Parser.parse(rawlog, parseFuncs, false)
    const year = data.starttimestamp ? data.starttimestamp.year() : '2017'
    if (!data.starttimestamp) {
        console.log(`${filename} - No year detected. Defaulting to 2017`)
    }

    if (StatHelpers.isValidGame(rawlog, data, filename, folder)) {
        countKills(kdcounts, data.log, year)
        //console.log(`${filename} - PROCESSED`)
    }
})

fs.writeFileSync('./killcount.tsv', StatHelpers.mutiCounterToTSV(kdcounts, ['2017_kill', '2017_death', '2018_kill', '2018_death', '2019_kill', '2019_death', '2020_kill', '2020_death']))

console.log('Done.')