if (typeof datalier === "undefined")
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
		timeFormat: 'HH:mm:ss'
	};
	if (typeof chartOptions !== "undefined") {
		for (var key in chartOptions)
			this.chartOptions[key] = chartOptions[key];
	}
	
	this.previousPoint = null;
	$(this.chartOptions.container).bind("plothover", function (event, pos, item) {
		//$("#x").text(pos.x.toFixed(2));
		//$("#y").text(pos.y.toFixed(2));

		if (item) {
			if (previousPoint == null || previousPoint != item.dataIndex) {
				previousPoint = item.dataIndex;
				
				$("#tooltip").remove();
				var x = item.datapoint[0].toFixed(2),
					y = item.datapoint[1].toFixed(2);
				if (self.filters.chartDataset[item.seriesIndex].data[item.dataIndex][2]) {
					var eventItem = self.filters.chartDataset[item.seriesIndex].data[item.dataIndex][2];
					var dataString = "";
					var exclude = ['_types','serverTimestamp','sessionId','propertyId','clientIP'];
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
    var nonCopyProperties = ['data', 'label', 'type', 'field', 'value', 'lines', 'points', 'bars', 'lineWidth', 'yaxis', 'hideAxis' ,'relative', 'showZeroes', 'alignWithStart', 'padZeroes', ]; 
	if (this.filters.chartDataset instanceof Array) {
		for (var i = 0; i < this.filters.chartDataset.length; i++) {
			
			switch(this.filters.filters[i].type) {
				case 'collapseCount':
				case 'collapseField':
					this.filters.chartDataset[i].data = datalier.utils.transformToPlot(this.filters.chartDataset[i].data,this.filters.filters[i].relativeValue);
					if (this.filters.filters[i].padZeroes) {
						this.filters.chartDataset[i].data = datalier.utils.padZeroes(this.filters.chartDataset[i].data, this.filters.filters[i].padZeroes,this.filters.filters[i].type,this.filters.filters[i].startTime,this.filters.filters[i].finalTime, this.filters.filters[i].relativeValue, this.filters.filters[i].granularity);
					}
					break;
				case 'accumulateField':
				case 'accumulateCount':
					this.filters.chartDataset[i].data = datalier.utils.transformToPlot(this.filters.chartDataset[i].data,this.filters.filters[i].relativeValue);
					if (this.filters.filters[i].padZeroes) {
						this.filters.chartDataset[i].data = datalier.utils.padZeroes(this.filters.chartDataset[i].data, this.filters.filters[i].padZeroes,this.filters.filters[i].type,this.filters.filters[i].startTime,this.filters.filters[i].finalTime, this.filters.filters[i].relativeValue);
					}
					break;
				case 'bars':
					this.filters.chartDataset[i].data = datalier.utils.transformToPlot(this.filters.chartDataset[i].data,this.filters.filters[i].relativeValue);
					break;
				case 'field':
					this.filters.chartDataset[i].data = datalier.utils.transformToPlot(this.filters.chartDataset[i].data,this.filters.filters[i].relativeValue);
					if (this.filters.filters[i].padZeroes) {
						this.filters.chartDataset[i].data = datalier.utils.padZeroes(this.filters.chartDataset[i].data, this.filters.filters[i].padZeroes,this.filters.filters[i].type,this.filters.filters[i].startTime,this.filters.filters[i].finalTime, this.filters.filters[i].relativeValue);
					}
					break;
				case 'timeline':
				case 'passthrough':
					break;
			}
			
            for(var property in this.filters.filters[i]) {
                if (nonCopyProperties.indexOf(property)==-1) {
                    this.filters.chartDataset[i][property] = this.filters.filters[i][property];
                }
            }

			if (this.filters.filters[i].lines)
				this.filters.chartDataset[i].lines = {show:true};
			else if (typeof this.filters.filters[i].lines !== "undefined" && this.filters.filters[i].lines === false)
				this.filters.chartDataset[i].lines = {show:false};
            
			if (this.filters.filters[i].points)
				this.filters.chartDataset[i].points = {show:true};
			if (this.filters.filters[i].bars)
				this.filters.chartDataset[i].bars = {show:true};
			if (typeof this.filters.filters[i].lineWidth !== "undefined") { 
				if (typeof this.filters.chartDataset[i].lines == "undefined")
					this.filters.chartDataset[i].lines = {show:true};
				this.filters.chartDataset[i].lines.lineWidth = this.filters.filters[i].lineWidth;
			}
			if (typeof this.filters.filters[i].yaxis === "undefined")
				this.filters.chartDataset[i].yaxis = i+1;
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