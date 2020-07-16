
class OrderedMap {
  map: Map<any, any>
  order: any[]
  length: number = 0

  append(key: any, value: any) {
    this.map.set(key, value)
    this.order.push(key)
  }

  prepend() {

  }

  get() {

  }

  remove() {

  }
}

export default OrderedMap