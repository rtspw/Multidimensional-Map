import OrderedMap from './ordered-map'

export interface DimensionCollection<T> {
  [key: string]: OrderedMap<string, T>
}

class MultidimensionalMap<T> {
  dimensions: DimensionCollection<T[]>
  entries: T[] = []

  constructor(dimensions: string[]) {
    this.dimensions = dimensions.reduce((acc: DimensionCollection<T[]>, curr: string) => {
      acc[curr] = new OrderedMap<string, T[]>()
      return acc
    }, {})
  }

  addEntries(entries: T[]) {
    entries.forEach(entry => {
      this.entries.push(entry)
      Object.keys(this.dimensions).forEach(dimension => {
        const entryValueForDimension = entry[dimension]
        const dimensionMap = this.dimensions[dimension]
        if (!dimensionMap.has(entryValueForDimension)) {
          dimensionMap.append(entryValueForDimension, [])
        }
        dimensionMap.get(entryValueForDimension).push(entry)
      })
    })
  }
}

export default MultidimensionalMap 