import { parse } from 'csv-es'
import ApexCharts from 'apexcharts'
import * as Parser from './parser'
import * as Helpers from './charthelpers'

export default class DataManager {
    constructor() {
        this.needsReload = true
        this.needsUpdate = true

        this.params = new URLSearchParams(window.location.search)
        this.filename = this.params.get("log")
        this.start = parseFloat(this.params.get("start"))
        this.end = parseFloat(this.params.get("end"))
        this.metaString = this.params.get("meta")
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
        if (start !== this.start) {
            this.start = start
            this.params.set("start", start)
            this.needsUpdate = true
        }
    }
    setEnd(end) {
        if (end !== this.end) {
            this.end = end
            this.params.set("end", end)
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

    getValidStart() {
        return isFinite(this.start) ? this.start : this.logstart
    }
    getValidEnd() {
        return isFinite(this.end) ? this.end : this.logend
    }

    async update() {
        if (this.needsReload || this.needsUpdate) {
            window.history.pushState(`${this.filename} [${this.start};${this.end}]`, null, `?${this.params.toString()}`)

            this.meta = this.parseMeta(this.metaString)
            console.log(this.meta)

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
        this.rawlog = parse(dataStr, { typed: true })
        
        Parser.parse(this.rawlog, this)
    }

    filterData() {
        const start = this.getValidStart()
        const end = this.getValidEnd()
        this.filteredlog = this.log.filter(e => e.time >= start && e.time <= end)
    }

    renderCharts() {
        Apex.chart = {
            toolbar: {
                show: false
            },
            zoom: {
                enabled: false
            }
        }    
    
        let options = {
            series: [{
                data: Helpers.stateTimeline(this.players)
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
                    formatter: (x) => x
                },
                y: {
                    formatter: (val, { w, seriesIndex, dataPointIndex }) => `${w.config.series[seriesIndex].data[dataPointIndex].x} (${w.config.series[seriesIndex].data[dataPointIndex].state}):`
                }
            },
            xaxis: {
                type: 'datetime',
                min: this.getValidStart(),
                max: this.getValidEnd()
            }
        };
        new ApexCharts(document.querySelector("#statechart"), options).render();

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

        const buybreakdowns = document.querySelector("#buybreakdown")
        const pietemplate = document.querySelector("#pietemplate")
        this.playerlist.forEach(player => {
            const wepCounts = Helpers.weaponCounts(this.filteredlog, player, new Set(['buy-weapon', 'buy-entity', 'buy-vehicle']))
            options = {
                series: wepCounts.map(info => info.count),
                labels: wepCounts.map(info => info.weapon),
                chart: {
                    height: 350,
                    type: 'pie'
                },
                title: {
                    text: player,
                    align: 'center'
                },
                legend: {
                    show: false
                },
                yaxis: {
                    tickAmount: 4,
                    min: 0,
                    max: 100
                }
            }
    
            const pieobj = pietemplate.content.firstElementChild.cloneNode(true)
            buybreakdowns.appendChild(pieobj)
            new ApexCharts(pieobj, options).render();
        })

        const matchups = document.querySelector("#matchups")
        const radartemplate = document.querySelector("#radartemplate")
        this.playerlist.forEach(player => {
            options = {
                series: [{
                    name: 'Win %',
                    data: Helpers.calculateMatchupsInfo(this.filteredlog, player).map(info => ({
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
            }
    
            const radarobj = radartemplate.content.firstElementChild.cloneNode(true)
            matchups.appendChild(radarobj)
            new ApexCharts(radarobj, options).render();
        })

        options = {
            series: ['Red', 'Blue'].map(team => ({
                name: team,
                data: Helpers.teamTimes(this.log, team)
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

    clearCharts() {
        document.querySelector("#main").querySelectorAll("*").forEach(n => n.remove())
        const main = document.querySelector("#maintemplate").content.cloneNode(true)
        document.querySelector("#main").appendChild(main)
    }
}