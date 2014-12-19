/*
* Datalier.js
* A data folding library that processes and outputs charting plugin friendly data.
* datalier.utils - Contains functions related to the actual filtration of data.
* datalier.filters - Feed this class data and configuration to automatically execute functions from datalier.utils.
* OQL - Some common map functionality to modify data before feeding it to datalier.

GitHub - https://github.com/satsukitv/datalier-node
*/

if (typeof datalier === "undefined")
    var datalier = {};

datalier.utils = {
    defaultTimeField: "localTimestamp", // be sure to change this in both datalier.utils AND datalier.filters
    /*
    This is specifically used to count the unique event values in a data array.
    */
    getUniqueValues: function (data, field) {
        var ret = {};
        for (var i = 0; i < data.length; i++) {
            if (typeof data[i][field] !== "undefined")
                if (data[i][field] in ret)
                    ret[data[i][field]]++;
                else
                    ret[data[i][field]]=1;
        }
        return ret;
    },
    /*
    Returns an array of x-values from the output of transformToPlot
    */
    getDatasetXAxis: function(dataset) {
        var ret = [];
        for (var i = 0; i < dataset.length; i++)
            ret.push(dataset[i][0]);
        return ret;
    },
    /*
        Does a simple resampling of a dataset to use the given xaxis array as time values
        Tries to find an x value in dataset that is the closest to each xaxis value without going over,
        and create a y value from the y value of that dataset point interpolated with the following point.
    */
    resample: function(dataset, xaxis, carryValueInsteadOfZero) {
        if (typeof carryValueInsteadOfZero === "undefined")
            carryValueInsteadOfZero = false;
        var resampled = [];
        var datasetIndex = 0;
        for (var i = 0; i < xaxis.length; i++) {
            for (var j = datasetIndex; j < dataset.length && dataset[j][0] <= xaxis[i]; j++) {}
            datasetIndex = j--;
            if (j < 0) { // no points
                resampled.push([xaxis[i],0]);
            }
            else if (dataset[j][0] == xaxis[i]) {
                resampled.push([xaxis[i], dataset[j][1]]);
            }
            else if (j >= dataset.length-1) {
                if (carryValueInsteadOfZero && dataset.length > 0)
                    resampled.push([xaxis[i], dataset[dataset.length-1][1]]);
                else
                    resampled.push([xaxis[i],0]);
            }
            else {
                resampled.push( [ xaxis[i], datalier.utils.interpolatePoints(xaxis[i],dataset[j],dataset[j+1]) ] );
            }
        }
        return resampled;
    },
    /*
    Returns a number equal to the y value of the line
    at x value time between the two points given points.
    */
    interpolatePoints: function(time, point1, point2) {
        var yDiff = point2[1] - point1[1];
        var xFactor = (time - point1[0]) / (point2[0] - point1[0]);
        return point1[1] + ( yDiff * xFactor );
    },
    /*
        Outputs a pre-plot-transformation array of timestamps->field values for a data object array.
        Used for datalier.filters.filters[].type='field'
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
        field: The field to collapse on. If !false, we'll add the field value,
               otherwise we're just counting objects in each bucket.
        granularity: How "large" the buckets are.
        showZero: If true, output buckets that have 0 events.
        alignedStartValue: If this is defined, the buckets will begin counting buckets at this value.
                           Otherwise, the start value will be equal to the time given by data[0].
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
        alignedStartValue: If this is defined, the buckets will begin counting buckets at this value.
                           Otherwise, the start value will be equal to the time given by data[0].
    */
    collapseCount: function (data,granularity,showZero,alignedStartValue) {
        return this.collapseField(data,false,granularity,showZero,alignedStartValue);
    },

    /*
        "accumulateField" will create a dataset of points where the y-value will be equal to the sum of
        the previous y-value, plus the current object's value. This provides us with a line that increases
        constantly or stays flat. It can be used to compare "velocity" or engagement with previous data.

        data [array of objects]: Data to collapse
        field: The field to collapse on. If !false, we'll sum on the field value,
               otherwise we're just counting objects that came before this one.
    */
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
        "accumulateCount" will create a dataset of points where the y-value will be equal to the sum of
        the previous y-value, plus the current object's value. This provides us with a line that increases
        constantly or stays flat. It can be used to compare "velocity" or engagement with previous data.
        Unline "accumulateField" this function only counts the *number* of events that occurred so far.
    */
    accumulateCount: function (data) {
        return this.accumulateField(data,false);
    },


    /*
        Transforms an object where keys are X values and values are Y values into a flot compatible data set.
        Flot takes an array of points, where each point is an array in the format [x,y].
        e.g. [{'1':5},{'2':4}] -> [ [1,5] , [2,4] ]
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
        Creates a flot-compatible dataset with no changing y-values, but with the optional additonal data
        parameter for viewing a timeline of events.
        This is useful in conjunction with filters and bars to visualize activity between events.

        e.g. [{'time':1, 'data':'hello'}, {'time':2, 'data2':'world'}]
             -> [ [1,1,{'time':1, 'data':'hello'}] , [2,1,{'time':2, 'data2':'world'}] ]
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
        Wrapper function to pad zeroes to the beginning or end of a chart dataset.

        data: The raw data that has been processed by collapse[Count,Field] or accumulate[Count,Field]
        padZeroes: A boolean, or array of booleans in the form [beginning, end] to determine where to pad zeroes
        startTime: The time value to begin padding zeroes at
        finalTime: The time value to end padding zeroes at
        relative: A relative time value integer to subtract all time values by, if non-zero
        granularity: Used only for collapse[Count,Field] datasets. The granularity of buckets.
    */
    padZeroes: function (data, padZeroes,type,startTime,finalTime,relative,granularity) {
        if (type=='collapseCount' || type=='collapseField')
            return this.padZeroes_collapse(data, padZeroes, startTime,finalTime,relative,granularity);
        else if (type=='accumulateCount' || type=='accumulateField') {
            var finalValueForAccumulateGraph = 0; // our accumulate graph shouldn't go down unless there is no data
            if (data.length>=1)
                finalValueForAccumulateGraph = data[data.length-1][1]
            return this.padZeroes_generic(data, padZeroes, startTime,finalTime,relative, finalValueForAccumulateGraph);
        }
        else
            return this.padZeroes_generic(data, padZeroes, startTime, finalTime, relative, 0);
    },
    /*
        A generic padZeroes function. Simply puts a 0 valued point at the beginning and end of the dataset based
        on the value of padZeroes (boolean, or array of booleans).
        This method is a bit hacky with a time of O(n) since we have to insert at the front of the array.
        There is likely a better way to do this depending on which version of ECMAScript is available.
    */
    padZeroes_generic: function (data,padZeroes,startTime,finalTime,relative, finalValue) {
        if (relative)
            finalTime -= relative;
        if (typeof finalValue === "undefined")
            finalValue = 0;
        // paste to beginning
        var tmpData = [];
        if (padZeroes === true || (padZeroes instanceof Array && padZeroes[0] === true)) {
            var nRelative = startTime;
            tmpData.push([startTime,0]);
            for(var i =0; i < data.length;i++) {
                tmpData.push(data[i]);
            }
        }
        else {
            tmpData = data;
        }
        // push final point
        if (padZeroes === true || (padZeroes instanceof Array && padZeroes[1] === true)) {
            tmpData.push([finalTime,finalValue]);
        }
        return tmpData;
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
        var tmpData = [];
        if (padZeroes === true || (padZeroes instanceof Array && padZeroes[0] === true)) {
            // add new blanks
            while((data.length >= 1 && data[0][0] > startTime) || data.length == 0) {
                i = tmpData.length-1;
                if (i >= 0 && tmpData[i][0]-granularity < startTime)
                    break;
                if (i<0) {
                    if (data.length >=1)
                        tmpData.push([data[0][0]-granularity,0]);
                    else if (finalTime - granularity > startTime)
                        tmpData.push([startTime+granularity,0]);
                    else
                        tmpData.push([startTime,0]);
                }
                else
                    tmpData.push([tmpData[i][0]-granularity,0]);
            }
            // put it in correct order
            tmpData.reverse();
            // paste data to end, and assign as new
            for (var i = 0; i < data.length; i++)
                tmpData.push(data[i]);
            data = tmpData;
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

/* Filter documentation */
    /*
    [string] type:
        * collapseCount (see function description in datalier.utils)
        * collapseField (see function description in datalier.utils)
        * accumulateCount (see function description in datalier.utils)
        * accumulateField (see function description in datalier.utils)
        * field (Directly maps a field value to the y-value for each point)
        * bars (Directly maps each object to its time value, with a y-value of 1)
        * timeline (Similar to bars except includes the additional 3rd parameter of the entire data object)
        * passthrough (As it says: just pass through the .data and .label parameters over to the dataset)
    [string] field:
        * Optional except for collapseField, accumulateField, field
        * When used on other types, will only include objects in the dataset that have the given field. and value
        * when used in *Field types, indicate which field to count/sum.
    [number] startTime: The time value to begin the output dataset
    [number] finalTime: The time value to end the output dataset
    [boolean] padZeroes: Use with above values to pad zeroes to the beginning and
                         end of dataset after filtering to create a continuous line across startTime to finalTime.
    [boolean] alignWithStart: When collapsing the data, start from startTime instead of data[0].localTimestamp.
    [mixed] value: See above
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
        this.filters = [];

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
        // if it's an object, call the onUpdated function
        if (typeof this.listeners[i] === "object") {
            this.listeners[i].onUpdated(this);
        }
        // if it's a function, run it
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
                dataset.data = datalier.utils.accumulateCount(tmpData);
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
                dataset.label = "Field Value: " + this.filters[i].field;
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

OQL = function(data) {
    this.data = data;
}
OQL.prototype.values = function() { return this.data; }

OQL.prototype.select = function(field,comp,val) {
    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }
    vals = [];
    if (this.data) {
        for(i=0;i<this.data.length;i++) {
            var row = this.data[i];
            var goAhead = false;
            if (isFunction(field)) {
                goAhead = field(row);
            }
            else {
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
            }
            if (goAhead) {
                vals.push(row);
            }
        }
    }
    this.data = vals;
    return this;
}
OQL.prototype.operate = function(field,op,val) {
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
            else if (isFunction(field)) {
                this.data[i] = field(this.data[i]);
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
    return this;
}
OQL.prototype.sum = function(field) {
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

if (typeof module !== "undefined") {
    module.exports = {
        utils: datalier.utils,
        filters: datalier.filters,
        OQL: OQL
    }
}