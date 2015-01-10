if (typeof module !== "undefined")
	var datalier = require('./datalier.js');
else if (typeof datalier === "undefined")
	var datalier = {};


datalier.calHeatmap = function (filters, data, chartOptions, defaultTimeField) {
	if (filters instanceof Array) {
		filters = new datalier.filters(data, filters, defaultTimeField);
	}
	this.filters = filters;
	var self = this;
	
	this.filters.addListener(function() {
		self.draw(true);
	});
	
	this.chartOptions = {
        itemSelector: "#heatmap",
        domain: "week",
        cellSize: 12,
        domainGutter: 1
    };
	if (typeof chartOptions !== "undefined") {
		for (var key in chartOptions)
			this.chartOptions[key] = chartOptions[key];
	}
}
datalier.calHeatmap.prototype.applyPlotFilters = function() {
	if (this.filters.chartDataset instanceof Array) {
		for (var i = 0; i < this.filters.chartDataset.length; i++) {
			switch(this.filters.filters[i].type) {
				case 'collapseCount':
				case 'collapseField':
                    if (this.filters.filters[i].padZeroes) {
						this.filters.chartDataset[i].data = datalier.utils.padZeroes(this.filters.chartDataset[i].data, this.filters.filters[i].padZeroes,this.filters.filters[i].type,this.filters.filters[i].startTime,this.filters.filters[i].finalTime, this.filters.filters[i].relativeValue, this.filters.filters[i].granularity);
					}
					this.filters.chartDataset[i].data = datalier.utils.transformToDictionary(this.filters.chartDataset[i].data,this.filters.filters[i].relativeValue);
					break;
				case 'accumulateField':
				case 'accumulateCount':
                    if (this.filters.filters[i].padZeroes) {
						this.filters.chartDataset[i].data = datalier.utils.padZeroes(this.filters.chartDataset[i].data, this.filters.filters[i].padZeroes,this.filters.filters[i].type,this.filters.filters[i].startTime,this.filters.filters[i].finalTime, this.filters.filters[i].relativeValue, this.filters.filters[i].granularity);
					}
					this.filters.chartDataset[i].data = datalier.utils.transformToDictionary(this.filters.chartDataset[i].data,this.filters.filters[i].relativeValue);
					break;
				case 'bars':
                    if (this.filters.filters[i].padZeroes) {
						this.filters.chartDataset[i].data = datalier.utils.padZeroes(this.filters.chartDataset[i].data, this.filters.filters[i].padZeroes,this.filters.filters[i].type,this.filters.filters[i].startTime,this.filters.filters[i].finalTime, this.filters.filters[i].relativeValue, this.filters.filters[i].granularity);
					}
					this.filters.chartDataset[i].data = datalier.utils.transformToDictionary(this.filters.chartDataset[i].data,this.filters.filters[i].relativeValue);
					break;
				case 'field':
                    if (this.filters.filters[i].padZeroes) {
						this.filters.chartDataset[i].data = datalier.utils.padZeroes(this.filters.chartDataset[i].data, this.filters.filters[i].padZeroes,this.filters.filters[i].type,this.filters.filters[i].startTime,this.filters.filters[i].finalTime, this.filters.filters[i].relativeValue, this.filters.filters[i].granularity);
					}
					this.filters.chartDataset[i].data = datalier.utils.transformToDictionary(this.filters.chartDataset[i].data,this.filters.filters[i].relativeValue);
					break;
				case 'timeline':
				case 'passthrough':
					break;
			}
		}
		return this.filters.chartDataset;
	}
	return [];
}
datalier.calHeatmap.prototype.draw = function(filtersAlreadyApplied) {
	if (!filtersAlreadyApplied)
		this.filters.applyFilters();
	else {
		var chartDatasets = this.applyPlotFilters();
		var cal = new CalHeatMap();
        this.chartOptions.data = chartDatasets[0].data;
        cal.init(this.chartOptions);
	}
}
if (typeof module !== "undefined") {
	module.exports = {calHeatmap: datalier.calHeatmap };
}