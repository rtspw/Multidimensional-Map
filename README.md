# Multidimensional Map

![npm bundle size](https://img.shields.io/bundlephobia/min/multidimensional-map?style=flat-square)
![NPM](https://img.shields.io/npm/l/multidimensional-map?style=flat-square)
![npm](https://img.shields.io/npm/v/multidimensional-map?style=flat-square)

NPM: <https://www.npmjs.com/package/multidimensional-map>

[Skip to API](#API)

## Summary 
A multidimensional map allows multiple keys to be mapped to a numeric value, called a **measure** (e.g. "money", "volume"). Each of those keys will be part of a separate **dimension** (e.g. "age", "month", "gender").

Each map can be subsetted into a new map given a filter (specifying direct matches or a range), and entries with the same key within a dimension can be combined (similar to marginalization in math).  The concept of key ordering for ranges is determined by insertion order. 

This is primarily a write-once structure meant to manipulate data. This data structure was originally designed to work similarly to an [OLAP cube](https://en.wikipedia.org/wiki/OLAP_cube), but more lightweight with a subset of features.

## Getting Started

### Install
```bash
npm install multidimensional-map
```

### Usage

#### Node
```javascript
const { MultidimensionalMap } = require('multidimensional-map')
```

#### Bundler
```javascript
import { MultidimensionalMap } from 'multidimensional-map'
```

Imagine we have data of a morning fruit shop, open from 8am to 11am daily. The shop sells apples, oranges, and bananas. Below we get the data from two days of sales:

```javascript
const data = [
  { day: '07/20/2020', hour: '8am', item: 'apple', numberSold: 35 },
  { day: '07/20/2020', hour: '8am', item: 'orange', numberSold: 12 },
  { day: '07/20/2020', hour: '8am', item: 'banana', numberSold: 26 },
  { day: '07/20/2020', hour: '9am', item: 'apple', numberSold: 33 },
  { day: '07/20/2020', hour: '9am', item: 'orange', numberSold: 23 },
  { day: '07/20/2020', hour: '9am', item: 'banana', numberSold: 11 },
  { day: '07/20/2020', hour: '10am', item: 'apple', numberSold: 46 },
  { day: '07/20/2020', hour: '10am', item: 'orange', numberSold: 34 },
  { day: '07/20/2020', hour: '10am', item: 'banana', numberSold: 32 },
  { day: '07/20/2020', hour: '11am', item: 'apple', numberSold: 67 },
  { day: '07/20/2020', hour: '11am', item: 'orange', numberSold: 36 },
  { day: '07/20/2020', hour: '11am', item: 'banana', numberSold: 54 },
  { day: '07/21/2020', hour: '8am', item: 'apple', numberSold: 25 },
  { day: '07/21/2020', hour: '8am', item: 'orange', numberSold: 8 },
  { day: '07/21/2020', hour: '8am', item: 'banana', numberSold: 21 },
  { day: '07/21/2020', hour: '9am', item: 'apple', numberSold: 20 },
  { day: '07/21/2020', hour: '9am', item: 'orange', numberSold: 16 },
  { day: '07/21/2020', hour: '9am', item: 'banana', numberSold: 23 },
  { day: '07/21/2020', hour: '10am', item: 'apple', numberSold: 50 },
  { day: '07/21/2020', hour: '10am', item: 'orange', numberSold: 39 },
  { day: '07/21/2020', hour: '10am', item: 'banana', numberSold: 32 },
  { day: '07/21/2020', hour: '11am', item: 'apple', numberSold: 78 },
  { day: '07/21/2020', hour: '11am', item: 'orange', numberSold: 53 },
  { day: '07/21/2020', hour: '11am', item: 'banana', numberSold: 26 },
]
```

Notice that data is enumerated over all dimensions, where each key is still inputted in a specific order. *numberSold* is a **measure**, while *day*, *hour*, and *item* are **dimensions**.

```javascript
const dimensions = ['day', 'hour', 'item']
const dataMap = new MultidimensionalMap(dimensions, data)

/* Creates a new map with only banana and orange sales from 9am to 11am on 07/21/2020 */
const subset = dataMap.getSubset({
  hour: { range: ['9am', '11am'] },
  item: { matches: ['banana', 'orange'] },
  day: '07/21/2020',
})

/* Gets total number sold within subset */
const combined = subset.combineEntries('numberSold')
/* Combines the entries from the subset over the "item" dimension */
const combinedOverItem = subset.combineEntries('numberSold', ['item'])
const combinedOverHour = subset.combineEntries('numberSold', ['hour'])
/* When multiple dimensions are given, the order determines the nesting of the output object */
const combinedOverBoth = subset.combineEntries('numberSold', ['item', 'hour'])
const combinedOverBoth2 = subset.combineEntries('numberSold', ['hour', 'item'])

```

```javascript
/* subset.getAllEntries() */
[
  { day: '07/21/2020', hour: '9am', item: 'orange', numberSold: 16 },
  { day: '07/21/2020', hour: '9am', item: 'banana', numberSold: 23 },
  { day: '07/21/2020', hour: '10am', item: 'orange', numberSold: 39 },
  { day: '07/21/2020', hour: '10am', item: 'banana', numberSold: 32 },
  { day: '07/21/2020', hour: '11am', item: 'orange', numberSold: 53 },
  { day: '07/21/2020', hour: '11am', item: 'banana', numberSold: 26 }
],

/* combined */
{ numberSold: 189 }

/* combinedOverItem */
{
  orange: { numberSold: 108, item: 'orange' },
  banana: { numberSold: 81, item: 'banana' },
}

/* combinedOverHour */
{
  '9am': { numberSold: 39, hour: '9am' },
  '10am': { numberSold: 71, hour: '10am' },
  '11am': { numberSold: 79, hour: '11am' }
}

/* combinedOverBoth */
{
  orange: {
    '9am': { numberSold: 16, item: 'orange', hour: '9am' },
    '10am': { numberSold: 39, item: 'orange', hour: '10am' },
    '11am': { numberSold: 53, item: 'orange', hour: '11am' }
  },
  banana: {
    '9am': { numberSold: 23, item: 'banana', hour: '9am' },
    '10am': { numberSold: 32, item: 'banana', hour: '10am' },
    '11am': { numberSold: 26, item: 'banana', hour: '11am' }
  }
}

/* combinedOverBoth2 */
{
  '9am': {
    orange: { numberSold: 16, hour: '9am', item: 'orange' },
    banana: { numberSold: 23, hour: '9am', item: 'banana' }
  },
  '10am': {
    orange: { numberSold: 39, hour: '10am', item: 'orange' },
    banana: { numberSold: 32, hour: '10am', item: 'banana' }
  },
  '11am': {
    orange: { numberSold: 53, hour: '11am', item: 'orange' },
    banana: { numberSold: 26, hour: '11am', item: 'banana' }
  }
}
```

## API

### `new MultidimensionalMap(dimensions: string[], entries?: EntryType[])`

Creates a map with certain dimensions (entries may have more keys than needed). The `entries` parameter works the same as using `addEntries`.


#### `addEntries(entries: EntryType[]): void`

  Adds an array of entries to the map. The dimensions of the entries should be the same as those specified in the constructor.

#### `getAllEntries(): EntryType[]`

  Returns all entries in the map in insertion order.

#### `getSubset(query: Query): MultidimensionalMap`

  Creates a subset of the current entries using specified constraints. See [Usage](#Usage) for examples.

  ##### `query[dimension]: (string | number) or object`

  If passed a string or number key, it will try to find direct matches to key within the dimension. If given an object, either a `range` or `matches` can be specified, but not both.
  
  ###### `query[dimension].range? : [start: (string | number), end: (string | number)]`

  Gives all entries within the range (start, end), inclusive. Ordering is determined by insertion order, but range won't always make sense of some dimensions (e.g. itemType).

  ###### `query[dimension].matches? : (string | number)[]`

  Allows for multiple direct match queries. Specifying just one item is equivalent to setting `query[dimension]` as that item.

#### `getSubsetArray(query: Query): EntryType[]`

  Similar to `getSubset`, but gives array back directly instead of inserting it into a new map.

#### `combineEntries(measure: string, fields?: string[], entries?: EntryT[])`
  - `measure`: name of the key to sum over.
  - `fields?`: dimension names that determine how the measures are summed. Entries with the same key within those dimensions are combined into a single entry. The order the fields also specifies the nesting of the output object. If fields is empty or not given, it will sum up the measure over all entries.
  - `entries?`: special override for which entries the function is run on, making it work similarly to a static function

#### `length: number`

  Getter for number of entries in the map
