if (typeof datalier === "undefined")
	var datalier = {};

datalier.plot = function (filters, data, chartOptions, defaultTimeField) {
	if (filters instanceof Array) {
		filters = new datalier.filters(data, filters, chartOptions, defaultTimeField);
	}
	this.filters = filters;
	var self = this;
	
	this.filters.addListener(function() {
		self.draw(true);
	});
	
	this.previousPoint = null;
	$(this.filters.chartOptions.container).bind("plothover", function (event, pos, item) {
		$("#x").text(pos.x.toFixed(2));
		$("#y").text(pos.y.toFixed(2));

		if (item) {
			if (previousPoint != item.dataIndex) {
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
					self.showTooltip(item.pageX, item.pageY,
							item.series.label + " on " + moment.unix(x/1000+moment().zone()*60).format(self.filters.chartOptions.timeFormat) + " = " + Math.round(y));
				}
			}
		}
		else {
			$("#tooltip").remove();
			previousPoint = null;            
		}
	});
}

datalier.plot.prototype.draw = function(filtersAlreadyApplied) {
	if (!filtersAlreadyApplied)
		this.filters.applyFilters();
	else
		$.plot(this.filters.chartOptions.container, this.filters.chartDataset, this.filters.chartOptions);
}
datalier.plot.prototype.showTooltip = function(x, y, contents) {
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