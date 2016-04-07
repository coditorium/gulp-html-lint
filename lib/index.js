'use strict';

const fs = require('fs'),
	path = require('path'),
	gutil = require('gulp-util'),
	PluginError = gutil.PluginError,
	htmllint = require('htmllint'),
	transform = require('through2').obj,
	PLUGIN_NAME = 'gulp-html-lint';

/**
 * Append HtmlLint result to each file in gulp stream.
 *
 * @param {(Object|String)} [options] - Configure rules, plugins and other options for running HtmlLint
 * @returns {stream} gulp file stream
 */
function gulpHtmlLint(options) {
	let htmlLintOptions = {},
		issueFileCount = 0,
		issueCount = 0;

	options = options || {};
	options.htmllintrc = options.htmllintrc || '.htmllintrc';
	options.useHtmllintrc = options.useHtmllintrc !== false;
	options.plugins = options.plugins || [];
	options.limitFiles = options.limitFiles || (options.bail ? 1 : Number.MAX_VALUE);
	options.limitIssuesPerFile = options.limitIssuesPerFile || Number.MAX_VALUE;
	options.limitIssues = options.limitIssues || Number.MAX_VALUE;

	// load htmllint rules
	if (options.useHtmllintrc && fs.existsSync(options.htmllintrc)) {
		htmlLintOptions = JSON.parse(fs.readFileSync(options.htmllintrc, 'utf8'));
	}
	if (options.rules && typeof options.rules === 'object') {
		Object.keys(options.rules).forEach((prop) => {
			htmlLintOptions[prop] = options.rules[prop];
		});
	}

	// use plugins
	htmllint.use(options.plugins);

	return transform((file, enc, cb) => {
		if (file.isNull()) return cb(null, file);
		if (file.isStream()) return cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
		if (issueFileCount >= options.limitFiles ||
			issueCount >= options.limitIssues) return cb(null, file);
		const relativeFilePath = path.relative(process.cwd(), file.path);
		htmllint(file.contents.toString(), htmlLintOptions)
			.then((issues) => {
				if (issues && issues.length) {
					let errorCount = 0,
						warningCount = 0;
					issueFileCount++;
					issueCount += issues.length;
					issues.forEach((issue) => {
						if (issue.code.indexOf('E') === 0) {
							issue.error = true;
							errorCount++;
						} else {
							issue.error = false;
							warningCount++;
						}
						issue.warning = !issue.error;
						issue.message = issue.message || htmllint.messages.renderIssue(issue);
					});
					file.htmlLint = {
						filePath: file.path,
						issues: issues.splice(0, Math.min(issues.length, options.limitIssuesPerFile)),
						relativeFilePath,
						errorCount,
						warningCount
					};
				}
				cb(null, file);
			}, () => {
				return cb(new gutil.PluginError(PLUGIN_NAME, `Could not lint html file: ${relativeFilePath}`));
			});
	});
}

/**
 * Handle each HtmlLint result as it passes through the stream.
 *
 * @param {Function} action - A function to handle each HtmlLint result
 * @returns {stream} gulp file stream
 */
gulpHtmlLint.result = function(action) {
	if (typeof action !== 'function') throw new Error('Expected callable argument');
	let transformErr;
	return transform((file, enc, callback) => {
		if (!file.htmlLint) return callback(null, file);
		tryResultAction(action, file.htmlLint, (err) => {
			if (err) transformErr = wrapError(err);
			if (transformErr) return callback();
			return callback(null, file);
		});
	}, (callback) => {
		if (transformErr) return callback(transformErr);
		return callback();
	});
};

/**
 * Handle all HtmlLint results at the end of the stream.
 *
 * @param {Function} action - A function to handle all HtmlLint results
 * @returns {stream} gulp file stream
 */
gulpHtmlLint.results = function(action) {
	if (typeof action !== 'function') throw new Error('Expected callable argument');
	const results = [];
	results.errorCount = 0;
	results.warningCount = 0;

	return transform((file, enc, callback) => {
		if (!file.htmlLint) return callback(null, file);
		results.push(file.htmlLint);
		results.warningCount += file.htmlLint.warningCount;
		results.errorCount += file.htmlLint.errorCount;
		callback(null, file);
	}, (callback) => {
		if (!results.length) return callback();
		tryResultAction(action, results, (err) => {
			return callback(wrapError(err));
		});
	});
};

/**
 * Fail when an HtmlLint error is found in HtmlLint results.
 *
 * @returns {stream} gulp file stream
 */
gulpHtmlLint.failOnError = function() {
	return gulpHtmlLint.result((htmlLint) => {
		if (!htmlLint) return;
		const firstIssue = htmlLint.issues[0];
		throw new gutil.PluginError(PLUGIN_NAME, {
			name: 'HtmlLintError',
			fileName: htmlLint.filePath,
			message: firstIssue.message,
			lineNumber: firstIssue.line,
			columnNumber: firstIssue.column
		});
	});
};

/**
 * Fail when the stream ends and if any HtmlLint error(s) occurred
 *
 * @returns {stream} gulp file stream
 */
gulpHtmlLint.failAfterError = function() {
	return gulpHtmlLint.results((results) => {
		const count = results.errorCount;
		if (count > 0) {
			throw new PluginError(PLUGIN_NAME, {
				name: 'HtmlLintError',
				message: `Failed with ${count} error${count > 1 ? 's' : ''}`
			});
		}
	});
};

/**
 * Format the results of each file individually.
 *
 * @param {(String|Function)} [formatter=stylish] - The name or function for a HtmlLint result formatter
 * @param {(Function)} [writer=gutil.log] - Output writer
 * @returns {stream} gulp file stream
 */
gulpHtmlLint.formatEach = function(formatter, writer) {
	formatter = resolveFormatter(formatter);
	writer = writer || gutil.log;
	return gulpHtmlLint.result((result) => {
		writer(formatter([result]));
	});
};

/**
 * Wait until all files have been linted and format all results at once.
 *
 * @param {(String|Function)} [formatter=stylish] - The name or function for a HtmlLint result formatter
 * @param {(Function)} [writer=gutil.log] - Output writer
 * @returns {stream} gulp file stream
 */
gulpHtmlLint.format = function(formatter, writer) {
	formatter = resolveFormatter(formatter);
	writer = writer || gutil.log;
	return gulpHtmlLint.results((results) => {
		// Only format results if files has been lint'd
		if (results.length) {
			writer(formatter(results));
		}
	});
};

module.exports = gulpHtmlLint;

/**
 * Call sync or async action and handle any thrown or async error
 *
 * @param {Function} action - Result action to call
 * @param {(Object|Array)} result - An HtmlLint result or result list
 * @param {Function} callback - An callback for when the action is complete
 * @returns {undefined}
 */
function tryResultAction(action, result, callback) {
	if (action.length > 1) return action.call(this, result, callback);
	try {
		action.call(this, result);
	} catch (err) {
		return callback(err || new Error('Unknown Error'));
	}
	return callback();
}

/**
 * Ensure that error is wrapped in a gulp PluginError
 *
 * @param {Object} err - An error to be wrapped
 * @returns {Object} A wrapped error
 */
function wrapError(err) {
	if (err && !(err instanceof gutil.PluginError)) {
		err = new PluginError(err.plugin || PLUGIN_NAME, err, {
			showStack: (err.showStack !== false)
		});
	}
	return err;
}

/**
 * Resolves formatter.
 *
 * @param {string|function} formatter - formatter
 * @returns {function} formatter function
 */
function resolveFormatter(formatter) {
	if (!formatter) return resolveFormatter('stylish');
	if (typeof formatter === 'function') return formatter;
	if (typeof formatter === 'string') {
		if (isModuleAvailable(formatter)) return require(formatter);
		if (isModuleAvailable(`./formatters/${formatter}`)) return require(`./formatters/${formatter}`);
		throw wrapError(new Error(`Could not resolve formatter: ${formatter}`));
	}
}

/**
 * Check if module is available
 *
 * @param {string} modulePath - Module name or path
 * @returns {boolean} true if module is avilable
 */
function isModuleAvailable(modulePath) {
	try {
		require.resolve(modulePath);
		return true;
	} catch (e) {
		return false;
	}
}
