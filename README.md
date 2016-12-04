# Wallaby Meteor config

## Install

1. In the root of the project: `yarn add @mindhive/wallaby-meteor-config`
2. Create `wallaby.js` in the root of the project something like the example below
3. Setup a IDEA Wallaby run configuration using `wallaby.js`

## Example wallaby.js

````js
module.exports = require('@mindhive/wallaby-meteor-config')({
  meteorPort: 3000,
  mongoUrl: 'mongodb://127.0.0.1:27017/project-wallaby',
})
````

Additional opens can be seen at the top of [index.js](https://github.com/mindhivenz/wallaby-meteor-config/blob/master/index.js).

## Required project layout

- `src`
  - `.specs`
  - `imports`
  - `.meteor` (if you have multiple Meteor projects using this one source, 
  		symlink the most important one to here)
  - `.babelrc`

Test files match `*.spec.js/jsx` and can be under `.specs` or `imports`.

## Babel

This Wallaby setup uses the projects `.babelrc` file (if it exists)
and adds in the necessary plugins to mimic Meteor's Babel setup.
The dependencies required to do this are automatically brought
in by this package.
