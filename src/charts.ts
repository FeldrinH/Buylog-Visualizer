import type { ApexOptions } from 'apexcharts'
import ApexCharts from 'apexcharts'
import * as Util from './util'

declare var Apex: ApexOptions

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

export function addKeyValueText(rootelement: Element, template: HTMLTemplateElement, keytext: string, valuetext: any) {
    const newobj = template.content.cloneNode(true) as Element
    newobj.querySelector(".keytext").textContent = keytext
    newobj.querySelector(".valuetext").textContent = valuetext
    rootelement.appendChild(newobj)
    //return newobj
}

export function addChartSeries<T>(rootelement: Element, template: HTMLTemplateElement, itemlist: T[], addChartFunc: (newobj: Element, value: T) => void) {
    const templateobj = template.content.firstElementChild

    itemlist.forEach(value => {
        const newobj = templateobj.cloneNode(true) as Element
        rootelement.appendChild(newobj)
        addChartFunc(newobj, value)
    })
}

export function addChart(element: Element, useroptions: ApexOptions) {
    const chart = new ApexCharts(element, useroptions)
    chart.render()
    return chart
}

export function addBar(element: Element, useroptions: ApexOptions) {
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

export function addPie(element: Element, useroptions: ApexOptions) {
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

/*export function addRadar(element: Element, series, { label, value, color }, useroptions) {
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
}*/