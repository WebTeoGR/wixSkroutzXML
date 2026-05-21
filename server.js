import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'

import * as dotenv from 'dotenv'

import { getProducts, exportToXml, filterProducts } from './helpers.js'

dotenv.config()
const app = express()
app.use(express.static('./public'))
app.use(cors())
app.use(express.json())

app.get('/', function (req, res) {
  res.sendFile(path.resolve('./public/index.html'))
})

app.post('/makexml', async function (req, res) {
  if (req.body.code !== process.env.CODE) return res.status(401).json({ message: 'Λάθος Κωδικός!' })
  const allProducts = await getProducts()
  if (allProducts === undefined || allProducts.length <= 0) return res.status(500).json({ message: 'Κάτι πήγε στραβά με το Wix API.' })
  const products = filterProducts(allProducts)
  if (products.length <= 0) return res.status(500).json({ message: 'Δεν βρέθηκαν προϊόντα!' })
  const xmlProducts = exportToXml(products)
  if (xmlProducts === undefined) return res.status(500).json({ message: 'Κάτι πήγε στραβά με το Xml.' })
  fs.writeFile('./public/skroutz_feed.xml', xmlProducts, (err) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ message: 'Κάτι πήγε στραβά με το ανέβασμα του αρχείου.' })
    }
  })
  return res.status(200).json({ message: 'To Xml δημιουργήθηκε επιτυχώς!' })
})

app.listen(5000, console.log(`Server is running on port 5000`))
