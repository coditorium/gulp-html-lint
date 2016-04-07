'use strict';

const File = require('vinyl'),
	expect = require('chai').expect,
	htmllint = requireLib(),
	filesWithoutDoctype = () => [
		new File({
			path: 'test/no-doctype-1.html',
			contents: new Buffer('<p>no-doctype-1</p>')
		}),
		new File({
			path: 'test/no-doctype-2.html',
			contents: new Buffer('<p>no-doctype-2</p>')
		}),
		new File({
			path: 'test/no-doctype-3.html',
			contents: new Buffer('<p>no-doctype-3</p>')
		})
	];

describe('gulp-html-lint format', () => {
	let formatCount, writeCount;

	beforeEach(() => {
		formatCount = 0;
		writeCount = 0;
	});

	function outputWriter(message) {
		expect(message).to.exist;
		expect(message).to.match(/^\d+ messages$/);
		writeCount++;
	}

	function formatResults(results) {
		expect(results).to.exist;
		expect(results).to.be.instanceof(Array).with.a.lengthOf(3);
		const messageCount = results.reduce((sum, result) => {
			return sum + result.issues.length;
		}, 0);
		formatCount++;
		return `${messageCount} messages`;
	}

	it('should format all HTMLLint results at once', (done) => {
		const lintStream = htmllint({
				rules: {
					'doctype-first': true,
					'line-end-style': false
				}
			}),
			formatStream = htmllint.format(formatResults, outputWriter)
				.on('error', done)
				.on('finish', () => {
					expect(formatCount).to.be.equal(1);
					expect(writeCount).to.be.equal(1);
					done();
				});

		lintStream
			.on('error', done)
			.pipe(formatStream);

		filesWithoutDoctype()
			.forEach((file) => lintStream.write(file));
		lintStream.end();
	});

	it('should not attempt to format when no linting results are found', (done) => {
		const lintStream = htmllint({
				rules: {
					'line-end-style': false
				}
			}),
			formatStream = htmllint.format(formatResults, outputWriter)
				.on('error', done)
				.on('finish', () => {
					expect(formatCount).to.be.equal(0);
					expect(writeCount).to.be.equal(0);
					done();
				});

		lintStream
			.on('error', done)
			.pipe(formatStream);

		filesWithoutDoctype()
			.forEach((file) => lintStream.write(file));
		lintStream.end();
	});

});
