'use strict';

const File = require('vinyl'),
	expect = require('chai').expect,
	PassThrough = require('stream').PassThrough,
	htmllint = requireLib();

describe('gulp-html-lint results', () => {

	it('should provide an HTMLLint result', (done) => {
		const lintStream = htmllint({
			useHtmllintrc: false,
			rules: {
				'attr-quote-style': 'single'
			}
		});
		let resultCount = 0;

		lintStream
			.pipe(htmllint.results((results) => {
				expect(results).to.exist;
				expect(results).to.be.instanceof(Array).with.a.lengthOf(3);
				expect(results.errorCount).to.be.equal(6);
				resultCount++;
			}))
			.on('finish', () => {
				expect(resultCount).to.be.equal(1);
				done();
			});

		lintStream.write(new File({
			path: 'test/invalid-1.html',
			contents: new Buffer('<a href="#test"></a>')
		}));

		lintStream.write(new File({
			path: 'test/invalid-2.html',
			contents: new Buffer('<a href="#test2"></a>')
		}));

		lintStream.write(new File({
			path: 'test/invalid-3.html',
			contents: new Buffer('<a href="#test3"></a>')
		}));

		lintStream.end();
	});

	it('should catch thrown errors', (done) => {
		const file = new File({
				path: 'test/sample.html',
				contents: new Buffer('<p>test</p>')
			}), finished = () => {
				done(new Error('Unexpected Finish'));
			};
		file.htmlLint = {};

		htmllint
			.results(() => {
				throw new Error('Expected Error');
			})
			.on('error', function(error) {
				this.removeListener('finish', finished);
				expect(error).to.exist;
				expect(error.message).to.be.equal('Expected Error');
				expect(error.name).to.be.equal('Error');
				expect(error.plugin).to.be.equal('gulp-html-lint');
				done();
			})
			.on('finish', finished)
			.end(file);
	});

	it('should throw an error if not provided a function argument', () => {
		expect(htmllint.results).to.throw(/Expected callable argument/);
	});

	it('should ignore files without a htmllint result', (done) => {
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('#invalid!syntax}')
		});

		htmllint
			.results((r) => {
				throw new Error('Expected no call');
			})
			.on('error', function(err) {
				this.removeListener('finish', done);
				done(err);
			})
			.on('finish', done)
			.end(file);
	});

	it('should support an async result handler', (done) => {
		let asyncComplete = false, stream;
		const file = new File({
				path: 'test/fixtures/invalid.js',
				contents: new Buffer('#invalid!syntax}')
			}),
			ended = () => {
				expect(asyncComplete).to.be.true;
				done();
			},
			resultStub = {};
		file.htmlLint = resultStub;

		stream = htmllint.results((results, callback) => {
			expect(results).to.exist;
			expect(results).to.be.instanceof(Array).with.a.lengthOf(1);
			expect(results[0]).to.be.equal(resultStub);
			expect(typeof callback).to.be.equal('function');
			process.nextTick(() => {
				asyncComplete = true;
				callback();
			});
		})
			.on('error', function(err) {
				this.removeListener('end', ended);
				done(err);
			})
			.on('end', ended);
		// drain result into pass-through stream
		stream.pipe(new PassThrough({ objectMode: true }));
		stream.end(file);
	});

});
