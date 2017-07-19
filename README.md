# Wallaby Meteor config

## Install

1. In the root of the project: `yarn add --dev @mindhive/wallaby-meteor-config`
2. Create `wallaby.js` in the root of the project something like the example below
3. Setup a IDEA Wallaby run configuration using `wallaby.js`

## Example wallaby.js

````js
module.exports = require('@mindhive/wallaby-meteor-config')({
  meteorPort: 3000,
  mongoUrl: 'mongodb://127.0.0.1:27017/project-wallaby',
})
````

Additional options can be seen at the top of [index.js](https://github.com/mindhivenz/wallaby-meteor-config/blob/master/index.js).

## Required project layout

- `src`
  - `.specs` (make sue `!.specs` is in your `.eslintignore`)
  - `imports`
  - `.meteor` (if you have multiple Meteor projects using this one source dir, 
  		symlink one to this to load Meteor packages from)
  - `.babelrc`

Test files match `*.spec.js/jsx` and can be under `.specs` or `imports`.

## Babel

If the project root has a `.babelrc` file then this is used. Otherwise:

This Wallaby setup uses Meteor's standard Babel setup supplemented with 
your app's `.babelrc` file (if it exists in `src`). This replicates 
Meteor's standard behaviour. 
