'use strict';

const chalk = require('chalk'),
	table = require('text-table');

/**
 * Given a word and a count, append an s if count is not one.
 * @param {string} word A word in its singular form.
 * @param {int} count A number controlling whether word should be pluralized.
 * @returns {string} The original word with an s on the end if count is not one.
 */
function pluralize(word, count) {
	return (count === 1 ? word : `${word}s`);
}

module.exports = function(results) {
	let output = '\n',
		total = 0,
		errors = 0,
		warnings = 0,
		summaryColor = 'yellow';

	results.forEach((result) => {
		/* eslint prefer-template: 0 */
		const issues = result.issues;

		if (issues.length === 0) {
			return;
		}

		total += issues.length;
		output += chalk.underline(result.relativeFilePath) + '\n';
		output += table(
			issues.map((issue) => {
				let messageType;
				if (issue.error) {
					messageType = chalk.red('error');
					summaryColor = 'red';
					errors++;
				} else {
					messageType = chalk.yellow('warning');
					warnings++;
				}

				return [
					'',
					issue.line || 0,
					issue.column || 0,
					messageType,
					issue.message.replace(/\.$/, ''),
					chalk.dim(issue.rule || '')
				];
			}),
			{
				align: ['', 'r', 'l'],
				stringLength: (str) => {
					return chalk.stripColor(str).length;
				}
			}
		).split('\n').map((el) => {
			return el.replace(/(\d+)\s+(\d+)/, (m, p1, p2) => {
				return chalk.dim(`${p1}:${p2}`);
			});
		}).join('\n') + '\n\n';
	});

	if (total > 0) {
		output += chalk[summaryColor].bold([
			'\u2716 ', total, pluralize(' problem', total),
			' (', errors, pluralize(' error', errors), ', ',
			warnings, pluralize(' warning', warnings), ')\n'
		].join(''));
	}

	return total > 0 ? output : '';
};
