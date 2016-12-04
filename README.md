# Wallaby Meteor config

## Install

1. In the root of the project: `yarn add @mindhive/wallaby-meteor-config`
2. Create `wallaby.js` in the root of the project something like:
````js
module.exports = require('@mindhive/wallaby-meteor-config')({
  meteorPort: 3000,
  mongoUrl: 'mongodb://127.0.0.1:27017/project-wallaby',
})
````
3. Setup a IDEA Wallaby run configuration using `wallaby.js`

## Babel

This Wallaby setup uses the projects `.babelrc` file (if it exists)
and adds in the necessary plugins to mimic Meteor's Babel setup.
The dependencies required to do this are automatically brought
in by this package.
