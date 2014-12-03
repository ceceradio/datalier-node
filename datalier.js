if (typeof datalier === "undefined")
	var datalier = {};

datalier.utils = {
	defaultTimeField: "localTimestamp",
	/*
	This is specifically used to count the unique event values in a data array.
	*/
	getUniqueEvents: function (data) {
		var ret = {};
		for (var i = 0; i < data.length; i++) {
			var value = data[i];
			if (typeof value.event !== "undefined")
				if (value.event in ret) 
					ret[value.event]++;
				else
					ret[value.event]=1;
		}
		return ret;
	},

	/*
		Outputs a pre-plot-transformation array of timestamps->field values for a data object array.
		Used for DatalierPlot.filters[].type='field'
	*/
	mapToField: function (data,field) {
		var ret = new Array();
		for(var i = 0; i < data.length; i++) {
			if (typeof data[i][field] !== "undefined")
				ret[data[i][this.defaultTimeField]] = data[i][field];
		}
		return ret;
	},
	/*
		Used in DatalierPlot filters to only chart data objects that match a certain field = value
		Returns a data object array containing only data objects that match data[][searchKey] = searchVal
	*/
	filter: function (data,searchKey,searchVal) {
		var ret = new Array();
		for(var i = 0; i < data.length; i++) {
			var value = data[i];
			if (value[searchKey] == searchVal) 
				ret.push(value);
		};
		return ret;
	},
	/*
		"collapseField" will fold data into buckets and add up the values of a field from events that fall into each bucket.
		data [array of objects]: Data to collapse
		field: The field to collapse on. Adds the field value instead of just 1 for each data object
		granularity: How "large" the buckets are.
		showZero: If true, output buckets that have 0 events.
		alignedStartValue: If this is defined, the buckets will begin counting at the time value in this parameter.
	*/
	collapseField: function (data,field,granularity,showZero,alignedStartValue) {
		var collapsed ={};
		if (typeof showZero == "undefined")
			showZero = true;
		if (data.length == 0)
			return collapsed;
		if (typeof data[0][this.defaultTimeField] === "undefined")
			return collapsed;
			
		if (data[0][this.defaultTimeField] > data[data.length-1][this.defaultTimeField])
			data.reverse();
			
		var currentTick = parseInt(data[0][this.defaultTimeField]);
		if (typeof alignedStartValue != "undefined" && alignedStartValue !== false) {
			currentTick = parseInt(alignedStartValue);
		}
		
		for(var i = 0; i < data.length; i++) {
			if (typeof data[i][this.defaultTimeField] === "undefined")
				return {};
			// don't record data that doesn't fall in the bucket...
			if (data[i][this.defaultTimeField] < currentTick)
				continue;
			while (data[i][this.defaultTimeField] >= currentTick + granularity) {
				if (!(currentTick in collapsed) && showZero)
					collapsed[currentTick] = 0;
				currentTick+=(granularity>0)?granularity:1;
			}
			if (collapsed[currentTick])
				collapsed[currentTick]+=((field!==false)?data[i][field]:1);
			else
				collapsed[currentTick]=((field!==false)?data[i][field]:1);
		}
		return collapsed;
	},
	/*
		"collapseCount" will fold data into buckets and count the number of events that fall into each bucket.
		data [array of objects]: Data to collapse
		granularity: How "large" the buckets are.
		showZero: If true, output buckets that have 0 events.
		alignedStartValue: If this is defined, the buckets will begin counting at the time value in this parameter.
							This will STILL count all events that occur before the alignedStartValue.
	*/
	collapseCount: function (data,granularity,showZero,alignedStartValue) {
		return this.collapseField(data,false,granularity,showZero,alignedStartValue);
	},
	
	accumulateField: function (data,field) {
		var acc ={};
		if (data.length == 0)
			return acc;
		if (typeof data[0][this.defaultTimeField] === "undefined")
			return acc;
		var total = 0;
		if (data[0][this.defaultTimeField] > data[data.length-1][this.defaultTimeField])
			data.reverse();
		for(var i = 0; i < data.length; i++) {
			if (typeof data[i][this.defaultTimeField] === "undefined")
				return {};
			total+=( (field!==false) ? data[i][field] : 1 );
			acc[data[i][this.defaultTimeField]]=total;
		}
		return acc;
	},
	/*
		Accumulate creates a cumulative or "total counting" graph over time.
		Counts the number of events found so far for each event.
	*/
	accumulate: function (data) {
		return this.accumulateField(data,false);
	},

	
	/*
		Transforms an object where keys are X values and values are Y values into a flot compatible data set.
		Flot takes an array of points, where each point is an array in the format [x,y].
	*/
	transformToPlot: function (arr, relative) {
		var ret = new Array();
		for(key in arr) {
			if (relative)
				ret.push([(parseInt(key)-relative),arr[key]]);
			else
				ret.push([parseInt(key),arr[key]]);
		}
		return ret;
	},
	/*
		Draws a straight line with each event appearing in chronological order.
		This is useful in conjunction with filters and bars to visualize activity between events.
	*/
	createTimeline: function (data, relative) {
		var ret = new Array();
		var x;
		for(var i = 0; i < data.length; i++) {
			if (typeof data[i][this.defaultTimeField] === "undefined")
				return [];
			x = data[i][this.defaultTimeField];
			if (relative)
				x -= relative;
			ret.push([x,1,data[i]]);
		}
		return ret;
	},
	/*
		Simply pad zeroes at the end of a collapsed or accumulated graph.
	*/
	padZeroes: function (data, padZeroes,type,startTime,finalTime,relative,granularity) {
		if (type=='collapseCount' || type=='collapseField')
			return this.padZeroes_collapse(data, padZeroes, startTime,finalTime,relative,granularity);
		else if (type=='accumulateCount' || type=='accumulateField')
			return this.padZeroes_accumulate(data, padZeroes, startTime,finalTime,relative);
		else 
			return padZeroes_generic(data, padZeroes, startTime, finalTime, relative, 0);
	},
	padZeroes_generic: function (data,padZeroes,startTime,finalTime,relative, finalValue) {
		if (relative)
			finalTime -= relative;
		// paste to beginning
		var nData = [];
		if (padZeroes === true || (padZeroes instanceof Array && padZeroes[0] === true)) {
			var nRelative = startTime;
			nData.push([startTime,0]);
			for(var i =0; i < data.length;i++) {
				nData.push(data[i]);
			}
		}
		else {
			nData = data;
		}
		// push final point
		if (padZeroes === true || (padZeroes instanceof Array && padZeroes[1] === true)) {
			nData.push([finalTime,finalValue]);
		}
		return nData;
	}
	/*
		Padded zeroes for an accumulated graph merely puts a "0" point at the start time and end time.
		This method is a bit hacky with a time of O(n) since we have to insert at the front of the array.
		There is likely a better way to do this depending on which version of ECMAScript the browser supports.
	*/
	padZeroes_accumulate: function (data,padZeroes,startTime,finalTime,relative) {
		if (relative)
			finalTime -= relative;
		// paste to beginning
		var nData = [];
		if (padZeroes === true || (padZeroes instanceof Array && padZeroes[0] === true)) {
			var nRelative = startTime;
			nData.push([startTime,0]);
			for(var i =0; i < data.length;i++) {
				nData.push(data[i]);
			}
		}
		else {
			nData = data;
		}
		// push final point
		if (padZeroes === true || (padZeroes instanceof Array && padZeroes[1] === true)) {
			if (data.length>=1)
				nData.push([finalTime,data[data.length-1][1]]);
			else
				nData.push([finalTime,0]);
		}
		return nData;
	},
	/*
		Padded zeroes for a collapsed graph require buckets to be created.
		Create buckets at the beginning and end of an array towards the data.
	*/
	padZeroes_collapse: function (data,padZeroes,startTime,finalTime,relative,granularity) {
		if (typeof granularity == "undefined") {
			if (data.length>1)
				granularity = data[1][0] - data[0][0];
			else
				granularity = 1000;
		}
		if (relative)
			finalTime -= relative;
		var i = 0;
		
		// paste to beginning
		var nData = [];
		if (padZeroes === true || (padZeroes instanceof Array && padZeroes[0] === true)) {
			// add new blanks
			while((data.length >= 1 && data[0][0] > startTime) || data.length == 0) {
				i = nData.length-1;
				if (i >= 0 && nData[i][0]-granularity < startTime)
					break;
				if (i<0) {
					if (data.length >=1)
						nData.push([data[0][0]-granularity,0]);
					else if (finalTime - granularity > startTime)
						nData.push([startTime+granularity,0]);
					else
						nData.push([startTime,0]);
				}
				else
					nData.push([nData[i][0]-granularity,0]);
			}
			// put it in correct order
			nData.reverse();
			// paste data to end, and assign as new
			for (var i = 0; i < data.length; i++)
				nData.push(data[i]);
			data = nData;
		}
		
		// paste to end
		if (padZeroes === true || (padZeroes instanceof Array && padZeroes[1] === true)) {
			while(true) {
				i = data.length-1;
				if (typeof data[i][0] == "undefined") 
					break;
				if (data[i][0]+granularity > finalTime)
					break;
				data.push([data[i][0]+granularity,0]);
			}
		}
		return data;
	},
	/*
		Determine the date string to use for axes depending on the difference between the first and last timestamps.
	*/
	determineDateString: function (data) {
		if (!data || data.length <=1) {
			return "%S";
		}
		var ONE_MINUTE = 60000;
		var ONE_HOUR = ONE_MINUTE * 60;
		var ONE_DAY = ONE_HOUR * 24;
		var ONE_WEEK = ONE_DAY * 7;
		if (data[0][this.defaultTimeField] > data[data.length-1][this.defaultTimeField])
			data.reverse();
		var diff = data[data.length-1][this.defaultTimeField] - data[0][this.defaultTimeField];
		if (diff < ONE_MINUTE)
			return "%S";
		else if (diff < ONE_HOUR)
			return "%M:%S";
		else if (diff < ONE_DAY)
			return "%H:%M:%S";
		else if (diff < ONE_WEEK)
			return "%m/%d %H:%M";
		else
			return "%m/%d";
	}
}

/* Default filters */
	/* 
	[string] type:
		* collapseCount
		* accumulateCount
		* bars
		* timeline 
		* field
	[string] field:
		* Use * for collapseCount, accumulateCount, bars, and timeline type when using all data
		* Name use with "value" for above types only graph data objects that contain a match on data[field] = value
		* Indicate number field in data object for "field" type.
	[number] startTime: 
	[number] finalTime: 
	[boolean] padZeroes: Use with above values to pad zeroes to the beginning and end of dataset after filtering to create a continuous line across the x-axis.
	[boolean] alignWithStart: When collapsing the data, start from startTime instead of data[0].localTimestamp
	[mixed] value: See above
	yaxis: Index value of yaxis that the data is to be mapped onto. (See chartOptions.yaxes[])
	label: Axis Label
	points:
	lines:
	bars:
	color:
	hideAxis:
	*/
	
datalier.filters = function (data, filters, defaultTimeField) {
	if (typeof defaultTimeField === "undefined")
		this.defaultTimeField = "localTimestamp";
	else
		this.defaultTimeField = defaultTimeField;
	if (typeof data !== "undefined")
		this.rawData = data;
	else
		this.rawData = [];
	if (typeof filters !== "undefined")
		this.filters = filters;
	else
		this.filters = [
			/*{
				type: 'collapseCount',
				field: '*',
				label: 'Activity'
			},
			{
				type: 'timeline',
				field: '*',
				label: 'Timeline',
				points: true,
				lines: true,
				hideAxis: true
			}*/
		];
	
	this.chartDataset = [];
	this.listeners = [];
	
	//this.applyFilters();
}
datalier.filters.prototype.addListener = function(listener) {
	return this.listeners.push(listener)-1;
	//this.redraw();
}
datalier.filters.prototype.addFilter = function(filter) {
	return this.filters.push(filter)-1;
	//this.redraw();
}
datalier.filters.prototype.triggerUpdated = function() {
	for (var i=0; i<this.listeners.length;i++) {
		if (typeof this.listeners[i] === "object") {
			this.listeners[i].onUpdated(this);
		}
		else if (typeof this.listeners[i] === "function") {
			this.listeners[i](this);
		}
		else {
			// nothing
		}
	}
}
datalier.filters.prototype.applyFilters = function(triggerListeners) {
	if (typeof triggerListeners === "undefined")
		triggerListeners = true;
	// Reset the data set
	datalier.utils.defaultTimeField = this.defaultTimeField;
	this.chartDataset = [];
	for(var i = 0; i < this.filters.length; i++) {
		// Initialize our data. This is a reference to the rawData for now, but it may change below
		var tmpData = this.rawData;
		// if we have data defined in the filter, use that data instead
		if (typeof this.filters[i].data !== "undefined")
			tmpData = this.filters[i].data;
		var dataset = {};
		var relativeValue = 0;
		// If we are referencing a specific field, we need to get a filtered rawData.
		if (typeof this.filters[i].field !== "undefined" && this.filters[i].field != "*" && this.filters[i].type != "field" && this.filters[i].type != "accumulateField" && this.filters[i].type != "collapseField")
			tmpData = datalier.utils.filter(this.rawData,this.filters[i].field,this.filters[i].value);
		// Most charts don't start at 0 on the xAxis, so if they do, we set it to the start of the first piece of data.
		// TODO: This may need to be updated with the addition of startTime and finalTime to filters
		if (typeof this.filters[i].relative !== "undefined" && this.filters[i].relative == true) {
			dataset.relativeValue = relativeValue = tmpData[0][this.defaultTimeField];
		}
		switch(this.filters[i].type) {
			case 'collapseCount':
				var alignWithStart = false;
				var showZeroes = false;
				if (typeof this.filters[i].showZeroes !== "undefined")
					showZeroes = this.filters[i].showZeroes;
				if (typeof this.filters[i].alignWithStart !== "undefined")
					alignWithStart = this.filters[i].startTime;
				dataset.data = datalier.utils.collapseCount(tmpData,this.filters[i].granularity, showZeroes, alignWithStart);
				// Default Label
				dataset.label = "Activity";
				if (this.filters[i].field != "*") {
					dataset.label = "Activity: " + this.filters[i].value;
				}
				break;
			case 'collapseField':
				var alignWithStart = false;
				var showZeroes = false;
				if (typeof this.filters[i].showZeroes !== "undefined")
					showZeroes = this.filters[i].showZeroes;
				if (typeof this.filters[i].alignWithStart !== "undefined")
					alignWithStart = this.filters[i].startTime;
				dataset.data = datalier.utils.collapseField(tmpData,this.filters[i].field,this.filters[i].granularity, showZeroes, alignWithStart);
				// Default Label
				dataset.label = "Field Value: " + this.filters[i].value;
				break;
			case 'accumulateField':
				dataset.data = datalier.utils.accumulateField(tmpData,this.filters[i].field);
				// Default Label
				dataset.label = "Total";
				if (this.filters[i].field != "*") {
					dataset.label = "Total: " + this.filters[i].value;
				}
				break;
			case 'accumulateCount':
				dataset.data = datalier.utils.accumulate(tmpData);
				// Default Label
				dataset.label = "Total";
				if (this.filters[i].field != "*") {
					dataset.label = "Total: " + this.filters[i].value;
				}
				break;
			case 'bars':
				dataset.data = datalier.utils.collapseCount(tmpData,1,false);
				dataset.label = "Events";
				if (this.filters[i].field != "*") {
					dataset.label += ": " + this.filters[i].value;
				}
				break;
			case 'timeline':
				dataset.data = datalier.utils.createTimeline(tmpData,relativeValue);
				// Default Label
				dataset.label = "Timeline";
				if (this.filters[i].field != "*") {
					dataset.label += ": " + this.filters[i].value;
				}
				break;
			case 'field':
				dataset.data = datalier.utils.mapToField(tmpData,this.filters[i].field);
				// Default Label
				dataset.label = "Field Value: " + this.filters[i].value;
				break;
			case 'passthrough':
				dataset.data = this.filters[i].data;
				dataset.label = this.filters[i].label;
				break;
		}
		if (this.filters[i].label)
			dataset.label = this.filters[i].label;

		this.chartDataset.push(dataset);
	}
	if (triggerListeners)
		this.triggerUpdated();
	return this.chartDataset;
}

var OQL = {
	db: function(data) {
		this.data = data;
		return this;
	},
	values: function() { return this.data; },
	select: function(field,comp,val) {
		ret = { length:0, vals:[], values: function() {return this.vals;}, select: this.select, operate: this.operate, sum: this.sum };
		if (this.data) {
			for(i=0;i<this.data.length;i++) {
				var row = this.data[i];
				var goAhead = false;
				switch(comp) {
					case ">":
						if (row[field] > val)
						goAhead = true;
						break;
					case "<":
						if (row[field] < val)
						goAhead = true;
						break;
					case "=":
					case "==":
						if (row[field] == val)
						goAhead = true;
						break;
					case "<>":
					case "!=":
						if (row[field] != val)
						goAhead = true;
						break;
				}
				if (goAhead) {
					ret.length++;
					ret.vals.push(row);
				}
			}	
		}
		ret.data = ret.vals;
		return ret;
	},
	operate: function(field,op,val) {
		function isFunction(functionToCheck) {
			var getType = {};
			return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
		}
		if (this.data) {
			for(i=0;i<this.data.length;i++) {
				var row = this.data[i];
				var goAhead = false;
				if (isFunction(op)) {
					this.data[i][field] = op(this.data[i][field]);
				}
				else {
					switch(op) {
						case "-":
							this.data[i][field]-=val;
							break;
						case "/":
							this.data[i][field]/=val;
							break;
						case "*":
							this.data[i][field]*=val;
							break;
						case "+":
							this.data[i][field]+=val;
							break;
					}
				}
			}	
		}
		return this.data;
	},
	sum: function(field) {
		var sum = 0;
		if (this.data) {
			for(i=0;i<this.data.length;i++) {
				if (typeof this.data[i][field] != "undefined") {
					sum += this.data[i][field];
				}
			}	
		}
		return sum;
	}
};

if (typeof module !== "undefined") {
	module.exports = {
		utils: datalier.utils,
		filters: datalier.filters,
		OQL: OQL
	}
}