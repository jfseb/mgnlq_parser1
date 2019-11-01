/**
 * @file inputFilter
 * @copyright (c) 2016-2016 Gerd Forstmann
 */


/* eslint-disable */

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../js_cov' : '../../js';

var debuglog = require('debug')('erindex.nunit');

const ErIndex = require(root + '/match/erindex.js');

const utils = require('abot_utils');

const InputFilter = require(root + '/match/inputFilter.js');

const Model = require('mgnlq_model').Model;

//var theModel = Model.loadModels();
//var words = {};

function setMockDebug() {
  var obj = function(s) {
    //console.log(s);
  };
  obj.enabled = true;
  ErIndex.mockDebug(obj);
}
if(!debuglog.enabled) {
  setMockDebug();
}

/*

exports.testAugmentRuleFact = function(test) {

var rule =  {
      "category": "element symbol",
      "matchedString": "In",
      "type": 0,
      "word": "In",
      "bitindex": 32,
      "_ranking": 0.95,
      "exactOnly": true,
      "lowercaseword": "in"
    };
    var res = ErIndex.augmentRule(rule);
    test.deepEqual(res, {
      "category": "element symbol",
      "matchedString": "In",
      "wordtype" : "F",
      "bitmatch" : 32,
      "type": 0,
      "word": "In",
      "bitindex": 32,
      "_ranking": 0.95,
      "exactOnly": true,
      "lowercaseword": "in"
    });
    test.done();
}


exports.testAugmentRuleFiller = function(test) {

var rule = {
      "category": "filler",
      "type": 1,
      "regexp": {},
      "matchedString": "filler",
      "bitindex": 4096,
      "_ranking": 0.9
    };
    var res = ErIndex.augmentRule(rule);
    test.deepEqual(res, {
      "category": "filler",
      "type": 1,
      "regexp": {},
      "matchedString": "filler",
      "bitindex": 4096,
      "_ranking": 0.9,
      "wordtype" : "I",
      "bitmatch" : 0x7FF
    });
    test.done();
}


exports.testCAtWord = function(test) {




  var res = InputFilter.categorizeAWordWithOffsets("in", theModel.rules, "a b in ", {});
  console.log(JSON.stringify(res, undefined,2));

    var res = InputFilter.categorizeAWordWithOffsets("earth", theModel.rules, "a b in ", {});
  console.log(JSON.stringify(res, undefined,2));
  /*
  console.log(JSON.stringify((theModel.rules.wordMap["earth"]), undefined, 2));
console.log(JSON.stringify((theModel.rules.wordMap["orbits"]), undefined, 2));
 console.log(JSON.stringify((theModel.rules.wordMap["domain"]), undefined, 2));
    console.log(JSON.stringify((theModel.rules.wordMap["and"]), undefined, 2));
    console.log(JSON.stringify((theModel.rules.wordMap["in"]), undefined, 2));
      console.log(JSON.stringify((theModel.rules.wordMap["where"]), undefined, 2));

          console.log(JSON.stringify((theModel.rules.wordMap["contains"]), undefined, 2));
 * /
   var augmentedRules = ErIndex.augmentRules(theModel.rules);
  test.deepEqual(augmentedRules !== null, {}, "so what");

  test.done();
}
*/
/*
exports.testAugmentRules = function(test) {

  console.log(JSON.stringify((theModel.rules.wordMap["earth"]), undefined, 2));
console.log(JSON.stringify((theModel.rules.wordMap["orbits"]), undefined, 2));
 console.log(JSON.stringify((theModel.rules.wordMap["domain"]), undefined, 2));
    console.log(JSON.stringify((theModel.rules.wordMap["and"]), undefined, 2));
    console.log(JSON.stringify((theModel.rules.wordMap["in"]), undefined, 2));
      console.log(JSON.stringify((theModel.rules.wordMap["where"]), undefined, 2));

          console.log(JSON.stringify((theModel.rules.wordMap["contains"]), undefined, 2));
   var augmentedRules = ErIndex.augmentRules(theModel.rules);
  test.deepEqual(augmentedRules !== null, {}, "so what");

  test.done();
}
*/
