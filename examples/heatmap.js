
$(document).ready(function (){
    var heatmapDays = [];
    var weekRange = 8;
    var startDate = new Date(moment().subtract(weekRange,"weeks").day(0).valueOf());
    var startTime = Math.floor(startDate.getTime()/1000);
    var range = Math.floor(Date.now()/1000) - startTime;
    for (var i = 0; i < weekRange*10; i++) {
        heatmapDays.push({localTimestamp: Math.floor(startTime+(Math.random()*range))});
    }
    heatmapDays.sort(function(a,b) {
        if (a.localTimestamp > b.localTimestamp)
            return 1;
        else if (a.localTimestamp < b.localTimestamp)
            return -1;
        return 0;
    });
    console.log(heatmapDays);
    var heatmap = new datalier.calHeatmap(
        [
            {
                type: 'collapseCount',
                showZeroes: true,
                padZeroes: true,
                granularity: 60 * 60 * 24,
                startTime: startTime,
                finalTime: Math.floor(Date.now()/1000)
            }
        ],
        heatmapDays,
        {
            itemSelector: "#heatmap",
            itemName: ["Event", "Events"],
            domain: "week",
            subDomain: "day",
            displayLegend: true,
            subDomainDateFormat: "%b %d, %Y",
            domainLabelFormat: function(date) {
                if (moment(date).add(6,'days').date() <= 6)
                    return moment(date).add(6,'days').format("MMM");
                else if (moment(date).date() == 1)
                    return moment(date).format("MMM");
                return "";
            },
            weekStartOnMonday: false,
            legend: [0,2,4,6],
            legendTitleFormat: {
                lower: "{min} {name}",
                inner: "more than {down} and less than or equal to {up} {name}",
                upper: "more than {max} {name}"
            },
            cellSize: 12,
            domainGutter: 1,
            start: startDate,
            range: weekRange,
            maxDate: new Date(),
            minDate: startDate,
            label: {align:"left", offset: {x:-6,y:0}},
            onComplete: function() {
                setTimeout(function() {
                    //document.querySelector('.cal-heatmap-container').setAttribute('width',460);
                },1000);
            }
        }
    );
    heatmap.draw();
});