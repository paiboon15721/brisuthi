const fs = require('fs').promises
const path = require('path')
const { promisify } = require('util')
const lunrjs = require('lunr')
const frontMatterParser = require('parser-front-matter')

const parse = promisify(frontMatterParser.parse.bind(frontMatterParser))

async function loadProductsWithFrontMatter(productsDirectoryPath) {
  const productNames = await fs.readdir(productsDirectoryPath)
  const products = await Promise.all(
    productNames
      .filter(v => v !== '_index.md')
      .map(async productName => {
        const fileContent = await fs.readFile(
          path.join(productsDirectoryPath, productName, 'index.md'),
          'utf8',
        )
        const { data, content } = await parse(fileContent)
        return { ...data, content }
      }),
  )
  return products
}

function makeIndex(products) {
  return lunrjs(function() {
    this.ref('title')
    this.field('title', { boost: 3 })
    this.field('content')
    this.field('direction')
    this.field('ingredients', { boost: 2 })
    this.field('price')
    this.field('categories', { boost: 3 })
    this.field('tags', { boost: 3 })
    products.forEach(p => {
      this.add({
        ...p,
        ingredients: p.ingredients.join(' '),
        categories: p.categories.join(' '),
        tags: p.tags.join(' '),
      })
    })
  })
}

async function run() {
  const products = await loadProductsWithFrontMatter(
    path.join(__dirname, 'content', 'product'),
  )
  const index = makeIndex(products)
  console.log(JSON.stringify(index))
}

run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error.stack)
    process.exit(1)
  })
