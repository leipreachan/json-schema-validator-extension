// browserify browserify-export.js --standalone schemasafe -o exodus-schemasafe-parser.js

const { parser } = require('@exodus/schemasafe');

module.exports = parser;