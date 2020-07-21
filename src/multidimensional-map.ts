import OrderedMap from './ordered-map'

export interface DimensionCollection<T> {
  [key: string]: OrderedMap<string | number, T>
}

export type QueryRange<T> = [T, T]

export interface QueryDetails<T> {
  matches?: (string | number)[],
  range?: QueryRange<T>
}

export interface MatchQuery<T> {
  [dimension: string]: T | QueryDetails<T>
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

  getEntriesInRange(dimension: string, start: string | number | null, end: string | number | null): EntryT[] {
    if (!this.dimensions.hasOwnProperty(dimension)) throw new Error(`Dimension "${dimension}" does not exist`) 
    const targetDimension: OrderedMap<string | number, EntryT[]> = this.dimensions[dimension]
    const startIdx = start == null ? 0 : targetDimension.indexOf(start)
    const endIdx = end == null ? targetDimension.length - 1 : targetDimension.indexOf(end)
    if (startIdx === -1) throw new Error(`Range start "${start}" does not exist in dimension`)
    if (endIdx === -1) throw new Error(`Range end "${end}" does not exist`)
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
          const matchingEntries: EntryT[] = []
          dimensionItem.matches.forEach((queryItem) => {
            const matchResult = this.dimensions[dimensionName].get(queryItem as number | string)
            matchingEntries.push(...matchResult)
          })
          return matchingEntries
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

  combineEntries(measures: keyof EntryT | (keyof EntryT)[], dimensions?: string[], entries?: EntryT[]) {
    const dataEntries = entries ? entries : this.entries
    const _measures = Array.isArray(measures) ? measures : [measures]
    if (dataEntries.length === 0) return []
    const output = {}

    /* If no fields are given, simply sum over the measure */
    if (dimensions == null || dimensions.length === 0) {
      output[measures as string] = 0
      dataEntries.forEach(entry => {
        _measures.forEach(measure => output[measure as string] += entry[measure])
      })
      return output
    }

    /* Checks that all the dimension names exist */
    dimensions.forEach(dimension => { 
      if (!this.dimensions.hasOwnProperty(dimension)) throw new Error(`Field "${dimension}" does not exist`) 
    })

    /* Creates nested objects if it doesn't exist, and sum over the measures
     * current keeps track of level of nesting in output object */
    dataEntries.forEach(dataEntry => {
      let current = output
      dimensions.forEach((dimension, idx) => {
        const dimensionValue = dataEntry[dimension]
        const lastItemIndex = dimensions.length - 1
        if (current[dimensionValue] == null) {
          if (idx === lastItemIndex) {
            const subsetOfEntry = {}
            _measures.forEach(measure => subsetOfEntry[measure as string] = dataEntry[measure])
            dimensions.forEach(dimension => subsetOfEntry[dimension] = dataEntry[dimension])
            current[dimensionValue] = subsetOfEntry
          } else {
            current[dimensionValue] = {}
          }
        } else {
          if (idx === lastItemIndex) {
            _measures.forEach(measure => current[dimensionValue][measure] += dataEntry[measure])
          }
        }
        current = current[dimensionValue]
      })
    })
    return output
  }

  get length() {
    return this.entries.length
  }
}

export default MultidimensionalMap 