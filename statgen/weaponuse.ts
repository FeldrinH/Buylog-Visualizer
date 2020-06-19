import '../src/util.js'
import * as StatHelpers from './stathelpers.js'
import MultiCounter from '../src/MultiCounter.js'
import * as Parser from '../src/parser.js'
import { ParseKill, ParseBuy } from '../src/currentparsefuncs.js'
import { ParseJoinLeaveStandardized, ParseTimestampedHumanReadable, ParseLoggingStandardized } from '../src/legacyparsefuncs.js'
import parse from 'csv-parse/lib/sync.js'
import * as fs from 'fs'

const parseFuncs = [ParseKill, ParseBuy, ParseJoinLeaveStandardized, ParseLoggingStandardized, ParseTimestampedHumanReadable]

function countWeapons(counts, type, eventlist, eventtypes) {
    for (const e of eventlist) {
        if (eventtypes.has(e.type)) {
            const weapon = e.weapon || e.class
            counts.increment(weapon, type)
        }
    }
}

const machinecounts = new MultiCounter()
const weaponcounts = new MultiCounter()

StatHelpers.forEachLogfile((filename, folder) => {
    //console.log(`PROCESSING: ${folder}\\${filename}`)
    //const map = StatHelpers.parseMap(filename)
    const rawlog = parse(fs.readFileSync(`${folder}\\${filename}`), { skip_empty_lines: true, relax_column_count: true })
    const data = Parser.parse(rawlog, parseFuncs, false)
    
    if (StatHelpers.isValidGame(rawlog, data, filename, folder)) {
        countWeapons(machinecounts, 'buy', data.log, new Set(['buy-entity', 'buy-vehicle']))
        countWeapons(weaponcounts, 'buy', data.log, new Set(['buy-weapon', 'buy-weapon-drop', 'buy-entity', 'buy-vehicle']))
        countWeapons(weaponcounts, 'kill', data.log, new Set(['kill']))
        console.log(`${filename} - PROCESSED`)
    }
})

fs.writeFileSync('./weaponcounts.tsv', StatHelpers.mutiCounterToTSV(weaponcounts, ['buy', 'kill']))
fs.writeFileSync('./machinecounts.tsv', StatHelpers.mutiCounterToTSV(machinecounts, ['buy']))

console.log('Done.')