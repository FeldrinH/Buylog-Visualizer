import ApexCharts from 'apexcharts'
import * as Util from './util'

export function setupDefaults() {
    Apex.chart = {
        toolbar: {
            show: false
        },
        zoom: {
            enabled: false
        }
    }  
}

export function addKeyValueText(rootelement, template, keytext, valuetext) {
    const newobj = template.content.cloneNode(true)
    newobj.querySelector(".keytext").textContent = keytext
    newobj.querySelector(".valuetext").textContent = valuetext
    rootelement.appendChild(newobj)
    //return newobj
}

export function addChartSeries(rootelement, template, itemlist, addChartFunc) {
    const templateobj = template.content.firstElementChild

    itemlist.forEach(value => {
        const newobj = templateobj.cloneNode(true)
        rootelement.appendChild(newobj)
        addChartFunc(newobj, value)
    })
}

export function addChart(element, useroptions) {
    const chart = new ApexCharts(element, useroptions)
    chart.render()
    return chart
}

export function addBar(element, useroptions) {
    const options = Util.extend({
        chart: {
            height: 350,
            type: 'bar'
        },
        title: {
            align: 'center'
        }
    }, useroptions)

    return addChart(element, options)
}

export function addPie(element, useroptions) {
    const options = Util.extend({
        chart: {
            height: 350,
            type: 'pie'
        },
        title: {
            align: 'center'
        },
        legend: {
            show: false
        },
        stroke: {
            width: 0.5
        }
    }, useroptions)

    return addChart(element, options)
}

export function addRadar(element, series, { label, value, color }, useroptions) {
    const options = Util.extend({
        series: series.map(value),
        labels: series.map(label),
        colors: series.map(color),
        chart: {
            height: 350,
            type: 'pie'
        },
        title: {
            align: 'center'
        },
        legend: {
            show: false
        },
        stroke: {
            width: 0.5
        }
    }, useroptions)

    return addChart(element, options)
}