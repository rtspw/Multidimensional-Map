const { MultidimensionalMap } = require('../dist/index')

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

test(`Basic structure of the map`, () => {
  const testMap = new MultidimensionalMap(['day', 'hour', 'item'], data)
  expect(testMap.dimensions['day'].length).toBe(2)
  expect(testMap.dimensions['hour'].length).toBe(4)
  expect(testMap.dimensions['item'].length).toBe(3)
  expect(testMap.entries).toStrictEqual(data)
  expect(testMap.dimensions['day'].get('07/20/2020')).toStrictEqual(data.slice(0, 12))
  expect(testMap.dimensions['hour'].get('9am')).toStrictEqual([data[3], data[4], data[5], data[15], data[16], data[17]])
  expect(testMap.dimensions['item'].get('orange')).toStrictEqual([data[1], data[4], data[7], data[10], data[13], data[16], data[19], data[22]])
})

describe(`Subsetting features`, () => {
  const testMap = new MultidimensionalMap(['day', 'hour', 'item'], data)
  test(`Direct match`, () => {
    expect(testMap.getSubsetArray({ hour: '9am' })).toStrictEqual([data[3], data[4], data[5], data[15], data[16], data[17]])
    expect(testMap.getSubsetArray({ item: 'orange' })).toStrictEqual([data[1], data[4], data[7], data[10], data[13], data[16], data[19], data[22]])
  })
  test(`Match queries`, () => {
    expect(testMap.getSubsetArray({ item: { matches: ['orange', 'banana'] } })).toStrictEqual([1, 4, 7, 10, 13, 16, 19, 22, 2, 5, 8, 11, 14, 17, 20, 23].map(i => data[i]))
  })
  test(`Range queries`, () => {
    expect(testMap.getSubsetArray({ hour: { range: ['9am', '11am'] } })).toStrictEqual([3, 4, 5, 15, 16, 17, 6, 7, 8, 18, 19, 20, 9, 10, 11, 21, 22, 23].map(i => data[i]))
    expect(testMap.getSubsetArray({ hour: { range: ['9am', null] } })).toStrictEqual([3, 4, 5, 15, 16, 17, 6, 7, 8, 18, 19, 20, 9, 10, 11, 21, 22, 23].map(i => data[i]))
  })
  test(`Multi queries`, () => {
    expect(testMap.getSubsetArray({ day: '07/20/2020', item: 'banana', hour: '10am' })).toStrictEqual([data[8]])
    expect(testMap.getSubset({ day: '07/20/2020' }).getSubset({ item: 'banana' }).getSubsetArray({ hour: '10am' })).toStrictEqual([data[8]])
  })
})

describe(`Combining features`, () => {
  const testMap = new MultidimensionalMap(['day', 'hour', 'item'], data)
  test(`Error handling`, () => {
    expect(() => testMap.combineEntries('numberSold', ['dday'])).toThrow(/does not exist/)
    expect(testMap.combineEntries('foo')).toEqual({ foo: NaN })
  })
  test(`Total sum`, () => {
    expect(testMap.combineEntries('numberSold')).toEqual({ numberSold: 800 })
  })
  test(`One field`, () => {
    expect(testMap.combineEntries('numberSold', ['hour'])).toEqual(
      {
        '8am': { hour: '8am', numberSold: 127 },
        '9am': { hour: '9am', numberSold: 126 },
        '10am': { hour: '10am', numberSold: 233 },
        '11am': { hour: '11am', numberSold: 314 },
      }
    )
    expect(testMap.combineEntries('numberSold', ['day'])).toEqual(
      {
        '07/20/2020': { day: '07/20/2020', numberSold: 409 },
        '07/21/2020': { day: '07/21/2020', numberSold: 391 },
      }
    )
  })
  test(`Two fields`, () => {
    expect(testMap.getSubset({ hour: '9am' }).combineEntries('numberSold', ['day', 'item'])).toEqual(
      {
        '07/20/2020': { 
          apple: { day: '07/20/2020', item: 'apple', numberSold: 33 }, 
          banana: { day: '07/20/2020', item: 'banana', numberSold: 11 }, 
          orange: { day: '07/20/2020', item: 'orange', numberSold: 23 },
        }, 
        '07/21/2020': {
          apple: { day: '07/21/2020', item: 'apple', numberSold: 20 }, 
          banana: { day: '07/21/2020', item: 'banana', numberSold: 23 }, 
          orange: { day: '07/21/2020', item: 'orange', numberSold: 16 },
        },
      }
    )
  })
  test(`Multiple Measures`, () => {
    const miniData = [
      { day: '07/20/2020', hour: '8am', item: 'apple', numberSold: 35, measure2: 1 },
      { day: '07/20/2020', hour: '8am', item: 'orange', numberSold: 12, measure2: 2 },
      { day: '07/20/2020', hour: '8am', item: 'banana', numberSold: 26, measure2: 3 },
    ]
    const miniTestMap = new MultidimensionalMap(['day', 'hour', 'item'], miniData)
    expect(miniTestMap.combineEntries(['numberSold', 'measure2'], ['hour'])).toEqual({
      '8am': { numberSold: 73, measure2: 6, hour: '8am' },
    })
    expect(miniTestMap.combineEntries(['numberSold', 'measure2'], ['item'])).toEqual({
      apple: { numberSold: 35, measure2: 1, item: 'apple' },
      orange: { numberSold: 12, measure2: 2, item: 'orange' },
      banana: { numberSold: 26, measure2: 3, item: 'banana' },
    })
  })
})
