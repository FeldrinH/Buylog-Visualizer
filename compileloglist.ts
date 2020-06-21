import fs from 'fs'
import * as Parser from './src/parser.js'
import parse from 'csv-parse/lib/sync.js'

import logcounts from './logcounts.js'

const loglist = fs.readdirSync('./dist/logs/')
const gamelist = parse(fs.readFileSync('gamelist.txt'), { skip_empty_lines: true, relax_column_count: true })

let i = 0
const mergedlist = loglist.map(opt => {
    const games = []
    while (i < gamelist.length && gamelist[i][0] === opt) {
        games.push({
            name: gamelist[i][1],
            start: gamelist[i][2],
            end: gamelist[i][3],
            meta: gamelist[i][4]
        })
        i += 1
    }

    let plycount = logcounts[opt]
    if (!plycount) {
        console.log(`Counting players for ${opt}`)
        const rawlog = parse(fs.readFileSync(`./dist/logs/${opt}`), { skip_empty_lines: true, relax_column_count: true })
        const data = Parser.smartParse(rawlog, opt, false, true)
        plycount = data.playerlist.length
        logcounts[opt] = plycount
    }
    
    return {
        log: opt,
        plys: plycount,
        games: games
    }
})
if (i !== gamelist.length) {
    console.log('UNPARSED GAMELIST VALUES. CHECK GAMELIST ORDERING!')
}

mergedlist.reverse()

fs.writeFileSync('./src/loglist.js', 'export default ' + JSON.stringify(mergedlist, null, 2))
fs.writeFileSync('./logcounts.js', 'export default ' + JSON.stringify(logcounts, null, 2))

console.log('Compiled loglist.')