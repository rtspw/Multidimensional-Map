import OrderedMap from './ordered-map'
import MultidimensionalMap from './multidimensional-map'

import data from './test'
import testData from './test-data'

interface VolumeDataEntry {
  Volume: number,
  Severity: number,
  Day: string,
  Week: string,
  Month: string,
  Quarter: string,
  Year: string,
}

const test = new MultidimensionalMap<VolumeDataEntry>(['Day', 'Week', 'Month', 'Quarter', 'Year', 'Severity'], data.VolumeData);
console.log(test.getSubset({ Day: { range: ['06/01/18', '06/30/18']} , Severity: 1 }).combineEntries('Volume', ['Week']))
