import OrderedMap from './ordered-map'
import MultidimensionalMap from './multidimensional-map'

import data from './test'

interface VolumeDataEntry {
  Volume: number,
  Severity: number,
  Day: string,
  Week: string,
  Month: string,
  Quarter: string,
  Year: string,
}

const test = new MultidimensionalMap<VolumeDataEntry>(['Day', 'Week', 'Month', 'Quarter', 'Year', 'Severity']);
test.addEntries(data.VolumeData)
console.log(test.filter({ Day: ['08/02/18', '08/04/18'], Severity: [1,2]}))
