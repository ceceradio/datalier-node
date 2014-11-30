if (typeof datalier === "undefined")
	var datalier = {};

datalier.sparkline = function (filters, data, chartOptions, defaultTimeField) {
	if (filters instanceof Array) {
		filters = new datalier.filters(data, filters, defaultTimeField);
	}
	this.filters = filters;
	var self = this;
	
	this.filters.addListener(function() {
		self.draw(true);
	});
	
	this.chartOptions = { type: 'bar', barColor: '#3ABCC9' };
	if (typeof chartOptions !== "undefined") {
		for (var key in chartOptions)
			this.chartOptions[key] = chartOptions[key];
	}
}
datalier.sparkline.prototype.applyPlotFilters = function() {
	if (this.filters.chartDataset instanceof Array) {
		var finalBucket = [];
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
					break;
				case 'timeline':
				case 'passthrough':
					break;
			}
		}
		var currentTime = -1;
		var currentTimeMin = Number.MAX_VALUE;
		var currentIndices = [];
		for (var j=0;j<this.filters.chartDataset.length;j++) {
			currentIndices[j] = 0;
		}
		while(true) {
			// determine if we need to quit
			var breakLoop = true;
			for (var i=0;i<currentIndices.length;i++) {
				if (currentIndices[i] < this.filters.chartDataset[i].data.length) {
					breakLoop = false;
					break;
				}
			}
			if (breakLoop)
				break;
			// go through each dataset one by one and increment the currentTime by the least amount
			currentTimeMin = Number.MAX_VALUE;
			for (var i=0;i<this.filters.chartDataset.length;i++) {
				if (currentIndices[i] < this.filters.chartDataset[i].data.length) {
					currentTimeMin = Math.min(currentTimeMin, this.filters.chartDataset[i].data[currentIndices[i]][0]);
					break;
				}
			}
			currentTime = currentTimeMin;
			var arr = [];
			for (var i=0;i<this.filters.chartDataset.length;i++) {
				if (currentIndices[i] < this.filters.chartDataset[i].data.length &&
					this.filters.chartDataset[i].data[currentIndices[i]][0] == currentTime) {
					arr.push(this.filters.chartDataset[i].data[currentIndices[i]][1]);
					currentIndices[i]++;
				}
				else {
					arr.push(0);
				}
			}
			finalBucket.push(arr);
		}
		return finalBucket;
	}
	return [];
}
datalier.sparkline.prototype.draw = function(filtersAlreadyApplied) {
	if (!filtersAlreadyApplied)
		this.filters.applyFilters();
	else {
		var chartDatasets = this.applyPlotFilters();
		console.log(chartDatasets);
		$(this.chartOptions.container).sparkline(chartDatasets, this.chartOptions);
	}
}