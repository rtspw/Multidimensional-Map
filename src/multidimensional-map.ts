import OrderedMap from './ordered-map'

export interface DimensionCollection<T> {
  [key: string]: OrderedMap<string | number, T>
}

export type QueryRange<T> = [T, T]

export interface Query<T> {
  matches?: (string | number)[],
  range?: QueryRange<T>
}

export interface MatchQuery<T> {
  [dimension: string]: T | Query<T>
}

/* Gets the intersection of the Array type (not Set)
 * Implementation assumes that array items are unique */
function getArrayIntersection<T>(...sets: (T[])[]) {
  const numOfAppearances = new Map<T, number>()
  sets.forEach(set => {
    set.forEach(item => {
      if (!numOfAppearances.has(item))
        numOfAppearances.set(item, 0)
      const incrementedValue = numOfAppearances.get(item) + 1
      numOfAppearances.set(item, incrementedValue)
    })
  })
  const intersection: T[] = []
  numOfAppearances.forEach((count, item) => {
    if (count === sets.length) intersection.push(item)
  })
  return intersection
}

class MultidimensionalMap<EntryT> {
  dimensions: DimensionCollection<EntryT[]>
  entries: EntryT[] = []

  constructor(dimensions: string[], entries?: EntryT[]) {
    this.dimensions = dimensions.reduce((acc: DimensionCollection<EntryT[]>, curr: string) => {
      acc[curr] = new OrderedMap<string | number, EntryT[]>()
      return acc
    }, {})
    if (entries) {
      this.addEntries(entries)
    }
  }

  addEntries(entries: EntryT[]): void {
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

  getAllEntries(): EntryT[] {
    return this.entries
  }

  getEntriesInRange(dimension: string, start: string | number, end: string | number): EntryT[] {
    if (!this.dimensions.hasOwnProperty(dimension))
      throw new Error(`Dimension "${dimension}" does not exist`) 
    const targetDimension: OrderedMap<string | number, EntryT[]> = this.dimensions[dimension]
    const startIdx: number = (() => {
      const startIdx = targetDimension.indexOf(start)
      return startIdx === -1 ? 0 : startIdx
    })()
    const endIdx: number = (() => {
      const endIdx = targetDimension.indexOf(end)
      return endIdx === -1 ? targetDimension.length - 1 : endIdx
    })()
    const entryList: EntryT[] = []
    for (let i = startIdx; i <= endIdx; i++) {
      const entries = targetDimension.getAt(i)
      entryList.push(...entries)
    }
    return entryList
  }

  getSubsetArray(query: MatchQuery<string | number>): EntryT[] {
    const subsets = Object.entries(query).map(([dimensionName, dimensionItem]) => {
      if (!this.dimensions.hasOwnProperty(dimensionName)) 
        throw new Error(`Dimension "${dimensionName}" does not exist`) 
      if (typeof dimensionItem === 'object') {
        if (dimensionItem.range && dimensionItem.matches) {
          throw new Error(`Must specify either "range" or "matches" property but not both`)
        } else if (dimensionItem.range) {
          const [start, end] = dimensionItem.range
          return this.getEntriesInRange(dimensionName, start, end)
        } else if (dimensionItem.matches) {
          return dimensionItem.matches.map((queryItem) => {
            return this.dimensions[dimensionName].get(queryItem as number | string)
          }).flat(1)
        } else {
          return this.entries
        }
      }
      return this.dimensions[dimensionName].get(dimensionItem as number | string)
    })
    return getArrayIntersection(...subsets)
  }

  getSubset(query: MatchQuery<string | number>): MultidimensionalMap<EntryT> {
    const subsetArray = this.getSubsetArray(query)
    return new MultidimensionalMap<EntryT>(Object.keys(this.dimensions), subsetArray)
  }

  combineEntries(measure: keyof EntryT, fields: string[], entries?: EntryT[]) {
    fields.forEach(field => { 
      if (!this.dimensions.hasOwnProperty(field)) throw new Error(`Field "${field}" does not exist`) 
    })
    const dataEntries = entries ? entries : this.entries
    if (dataEntries.length === 0) return []
    const nestedEntries = {}
    dataEntries.forEach(dataEntry => {
      let current = nestedEntries
      fields.forEach((subfield, idx) => {
        if (current[dataEntry[subfield]] == null) {
          if (idx >= fields.length - 1) {
            const subset = { [measure]: dataEntry[measure] }
            fields.forEach(subfield => { subset[subfield] = dataEntry[subfield] })
            current[dataEntry[subfield]] = subset
          } else {
            current[dataEntry[subfield]] = {}
          }
        } else {
          if (idx >= fields.length - 1) {
            current[dataEntry[subfield]][measure] += dataEntry[measure]
          }
        }
        current = current[dataEntry[subfield]]
      })
    })
    return nestedEntries
  }

  get length() {
    return this.entries.length
  }
}

export default MultidimensionalMap 