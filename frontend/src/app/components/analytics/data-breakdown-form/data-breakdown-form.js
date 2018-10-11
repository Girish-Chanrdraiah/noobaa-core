/* Copyright (C) 2016 NooBaa */

import template from './data-breakdown-form.html';
import ConnectableViewModel from 'components/connectable';
import { deepFreeze, createCompareFunc } from 'utils/core-utils';
import { toBytes, formatSize } from 'utils/size-utils';
import { realizeUri } from 'utils/browser-utils';
import ko from 'knockout';
import style from 'style';
import numeral from 'numeral';
import { requestLocation } from 'action-creators';

const colors = deepFreeze([
    style['color14'],
    style['color16'],
    style['color6'],
    style['color11'],
    style['color12'],
    style['color19'],
    style['color9']
]);

const viewOptions = deepFreeze([
    {
        value: 'BUCKETS',
        label: 'By Buckets'
    },
    {
        value: 'DATA_TYPES',
        label: 'By Data Types'
    }
]);

const compareRadius = createCompareFunc(bubble => bubble.r, -1);

function getBubblesForBuckets(buckets) {
    return buckets.map(bucket => ({
        label: bucket.name,
        x: bucket.io.readCount,
        y: bucket.io.writeCount,
        r: toBytes(bucket.data.size)
    }));
}

function getBubblesForDataTypes(buckets) {
    const bubbles = {};
    for (const { statsByDataType } of buckets) {
        for (const [dataType, stats] of Object.entries(statsByDataType)) {
            let bubble = bubbles[dataType];
            if (!bubble) {
                bubble = bubbles[dataType] = {
                    label: dataType,
                    x: stats.reads,
                    y: stats.writes,
                    r: toBytes(stats.size)
                };
            } else {
                bubble.x += stats.reads;
                bubble.y += stats.writes;
                bubble.r += toBytes(stats.size);
            }
        }
    }
    return Object.values(bubbles);
}


function _prepareDatasets(view, buckets, colors) {
    const maxCount = colors.length;

    let bubbles = view === 'BUCKETS' ?
        getBubblesForBuckets(buckets) :
        getBubblesForDataTypes(buckets);

    bubbles = bubbles.sort(compareRadius);
    if (bubbles.length > maxCount) {
        const lastBubble = bubbles
            .slice(maxCount - 1)
            .reduce((bubble, other, i) => {
                const subject = view === 'BUCKETS' ? 'Buckets' : 'Data Types';
                bubble.label = `Other ${subject} (${numeral(i + 1).format(',')})`;
                bubble.x += other.x;
                bubble.y += other.y,
                bubble.r += other.r;
                return bubble;
            });

        bubbles = [
            ...bubbles.slice(0, maxCount - 1),
            lastBubble
        ];
    }

    return bubbles.map((bubble, i) => ({
        label: bubble.label,
        backgroundColor: colors[i],
        dataSize: bubble.r,
        data: [{
            x: bubble.x,
            y: bubble.y,
            r: 2 + ((Math.log2(Math.max(bubble.r, 1)) / 5) ** 2)
        }]
    }));
}


class DataBreakdownFormViewModel extends ConnectableViewModel {
    dataReady = ko.observable();
    pathname = '';
    viewOptions = viewOptions;
    selectedView = ko.observable(viewOptions[0].value);
    legend = ko.observableArray();
    chart = {
        type: 'bubble',
        data: ko.observable(),
        options: {
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Number of Reads'
                    },
                    ticks: {
                        suggestedMax: 100,
                        // Using space for visual padding.
                        callback: count => `${
                            numeral(count).format(',')
                        }${
                            ' '.repeat(5)
                        }`
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Number of Writes'
                    },
                    ticks: {
                        suggestedMax: 100,
                        // Using space for visual padding.
                        callback: count => `${
                            numeral(count).format(',')
                        }${
                            ' '.repeat(5)
                        }`
                    }
                }]
            },
            tooltips: {
                displayColors: false,
                callbacks: {
                    title: (items, data) => data.datasets[items[0].datasetIndex].label,
                    label: (item, data) => {
                        const { r } = data.datasets[item.datasetIndex].data[0];
                        return [
                            `Nubmer of Reads: ${item.xLabel}`,
                            `Nubmer of Writes: ${item.yLabel}`,
                            `Bucket Data Usage: ${formatSize(
                                2 ** (Math.sqrt(r - 2) * 5)
                            )}`
                        ];
                    }
                }
            }
        }
    };

    selectState(state) {
        return [
            state.buckets,
            state.location
        ];
    }

    mapStateToProps(buckets, location) {
        const { view = 'BUCKETS' } = location.query;

        if (!buckets) {
            ko.assignToProps(this, {
                dataReady: false,
                selectedView: view,
                pathname: location.pathname
            });
        } else {
            const bucketList = Object.values(buckets)
                .filter(bucket => bucket.storage.used !== 0);

            const datasets = _prepareDatasets(
                view,
                bucketList,
                colors
            );

            const legend = datasets.map(dataset => ({
                color: dataset.backgroundColor,
                label: dataset.label,
                value: dataset.dataSize
            }));

            ko.assignToProps(this, {
                dataReady: true,
                pathname: location.pathname,
                selectedView: view,
                chart: { data: { datasets } },
                legend: legend
            });
        }
    }

    onSelectView(view) {
        const url = realizeUri(this.pathname, {}, { view });
        this.dispatch(requestLocation(url, true));
        this.selectedView(view);
    }
}

export default {
    viewModel: DataBreakdownFormViewModel,
    template: template
};