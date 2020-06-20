import type { GenericWeaponEvent, KillEvent, BuyEvent, GenericEvent } from '../src/ParsedLog.js'
import '../src/util.js'
import * as StatHelpers from './stathelpers.js'
import MultiCounter from '../src/MultiCounter.js'
import * as Parser from '../src/parser.js'
import parse from 'csv-parse/lib/sync.js'
import * as fs from 'fs'
import { isCategory, hasProperty } from '../src/util.js'

const counts: any[][] = []

const loglist = fs.readdirSync('../dist/logs/')
loglist.forEach((filename) => {
    //console.log(`PROCESSING: ${folder}\\${filename}`)
    //const map = StatHelpers.parseMap(filename)
    const rawlog = parse(fs.readFileSync(`../dist/logs/${filename}`), { skip_empty_lines: true, relax_column_count: true })
    const data = Parser.smartParse(rawlog, filename, false)

    const event = data.log[0]
    if(isCategory(event, "team") && hasProperty(event, 'reddddd')) {
        event
    }

    if (StatHelpers.isValidGame(rawlog, data, filename, '../dist/logs')) {
        if (data.log.some(e => ((<GenericWeaponEvent>e).weapon || (<GenericWeaponEvent>e).class)?.includes('tfa_cso'))) {
            return true
        }

        const buyCounts = StatHelpers.weaponCounts(data.log, (e): e is GenericWeaponEvent => e.category === 'buy' && e.type !== 'buy-ammo')
        const killCounts = StatHelpers.weaponCounts(data.log, (e): e is GenericWeaponEvent => e.type === 'kill')
        buyCounts.delete('item_battery')
        killCounts.delete('item_battery')
        const buyMax = buyCounts.map((key, value) => value).reduce((acc, cur) => Math.max(acc, cur), 0)
        const killMax = killCounts.map((key, value) => value).reduce((acc, cur) => Math.max(acc, cur), 0)
        counts.push([filename, buyMax, buyCounts.total, killMax, killCounts.total])
        console.log(`${filename} - PROCESSED`)
    }
})

fs.writeFileSync('./extremeweapons.tsv', StatHelpers.arrayToTSV(counts))

console.log('Done.')