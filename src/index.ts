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
console.log(test.combineEntries(test.getEntriesInRange('Day', '07/01/18', '07/12/20'), 'Volume', ['Severity', 'Quarter']))
console.log(test.length)
