"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.augmentContext = exports.augmentContext1 = exports.sortByWeight = exports.matchRegExp = exports.reinForce = exports.reinForceSentence = exports.extractCategoryMap = exports.reinforceDistWeight = exports.expandMatchArr = exports.categorizeAWordWithOffsets = exports.categorizeAWord = exports.categorizeWordWithOffsetWithRankCutoffSingle = exports.categorizeWordWithOffsetWithRankCutoff = exports.RankWord = exports.extractArgsMap = exports.matchWord = exports.categorizeWordInternalWithOffsets = exports.postFilterWithOffset = exports.dropLowerRankedEqualResult = exports.categorizeSingleWordWithOffset = exports.checkOneRuleWithOffset = exports.checkOneRule = exports.cmpByResultThenRank = exports.cmpByResult = exports.compareContext = exports.spuriousAnotInB = exports.countAinB = exports.levenPenalty = exports.calcDistance = exports.mockDebug = void 0;
/**
 * the input filter stage preprocesses a current context
 *
 * It a) combines multi-segment arguments into one context members
 * It b) attempts to augment the context by additional qualifications
 *           (Mid term generating Alternatives, e.g.
 *                 ClientSideTargetResolution -> unit test?
 *                 ClientSideTargetResolution -> source ?
 *           )
 *  Simple rules like  Intent
 *
 *
 * @module jfseb.fdevstart.inputFilter
 * @file inputFilter.ts
 * @copyright (c) 2016 Gerd Forstmann
 */
// <reference path="../../lib/node-4.d.ts" />
const distance = require("abot_stringdist");
//import * as Logger from '../utils/logger';
//const logger = Logger.logger('inputFilter');
const debug = require("debugf");
var debugperf = debug('perf');
var logger = debug('inputFilterLogger');
const mgnlq_model_1 = require("mgnlq_model");
const utils = require("abot_utils");
//import * as IFMatch from '../match/iferbase';
//import * as inputFilterRules from './inputFilterRules';
const Algol = require("./algol");
const IFMatch = require("./iferbase");
const AnyObject = Object;
var debuglog = debug('inputFilter');
var debuglogV = debug('inputVFilter');
var debuglogM = debug('inputMFilter');
function mockDebug(o) {
    debuglog = o;
    debuglogV = o;
    debuglogM = o;
}
exports.mockDebug = mockDebug;
/**
 * @param sText {string} the text to match to NavTargetResolution
 * @param sText2 {string} the query text, e.g. NavTarget
 *
 * @return the distance, note that is is *not* symmetric!
 */
function calcDistance(sText1, sText2) {
    return distance.calcDistanceAdjusted(sText1, sText2);
}
exports.calcDistance = calcDistance;
;
function levenPenalty(i) {
    // 1 -> 1
    // cutOff => 0.8
    return i;
    //return   1 -  (1 - i) *0.2/Algol.Cutoff_WordMatch;
}
exports.levenPenalty = levenPenalty;
function nonPrivateKeys(oA) {
    return Object.keys(oA).filter(key => {
        return key[0] !== '_';
    });
}
function countAinB(oA, oB, fnCompare, aKeyIgnore) {
    aKeyIgnore = Array.isArray(aKeyIgnore) ? aKeyIgnore :
        typeof aKeyIgnore === "string" ? [aKeyIgnore] : [];
    fnCompare = fnCompare || function () { return true; };
    return nonPrivateKeys(oA).filter(function (key) {
        return aKeyIgnore.indexOf(key) < 0;
    }).
        reduce(function (prev, key) {
        if (Object.prototype.hasOwnProperty.call(oB, key)) {
            prev = prev + (fnCompare(oA[key], oB[key], key) ? 1 : 0);
        }
        return prev;
    }, 0);
}
exports.countAinB = countAinB;
function spuriousAnotInB(oA, oB, aKeyIgnore) {
    aKeyIgnore = Array.isArray(aKeyIgnore) ? aKeyIgnore :
        typeof aKeyIgnore === "string" ? [aKeyIgnore] : [];
    return nonPrivateKeys(oA).filter(function (key) {
        return aKeyIgnore.indexOf(key) < 0;
    }).
        reduce(function (prev, key) {
        if (!Object.prototype.hasOwnProperty.call(oB, key)) {
            prev = prev + 1;
        }
        return prev;
    }, 0);
}
exports.spuriousAnotInB = spuriousAnotInB;
function lowerCase(o) {
    if (typeof o === "string") {
        return o.toLowerCase();
    }
    return o;
}
function compareContext(oA, oB, aKeyIgnore) {
    var equal = countAinB(oA, oB, function (a, b) { return lowerCase(a) === lowerCase(b); }, aKeyIgnore);
    var different = countAinB(oA, oB, function (a, b) { return lowerCase(a) !== lowerCase(b); }, aKeyIgnore);
    var spuriousL = spuriousAnotInB(oA, oB, aKeyIgnore);
    var spuriousR = spuriousAnotInB(oB, oA, aKeyIgnore);
    return {
        equal: equal,
        different: different,
        spuriousL: spuriousL,
        spuriousR: spuriousR
    };
}
exports.compareContext = compareContext;
function sortByRank(a, b) {
    var r = -((a._ranking || 1.0) - (b._ranking || 1.0));
    if (r) {
        return r;
    }
    if (a.category && b.category) {
        r = a.category.localeCompare(b.category);
        if (r) {
            return r;
        }
    }
    if (a.matchedString && b.matchedString) {
        r = a.matchedString.localeCompare(b.matchedString);
        if (r) {
            return r;
        }
    }
    return 0;
}
function cmpByRank(a, b) {
    return sortByRank(a, b);
}
function sortByRankThenResult(a, b) {
    var r = -((a._ranking || 1.0) - (b._ranking || 1.0));
    if (r) {
        return r;
    }
    if (a.category && b.category) {
        r = a.category.localeCompare(b.category);
        if (r) {
            return r;
        }
    }
    if (a.matchedString && b.matchedString) {
        r = a.matchedString.localeCompare(b.matchedString);
        if (r) {
            return r;
        }
    }
    r = cmpByResultThenRank(a, b);
    if (r) {
        return r;
    }
    return 0;
}
function cmpByResult(a, b) {
    if (a.rule === b.rule) {
        return 0;
    }
    var r = a.rule.bitindex - b.rule.bitindex;
    if (r) {
        return r;
    }
    if (a.rule.matchedString && b.rule.matchedString) {
        r = a.rule.matchedString.localeCompare(b.rule.matchedString);
        if (r) {
            return r;
        }
    }
    if (a.rule.category && b.rule.category) {
        r = a.rule.category.localeCompare(b.rule.category);
        if (r) {
            return r;
        }
    }
    if (a.rule.wordType && b.rule.wordType) {
        r = a.rule.wordType.localeCompare(b.rule.wordType);
        if (r) {
            return r;
        }
    }
    return 0;
}
exports.cmpByResult = cmpByResult;
function cmpByResultThenRank(a, b) {
    var r = cmpByResult(a, b);
    if (r) {
        return r;
    }
    var r = -((a._ranking || 1.0) - (b._ranking || 1.0));
    if (r) {
        return r;
    }
    // TODO consider a tiebreaker here
    return 0;
}
exports.cmpByResultThenRank = cmpByResultThenRank;
function analyseRegexp(res, oRule, string) {
    debuglog(() => " here regexp: " + JSON.stringify(oRule, undefined, 2) + '\n' + oRule.regexp.toString());
    var m = oRule.regexp.exec(string);
    var rec = undefined;
    if (m) {
        rec = {
            string: string,
            matchedString: (oRule.matchIndex !== undefined && m[oRule.matchIndex]) || string,
            rule: oRule,
            category: oRule.category,
            _ranking: oRule._ranking || 1.0
        };
        debuglog(() => "\n!match regexp  " + oRule.regexp.toString() + " " + rec._ranking.toFixed(3) + "  " + string + "=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category);
        res.push(rec);
    }
}
function checkOneRule(string, lcString, exact, res, oRule, cntRec) {
    debuglogV(() => 'attempting to match rule ' + JSON.stringify(oRule) + " to string \"" + string + "\"");
    switch (oRule.type) {
        case mgnlq_model_1.IFModel.EnumRuleType.WORD:
            if (!oRule.lowercaseword) {
                throw new Error('rule without a lowercase variant' + JSON.stringify(oRule, undefined, 2));
            }
            ;
            // TODO CHECK THIS
            if (exact && (oRule.word === string || oRule.lowercaseword === lcString)) {
                //      if (exact && oRule.word === string || oRule.lowercaseword === lcString) {
                debuglog(() => "\n!matched exact " + string + "=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category);
                res.push({
                    string: string,
                    matchedString: oRule.matchedString,
                    category: oRule.category,
                    _ranking: oRule._ranking || 1.0
                });
            }
            if (!exact && !oRule.exactOnly) {
                var levenmatch = calcDistance(oRule.lowercaseword, lcString);
                /*
                          addCntRec(cntRec,"calcDistance", 1);
                          if(levenmatch < 50) {
                            addCntRec(cntRec,"calcDistanceExp", 1);
                          }
                          if(levenmatch < 40000) {
                            addCntRec(cntRec,"calcDistanceBelow40k", 1);
                          }
                          */
                //if(oRule.lowercaseword === "cosmos") {
                //  console.log("here ranking " + levenmatch + " " + oRule.lowercaseword + " " + lcString);
                //}
                if (levenmatch >= Algol.Cutoff_WordMatch) { // levenCutoff) {
                    addCntRec(cntRec, "calcDistanceOk", 1);
                    var rec = {
                        string: string,
                        matchedString: oRule.matchedString,
                        category: oRule.category,
                        _ranking: (oRule._ranking || 1.0) * levenPenalty(levenmatch),
                        levenmatch: levenmatch
                    };
                    debuglog(() => "\n!fuzzy " + (levenmatch).toFixed(3) + " " + rec._ranking.toFixed(3) + "  " + string + "=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category);
                    res.push(rec);
                }
            }
            break;
        case mgnlq_model_1.IFModel.EnumRuleType.REGEXP: {
            analyseRegexp(res, oRule, string);
            break;
        }
        //break;
        default:
            throw new Error("unknown type" + JSON.stringify(oRule, undefined, 2));
    }
}
exports.checkOneRule = checkOneRule;
function checkOneRuleWithOffset(string, lcString, exact, res, oRule, cntRec) {
    debuglogV(() => 'attempting to match rule ' + JSON.stringify(oRule) + " to string \"" + string + "\"");
    switch (oRule.type) {
        case mgnlq_model_1.IFModel.EnumRuleType.WORD:
            if (!oRule.lowercaseword) {
                throw new Error('rule without a lowercase variant' + JSON.stringify(oRule, undefined, 2));
            }
            ;
            if (exact && (oRule.word === string || oRule.lowercaseword === lcString)) {
                debuglog(() => "\n!matched exact " + string + "=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category);
                res.push({
                    string: string,
                    matchedString: oRule.matchedString,
                    category: oRule.category,
                    rule: oRule,
                    _ranking: oRule._ranking || 1.0
                });
            }
            if (!exact && !oRule.exactOnly) {
                var levenmatch = calcDistance(oRule.lowercaseword, lcString);
                /*
                          addCntRec(cntRec,"calcDistance", 1);
                          if(levenmatch < 50) {
                            addCntRec(cntRec,"calcDistanceExp", 1);
                          }
                          if(levenmatch < 40000) {
                            addCntRec(cntRec,"calcDistanceBelow40k", 1);
                          }
                          */
                //if(oRule.lowercaseword === "cosmos") {
                //  console.log("here ranking " + levenmatch + " " + oRule.lowercaseword + " " + lcString);
                //}
                if (levenmatch >= Algol.Cutoff_WordMatch) { // levenCutoff) {
                    //console.log("found rec");
                    addCntRec(cntRec, "calcDistanceOk", 1);
                    var rec = {
                        string: string,
                        rule: oRule,
                        matchedString: oRule.matchedString,
                        category: oRule.category,
                        _ranking: (oRule._ranking || 1.0) * levenPenalty(levenmatch),
                        levenmatch: levenmatch
                    };
                    debuglog(() => "\n!CORO: fuzzy " + (levenmatch).toFixed(3) + " " + rec._ranking.toFixed(3) + "  \"" + string + "\"=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category + "/" + oRule.bitindex);
                    res.push(rec);
                }
            }
            break;
        case mgnlq_model_1.IFModel.EnumRuleType.REGEXP: {
            analyseRegexp(res, oRule, string);
            break;
        }
        //break;
        default:
            throw new Error("unknown type" + JSON.stringify(oRule, undefined, 2));
    }
}
exports.checkOneRuleWithOffset = checkOneRuleWithOffset;
function addCntRec(cntRec, member, number) {
    if ((!cntRec) || (number === 0)) {
        return;
    }
    cntRec[member] = (cntRec[member] || 0) + number;
}
/*
export function categorizeString(word: string, exact: boolean, oRules: Array<IFModel.mRule>,
 cntRec? : ICntRec): Array<IFMatch.ICategorizedString> {
  // simply apply all rules
  debuglogV(() => "rules : " + JSON.stringify(oRules, undefined, 2));

  var lcString = word.toLowerCase();
  var res: Array<IFMatch.ICategorizedString> = []
  oRules.forEach(function (oRule) {
    checkOneRule(word,lcString,exact,res,oRule,cntRec);
  });
  res.sort(sortByRank);
  return res;
}
*/
function categorizeSingleWordWithOffset(word, lcword, exact, oRules, cntRec) {
    // simply apply all rules
    debuglogV(() => "rules : " + JSON.stringify(oRules, undefined, 2));
    var res = [];
    oRules.forEach(function (oRule) {
        checkOneRuleWithOffset(word, lcword, exact, res, oRule, cntRec);
    });
    debuglog(`CSWWO: got results for ${lcword}  ${res.length}`);
    res.sort(sortByRank);
    return res;
}
exports.categorizeSingleWordWithOffset = categorizeSingleWordWithOffset;
/*
export function postFilter(res : Array<IFMatch.ICategorizedString>) : Array<IFMatch.ICategorizedString> {
  res.sort(sortByRank);
  var bestRank = 0;
  //console.log("\npiltered " + JSON.stringify(res));
    debuglog(()=> "preFilter : \n" + res.map(function(word,index) {
      return `${index} ${word._ranking}  => "${word.category}" ${word.matchedString}`;
    }).join("\n"));
  var r = res.filter(function(resx,index) {
    if(index === 0) {
      bestRank = resx._ranking;
      return true;
    }
    // 1-0.9 = 0.1
    // 1- 0.93 = 0.7
    // 1/7
    var delta = bestRank / resx._ranking;
    if((resx.matchedString === res[index-1].matchedString)
      && (resx.category === res[index-1].category)
      ) {
        debuglog('postfilter ignoring bitinidex!!!');
      return false;
    }
    //console.log("\n delta for " + delta + "  " + resx._ranking);
    if (resx.levenmatch && (delta > 1.03)) {
      return false;
    }
    return true;
  });
  debuglog(()=> `\nfiltered ${r.length}/${res.length}` + JSON.stringify(r));
  return r;
}
*/
function dropLowerRankedEqualResult(res) {
    res.sort(cmpByResultThenRank);
    return res.filter(function (resx, index) {
        var prior = res[index - 1];
        if (prior &&
            !(resx.rule && resx.rule.range)
            && !(res[index - 1].rule && res[index - 1].rule.range)
            && (resx.matchedString === prior.matchedString)
            && (resx.rule.bitindex === prior.rule.bitindex)
            && (resx.rule.wordType === prior.rule.wordType)
            && (resx.category === res[index - 1].category)) {
            return false;
        }
        return true;
    });
}
exports.dropLowerRankedEqualResult = dropLowerRankedEqualResult;
function postFilterWithOffset(res) {
    // for filtering, we need to get *equal rule results close together
    // =>
    //
    res.sort(sortByRank);
    var bestRank = 0;
    //console.log("\npiltered " + JSON.stringify(res));
    debuglog(() => " preFilter : \n" + res.map(function (word) {
        return ` ${word._ranking}  => "${word.category}" ${word.matchedString} `;
    }).join("\n"));
    var r = res.filter(function (resx, index) {
        if (index === 0) {
            bestRank = resx._ranking;
            return true;
        }
        // 1-0.9 = 0.1
        // 1- 0.93 = 0.7
        // 1/7
        var delta = bestRank / resx._ranking;
        var prior = res[index - 1];
        if (!(resx.rule && resx.rule.range)
            && !(res[index - 1].rule && res[index - 1].rule.range)
            && (resx.matchedString === prior.matchedString)
            && (resx.rule.bitindex === prior.rule.bitindex)
            && (resx.rule.wordType === prior.rule.wordType)
            && (resx.category === res[index - 1].category)) {
            return false;
        }
        //console.log("\n delta for " + delta + "  " + resx._ranking);
        if (resx.levenmatch && (delta > 1.03)) {
            return false;
        }
        return true;
    });
    r = dropLowerRankedEqualResult(res);
    r.sort(sortByRankThenResult);
    debuglog(() => `\nfiltered ${r.length}/${res.length}` + JSON.stringify(r));
    return r;
}
exports.postFilterWithOffset = postFilterWithOffset;
/*
export function categorizeString2(word: string, exact: boolean,  rules : IFMatch.SplitRules
  , cntRec? : ICntRec): Array<IFMatch.ICategorizedString> {
  // simply apply all rules
  if (debuglogM.enabled )  {
    // TODO thisis ciruclar ! debuglogM("rules : " + JSON.stringify(rules,undefined, 2));
  }
  var u = 1;
  if( u === 1) {
    throw new Error('categorized String2');

  }
  var lcString = word.toLowerCase();
  var res: Array<IFMatch.ICategorizedString> = [];
  if (exact) {
    var r = rules.wordMap[lcString];
    if (r) {
      r.rules.forEach(function(oRule) {
        res.push({
            string: word,
            matchedString: oRule.matchedString,
            category: oRule.category,
            _ranking: oRule._ranking || 1.0
          })
     });
    }
    rules.nonWordRules.forEach(function (oRule) {
      checkOneRule(word,lcString,exact,res,oRule,cntRec);
    });
    res.sort(sortByRank);
    return res;
  } else {
    debuglog(()=>"categorize non exact" + word + " xx  " + rules.allRules.length);
    return postFilter(categorizeString(word, exact, rules.allRules, cntRec));
  }
}
*/
function categorizeWordInternalWithOffsets(word, lcword, exact, rules, cntRec) {
    debuglogM("categorize  CWIWO" + lcword + " with offset!!!!!!!!!!!!!!!!!" + exact);
    // simply apply all rules
    if (debuglogV.enabled) {
        // TODO this is circular: debuglogV("rules : " + JSON.stringify(rules,undefined, 2));
    }
    var res = [];
    if (exact) {
        var r = rules.wordMap[lcword];
        if (r) {
            debuglogM(debuglogM.enabled ? ` ....pushing n rules exact for ${lcword}:` + r.rules.length : '-');
            debuglogM(debuglogM.enabled ? r.rules.map((r, index) => '' + index + ' ' + JSON.stringify(r)).join("\n") : '-');
            r.rules.forEach(function (oRule) {
                res.push({
                    string: word,
                    matchedString: oRule.matchedString,
                    category: oRule.category,
                    rule: oRule,
                    _ranking: oRule._ranking || 1.0
                });
            });
        }
        rules.nonWordRules.forEach(function (oRule) {
            checkOneRuleWithOffset(word, lcword, exact, res, oRule, cntRec);
        });
        res = postFilterWithOffset(res);
        debuglog(() => "here results exact for " + word + " res " + res.length);
        debuglogM(() => "here results exact for " + word + " res " + res.length);
        res.sort(sortByRank);
        return res;
    }
    else {
        debuglog("categorize non exact \"" + word + "\"    " + rules.allRules.length);
        var rr = categorizeSingleWordWithOffset(word, lcword, exact, rules.allRules, cntRec);
        //debulogM("fuzzy res " + JSON.stringify(rr));
        return postFilterWithOffset(rr);
    }
}
exports.categorizeWordInternalWithOffsets = categorizeWordInternalWithOffsets;
/**
 *
 * Options may be {
 * matchothers : true,  => only rules where all others match are considered
 * augment : true,
 * override : true }  =>
 *
 */
function matchWord(oRule, context, options) {
    if (context[oRule.key] === undefined) {
        return undefined;
    }
    var s1 = context[oRule.key].toLowerCase();
    var s2 = oRule.word.toLowerCase();
    options = options || {};
    var delta = compareContext(context, oRule.follows, oRule.key);
    debuglogV(() => JSON.stringify(delta));
    debuglogV(() => JSON.stringify(options));
    if (options.matchothers && (delta.different > 0)) {
        return undefined;
    }
    var c = calcDistance(s2, s1);
    debuglogV(() => " s1 <> s2 " + s1 + "<>" + s2 + "  =>: " + c);
    if (c > 0.80) {
        var res = AnyObject.assign({}, oRule.follows);
        res = AnyObject.assign(res, context);
        if (options.override) {
            res = AnyObject.assign(res, oRule.follows);
        }
        // force key property
        // console.log(' objectcategory', res['systemObjectCategory']);
        res[oRule.key] = oRule.follows[oRule.key] || res[oRule.key];
        res._weight = AnyObject.assign({}, res._weight);
        res._weight[oRule.key] = c;
        Object.freeze(res);
        debuglog(() => 'Found one' + JSON.stringify(res, undefined, 2));
        return res;
    }
    return undefined;
}
exports.matchWord = matchWord;
function extractArgsMap(match, argsMap) {
    var res = {};
    if (!argsMap) {
        return res;
    }
    Object.keys(argsMap).forEach(function (iKey) {
        var value = match[iKey];
        var key = argsMap[iKey];
        if ((typeof value === "string") && value.length > 0) {
            res[key] = value;
        }
    });
    return res;
}
exports.extractArgsMap = extractArgsMap;
exports.RankWord = {
    hasAbove: function (lst, border) {
        return !lst.every(function (oMember) {
            return (oMember._ranking < border);
        });
    },
    takeFirstN: function (lst, n) {
        var lastRanking = 1.0;
        var cntRanged = 0;
        return lst.filter(function (oMember, iIndex) {
            var isRanged = !!(oMember["rule"] && oMember["rule"].range);
            if (isRanged) {
                cntRanged += 1;
                return true;
            }
            if (((iIndex - cntRanged) < n) || (oMember._ranking === lastRanking)) {
                lastRanking = oMember._ranking;
                return true;
            }
            return false;
        });
    },
    takeAbove: function (lst, border) {
        return lst.filter(function (oMember) {
            return (oMember._ranking >= border);
        });
    }
};
/*
var exactLen = 0;
var fuzzyLen = 0;
var fuzzyCnt = 0;
var exactCnt = 0;
var totalCnt = 0;
var totalLen = 0;
var retainedCnt = 0;

export function resetCnt() {
  exactLen = 0;
  fuzzyLen = 0;
  fuzzyCnt = 0;
  exactCnt = 0;
  totalCnt = 0;
  totalLen = 0;
  retainedCnt = 0;
}
*/
/*
export function categorizeWordWithRankCutoff(sWordGroup: string, splitRules : IMatch.SplitRules , cntRec? : ICntRec ): Array<IFMatch.ICategorizedString> {
  debuglog('cwwrc' + sWordGroup)
  console.log('cwwrc called');
  var u = 1;
  var seenIt = categorizeString2(sWordGroup, true, splitRules, cntRec);
  //totalCnt += 1;
  // exactLen += seenIt.length;
  addCntRec(cntRec, 'cntCatExact', 1);
  addCntRec(cntRec, 'cntCatExactRes', seenIt.length);

  if (RankWord.hasAbove(seenIt, 0.8)) {
    if(cntRec) {
      addCntRec(cntRec, 'exactPriorTake', seenIt.length)
    }
    seenIt = RankWord.takeAbove(seenIt, 0.8);
    if(cntRec) {
      addCntRec(cntRec, 'exactAfterTake', seenIt.length)
    }
   // exactCnt += 1;
  } else {
    seenIt = categorizeString2(sWordGroup, false, splitRules, cntRec);
    addCntRec(cntRec, 'cntNonExact', 1);
    addCntRec(cntRec, 'cntNonExactRes', seenIt.length);
  //  fuzzyLen += seenIt.length;
  //  fuzzyCnt += 1;
  }
 // totalLen += seenIt.length;
  seenIt = RankWord.takeFirstN(seenIt, Algol.Top_N_WordCategorizations);
 // retainedCnt += seenIt.length;
  return seenIt;
}
*/
/* if we have a  "Run like the Wind"
  an a user type fun like  a Rind , and Rind is an exact match,
  we will not start looking for the long sentence

  this is to be fixed by "spreading" the range indication accross very similar words in the vincinity of the
  target words
*/
function categorizeWordWithOffsetWithRankCutoff(sWordGroup, splitRules, cntRec) {
    var sWordGroupLC = sWordGroup.toLowerCase();
    var seenIt = categorizeWordInternalWithOffsets(sWordGroup, sWordGroupLC, true, splitRules, cntRec);
    //console.log("SEENIT" + JSON.stringify(seenIt));
    //totalCnt += 1;
    // exactLen += seenIt.length;
    //console.log("first run exact " + JSON.stringify(seenIt));
    addCntRec(cntRec, 'cntCatExact', 1);
    addCntRec(cntRec, 'cntCatExactRes', seenIt.length);
    if (exports.RankWord.hasAbove(seenIt, 0.8)) {
        if (cntRec) {
            addCntRec(cntRec, 'exactPriorTake', seenIt.length);
        }
        seenIt = exports.RankWord.takeAbove(seenIt, 0.8);
        if (cntRec) {
            addCntRec(cntRec, 'exactAfterTake', seenIt.length);
        }
        // exactCnt += 1;
    }
    else {
        seenIt = categorizeWordInternalWithOffsets(sWordGroup, sWordGroupLC, false, splitRules, cntRec);
        addCntRec(cntRec, 'cntNonExact', 1);
        addCntRec(cntRec, 'cntNonExactRes', seenIt.length);
        //  fuzzyLen += seenIt.length;
        //  fuzzyCnt += 1;
    }
    // totalLen += seenIt.length;
    debuglog(() => (`${seenIt.length} with ${seenIt.reduce((prev, obj) => prev + (obj.rule.range ? 1 : 0), 0)} ranged !`));
    //  var cntRanged = seenIt.reduce( (prev,obj) => prev + (obj.rule.range ? 1 : 0),0);
    //  console.log(`*********** ${seenIt.length} with ${cntRanged} ranged !`);
    seenIt = exports.RankWord.takeFirstN(seenIt, Algol.Top_N_WordCategorizations);
    // retainedCnt += seenIt.length;
    //console.log("final res of categorizeWordWithOffsetWithRankCutoff" + JSON.stringify(seenIt));
    return seenIt;
}
exports.categorizeWordWithOffsetWithRankCutoff = categorizeWordWithOffsetWithRankCutoff;
function categorizeWordWithOffsetWithRankCutoffSingle(word, rule) {
    var lcword = word.toLowerCase();
    if (lcword === rule.lowercaseword) {
        return {
            string: word,
            matchedString: rule.matchedString,
            category: rule.category,
            rule: rule,
            _ranking: rule._ranking || 1.0
        };
    }
    var res = [];
    checkOneRuleWithOffset(word, lcword, false, res, rule);
    debuglog("catWWOWRCS " + lcword);
    if (res.length) {
        return res[0];
    }
    return undefined;
}
exports.categorizeWordWithOffsetWithRankCutoffSingle = categorizeWordWithOffsetWithRankCutoffSingle;
/*
export function filterRemovingUncategorizedSentence(oSentence: IFMatch.ICategorizedString[][]): boolean {
  return oSentence.every(function (oWordGroup) {
    return (oWordGroup.length > 0);
  });
}



export function filterRemovingUncategorized(arr: IFMatch.ICategorizedString[][][]): IFMatch.ICategorizedString[][][] {
  return arr.filter(function (oSentence) {
    return filterRemovingUncategorizedSentence(oSentence);
  });
}
*/
function categorizeAWord(sWordGroup, rules, sentence, words, cntRec) {
    return categorizeAWordWithOffsets(sWordGroup, rules, sentence, words).filter(r => !r.span && !r.rule.range);
    /* consider removing the ranged stuff  */
    /*
      var seenIt = words[sWordGroup];
      if (seenIt === undefined) {
        //seenIt = categorizeWordWithRankCutoff(sWordGroup, rules, cntRec);
        seenIt = categorizeWordWithOffsetWithRankCutoff(sWordGroup,rules,cntRec);
        utils.deepFreeze(seenIt);
        words[sWordGroup] = seenIt;
      }
      if (!seenIt || seenIt.length === 0) {
        logger("***WARNING: Did not find any categorization for \"" + sWordGroup + "\" in sentence \""
          + sentence + "\"");
        if (sWordGroup.indexOf(" ") <= 0) {
          debuglog("***WARNING: Did not find any categorization for primitive (!)" + sWordGroup);
        }
        debuglog("***WARNING: Did not find any categorization for " + sWordGroup);
        if (!seenIt) {
          throw new Error("Expecting emtpy list, not undefined for \"" + sWordGroup + "\"")
        }
        words[sWordGroup] = []
        return [];
      }
      return utils.cloneDeep(seenIt);
      */
}
exports.categorizeAWord = categorizeAWord;
/**
 * Given a  string, break it down into components,
 * [['A', 'B'], ['A B']]
 *
 * then categorizeWords
 * returning
 *
 * [ [[ { category: 'systemId', word : 'A'},
 *      { category: 'otherthing', word : 'A'}
 *    ],
 *    // result of B
 *    [ { category: 'systemId', word : 'B'},
 *      { category: 'otherthing', word : 'A'}
 *      { category: 'anothertryp', word : 'B'}
 *    ]
 *   ],
 * ]]]
 *
 *
 *
 */
/*
export function analyzeString(sString: string, rules: IMatch.SplitRules,
  words?: { [key: string]: Array<IFMatch.ICategorizedString> })
  : [ [ IMatch.ICategorizedString[]] ]
   {
  var cnt = 0;
  var fac = 1;
  if(cnt === 0) {
    throw Error('use processStrign2');
  }
  var u = breakdown.breakdownString(sString, Algol.MaxSpacesPerCombinedWord);
  debuglog(()=>"here breakdown" + JSON.stringify(u));
  //console.log(JSON.stringify(u));
  words = words || {};
  debugperf(()=>'this many known words: ' + Object.keys(words).length);
  var res = [] as [[ IMatch.ICategorizedString[]] ];
  var cntRec = {};
  u.forEach(function (aBreakDownSentence) {
      var categorizedSentence = [] as [ IMatch.ICategorizedString[] ];
      var isValid = aBreakDownSentence.every(function (sWordGroup: string, index : number) {
        var seenIt = categorizeAWord(sWordGroup, rules, sString, words, cntRec);
        if(seenIt.length === 0) {
          return false;
        }
        categorizedSentence[index] = seenIt;
        cnt = cnt + seenIt.length;
        fac = fac * seenIt.length;
        return true;
      });
      if(isValid) {
        res.push(categorizedSentence);
      }
  });
  debuglog(()=>" sentences " + u.length + " matches " + cnt + " fac: " + fac);
  debuglog( ()=> "first match "+ JSON.stringify(u,undefined,2));
  debugperf(()=> " sentences " + u.length + " / " + res.length +  " matches " + cnt + " fac: " + fac + " rec : " + JSON.stringify(cntRec,undefined,2));
  return res;
}
*/
/**
 * This is the main entry point for word categorization,
 * If sentence is supplied it will be used
 * @param sWordGroup a single word, g.e. "earth" or a combination "UI5 Component"
 *  The word will *not* be broken down here, but diretyl matched against  rules
 * @param rules rule index
 * @param sentence optional, only for debugging
 * @param words
 * @param cntRec
 */
function categorizeAWordWithOffsets(sWordGroup, rules, sentence, words, cntRec) {
    var seenIt = words[sWordGroup];
    if (seenIt === undefined) {
        seenIt = categorizeWordWithOffsetWithRankCutoff(sWordGroup, rules, cntRec);
        utils.deepFreeze(seenIt);
        words[sWordGroup] = seenIt;
    }
    if (!seenIt || seenIt.length === 0) {
        logger("***WARNING: Did not find any categorization for \"" + sWordGroup + "\" in sentence \""
            + sentence + "\"");
        if (sWordGroup.indexOf(" ") <= 0) {
            debuglog(() => "***WARNING: Did not find any categorization for primitive (!)" + sWordGroup);
        }
        debuglog(() => "***WARNING: Did not find any categorization for " + sWordGroup);
        if (!seenIt) {
            throw new Error("Expecting emtpy list, not undefined for \"" + sWordGroup + "\"");
        }
        words[sWordGroup] = [];
        return [];
    }
    return utils.cloneDeep(seenIt);
}
exports.categorizeAWordWithOffsets = categorizeAWordWithOffsets;
/*
[ [a,b], [c,d]]

00 a
01 b
10 c
11 d
12 c
*/
const clone = utils.cloneDeep;
function copyVecMembers(u) {
    var i = 0;
    for (i = 0; i < u.length; ++i) {
        u[i] = clone(u[i]);
    }
    return u;
}
// we can replicate the tail or the head,
// we replicate the tail as it is smaller.
// [a,b,c ]
function expandMatchArr(deep) {
    var a = [];
    var line = [];
    debuglog(() => JSON.stringify(deep));
    deep.forEach(function (uBreakDownLine, iIndex) {
        line[iIndex] = [];
        uBreakDownLine.forEach(function (aWordGroup, wgIndex) {
            line[iIndex][wgIndex] = [];
            aWordGroup.forEach(function (oWordVariant, iWVIndex) {
                line[iIndex][wgIndex][iWVIndex] = oWordVariant;
            });
        });
    });
    debuglog(debuglog.enabled ? JSON.stringify(line) : '-');
    var res = [];
    var nvecs = [];
    for (var i = 0; i < line.length; ++i) {
        var vecs = [[]];
        var nvecs = [];
        var rvec = [];
        for (var k = 0; k < line[i].length; ++k) { // wordgroup k
            //vecs is the vector of all so far seen variants up to k wgs.
            var nextBase = [];
            for (var l = 0; l < line[i][k].length; ++l) { // for each variant
                //debuglog("vecs now" + JSON.stringify(vecs));
                nvecs = []; //vecs.slice(); // copy the vec[i] base vector;
                //debuglog("vecs copied now" + JSON.stringify(nvecs));
                for (var u = 0; u < vecs.length; ++u) {
                    nvecs[u] = vecs[u].slice(); //
                    nvecs[u] = copyVecMembers(nvecs[u]);
                    // debuglog("copied vecs["+ u+"]" + JSON.stringify(vecs[u]));
                    nvecs[u].push(clone(line[i][k][l])); // push the lth variant
                    // debuglog("now nvecs " + nvecs.length + " " + JSON.stringify(nvecs));
                }
                //   debuglog(" at     " + k + ":" + l + " nextbase >" + JSON.stringify(nextBase))
                //   debuglog(" append " + k + ":" + l + " nvecs    >" + JSON.stringify(nvecs))
                nextBase = nextBase.concat(nvecs);
                //   debuglog("  result " + k + ":" + l + " nvecs    >" + JSON.stringify(nextBase))
            } //constru
            //  debuglog("now at " + k + ":" + l + " >" + JSON.stringify(nextBase))
            vecs = nextBase;
        }
        debuglogV(debuglogV.enabled ? ("APPENDING TO RES3#" + i + ":" + l + " >" + JSON.stringify(nextBase)) : '-');
        res = res.concat(vecs);
    }
    return res;
}
exports.expandMatchArr = expandMatchArr;
/**
 * Calculate a weight factor for a given distance and
 * category
 * @param {integer} dist distance in words
 * @param {string} category category to use
 * @returns {number} a distance factor >= 1
 *  1.0 for no effect
 */
function reinforceDistWeight(dist, category) {
    var abs = Math.abs(dist);
    return 1.0 + (Algol.aReinforceDistWeight[abs] || 0);
}
exports.reinforceDistWeight = reinforceDistWeight;
/**
 * Given a sentence, extact categories
 */
function extractCategoryMap(oSentence) {
    var res = {};
    debuglog(debuglog.enabled ? ('extractCategoryMap ' + JSON.stringify(oSentence)) : '-');
    oSentence.forEach(function (oWord, iIndex) {
        if (oWord.category === IFMatch.CAT_CATEGORY) {
            res[oWord.matchedString] = res[oWord.matchedString] || [];
            res[oWord.matchedString].push({ pos: iIndex });
        }
    });
    utils.deepFreeze(res);
    return res;
}
exports.extractCategoryMap = extractCategoryMap;
function reinForceSentence(oSentence) {
    "use strict";
    var oCategoryMap = extractCategoryMap(oSentence);
    oSentence.forEach(function (oWord, iIndex) {
        var m = oCategoryMap[oWord.category] || [];
        m.forEach(function (oPosition) {
            "use strict";
            oWord.reinforce = oWord.reinforce || 1;
            var boost = reinforceDistWeight(iIndex - oPosition.pos, oWord.category);
            oWord.reinforce *= boost;
            oWord._ranking *= boost;
        });
    });
    oSentence.forEach(function (oWord, iIndex) {
        if (iIndex > 0) {
            if (oSentence[iIndex - 1].category === "meta" && (oWord.category === oSentence[iIndex - 1].matchedString)) {
                oWord.reinforce = oWord.reinforce || 1;
                var boost = reinforceDistWeight(1, oWord.category);
                oWord.reinforce *= boost;
                oWord._ranking *= boost;
            }
        }
    });
    return oSentence;
}
exports.reinForceSentence = reinForceSentence;
const Sentence = require("./sentence");
function reinForce(aCategorizedArray) {
    "use strict";
    aCategorizedArray.forEach(function (oSentence) {
        reinForceSentence(oSentence);
    });
    aCategorizedArray.sort(Sentence.cmpRankingProduct);
    debuglog(() => "after reinforce" + aCategorizedArray.map(function (oSentence) {
        return Sentence.rankingProduct(oSentence) + ":" + JSON.stringify(oSentence);
    }).join("\n"));
    return aCategorizedArray;
}
exports.reinForce = reinForce;
/// below may no longer be used
function matchRegExp(oRule, context, options) {
    if (context[oRule.key] === undefined) {
        return undefined;
    }
    var sKey = oRule.key;
    var s1 = context[oRule.key].toLowerCase();
    var reg = oRule.regexp;
    var m = reg.exec(s1);
    if (debuglogV.enabled) {
        debuglogV("applying regexp: " + s1 + " " + JSON.stringify(m));
    }
    if (!m) {
        return undefined;
    }
    options = options || {};
    var delta = compareContext(context, oRule.follows, oRule.key);
    debuglogV(() => JSON.stringify(delta));
    debuglogV(() => JSON.stringify(options));
    if (options.matchothers && (delta.different > 0)) {
        return undefined;
    }
    var oExtractedContext = extractArgsMap(m, oRule.argsMap);
    debuglogV(() => "extracted args " + JSON.stringify(oRule.argsMap));
    debuglogV(() => "match " + JSON.stringify(m));
    debuglogV(() => "extracted args " + JSON.stringify(oExtractedContext));
    var res = AnyObject.assign({}, oRule.follows);
    res = AnyObject.assign(res, oExtractedContext);
    res = AnyObject.assign(res, context);
    if (oExtractedContext[sKey] !== undefined) {
        res[sKey] = oExtractedContext[sKey];
    }
    if (options.override) {
        res = AnyObject.assign(res, oRule.follows);
        res = AnyObject.assign(res, oExtractedContext);
    }
    Object.freeze(res);
    debuglog(debuglog.enabled ? ('Found one' + JSON.stringify(res, undefined, 2)) : '-');
    return res;
}
exports.matchRegExp = matchRegExp;
function sortByWeight(sKey, oContextA, oContextB) {
    debuglogV(() => 'sorting: ' + sKey + 'invoked with\n 1:' + JSON.stringify(oContextA, undefined, 2) +
        " vs \n 2:" + JSON.stringify(oContextB, undefined, 2));
    var rankingA = parseFloat(oContextA["_ranking"] || "1");
    var rankingB = parseFloat(oContextB["_ranking"] || "1");
    if (rankingA !== rankingB) {
        debuglog(() => " rankin delta" + 100 * (rankingB - rankingA));
        return 100 * (rankingB - rankingA);
    }
    var weightA = oContextA["_weight"] && oContextA["_weight"][sKey] || 0;
    var weightB = oContextB["_weight"] && oContextB["_weight"][sKey] || 0;
    return +(weightB - weightA);
}
exports.sortByWeight = sortByWeight;
// Word, Synonym, Regexp / ExtractionRule
function augmentContext1(context, oRules, options) {
    var sKey = oRules[0].key;
    // check that rule
    if (debuglog.enabled) {
        // check consistency
        oRules.every(function (iRule) {
            if (iRule.key !== sKey) {
                throw new Error("Inhomogenous keys in rules, expected " + sKey + " was " + JSON.stringify(iRule));
            }
            return true;
        });
    }
    // look for rules which match
    var res = oRules.map(function (oRule) {
        // is this rule applicable
        switch (oRule.type) {
            case mgnlq_model_1.IFModel.EnumRuleType.WORD:
                return matchWord(oRule, context, options);
            case mgnlq_model_1.IFModel.EnumRuleType.REGEXP:
                return matchRegExp(oRule, context, options);
            //   case "Extraction":
            //     return matchExtraction(oRule,context);
        }
        return undefined;
    }).filter(function (ores) {
        return !!ores;
    }).sort(sortByWeight.bind(this, sKey));
    //debuglog("hassorted" + JSON.stringify(res,undefined,2));
    return res;
    // Object.keys().forEach(function (sKey) {
    // });
}
exports.augmentContext1 = augmentContext1;
function augmentContext(context, aRules) {
    var options1 = {
        matchothers: true,
        override: false
    };
    var aRes = augmentContext1(context, aRules, options1);
    if (aRes.length === 0) {
        var options2 = {
            matchothers: false,
            override: true
        };
        aRes = augmentContext1(context, aRules, options2);
    }
    return aRes;
}
exports.augmentContext = augmentContext;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRGaWx0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWF0Y2gvaW5wdXRGaWx0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7OztHQWVHO0FBQ0gsNkNBQTZDO0FBQzdDLDRDQUE0QztBQUU1Qyw0Q0FBNEM7QUFFNUMsOENBQThDO0FBRTlDLGdDQUFnQztBQUNoQyxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFFeEMsNkNBQStDO0FBQy9DLG9DQUFvQztBQUVwQywrQ0FBK0M7QUFHL0MseURBQXlEO0FBRXpELGlDQUFpQztBQUVqQyxzQ0FBc0M7QUFLdEMsTUFBTSxTQUFTLEdBQVEsTUFBTSxDQUFDO0FBRTlCLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUNuQyxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUE7QUFDckMsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFBO0FBRXJDLFNBQWdCLFNBQVMsQ0FBQyxDQUFDO0lBQ3pCLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFDYixTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsU0FBUyxHQUFHLENBQUMsQ0FBQztBQUNoQixDQUFDO0FBSkQsOEJBSUM7QUFHRDs7Ozs7R0FLRztBQUNILFNBQWdCLFlBQVksQ0FBQyxNQUFjLEVBQUUsTUFBYztJQUN6RCxPQUFPLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUZELG9DQUVDO0FBSUEsQ0FBQztBQXFCRixTQUFnQixZQUFZLENBQUMsQ0FBUztJQUNwQyxTQUFTO0lBQ1QsZ0JBQWdCO0lBQ2hCLE9BQU8sQ0FBQyxDQUFDO0lBQ1Qsb0RBQW9E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