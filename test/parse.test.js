
var irc = require('../connect');
var parse = irc.parse;
var should = require('should');

describe("Parse server responses", function(){

	it("should allow params to be optional", function(){
		parse(':host CMD').params.length.should.be.empty;
	});
	it("last param can start with a colon", function(){
		parse(':host CMD a :b').params.should.eql(['a','b']);
	});
	it("last param can start with a colon and be empty", function(){
		parse(':host CMD a :').params.should.eql(['a','']);
	});
	it("should allow empty params", function(){
		parse(':host CMD a b  d').params.should.eql(['a','b','','d']);
		parse(':host CMD ').params.should.eql(['']);
		parse(':host CMD  ').params.should.eql(['','']);
	});
	it("should allow colons within params", function(){
		parse(':host CMD a:b').params.should.eql(['a:b']);
	});
	it("should allow spaces in the last param", function(){
		parse(':host CMD a:b :mrbot: Hello!').params.should.eql(['a:b', 'mrbot: Hello!']);
	});
	it("should allow spaces in the 15th param without a leading colon", function(){
		var expected = '1 2 3 4 5 6 7 8 9 0 1 2 3 4'.split(' ');
		expected.push('mrbot: Hello!');
		parse(':host CMD 1 2 3 4 5 6 7 8 9 0 1 2 3 4 mrbot: Hello!').params.should.eql(expected);
	});

});
