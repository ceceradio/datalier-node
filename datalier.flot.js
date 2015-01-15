if (typeof module !== "undefined")
    var datalier = require('./datalier.js');
else if (typeof datalier === "undefined")
    var datalier = {};

datalier.flot = function (filters, data, chartOptions, defaultTimeField) {
    if (filters instanceof Array) {
        filters = new datalier.filters(data, filters, defaultTimeField);
    }
    this.filters = filters;
    var self = this;
    
    this.filters.addListener(function() {
        self.draw(true);
    });
    this.chartOptions = {
        xaxes: [
                   //{mode: "time",
                   //timeformat: datalier.utils.determineDateString(this.rawData)}
               ],
        yaxes: [],
        grid: { hoverable: true, clickable: true },
        legend: {},
        relative: false,
        container: "#",
        timeFormat: 'HH:mm:ss',
        tooltipExcludes: []
    };
    if (typeof chartOptions !== "undefined") {
        if (chartOptions === false)
            this.chartOptions = {};
        else
            for (var key in chartOptions)
                this.chartOptions[key] = chartOptions[key];
    }
    
    this.previousPoint = null;
	if (typeof $ !== "undefined")
		$(this.chartOptions.container).bind("plothover", function (event, pos, item) {
			if (item) {
				if (previousPoint == null || previousPoint != item.dataIndex) {
					previousPoint = item.dataIndex;
					
					$("#tooltip").remove();
					var x = item.datapoint[0].toFixed(2),
						y = item.datapoint[1].toFixed(2);
					if (self.filters.chartDataset[item.seriesIndex].data[item.dataIndex][2]) {
						var eventItem = self.filters.chartDataset[item.seriesIndex].data[item.dataIndex][2];
						var dataString = "";
						var exclude = self.chartOptions.tooltipExcludes;
						for (key in eventItem) {
							if (exclude.indexOf(key) == -1)
								dataString += key + ": " + eventItem[key] + "<br/>";
						}
						self.showTooltip(item.pageX, item.pageY,
								dataString);
					}
					else {
						if (chartOptions.mode == "time") {
							if (typeof moment !== "undefined")
								self.showTooltip(item.pageX, item.pageY,
									item.series.label + " on " + moment.unix(x/1000+moment().zone()*60).format(self.chartOptions.timeFormat) + " = " + Math.round(y));
							else {
								var date = new Date();
								self.showTooltip(item.pageX, item.pageY,
									item.series.label + " on " + new Date(x-date.getTimezoneOffset()*60*1000).toLocaleString() + " = " + Math.round(y));
							}
						}
						else {
							self.showTooltip(item.pageX, item.pageY,
									item.series.label + " on " + x + " = " + Math.round(y));
						}
					}
				}
			}
			else {
				$("#tooltip").remove();
				previousPoint = null;            
			}
		});
}
datalier.flot.prototype.applyPlotFilters = function() {
    var nonCopyProperties = ['data', 'label', 'type', 'field', 'value', 'lines', 'points', 'bars', 'lineWidth', 'yaxis', 'hideAxis' ,'relative', 'showZeroes', 'alignWithStart', 'padZeroes', 'granularity', 'startTime', 'finalTime' ]; 
    var shortcutFields = ['lines','bars','points'];
    if (this.filters.chartDataset instanceof Array) {
        for (var i = 0; i < this.filters.chartDataset.length; i++) {
            var relativeValue = (typeof this.filters.filters[i].relativeValue == "undefined")?0:this.filters.filters[i].relativeValue;
            switch(this.filters.filters[i].type) {
                case 'accumulateField':
                case 'accumulateCount':
                case 'field':
                case 'collapseCount':
                case 'collapseField':
                case 'bars':
                case 'timeline':
                case 'passthrough':
                    break;
            }
            
            for(var property in this.filters.filters[i]) {
                if (nonCopyProperties.indexOf(property)==-1) {
                    this.filters.chartDataset[i][property] = this.filters.filters[i][property];
                }
            }
            
            for (var n = 0; n < shortcutFields.length; n++) {
                if (typeof this.filters.filters[i][shortcutFields[n]] !== "undefined") {
                    if (this.filters.filters[i][shortcutFields[n]] === true)
                        this.filters.chartDataset[i][shortcutFields[n]] = {show:true};
                    else if (this.filters.filters[i][shortcutFields[n]] === false)
                        this.filters.chartDataset[i][shortcutFields[n]] = {show:false};
                    else
                        this.filters.chartDataset[i][shortcutFields[n]] = this.filters.filters[i][shortcutFields[n]];
                }
            }
            
            if (typeof this.filters.filters[i].lineWidth !== "undefined") { 
                if (typeof this.filters.chartDataset[i].lines == "undefined")
                    this.filters.chartDataset[i].lines = {show:true};
                this.filters.chartDataset[i].lines.lineWidth = this.filters.filters[i].lineWidth;
            }
            if (typeof this.filters.filters[i].yaxis === "undefined")
                this.filters.chartDataset[i].yaxis = i+1;
            else
                this.filters.chartDataset[i].yaxis = this.filters.filters[i].yaxis;
            if (!this.chartOptions.yaxes[this.filters.chartDataset[i].yaxis-1])
                this.chartOptions.yaxes[this.filters.chartDataset[i].yaxis-1] = {axisLabel: this.filters.chartDataset[i].label};
            if (this.filters.filters[i].hideAxis)
                this.chartOptions.yaxes[this.filters.chartDataset[i].yaxis-1].show = false;
            
        }
        return this.filters.chartDataset;
    }
    return [];
}
datalier.flot.prototype.draw = function(filtersAlreadyApplied) {
    if (!filtersAlreadyApplied)
        this.filters.applyFilters();
    else {
        var chartDatasets = this.applyPlotFilters();
        $.plot(this.chartOptions.container, chartDatasets, this.chartOptions);
    }
}
datalier.flot.prototype.showTooltip = function(x, y, contents) {
    $('<div id="tooltip">' + contents + '</div>').css( {
        position: 'absolute',
        display: 'none',
        top: y + 5,
        left: x + 5,
        border: '1px solid #ccc',
        padding: '2px',
        color: '#757575',
        'background-color': '#fff',
        opacity: 1
    }).appendTo("body").fadeIn(200);
}
if (typeof module !== "undefined") {
    module.exports = {flot: datalier.flot };
}