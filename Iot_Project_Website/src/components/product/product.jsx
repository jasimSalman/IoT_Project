import { useState } from 'react'
import './product.css'

const Product = () => {
  const [products, setProducts] = useState([])
  const [bluetoothDevice, setBluetoothDevice] = useState(null)
  const [gattServer, setGattServer] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    barcode: ''
  })
  const [priceInputs, setPriceInputs] = useState({})

  const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab'
  const PRODUCT_LIST_UUID = '12345678-1234-1234-1234-1234567890ac'
  const ADD_PRODUCT_UUID = '12345678-1234-1234-1234-1234567890ad'
  const DELETE_PRODUCT_UUID = '12345678-1234-1234-1234-1234567890af'
  const UPDATE_PRICE_UUID = '12345678-1234-1234-1234-1234567890ae'

  const connectToESP32 = async () => {
    try {
      if (!navigator.bluetooth) {
        console.error('Web Bluetooth API is not supported on this browser.')
        return
      }

      console.log('Requesting Bluetooth device...')
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID]
      })

      console.log('Device selected:', device.name)

      device.addEventListener('gattserverdisconnected', () => {
        console.error('Device disconnected. Attempting to reconnect...')
        setTimeout(connectToESP32, 5000) // Reconnect after 5 seconds
      })

      console.log('Connecting to GATT server...')
      const server = await device.gatt.connect()

      console.log('Connected to ESP32!')
      setBluetoothDevice(device)
      setGattServer(server)

      // Wait for the ESP32 to stabilize, then fetch products
      setTimeout(() => fetchProducts(server), 1000)
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  const fetchProducts = async (server) => {
    try {
      if (!server.connected) {
        console.error('GATT Server is disconnected. Reconnecting...')
        await bluetoothDevice.gatt.connect()
      }

      const service = await server.getPrimaryService(SERVICE_UUID)
      const characteristic = await service.getCharacteristic(PRODUCT_LIST_UUID)

      const value = await characteristic.readValue()
      const decoder = new TextDecoder('utf-8')

      const productList = JSON.parse(decoder.decode(value))
      setProducts(productList)

      // Initialize priceInputs with product prices
      const initialPrices = productList.reduce((acc, product) => {
        acc[product.barcode] = product.price
        return acc
      }, {})
      setPriceInputs(initialPrices)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const updatePrice = async (name, price, barcode) => {
    try {
      const service = await gattServer.getPrimaryService(SERVICE_UUID)
      const characteristic = await service.getCharacteristic(UPDATE_PRICE_UUID)
      const encoder = new TextEncoder()
      const data = JSON.stringify({
        command: 'UPDATE_PRICE',
        name,
        price,
        barcode
      })
      await characteristic.writeValue(encoder.encode(data))

      // Update the local product state immediately
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.barcode === barcode ? { ...product, price } : product
        )
      )
    } catch (error) {
      console.error('Failed to update price:', error)
    }
  }

  const handleAddProduct = async () => {
    try {
      const { name, price, barcode } = newProduct
      const service = await gattServer.getPrimaryService(SERVICE_UUID)
      const characteristic = await service.getCharacteristic(ADD_PRODUCT_UUID)
      const encoder = new TextEncoder()
      const product = JSON.stringify({
        command: 'ADD_PRODUCT',
        name,
        price,
        barcode
      })
      await characteristic.writeValue(encoder.encode(product))

      // Add the new product to the local state immediately
      setProducts((prevProducts) => [
        ...prevProducts,
        { name, price: parseFloat(price), barcode }
      ])
      setPriceInputs((prevInputs) => ({
        ...prevInputs,
        [barcode]: parseFloat(price)
      }))

      setShowModal(false)
      setNewProduct({ name: '', price: '', barcode: '' })
    } catch (error) {
      console.error('Failed to add product:', error)
    }
  }

  const deleteProduct = async (barcode) => {
    try {
      const service = await gattServer.getPrimaryService(SERVICE_UUID)
      const characteristic = await service.getCharacteristic(
        DELETE_PRODUCT_UUID
      )
      const encoder = new TextEncoder()
      const data = JSON.stringify({
        command: 'DELETE_PRODUCT',
        barcode
      })
      await characteristic.writeValue(encoder.encode(data))

      // Remove the deleted product from the local state immediately
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.barcode !== barcode)
      )
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  return (
    <div className="container">
      <h1 className="title">Dashboard</h1>
      <button onClick={connectToESP32} className="connect-button">
        Connect to ESP32
      </button>

      <table className="product-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Barcode</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.barcode}>
              <td>{product.name}</td>
              <td>{product.barcode}</td>
              <td>
                <input
                  type="number"
                  value={priceInputs[product.barcode] || ''}
                  onChange={(e) =>
                    setPriceInputs({
                      ...priceInputs,
                      [product.barcode]: e.target.value
                    })
                  }
                  className="price-input"
                />
              </td>
              <td>
                <button
                  onClick={() =>
                    updatePrice(
                      product.name,
                      parseFloat(priceInputs[product.barcode]),
                      product.barcode
                    )
                  }
                  className="update-button"
                >
                  Update Price
                </button>
                <button
                  onClick={() => deleteProduct(product.barcode)}
                  className="update-button"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => setShowModal(true)} className="add-button">
        Add Product
      </button>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Product</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAddProduct()
              }}
            >
              <input
                name="name"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="modal-input"
                required
              />
              <input
                name="price"
                type="number"
                step="0.01"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
                className="modal-input"
                required
              />
              <input
                name="barcode"
                type="number"
                placeholder="Barcode"
                value={newProduct.barcode}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, barcode: e.target.value })
                }
                className="modal-input"
                required
              />

              {/* Button Container */}
              <div className="modal-buttons">
                <button type="submit" className="modal-add-button">
                  Add
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="modal-cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Product
