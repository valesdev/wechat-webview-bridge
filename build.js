const fs = require('fs')
const rollup = require('rollup')
const buble = require('rollup-plugin-buble')
const terser = require('terser')
const pkg = require('./package.json')

const banner =
  `/*!\n` +
  ` * ${pkg.name} v${pkg.version}\n` +
  ` * @link ${pkg.homepage}\n` +
  ` */`

rollup.rollup({
  input: 'src/index.js',
  plugins: [
    buble()
  ]
})
  .then(bundle => {
    const configs = [
      { format: 'cjs', suffix: '.cjs' },
      { format: 'es', suffix: '.es' },
      { format: 'umd', suffix: '' }
    ]

    let index = 0
    const next = () => {
      return bundle.generate({
        format: configs[index].format,
        name: 'WeChatWebViewBridge'
      })
        .then(({ output: [{ code }] }) => {
          fs.writeFile(`dist/${pkg.name}${configs[index].suffix}.js`, `${banner}\n${code}`, err => { if (err) throw err })
          fs.writeFile(`dist/${pkg.name}${configs[index].suffix}.min.js`, `${banner}\n${terser.minify(code).code}`, err => { if (err) throw err })
        })
        .then(() => {
          index++
          if (index < configs.length) {
            next()
          }
        })
    }

    next()
  })
  .catch(error => {
    console.error(error)
  })
