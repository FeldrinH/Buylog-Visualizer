const playerinfo = {
    "FeldrinH": {
        "color": "#ffc107"
    },
    "Atamer": {
        "color": "#1e88e5"
    },
    "kräk": {
        "color": "#c62828"
    },
    "i kill you": {
        "color": "#e040fb"
    },
    "AGoodUplayRater": {
        "color": "#43a047",
        "name": "AGoodUpl..."
    },
    "Willy": {
        "color": "#673ab7"
    },
    "Wyolop": {
        "color": "#ff5722"
    },
    "SignalBit": {
        "color": "#ffeb3b"
    },
    "Napoléon": {
        "color": "#212121"
    },
    "Külvot": {
        "color": "#795548"
    }
}

const teaminfo = {
    Red: {
        colorFull: "#ff0000",
        colorLight: "#ffaaaa"
    },
    Blue: {
        colorFull: "#0000ff",
        colorLight: "#aaaaff"
    },
    Wildcard: {
        colorFull: "#000000",
        colorLight: "#aaaaaa"
    },
    Unassigned: {
        colorFull: "#656775",
        colorLight: "#AEB0BF"
    }
}

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

export function getPlayerName(id) {
    if (playerinfo[id]) {
        return playerinfo[id].name || id
    }
    console.log(`Requested name for unknown player ${id}!`)
    return id
}

export function getTeamColor(id, lighten) {
    return lighten ? teaminfo[id].colorLight : teaminfo[id].colorFull
}