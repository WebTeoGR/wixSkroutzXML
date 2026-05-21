import axios from 'axios'
import xml2js from 'xml2js'
import fs from 'fs/promises'

export async function getProducts() {
  const limit = 100
  let offset = 0
  let allProducts = []
  const headers = {
    Authorization: process.env.API_KEY,
    'wix-site-id': process.env.STITE_ID,
  }

  try {
    while (true) {
      const response = await axios.post(
        'https://www.wixapis.com/stores/v1/products/query',
        {
          includeVariants: true,
          query: {
            paging: {
              limit,
              offset,
            },
          },
        },
        { headers }
      )
      if (response.status === 200 && response.data['products'].length > 0) {
        allProducts = [...allProducts, ...response.data.products]
        offset = offset + limit
      }
      if (response.data['products'].length < 100) break
    }
    return allProducts
  } catch (error) {
    console.error(error)
  }
}

export function exportToXml(json) {
  const t = new Date()
  const date = ('0' + t.getDate()).slice(-2)
  const month = ('0' + (t.getMonth() + 1)).slice(-2)
  const year = t.getFullYear()
  const hours = ('0' + t.getHours()).slice(-2)
  const minutes = ('0' + t.getMinutes()).slice(-2)
  const time = `${year}-${month}-${date} ${hours}:${minutes}`
  const products = {
    created_at: time,
    product: json,
  }

  const builder = new xml2js.Builder({ rootName: 'onikshop', cdata: true })
  const xml = builder.buildObject(products)
  return xml
}

export async function readJSONFile(filePath) {
  try {
    // Read the JSON file
    const data = await fs.readFile(filePath, 'utf8')

    // Parse the JSON data into a JavaScript object
    const jsonObject = JSON.parse(data)

    // Do something with the JavaScript object
    return jsonObject
  } catch (error) {
    console.error('Error:', error)
  }
}

function convertHtmlEntities(str) {
  str = str.replace(/&nbsp;/g, ' ')
  str = str.replace(/&amp;/g, '&')
  str = str.replace(/&gt;/g, '>')
  str = str.replace(/&lt;/g, '<')
  str = str.replace(/\n/g, '')
  str = str.replace(/\n/g, '')
  // str = str.replace(/<br>/g, '')
  str = str.replace(/<p>/g, '')
  str = str.replace(/<\/p>/g, '')
  return str
}

function extractNumbers(str) {
  return str.replace(/\D/g, '')
}

export function filterProducts(products) {
  const productsLength = products.length

  let productsJson = []
  for (let i = 0; i < productsLength; i++) {
    let tempProduct = {}
    let productVariations = []
    let id = products[i].id
    let name = products[i].name
    let description = products[i].description
    let price = 0
    let quantity = products[i].stock.quantity
    let featureimage = products[i].media.mainMedia.image.url
    let additionalImage = []
    let color = ''
    let sizes = []
    let category = ''
    let brand = ''
    let weight = ''
    let mpn = ''
    if (products[i].price.discountedPrice > 0) {
      price = products[i].price.discountedPrice
    } else {
      price = products[i].price.price
    }
    let link = 'https://www.onikshop.gr' + products[i].productPageUrl.path
    products[i].media.items.forEach((item) => {
      additionalImage.push(item.image.url.trim())
    })
    products[i].productOptions.forEach((option) => {
      if (option.name === 'Χρώμα') {
        color = option.choices[0].description
      }
    })
    products[i].additionalInfoSections.forEach((info) => {
      if (info.title === 'Κατηγορία') {
        category = info.description
      }
      if (info.title === 'Μάρκα') {
        brand = info.description
      }
      if (info.title === 'Βάρος') {
        weight = info.description
      }
    })
    products[i].variants.forEach((v) => {
      if (v.stock.quantity > 0) {
        let tVariant = {}
        tVariant.variationid = v.id
        tVariant.availability = 'Παράδοση σε 1-3 ημέρες'
        sizes.push(v.choices['Μέγεθος'])
        tVariant.size = v.choices['Μέγεθος']
        tVariant.quantity = v.stock.quantity
        if (v.variant.priceData.discountedPrice > 0) {
          tVariant.price = v.variant.priceData.discountedPrice
        } else {
          tVariant.price = v.variant.priceData.price
        }
        tVariant.link = link.trim()
        tVariant.mpn = v.variant.sku.trim()
        productVariations.push(tVariant)
      }
    })
    if (productVariations.length <= 0) continue
    mpn = productVariations[0].mpn

    if (id === undefined || id.length <= 0) continue
    if (name === undefined || name.length <= 0) continue
    if (category === undefined || category.length <= 0) continue
    if (mpn === undefined || mpn.length <= 0) continue
    if (link === undefined || link.length <= 0) continue
    if (description === undefined || description.length <= 0) continue
    if (featureimage === undefined || featureimage.length <= 0) continue
    if (additionalImage === undefined || additionalImage.length <= 0) continue
    if (color === undefined || color.length <= 0) continue
    if (sizes === undefined || sizes.length <= 0) continue
    if (brand === undefined || brand.length <= 0) continue
    if (weight === undefined || weight.length <= 0) continue
    if (price === undefined || price <= 0) continue
    if (quantity === undefined || quantity <= 0) continue

    let variantValid = true

    productVariations.forEach((pv) => {
      if (pv.variationid === undefined || pv.variationid.length <= 0 || pv.size === undefined || pv.size.length <= 0 || pv.price === undefined || pv.price <= 0 || pv.link === undefined || pv.link.length <= 0 || pv.mpn === undefined || pv.mpn.length <= 0 || pv.quantity === undefined || pv.quantity <= 0) {
        variantValid = false
      }
    })

    if (variantValid === false) continue

    // tempProduct.id = id.trim()
    // tempProduct.name = name.trim() + ' ' + mpn.trim()
    // tempProduct.category = convertHtmlEntities(category)
    // tempProduct.mpn = mpn.trim()
    // tempProduct.link = link.trim()
    // tempProduct.description = convertHtmlEntities(description).trim()
    // tempProduct.featureimage = featureimage.trim()
    // tempProduct.additionalImage = additionalImage
    // tempProduct.color = convertHtmlEntities(color).trim()
    // tempProduct.sizes = sizes.join(', ')
    // tempProduct.brand = convertHtmlEntities(brand).trim()
    // tempProduct.weight = extractNumbers(convertHtmlEntities(weight)).trim()
    // tempProduct.price = price
    // tempProduct.availability = 'Παράδοση σε 1-3 ημέρες'
    // tempProduct.quantity = quantity

    // productVariations.forEach((variation) => {
    //   tempProduct.variations.push(variation)
    // })

    // tempProduct.variations = productVariations.map((variation) => ({ variation: variation }))

    const product = {
      id: id.trim(),
      name: name.trim() + ' ' + mpn.trim(),
      category: convertHtmlEntities(category),
      mpn: mpn.trim(),
      link: link.trim(),
      description: convertHtmlEntities(description).trim(),
      imageurl: featureimage.trim(),
      additional_imageurl: additionalImage,
      color: convertHtmlEntities(color).trim(),
      sizes: sizes.join(', '),
      brand: convertHtmlEntities(brand).trim(),
      weight: extractNumbers(convertHtmlEntities(weight)).trim(),
      price: price,
      availability: 'Παράδοση σε 1-3 ημέρες',
      quantity: quantity,
      // variations: {
      //   variation: productVariations.map((variation) => variation),
      // },
    }

    if (productVariations.length > 0) {
      product.variations = { variation: productVariations.map((variation) => variation) }
    }
    productsJson.push(product)
  }

  return productsJson
}
