"use strict";
/**
 *
 * @module jfseb.erbase
 * @file erbase
 * @copyright (c) 2016 Gerd Forstmann
 *
 * Basic domain based entity recognition
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processString2 = exports.filterReverseNonSameInterpretations = exports.filterBadOperatorArgs = exports.filterNonSameInterpretations = exports.isDistinctInterpretationForSameOLD = exports.isNonOptimalDistinctSourceForSame = exports.isBadOperatorArgs = exports.isSameCategoryAndHigherMatch = exports.isDistinctInterpretationForSame = exports.findCloseIdenticals = exports.processString = exports.expandTokenMatchesToSentences2 = exports.isSuccessorOperator = exports.makeAnyWord = exports.expandTokenMatchesToSentences = exports.isSpanVec = exports.evaluateRangeRulesToPosition = exports.mergeIgnoreOrAppend = exports.isSameRes = exports.tokenizeString = exports.mockDebug = void 0;
const WordMatch = require("./inputFilter");
const CharSequence = require("./charsequence");
const debug = require("debugf");
var debuglog = debug('erbase');
var debuglogV = debug('erVbase');
var perflog = debug('perf');
const mgnlq_model_1 = require("mgnlq_model");
const ERError = require("./ererror");
const AnyObject = Object;
function mockDebug(o) {
    debuglog = o;
    debuglogV = o;
    perflog = o;
}
exports.mockDebug = mockDebug;
const utils = require("abot_utils");
const mgnlq_model_2 = require("mgnlq_model");
const Sentence = require("./sentence");
const Word = require("./word");
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
function tokenizeString(sString, rules, words) {
    var cnt = 0;
    var fac = 1;
    var tokens = mgnlq_model_1.BreakDown.tokenizeString(sString);
    if (debuglog.enabled) {
        debuglog("here breakdown" + JSON.stringify(tokens));
    }
    //console.log(JSON.stringify(u));
    words = words || {};
    perflog('this many known words: ' + Object.keys(words).length);
    var res = [];
    var cntRec = {};
    var categorizedSentence = [];
    var hasRecombined = false;
    tokens.tokens.forEach(function (token, index) {
        var seenIt = WordMatch.categorizeAWordWithOffsets(token, rules, sString, words, cntRec);
        /* cannot have this, or need to add all fragment words "UI2 Integration"  if(seenIt.length === 0) {
              return false;
            }
        */
        hasRecombined = hasRecombined || !seenIt.every(res => !res.rule.range);
        debuglogV(debuglogV.enabled ? (` categorized ${token}/${index} to ` + JSON.stringify(seenIt))
            : "-");
        debuglog(debuglog.enabled ? (` categorized ${token}/${index} to ` +
            seenIt.map((it, idx) => { return ` ${idx}  ${it.rule.matchedString}/${it.rule.category}  ${it.rule.wordType}${it.rule.bitindex} `; }).join("\n"))
            : "-");
        categorizedSentence[index] = seenIt;
        cnt = cnt + seenIt.length;
        fac = fac * seenIt.length;
    });
    // have seen the plain categorization,
    debuglog(" sentences " + tokens.tokens.length + " matches " + cnt + " fac: " + fac);
    if (debuglog.enabled && tokens.tokens.length) {
        debuglog("first match " + JSON.stringify(tokens, undefined, 2));
    }
    debuglog(debuglog.enabled ? ` prior RangeRule ${JSON.stringify(categorizedSentence)} ` : '-');
    if (hasRecombined) {
        evaluateRangeRulesToPosition(tokens.tokens, tokens.fusable, categorizedSentence);
    }
    debuglog(debuglog.enabled ? ` after RangeRule ${JSON.stringify(categorizedSentence)} ` : '-');
    perflog(" sentences " + tokens.tokens.length + " / " + res.length + " matches " + cnt + " fac: " + fac + " rec : " + JSON.stringify(cntRec, undefined, 2));
    return {
        fusable: tokens.fusable,
        tokens: tokens.tokens,
        categorizedWords: categorizedSentence
    };
}
exports.tokenizeString = tokenizeString;
function isSameRes(present, res) {
    if (!((present.rule.matchedString === res.rule.matchedString)
        && (present.rule.category === res.rule.category)
        && (present.span === res.span)
        && (present.rule.bitindex === res.rule.bitindex))) {
        return 0;
    }
    if (present._ranking < res._ranking) {
        return -1;
    }
    return +1;
}
exports.isSameRes = isSameRes;
function mergeIgnoreOrAppend(result, res) {
    var insertindex = -1;
    var foundNothing = result.every((present, index) => {
        var r = isSameRes(present, res);
        if (r < 0) {
            //console.log("overwriting worse \n" + JSON.stringify(res) + '\n' + JSON.stringify(present)+ '\n');
            result[index] = res;
            return false;
        }
        else if (r > 0) {
            //console.log('skipping present');
            return false;
        }
        return true;
    });
    if (foundNothing) {
        //debulog('pushing');
        result.push(res);
    }
}
exports.mergeIgnoreOrAppend = mergeIgnoreOrAppend;
function evaluateRangeRulesToPosition(tokens, fusable, categorizedWords) {
    debuglog(debuglog.enabled ? ("evaluateRangeRulesToPosition... " + JSON.stringify(categorizedWords)) : '-');
    categorizedWords.forEach(function (wordlist, index) {
        wordlist.forEach(function (word) {
            if (word.rule.range) {
                //console.log(` got targetindex for RangeRules evaluation : ${targetIndex} ${index} ${fusable.join(" ")}`);
                var targetIndex = mgnlq_model_1.BreakDown.isCombinableRangeReturnIndex(word.rule.range, fusable, index);
                //console.log(` got targetindex for RangeRules evaluation : ${targetIndex}`);
                if (targetIndex >= 0) {
                    var combinedWord = mgnlq_model_1.BreakDown.combineTokens(word.rule.range, index, tokens);
                    debuglog(debuglog.enabled ? (` test "${combinedWord}" against "${word.rule.range.rule.lowercaseword}" ${JSON.stringify(word.rule.range.rule)}`) : '-');
                    var res = WordMatch.categorizeWordWithOffsetWithRankCutoffSingle(combinedWord, word.rule.range.rule);
                    debuglog(debuglog.enabled ? (" got res : " + JSON.stringify(res)) : '-');
                    if (res) {
                        res.span = word.rule.range.high - word.rule.range.low + 1;
                        categorizedWords[targetIndex] = categorizedWords[targetIndex].slice(0); // avoid invalidation of seenit
                        debuglog(`pushed sth at ${targetIndex}`);
                        mergeIgnoreOrAppend(categorizedWords[targetIndex], res);
                        //         categorizedWords[targetIndex].push(res); // check that this does not invalidate seenit!
                    }
                }
            }
        });
    });
    // filter all range rules !
    categorizedWords.forEach(function (wordlist, index) {
        categorizedWords[index] = wordlist.filter(word => !word.rule.range);
    });
}
exports.evaluateRangeRulesToPosition = evaluateRangeRulesToPosition;
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
function isSpanVec(vec, index) {
    var effectivelen = vec.reduce((prev, mem) => prev += mem.span ? mem.span : 1, 0);
    return effectivelen > index;
}
exports.isSpanVec = isSpanVec;
/**
 * expand an array [[a1,a2], [b1,b2],[c]]
 * into all combinations
 *
 *  if a1 has a span of three, the variations of the lower layer are skipped
 *
 * with the special property
 */
function expandTokenMatchesToSentences(tokens, tokenMatches) {
    return expandTokenMatchesToSentences2(tokens, tokenMatches);
}
exports.expandTokenMatchesToSentences = expandTokenMatchesToSentences;
/*
export function expandTokenMatchesToSentences(tokens: string[], tokenMatches: Array<Array<any>>): IMatch.IProcessedSentences {
 var a = [];
 var wordMatches = [];
 debuglogV(debuglog.enabled ? JSON.stringify(tokenMatches) : '-');
 tokenMatches.forEach(function (aWordMatches, wordIndex: number) {
   wordMatches[wordIndex] = [];
   aWordMatches.forEach(function (oWordVariant, wordVariantIndex: number) {
     wordMatches[wordIndex][wordVariantIndex] = oWordVariant;
   });
 });
 debuglog(debuglog.enabled ? JSON.stringify(tokenMatches) : '-');
 var result = {
   errors: [],
   tokens: tokens,
   sentences: []
 } as IMatch.IProcessedSentences;
 var nvecs = [];
 var res = [[]];
 // var nvecs = [];
 var rvec = [];
 for (var tokenIndex = 0; tokenIndex < tokenMatches.length; ++tokenIndex) { // wordg index k
   //vecs is the vector of all so far seen variants up to k length.
   var nextBase = [];
   //independent of existence of matches on level k, we retain all vectors which are covered by a span
   // we skip extending them below
   for (var u = 0; u < res.length; ++u) {
     if (isSpanVec(res[u], tokenIndex)) {
       nextBase.push(res[u]);
     }
   }
   var lenMatches = tokenMatches[tokenIndex].length;
   if (nextBase.length === 0 && lenMatches === 0) {
     // the word at index I cannot be understood
     //if (result.errors.length === 0) {
     result.errors.push(ERError.makeError_NO_KNOWN_WORD(tokenIndex, tokens));
     //}
   }
   for (var l = 0; l < lenMatches; ++l) { // for each variant present at index k
     //debuglog("vecs now" + JSON.stringify(vecs));
     var nvecs = []; //vecs.slice(); // copy the vec[i] base vector;
     //debuglog("vecs copied now" + JSON.stringify(nvecs));
     for (var u = 0; u < res.length; ++u) {
       if (!isSpanVec(res[u], tokenIndex)) {
         // for each so far constructed result (of length k) in res
         nvecs.push(res[u].slice()); // make a copy of each vector
         nvecs[nvecs.length - 1] = copyVecMembers(nvecs[nvecs.length - 1]);
         // debuglog("copied vecs["+ u+"]" + JSON.stringify(vecs[u]));
         nvecs[nvecs.length - 1].push(
           clone(tokenMatches[tokenIndex][l])); // push the lth variant
         // debuglog("now nvecs " + nvecs.length + " " + JSON.stringify(nvecs));
       }
     }
     //   debuglog(" at     " + k + ":" + l + " nextbase >" + JSON.stringify(nextBase))
     //   debuglog(" append " + k + ":" + l + " nvecs    >" + JSON.stringify(nvecs))
     nextBase = nextBase.concat(nvecs);
     //   debuglog("  result " + k + ":" + l + " nvecs    >" + JSON.stringify(nextBase))
   } //constru
   //  debuglog("now at " + k + ":" + l + " >" + JSON.stringify(nextBase))
   res = nextBase;
 }
 debuglogV(debuglogV.enabled ? ("APPENDING TO RES2#" + 0 + ":" + l + " >" + JSON.stringify(nextBase)) : '-');
 result.sentences = res;
 return result;
}

*/
// todo: bitindex
function makeAnyWord(token) {
    return { string: token,
        matchedString: token,
        category: 'any',
        rule: { category: 'any',
            type: 0,
            word: token,
            lowercaseword: token.toLowerCase(),
            matchedString: token,
            exactOnly: true,
            bitindex: 4096,
            bitSentenceAnd: 4095,
            wordType: 'A',
            _ranking: 0.9 },
        _ranking: 0.9
    };
}
exports.makeAnyWord = makeAnyWord;
function isSuccessorOperator(res, tokenIndex) {
    if (tokenIndex === 0) {
        return false;
    }
    if (res[res.length - 1].rule && res[res.length - 1].rule.wordType === 'O') {
        if (mgnlq_model_2.IFModel.aAnySuccessorOperatorNames.indexOf(res[res.length - 1].rule.matchedString) >= 0) {
            debuglog(() => ' isSuccessorOperator' + JSON.stringify(res[res.length - 1]));
            return true;
        }
    }
    return false;
}
exports.isSuccessorOperator = isSuccessorOperator;
/**
 * expand an array [[a1,a2], [b1,b2],[c]]
 * into all combinations
 *
 *  if a1 has a span of three, the variations of the lower layer are skipped
 *
 * with the special property
 */
function expandTokenMatchesToSentences2(tokens, tokenMatches) {
    var a = [];
    var wordMatches = [];
    debuglogV(debuglog.enabled ? JSON.stringify(tokenMatches) : '-');
    tokenMatches.forEach(function (aWordMatches, wordIndex) {
        wordMatches[wordIndex] = [];
        aWordMatches.forEach(function (oWordVariant, wordVariantIndex) {
            wordMatches[wordIndex][wordVariantIndex] = oWordVariant;
        });
    });
    debuglog(debuglog.enabled ? JSON.stringify(tokenMatches) : '-');
    var result = {
        errors: [],
        tokens: tokens,
        sentences: []
    };
    var nvecs = [];
    var res = [[]];
    // var nvecs = [];
    var rvec = [];
    for (var tokenIndex = 0; tokenIndex < tokenMatches.length; ++tokenIndex) { // wordg index k
        //vecs is the vector of all so far seen variants up to tokenIndex length.
        var nextBase = [];
        // independent of existence of matches on level k, we retain all vectors which are covered by a span
        // we skip extending them below
        for (var u = 0; u < res.length; ++u) {
            if (isSpanVec(res[u], tokenIndex)) {
                nextBase.push(res[u]);
            }
            else if (isSuccessorOperator(res[u], tokenIndex)) {
                res[u].push(makeAnyWord(tokens[tokenIndex]));
                nextBase.push(res[u]);
            }
        }
        // independent of existence of matches on level tokenIndex, we extend all vectors which
        // are a successor of a binary extending op ( like "starting with", "containing" with the next token)
        /*   for(var resIndex = 0; resIndex < res.length; ++resIndex) {
          if (isSuccessorOperator(res[resIndex], tokenIndex)) {
            res[resIndex].push(makeAnyWord(tokens[tokenIndex]));
            nextBase.push(res[resIndex]);
          }
        }
        */
        var lenMatches = tokenMatches[tokenIndex].length;
        if (nextBase.length === 0 && lenMatches === 0) {
            // the word at index I cannot be understood
            //if (result.errors.length === 0) {
            result.errors.push(ERError.makeError_NO_KNOWN_WORD(tokenIndex, tokens));
            //}
        }
        for (var l = 0; l < lenMatches; ++l) { // for each variant present at index k
            //debuglog("vecs now" + JSON.stringify(vecs));
            var nvecs = []; //vecs.slice(); // copy the vec[i] base vector;
            //debuglog("vecs copied now" + JSON.stringify(nvecs));
            for (var u = 0; u < res.length; ++u) {
                if (!isSpanVec(res[u], tokenIndex) && !isSuccessorOperator(res[u], tokenIndex)) {
                    // for each so far constructed result (of length k) in res
                    nvecs.push(res[u].slice()); // make a copy of each vector
                    nvecs[nvecs.length - 1] = copyVecMembers(nvecs[nvecs.length - 1]);
                    // debuglog("copied vecs["+ u+"]" + JSON.stringify(vecs[u]));
                    nvecs[nvecs.length - 1].push(clone(tokenMatches[tokenIndex][l])); // push the lth variant
                    // debuglog("now nvecs " + nvecs.length + " " + JSON.stringify(nvecs));
                }
            }
            //   debuglog(" at     " + k + ":" + l + " nextbase >" + JSON.stringify(nextBase))
            //   debuglog(" append " + k + ":" + l + " nvecs    >" + JSON.stringify(nvecs))
            nextBase = nextBase.concat(nvecs);
            //   debuglog("  result " + k + ":" + l + " nvecs    >" + JSON.stringify(nextBase))
        } //constru
        //  debuglog("now at " + k + ":" + l + " >" + JSON.stringify(nextBase))
        res = nextBase;
    }
    debuglogV(debuglogV.enabled ? ("APPENDING TO RES1#" + 0 + ":" + l + " >" + JSON.stringify(nextBase)) : '-');
    res = res.filter((sentence, index) => {
        var full = 0xFFFFFFFF;
        //console.log(`sentence  ${index}  \n`)
        return sentence.every((word, index2) => {
            if (!word.rule)
                return true;
            full = (full & word.rule.bitSentenceAnd);
            //console.log(` word  ${index2} ${full} "${word.matchedString}" ${word.rule.bitSentenceAnd}  ${tokens[index2]} \n`);
            return full !== 0;
        });
    });
    result.sentences = res;
    return result;
}
exports.expandTokenMatchesToSentences2 = expandTokenMatchesToSentences2;
function processString(query, rules, words, operators) {
    words = words || {};
    operators = operators || {};
    //if(!process.env.ABOT_NO_TEST1) {
    return processString2(query, rules, words, operators);
}
exports.processString = processString;
/*
var tokenStruct = tokenizeString(query, rules, words);
evaluateRangeRulesToPosition(tokenStruct.tokens, tokenStruct.fusable,
  tokenStruct.categorizedWords);
if (debuglog.enabled) {
  debuglog("After matched " + JSON.stringify(tokenStruct.categorizedWords));
}
var aSentences = expandTokenMatchesToSentences(tokenStruct.tokens, tokenStruct.categorizedWords);
if (debuglog.enabled) {
  debuglog("after expand" + aSentences.sentences.map(function (oSentence) {
  return Sentence.rankingProduct(oSentence) + ":" + Sentence.dumpNice(oSentence); //JSON.stringify(oSentence);
  }).join("\n"));
}
aSentences.sentences = WordMatch.reinForce(aSentences.sentences);
if (debuglog.enabled) {
  debuglog("after reinforce" + aSentences.sentences.map(function (oSentence) {
    return Sentence.rankingProduct(oSentence) + ":" + JSON.stringify(oSentence);
  }).join("\n"));
}
return aSentences;
*/
function findCloseIdenticals(mp, word) {
    var res = [];
    for (var key in mp) {
        if (key == word.string) {
            res.push(mp[key]);
        }
        else if (CharSequence.CharSequence.isSameOrPluralOrVeryClose(key, word.string)) {
            res.push(mp[key]);
        }
    }
    return res;
}
exports.findCloseIdenticals = findCloseIdenticals;
/* Return true if the identical *source word* is interpreted
* (within the same domain and the same wordtype)
* as a differnent  (e.g. element numb is one interpreted as 'CAT' element name, once as CAT 'element number' in
*
* example
* [ 'element names=>element number/category/2 F16',         <<< (1)
*    'element number=>element number/category/2 F16',
*    'element weight=>atomic weight/category/2 F16',
*    'element name=>element name/category/2 F16',           <<< (2)
*    'with=>with/filler I256',
*    'element name=>element name/category/2 F16',           <<< (3)
*   'starting with=>starting with/operator/2 O256',
*    'ABC=>ABC/any A4096' ],
*
* same domain IUPAC elements)
*
*  (1) differs to (2),(3) although the base words are very similar element names, element name, element name respectively
*
* - exact match
* - stemming by removing/appending traling s
* - closeness
*
* @param sentence
*/
function isDistinctInterpretationForSame(sentence) {
    var mp = {};
    var res = sentence.every((word, index) => {
        var seens = findCloseIdenticals(mp, word);
        debuglog(" investigating seens for " + word.string + " " + JSON.stringify(seens, undefined, 2));
        for (var seen of seens) {
            //var seen = mp[word.string];
            /*if(!seen) {
              mp[word.string] = word;
              return true;
            }*/
            if (!seen.rule || !word.rule) {
                //return true;
            }
            else if (seen.rule.bitindex === word.rule.bitindex
                && seen.rule.matchedString !== word.rule.matchedString) {
                debuglog("skipping this" + JSON.stringify(sentence, undefined, 2));
                return false;
            }
        }
        if (!mp[word.string]) {
            mp[word.string] = word;
            return true;
        }
        return true;
    });
    return res;
}
exports.isDistinctInterpretationForSame = isDistinctInterpretationForSame;
function isSameCategoryAndHigherMatch(sentence, idxmap) {
    var idxmapother = {};
    var cnt = 0;
    var prodo = 1.0;
    var prod = 1.0;
    Object.keys(idxmap).forEach((idxkey) => {
        var wrd = idxmap[idxkey];
        var idx = parseInt(idxkey);
        if (sentence.length > idx) {
            var wrdo = sentence[idx];
            if (wrdo.string === wrd.string
                && wrdo.rule.bitindex === wrd.rule.bitindex
                && wrdo.rule.wordType === wrd.rule.wordType
                && wrdo.rule.category === wrd.rule.category) {
                ++cnt;
                prodo = prodo * wrdo._ranking;
                prod = prod * wrd._ranking;
            }
        }
    });
    if (cnt === Object.keys(idxmap).length && prodo > prod) {
        return true;
    }
    return false;
}
exports.isSameCategoryAndHigherMatch = isSameCategoryAndHigherMatch;
function get_ith_arg(onepos, oppos, sentence, index) {
    // 1 ->  0  -1;           1            2         -2
    // 2  -> 1   1;           2            3         -1
    var pos = onepos - 1;
    if (pos <= oppos)
        pos = -1;
    pos -= oppos;
    var idx = pos + index;
    return sentence[idx];
}
function isBadOperatorArgs(sentence, operators) {
    if (isNullOrEmptyDictionary(operators))
        return false;
    return !sentence.every((word, index) => {
        if ((word.rule && word.rule.wordType) != mgnlq_model_2.IFModel.WORDTYPE.OPERATOR)
            return true;
        var op = operators[word.rule.matchedString];
        if (!op)
            return true;
        var operatorpos = op.operatorpos || 0;
        if (!op.arity)
            return true;
        for (var i = 1; i <= op.arity; ++i) {
            var ith_arg = get_ith_arg(i, operatorpos, sentence, index);
            if (!ith_arg)
                return false;
            var argtype = op.argcategory[i - 1];
            var argtypex = argtype.map((x) => Word.WordType.fromCategoryString(x));
            if (argtypex.indexOf(ith_arg.rule.wordType) < 0) {
                console.log("discarding due to arg " + op.operator + " arg #" + i + " expected" + JSON.stringify(argtypex) + " was " + ith_arg.rule.wordType);
                debuglog(() => { return "discarding due to arg " + op.operator + " arg #" + i + " expected" + JSON.stringify(argtypex) + " was " + ith_arg.rule.wordType; });
                return false;
            }
        }
        return true;
    });
}
exports.isBadOperatorArgs = isBadOperatorArgs;
/* Return true if the identical *target word* is expressed by different source words
* (within the same domain and the same wordtype)
*
* this is problematic with aliases mapped onto the same target, (eg. where -> with, with -> where )
* so perhaps only for categories and facts?
*
* example <pre>
* [ 'element names=>element number/category/2 C8',         <<< (1a)
*    'element number=>element number/category/2 C8',       <<< (2)
*    'element weight=>atomic weight/category/2 C8',
*    'element name=>element number/category/2 C8',           <<< (1b)
*    'with=>with/filler I256',
*    'element name=>element number/category/2 C8',           <<< (1c)
*    'starting with=>starting with/operator/2 O256',
*    'ABC=>ABC/any A4096' ],
*
* same domain IUPAC elements)
*
*  (1abc) differs from (2),
*  and there is a much better interpretation around
* </pre>
* - exact match
* - stemming by removing/appending traling s
* - closeness
*
* @param sentence
*/
function isNonOptimalDistinctSourceForSame(sentence, sentences) {
    var mp = {};
    // calculate conflicts :    [taget_word -> ]
    var res = sentence.every((word) => {
        if (word.category === Word.Category.CAT_CATEGORY
            && (word.rule.wordType === mgnlq_model_2.IFModel.WORDTYPE.FACT
                || word.rule.wordType === mgnlq_model_2.IFModel.WORDTYPE.CATEGORY)) {
            if (!mp[word.rule.matchedString])
                mp[word.rule.matchedString] = {};
            if (!mp[word.rule.matchedString][word.rule.bitindex])
                mp[word.rule.matchedString][word.rule.bitindex] = [];
            var arr = mp[word.rule.matchedString][word.rule.bitindex];
            if (arr.length == 0) {
                arr.push(word);
            }
            if (!arr.every((presentword) => {
                return CharSequence.CharSequence.isSameOrPluralOrVeryClose(word.string, presentword.string);
            })) {
                arr.push(word);
            }
        }
        // retain only entries with more than one member in the list
        var mpduplicates = {};
        Object.keys(mp).forEach((key) => {
            var entry = mp[key];
            Object.keys(entry).forEach((keybitindex) => {
                if (entry[keybitindex].length > 1) {
                    if (!mpduplicates[key])
                        mpduplicates[key] = {};
                    mpduplicates[key][keybitindex] = entry[keybitindex];
                }
            });
        });
        return Object.keys(mpduplicates).every((key) => {
            return Object.keys(mpduplicates[key]).every((bi) => {
                var lst = mpduplicates[key][bi];
                var idxmap = {};
                /* ok, do some work ..  */
                /* for every duplicate we collect an index  idx -> word */
                for (var alst of lst) {
                    var idx = sentence.indexOf(alst);
                    if (idx < 0)
                        throw new Error("word must be found in sentence ");
                    idxmap[idx] = alst;
                }
                /* then we run through all the sentences identifying *identical source words pairs,
                   if we find a  a) distinct sentence with
                              b) same categories F16/F16
                          and c) *higher matches* for both , then we discard *this* sentence
                          */
                return sentences.every((othersentence) => {
                    if (othersentence === sentence)
                        return true;
                    if (isSameCategoryAndHigherMatch(othersentence, idxmap)) {
                        debuglog(" removing sentence with due to higher match " + Sentence.simplifyStringsWithBitIndex(sentence)
                            + " as " + Sentence.simplifyStringsWithBitIndex(othersentence) + " appears better ");
                        return false;
                    }
                    return true;
                });
            });
        });
    });
    debuglog(" here res " + !res + " " + Sentence.simplifyStringsWithBitIndex(sentence));
    return !res;
}
exports.isNonOptimalDistinctSourceForSame = isNonOptimalDistinctSourceForSame;
/*
 * Return true if the identical source word is interpreted
 * (within the same domain and the same wordtype)
 * as a differnent  (e.g. element numb is one interpreted as 'CAT' element name, once as CAT 'element number' in
 * same domain IUPAC elements)
 *
 * - exact match
 * - stemming by removing/appending traling s
 * - closeness
 *
 * @param sentence
 */
function isDistinctInterpretationForSameOLD(sentence) {
    var mp = {};
    var res = sentence.every((word, index) => {
        var seen = mp[word.string];
        if (!seen) { // exact match
            /*if( word.string.length > 3 && word.string.charAt(word.string.length - 1).toLowerCase() == 's')
            {
      
            }
            */
        }
        if (!seen) {
            mp[word.string] = word;
            return true;
        }
        if (!seen.rule || !word.rule) {
            return true;
        }
        if (seen.rule.bitindex === word.rule.bitindex
            && seen.rule.matchedString !== word.rule.matchedString) {
            //  console.log("skipping this" + JSON.stringify(sentence,undefined,2));
            return false;
        }
        return true;
    });
    return res;
}
exports.isDistinctInterpretationForSameOLD = isDistinctInterpretationForSameOLD;
function filterNonSameInterpretations(aSentences) {
    var discardIndex = [];
    var res = Object.assign({}, aSentences);
    res.sentences = aSentences.sentences.filter((sentence, index) => {
        if (!isDistinctInterpretationForSame(sentence)) {
            discardIndex.push(index);
            return false;
        }
        return true;
    });
    if (discardIndex.length) {
        res.errors = aSentences.errors.filter((error, index) => {
            if (discardIndex.indexOf(index) >= 0) {
                return false;
            }
            return true;
        });
    }
    return res;
}
exports.filterNonSameInterpretations = filterNonSameInterpretations;
function isNullOrEmptyDictionary(obj) {
    return (obj === undefined) || (Object.keys(obj).length === 0);
}
function filterBadOperatorArgs(aSentences, operators) {
    if (isNullOrEmptyDictionary(operators))
        return aSentences;
    var discardIndex = [];
    var res = Object.assign({}, aSentences);
    res.sentences = aSentences.sentences.filter((sentence, index) => {
        if (isBadOperatorArgs(sentence, operators)) {
            discardIndex.push(index);
            return false;
        }
        return true;
    });
    if (discardIndex.length) {
        res.errors = aSentences.errors.filter((error, index) => {
            if (discardIndex.indexOf(index) >= 0) {
                return false;
            }
            return true;
        });
    }
    return res;
}
exports.filterBadOperatorArgs = filterBadOperatorArgs;
function filterReverseNonSameInterpretations(aSentences) {
    var discardIndex = [];
    var res = Object.assign({}, aSentences);
    res.sentences = aSentences.sentences.filter((sentence, index) => {
        if (isNonOptimalDistinctSourceForSame(sentence, aSentences.sentences)) {
            discardIndex.push(index);
            return false;
        }
        return true;
    });
    if (discardIndex.length) {
        res.errors = aSentences.errors.filter((error, index) => {
            if (discardIndex.indexOf(index) >= 0) {
                return false;
            }
            return true;
        });
    }
    return res;
}
exports.filterReverseNonSameInterpretations = filterReverseNonSameInterpretations;
function processString2(query, rules, words, operators) {
    words = words || {};
    var tokenStruct = tokenizeString(query, rules, words);
    debuglog(() => `tokenized:\n` + tokenStruct.categorizedWords.map(s => Sentence.simplifyStringsWithBitIndex(s).join("\n")).join("\n"));
    evaluateRangeRulesToPosition(tokenStruct.tokens, tokenStruct.fusable, tokenStruct.categorizedWords);
    debuglogV(() => "After matched " + JSON.stringify(tokenStruct.categorizedWords));
    var aSentences = expandTokenMatchesToSentences2(tokenStruct.tokens, tokenStruct.categorizedWords);
    debuglog(() => "after expand " + aSentences.sentences.map(function (oSentence) {
        return Sentence.rankingProduct(oSentence) + ":\n" + Sentence.dumpNiceBitIndexed(oSentence); //JSON.stringify(oSentence);
    }).join("\n"));
    aSentences = filterBadOperatorArgs(aSentences, operators);
    aSentences = filterNonSameInterpretations(aSentences);
    aSentences = filterReverseNonSameInterpretations(aSentences);
    aSentences.sentences = WordMatch.reinForce(aSentences.sentences);
    debuglogV(() => "after reinforce\n" + aSentences.sentences.map(function (oSentence) {
        return Sentence.rankingProduct(oSentence) + ":\n" + JSON.stringify(oSentence);
    }).join("\n"));
    debuglog(() => "after reinforce" + aSentences.sentences.map(function (oSentence) {
        return Sentence.rankingProduct(oSentence) + ":\n" + Sentence.dumpNiceBitIndexed(oSentence); //JSON.stringify(oSentence);
    }).join("\n"));
    return aSentences;
}
exports.processString2 = processString2;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJiYXNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hdGNoL2VyYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUdILDJDQUEyQztBQUMzQywrQ0FBK0M7QUFFL0MsZ0NBQWdDO0FBSWhDLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMvQixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakMsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBRTVCLDZDQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckMsTUFBTSxTQUFTLEdBQVEsTUFBTSxDQUFDO0FBRTlCLFNBQWdCLFNBQVMsQ0FBQyxDQUFDO0lBQ3pCLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFDYixTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsT0FBTyxHQUFHLENBQUMsQ0FBQztBQUNkLENBQUM7QUFKRCw4QkFJQztBQUdELG9DQUFvQztBQUdwQyw2Q0FBaUQ7QUFLakQsdUNBQXVDO0FBRXZDLCtCQUErQjtBQWlDL0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBb0JHO0FBQ0gsU0FBZ0IsY0FBYyxDQUFDLE9BQWUsRUFBRSxLQUF3QixFQUN0RSxLQUEwRDtJQUUxRCxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDWixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDWixJQUFJLE1BQU0sR0FBRyx1QkFBUyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQyxJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUU7UUFDcEIsUUFBUSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUNyRDtJQUNELGlDQUFpQztJQUNqQyxLQUFLLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztJQUNwQixPQUFP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