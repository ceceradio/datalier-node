var datalier = require('../datalier.js');
var utils = datalier.utils();
var assert = require("assert")

describe('utils', function(){
	describe('#getUniqueEvents()', function(){
		it('should return an object of the count of values in the event property of objects in a given array', function(){
			assert.deepEqual({}, utils.getUniqueEvents([{}]));
			assert.deepEqual({a:1}, utils.getUniqueEvents([{"event":"a"}]));
			assert.deepEqual({a:2}, utils.getUniqueEvents([{"event":"a"},{"event":"a"}]));
			assert.deepEqual({a:1,b:1}, utils.getUniqueEvents([{"event":"a"},{"event":"b"}]));
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
		it('should return an object keyed by localTimestamp of every object in the array when granularity is 1',function () {
			assert.deepEqual({"1":4,"2":2,"3":1}, utils.collapseField([{localTimestamp:1,key:4},{localTimestamp:2,key:2},{localTimestamp:3,key:1}],"key",1));
		})
		it('should return an object keyed by data[0].localTimestamp+n*granularity when granularity > 1',function () {
			assert.deepEqual({"1":6,"3":2,"5":1}, utils.collapseField([{localTimestamp:1,key:4},{localTimestamp:2,key:2},{localTimestamp:3,key:1},{localTimestamp:4,key:1},{localTimestamp:5,key:1}],"key",2));
		})
	})
})