import fs from 'fs'
import * as CSV from '@vanillaes/csv'

const loglist = fs.readdirSync('./dist/logs/')
const gamelist = CSV.parse(fs.readFileSync('gamelist.txt'), { typed: false })

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

    return {
        log: opt,
        games: games
    }
})
if (i !== gamelist.length) {
    console.log('UNPARSED GAMELIST VALUES. CHECK GAMELIST ORDERING!')
}

mergedlist.reverse()

fs.writeFileSync('./src/loglist.js', 'export default ' + JSON.stringify(mergedlist, null, 2))