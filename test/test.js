var datalier = require('../datalier.js');
var OQL = datalier.OQL;
var utils = datalier.utils;
var Filters = datalier.filters;
var assert = require("assert")
var sparkline = require('../datalier.sparkline.js').sparkline;

describe('sparkline', function() {
    describe('#applyPlotFilters()',function() {
        it('should return an array of arrays, with the inner arrays containing values for the chart data', function() {
            var line = new sparkline(
                [{
                    type: 'collapseCount',
                    label: 'Activity',
                    granularity: 2,
                    showZeroes: true
                }],
                [{t:2},{t:3},{t:4},{t:6},{t:8}],
                {},
                "t"
            );
            assert.deepEqual([ { data: { '2': 2, '4': 1, '6': 1, '8': 1 }, label: 'Activity' } ], line.filters.applyFilters(false));
            assert.deepEqual([[2],[1],[1],[1]],line.applyPlotFilters());
        });
        it('should return two entries each for data in the inner arrays', function() {
            var line = new sparkline(
                [{
                    type: 'collapseCount',
                    label: 'Activity',
                    granularity: 2,
                    showZeroes: true
                },
                {
                    type: 'collapseField',
                    field: 't',
                    label: 'Activity',
                    granularity: 2,
                    showZeroes: true
                }],
                [{t:2},{t:3},{t:4},{t:6},{t:8}],
                {},
                "t"
            );
            assert.deepEqual([
                { data: { '2': 2, '4': 1, '6': 1, '8': 1 }, label: 'Activity' },
                { data: { '2': 5, '4': 4, '6': 6, '8': 8 }, label: 'Activity' } ],
                line.filters.applyFilters(false)
            );
            assert.deepEqual([[2,5],[1,4],[1,6],[1,8]],line.applyPlotFilters());
        });
        it('should merge data together sanely', function() {
            var line = new sparkline(
                [{
                    type: 'accumulateField',
                    field: 't',
                    label: 'Activity',
                    showZeroes: true
                },
                {
                    type: 'collapseField',
                    field: 't',
                    label: 'Activity',
                    granularity: 2,
                    showZeroes: true
                }],
                [{t:2},{t:3},{t:4},{t:6},{t:8}],
                {},
                "t"
            );
            assert.deepEqual([
                { data: { '2': 2, '3': 5, '4': 9, '6': 15, '8': 23 }, label: 'Activity' },
                { data: { '2': 5, '4': 4, '6': 6, '8': 8 }, label: 'Activity' } ],
                line.filters.applyFilters(false)
            );
            assert.deepEqual([[2,5],[5,0],[9,4],[15,6],[23,8]],line.applyPlotFilters());
        });
        it('should interpolate and resample data together when a filter is given an index', function() {
            var line = new sparkline(
                [{
                    type: 'accumulateField',
                    field: 't',
                    label: 'Activity',
                    showZeroes: true,
                    sampling: [2,4,6,8]
                },
                {
                    type: 'collapseField',
                    field: 't',
                    label: 'Activity',
                    granularity: 2,
                    showZeroes: true
                }],
                [{t:2},{t:3},{t:4},{t:6},{t:8}],
                {},
                "t"
            );
            assert.deepEqual([
                { data: { '2': 2, '3': 5, '4': 9, '6': 15, '8': 23 }, label: 'Activity' },
                { data: { '2': 5, '4': 4, '6': 6, '8': 8 }, label: 'Activity' } ],
                line.filters.applyFilters(false)
            );
            assert.deepEqual([[2,5],[9,4],[15,6],[23,8]],line.applyPlotFilters());
        });
    });
});

describe('filters', function() {
    describe("#addFilter()",function() {
        it('should return the id of the filter', function() {
            var testfilters = new Filters();
            assert.equal(0,testfilters.addFilter({
                type: 'collapseCount',
                label: 'Activity'
            }));
        });
        it('should store the new filter', function() {
            var testfilters = new Filters();
            var id = testfilters.addFilter({
                type: 'collapseCount',
                label: 'Activity'
            });
            assert.deepEqual({
                type: 'collapseCount',
                label: 'Activity'
            },testfilters.filters[id]);
        })
		it('should add the filter in a blank spot if one exists', function() {
            var testfilters = new Filters();
            var id = testfilters.addFilter({
                type: 'collapseCount',
                label: 'Activity'
            });
			id = testfilters.addFilter({
                type: 'collapseCount',
                label: 'Activity'
            });
			testfilters.removeFilter(0);
            assert.equal(0,testfilters.addFilter({
                type: 'collapseCount',
                label: 'Activity2'
            }));
			assert.deepEqual({
                type: 'collapseCount',
                label: 'Activity2'
            },testfilters.filters[0]);
        })
    })
	describe("#removeFilter()",function() {
		it('should remove and return the filter, leaving a null in its place', function() {
            var testfilters = new Filters();
			var id = testfilters.addFilter({
                type: 'collapseCount',
                label: 'Activity'
            })
            assert.deepEqual({
                type: 'collapseCount',
                label: 'Activity'
            },testfilters.removeFilter(id));
			assert.equal(null,testfilters.filters[id]);
        });
	});
    describe("#applyFilters()", function() {
        it('should an empty array when there are no filters',function() {
            var test = new Filters();
            assert.deepEqual([],test.applyFilters());
        })
        it('should a dataset with an empty data array, and a label when there is no data',function() {
            var test = new Filters();
            var id = test.addFilter({
                type: 'collapseCount',
                label: 'Activity'
            });
            assert.deepEqual([{data:[], label: "Activity"}],test.applyFilters());
        })
        if('should only use objects with a given field having a given value when provided',function() {
            var line = new Filters(
                [{
                    type: 'collapseCount',
                    field: 'inc',
                    value: true,
                    label: 'Activity',
                    granularity: 2
                }],
                [{t:2,inc:true},{t:3},{t:4},{t:6,inc:true},{t:8}],
                {},
                "t"
            );
            assert.deepEqual([
                { data: { '2': 1, '4': 0, '6': 1 }, label: 'Activity' } ],
                line.applyFilters(false)
            );
        });
    })

})
describe('utils', function(){
    describe('#interpolatePoints(time, point1, point2)', function(){
        it('should return the y value at the x value between point1 and point2 assuming a straight line', function(){
            assert.equal(6, utils.interpolatePoints(2,[1,4],[3,8]));
            assert.equal(4, utils.interpolatePoints(1,[1,4],[3,8]));
            assert.equal(8, utils.interpolatePoints(3,[1,4],[3,8]));
        })
    })
    describe('#getDatasetXAxis(dataset)', function(){
        it('should return the y value at the x value between point1 and point2 assuming a straight line', function(){
            var data = [ [1,1] , [3,3] , [5,5] ];
            assert.deepEqual([], utils.getDatasetXAxis([]));
            assert.deepEqual([1,3,5], utils.getDatasetXAxis(data));
        })
    })
    describe('#resample(dataset, xaxis)', function(){
        it('should return a dataset with x,y values resampled based on the given xaxis array', function(){
            var xaxis = [2,4,6];
            var data = [ [1,1] , [3,3] , [5,5] ];
            assert.deepEqual( [ ] , utils.resample(data, []));
            assert.deepEqual( [ [2,0],[4,0],[6,0] ] , utils.resample([], xaxis));
            assert.deepEqual( [ [2,2],[4,4],[6,0] ] , utils.resample(data, xaxis));
            assert.deepEqual( [ [2,2],[4,4],[6,5] ] , utils.resample(data, xaxis, true));
            xaxis = [0,2,4,6];
            assert.deepEqual( [ [0,0], [2,2],[4,4],[6,0] ] , utils.resample(data, xaxis));
            xaxis = [2,4,6,8];
            data = [ [2,2], [3,5], [4,9], [6,15], [8,23] ];
            assert.deepEqual( [ [2,2], [4,9],[6,15],[8,23] ] , utils.resample(data, xaxis));
            xaxis = [2,4,6,8,10];
            assert.deepEqual( [ [2,2], [4,9],[6,15],[8,23], [10, 0] ] , utils.resample(data, xaxis));
            assert.deepEqual( [ [2,2], [4,9],[6,15],[8,23], [10, 23] ] , utils.resample(data, xaxis, true));
            data = [ [2,2], [3,5], [4,9], [6,15], [8,23], [9,25] ];
            assert.deepEqual( [ [2,2], [4,9],[6,15],[8,23], [10, 25] ] , utils.resample(data, xaxis, true));
        })
    })
    describe('#getUniqueValues(data, field)', function(){
        it('should return an object of the count of values in the event property of objects in a given array', function(){
            assert.deepEqual({}, utils.getUniqueValues([{}], 'event'));
            assert.deepEqual({a:1}, utils.getUniqueValues([{"event":"a"}], 'event'));
            assert.deepEqual({a:2}, utils.getUniqueValues([{"event":"a"},{"event":"a"}], 'event'));
            assert.deepEqual({a:1,b:1}, utils.getUniqueValues([{"event":"a"},{"event":"b"}], 'event'));
        })
    })
    describe('#mapToField()', function(){
        it('should return an array indexed by localTimestamp values in a given field in a given array', function(){
            assert.deepEqual([], utils.mapToField([],"value"));
            assert.deepEqual([], utils.mapToField([{}],"value"));
            var expected = []
            expected[10] = "a";
            assert.deepEqual(expected, utils.mapToField([{"localTimestamp":10,"value":"a"}],"value"));
            expected[20] = 2;
            assert.deepEqual(expected, utils.mapToField([{"localTimestamp":10,"value":"a"},{"localTimestamp":20,"value":2}],"value"));
        })
    })
    describe('#filter()', function(){
        it('should return an array of objects that contain the key-value pair in a given array', function(){
            assert.deepEqual([], utils.filter([],"key","value"));
            assert.deepEqual([], utils.filter([{}],"key","value"));
            assert.deepEqual([{"key":"value"}], utils.filter([{"key":"value"}],"key","value"));
            assert.deepEqual([{"key":"value","key2":1}], utils.filter([{"key":"value","key2":1}],"key","value"));
            assert.deepEqual([{"key":"value","key2":1}], utils.filter([{"key":"value","key2":1},{"key3":2}],"key","value"));
            assert.deepEqual([{"key":"value","key2":1},{"key":"value","key2":2}], utils.filter([{"key":"value","key2":1},{"key":"value","key2":2},{"key":"value2"}],"key","value"));
        })
    })
    describe('#collapseField()', function(){
        it('should return an empty object when given an empty array',function () {
            assert.deepEqual({}, utils.collapseField([],"key",1));
        })
        it('should return an empty object when given an object in an array that is missing a localTimestamp key',function () {
            assert.deepEqual({}, utils.collapseField([{test:1}],1));
        })
        it('should return an object keyed by localTimestamp of every object in the array when granularity is 1, with values equal to the value of the given key',function () {
            assert.deepEqual({"1":4,"2":2,"3":1}, utils.collapseField([{localTimestamp:1,key:4},{localTimestamp:2,key:2},{localTimestamp:3,key:1}],"key",1));
        })
        it('should return an object keyed by data[0].localTimestamp+n*granularity when granularity > 1',function () {
            assert.deepEqual({"1":6,"3":2,"5":1}, utils.collapseField([{localTimestamp:1,key:4},{localTimestamp:2,key:2},{localTimestamp:3,key:1},{localTimestamp:4,key:1},{localTimestamp:5,key:1}],"key",2));
        })
        it('should return an object with key starting at alignedStartValue when defined',function () {
            assert.deepEqual({"2":1,"4":2}, utils.collapseField([{localTimestamp:3,key:1},{localTimestamp:4,key:1},{localTimestamp:5,key:1}],"key",2,false,2));
        })
        it('should not count events that occur before alignedStartValue',function () {
            assert.deepEqual({"2":3,"4":2}, utils.collapseField([{localTimestamp:1,key:4},{localTimestamp:2,key:2},{localTimestamp:3,key:1},{localTimestamp:4,key:1},{localTimestamp:5,key:1}],"key",2,false,2));
        })
        it('should create buckets that contain zeroes when showZero is true',function () {
            assert.deepEqual({"0":0,"2":3,"4":2,"6":0,"8":4}, utils.collapseField([{localTimestamp:2,key:2},{localTimestamp:3,key:1},{localTimestamp:4,key:1},{localTimestamp:5,key:1},{localTimestamp:8,key:4}],"key",2,true,0));
        })
    })
    describe('#collapseCount()', function(){
        it('should return an empty object when given an empty array',function () {
            assert.deepEqual({}, utils.collapseCount([],1));
        })
        it('should return an empty object when given an object in an array that is missing a localTimestamp key',function () {
            assert.deepEqual({}, utils.collapseCount([{test:1}],1));
        })
        it('should return an object keyed by localTimestamp of every object in the array when granularity is 1, which values equal to 1',function () {
            assert.deepEqual({"1":1,"2":1,"3":1}, utils.collapseCount([{localTimestamp:1},{localTimestamp:2},{localTimestamp:3}],1));
        })
        it('should return an object keyed by data[0].localTimestamp+n*granularity when granularity > 1',function () {
            assert.deepEqual({"1":2,"3":2,"5":1}, utils.collapseCount([{localTimestamp:1},{localTimestamp:2},{localTimestamp:3},{localTimestamp:4},{localTimestamp:5}],2));
        })
        it('should return an object with key starting at alignedStartValue when defined',function () {
            assert.deepEqual({"2":1,"4":2}, utils.collapseCount([{localTimestamp:3},{localTimestamp:4},{localTimestamp:5}],2,false,2));
        })
        it('should not count events that occur before alignedStartValue, and bundle them into the first bucket',function () {
            assert.deepEqual({"2":2,"4":2}, utils.collapseCount([{localTimestamp:1},{localTimestamp:2},{localTimestamp:3},{localTimestamp:4},{localTimestamp:5}],2,false,2));
        })
        it('should create buckets that contain zeroes when showZero is true',function () {
            assert.deepEqual({"0":0,"2":2,"4":2,"6":0,"8":1}, utils.collapseCount([{localTimestamp:2},{localTimestamp:3},{localTimestamp:4},{localTimestamp:5},{localTimestamp:8}],2,true,0));
        })
        it('should reverse data when timestamps are in reverse order', function () {
            assert.deepEqual({"0":0,"2":2,"4":2,"6":0,"8":1}, utils.collapseCount([{localTimestamp:2},{localTimestamp:3},{localTimestamp:4},{localTimestamp:5},{localTimestamp:8}].reverse(),2,true,0));
        })
    })
    describe('#accumulateField()', function(){
        it('should return an empty object when given an empty array',function () {
            assert.deepEqual({}, utils.accumulateField([],"key"));
        })
        it('should return an empty object when given an object in an array that is missing a localTimestamp key',function () {
            assert.deepEqual({}, utils.accumulateField([{test:1}],1));
        })
        it('should return an object keyed by localTimestamp of every object in the array with values equal to sum of its own field and the value of the field in objects before it',function () {
            assert.deepEqual({"1":4,"2":6,"4":7}, utils.accumulateField([{localTimestamp:1,key:4},{localTimestamp:2,key:2},{localTimestamp:4,key:1}],"key"));
        })
        it('should reverse data when timestamps are in reverse order', function () {
            assert.deepEqual({"1":4,"2":6,"4":7}, utils.accumulateField([{localTimestamp:1,key:4},{localTimestamp:2,key:2},{localTimestamp:4,key:1}].reverse(),"key"));
        })
    })
    describe('#accumulateCount()', function(){
        it('should return an empty object when given an empty array',function () {
            assert.deepEqual({}, utils.accumulateCount([],"key"));
        })
        it('should return an empty object when given an object in an array that is missing a localTimestamp key',function () {
            assert.deepEqual({}, utils.accumulateCount([{test:1}],1));
        })
        it('should return an object keyed by localTimestamp of every object in the array with values equal to sum of its own field and the value of the field in objects before it',function () {
            assert.deepEqual({"1":1,"2":2,"4":3}, utils.accumulateCount([{localTimestamp:1,key:4},{localTimestamp:2,key:2},{localTimestamp:4,key:1}],"key"));
        })
        it('should reverse data when timestamps are in reverse order',function () {
            assert.deepEqual({"1":1,"2":2,"4":3}, utils.accumulateCount([{localTimestamp:1,key:4},{localTimestamp:2,key:2},{localTimestamp:4,key:1}].reverse(),"key"));
        })
    })
    describe('#transformToPlot()', function(){
        it('should return an empty array when given an empty object',function () {
            assert.deepEqual([], utils.transformToPlot({}));
        })
        it('should return an array of arrays where each entry in the array is of the format [key,value] from the given object',function () {
            assert.deepEqual([[1,4],[2,6],[4,7]], utils.transformToPlot({"1":4,"2":6,"4":7}));
        })
        it('should subtract from the keys the value relative if defined',function () {
            assert.deepEqual([[0,4],[1,6],[3,7]], utils.transformToPlot({"1":4,"2":6,"4":7},1));
        })
    })
    describe('#padZeroes_generic()', function(){
        it('should return an array with [startTime,0],[finalTime,0] when given an empty array',function () {
            assert.deepEqual([[1,0],[10,0]], utils.padZeroes_generic([], true, 1, 10, false, 0));
        })
        it('should return an array with [startTime,0] and [finalTime,0] at either end when given an array of arrays',function () {
            assert.deepEqual([[1,0],[1,1],[2,2],[3,3],[10,0]], utils.padZeroes_generic([ [1,1], [2,2], [3,3] ], true, 1, 10, false, 0));
        })
        it('should return an array with [startTime,0] and [finalTime,finalValue] at either end when given an array of arrays',function () {
            assert.deepEqual([[1,0],[1,1],[2,2],[3,3],[10,4]], utils.padZeroes_generic([ [1,1], [2,2], [3,3] ], true, 1, 10, false, 4));
        })
        it('should reduce the final time by relative when relative is defined and an integer',function () {
            assert.deepEqual([[1,0],[1,1],[2,2],[3,3],[9,0]], utils.padZeroes_generic([ [1,1], [2,2], [3,3] ], true, 1, 10, 1, 0));
        })
    })
    describe('#padZeroes_collapse()', function(){
        it('should return an array with [startTime,0] when given an empty array and finalTime-granularity < startTime',function () {
            assert.deepEqual([[1,0]], utils.padZeroes_collapse([], true, 1, 10, false, 10));
        })
        it('should return an array with [startTime,0],[startTime+granularity,0]..[finalTime,0] when given an empty array',function () {
            assert.deepEqual([[1,0],[6,0],[11,0]], utils.padZeroes_collapse([], true, 1, 15, false, 5));
        })
        it('should return an array with [data[0][0]-granularity*n,0],[data[0][0]-granularity*(n-1),0]..data..[data[data.length-1][0]+granularity*(m-1),0],[data[data.length-1][0]+granularity*m,0] where data[0][0]-granularity*n >= startTime and data[data.length][0]+granularity*m <= finalTime ',function () {
            assert.deepEqual([[2,0],[7,1],[12,0]], utils.padZeroes_collapse([[7,1]], true, 2, 12, false, 5));
        })
        it('should subtract relative from finalTime before running algorithm ',function () {
            assert.deepEqual([[2,0],[7,1],[12,0]], utils.padZeroes_collapse([[7,1]], true, 2, 17, 5, 5));
        })
    })
    describe('#determineDateString()', function(){
        it('should return %S when given an empty array',function () {
            assert.equal("%S", utils.determineDateString([]));
        })
        it('should return %S when given an array with one value',function () {
            assert.equal("%S", utils.determineDateString([ {localTimestamp:1000} ]));
        })
        it('should return %S when the difference between the first and last timestamps is less than one minute',function () {
            assert.equal("%S", utils.determineDateString([{localTimestamp:0},{localTimestamp:59000}]));
        })
        it('should return %M:%S when the difference between the first and last timestamps is greater than or equal to one minute and less than one hour',function () {
            assert.equal("%M:%S", utils.determineDateString([{localTimestamp:0},{localTimestamp:61000}]));
        })
        it('should return %H:%M:%S when the difference between the first and last timestamps is greater than or equal to one hour and less than one day',function () {
            assert.equal("%H:%M:%S", utils.determineDateString([{localTimestamp:0},{localTimestamp:60000 * 60}]));
        })
        it('should return %m/%d %H:%M when the difference between the first and last timestamps is greater than or equal to one day and less than one week',function () {
            assert.equal("%m/%d %H:%M", utils.determineDateString([{localTimestamp:0},{localTimestamp:60000 * 60 * 24 * 2}]));
        })
        it('should return %m/%d when the difference between the first and last timestamps is greater than or equal to one week',function () {
            assert.equal("%m/%d", utils.determineDateString([{localTimestamp:0},{localTimestamp:60000 * 60 * 24 * 7}]));
        })
        it('should return the correct value when the order of the data is reversed',function () {
            assert.equal("%m/%d", utils.determineDateString([{localTimestamp:0},{localTimestamp:60000 * 60 * 24 * 7 + 1}].reverse()));
        })
    })
})
describe('OQL', function(){
    describe('#values()', function(){
        it('should return all rows in the database', function(){
            var data = [{v:4},{v:16},{v:25}];
            var db = new OQL(data);
            assert.deepEqual([{v:4},{v:16},{v:25}],db.values());
        })
        it('should handle empty arrays gracefully', function(){
            var data = [];
            var db = new OQL(data);
            assert.deepEqual([],db.values());
        })
    })
    describe('#operate(field, function)', function(){
        it('should run the function given on the field property of each entry in the database', function(){
            var data = [{v:4},{v:16},{v:25}];
            var db = new OQL(data);
            assert.deepEqual([{v:2},{v:4},{v:5}],db.operate('v',Math.sqrt).values());
        })
        it('should handle empty arrays gracefully', function(){
            var data = [];
            var db = new OQL(data);
            assert.deepEqual([],db.operate('v',Math.sqrt).values());
        })
    })
    describe('#operate(function)', function(){
        it('should run the given function on each entry in the database', function(){
            var func = function(row) {
                row.v = Math.sqrt(row.v);
                return row;
            }
            var data = [{v:4},{v:16},{v:25}];
            var db = new OQL(data);
            assert.deepEqual([{v:2},{v:4},{v:5}],db.operate(func).values());
        })
        it('should handle empty arrays gracefully', function(){
            var func = function(row) {
                row.v = Math.sqrt(row.v);
                return row;
            }
            var data = [];
            var db = new OQL(data);
            assert.deepEqual([],db.operate(func).values());
        })
    })
    describe('#operate(field, op, val)', function(){
        it('should run the given operation on the field property of each entry in the database', function(){
            var data = [{v:4},{v:16},{v:25}];
            var db = new OQL(data);
            assert.deepEqual([{v:2},{v:14},{v:23}],db.operate('v','-',2).values());
            assert.deepEqual([{v:4},{v:16},{v:25}],db.operate('v','+',2).values());
            assert.deepEqual([{v:8},{v:32},{v:50}],db.operate('v','*',2).values());
            assert.deepEqual([{v:4},{v:16},{v:25}],db.operate('v','/',2).values());
        })
        it('should handle empty arrays gracefully', function(){
            var data = [];
            var db = new OQL(data);
            assert.deepEqual([],db.operate('v','-',2).values());
            assert.deepEqual([],db.operate('v','+',2).values());
            assert.deepEqual([],db.operate('v','*',2).values());
            assert.deepEqual([],db.operate('v','/',2).values());
        })
    })
    describe('#sum(field)',function() {
        it('should return the sum of the given field for all objects in the database', function(){
            var data = [{v:4},{v:16},{v:25}];
            var db = new OQL(data);
            assert.equal(45,db.sum('v'));
        })
        it('should return 0 for empty arrays or arrays which contain none of the given key', function(){
            var data = [];
            var db = new OQL(data);
            assert.equal(0,db.sum('v'));
            data = [{v:4},{v:16},{v:25}];
            var db = new OQL(data);
            assert.equal(0,db.sum('t'));
        })
    })
    describe('#select(field, comp, val)',function() {
        it('should return itself with the values modified such that they contain only objects that meet the restriction of comp(field,val) where comp is a math comparison operator', function(){
            var data = [{v:4},{v:16},{v:25}];
            var db = new OQL(data);
            assert.deepEqual([{v:25}],db.select('v','>',16).values());
            db = new OQL(data);
            assert.deepEqual([{v:4}],db.select('v','<',16).values());
            db = new OQL(data);
            assert.deepEqual([{v:16}],db.select('v','=',16).values());
            db = new OQL(data);
            assert.deepEqual([{v:16}],db.select('v','==',16).values());
            db = new OQL(data);
            assert.deepEqual([{v:4},{v:25}],db.select('v','!=',16).values());
        })
    })
    describe('#select(function)',function() {
        it('should return itself with the values modified such that they contain only objects that meet the restriction of function(row) where function returns true or false', function(){
            var comp = function(row) {
                return (row.v%4==0)
            };
            var data = [{v:4},{v:16},{v:25}];

            var db = new OQL(data);
            assert.deepEqual([{v:4},{v:16}],db.select(comp).values());
        })
    })
});