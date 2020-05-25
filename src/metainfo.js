import playerinfo from './playerinfo.js'
//import objectinfo from './objectinfo.js'
import * as Util from './util'

function stringHashCode(str) {
    let hash = 0;
    if (str.length == 0) {
        return hash;
    }
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

export function getPlayerColor(id) {
    if (playerinfo[id]) {
        return playerinfo[id].color
    }
    console.log(`Requested color for unknown player ${id}!`)
    return '#000'
}