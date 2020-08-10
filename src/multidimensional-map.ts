import { OrderedMap } from './ordered-map'

export interface DimensionCollection<T> {
  [key: string]: OrderedMap<string | number, T>
}

export type QueryRange<T> = [T | null, T | null]

export interface QueryDetails<T> {
  matches?: (string | number)[],
  range?: QueryRange<T>
}

export interface MatchQuery<T> {
  [dimension: string]: T | QueryDetails<T>
}

export interface OrderOverride {
  [dimension: string]: (string | number)[],
}

export interface SubsetOptions {
  keepOrder?: string[] | boolean,
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

  constructor(dimensions: string[], entries?: EntryT[], order: OrderOverride = {}) {
    Object.keys(order).forEach(dimensionName => { 
      if (!dimensions.includes(dimensionName)) throw new Error(`Invalid dimension '${dimensionName}'`)
    })
    this.dimensions = dimensions.reduce((acc: DimensionCollection<EntryT[]>, curr: string) => {
      const startingOrder = order[curr]
      acc[curr] = new OrderedMap<string | number, EntryT[]>(startingOrder)
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
        if (dimensionMap.get(entryValueForDimension) === null || !dimensionMap.has(entryValueForDimension)) {
          dimensionMap.append(entryValueForDimension, [])
        }
        dimensionMap.get(entryValueForDimension).push(entry)
      })
    })
  }

  getAllEntries(): EntryT[] {
    return this.entries
  }

  getEntriesInRange(dimension: keyof EntryT, start: string | number | null, end: string | number | null): EntryT[] {
    if (!this.dimensions.hasOwnProperty(dimension)) throw new Error(`Dimension "${dimension}" does not exist`) 
    const targetDimension: OrderedMap<string | number, EntryT[]> = this.dimensions[dimension as string]
    const startIdx = start == null ? 0 : targetDimension.indexOf(start)
    const endIdx = end == null ? targetDimension.length - 1 : targetDimension.indexOf(end)
    if (startIdx === -1) throw new Error(`Range start "${start}" does not exist in dimension "${dimension}"`)
    if (endIdx === -1) throw new Error(`Range end "${end}" does not exist in dimension "${dimension}"`)
    const entryList: EntryT[] = []
    for (let i = startIdx; i <= endIdx; i++) {
      const entries = targetDimension.getAt(i)
      if (entries === null) continue;
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
          return this.getEntriesInRange(<keyof EntryT>dimensionName, start, end)
        } else if (dimensionItem.matches) {
          const matchingEntries: EntryT[] = []
          dimensionItem.matches.forEach((queryItem) => {
            const matchResult = this.dimensions[dimensionName].get(queryItem as number | string)
            if (matchResult === undefined) throw new Error(`"${queryItem}" does not exist in dimension "${dimensionName}"`)
            matchingEntries.push(...matchResult)
          })
          return matchingEntries
        } else {
          return this.entries
        }
      }
      return this.dimensions[dimensionName].get(dimensionItem as number | string)
    })
    return getArrayIntersection(...subsets.filter(subset => subset != null))
  }

  getSubset(query: MatchQuery<string | number>, options: SubsetOptions = {}): MultidimensionalMap<EntryT> {
    const { keepOrder = false } = options
    const subsetArray = this.getSubsetArray(query)
    const ordering = {}
    if (keepOrder === true)
      Object.keys(this.dimensions).forEach(dimension => { ordering[dimension] = this.dimensions[dimension].order })
    else if (Array.isArray(keepOrder) && keepOrder.length > 0)
      keepOrder.forEach(dimension => { 
        if (this.dimensions[dimension] === undefined) throw new Error(`Dimension '${dimension}' does not exist`)
        ordering[dimension] = this.dimensions[dimension].order
      })
    const subsetMap = new MultidimensionalMap<EntryT>(Object.keys(this.dimensions), subsetArray, ordering)
    return subsetMap
  }

  combineEntries(measures: keyof EntryT | (keyof EntryT)[], dimensions?: string | string[], entries?: EntryT[]): any {
    const dataEntries = entries ? entries : this.entries
    const _measures = Array.isArray(measures) ? measures : [measures]
    const _dimensions = Array.isArray(dimensions) ? dimensions : [dimensions]
    if (dataEntries.length === 0) return {}
    const output = {}

    /* If no fields are given, simply sum over the measure */
    if (dimensions == null || dimensions.length === 0) {
      dataEntries.forEach(entry => {
        _measures.forEach(measure => {
          if (output[measure as string] == null) (output as Partial<EntryT>)[measure as string] = 0;
          (output as Partial<EntryT>)[measure as string] += entry[measure]
        })
      })
      return output
    }

    /* Checks that all the dimension names exist */
    _dimensions.forEach(dimension => { 
      if (!this.dimensions.hasOwnProperty(dimension)) throw new Error(`Field "${dimension}" does not exist`) 
    })

    /* Creates nested objects if it doesn't exist, and sum over the measures
     * current keeps track of level of nesting in output object */
    dataEntries.forEach(dataEntry => {
      let current = output
      _dimensions.forEach((dimension, idx) => {
        const dimensionValue = dataEntry[dimension]
        const lastItemIndex = _dimensions.length - 1
        if (current[dimensionValue] == null) {
          if (idx === lastItemIndex) {
            const subsetOfEntry = {}
            _measures.forEach(measure => subsetOfEntry[measure as string] = dataEntry[measure])
            _dimensions.forEach(dimension => subsetOfEntry[dimension] = dataEntry[dimension])
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

export { MultidimensionalMap } 