'use strict';

const File = require('vinyl'),
	expect = require('chai').expect,
	htmllint = requireLib();

describe('gulp-html-lint failOnError', () => {

	it('should fail a file immediately if an error is found', (done) => {
		const lintStream = htmllint({
				rules: {
					'doctype-first': true,
					'line-end-style': false
				}
			}),
			endWithoutError = () => {
				done(new Error('An error was not thrown before ending'));
			},
			file = new File({
				path: 'test/invalid.html',
				contents: new Buffer('<p>invalid</p>')
			});

		lintStream
			.pipe(htmllint.failOnError())
			.on('error', function(err) {
				this.removeListener('finish', endWithoutError);
				expect(err).to.exist;
				expect(err.message).to.be.equal('<!DOCTYPE> should be the first element seen');
				expect(err.fileName).to.be.equal(file.path);
				expect(err.plugin).to.be.equal('gulp-html-lint');
				done();
			})
			.on('finish', endWithoutError);

		lintStream.write(file);
		lintStream.end();
	});

	it('should handle HTMLLint reports without messages', (done) => {
		const lintStream = htmllint({
				rules: {
					'doctype-first': true,
					'line-end-style': false
				}
			}),
			file = new File({
				path: 'test/valid.html',
				contents: new Buffer('<!DOCTYPE>\n<p>valid</p>')
			});

		lintStream
			.pipe(htmllint.failOnError())
			.on('error', function(err) {
				this.removeListener('finish', done);
				done(err);
			})
			.on('finish', done)
			.end(file);
	});

});
