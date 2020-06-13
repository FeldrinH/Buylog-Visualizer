import parse from 'csv-parse/lib/sync.js'
import ApexCharts from 'apexcharts'
import moment from 'moment'
import * as Util from './util'
import * as Info from './metainfo'
import * as Parser from './parser'
import * as Helper from './processhelper'
import * as Charts from './charts'
import { currentParseFuncs } from './currentparsefuncs'
import { legacyFullParseFuncs } from './legacyparsefuncs'

export default class DashboardManager {
    constructor() {
        this.needsReload = true
        this.needsUpdate = true

        this.params = new URLSearchParams(window.location.search)
        this.filename = this.params.get("log")
        this.start = parseFloat(this.params.get("start"))
        this.end = parseFloat(this.params.get("end"))
        this.metaString = this.params.get("meta") || ""
        this.update()
    }

    setFilename(filename) {
        if (filename !== this.filename) {
            this.filename = filename
            this.params.set("log", filename)
            this.needsReload = true
            this.needsUpdate = true
        }
    }
    setStart(start) {
        if (!Object.is(start, this.start)) {
            this.start = start
            this.params.set("start", isFinite(start) ? start : '')
            this.needsUpdate = true
        }
    }
    setEnd(end) {
        if (!Object.is(end, this.end)) {
            this.end = end
            this.params.set("end", isFinite(end) ? end : '')
            this.needsUpdate = true
        }   
    }
    setMeta(metaString) {
        if (metaString !== this.metaString) {
            this.metaString = metaString
            this.params.set("meta", metaString)
            this.needsUpdate = true
        }   
    }

    parseMeta(metaString) {
        const ret = {}
        if (metaString) {
            metaString.split(',').forEach(pair => {
                let [key, value] = pair.split(':', 2)
                if (Number.isFinite(Number(value))) {
                    value = Number(value)
                }
                ret[key] = value
            })
        }
        return ret
    }

    parseLogDate(filename) {
        const [ date, time, mapstr ] = filename.split('-')
        return moment(`${date} ${time}`, 'YYYY.MM.DD HH.mm', true)
    }

    getValidStart() {
        return isFinite(this.start) ? this.start : this.data.starttime
    }
    getValidEnd() {
        return isFinite(this.end) ? this.end : this.data.endtime
    }

    async update() {
        console.log(`Updating charts  Reload: ${this.needsReload}  Update: ${this.needsUpdate}`)
        console.log(`${this.filename},NAME,${isFinite(this.start) ? this.start : ''},${isFinite(this.end) ? this.end : ''},${this.metaString}`)
        
        if (this.needsReload || this.needsUpdate) {
            window.history.pushState(`${this.filename} [${this.start};${this.end}]`, null, `?${this.params.toString()}`)

            this.meta = this.parseMeta(this.metaString)
            //console.log(this.meta)

            if (this.needsReload) {
                await this.loadData()
    
                this.needsReload = false
            }
            if (this.needsUpdate) {
                this.filterData()
    
                this.clearCharts()
                this.renderCharts()
    
                this.needsUpdate = false
            }
        }
    }

    async loadData() {
        const dataStr = await (await fetch(`/logs/${this.filename}`)).text()
        this.rawlog = parse(dataStr, { skip_empty_lines: true, relax_column_count: true, cast: true })
        
        this.logdate = this.parseLogDate(this.filename)
        if (!this.logdate.isValid()) {
            console.log(`WARNING: Invalid log date '${this.logdate._i}'`)
        }
        this.legacyparse = this.logdate.year() <= 2019
        if (this.legacyparse) {
            console.log('INFO: Old log detected. Using legacy parser.')
        }

        this.data = Parser.parse(this.rawlog, this.legacyparse ? legacyFullParseFuncs : currentParseFuncs, true)

        /* this.log.forEach(e => {
            if (e.type === 'reset-full') {
                console.log(`${e.type}  ${e.time}`)
            }
        }) */
    }

    filterData() {
        const start = this.getValidStart()
        const end = this.getValidEnd()
        this.data.filteredlog = this.data.log.filter(e => e.time >= start && e.time <= end)
    }

    renderCharts() {
        const weaponPaletteGenerator = Util.getLoopingPaletteGenerator()

        Charts.setupDefaults()  
    
        let options = {
            series: [{
                data: Helper.stateTimelineSeries(this.data.players)
            }],
            chart: {
                height: 300,
                type: 'rangeBar'
            },
            plotOptions: {
                bar: {
                    horizontal: true
                }
            },
            tooltip: {
                x: {
                    formatter: (val) => val
                },
                y: {
                    formatter: (val, { w, seriesIndex, dataPointIndex }) => {
                        const dataPoint = w.config.series[seriesIndex].data[dataPointIndex]
                        return `${dataPoint.x} (${dataPoint.state}):`
                    }
                }
            },
            xaxis: {
                type: 'datetime',
                min: this.getValidStart(),
                max: this.getValidEnd()
            }
        };
        new ApexCharts(document.querySelector("#statechart"), options).render();

        const killsBreakdown = Helper.killsBreakdown(this.data.filteredlog, this.data.playerlist).sort((a,b) => (b.kills - a.kills))
        //console.log(killsBreakdown)

        Charts.addBar(document.querySelector("#killsdeaths"), {
            series: [
                {
                    name: 'Kills',
                    data: killsBreakdown.map(val => ({
                        x: val.player,
                        y: val.kills
                    }))
                },
                {
                    name: 'Deaths',
                    data: killsBreakdown.map(val => ({
                        x: val.player,
                        y: val.deaths
                    }))
                }
            ],
            colors: ['#00ff00', '#ff0000'],
            title: {
                text: 'Kill and death count'
            },
            chart: {
                height: `${100 * this.data.playerlist.length}px`
            },
            plotOptions: {
                bar: {
                    horizontal: true
                }
            }
        })

        Charts.addBar(document.querySelector("#kdr"), {
            series: [
                {
                    name: 'KDR',
                    data: killsBreakdown.map(val => ({
                        x: val.player,
                        y: val.kdr
                    }))
                }
            ],
            title: {
                text: 'Kill to death ratio'
            },
            chart: {
                height: `${100 * this.data.playerlist.length}px`
            },
            plotOptions: {
                bar: {
                    horizontal: true
                }
            }
        })

        Charts.addBar(document.querySelector("#moneybreakdown"), {
            series: [
                {
                    name: 'Money spent',
                    data: killsBreakdown.map(val => ({
                        x: val.player,
                        y: val.moneyspent
                    })),
                },
                {
                    name: 'Money lost to death',
                    data: killsBreakdown.map(val => ({
                        x: val.player,
                        y: val.moneylost
                    }))
                },
                {
                    name: 'Money made from kills',
                    data: killsBreakdown.map(val => ({
                        x: val.player,
                        y: val.moneymade
                    })),
                },
                {
                    name: 'Money bailed out',
                    data: killsBreakdown.map(val => ({
                        x: val.player,
                        y: val.moneybailed
                    }))
                }
            ],
            title: {
                text: 'Cashflow breakdown'
            },
            dataLabels: {
                formatter: val => `$${Math.round(val / 100) / 10}k`
            },
            tooltip: {
                y: {
                    formatter: val => `$${val}`
                }
            },
            chart: {
                height: `${100 * this.data.playerlist.length}px`
            },
            plotOptions: {
                bar: {
                    horizontal: true
                }
            }
        })

        /*options = {
            series: this.playerlist.map(player => ({
                name: player,
                data: Helpers.eventPoints(this.filteredlog, player)
            })),
            colors: this.playerlist.map(player => {
                console.log(player, this.players[player])
                return this.players.get(player).color
            }),
            chart: {
                height: 900,
                type: 'scatter',
                animations: {
                    enabled: false,
                    dynamicAnimation: {
                        enabled: false
                    }
                }
            },
            markers: {
                size: 5
            },
            tooltip: {
            },
            title: {
                text: 'Buy and kill events',
                align: 'left'
            },
            xaxis: {
                type: 'numeric',
                min: this.getValidStart(),
                max: this.getValidEnd()
            }
        };
        new ApexCharts(document.querySelector("#eventline"), options).render();*/

        // Global bie charts
        const buyCounts = Helper.weaponCounts(this.data.filteredlog, null, new Set(['buy-weapon', 'buy-entity', 'buy-vehicle']))
        const killCounts = Helper.weaponCounts(this.data.filteredlog, null, new Set(['kill']))
        Charts.addPie(document.querySelector("#allbuyoverview .lefthalf"), {
            series: buyCounts.map(val => val.count),
            labels: buyCounts.map(val => val.weapon),
            colors: buyCounts.map(val => weaponPaletteGenerator(val.weapon)),
            chart: {
                height: 800
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        minAngleToShowLabel: 5
                    }
                }
            },
            title: {
                text: `Purchases`
            }
        })
        Charts.addPie(document.querySelector("#allbuyoverview .righthalf"), {
            series: killCounts.map(val => val.count),
            labels: killCounts.map(val => val.weapon),
            colors: killCounts.map(val => weaponPaletteGenerator(val.weapon)),
            chart: {
                height: 800
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        minAngleToShowLabel: 5
                    }
                }
            },
            title: {
                text: `Kills`
            }
        })

        // Pie charts for per-player buy pie
        Charts.addChartSeries(document.querySelector("#buybreakdown"), document.querySelector("#pietemplate"), this.data.playerlist, (element, player) => {
            const buyCounts = Helper.weaponCounts(this.data.filteredlog, player, new Set(['buy-weapon', 'buy-entity', 'buy-vehicle']))
            const killCounts = Helper.weaponCounts(this.data.filteredlog, player, new Set(['kill']))
            //console.log(player, wepCounts)

            Charts.addPie(element.querySelector(".lefthalf"), {
                series: buyCounts.map(val => val.count),
                labels: buyCounts.map(val => val.weapon),
                colors: buyCounts.map(val => weaponPaletteGenerator(val.weapon)),
                chart: {
                    height: 310
                },
                title: {
                    text: `${player} purchases`
                }
            })

            Charts.addPie(element.querySelector(".righthalf"), {
                series: killCounts.map(val => val.count),
                labels: killCounts.map(val => val.weapon),
                colors: killCounts.map(val => weaponPaletteGenerator(val.weapon)),
                chart: {
                    height: 310
                },
                title: {
                    text: `${player} kills`
                }
            })
        })

        Charts.addChartSeries(document.querySelector("#matchups"), document.querySelector("#radartemplate"), this.data.playerlist, (element, player) => {
            Charts.addChart(element, {
                series: [{
                    name: 'Win %',
                    data: Helper.conflictBreakdown(this.data.filteredlog, player).map(info => ({
                        x: info.opponent,
                        y: info.percent
                    }))
                }],
                chart: {
                    height: 350,
                    type: 'radar'
                },
                title: {
                    text: player,
                    align: 'center'
                },
                yaxis: {
                    tickAmount: 4,
                    min: 0,
                    max: 100
                }
            })
        })

        const conflictBreakdowns = this.data.playerlist.map(player => ({ 
            player: player,
            breakdown: Helper.conflictBreakdown(this.data.filteredlog, player)
        }))
        const maxY = conflictBreakdowns.reduce((acc, val) => Math.max(acc, val.breakdown.reduce((acc, val) => Math.max(acc, val.wins + val.losses), 0)), 0)

/*      Charts.addChartSeries(document.querySelector("#matchups"), document.querySelector("#radartemplate"), conflictBreakdowns, (element, { player, breakdown }) => {
            Charts.addChart(element, {
                series: [
                    {
                        name: 'Wins',
                        data: breakdown.map(info => ({
                            x: Info.getPlayerName(info.opponent),
                            y: info.wins
                        }))
                    },
                    {
                        name: 'Losses',
                        data: breakdown.map(info => ({
                            x: Info.getPlayerName(info.opponent),
                            y: info.losses
                        }))
                    }
                ],
                colors: ['#00ff00', '#ff0000'],
                chart: {
                    height: 350,
                    type: 'bar',
                    stacked: true
                },
                title: {
                    text: player,
                    align: 'center'
                },
                yaxis: {
                    min: 0,
                    max: maxY
                }
            })
        })
 */
        if (this.data.filteredlog.some(e => e.category === 'city')) {
            options = {
                series: ['Red', 'Blue'].map(team => ({
                    name: team,
                    data: Helper.cityTimeSeries(this.data.log, team)
                })),
                colors: ['#ff0000', '#0000ff'],
                /*series: this.playerlist.map(player => ({
                    name: player,
                    data: Helpers.countMovingAverage(this.filteredlog, player, this.getValidStart(), this.getValidEnd(), 600, 60)
                })),*/
                chart: {
                    height: 900,
                    type: 'line'
                },
                stroke: {
                    curve: 'straight',
                    width: 3
                },
                title: {
                    text: 'Team time',
                    align: 'left'
                },
                annotations: {
                    yaxis: [{
                        y: this.meta.cityend || 0,
                        borderWidth: 1.5,
                        strokeDashArray: [5,2],
                        borderColor: '#00cc00'
                    }]
                },
                xaxis: {
                    type: 'numeric',
                    min: this.getValidStart(),
                    max: this.getValidEnd()
                }
            };
            new ApexCharts(document.querySelector("#teamtimes"), options).render();
        }
    }

    clearCharts() {
        if (typeof Apex._chartInstances !== 'undefined') {
            Apex._chartInstances.slice().forEach(x => x.chart.destroy())   
        }
        document.querySelector("#main").querySelectorAll("*").forEach(n => n.remove())
        const main = document.querySelector("#maintemplate").content.cloneNode(true)
        document.querySelector("#main").appendChild(main)
    }
}