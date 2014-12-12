# Datalier Core

This library can be used to process data to be fed into jQuery Flot or other charting plugins. 
The utility functions alone can also be used to process data into useful formats.
OQL, or Object Query Library, is a simple interface to assist in modifying your data before inserting into Datalier.

## Why Datalier?

Datalier makes common graph types easy to crunch with minimal effort. Simply feed it an array of objects, 
with each object having a timestamp property, along with `filters` that will output into graph datasets.

Datalier wrappers can be used to feed the information directly into charting plugins. Included are wrappers
for jQuery Sparkline and jQuery Flot.

## Types

`collapseCount/collapseField` Creates a chart dataset with points every X units of time based on `granularity`. 
`collapseCount` counts the number of events that occur from `granularity*n` to `granularity*(n+1)`.
`collapseField` counts the sum of the given `field` for events that occur from `granularity*n` to `granularity*(n+1)`.

`accumulateCount/accumulateField` Creates a chart dataset with points at x-values corresponding to every object's time.
`accumulateCount`'s datasets have y-values equal to the count of all events that occur on or before the current point's time.
`accumulateField`'s datasets have y-values equal to the sum of the values of the given `field` of all events that occur on or before the current point's time.

`field` Creates a chart dataset with points at x-values corresponding to every object's time. 
The y-value for each point is equal to the value of `field` for each object.

## Examples

```javascript
var data = []; // an array of objects each with javascript timestamp (ms since unix epoch) in the property "localTimestamp" 
var bars = new datalier.sparkline(
	[
		{
			type: 'collapseCount',
			label: 'Tweets',
			padZeroes: true,
			showZeroes: true,
			relative: true,
			alignWithStart: true,
			startTime: startTime,
			finalTime: finalTime,
			lineWidth: 3,
			granularity: 1000 * 60 * 60,
			color: "#3ABCC9"
		}
	],
	data,
	{ type: 'bar', barColor: '#3ABCC9', container: '#sparkline', barWidth:8 },
	"localTimestamp"
);
bars.draw();
```