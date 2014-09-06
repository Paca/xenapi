var should = require('should');
var xenapi = require('../lib/main');

describe('xenapi', function() {
    describe('with no arguments', function() {
        it('returns an empty array', function() {
            var result = xenapi();
            result.should.eql([]);
        });
    });
});
