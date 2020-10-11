'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryInternal = exports.remapResult = exports.projectResultToArray = exports.remapRecord = exports.query = exports.queryWithURI = exports.queryWithAuxCategories = exports.prepareQueries = exports.augmentCategoriesWithURI = exports.containsFixedCategories = exports.makeAggregateFromAst = exports.getDomainInfoForSentence = exports.getDomainForSentenceSafe = exports.ModelHandle = exports.MongoBridge = exports.makeMongoName = exports.JSONStringify = void 0;
/**
 * @file
 * @module jfseb.mgnlq_parser1.mongoq
 * @copyright (c) 2016-2109 Gerd Forstmann
 *
 * database connectivity and querying
 */
const er_index_1 = require("./match/er_index");
const mgnlq_model_1 = require("mgnlq_model");
const debug = require("debugf");
const _ = require("lodash");
const debuglog = debug('mongoq');
const chevrotain = require("chevrotain");
const AST = require("./ast");
var createToken = chevrotain.createToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;
const mongoose = require("mongoose");
const process = require("process");
function JSONStringify(obj) {
    function customSer(key, value) {
        if (value instanceof RegExp)
            return (value.toString());
        else
            return value;
    }
    return JSON.stringify(obj, customSer, 2);
}
exports.JSONStringify = JSONStringify;
process.on("unhandledRejection", function handleWarning(reason, promise) {
    console.log("[PROCESS] Unhandled Promise Rejection");
    console.log("- - - - - - - - - - - - - - - - - - -");
    console.log(reason);
    console.log('');
});
function makeMongoName(s) {
    return s.replace(/[^a-zA-Z0-9]/g, '_');
}
exports.makeMongoName = makeMongoName;
//var mongodb = process.env.ABOT_MONGODB || "testmodel";
mongoose.Promise = global.Promise;
var db = mongoose.connection;
class MongoBridge {
    constructor(model) {
        this._model = model;
    }
    mongoooseDomainToDomain(mgdomain) {
        var domain = undefined;
        debug('searching for .............## ' + mgdomain);
        this._model.domains.every(d => {
            // console.log("here we go "  + mgdomain + " " + makeMongoName(d));
            debug("here we go " + mgdomain + " " + makeMongoName(d));
            if (makeMongoName(d) === makeMongoName(mgdomain)) {
                domain = d;
                debug('got one ' + d);
                return false;
            }
            return true;
        });
        return domain;
    }
}
exports.MongoBridge = MongoBridge;
class ModelHandle {
    constructor(theModel) {
        this._theModel = theModel;
        this._mongoose = this._theModel.mongoHandle && this._theModel.mongoHandle.mongoose;
        this._mgBridge = new MongoBridge(theModel);
    }
    query(domain, query) {
        var that = this;
        var mgmodelname = mgnlq_model_1.Model.getMongooseModelNameForDomain(this._theModel, domain);
        4;
        debuglog('query ' + domain + ' >>' + mgmodelname + ' ' + JSON.stringify(query, undefined, 2));
        return getDBConnection(this._mongoose).then((mongoose) => {
            return new Promise(function (resolve, reject) {
                Promise.resolve(1).then(() => {
                    debuglog('constructing model for ' + mgmodelname);
                    if (that._theModel.mongoHandle.mongoose.modelNames().indexOf(mgmodelname) < 0) {
                        throw new Error(` ${domain} / ${mgmodelname} is not a present model `);
                    }
                    var model = that._theModel.mongoHandle.mongoose.model(mgmodelname);
                    //
                    // console.log('try1');
                    //  that._models[mgdomain] = mongoose.model(mgdomain);
                    //  console.log('try2');
                    //  that._schemas[mgdomain] = mongoose.model(mgdomain).schema;
                    //}
                    /*
                      if(!that._models[mgdomain]) {
                        that._schemas[mgdomain] = that._mgBridge.makeSchema(mgdomain);
                        that._mongoose.modelNames();
                        that._models[mgdomain] = mongoose.model(mgdomain,that._schemas[mgdomain]);
                      }
                     */
                    //  console.log('running stuff')
                    // db.fioriboms.aggregate([ { $match : {}}, { $group: { _id : { a : '$BSPName', b : '$AppKey' } , BSPName : { $first : '$BSPName'} , AppKey : { $first : '$AppKey' }}},{ $project: { _id : 0, BSPName : 1 }}], { cursor : {  batchSize : 0}});
                    //var model = that._models[mgdomain];
                    //  console.log('here model ' + model);
                    //  model.collection.count({}, function(err,number) {
                    //  console.log("counted " + number + " members in collection");
                    //  });
                    //   console.log(JSON.stringify(query, undefined,2));
                    /*  model.collection.count({}, function(a) {
                        debuglog('lets count' + a); });
                      */
                    debuglog(() => 'here model ' + Object.keys(model));
                    var resq = model.aggregate(query).then((res) => {
                        //   console.log("here the result" + JSON.stringify(res));
                        resolve(res);
                        //db.close();
                    }).catch((err) => {
                        console.error(err);
                        db.close();
                    });
                });
            });
        });
    }
}
exports.ModelHandle = ModelHandle;
function incHash(hsh, key) {
    hsh[key] = (hsh[key] || 0) + 1;
}
/*
export function getDomainForSentence2(theModel: IFModel.IModels, sentence : IFErBase.ISentence) : {
  domain: string,
    collectionName: string,
    modelName: string
  }
{
  // this is sloppy and bad
  var res = {};
  var o = 0xFFFFFFF;
  sentence.forEach(w => {
    if (w.rule.wordType === IFModel.WORDTYPE.CATEGORY) {
      o = o & w.rule.bitSentenceAnd;
    }
    if (w.rule.wordType === IFModel.WORDTYPE.FACT) {
      o = o & w.rule.bitSentenceAnd;
    }
  });
  var domains = Model.getDomainsForBitField(theModel, o);
  if (domains.length !== 1) {
    throw new Error('more than one domain: "' + domains.join('", "') + '"');
  }
  if (!domains[0]) {
    console.log('query without a domain : ' + Sentence.dumpNiceArr([sentence]));
  }
  return {
    domain: domains[0],
    collectionName: Model.getMongoCollectionNameForDomain(theModel, domains[0]),
    modelName: Model.getModelNameForDomain(theModel.mongoHandle, domains[0])
  }
};

*/
function getDomainForSentenceSafe(theModel, sentence) {
    try {
        return getDomainInfoForSentence(theModel, sentence).domain;
    }
    catch (e) {
        return undefined;
    }
}
exports.getDomainForSentenceSafe = getDomainForSentenceSafe;
/**
 * given a Sentence, obtain the domain for it
 * @param theModel
 * @param sentence
 */
function getDomainInfoForSentence(theModel, sentence) {
    // this is sloppy and bad
    var res = {};
    var o = 0xFFFFFFF;
    sentence.forEach(w => {
        if (w.rule.wordType === mgnlq_model_1.IFModel.WORDTYPE.CATEGORY) {
            o = o & w.rule.bitSentenceAnd;
            mgnlq_model_1.Model.getDomainsForCategory(theModel, w.matchedString).forEach(d => {
                incHash(res, d);
            });
        }
        if (w.rule.wordType === mgnlq_model_1.IFModel.WORDTYPE.FACT) {
            o = o & w.rule.bitSentenceAnd;
            //   console.log(`${w.rule.bitindex} ${w.bitindex} ${w.rule.bitSentenceAnd} ${o} `);
            mgnlq_model_1.Model.getDomainsForCategory(theModel, w.category).forEach(d => {
                incHash(res, d);
            });
        }
    });
    var domains = mgnlq_model_1.Model.getDomainsForBitField(theModel, o);
    if (domains.length !== 1) {
        throw new Error('more than one domain: "' + domains.join('", "') + '"');
    }
    if (!domains[0]) {
        console.log('query without a domain : ' + er_index_1.Sentence.dumpNiceArr([sentence]));
    }
    return {
        domain: domains[0],
        collectionName: mgnlq_model_1.Model.getMongoCollectionNameForDomain(theModel, domains[0]),
        modelName: mgnlq_model_1.Model.getModelNameForDomain(theModel.mongoHandle, domains[0])
    };
}
exports.getDomainInfoForSentence = getDomainInfoForSentence;
;
//import { IFErBase as IMatch, ErError as ErError } from './match/index';
const mQ = require("./ast2query/ast2MQuery");
;
;
;
;
function getDBConnection(mongooseHndl) {
    if (mongooseHndl) {
        debuglog('assuming present handle');
        // we assume we are connected
        return Promise.resolve(mongooseHndl.connection);
    }
    throw Error('how is this gonna work');
}
const SentenceParser = require("./sentenceparser");
;
;
function makeAggregateFromAst(astnode, sentence, models, collectionName, fixedCategories) {
    var nodeFieldList = astnode.children[0].children[0];
    var nodeFilter = astnode.children[1];
    var mongoMap = undefined;
    mongoMap = models.mongoHandle.mongoMaps[collectionName];
    var modelHandleRaw = models.mongoHandle;
    // todo: detect any explicit sorts
    // { sortCartegoryList : ["cat1"],
    //  [ {cat1 : 1} ,{ cat2 : -1} ]
    //
    // then iff explicit sort,
    // project out cat+sortCart, the then sort by it, only then project out desiredcat
    //
    //}//
    var explicitSort = mQ.extractExplicitSortFromAst(nodeFilter, sentence, mongoMap, collectionName, modelHandleRaw);
    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap, collectionName, modelHandleRaw);
    // TODO: be better than full unwind, use only relelvant categories!
    var unwind = mgnlq_model_1.MongoMap.unwindsForNonterminalArrays(mongoMap);
    var head = [match];
    if (unwind.length) {
        head = head.concat(unwind);
        head.push(match);
    }
    var categoryList = mQ.getCategoryList(fixedCategories, nodeFieldList, sentence);
    var categoryListPlusExplicitSort = mQ.amendCategoryList(explicitSort, categoryList);
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    var sort = mQ.makeMongoSortFromAst(categoryList, mongoMap);
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    var columnsReverseMap = mQ.makeMongoColumnsFromAst(categoryList, mongoMap);
    console.log(" catPlus " + JSON.stringify(categoryListPlusExplicitSort));
    var projExplicit = mQ.makeMongoProjectionFromAst(categoryListPlusExplicitSort, mongoMap);
    var sortExplicit = mQ.makeMongoExplicitSort(explicitSort, categoryList, mongoMap);
    var groupExplicit = mQ.makeMongoGroupFromAst(categoryListPlusExplicitSort, mongoMap);
    //   console.log(' query: ' + JSON.stringify(r)); // how to get domain?
    // test.equal(domain, 'FioriBOM',' got domain');
    console.log(" explicitSort" + JSON.stringify(explicitSort));
    var query = (explicitSort.length > 0) ?
        head.concat([sortExplicit, groupExplicit, projExplicit, sortExplicit, proj])
        : head.concat([group, proj, sort]);
    return { query: query, columnsReverseMap: columnsReverseMap };
}
exports.makeAggregateFromAst = makeAggregateFromAst;
function containsFixedCategories(theModel, domain, fixedCategories) {
    if (fixedCategories.length === 0) {
        return true;
    }
    var cats = mgnlq_model_1.Model.getCategoriesForDomain(theModel, domain);
    return _.intersection(cats, fixedCategories).length === fixedCategories.length;
}
exports.containsFixedCategories = containsFixedCategories;
function augmentCategoriesWithURI(fixedCategories, theModel, domain) {
    var uris = mgnlq_model_1.Model.getShowURICategoriesForDomain(theModel, domain);
    var ranks = mgnlq_model_1.Model.getShowURIRankCategoriesForDomain(theModel, domain);
    return _.union(uris, ranks, fixedCategories);
}
exports.augmentCategoriesWithURI = augmentCategoriesWithURI;
function prepareQueries(query, theModel, fixedCategories, options) {
    debuglog(`here query: ${query}`);
    var r = SentenceParser.parseSentenceToAsts(query, theModel, {}); // words);
    var res = Object.assign({}, r);
    debuglog(() => ' parsed ' + JSON.stringify(r));
    r.domains = [];
    res.queries = res.asts.map((astnode, index) => {
        var sentence = r.sentences[index];
        debuglog(() => `return  ast [${index}]:` + AST.astToText(astnode));
        if (!astnode) {
            debuglog(() => JSON.stringify(` empty node for ${index} ` + JSON.stringify(r.errors[index], undefined, 2)));
            return undefined;
        }
        var domainPick = getDomainInfoForSentence(theModel, sentence);
        debuglog(() => ' domainPick: ' + JSON.stringify(domainPick, undefined, 2));
        var domainFixedCategories = [];
        if (options && options.showURI) {
            domainFixedCategories = augmentCategoriesWithURI(fixedCategories, theModel, domainPick.domain);
        }
        else {
            domainFixedCategories = fixedCategories;
        }
        var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.collectionName];
        if (!containsFixedCategories(theModel, domainPick.domain, domainFixedCategories)) {
            debuglog(() => JSON.stringify(` fixed fields not present in domain ${domainPick.domain} given fields ${domainFixedCategories.join(";")} for ${index} `));
            return undefined;
        }
        var res = makeAggregateFromAst(astnode, sentence, theModel, domainPick.collectionName, domainFixedCategories);
        var query = res.query;
        var columnsReverseMap = res.columnsReverseMap;
        /*
            var nodeFieldList = astnode.children[0].children[0];
            var nodeFilter = astnode.children[1];
            var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap);
    
        // TODO: be better than full unwind, use only relelvant categories!
              var MongomMap = MongoMap.unwindsForNonterminalArrays(mongoMap);
    
            var proj = mQ.makeMongoProjectionFromAst(nodeFieldList, sentence, mongoMap);
            var columnsReverseMap= mQ.makeMongoColumnsFromAst(nodeFieldList, sentence, mongoMap);
            var group = mQ.makeMongoGroupFromAst(nodeFieldList, sentence, mongoMap);
            //   console.log(' query: ' + JSON.stringify(r)); // how to get domain?
           // test.equal(domain, 'FioriBOM',' got domain');
            var query = [ match, group, proj ];
          */
        r.domains[index] = domainPick.domain;
        debuglog(() => ` mongo query for collection ${domainPick.collectionName} : ` + JSONStringify(query));
        debuglog(() => ` columnmap ` + JSON.stringify(columnsReverseMap, undefined, 2));
        return {
            domain: domainPick.domain,
            collectionName: domainPick.collectionName,
            columns: columnsReverseMap.columns,
            auxcolumns: [],
            reverseMap: columnsReverseMap.reverseMap,
            query: query
        };
    });
    return res;
}
exports.prepareQueries = prepareQueries;
//extends IMatch.IProcessedSentences {
//  queryresults: QResult[]
//}
/* result format redesign */
/* 1) ability to transport the AST */
/* 2) ability to transport auxiliary information  ( e.g. _url )  */
/* 3) result objects  map [{  prop : value }] as this is more natural , not string[][] */
/* single array of "alternating options" */
function queryWithAuxCategories(query, theModel, auxiliary_categories) {
    var handle = new ModelHandle(theModel);
    return queryInternal(query, theModel, handle, auxiliary_categories);
}
exports.queryWithAuxCategories = queryWithAuxCategories;
function queryWithURI(query, theModel, auxiliary_categories) {
    var handle = new ModelHandle(theModel);
    return queryInternal(query, theModel, handle, [], { showURI: true });
}
exports.queryWithURI = queryWithURI;
function query(query, theModel) {
    var handle = new ModelHandle(theModel);
    return queryInternal(query, theModel, handle, []);
}
exports.query = query;
function remapRecord(rec, columns, reverseMap) {
    var r = {};
    Object.keys(rec).forEach(key => {
        var targetKey = reverseMap[key] || key;
        r[targetKey] = rec[key];
    });
    return r; // columns.map(c => r[c]);
}
exports.remapRecord = remapRecord;
;
function projectResultToArray(res) {
    debuglog(' full :' + JSON.stringify(res));
    return res.results.map(rec => res.columns.map(c => rec[c]));
}
exports.projectResultToArray = projectResultToArray;
function remapResult(res, columns, reverseMap) {
    return res.map(record => remapRecord(record, columns, reverseMap));
}
exports.remapResult = remapResult;
;
function queryInternal(querystring, theModel, handle, fixedFields, options) {
    fixedFields = fixedFields || [];
    var r = prepareQueries(querystring, theModel, fixedFields, options);
    debuglog(() => 'here prepared queries: ' + JSON.stringify(r));
    if (r.queries.length === 0) {
        return Promise.resolve([{
                domain: undefined,
                aux: { sentence: undefined,
                    tokens: r.tokens },
                errors: r.errors,
                columns: [],
                auxcolumns: [],
                results: []
            }]);
    }
    ;
    var aPromises = r.queries.map((query, index) => {
        debuglog(() => `query ${index} prepared for domain ` + (query && query.domain));
        debuglog(() => `query ${index} prepared for domain ` + (query && query.domain && getDomainForSentenceSafe(theModel, r.sentences[index])));
        if (query === undefined) {
            return {
                // TODO may not always be possible
                domain: getDomainForSentenceSafe(theModel, r.sentences[index]),
                aux: {
                    sentence: r.sentences[index],
                    tokens: r.tokens
                },
                errors: r.errors[index],
                columns: [],
                auxcolumns: [],
                results: []
            }; //as IQueryResult
        }
        return handle.query(query.domain, query.query).then(res => {
            //console.log('db returned' + res);
            var resClean = remapResult(res, r.queries[index].columns, query.reverseMap);
            return {
                domain: query.domain,
                aux: {
                    sentence: r.sentences[index],
                    tokens: r.tokens
                },
                errors: r.errors[index],
                columns: r.queries[index].columns,
                auxcolumns: r.queries[index].auxcolumns,
                results: resClean
            };
        });
    });
    var u = Promise.all(aPromises);
    var k = u.then(aRes => {
        debuglog("***here results of all queries " + JSON.stringify(aRes, undefined, 2));
        var queryresults = aRes; // mergeResults(aRes);
        return queryresults;
        /*
        var res2 = {
          domain
    
        } as IProcessedMongoAnswers;
    
        /*
        var res2 = {
          queryresults: queryresults,
          errors: r.errors, // [ErError.makeError_EMPTY_INPUT()] ,
          tokens: r.tokens,
        } as IProcessedMongoAnswers;
        */
        // return res2;
    });
    return k;
}
exports.queryInternal = queryInternal;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uZ29xLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21vbmdvcS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUE7OztBQUNaOzs7Ozs7R0FNRztBQUdILCtDQUE4RTtBQUM5RSw2Q0FBdUY7QUFFdkYsZ0NBQWdDO0FBQ2hDLDRCQUE0QjtBQUU1QixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFakMseUNBQXlDO0FBQ3pDLDZCQUE2QjtBQUk3QixJQUFJLFdBQVcsR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFDO0FBQ3pDLElBQUksS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7QUFDN0IsSUFBSSxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztBQU0vQixxQ0FBcUM7QUFFckMsbUNBQW1DO0FBSW5DLFNBQWdCLGFBQWEsQ0FBQyxHQUFRO0lBQ3BDLFNBQVMsU0FBUyxDQUFDLEdBQUcsRUFBRSxLQUFLO1FBQzNCLElBQUksS0FBSyxZQUFZLE1BQU07WUFDekIsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDOztZQUUxQixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQVJELHNDQVFDO0FBRUQsT0FBTyxDQUFDLEVBQUUsQ0FFUixvQkFBb0IsRUFFcEIsU0FBUyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU87SUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsQ0FBQztJQUNyRCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFF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