import fs from 'fs'
import * as Parser from '../src/parser.js'
import parse from 'csv-parse/lib/sync.js'
import { legacyFullParseFuncs } from '../src/legacyparsefuncs.js'

const findplayers = ['martin1950', 'Külvot']

const loglist = fs.readdirSync('../dist/logs/')

const foundlogs = []
loglist.forEach(filename => {
    const rawlog = parse(fs.readFileSync(`../dist/logs/${filename}`), { skip_empty_lines: true, relax_column_count: true })
    const data = Parser.parse(rawlog, legacyFullParseFuncs, false, true)
    if (findplayers.every(player => data.playerlist.some(ply => ply === player))) {
        foundlogs.push(filename)
    }
})

console.log()
foundlogs.forEach(filename => {
    console.log(`${filename}`)
})

console.log('Done.')