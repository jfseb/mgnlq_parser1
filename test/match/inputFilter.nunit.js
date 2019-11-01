/**
 * @file inputFilter
 * @copyright (c) 2016-2016 Gerd Forstmann
 */


/* eslint-disable */

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../js_cov' : '../../js';

var debuglog = require('debug')('inputFilter.nunit');

const inputFilter = require(root + '/match/inputFilter.js');
const InputFilter = inputFilter;

const utils = require('abot_utils');
const Algol = require(root + '/match/algol.js');

const Model = require('mgnlq_model').Model;
const IMatch = require('mgnlq_model').IFModel;
const MongoUtils = require('mgnlq_model').MongoUtils;


function setMockDebug() {
  var obj = function(s) {
    //console.log(s);
  };
  obj.enabled = true;
  inputFilter.mockDebug(obj);
}
if(!debuglog.enabled) {
  setMockDebug();
}

var getModel = require('mgnlq_testmodel_replay').getTestModel;

function getRules() {
  return getModel().then(
    (model) => {
      return Promise.resolve([model.rules, model]);
    }
  )
}

function releaseModel(theModel) {
  Model.releaseModel(theModel);
}

const ab = inputFilter;

exports.testcountAinB = function (test) {
  var fut = inputFilter.countAinB;
  test.equal(fut({ abc: 'def', hij: 1 }, { hijs: 4 }), 0, 'ok');
  test.done();
};

exports.testcountAinBOne = function (test) {
  //  console.log(JSON.stringify(inputFilter, undefined, 2) + "yyyyyyyyyyyyyyyy")
  var fut = inputFilter.countAinB;
  test.equal(fut({ abc: 'def', hij: 1 }, { hij: 2 }), 1, 'ok');
  test.done();
};

exports.testcountAinBCompareEQ = function (test) {
  var fut = inputFilter.countAinB;
  test.equal(fut({ abc: 'def', hij: 1 }, { hij: 1 }, function (s1, s2) { return s1 && (s1 === s2); }), 1, 'ok');
  test.done();
};

exports.testcountAinBCompareFN = function (test) {
  var fut = inputFilter.countAinB;
  test.equal(fut({ abc: 'def', hij: 1, klm: 'U' }, { hij: 1, klm: 'U' },
    function (s1, s2) { return s1 && s1 === s2; }), 2, 'ok');
  test.done();
};

exports.testcountAinBCompareMult1 = function (test) {
  var fut = inputFilter.countAinB;
  test.equal(fut({ abc: 'def', hij: 1, klm: undefined }, { hij: 1, klm: 'U' },
    function (s1, s2) { return s1 && s1 === s2; }), 1, 'ok');
  test.done();
};

exports.testcountAinBCompareMult = function (test) {
  var fut = inputFilter.countAinB;
  test.equal(fut({ abc: 'def', hij: 1, klm: 0 }, { hij: 1, klm: 0 },
    function (s1, s2) { return s1 !== undefined && s1 === s2; }), 2, 'ok');
  test.done();
};

exports.testcountAinBCompareIgnore = function (test) {
  var fut = inputFilter.countAinB;
  test.equal(fut({ abc: 'def', hij: 1, klm: 0 }, { hij: 1, klm: 0 },
    function (s1, s2) { return s1 !== undefined && s1 === s2; }, 'klm'), 1, 'ok');
  test.done();
};

exports.testcountAinBCompareIgnore2 = function (test) {
  var fut = inputFilter.countAinB;
  test.equal(fut({ abc: 'def', hij: 1, klm: 0 }, { hij: 1, klm: 0 },
    function (s1, s2) { return (s1 !== undefined) && (s1 === s2); }, ['klm', 'hij']), 0, 'ok');
  test.done();
};

exports.testspuriouAnotInB = function (test) {
  var fut = inputFilter.spuriousAnotInB;
  test.deepEqual(fut({ abc: 'def', hij: 1, klm: 0 }, { hij: 1, klm: 0 }, ['klm', 'hij']), 1, 'ok');
  test.done();
};

exports.testspuriouAnotInBIgnore = function (test) {
  var fut = inputFilter.spuriousAnotInB;
  test.equal(fut({ abc: 'def', hij: 1, klm: 0 }, { hij: 1, klm: 0 }, ['abc', ' klm', 'hij']), 0, 'ok');
  test.done();
};

exports.testspuriouAnotInBIgnore2 = function (test) {
  var fut = inputFilter.spuriousAnotInB;
  test.equal(fut({ abc: 'def', 'u': 1, hij: 1, klm: 0 }, { c: 3, hij: 1, klm: 0 },
    ['abc', ' klm', 'hij']), 1, 'ok');
  test.done();
};

exports.testcompareContext = function (test) {
  var fut = inputFilter.compareContext;
  var a = { abc: 'def', hij: 1, klm: 0, ff: 'B' };
  var b = { hij: 1, klm: 0, ff: 'A', e: 1, c: 0, h: 2 };
  test.deepEqual(fut(a, b),
    {
      equal: 2,
      different: 1,
      spuriousL: 1,
      spuriousR: 3
    },
    'ok');
  test.done();
};

exports.testcompareContextIgnorePrivate = function (test) {
  var fut = inputFilter.compareContext;
  var a = { abc: 'def', _a: 1, _b: 3, hij: 1, klm: 0, ff: 'B' };
  var b = { hij: 1, _a: 1, _c: 3, _b: 4, klm: 0, ff: 'A', e: 1, c: 0, h: 2 };
  test.deepEqual(fut(a, b),
    {
      equal: 2,
      different: 1,
      spuriousL: 1,
      spuriousR: 3
    },
    'ok');
  test.done();
};

exports.testcompareContextIgnore = function (test) {
  var fut = inputFilter.compareContext;
  var a = { abc: 'def', hij: 1, klm: 0, ff: 'B' };
  var b = { hij: 1, klm: 0, ff: 'A', e: 1, c: 0, h: 2 };
  test.deepEqual(fut(a, b, ['abc']),
    {
      equal: 2,
      different: 1,
      spuriousL: 0,
      spuriousR: 3
    },
    'ok');
  test.done();
};

exports.test_matchWord = function (test) {
  const fn = inputFilter.matchWord;

  // test.expect(3)
  test.deepEqual(fn({
    key: 'NoTPresent'
  },
    {
      systemObjectId: 'ClientSideTragetResol',
      systemObjectCategory: 'unit'
    }),
    undefined, 'not applicable to irrelevant key');
  test.done();
};

exports.test_matchWordAlias = function (test) {
  const fn = inputFilter.matchWord;
  // test.expect(3)
  test.deepEqual(fn({
    key: 'systemObjectId',
    word: 'CSTR',
    follows: {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit'
    }
  },
    {
      systemObjectId: 'CSTR',
      systemObjectCategory: 'unit'
    }),
    undefined, 'not applicable to irrelevant key');
  test.done();
};

exports.test_matchWordAliasMatchOthersTrue = function (test) {
  const fn = inputFilter.matchWord;
  // test.expect(3)
  var oRule = {
    key: 'systemObjectId',
    word: 'ClientSideTargetResolution',
    follows: {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit'
    }
  };
  var oValue = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'xunit'
  };
  test.deepEqual(fn(oRule,
    oValue, { matchothers: true }),
    undefined, 'not applicable to irrelevant key');
  test.done();
};

exports.test_matchWordAliasMatchOthersFalse = function (test) {
  const fn = inputFilter.matchWord;
  // test.expect(3)
  var oRule = {
    key: 'systemObjectId',
    word: 'clientsidetargetresolution',
    follows: {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit'
    }
  };
  var oValue = {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  };
  test.deepEqual(fn(oRule,
    oValue, { matchothers: false }),
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'xunit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 1
      }
    }
    , ' matched');
  test.done();
};

exports.test_matchWordAliasMatchOthersFalseOverride = function (test) {
  const fn = inputFilter.matchWord;
  // test.expect(3)
  var oRule = {
    key: 'systemObjectId',
    word: 'clientsidetargetresolution',
    follows: {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit'
    }
  };
  var oValue = {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  };
  test.deepEqual(fn(oRule,
    oValue, {
      matchothers: false,
      override: true
    }),
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 1
      }
    }
    , ' matched and override');
  test.done();
};

var oRuleWord = {
  type: 'word',
  key: 'systemObjectId',
  word: 'cstr',
  follows: {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'unit'
  }
};

var oRuleWordLong = {
  type: 'word',
  key: 'systemObjectId',
  word: 'ClientSideTargetResolution',
  follows: {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'unit'
  }
};

exports.test_matchWordAlias = function (test) {
  const fn = ab.matchWord;
  // test.expect(3)
  var oContext = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'unit',
    abc: 'ABC'
  };
  var res = fn(oRuleWord, oContext);
  // console.log(JSON.stringify(res))
  test.deepEqual(res,
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 1
      }
    }, ' incorrect result');
  test.done();
};

exports.test_matchWordAliasDifferentCat = function (test) {
  const fn = ab.matchWord;
  // test.expect(3)

  var oContext = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  };
  var res = fn(oRuleWord, oContext);
  test.deepEqual(res, {
    systemObjectId: 'ClientSideTargetResolution',
    systemObjectCategory: 'xunit',
    abc: 'ABC',
    _weight: { 'systemObjectId': 1 }
  }
  /* undefined */, ' no match');
  test.done();
};

const enumRULETYPEWORD = 0;
const enumRULETYPEREGEXP = 1;

exports.test_applyRulesEqualChoice = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 2, 'found at least two');
  // console.log(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected');
  test.deepEqual(res[1].keyB, 'CategoryC', 'category respected');
  test.done();
};

exports.test_matchOthersTrue = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA',
    keyB: 'Nothingmatches'
  };
  // act
  var res = ab.matchWord(aRules[0], oContext, { matchothers: true });
  // test
  test.ok(res === undefined, ' undefined ');
  test.done();
};


exports.test_checkOneRuleA = function (test) {
  // prepare
  var aRule =
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    };
  test.expect(1);
  // act
  try {
     var res = ab.checkOneRule('abc','abc', true, [], aRule, {});
     test.equal(1,0);
  } catch(e) {
    test.equal(1,1);
  }
  test.done();
};


exports.test_checkOneRuleWordA = function (test) {
  // prepare
  var aRule = {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
  };
  test.expect(1);
  // act
  try {
     var res = ab.checkOneRule('abc','abc', true, [], aRule, {});
     test.equal(1,0);
  } catch(e) {
    test.equal(1,1);
  }
  test.done();
};
exports.test_checkOneRuleWordAExactFalse = function (test) {
  // prepare
  var aRule = {
    word: 'Valuea',
    key: 'keyA',
    lowercaseword : "valuea",
    type: enumRULETYPEWORD,
    follows: {
      'keyA': 'Synonym',
      'keyB': 'CategoryB'
    }
  };
  // act
  var res = [];
  ab.checkOneRule('Valuea','valuea', false, res, aRule, {});
  test.equal(res && res.length, 1,' exact false ');
  test.done();
};

exports.test_checkOneRuleWordAExact = function (test) {
  // prepare
  var aRule = {
    word: 'Valuea',
    key: 'keyA',
    lowercaseword : "valuea",
    type: enumRULETYPEWORD,
    follows: {
      'keyA': 'Synonym',
      'keyB': 'CategoryB'
    }
  };
  test.expect(4);
  // act
  var res = [];
  ab.checkOneRule('Valuea','valuea', true, res, aRule, {});
  test.equal(res && res.length, 1,true);
  res = [];
  ab.checkOneRule('VaLUEa','valueB', true, res, aRule, {});
  test.equal(res && res.length, 0,false);
  res = [];

  ab.checkOneRule('Valuea','valuea', false, res, aRule, {});
  test.equal(res && res.length, 1,' exact false ');
  res = [];
  ab.checkOneRule('VaLUEa','valuea', false, res, aRule, {});
  test.equal(res && res.length, 1);
  test.done();
};

exports.test_checkOneRuleWordAExactOnly = function (test) {
  // prepare
  var aRule = {
    word: 'Valuea',
    key: 'keyA',
    exactOnly : true,
    lowercaseword : "valuea",
    type: enumRULETYPEWORD,
    follows: {
      'keyA': 'Synonym',
      'keyB': 'CategoryB'
    }
  };
  test.expect(5);
  // act
  var res = [];
  ab.checkOneRule('Valueaa','valueaa', true, res, aRule, {});
  test.equal(res && res.length, 0,true);
  res = [];
  ab.checkOneRule('VaLUea','valuea', true, res, aRule, {});
  test.equal(res && res.length, 1,false);
  res = [];
  ab.checkOneRule('VaLUEaa','valueBa', true, res, aRule, {});
  test.equal(res && res.length, 0,false);
  res = [];
  ab.checkOneRule('Valueaa','valueaa', false, res, aRule, {});
  test.equal(res && res.length, 0,true);
  res = [];
  ab.checkOneRule('VaLUEaa','valueaa', false, res, aRule, {});
  test.equal(res && res.length, 0);
  test.done();
};


exports.test_checkOneRuleWithOffsetA = function (test) {
  // prepare
  var aRule =
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    };
  var oContext = {
    keyA: 'ValueA',
    keyB: 'NothingMatches'
  };
  test.expect(1);
  // act
  try {
     var res = ab.checkOneRuleWithOffset('abc','abc', true, aRule, {});
     test.equal(1,0);
  } catch(e) {
    test.equal(1,1);
  }
  test.done();
};


exports.test_checkOneRuleWithOffsetWordA= function (test) {
  // prepare
  var aRule = {
    word: 'Valuea',
    key: 'keyA',
    lowercaseword : "valuea",
    type: enumRULETYPEWORD,
    follows: {
      'keyA': 'Synonym',
      'keyB': 'CategoryB'
    }
  };
  test.expect(4);
  // act
  var res = [];
  ab.checkOneRuleWithOffset('Valuea','valuea', true, res, aRule, {});
  test.equal(res && res.length, 1,true);
  res = [];
  ab.checkOneRuleWithOffset('VaLUEa','valueB', true, res, aRule, {});
  test.equal(res && res.length, 0,false);
  res = [];

  ab.checkOneRuleWithOffset('Valuea','valuea', false, res, aRule, {});
  test.equal(res && res.length, 1,' exact false ');
  res = [];
  ab.checkOneRuleWithOffset('VaLUEa','valuea', false, res, aRule, {});
  test.equal(res && res.length, 1);
  test.done();
};

exports.test_checkOneRuleWithOffsetWordAExactOnly = function (test) {
  // prepare
  var aRule = {
    word: 'Valuea',
    key: 'keyA',
    exactOnly : true,
    lowercaseword : "valuea",
    type: enumRULETYPEWORD,
    follows: {
      'keyA': 'Synonym',
      'keyB': 'CategoryB'
    }
  };
  test.expect(5);
  // act
  var res = [];
  ab.checkOneRuleWithOffset('Valueaa','valueaa', true, res, aRule, {});
  test.equal(res && res.length, 0,true);
  res = [];
  ab.checkOneRuleWithOffset('VaLUea','valuea', true, res, aRule, {});
  test.equal(res && res.length, 1,false);
  res = [];
  ab.checkOneRuleWithOffset('VaLUEaa','valueBa', true, res, aRule, {});
  test.equal(res && res.length, 0,false);
  res = [];
  ab.checkOneRuleWithOffset('Valueaa','valueaa', false, res, aRule, {});
  test.equal(res && res.length, 0,true);
  res = [];
  ab.checkOneRuleWithOffset('VaLUEaa','valueaa', false, res, aRule, {});
  test.equal(res && res.length, 0);
  test.done();
};

exports.test_checkOneRuleWithOffsetWordNumbers = function (test) {
  // prepare
  var bitIndexAllDomains = 0xFFF;
  var metaBitIndex = 0xFFF;
  var aRule =  {
    category: "number",
    matchedString: "one",
    type: IMatch.EnumRuleType.REGEXP,
    regexp : /(\d+)|(one)|(two)|(three)/,
    matchIndex : 0,
    word: "<number>",
    bitindex: metaBitIndex,
    wordType: IMatch.WORDTYPE.NUMERICARG, // number
    bitSentenceAnd: bitIndexAllDomains,
    _ranking: 0.95
  };
  test.expect(5);
  // act
  var res = [];
  ab.checkOneRuleWithOffset('123','123', true, res, aRule, {});
  test.equal(res && res.length, 1, JSON.stringify( res, undefined, 2));
  res = [];
  ab.checkOneRuleWithOffset('one','one', true, res, aRule, {});
  test.equal(res && res.length, 1, JSON.stringify( res, undefined, 2));
  res = [];
  ab.checkOneRuleWithOffset('two','two', true, res, aRule, {});
  test.equal(res && res.length, 1,JSON.stringify( res, undefined, 2));
  res = [];
  ab.checkOneRuleWithOffset('four','four', false, res, aRule, {});
  test.equal(res && res.length, 0,JSON.stringify( res, undefined, 2));
  res = [];
  ab.checkOneRuleWithOffset('VaLUEaa','valueaa', false, res, aRule, {});
  test.equal(res && res.length, 0, JSON.stringify( res, undefined, 2));
  test.done();
};

exports.test_matchOthersFalse = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA',
    keyB: 'NothingMatches'
  };
  // act
  var res = ab.matchWord(aRules[0], oContext, { matchothers: false });
  debuglog('2222222222>' + JSON.stringify(res, undefined, 2));
  // test
  test.deepEqual(res.keyB, 'NothingMatches', ' categorypicked ');
  test.done();
};

exports.test_matchOthersFalseOverride = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA',
    keyB: 'NothingMatches'
  };
  // act
  var res = ab.matchWord(aRules[0], oContext, { matchothers: false, override: true });
  debuglog('2222222222>' + JSON.stringify(res, undefined, 2));
  // test
  test.deepEqual(res.keyB, 'CategoryB', ' categorypicked ');
  test.done();
};

/*
exports.test_applyRules = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD, // WORD
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD, // WORD
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA',
    keyB: 'CategoryB'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length > 0, 'found one');
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected');
  test.done();
};

exports.test_applyRulesEqualChoice = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 2, 'found at least two');
  // console.log(' =================>' + JSON.stringify(res, undefined, 2))
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected');
  test.deepEqual(res[1].keyB, 'CategoryC', 'category respected');
  test.done();
};

exports.test_applyRulesNotCategoryFit = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];

  var oContext = {
    keyA: 'ValueA',
    keyB: 'Nothingmatches'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 2, 'found at least two');
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected');
  test.deepEqual(res[1].keyB, 'CategoryC', 'category respected');
  test.done();
};

exports.test_applyRulesGoodFitInOtherCategory = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valueb',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];
  var oContext = {
    keyA: 'ValueB',
    keyB: 'CategoryB'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 1, 'found at least two');
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected');
  test.deepEqual(res[0].keyA, 'Synonym', 'category respected');
  // test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
  test.done();
};

exports.test_applyRulesLevenBestFitCategory = function (test) {
  // prepare
  var aRules = [
    {
      word: 'valuea',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'SynonymA',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valueabc',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'SynonymABC',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valueabcdefg',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'SynonymDEF',
        'keyB': 'CategoryB'
      }
    },
    {
      word: 'valueb',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'Synonym',
        'keyB': 'CategoryC'
      }
    }
  ];
  var oContext = {
    keyA: 'valuebbc',
    keyB: 'CategoryB'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 1, 'found at least two');
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].keyB, 'CategoryB', 'category respected');
  test.deepEqual(res[0].keyA, 'SynonymABC', 'category respected');

  // test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
  test.done();
};
*/

exports.test_matchWordAliasOverride = function (test) {
  const fn = ab.matchWord;
  // test.expect(3)

  var oContext = {
    systemObjectId: 'CSTR',
    abc: 'ABC'
  };
  var res = fn(oRuleWord, oContext, {
    augment: true
  });
  test.deepEqual(res,
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 1
      }
    }, ' incorrect result');
  test.done();
};

exports.test_matchWordAliasOverrideDifferent = function (test) {
  const fn = ab.matchWord;
  // test.expect(3)

  var oContext = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  };
  var res = fn(oRuleWord, oContext, {
    override: true
  });
  test.deepEqual(res,
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 1
      }
    }, ' incorrect result');
  test.done();
};

exports.test_ruleLevenBeforeFallback = function (test) {
  // prepare
  // there a
  var aRules = [
    {
      word: 'somewhatfar',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'somewhatfar',
        'keyB': 'System3'
      }
    },
    {
      word: 'somewhatclose',
      key: 'keyA',
      type: enumRULETYPEWORD,
      follows: {
        'keyA': 'somewhatclose',
        'keyB': 'System2'
      }
    },
    {
      regexp: /^.*$/,
      key: 'keyA',
      type: enumRULETYPEREGEXP,
      follows: {
        _ranking: 0.9
      }
    }
  ];
  var oContext = {
    keyA: 'somewhatcl'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 1, 'found at least one');
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].keyA, 'somewhatclose', 'category propagated');
  test.deepEqual(res[0].keyB, 'System2', 'category picked');

  oContext = {
    keyA: 'gibts gar nicht'
  };
  // act
  res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 1, 'found at least one');
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].keyA, 'gibts gar nicht', 'result propagated');
  test.deepEqual(res[0].keyB, undefined, 'category picked');
  test.done();
  // test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
};

exports.test_extractArgsMap = function (test) {
  var res = ab.extractArgsMap(['A', 'B', 'C'], { 2: 'X2', 1: 'X1' });
  test.deepEqual(res,
    { 'X2': 'C', 'X1': 'B' }, ' incorrect result');
  test.done();
};
exports.test_extractArgsMapUndef = function (test) {
  var res = ab.extractArgsMap(['A', 'B', 'C'], undefined);
  test.deepEqual(res,
    {}, ' incorrect result');
  test.done();
};
exports.test_extractArgsMapEmptyMatch = function (test) {
  var res = ab.extractArgsMap(['A', '', 'C'], { 2: 'X2', 1: 'X1' });
  test.deepEqual(res,
    { 'X2': 'C' }, ' incorrect result');
  test.done();
};
exports.test_extractArgsMapOutOfRange = function (test) {
  var res = ab.extractArgsMap(['A', '', 'C'], { 2: 'X2', 4: 'X1' });
  test.deepEqual(res,
    { 'X2': 'C' }, ' incorrect result');
  test.done();
};

exports.test_matchWordNonMatched = function (test) {
  const fn = ab.matchWord;
  // test.expect(3)
  var oContext = {
    systemObjectId: 'Way off the page',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  };
  var res = fn(oRuleWord, oContext);
  test.deepEqual(res,
    undefined, ' incorrect result');
  test.done();
};

exports.test_matchWordLevenClose = function (test) {
  const fn = ab.matchWord;
  // test.expect(3)
  var oContext = {
    systemObjectId: 'ClientSideTrgetResolution',
    systemObjectCategory: 'unit',
    abc: 'ABC'
  };
  var res = fn(oRuleWordLong, oContext);
  // console.log('Res is ' + res)
  test.deepEqual(res,
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'unit',
      abc: 'ABC',
      _weight: {
        'systemObjectId':  0.9923076923076923
      }
    }, ' incorrect result ');
  test.done();
};

exports.test_ruleRegexp = function (test) {
  // prepare
  // there a
  var aRules = [
    {
      regexp: /^[a-z0-9_]{3,3}$/,
      key: 'keyA',
      type: enumRULETYPEREGEXP,
      follows: {
        'keyB': 'System3'
      }
    },
    {
      regexp: /^[a-z0-9_]{4,4}$/,
      key: 'keyA',
      type: enumRULETYPEREGEXP,
      follows: {
        'keyB': 'System4'
      }
    }
  ];
  var oContext = {
    keyA: 'ABC'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 1, 'found at least one');
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].keyA, 'ABC', 'category propagated');
  test.deepEqual(res[0].keyB, 'System3', 'category picked');

  oContext = {
    keyA: 'ABCD'
  };
  // act
  res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 1, 'found at least one');
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].keyA, 'ABCD', 'result propagated');
  test.deepEqual(res[0].keyB, 'System4', 'category picked');
  // test.deepEqual(res[1].keyB, 'CategoryC', 'category respected')
  oContext = {
    keyA: 'ABCDE'
  };
  // act
  res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length === 0, 'found nothing');
  test.done();
};

exports.test_ruleRegexpExtraction = function (test) {
  // prepare
  // there a
  var aRules = [
    {
      regexp: /^([a-z0-9_]{3,3})clnt(\d{3,3})$/i,
      key: 'keyA',
      argsMap: {
        1: 'systemId',
        2: 'client'
      },
      type: enumRULETYPEREGEXP,
      follows: {
        'keyB': 'System3'
      }
    }
  ];
  var oContext = {
    keyA: 'UV2CLNT123'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 1, 'found at least one');
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].keyA, 'UV2CLNT123', 'category propagated');
  test.deepEqual(res[0].keyB, 'System3', 'category picked');
  test.deepEqual(res[0].systemId, 'uv2', 'extract1 picked');
  test.deepEqual(res[0].client, '123', 'extract2 picked');
  test.done();
};

exports.test_ruleRegexpExtractionReplacing = function (test) {
  // prepare
  // there a
  var aRules = [
    {
      regexp: /^([a-z0-9_]{3,3})CLNT(\d{3,3})$/i,
      key: 'systemId',
      argsMap: {
        1: 'systemId',
        2: 'client'
      },
      type: enumRULETYPEREGEXP,
      follows: {
        'keyB': 'System3'
      }
    }
  ];
  var oContext = {
    systemId: 'UV2CLNT123'
  };
  // act
  var res = ab.augmentContext(oContext, aRules);
  // test
  test.ok(res.length >= 1, 'found at least one');
  debuglog(' =================>' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].keyB, 'System3', 'category propagated');
  test.deepEqual(res[0].systemId, 'uv2', 'category picked');
  test.deepEqual(res[0].client, '123', 'category picked');
  test.done();
};
/*
exports.test_matchSthElse = function (test) {
  const fn = ab.matchWord;
  // test.expect(3)
  var oContext = {
    systemObjectId: 'CSTR',
    systemObjectCategory: 'xunit',
    abc: 'ABC'
  };
  var res = fn(oRuleWord, oContext);
  // console.log(JSON.stringify(res))
  test.deepEqual(res,
    {
      systemObjectId: 'ClientSideTargetResolution',
      systemObjectCategory: 'xunit',
      abc: 'ABC',
      _weight: {
        'systemObjectId': 1
      }
    }, ' incorrect result');
  test.done();
};

exports.test_applyRules = function (test) {
  // prepare
  var oContext = {
    'systemObjectId': 'ClientsideTrgetRes'
  };
  // act
  var res = ab.applyRules(oContext);
  // test
  debuglog('The end result : ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(res[0].systemObjectId, 'ClientSideTargetResolution', ' typo corrected');
  test.deepEqual(res[0].systemObjectCategory, 'unit test', 'category determined ok');
  test.done();
};

exports.test_applyRulesWithCategory = function (test) {
  // prepare
  var oContext = {
    'systemObjectId': 'ClientsideTrgetRes',
    'systemObjectCategory': 'unit'
  };
  // act
  var res = ab.applyRules(oContext);
  // test
  //console.log(JSON.stringify(res,undefined,2));
  test.deepEqual(res[0].systemObjectId, 'ClientSideTargetResolution', ' typo corrected');
  test.deepEqual(res[0].systemObjectCategory, 'unit test', 'category determined ok');
  test.done();
};
*/

exports.testinputFilter = function (test) {
  const fn = ab.augmentContext;
  // test.expect(3)
  test.deepEqual(fn({
    systemObjectId: 'ClientSideTragetResol',
    systemObjectCategory: 'unit'
  }, [
    {
      type: 1
    }
  ]),
    [], 'return undefined');
  test.done();
};


function getRules() {
  return getModel().then(
    (model) => {
      return Promise.resolve([model.rules, model]);
    }
  )
}


function releaseRules(theModel) {
  Model.releaseModel(theModel);
}


process.on('unhandledRejection', function onError(err) {
  console.log('erbase.nunit.js');
  console.log(err);
  console.log(err.stack);
  throw err;
});
/* old?
var mongoose = require('mongoose_record_replay').instrumentMongoose(require('mongoose'),
  'node_modules/mgnlq_testmodel_replay/mgrecrep/',
  'REPLAY');

function getRules() {
  return Model.loadModelsOpeningConnection(mongoose).then(
      (model) => {
        return Promise.resolve([model.rules, model.mongoHandle.mongoose]);
      }
    )
}

function releaseRules(mongoose) {
  MongoUtils.disconnect(mongoose);
}
*/

//const Model = require('fdevsta_monmove').Model;

//var theModel = Model.loadModels();

exports.testCategorizeAWordWithOffest = function (test) {
    getRules().then( (args) => { var [rules,mongoose] = args;
 var res = inputFilter.categorizeAWord('ApplicationComponent', rules,  'not relevant', {}, {});
  test.deepEqual(res, [ { string: 'ApplicationComponent',
    matchedString: 'ApplicationComponent',
    category: 'category',
    rule:
     { category: 'category',
       matchedString: 'ApplicationComponent',
       type: 0,
       word: 'ApplicationComponent',
       lowercaseword: 'applicationcomponent',
       bitindex: 4,
       wordType: 'C',
       bitSentenceAnd: 4,
       _ranking: 0.95 },
    _ranking: 0.95 },
  { string: 'ApplicationComponent',
    matchedString: 'ApplicationComponent',
    category: 'category',
    rule:
     { category: 'category',
       matchedString: 'ApplicationComponent',
       type: 0,
       word: 'ApplicationComponent',
       lowercaseword: 'applicationcomponent',
       bitindex: 8,
       wordType: 'C',
       bitSentenceAnd: 8,
       _ranking: 0.95 },
    _ranking: 0.95 },
  { string: 'ApplicationComponent',
    matchedString: 'ApplicationComponent',
    category: 'category',
    rule:
     { category: 'category',
       matchedString: 'ApplicationComponent',
       type: 0,
       word: 'ApplicationComponent',
       bitindex: 32,
       bitSentenceAnd: 32,
       exactOnly: false,
       wordType: 'F',
       _ranking: 0.95,
       lowercaseword: 'applicationcomponent' },
    _ranking: 0.95 } ]);
  test.done();
  releaseRules(mongoose);
    });
};

exports.testCategorizeANumberWordWithOffest = function (test) {
  getRules().then( (args) => { var [rules,mongoose] = args;
var res = inputFilter.categorizeAWord('1234', rules,  'not relevant', {}, {});
test.deepEqual(res, [ { string: '1234',
matchedString: '1234',
rule:
 { category: 'number',
   matchedString: 'one',
   type: 1,
   regexp: {},
   matchIndex: 0,
   word: '<number>',
   bitindex: 512,
   wordType: 'N',
   bitSentenceAnd: 511,
   _ranking: 0.95 },
category: 'number',
_ranking: 0.95 } ]);
test.done();
releaseRules(mongoose);
  });
};

exports.testCategorizeANumber12WordWithOffest = function (test) {
  getRules().then( (args) => { var [rules,mongoose] = args;
var res = inputFilter.categorizeAWord('12', rules,  'not relevant', {}, {});
test.deepEqual(res, [ { string: '12',
matchedString: '12',
category: 'element number',
rule:
 { category: 'element number',
   matchedString: '12',
   type: 0,
   word: '12',
   bitindex: 16,
   bitSentenceAnd: 16,
   exactOnly: false,
   wordType: 'F',
   _ranking: 0.95,
   lowercaseword: '12' },
_ranking: 0.95 },
{ string: '12',
matchedString: '12',
rule:
 { category: 'number',
   matchedString: 'one',
   type: 1,
   regexp: {},
   matchIndex: 0,
   word: '<number>',
   bitindex: 512,
   wordType: 'N',
   bitSentenceAnd: 511,
   _ranking: 0.95 },
category: 'number',
_ranking: 0.95 } ]);
test.done();
releaseRules(mongoose);
  });
};


exports.testCategorizeANumber_One_WordWithOffest = function (test) {
  getRules().then( (args) => { var [rules,mongoose] = args;
var res = inputFilter.categorizeAWord('One', rules, 'not relevant', {}, {});
test.deepEqual(res, [ ]); // TODO
test.done();
releaseRules(mongoose);
  });
};

exports.testCategorizeANumber_one_WordWithOffest = function (test) {
  getRules().then( (args) => { var [rules,mongoose] = args;
var res = inputFilter.categorizeAWord('one', rules, 'not relevant', {}, {});
test.deepEqual(res, [ { string: 'one',
matchedString: 'one',
rule:
 { category: 'number',
   matchedString: 'one',
   type: 1,
   regexp: {},
   matchIndex: 0,
   word: '<number>',
   bitindex: 512,
   wordType: 'N',
   bitSentenceAnd: 511,
   _ranking: 0.95 },
category: 'number',
_ranking: 0.95 } ]);
test.done();
releaseRules(mongoose);
  });
};




exports.testCategorizeAWordWithOffest = function (test) {
    getRules().then( (args) => { var [rules,mongoose] = args;
 var res = inputFilter.categorizeAWord('Fiori', rules,  'not relevant', {}, {});

 var res2 = inputFilter.categorizeAWordWithOffsets('Fiori', rules,  'not relevant', {}, {});

  test.deepEqual(res, []);

  test.deepEqual(res2, [ { string: 'Fiori',
    matchedString: 'AppName',
    category: 'category',
    rule:
     { category: 'category',
       matchedString: 'AppName',
       bitindex: 4,
       bitSentenceAnd: 4,
       wordType: 'C',
       word: 'fiori',
       type: 0,
       lowercaseword: 'fiori',
       _ranking: 0.95,
       range:
        { low: 0,
          high: 1,
          rule:
           { category: 'category',
             matchedString: 'AppName',
             type: 0,
             word: 'Fiori App',
             bitindex: 4,
             bitSentenceAnd: 4,
             wordType: 'C',
             _ranking: 0.95,
             lowercaseword: 'fiori app' } } },
    _ranking: 0.95 },
  { string: 'Fiori',
    matchedString: 'AppName',
    category: 'category',
    rule:
     { category: 'category',
       matchedString: 'AppName',
       bitindex: 32,
       bitSentenceAnd: 32,
       wordType: 'F',
       word: 'fiori',
       type: 0,
       lowercaseword: 'fiori',
       _ranking: 0.95,
       range:
        { low: 0,
          high: 1,
          rule:
           { category: 'category',
             matchedString: 'AppName',
             type: 0,
             word: 'Fiori App',
             bitindex: 32,
             bitSentenceAnd: 32,
             wordType: 'F',
             _ranking: 0.95,
             lowercaseword: 'fiori app' } } },
    _ranking: 0.95 },
  { string: 'Fiori',
    matchedString: 'FioriBOM',
    category: 'domain',
    rule:
     { category: 'domain',
       matchedString: 'FioriBOM',
       bitindex: 4,
       bitSentenceAnd: 4,
       wordType: 'D',
       word: 'fiori',
       type: 0,
       lowercaseword: 'fiori',
       _ranking: 0.95,
       range:
        { low: 0,
          high: 1,
          rule:
           { category: 'domain',
             matchedString: 'FioriBOM',
             type: 0,
             word: 'fiori bom',
             bitindex: 4,
             bitSentenceAnd: 4,
             wordType: 'D',
             _ranking: 0.95,
             lowercaseword: 'fiori bom' } } },
    _ranking: 0.95 },
  { string: 'Fiori',
    matchedString: 'FioriBOM',
    category: 'domain',
    rule:
     { category: 'domain',
       matchedString: 'FioriBOM',
       bitindex: 32,
       bitSentenceAnd: 32,
       wordType: 'F',
       word: 'fiori',
       type: 0,
       lowercaseword: 'fiori',
       _ranking: 0.95,
       range:
        { low: 0,
          high: 1,
          rule:
           { category: 'domain',
             matchedString: 'FioriBOM',
             type: 0,
             word: 'fiori bom',
             bitindex: 32,
             bitSentenceAnd: 32,
             wordType: 'F',
             _ranking: 0.95,
             lowercaseword: 'fiori bom' } } },
    _ranking: 0.95 } ], 'contains ranged');

  test.done();
  releaseRules(mongoose);
    });
};




process.on('unhandledRejection', function onError(err) {
  console.log('inputFilter.nunit.js');
  console.log(err);
  console.log(err.stack);
  throw err;
});

exports.testcompByEqualResultThenRank = function(test) {
  var tobecompared = [
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"ApplicationComponent","lowercaseword":"applicationcomponent","bitindex":2,"wordType":"C","bitSentenceAnd":2,"_ranking":0.95},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9405,"levenmatch":0.99},
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"ApplicationComponent","lowercaseword":"applicationcomponent","bitindex":4,"wordType":"C","bitSentenceAnd":4,"_ranking":0.95},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9405,"levenmatch":0.99},
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"ApplicationComponent","bitindex":16,"bitSentenceAnd":16,"exactOnly":false,"wordType":"F","_ranking":0.95,"lowercaseword":"applicationcomponent"},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9405,"levenmatch":0.99},
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"Application Component","bitindex":2,"bitSentenceAnd":2,"wordType":"C","_ranking":0.95,"lowercaseword":"application component"},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9314523809523809,"levenmatch":0.9804761904761905}];
  test.equal(inputFilter.cmpByResultThenRank(tobecompared[0],tobecompared[0]),0);
  test.equal(inputFilter.cmpByResultThenRank(tobecompared[0],tobecompared[1]),-2, ' compare 0 and 1');
  test.equal(inputFilter.cmpByResult(tobecompared[0],tobecompared[3]),0);
  test.equal(inputFilter.cmpByResultThenRank(tobecompared[0],tobecompared[3]) < 0, true, ' compare 0 3 full');
  test.done();
}



exports.testdropLowerRankedEqualResult = function(test) {
  var tobefiltered = [
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"ApplicationComponent","lowercaseword":"applicationcomponent","bitindex":2,"wordType":"C","bitSentenceAnd":2,"_ranking":0.95},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9405,"levenmatch":0.99},
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"ApplicationComponent","lowercaseword":"applicationcomponent","bitindex":4,"wordType":"C","bitSentenceAnd":4,"_ranking":0.95},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9405,"levenmatch":0.99},
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"ApplicationComponent","bitindex":16,"bitSentenceAnd":16,"exactOnly":false,"wordType":"F","_ranking":0.95,"lowercaseword":"applicationcomponent"},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9405,"levenmatch":0.99},
    {"string":"ApplicaitonComponent","rule":{"category":"category","matchedString":"ApplicationComponent","type":0,"word":"Application Component","bitindex":2,"bitSentenceAnd":2,"wordType":"C","_ranking":0.95,"lowercaseword":"application component"},"matchedString":"ApplicationComponent","category":"category","_ranking":0.9314523809523809,"levenmatch":0.9804761904761905}];
    var dropped = tobefiltered[3]._ranking;
  test.equal(tobefiltered.filter(el => { return el._ranking === dropped}).length, 1, ' still present');
  var res = inputFilter.dropLowerRankedEqualResult(tobefiltered);
  test.equal(res.length + 1, tobefiltered.length, 'correct length');
  test.equal(res.filter(el => { el._ranking === dropped}).length, 0, 'now gone');
  test.done();
}



exports.testCategorizeAWordWithOffsetCloseBoth = function (test) {
    getRules().then( (args) => { var [rules,mongoose] = args;
      // note the typo !
 var res = inputFilter.categorizeAWordWithOffsets('ApplicaitonComponent', rules,  'not relevant', {}, {});
  test.deepEqual(res, [ { string: 'ApplicaitonComponent',
    rule:
     { category: 'category',
       matchedString: 'ApplicationComponent',
       type: 0,
       word: 'ApplicationComponent',
       lowercaseword: 'applicationcomponent',
       bitindex: 4,
       wordType: 'C',
       bitSentenceAnd: 4,
       _ranking: 0.95 },
    matchedString: 'ApplicationComponent',
    category: 'category',
    _ranking: 0.9405,
    levenmatch: 0.99 },
  { string: 'ApplicaitonComponent',
    rule:
     { category: 'category',
       matchedString: 'ApplicationComponent',
       type: 0,
       word: 'ApplicationComponent',
       lowercaseword: 'applicationcomponent',
       bitindex: 8,
       wordType: 'C',
       bitSentenceAnd: 8,
       _ranking: 0.95 },
    matchedString: 'ApplicationComponent',
    category: 'category',
    _ranking: 0.9405,
    levenmatch: 0.99 },
  { string: 'ApplicaitonComponent',
    rule:
     { category: 'category',
       matchedString: 'ApplicationComponent',
       type: 0,
       word: 'ApplicationComponent',
       bitindex: 32,
       bitSentenceAnd: 32,
       exactOnly: false,
       wordType: 'F',
       _ranking: 0.95,
       lowercaseword: 'applicationcomponent' },
    matchedString: 'ApplicationComponent',
    category: 'category',
    _ranking: 0.9405,
    levenmatch: 0.99 } ]);
  test.done();
  releaseRules(mongoose);
    });
};

/*
exports.testCategorizeStringBadRule = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  test.expect(2);
  try {
    ab.categorizeString('NavTargetResolu', false,
      [{
        type: -123,
        word: 'walk this way'
      }]);
    test.ok(false, 'do not get here');
  } catch (e) {
    test.ok(e.message.indexOf('walk this way') >= 0);
    test.ok(true, 'got exception');
  }
  test.done();
};
*/

function filterRules(res) {
  var res = res.map( wordexp => wordexp.map( rx => rx.map(
      obj => {
         var r = Object.assign({},obj);
         delete r.rule;
         return r;
      }
  )));
  return res;
}

var mRulesStrict = Model.splitRules( [
  {
    'category': 'category',
    'matchedString': 'unit test',
    'type': 0,
    'word': 'unit test',
    'lowercaseword': 'unit test',
    '_ranking': 0.95
  },
  {
    'category': 'category',
    'matchedString': 'wiki',
    'type': 0,
    'word': 'wiki',
    'lowercaseword': 'wiki',
    '_ranking': 0.95
  },
  {
    'category': 'client',
    'matchedString': '120',
    'type': 0,
    'word': '120',
    'lowercaseword': '120',
    '_ranking': 0.95
  }]
);




exports.testExpand0 = function (test) {
  test.ok(1);
  var src = [[
    [{ string: 'a', a: 1 },
    { string: 'b', a: 1 }],
    [{ string: '1', a: 1 },
    { string: '2', a: 1 },
    { string: '3', a: 1 }]
  ]];
  var res = ab.expandMatchArr(src);
  test.deepEqual(res, [[{ string: 'a', a: 1 }, { string: '1', a: 1 }],
  [{ string: 'b', a: 1 }, { string: '1', a: 1 }],
  [{ string: 'a', a: 1 }, { string: '2', a: 1 }],
  [{ string: 'b', a: 1 }, { string: '2', a: 1 }],
  [{ string: 'a', a: 1 }, { string: '3', a: 1 }],
  [{ string: 'b', a: 1 }, { string: '3', a: 1 }]], 'correct result');

  test.done();
};



exports.testExpand1 = function (test) {
  test.ok(1);

  var src = [[[{ string: 'cat1 and ab', a: 1 }]],
    [[{ 'string': 'cat1', b1: 1 },
  { 'string': 'cat1', b1: 2 }
    ],
      [{
        string: 'and ab',
        b2: 1
      }]],
    [[{ string: 'cat1 and' }],
      [{ string: 'ab', c21: 1 },
  { string: 'ab', c21: 2 },
  { string: 'ab', c21: 3 }
      ]
    ]
  ];

  var res = ab.expandMatchArr(src);
  test.deepEqual(res, [[{ string: 'cat1 and ab', a: 1 }],
  [{ string: 'cat1', b1: 1 }, { string: 'and ab', b2: 1 }],
  [{ string: 'cat1', b1: 2 }, { string: 'and ab', b2: 1 }],
  [{ string: 'cat1 and' }, { string: 'ab', c21: 1 }],
  [{ string: 'cat1 and' }, { string: 'ab', c21: 2 }],
  [{ string: 'cat1 and' }, { string: 'ab', c21: 3 }]], 'correct result');

  test.done();
};

exports.testExpandMult = function (test) {
  test.ok(1);

  var src = [[[{
    string: 'cat1 and ab',
    matchedString: 'cat1 and ab',
    category: 'unknown'
  }]],
    [[{ string: 'cat1', matchedString: 'CAT2', category: 'category' },
  { string: 'cat1', matchedString: 'cat1', category: 'unknown' }],
      [{
        string: 'and ab',
        matchedString: 'and ab',
        category: 'unknown'
      }]],
    [[{
      string: 'cat1 and',
      matchedString: 'cat1 and',
      category: 'unknown'
    }],
      [{ string: 'ab', matchedString: 'ab', category: 'CAT1' },
  { string: 'ab', matchedString: 'ab', category: 'unknown' }]],
    [[{ string: 'cat1', matchedString: 'CAT2', category: 'category' },
  { string: 'cat1', matchedString: 'cat1', category: 'unknown' }],
  [{ string: 'and', matchedString: 'and', category: 'unknown' }],
      [{ string: 'ab', matchedString: 'ab', category: 'CAT1' },
  { string: 'ab', matchedString: 'ab', category: 'unknown' }]]];
  // 1 +  2 x 1  + 1 x 2 + 2 x 1 x 2
  var res = ab.expandMatchArr(src);
  test.equal(res.length, 9, 'correct length');
  test.done();
};



exports.testExtractCategory = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))

  var sentence = [
    { string: 'wiki', matchedString: 'wiki', category: 'category' },
    { string: 'My wiki', matchedString: 'My wiki', category: 'wiki' },
    { string: 'cat', matchedString: 'catalog', category: 'category' },
    { string: 'My cat', matchedString: 'My cat', category: 'wiki' },
    { string: 'in', matchedString: 'in', category: 'filler' },
    { string: 'wiki', matchedString: 'wiki', category: 'category' }
  ];

  var res = ab.extractCategoryMap(sentence);

  test.deepEqual(res,
    {
      'wiki': [{ pos: 0 }, { pos: 5 }],
      'catalog': [{ pos: 2 }]
    }, 'correct map');
  test.done();
};



exports.testreinforceSentence = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))

  var sentence = [
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 },
    { string: 'My wiki', matchedString: 'My wiki', category: 'wiki', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'cat', matchedString: 'catalog', category: 'category', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'My next wiki', matchedString: 'My next wiki', category: 'wiki', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 }
  ];

  var res = ab.reinForceSentence(sentence);


  var resline = [
    {
      string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1
    },
    {
      string: 'My wiki',
      matchedString: 'My wiki',
      category: 'wiki',
      _ranking: 1.1,
      reinforce: 1.1
    },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'cat', matchedString: 'catalog', category: 'category', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    {
      string: 'My next wiki',
      matchedString: 'My next wiki',
      category: 'wiki',
      _ranking: 1.05,
      reinforce: 1.05
    },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 }
  ];

  test.deepEqual(res, resline, 'correct reinforced string');
  test.done();
};


exports.testCalcDistnance = function (test) {
  var res = InputFilter.calcDistance('literary','life');
  test.equal(res, 0.8634945397815913);
  test.done();
}

exports.testreinforceMetaDomainSentence = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))

  var sentence = [
    { string: 'domain', matchedString: 'domain', category: 'meta', _ranking: 1 },
    { string: 'FLP', matchedString: 'FLP', category: 'domain', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'cat', matchedString: 'catalog', category: 'category', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'My next wiki', matchedString: 'My next wiki', category: 'wiki', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 }
  ];

  var res = ab.reinForceSentence(sentence);


  var resline = [
    {
      string: 'domain', matchedString: 'domain', category: 'meta', _ranking: 1
    },
    {
      string: 'FLP',
      matchedString: 'FLP',
      category: 'domain',
      _ranking: 1.1,
      reinforce: 1.1
    },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'cat', matchedString: 'catalog', category: 'category', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    {
      string: 'My next wiki',
      matchedString: 'My next wiki',
      category: 'wiki',
      _ranking: 1.05,
      reinforce: 1.05
    },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 }
  ];

  test.deepEqual(res, resline, 'correct reinforced string');
  test.done();
};


exports.testreinforce = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  var sentence = [
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 },
    { string: 'My wiki', matchedString: 'My wiki', category: 'wiki', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'cat', matchedString: 'catalog', category: 'category', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'My next wiki', matchedString: 'My next wiki', category: 'wiki', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 }
  ];


  var resline = [
    {
      string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1
    },
    {
      string: 'My wiki',
      matchedString: 'My wiki',
      category: 'wiki',
      _ranking: 1.1,
      reinforce: 1.1
    },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'cat', matchedString: 'catalog', category: 'category', _ranking: 1 },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    {
      string: 'My next wiki',
      matchedString: 'My next wiki',
      category: 'wiki',
      _ranking: 1.05,
      reinforce: 1.05
    },
    { string: 'in', matchedString: 'in', category: 'filler', _ranking: 1 },
    { string: 'wiki', matchedString: 'wiki', category: 'category', _ranking: 1 }
  ];

  var u = [sentence,
    utils.cloneDeep(sentence),
    utils.cloneDeep(sentence)];



  var res = ab.reinForce(u);
  test.deepEqual(res[0], resline, 'line 0 ok');
  test.deepEqual(res[1], resline, 'line 1 ok');
  test.deepEqual(res[2], resline, 'line 2 ok');
  test.done();
};


const ratherMaybe =  [ ["what" , "waht"],
["weight", "weigth"] ,
["semantic objects", "semantic object"] ,
["Busines catlog", "BusinessCatalog" ]];

const ratherNot = [
  [ "orbit of", "orbital period" ],
  [ "semantic objects", "semantic action" ],
];

exports.testCalcDistanceClasses = function(test) {
  ratherMaybe.forEach(function(s) {
    var dist = ab.calcDistance(s[0],s[1]);
    test.equal(dist > Algol.Cutoff_WordMatch , true, ` ${dist} for ${s[0]} !== ${s[1]} is larger than cutoff`);
  })
  test.done();
};
