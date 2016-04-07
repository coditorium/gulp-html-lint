# gulp-html-lint

[![Travis build status](https://travis-ci.org/coditorium/gulp-html-lint.png?branch=master)](https://travis-ci.org/coditorium/gulp-html-lint)
[![dependencies](https://david-dm.org/coditorium/gulp-html-lint.png)](https://david-dm.org/coditorium/gulp-html-lint)
<!---
[![Coverage Status](https://coveralls.io/repos/coditorium/gulp-html-lint/badge.svg)](https://coveralls.io/r/coditorium/gulp-html-lint)
--->

[![NPM info](https://nodei.co/npm/read-config.png?downloads=true)](https://www.npmjs.com/package/read-config)

This is a gulp plugin for [HTMLLint](https://github.com/htmllint/htmllint/).
Its interface was created to be similar to [gulp-eslint](https://github.com/adametry/gulp-eslint).

## Intallation

```sh
npm install --save gulp-html-lint
```

## Sample usage

```js
var gulp = require('gulp'),
	htmlLint = require('gulp-html-lint');

gulp.task('html', function() {
    return gulp.src('site/**/*.html')
        .pipe(htmlLint())
        .pipe(htmlLint.format())
        .pipe(htmlLint.failOnError());
});
```

## API

### Functions

- **htmlLint([opts])** - Adds `htmlLint` property to every file in a stream that is incorrect. Handles [options](#options).
- **htmlLint.failOnError()** - Fail when an HtmlLint error is found in HtmlLint results.
- **htmlLint.failAfterError()** - Fail when the stream ends and if any HtmlLint error(s) occurred. `failOnError` failed immediately - did not wait for the stream to end.
- **htmlLint.format([formatter])** - Formats all HtmlLint issues using given formatter or a default one.
- **htmlLint.formatEach([formatter])** - Format the results of each file individually.
- **htmlLint.result(action)** - Handle each HtmlLint result as it passes through the stream.
- **htmlLint.results(action)** - Handle all HtmlLint results at the end of the stream.

### Options

- **htmllintrc** - (String, default: `".htmllintrc"`) [htmllintrc](https://github.com/htmllint/htmllint/wiki/Options) configuration file.
- **useHtmllintrc** - (Boolean, default: `true`) if `false` does not load htmllintrc configuration file.
- **rules** - (Object, default: `{}`) Additional htmllint rules.
- **plugins** - ([String], default: `[]`) List of htmllint plugins.
- **limitFiles** - (Number, default: `Number.MAX_VALUE`) Stops linter after defined number of invalid files.
- **limitIssuesPerFile** - (Number, default: `Number.MAX_VALUE`) Stops linter after defined number of linter issues in one file.
- **limitIssues** - (Number, default: `Number.MAX_VALUE`) Stops linter after defined number of linter issues.


Default **opts** values:
```js
{
    htmllintrc: ".htmllintrc",
    useHtmllintrc: true,
    rules: {},
    plugins: [],
    limitFiles: `Number.MAX_VALUE`,
    limitIssuesPerFile: `Number.MAX_VALUE`,
    limitIssues: `Number.MAX_VALUE`,
}
```

## Build process

### Gulp commands

- `gulp lint` - runs code checkstyle
- `gulp test` - runs tests
- `gulp test --file test/loader.js` - runs single test file `./test/loader.js`
- `gulp` - alias for `gulp lint test`
- `gulp test-cov` - runs instrumented tests, generates reports to `./build/test`
- `gulp test-cov --file test/loader.js` - runs single instrumented test file `./test/loader.js`
- `gulp clean` - removes `./build` folder
- `gulp ci` - alias for `gulp clean lint test-cov`

### NPM commands

- `npm test` - alias for `gulp test`
- `npm run ci` - alias for `gulp ci`

## License

[MIT](LICENSE) © Paweł Mendelski
