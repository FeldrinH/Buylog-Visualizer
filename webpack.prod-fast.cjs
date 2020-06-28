const prod = require('./webpack.prod.cjs')

prod.module.rules[0].use = [
   {
      loader: 'ts-loader',
      options: {
         transpileOnly: true
      }
   }
];
module.exports = prod;