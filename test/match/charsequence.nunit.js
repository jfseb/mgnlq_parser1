/**
 * @file
 * @module charsequence.nunit.js
 * @copyright (c) 2016 Gerd Forstmann
 */

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../js_cov' : '../../js';

// var debuglog = require('debug')('charsequence.nunit');

const charsequence = require(root + '/match/charsequence.js').CharSequence;

exports.testIsSameOrSimilar = function (test) {
  test.equal( false, charsequence.isSameOrPluralOrVeryClose( 'abcdef', 'hijkl'));
  test.equal( false, charsequence.isSameOrPluralOrVeryClose( '', 'hijkl'));
  test.equal( true, charsequence.isSameOrPluralOrVeryClose( 'abcde', 'abcdef'));
  test.equal( true, charsequence.isSameOrPluralOrVeryClose( 'abcs', 'abc'));
  test.equal( true, charsequence.isSameOrPluralOrVeryClose( 'abcs', 'ABC'));
  test.equal( false, charsequence.isSameOrPluralOrVeryClose( 'abd', 'ABC'));
  test.equal( false, charsequence.isSameOrPluralOrVeryClose( 'abs', 'AB'));
  test.equal( false, charsequence.isSameOrPluralOrVeryClose( 'element names', 'element numbers'));
  test.equal( true, charsequence.isSameOrPluralOrVeryClose( 'element names', 'element name'));
  test.equal( true, charsequence.isSameOrPluralOrVeryClose( 'element name', 'element nme'));
  test.equal( false, charsequence.isSameOrPluralOrVeryClose( 'element Numbers', 'element nme'));
  test.equal( false, charsequence.isSameOrPluralOrVeryClose( 'element names', 'element nme'));
  test.equal( true, charsequence.isSameOrPluralOrVeryClose( 'application', 'applications'));
  test.done();
};
