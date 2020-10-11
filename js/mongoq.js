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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFDO0lBQ0YsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBZSxTQUFTLENBQUMsQ0FBQztJQUM3QyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUF5QixJQUFJLENBQUMsRUFBRTtRQUM1QyxRQUFRLENBQUMsaUNBQWlDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakYsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLENBQUMsc0JBQXNCO1FBQy9DLE9BQU8sWUFBWSxDQUFDO1FBQ3BCOzs7Ozs7Ozs7Ozs7VUFZRTtRQUNILGVBQWU7SUFFaEIsQ0FBQyxDQUNBLENBQUM7SUFDRixPQUFPLENBQUMsQ0FBQztBQUNYLENBQUM7QUE1RUQsc0NBNEVDIiwiZmlsZSI6Im1vbmdvcS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xyXG4vKipcclxuICogQGZpbGVcclxuICogQG1vZHVsZSBqZnNlYi5tZ25scV9wYXJzZXIxLm1vbmdvcVxyXG4gKiBAY29weXJpZ2h0IChjKSAyMDE2LTIxMDkgR2VyZCBGb3JzdG1hbm5cclxuICpcclxuICogZGF0YWJhc2UgY29ubmVjdGl2aXR5IGFuZCBxdWVyeWluZ1xyXG4gKi9cclxuXHJcblxyXG5pbXBvcnQgeyBTZW50ZW5jZSBhcyBTZW50ZW5jZSwgSUZFckJhc2UgYXMgSUZFckJhc2UgfSBmcm9tICcuL21hdGNoL2VyX2luZGV4JztcclxuaW1wb3J0IHsgSUZNb2RlbCBhcyBJRk1vZGVsLCBNb2RlbCBhcyBNb2RlbCwgTW9uZ29NYXAgYXMgTW9uZ29NYXAgfSBmcm9tICdtZ25scV9tb2RlbCc7XHJcblxyXG5pbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Z2YnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XHJcblxyXG5jb25zdCBkZWJ1Z2xvZyA9IGRlYnVnKCdtb25nb3EnKTtcclxuXHJcbmltcG9ydCAqIGFzIGNoZXZyb3RhaW4gZnJvbSAnY2hldnJvdGFpbic7XHJcbmltcG9ydCAqIGFzIEFTVCBmcm9tICcuL2FzdCc7XHJcblxyXG5pbXBvcnQgeyBBU1ROb2RlVHlwZSBhcyBOVCB9IGZyb20gJy4vYXN0JztcclxuXHJcbnZhciBjcmVhdGVUb2tlbiA9IGNoZXZyb3RhaW4uY3JlYXRlVG9rZW47XHJcbnZhciBMZXhlciA9IGNoZXZyb3RhaW4uTGV4ZXI7XHJcbnZhciBQYXJzZXIgPSBjaGV2cm90YWluLlBhcnNlcjtcclxuXHJcblxyXG5cclxuXHJcblxyXG5pbXBvcnQgKiBhcyBtb25nb29zZSBmcm9tICdtb25nb29zZSc7XHJcblxyXG5pbXBvcnQgKiBhcyBwcm9jZXNzIGZyb20gJ3Byb2Nlc3MnO1xyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gSlNPTlN0cmluZ2lmeShvYmo6IGFueSk6IHN0cmluZyB7XHJcbiAgZnVuY3Rpb24gY3VzdG9tU2VyKGtleSwgdmFsdWUpIHtcclxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cClcclxuICAgICAgcmV0dXJuICh2YWx1ZS50b1N0cmluZygpKTtcclxuICAgIGVsc2VcclxuICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gIH1cclxuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob2JqLCBjdXN0b21TZXIsIDIpO1xyXG59XHJcblxyXG5wcm9jZXNzLm9uKFxyXG5cclxuICBcInVuaGFuZGxlZFJlamVjdGlvblwiLFxyXG5cclxuICBmdW5jdGlvbiBoYW5kbGVXYXJuaW5nKHJlYXNvbiwgcHJvbWlzZSkge1xyXG4gICAgY29uc29sZS5sb2coXCJbUFJPQ0VTU10gVW5oYW5kbGVkIFByb21pc2UgUmVqZWN0aW9uXCIpO1xyXG4gICAgY29uc29sZS5sb2coXCItIC0gLSAtIC0gLSAtIC0gLSAtIC0gLSAtIC0gLSAtIC0gLSAtXCIpO1xyXG4gICAgY29uc29sZS5sb2cocmVhc29uKTtcclxuICAgIGNvbnNvbGUubG9nKCcnKTtcclxuXHJcbiAgfVxyXG5cclxuKTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW9uZ29OYW1lKHM6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIHMucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJyk7XHJcbn1cclxuXHJcbi8vdmFyIG1vbmdvZGIgPSBwcm9jZXNzLmVudi5BQk9UX01PTkdPREIgfHwgXCJ0ZXN0bW9kZWxcIjtcclxuXHJcblxyXG4oPGFueT5tb25nb29zZSkuUHJvbWlzZSA9IGdsb2JhbC5Qcm9taXNlO1xyXG5cclxudmFyIGRiID0gbW9uZ29vc2UuY29ubmVjdGlvbjtcclxuXHJcbmV4cG9ydCBjbGFzcyBNb25nb0JyaWRnZSB7XHJcbiAgX21vZGVsOiBJRk1vZGVsLklNb2RlbHM7XHJcbiAgY29uc3RydWN0b3IobW9kZWw6IElGTW9kZWwuSU1vZGVscykge1xyXG4gICAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcclxuICB9XHJcbiAgbW9uZ29vb3NlRG9tYWluVG9Eb21haW4obWdkb21haW46IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICB2YXIgZG9tYWluID0gdW5kZWZpbmVkO1xyXG4gICAgZGVidWcoJ3NlYXJjaGluZyBmb3IgLi4uLi4uLi4uLi4uLiMjICcgKyBtZ2RvbWFpbik7XHJcbiAgICB0aGlzLl9tb2RlbC5kb21haW5zLmV2ZXJ5KGQgPT4ge1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhcImhlcmUgd2UgZ28gXCIgICsgbWdkb21haW4gKyBcIiBcIiArIG1ha2VNb25nb05hbWUoZCkpO1xyXG4gICAgICBkZWJ1ZyhcImhlcmUgd2UgZ28gXCIgKyBtZ2RvbWFpbiArIFwiIFwiICsgbWFrZU1vbmdvTmFtZShkKSk7XHJcbiAgICAgIGlmIChtYWtlTW9uZ29OYW1lKGQpID09PSBtYWtlTW9uZ29OYW1lKG1nZG9tYWluKSkge1xyXG4gICAgICAgIGRvbWFpbiA9IGQ7XHJcbiAgICAgICAgZGVidWcoJ2dvdCBvbmUgJyArIGQpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBkb21haW47XHJcbiAgfVxyXG5cclxuICAvKlxyXG4gICAgbWFrZVNjaGVtYShtZ2RvbWFpbiA6IHN0cmluZykgIDogbW9uZ29vc2UuU2NoZW1hIHtcclxuICAgICAgZGVidWcoJ21ha2VTY2hlbWEgZm9yICcgKyBtZ2RvbWFpbik7XHJcbiAgICAgLy8gY29uc29sZS5sb2coJ21ha2VzY2hlbWEgJyArIG1nZG9tYWluKTtcclxuICAgICAgdmFyIGRvbWFpbiA9IHRoaXMubW9uZ29vb3NlRG9tYWluVG9Eb21haW4obWdkb21haW4pO1xyXG4gICAgICBkZWJ1Z2xvZygoKT0+ICcgZG9tYWluICcgKyBkb21haW4pO1xyXG4gICAgICBkZWJ1Z2xvZygoKT0+IGAgYWxsIGRvbWFpbnMgYCArIHRoaXMuX21vZGVsLmRvbWFpbnMuam9pbihcIjsgXCIpKTtcclxuICAgICAgdmFyIGNhdHMgPSBNb2RlbC5nZXRDYXRlZ29yaWVzRm9yRG9tYWluKHRoaXMuX21vZGVsLCBkb21haW4pO1xyXG4gICAgICB2YXIgcmVzID0ge307XHJcbiAgICAgIGNhdHMuZm9yRWFjaChjYXQgPT4ge1xyXG4gICAgICAgIHJlc1ttYWtlTW9uZ29OYW1lKGNhdCldID0geyB0eXBlIDogU3RyaW5nfTtcclxuICAgICAgfSlcclxuICAgICAgcmV0dXJuIG5ldyBtb25nb29zZS5TY2hlbWEocmVzKTtcclxuICAgIH1cclxuICAgICovXHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgTW9kZWxIYW5kbGUge1xyXG4gIF90aGVNb2RlbDogSUZNb2RlbC5JTW9kZWxzO1xyXG4gIF9tZ0JyaWRnZTogTW9uZ29CcmlkZ2U7XHJcbiAgX21vbmdvb3NlOiBtb25nb29zZS5Nb25nb29zZTtcclxuICBjb25zdHJ1Y3Rvcih0aGVNb2RlbDogSUZNb2RlbC5JTW9kZWxzKSB7XHJcbiAgICB0aGlzLl90aGVNb2RlbCA9IHRoZU1vZGVsO1xyXG4gICAgdGhpcy5fbW9uZ29vc2UgPSB0aGlzLl90aGVNb2RlbC5tb25nb0hhbmRsZSAmJiB0aGlzLl90aGVNb2RlbC5tb25nb0hhbmRsZS5tb25nb29zZTtcclxuICAgIHRoaXMuX21nQnJpZGdlID0gbmV3IE1vbmdvQnJpZGdlKHRoZU1vZGVsKTtcclxuICB9XHJcbiAgcXVlcnkoZG9tYWluOiBzdHJpbmcsIHF1ZXJ5OiBhbnkpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgdmFyIG1nbW9kZWxuYW1lID0gTW9kZWwuZ2V0TW9uZ29vc2VNb2RlbE5hbWVGb3JEb21haW4odGhpcy5fdGhlTW9kZWwsIGRvbWFpbik7IDRcclxuICAgIGRlYnVnbG9nKCdxdWVyeSAnICsgZG9tYWluICsgJyA+PicgKyBtZ21vZGVsbmFtZSArICcgJyArIEpTT04uc3RyaW5naWZ5KHF1ZXJ5LCB1bmRlZmluZWQsIDIpKTtcclxuICAgIHJldHVybiBnZXREQkNvbm5lY3Rpb24odGhpcy5fbW9uZ29vc2UpLnRoZW4oKG1vbmdvb3NlKSA9PiB7XHJcblxyXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIFByb21pc2UucmVzb2x2ZSgxKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIGRlYnVnbG9nKCdjb25zdHJ1Y3RpbmcgbW9kZWwgZm9yICcgKyBtZ21vZGVsbmFtZSk7XHJcbiAgICAgICAgICBpZiAodGhhdC5fdGhlTW9kZWwubW9uZ29IYW5kbGUubW9uZ29vc2UubW9kZWxOYW1lcygpLmluZGV4T2YobWdtb2RlbG5hbWUpIDwgMCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCAke2RvbWFpbn0gLyAke21nbW9kZWxuYW1lfSBpcyBub3QgYSBwcmVzZW50IG1vZGVsIGApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdmFyIG1vZGVsID0gdGhhdC5fdGhlTW9kZWwubW9uZ29IYW5kbGUubW9uZ29vc2UubW9kZWwobWdtb2RlbG5hbWUpO1xyXG4gICAgICAgICAgLy9cclxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCd0cnkxJyk7XHJcbiAgICAgICAgICAvLyAgdGhhdC5fbW9kZWxzW21nZG9tYWluXSA9IG1vbmdvb3NlLm1vZGVsKG1nZG9tYWluKTtcclxuICAgICAgICAgIC8vICBjb25zb2xlLmxvZygndHJ5MicpO1xyXG4gICAgICAgICAgLy8gIHRoYXQuX3NjaGVtYXNbbWdkb21haW5dID0gbW9uZ29vc2UubW9kZWwobWdkb21haW4pLnNjaGVtYTtcclxuICAgICAgICAgIC8vfVxyXG4gICAgICAgICAgLypcclxuICAgICAgICAgICAgaWYoIXRoYXQuX21vZGVsc1ttZ2RvbWFpbl0pIHtcclxuICAgICAgICAgICAgICB0aGF0Ll9zY2hlbWFzW21nZG9tYWluXSA9IHRoYXQuX21nQnJpZGdlLm1ha2VTY2hlbWEobWdkb21haW4pO1xyXG4gICAgICAgICAgICAgIHRoYXQuX21vbmdvb3NlLm1vZGVsTmFtZXMoKTtcclxuICAgICAgICAgICAgICB0aGF0Ll9tb2RlbHNbbWdkb21haW5dID0gbW9uZ29vc2UubW9kZWwobWdkb21haW4sdGhhdC5fc2NoZW1hc1ttZ2RvbWFpbl0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgKi9cclxuICAgICAgICAgIC8vICBjb25zb2xlLmxvZygncnVubmluZyBzdHVmZicpXHJcbiAgICAgICAgICAvLyBkYi5maW9yaWJvbXMuYWdncmVnYXRlKFsgeyAkbWF0Y2ggOiB7fX0sIHsgJGdyb3VwOiB7IF9pZCA6IHsgYSA6ICckQlNQTmFtZScsIGIgOiAnJEFwcEtleScgfSAsIEJTUE5hbWUgOiB7ICRmaXJzdCA6ICckQlNQTmFtZSd9ICwgQXBwS2V5IDogeyAkZmlyc3QgOiAnJEFwcEtleScgfX19LHsgJHByb2plY3Q6IHsgX2lkIDogMCwgQlNQTmFtZSA6IDEgfX1dLCB7IGN1cnNvciA6IHsgIGJhdGNoU2l6ZSA6IDB9fSk7XHJcbiAgICAgICAgICAvL3ZhciBtb2RlbCA9IHRoYXQuX21vZGVsc1ttZ2RvbWFpbl07XHJcbiAgICAgICAgICAvLyAgY29uc29sZS5sb2coJ2hlcmUgbW9kZWwgJyArIG1vZGVsKTtcclxuICAgICAgICAgIC8vICBtb2RlbC5jb2xsZWN0aW9uLmNvdW50KHt9LCBmdW5jdGlvbihlcnIsbnVtYmVyKSB7XHJcbiAgICAgICAgICAvLyAgY29uc29sZS5sb2coXCJjb3VudGVkIFwiICsgbnVtYmVyICsgXCIgbWVtYmVycyBpbiBjb2xsZWN0aW9uXCIpO1xyXG4gICAgICAgICAgLy8gIH0pO1xyXG4gICAgICAgICAgLy8gICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShxdWVyeSwgdW5kZWZpbmVkLDIpKTtcclxuICAgICAgICAgIC8qICBtb2RlbC5jb2xsZWN0aW9uLmNvdW50KHt9LCBmdW5jdGlvbihhKSB7XHJcbiAgICAgICAgICAgICAgZGVidWdsb2coJ2xldHMgY291bnQnICsgYSk7IH0pO1xyXG4gICAgICAgICAgICAqL1xyXG4gICAgICAgICAgZGVidWdsb2coKCkgPT4gJ2hlcmUgbW9kZWwgJyArIE9iamVjdC5rZXlzKG1vZGVsKSk7XHJcbiAgICAgICAgICB2YXIgcmVzcSA9IG1vZGVsLmFnZ3JlZ2F0ZShxdWVyeSkudGhlbigocmVzKSA9PiB7XHJcbiAgICAgICAgICAgIC8vICAgY29uc29sZS5sb2coXCJoZXJlIHRoZSByZXN1bHRcIiArIEpTT04uc3RyaW5naWZ5KHJlcykpO1xyXG4gICAgICAgICAgICByZXNvbHZlKHJlcyk7XHJcbiAgICAgICAgICAgIC8vZGIuY2xvc2UoKTtcclxuICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xyXG4gICAgICAgICAgICBkYi5jbG9zZSgpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluY0hhc2goaHNoLCBrZXkpIHtcclxuICBoc2hba2V5XSA9IChoc2hba2V5XSB8fCAwKSArIDE7XHJcbn1cclxuXHJcbi8qXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREb21haW5Gb3JTZW50ZW5jZTIodGhlTW9kZWw6IElGTW9kZWwuSU1vZGVscywgc2VudGVuY2UgOiBJRkVyQmFzZS5JU2VudGVuY2UpIDoge1xyXG4gIGRvbWFpbjogc3RyaW5nLFxyXG4gICAgY29sbGVjdGlvbk5hbWU6IHN0cmluZyxcclxuICAgIG1vZGVsTmFtZTogc3RyaW5nXHJcbiAgfVxyXG57XHJcbiAgLy8gdGhpcyBpcyBzbG9wcHkgYW5kIGJhZFxyXG4gIHZhciByZXMgPSB7fTtcclxuICB2YXIgbyA9IDB4RkZGRkZGRjtcclxuICBzZW50ZW5jZS5mb3JFYWNoKHcgPT4ge1xyXG4gICAgaWYgKHcucnVsZS53b3JkVHlwZSA9PT0gSUZNb2RlbC5XT1JEVFlQRS5DQVRFR09SWSkge1xyXG4gICAgICBvID0gbyAmIHcucnVsZS5iaXRTZW50ZW5jZUFuZDtcclxuICAgIH1cclxuICAgIGlmICh3LnJ1bGUud29yZFR5cGUgPT09IElGTW9kZWwuV09SRFRZUEUuRkFDVCkge1xyXG4gICAgICBvID0gbyAmIHcucnVsZS5iaXRTZW50ZW5jZUFuZDtcclxuICAgIH1cclxuICB9KTtcclxuICB2YXIgZG9tYWlucyA9IE1vZGVsLmdldERvbWFpbnNGb3JCaXRGaWVsZCh0aGVNb2RlbCwgbyk7XHJcbiAgaWYgKGRvbWFpbnMubGVuZ3RoICE9PSAxKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ21vcmUgdGhhbiBvbmUgZG9tYWluOiBcIicgKyBkb21haW5zLmpvaW4oJ1wiLCBcIicpICsgJ1wiJyk7XHJcbiAgfVxyXG4gIGlmICghZG9tYWluc1swXSkge1xyXG4gICAgY29uc29sZS5sb2coJ3F1ZXJ5IHdpdGhvdXQgYSBkb21haW4gOiAnICsgU2VudGVuY2UuZHVtcE5pY2VBcnIoW3NlbnRlbmNlXSkpO1xyXG4gIH1cclxuICByZXR1cm4ge1xyXG4gICAgZG9tYWluOiBkb21haW5zWzBdLFxyXG4gICAgY29sbGVjdGlvbk5hbWU6IE1vZGVsLmdldE1vbmdvQ29sbGVjdGlvbk5hbWVGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbnNbMF0pLFxyXG4gICAgbW9kZWxOYW1lOiBNb2RlbC5nZXRNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwubW9uZ29IYW5kbGUsIGRvbWFpbnNbMF0pXHJcbiAgfVxyXG59O1xyXG5cclxuKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREb21haW5Gb3JTZW50ZW5jZVNhZmUodGhlTW9kZWw6IElGTW9kZWwuSU1vZGVscywgc2VudGVuY2U6IElGRXJCYXNlLklTZW50ZW5jZSkgOiBzdHJpbmcge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gZ2V0RG9tYWluSW5mb0ZvclNlbnRlbmNlKHRoZU1vZGVsLHNlbnRlbmNlKS5kb21haW47XHJcbiAgfSBjYXRjaChlKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIGdpdmVuIGEgU2VudGVuY2UsIG9idGFpbiB0aGUgZG9tYWluIGZvciBpdFxyXG4gKiBAcGFyYW0gdGhlTW9kZWxcclxuICogQHBhcmFtIHNlbnRlbmNlXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tYWluSW5mb0ZvclNlbnRlbmNlKHRoZU1vZGVsOiBJRk1vZGVsLklNb2RlbHMsIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UpOiB7XHJcbiAgZG9tYWluOiBzdHJpbmcsXHJcbiAgY29sbGVjdGlvbk5hbWU6IHN0cmluZyxcclxuICBtb2RlbE5hbWU6IHN0cmluZ1xyXG59IHtcclxuICAvLyB0aGlzIGlzIHNsb3BweSBhbmQgYmFkXHJcbiAgdmFyIHJlcyA9IHt9O1xyXG4gIHZhciBvID0gMHhGRkZGRkZGO1xyXG4gIHNlbnRlbmNlLmZvckVhY2godyA9PiB7XHJcbiAgICBpZiAody5ydWxlLndvcmRUeXBlID09PSBJRk1vZGVsLldPUkRUWVBFLkNBVEVHT1JZKSB7XHJcbiAgICAgIG8gPSBvICYgdy5ydWxlLmJpdFNlbnRlbmNlQW5kO1xyXG4gICAgICBNb2RlbC5nZXREb21haW5zRm9yQ2F0ZWdvcnkodGhlTW9kZWwsIHcubWF0Y2hlZFN0cmluZykuZm9yRWFjaChkID0+IHtcclxuICAgICAgICBpbmNIYXNoKHJlcywgZCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKHcucnVsZS53b3JkVHlwZSA9PT0gSUZNb2RlbC5XT1JEVFlQRS5GQUNUKSB7XHJcbiAgICAgIG8gPSBvICYgdy5ydWxlLmJpdFNlbnRlbmNlQW5kO1xyXG4gICAgICAvLyAgIGNvbnNvbGUubG9nKGAke3cucnVsZS5iaXRpbmRleH0gJHt3LmJpdGluZGV4fSAke3cucnVsZS5iaXRTZW50ZW5jZUFuZH0gJHtvfSBgKTtcclxuICAgICAgTW9kZWwuZ2V0RG9tYWluc0ZvckNhdGVnb3J5KHRoZU1vZGVsLCB3LmNhdGVnb3J5KS5mb3JFYWNoKGQgPT4ge1xyXG4gICAgICAgIGluY0hhc2gocmVzLCBkKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdmFyIGRvbWFpbnMgPSBNb2RlbC5nZXREb21haW5zRm9yQml0RmllbGQodGhlTW9kZWwsIG8pO1xyXG4gIGlmIChkb21haW5zLmxlbmd0aCAhPT0gMSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdtb3JlIHRoYW4gb25lIGRvbWFpbjogXCInICsgZG9tYWlucy5qb2luKCdcIiwgXCInKSArICdcIicpO1xyXG4gIH1cclxuICBpZiAoIWRvbWFpbnNbMF0pIHtcclxuICAgIGNvbnNvbGUubG9nKCdxdWVyeSB3aXRob3V0IGEgZG9tYWluIDogJyArIFNlbnRlbmNlLmR1bXBOaWNlQXJyKFtzZW50ZW5jZV0pKTtcclxuICB9XHJcbiAgcmV0dXJuIHtcclxuICAgIGRvbWFpbjogZG9tYWluc1swXSxcclxuICAgIGNvbGxlY3Rpb25OYW1lOiBNb2RlbC5nZXRNb25nb0NvbGxlY3Rpb25OYW1lRm9yRG9tYWluKHRoZU1vZGVsLCBkb21haW5zWzBdKSxcclxuICAgIG1vZGVsTmFtZTogTW9kZWwuZ2V0TW9kZWxOYW1lRm9yRG9tYWluKHRoZU1vZGVsLm1vbmdvSGFuZGxlLCBkb21haW5zWzBdKVxyXG4gIH1cclxufTtcclxuXHJcbi8vaW1wb3J0IHsgSUZFckJhc2UgYXMgSU1hdGNoLCBFckVycm9yIGFzIEVyRXJyb3IgfSBmcm9tICcuL21hdGNoL2luZGV4JztcclxuXHJcbmltcG9ydCAqIGFzIG1RIGZyb20gJy4vYXN0MnF1ZXJ5L2FzdDJNUXVlcnknO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTUmVzIHtcclxuICBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlLFxyXG4gIHJlY29yZHM6IGFueVtdXHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFFSZXN1bHQge1xyXG4gIGRvbWFpbjogc3RyaW5nLFxyXG4gIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UsXHJcbiAgY29sdW1uczogc3RyaW5nW10sXHJcbiAgcmVzdWx0czogc3RyaW5nW11bXVxyXG59O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUmVzdWx0UmVjb3JkICB7IFtrZXk6IHN0cmluZ10gOiBOdW1iZXIgfCBzdHJpbmcgfTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVF1ZXJ5UmVzdWx0IHtcclxuICBkb21haW46IHN0cmluZyxcclxuICBhdXggOiB7XHJcbiAgICBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlLFxyXG4gICAgdG9rZW5zIDogc3RyaW5nW10sXHJcbiAgICBhc3Rub2RlPyA6IEFTVC5BU1ROb2RlXHJcbiAgfVxyXG4gIGVycm9ycyA6IGFueSwgIC8vIHVuZGVmaW5lZCBmb3Igb2sgcmVzdWx0XHJcbiAgLyoqXHJcbiAgICogQ29sdW1ucyByZWxldmFudCBmb3Igb3V0cHV0LCBpbiBcInF1ZXJ5XCIgLyBcInNlbnRlbmNlXCIgb3JkZXJcclxuICAgKi9cclxuICBjb2x1bW5zOiBzdHJpbmdbXSwgLy8gY29sdW1ucyByZWxldmFudCBmb3Igb3V0cHV0XHJcbiAgYXV4Y29sdW1ucz8gIDogc3RyaW5nW10sICAvLyBjb250YWlucyBhZGRpdGlvbmFsIGNvbHVtbnMsIHVzdWFsbHkgbm90IHByZXNlbnQhXHJcbiAgcmVzdWx0czogSVJlc3VsdFJlY29yZFtdXHJcbn07XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIGdldERCQ29ubmVjdGlvbihtb25nb29zZUhuZGw6IG1vbmdvb3NlLk1vbmdvb3NlKTogUHJvbWlzZTxtb25nb29zZS5Db25uZWN0aW9uPiB7XHJcbiAgaWYgKG1vbmdvb3NlSG5kbCkge1xyXG4gICAgZGVidWdsb2coJ2Fzc3VtaW5nIHByZXNlbnQgaGFuZGxlJyk7XHJcbiAgICAvLyB3ZSBhc3N1bWUgd2UgYXJlIGNvbm5lY3RlZFxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb25nb29zZUhuZGwuY29ubmVjdGlvbik7XHJcbiAgfVxyXG4gIHRocm93IEVycm9yKCdob3cgaXMgdGhpcyBnb25uYSB3b3JrJyk7XHJcbn1cclxuXHJcbmltcG9ydCAqIGFzIFNlbnRlbmNlUGFyc2VyIGZyb20gJy4vc2VudGVuY2VwYXJzZXInO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUXVlcnkge1xyXG4gIGRvbWFpbjogc3RyaW5nLFxyXG4gIGNvbHVtbnM6IHN0cmluZ1tdLFxyXG4gIGF1eGNvbHVtbnM/IDogc3RyaW5nW10sXHJcbiAgcmV2ZXJzZU1hcDogSVJldmVyc2VNYXAsXHJcbiAgcXVlcnk6IGFueVxyXG59O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUHJlcGFyZWRRdWVyeSBleHRlbmRzIFNlbnRlbmNlUGFyc2VyLklQYXJzZWRTZW50ZW5jZXMge1xyXG4gIHF1ZXJpZXM6IElRdWVyeVtdXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZUFnZ3JlZ2F0ZUZyb21Bc3QoYXN0bm9kZTogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRk1vZGVsLklXb3JkW10sXHJcbiAgbW9kZWxzIDogSUZNb2RlbC5JTW9kZWxzLFxyXG4gIGNvbGxlY3Rpb25OYW1lIDogc3RyaW5nLCBmaXhlZENhdGVnb3JpZXMpIHtcclxuICB2YXIgbm9kZUZpZWxkTGlzdCA9IGFzdG5vZGUuY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF07XHJcbiAgdmFyIG5vZGVGaWx0ZXIgPSBhc3Rub2RlLmNoaWxkcmVuWzFdO1xyXG4gIHZhciBtb25nb01hcCA9IHVuZGVmaW5lZCBhcyBJRk1vZGVsLkNhdE1vbmdvTWFwO1xyXG4gIG1vbmdvTWFwID0gbW9kZWxzLm1vbmdvSGFuZGxlLm1vbmdvTWFwc1tjb2xsZWN0aW9uTmFtZV07XHJcbiAgdmFyIG1vZGVsSGFuZGxlUmF3ID0gbW9kZWxzLm1vbmdvSGFuZGxlO1xyXG4gIC8vIHRvZG86IGRldGVjdCBhbnkgZXhwbGljaXQgc29ydHNcclxuICAvLyB7IHNvcnRDYXJ0ZWdvcnlMaXN0IDogW1wiY2F0MVwiXSxcclxuICAvLyAgWyB7Y2F0MSA6IDF9ICx7IGNhdDIgOiAtMX0gXVxyXG4gIC8vXHJcbiAgLy8gdGhlbiBpZmYgZXhwbGljaXQgc29ydCxcclxuICAvLyBwcm9qZWN0IG91dCBjYXQrc29ydENhcnQsIHRoZSB0aGVuIHNvcnQgYnkgaXQsIG9ubHkgdGhlbiBwcm9qZWN0IG91dCBkZXNpcmVkY2F0XHJcbiAgLy9cclxuICAvL30vL1xyXG4gIHZhciBleHBsaWNpdFNvcnQgPSBtUS5leHRyYWN0RXhwbGljaXRTb3J0RnJvbUFzdCggbm9kZUZpbHRlciwgc2VudGVuY2UsIG1vbmdvTWFwLCBjb2xsZWN0aW9uTmFtZSwgbW9kZWxIYW5kbGVSYXcgKTtcclxuXHJcbiAgdmFyIG1hdGNoID0gbVEubWFrZU1vbmdvTWF0Y2hGcm9tQXN0KG5vZGVGaWx0ZXIsIHNlbnRlbmNlLCAgbW9uZ29NYXAsIGNvbGxlY3Rpb25OYW1lLCBtb2RlbEhhbmRsZVJhdyk7XHJcbiAgLy8gVE9ETzogYmUgYmV0dGVyIHRoYW4gZnVsbCB1bndpbmQsIHVzZSBvbmx5IHJlbGVsdmFudCBjYXRlZ29yaWVzIVxyXG4gIHZhciB1bndpbmQgPSBNb25nb01hcC51bndpbmRzRm9yTm9udGVybWluYWxBcnJheXMobW9uZ29NYXApO1xyXG4gIHZhciBoZWFkID0gW21hdGNoXSBhcyBhbnlbXTtcclxuICBpZiAodW53aW5kLmxlbmd0aCkge1xyXG4gICAgaGVhZCA9IGhlYWQuY29uY2F0KHVud2luZCk7XHJcbiAgICBoZWFkLnB1c2gobWF0Y2gpO1xyXG4gIH1cclxuICB2YXIgY2F0ZWdvcnlMaXN0ID0gbVEuZ2V0Q2F0ZWdvcnlMaXN0KGZpeGVkQ2F0ZWdvcmllcywgbm9kZUZpZWxkTGlzdCwgc2VudGVuY2UpO1xyXG4gIHZhciBjYXRlZ29yeUxpc3RQbHVzRXhwbGljaXRTb3J0ID0gbVEuYW1lbmRDYXRlZ29yeUxpc3QoZXhwbGljaXRTb3J0LCBjYXRlZ29yeUxpc3QpO1xyXG4gIHZhciBwcm9qID0gbVEubWFrZU1vbmdvUHJvamVjdGlvbkZyb21Bc3QoY2F0ZWdvcnlMaXN0LCBtb25nb01hcCk7XHJcbiAgdmFyIHNvcnQgPSBtUS5tYWtlTW9uZ29Tb3J0RnJvbUFzdChjYXRlZ29yeUxpc3QsIG1vbmdvTWFwKTtcclxuICB2YXIgZ3JvdXAgPSBtUS5tYWtlTW9uZ29Hcm91cEZyb21Bc3QoY2F0ZWdvcnlMaXN0LCBtb25nb01hcCk7XHJcbiAgdmFyIGNvbHVtbnNSZXZlcnNlTWFwID0gbVEubWFrZU1vbmdvQ29sdW1uc0Zyb21Bc3QoY2F0ZWdvcnlMaXN0LCBtb25nb01hcCk7XHJcblxyXG4gIGNvbnNvbGUubG9nKFwiIGNhdFBsdXMgXCIgKyBKU09OLnN0cmluZ2lmeShjYXRlZ29yeUxpc3RQbHVzRXhwbGljaXRTb3J0KSk7XHJcbiAgdmFyIHByb2pFeHBsaWNpdCA9IG1RLm1ha2VNb25nb1Byb2plY3Rpb25Gcm9tQXN0KGNhdGVnb3J5TGlzdFBsdXNFeHBsaWNpdFNvcnQsIG1vbmdvTWFwKTtcclxuICB2YXIgc29ydEV4cGxpY2l0ID0gbVEubWFrZU1vbmdvRXhwbGljaXRTb3J0KGV4cGxpY2l0U29ydCwgY2F0ZWdvcnlMaXN0LCBtb25nb01hcCk7XHJcbiAgdmFyIGdyb3VwRXhwbGljaXQgPSBtUS5tYWtlTW9uZ29Hcm91cEZyb21Bc3QoY2F0ZWdvcnlMaXN0UGx1c0V4cGxpY2l0U29ydCwgbW9uZ29NYXApO1xyXG4gIC8vICAgY29uc29sZS5sb2coJyBxdWVyeTogJyArIEpTT04uc3RyaW5naWZ5KHIpKTsgLy8gaG93IHRvIGdldCBkb21haW4/XHJcbiAgLy8gdGVzdC5lcXVhbChkb21haW4sICdGaW9yaUJPTScsJyBnb3QgZG9tYWluJyk7XHJcbiAgY29uc29sZS5sb2coXCIgZXhwbGljaXRTb3J0XCIgKyBKU09OLnN0cmluZ2lmeShleHBsaWNpdFNvcnQpKTtcclxuICB2YXIgcXVlcnkgPSAoIGV4cGxpY2l0U29ydC5sZW5ndGggPiAwKSA/XHJcbiAgICAgICAgaGVhZC5jb25jYXQoW3NvcnRFeHBsaWNpdCwgZ3JvdXBFeHBsaWNpdCwgcHJvakV4cGxpY2l0LCBzb3J0RXhwbGljaXQsIHByb2ogXSlcclxuICAgICAgOiBoZWFkLmNvbmNhdChbZ3JvdXAsIHByb2osIHNvcnRdKTtcclxuICByZXR1cm4geyBxdWVyeTogcXVlcnksIGNvbHVtbnNSZXZlcnNlTWFwOiBjb2x1bW5zUmV2ZXJzZU1hcCB9O1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5zRml4ZWRDYXRlZ29yaWVzKHRoZU1vZGVsOiBJRk1vZGVsLklNb2RlbHMsIGRvbWFpbjogc3RyaW5nLCBmaXhlZENhdGVnb3JpZXM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XHJcbiAgaWYgKGZpeGVkQ2F0ZWdvcmllcy5sZW5ndGggPT09IDApIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuICB2YXIgY2F0cyA9IE1vZGVsLmdldENhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbik7XHJcbiAgcmV0dXJuIF8uaW50ZXJzZWN0aW9uKGNhdHMsIGZpeGVkQ2F0ZWdvcmllcykubGVuZ3RoID09PSBmaXhlZENhdGVnb3JpZXMubGVuZ3RoO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudENhdGVnb3JpZXNXaXRoVVJJKGZpeGVkQ2F0ZWdvcmllcyA6IHN0cmluZ1tdLCB0aGVNb2RlbCA6IElGTW9kZWwuSU1vZGVscywgZG9tYWluIDogc3RyaW5nKSA6IHN0cmluZ1tdIHtcclxuICB2YXIgdXJpcyA9IE1vZGVsLmdldFNob3dVUklDYXRlZ29yaWVzRm9yRG9tYWluKHRoZU1vZGVsLCBkb21haW4pO1xyXG4gIHZhciByYW5rcyA9IE1vZGVsLmdldFNob3dVUklSYW5rQ2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCwgZG9tYWluKTtcclxuICByZXR1cm4gXy51bmlvbih1cmlzLCByYW5rcywgZml4ZWRDYXRlZ29yaWVzKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHByZXBhcmVRdWVyaWVzKHF1ZXJ5OiBzdHJpbmcsIHRoZU1vZGVsOiBJRk1vZGVsLklNb2RlbHMsIGZpeGVkQ2F0ZWdvcmllczogc3RyaW5nW10sIG9wdGlvbnM/IDogSVF1ZXJ5T3B0aW9ucyk6IElQcmVwYXJlZFF1ZXJ5IHtcclxuICBkZWJ1Z2xvZyhgaGVyZSBxdWVyeTogJHtxdWVyeX1gKTtcclxuICB2YXIgciA9IFNlbnRlbmNlUGFyc2VyLnBhcnNlU2VudGVuY2VUb0FzdHMocXVlcnksIHRoZU1vZGVsLCB7fSk7IC8vIHdvcmRzKTtcclxuICB2YXIgcmVzID0gT2JqZWN0LmFzc2lnbih7fSwgcikgYXMgSVByZXBhcmVkUXVlcnk7XHJcbiAgZGVidWdsb2coICgpPT4gJyBwYXJzZWQgJyArIEpTT04uc3RyaW5naWZ5KHIpKTtcclxuICByLmRvbWFpbnMgPSBbXTtcclxuICByZXMucXVlcmllcyA9IHJlcy5hc3RzLm1hcCgoYXN0bm9kZSwgaW5kZXgpID0+IHtcclxuICAgIHZhciBzZW50ZW5jZSA9IHIuc2VudGVuY2VzW2luZGV4XTtcclxuICAgIGRlYnVnbG9nKCgpID0+IGByZXR1cm4gIGFzdCBbJHtpbmRleH1dOmAgKyBBU1QuYXN0VG9UZXh0KGFzdG5vZGUpKTtcclxuICAgIGlmICghYXN0bm9kZSkge1xyXG4gICAgICBkZWJ1Z2xvZygoKSA9PiBKU09OLnN0cmluZ2lmeShgIGVtcHR5IG5vZGUgZm9yICR7aW5kZXh9IGAgKyBKU09OLnN0cmluZ2lmeShyLmVycm9yc1tpbmRleF0sIHVuZGVmaW5lZCwgMikpKTtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIHZhciBkb21haW5QaWNrID0gZ2V0RG9tYWluSW5mb0ZvclNlbnRlbmNlKHRoZU1vZGVsLCBzZW50ZW5jZSk7XHJcbiAgICBkZWJ1Z2xvZygoKSA9PiAnIGRvbWFpblBpY2s6ICcgKyBKU09OLnN0cmluZ2lmeShkb21haW5QaWNrLCB1bmRlZmluZWQsIDIpKTtcclxuICAgIHZhciBkb21haW5GaXhlZENhdGVnb3JpZXMgOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgaWYob3B0aW9ucyAmJiBvcHRpb25zLnNob3dVUkkpIHtcclxuICAgICAgZG9tYWluRml4ZWRDYXRlZ29yaWVzID0gYXVnbWVudENhdGVnb3JpZXNXaXRoVVJJKGZpeGVkQ2F0ZWdvcmllcywgdGhlTW9kZWwsIGRvbWFpblBpY2suZG9tYWluKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRvbWFpbkZpeGVkQ2F0ZWdvcmllcyA9IGZpeGVkQ2F0ZWdvcmllcztcclxuICAgIH1cclxuICAgIHZhciBtb25nb01hcCA9IHRoZU1vZGVsLm1vbmdvSGFuZGxlLm1vbmdvTWFwc1tkb21haW5QaWNrLmNvbGxlY3Rpb25OYW1lXTtcclxuICAgIGlmICghY29udGFpbnNGaXhlZENhdGVnb3JpZXModGhlTW9kZWwsIGRvbWFpblBpY2suZG9tYWluLCBkb21haW5GaXhlZENhdGVnb3JpZXMpKSB7XHJcbiAgICAgIGRlYnVnbG9nKCgpID0+IEpTT04uc3RyaW5naWZ5KGAgZml4ZWQgZmllbGRzIG5vdCBwcmVzZW50IGluIGRvbWFpbiAke2RvbWFpblBpY2suZG9tYWlufSBnaXZlbiBmaWVsZHMgJHtkb21haW5GaXhlZENhdGVnb3JpZXMuam9pbihcIjtcIil9IGZvciAke2luZGV4fSBgKSk7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICB2YXIgcmVzID0gbWFrZUFnZ3JlZ2F0ZUZyb21Bc3QoYXN0bm9kZSwgc2VudGVuY2UsdGhlTW9kZWwsIGRvbWFpblBpY2suY29sbGVjdGlvbk5hbWUsIGRvbWFpbkZpeGVkQ2F0ZWdvcmllcyk7XHJcbiAgICB2YXIgcXVlcnkgPSByZXMucXVlcnk7XHJcbiAgICB2YXIgY29sdW1uc1JldmVyc2VNYXAgPSByZXMuY29sdW1uc1JldmVyc2VNYXA7XHJcbiAgICAvKlxyXG4gICAgICAgIHZhciBub2RlRmllbGRMaXN0ID0gYXN0bm9kZS5jaGlsZHJlblswXS5jaGlsZHJlblswXTtcclxuICAgICAgICB2YXIgbm9kZUZpbHRlciA9IGFzdG5vZGUuY2hpbGRyZW5bMV07XHJcbiAgICAgICAgdmFyIG1hdGNoID0gbVEubWFrZU1vbmdvTWF0Y2hGcm9tQXN0KG5vZGVGaWx0ZXIsIHNlbnRlbmNlLCBtb25nb01hcCk7XHJcblxyXG4gICAgLy8gVE9ETzogYmUgYmV0dGVyIHRoYW4gZnVsbCB1bndpbmQsIHVzZSBvbmx5IHJlbGVsdmFudCBjYXRlZ29yaWVzIVxyXG4gICAgICAgICAgdmFyIE1vbmdvbU1hcCA9IE1vbmdvTWFwLnVud2luZHNGb3JOb250ZXJtaW5hbEFycmF5cyhtb25nb01hcCk7XHJcblxyXG4gICAgICAgIHZhciBwcm9qID0gbVEubWFrZU1vbmdvUHJvamVjdGlvbkZyb21Bc3Qobm9kZUZpZWxkTGlzdCwgc2VudGVuY2UsIG1vbmdvTWFwKTtcclxuICAgICAgICB2YXIgY29sdW1uc1JldmVyc2VNYXA9IG1RLm1ha2VNb25nb0NvbHVtbnNGcm9tQXN0KG5vZGVGaWVsZExpc3QsIHNlbnRlbmNlLCBtb25nb01hcCk7XHJcbiAgICAgICAgdmFyIGdyb3VwID0gbVEubWFrZU1vbmdvR3JvdXBGcm9tQXN0KG5vZGVGaWVsZExpc3QsIHNlbnRlbmNlLCBtb25nb01hcCk7XHJcbiAgICAgICAgLy8gICBjb25zb2xlLmxvZygnIHF1ZXJ5OiAnICsgSlNPTi5zdHJpbmdpZnkocikpOyAvLyBob3cgdG8gZ2V0IGRvbWFpbj9cclxuICAgICAgIC8vIHRlc3QuZXF1YWwoZG9tYWluLCAnRmlvcmlCT00nLCcgZ290IGRvbWFpbicpO1xyXG4gICAgICAgIHZhciBxdWVyeSA9IFsgbWF0Y2gsIGdyb3VwLCBwcm9qIF07XHJcbiAgICAgICovXHJcbiAgICByLmRvbWFpbnNbaW5kZXhdID0gZG9tYWluUGljay5kb21haW47XHJcbiAgICBkZWJ1Z2xvZygoKSA9PiBgIG1vbmdvIHF1ZXJ5IGZvciBjb2xsZWN0aW9uICR7ZG9tYWluUGljay5jb2xsZWN0aW9uTmFtZX0gOiBgICsgSlNPTlN0cmluZ2lmeShxdWVyeSkpO1xyXG4gICAgZGVidWdsb2coKCkgPT4gYCBjb2x1bW5tYXAgYCArIEpTT04uc3RyaW5naWZ5KGNvbHVtbnNSZXZlcnNlTWFwLCB1bmRlZmluZWQsIDIpKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGRvbWFpbjogZG9tYWluUGljay5kb21haW4sXHJcbiAgICAgIGNvbGxlY3Rpb25OYW1lOiBkb21haW5QaWNrLmNvbGxlY3Rpb25OYW1lLFxyXG4gICAgICBjb2x1bW5zOiBjb2x1bW5zUmV2ZXJzZU1hcC5jb2x1bW5zLFxyXG4gICAgICBhdXhjb2x1bW5zIDogW10sIC8vID8gLy8gVE9ETyAgYWxsY29sdW1uc1xyXG4gICAgICByZXZlcnNlTWFwOiBjb2x1bW5zUmV2ZXJzZU1hcC5yZXZlcnNlTWFwLFxyXG4gICAgICBxdWVyeTogcXVlcnlcclxuICAgIH07XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgSVByb2Nlc3NlZE1vbmdvQW5zd2VycyA9IElRdWVyeVJlc3VsdFtdO1xyXG4vL2V4dGVuZHMgSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMge1xyXG4vLyAgcXVlcnlyZXN1bHRzOiBRUmVzdWx0W11cclxuLy99XHJcblxyXG4vKiByZXN1bHQgZm9ybWF0IHJlZGVzaWduICovXHJcbi8qIDEpIGFiaWxpdHkgdG8gdHJhbnNwb3J0IHRoZSBBU1QgKi9cclxuLyogMikgYWJpbGl0eSB0byB0cmFuc3BvcnQgYXV4aWxpYXJ5IGluZm9ybWF0aW9uICAoIGUuZy4gX3VybCApICAqL1xyXG4vKiAzKSByZXN1bHQgb2JqZWN0cyAgbWFwIFt7ICBwcm9wIDogdmFsdWUgfV0gYXMgdGhpcyBpcyBtb3JlIG5hdHVyYWwgLCBub3Qgc3RyaW5nW11bXSAqL1xyXG4vKiBzaW5nbGUgYXJyYXkgb2YgXCJhbHRlcm5hdGluZyBvcHRpb25zXCIgKi9cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5V2l0aEF1eENhdGVnb3JpZXMocXVlcnk6IHN0cmluZywgdGhlTW9kZWw6IElGTW9kZWwuSU1vZGVscywgYXV4aWxpYXJ5X2NhdGVnb3JpZXMgOiBzdHJpbmdbXSk6IFByb21pc2U8SVByb2Nlc3NlZE1vbmdvQW5zd2Vycz4ge1xyXG4gIHZhciBoYW5kbGUgPSBuZXcgTW9kZWxIYW5kbGUodGhlTW9kZWwpO1xyXG4gIHJldHVybiBxdWVyeUludGVybmFsKHF1ZXJ5LCB0aGVNb2RlbCwgaGFuZGxlLCBhdXhpbGlhcnlfY2F0ZWdvcmllcyk7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcXVlcnlXaXRoVVJJKHF1ZXJ5OiBzdHJpbmcsIHRoZU1vZGVsOiBJRk1vZGVsLklNb2RlbHMsIGF1eGlsaWFyeV9jYXRlZ29yaWVzIDogc3RyaW5nW10pOiBQcm9taXNlPElQcm9jZXNzZWRNb25nb0Fuc3dlcnM+IHtcclxuICB2YXIgaGFuZGxlID0gbmV3IE1vZGVsSGFuZGxlKHRoZU1vZGVsKTtcclxuICByZXR1cm4gcXVlcnlJbnRlcm5hbChxdWVyeSwgdGhlTW9kZWwsIGhhbmRsZSwgW10sIHsgc2hvd1VSSSA6IHRydWUgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBxdWVyeShxdWVyeTogc3RyaW5nLCB0aGVNb2RlbDogSUZNb2RlbC5JTW9kZWxzKTogUHJvbWlzZTxJUHJvY2Vzc2VkTW9uZ29BbnN3ZXJzPiB7XHJcbiAgdmFyIGhhbmRsZSA9IG5ldyBNb2RlbEhhbmRsZSh0aGVNb2RlbCk7XHJcbiAgcmV0dXJuIHF1ZXJ5SW50ZXJuYWwocXVlcnksIHRoZU1vZGVsLCBoYW5kbGUsIFtdKTtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgSVJldmVyc2VNYXAgPSB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlbWFwUmVjb3JkKHJlYywgY29sdW1uczogc3RyaW5nW10sIHJldmVyc2VNYXA6IElSZXZlcnNlTWFwKTogSVJlc3VsdFJlY29yZCB7XHJcbiAgdmFyIHIgPSB7fTtcclxuICBPYmplY3Qua2V5cyhyZWMpLmZvckVhY2goa2V5ID0+IHtcclxuICAgIHZhciB0YXJnZXRLZXkgPSByZXZlcnNlTWFwW2tleV0gfHwga2V5O1xyXG4gICAgclt0YXJnZXRLZXldID0gcmVjW2tleV07XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHI7IC8vIGNvbHVtbnMubWFwKGMgPT4gcltjXSk7XHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3RSZXN1bHRUb0FycmF5KCByZXM6IElRdWVyeVJlc3VsdCApIDogKHN0cmluZ3wgTnVtYmVyKVtdW10ge1xyXG4gIGRlYnVnbG9nKCcgZnVsbCA6JyArIEpTT04uc3RyaW5naWZ5KHJlcykpO1xyXG4gIHJldHVybiByZXMucmVzdWx0cy5tYXAoIHJlYyA9PlxyXG4gICAgcmVzLmNvbHVtbnMubWFwKGMgPT4gcmVjW2NdKVxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZW1hcFJlc3VsdChyZXMsIGNvbHVtbnM6IHN0cmluZ1tdLCByZXZlcnNlTWFwOiBJUmV2ZXJzZU1hcCk6IElSZXN1bHRSZWNvcmRbXSB7XHJcbiAgcmV0dXJuIHJlcy5tYXAocmVjb3JkID0+IHJlbWFwUmVjb3JkKHJlY29yZCwgY29sdW1ucywgcmV2ZXJzZU1hcCkgKTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUXVlcnlPcHRpb25zIHtcclxuICBzaG93VVJJIDogYm9vbGVhblxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5SW50ZXJuYWwocXVlcnlzdHJpbmc6IHN0cmluZywgdGhlTW9kZWw6IElGTW9kZWwuSU1vZGVscywgaGFuZGxlOiBNb2RlbEhhbmRsZSwgZml4ZWRGaWVsZHM6IHN0cmluZ1tdLCBvcHRpb25zPyA6SVF1ZXJ5T3B0aW9ucyApOlxyXG4gIFByb21pc2U8SVByb2Nlc3NlZE1vbmdvQW5zd2Vycz4ge1xyXG4gIGZpeGVkRmllbGRzID0gZml4ZWRGaWVsZHMgfHwgW107XHJcbiAgdmFyIHIgPSBwcmVwYXJlUXVlcmllcyhxdWVyeXN0cmluZywgdGhlTW9kZWwsIGZpeGVkRmllbGRzLCBvcHRpb25zKTtcclxuICBkZWJ1Z2xvZygoKT0+ICdoZXJlIHByZXBhcmVkIHF1ZXJpZXM6ICcgKyBKU09OLnN0cmluZ2lmeShyKSk7XHJcbiAgaWYoci5xdWVyaWVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZTxJUHJvY2Vzc2VkTW9uZ29BbnN3ZXJzPihcclxuICAgICAgW3tcclxuICAgICAgICBkb21haW4gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgYXV4IDogeyBzZW50ZW5jZSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgIHRva2VucyA6IHIudG9rZW5zIH0sXHJcbiAgICAgICAgZXJyb3JzIDogci5lcnJvcnMsXHJcbiAgICAgICAgY29sdW1ucyA6IFtdLFxyXG4gICAgICAgIGF1eGNvbHVtbnMgOiBbXSxcclxuICAgICAgICByZXN1bHRzIDogW11cclxuICAgICAgfV1cclxuICAgICk7XHJcbiAgfTtcclxuICB2YXIgYVByb21pc2VzID0gci5xdWVyaWVzLm1hcCgocXVlcnksIGluZGV4KSA9PiB7XHJcbiAgICBkZWJ1Z2xvZygoKSA9PiBgcXVlcnkgJHtpbmRleH0gcHJlcGFyZWQgZm9yIGRvbWFpbiBgICsgKHF1ZXJ5ICYmIHF1ZXJ5LmRvbWFpbikpO1xyXG4gICAgZGVidWdsb2coKCkgPT4gYHF1ZXJ5ICR7aW5kZXh9IHByZXBhcmVkIGZvciBkb21haW4gYCArIChxdWVyeSAmJiBxdWVyeS5kb21haW4gJiYgZ2V0RG9tYWluRm9yU2VudGVuY2VTYWZlKHRoZU1vZGVsLHIuc2VudGVuY2VzW2luZGV4XSkpKTtcclxuXHJcbiAgICBpZiAocXVlcnkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIC8vIFRPRE8gbWF5IG5vdCBhbHdheXMgYmUgcG9zc2libGVcclxuICAgICAgICBkb21haW4gOiBnZXREb21haW5Gb3JTZW50ZW5jZVNhZmUodGhlTW9kZWwsci5zZW50ZW5jZXNbaW5kZXhdKSxcclxuICAgICAgICBhdXggOiB7XHJcbiAgICAgICAgICBzZW50ZW5jZTogci5zZW50ZW5jZXNbaW5kZXhdLFxyXG4gICAgICAgICAgdG9rZW5zIDogci50b2tlbnNcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVycm9ycyA6IHIuZXJyb3JzW2luZGV4XSxcclxuICAgICAgICBjb2x1bW5zOiBbXSxcclxuICAgICAgICBhdXhjb2x1bW5zOiBbXSxcclxuICAgICAgICByZXN1bHRzOiBbXVxyXG4gICAgICB9IC8vYXMgSVF1ZXJ5UmVzdWx0XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaGFuZGxlLnF1ZXJ5KHF1ZXJ5LmRvbWFpbiwgcXVlcnkucXVlcnkpLnRoZW4ocmVzID0+IHtcclxuICAgICAgLy9jb25zb2xlLmxvZygnZGIgcmV0dXJuZWQnICsgcmVzKTtcclxuICAgICAgdmFyIHJlc0NsZWFuID0gcmVtYXBSZXN1bHQocmVzLCByLnF1ZXJpZXNbaW5kZXhdLmNvbHVtbnMsIHF1ZXJ5LnJldmVyc2VNYXApO1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGRvbWFpbiA6IHF1ZXJ5LmRvbWFpbixcclxuICAgICAgICBhdXggOiB7XHJcbiAgICAgICAgICBzZW50ZW5jZTogci5zZW50ZW5jZXNbaW5kZXhdLFxyXG4gICAgICAgICAgdG9rZW5zIDogci50b2tlbnNcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVycm9ycyA6IHIuZXJyb3JzW2luZGV4XSxcclxuICAgICAgICBjb2x1bW5zOiByLnF1ZXJpZXNbaW5kZXhdLmNvbHVtbnMsXHJcbiAgICAgICAgYXV4Y29sdW1ucyA6IHIucXVlcmllc1tpbmRleF0uYXV4Y29sdW1ucyxcclxuICAgICAgICByZXN1bHRzOiByZXNDbGVhblxyXG4gICAgICB9IGFzIElRdWVyeVJlc3VsdFxyXG4gICAgfSlcclxuICB9XHJcbiAgKTtcclxuICB2YXIgdSA9IFByb21pc2UuYWxsPElRdWVyeVJlc3VsdD4oYVByb21pc2VzKTtcclxuICB2YXIgayA9IHUudGhlbjxJUHJvY2Vzc2VkTW9uZ29BbnN3ZXJzPihhUmVzID0+IHtcclxuICAgIGRlYnVnbG9nKFwiKioqaGVyZSByZXN1bHRzIG9mIGFsbCBxdWVyaWVzIFwiICsgSlNPTi5zdHJpbmdpZnkoYVJlcywgdW5kZWZpbmVkLCAyKSk7XHJcbiAgICB2YXIgcXVlcnlyZXN1bHRzID0gYVJlczsgLy8gbWVyZ2VSZXN1bHRzKGFSZXMpO1xyXG4gICAgcmV0dXJuIHF1ZXJ5cmVzdWx0cztcclxuICAgIC8qXHJcbiAgICB2YXIgcmVzMiA9IHtcclxuICAgICAgZG9tYWluXHJcblxyXG4gICAgfSBhcyBJUHJvY2Vzc2VkTW9uZ29BbnN3ZXJzO1xyXG5cclxuICAgIC8qXHJcbiAgICB2YXIgcmVzMiA9IHtcclxuICAgICAgcXVlcnlyZXN1bHRzOiBxdWVyeXJlc3VsdHMsXHJcbiAgICAgIGVycm9yczogci5lcnJvcnMsIC8vIFtFckVycm9yLm1ha2VFcnJvcl9FTVBUWV9JTlBVVCgpXSAsXHJcbiAgICAgIHRva2Vuczogci50b2tlbnMsXHJcbiAgICB9IGFzIElQcm9jZXNzZWRNb25nb0Fuc3dlcnM7XHJcbiAgICAqL1xyXG4gICAvLyByZXR1cm4gcmVzMjtcclxuXHJcbiAgfVxyXG4gICk7XHJcbiAgcmV0dXJuIGs7XHJcbn1cclxuXHJcblxyXG4vKlxyXG5cclxuXHJcbiAgICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElXaGF0SXNUdXBlbEFuc3dlciB7XHJcbiAgICAgICAgICAgICAgc2VudGVuY2U6IElTZW50ZW5jZTtcclxuICAgICAgICAgICAgICByZWNvcmQ6IElSZWNvcmQ7XHJcbiAgICAgICAgICAgICAgY2F0ZWdvcmllczogc3RyaW5nW107XHJcbiAgICAgICAgICAgICAgcmVzdWx0OiBzdHJpbmdbXTtcclxuICAgICAgICAgICAgICBfcmFua2luZzogbnVtYmVyO1xyXG4gICAgICAgICAgfVxyXG5cclxuXHJcblxyXG5cclxuXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIC8vICBsb2dQZXJmKCdsaXN0QWxsV2l0aENvbnRleHQnKTtcclxuICAvLyAgcGVyZmxvZyhcInRvdGFsTGlzdEFsbFdpdGhDb250ZXh0XCIpO1xyXG4gICAgdmFyIGFTZW50ZW5jZXNSZWluZm9yY2VkID0gYW5hbHl6ZUNvbnRleHRTdHJpbmcoY29udGV4dFF1ZXJ5U3RyaW5nLCBhUnVsZXMpO1xyXG4gIC8vICBwZXJmbG9nKFwiTEFUV0MgbWF0Y2hpbmcgcmVjb3JkcyAocz1cIiArIGFTZW50ZW5jZXNSZWluZm9yY2VkLnNlbnRlbmNlcy5sZW5ndGggKyBcIikuLi5cIik7XHJcbiAgICB2YXIgbWF0Y2hlZEFuc3dlcnMgPSBXaGF0SXMubWF0Y2hSZWNvcmRzUXVpY2tNdWx0aXBsZUNhdGVnb3JpZXMoYVNlbnRlbmNlc1JlaW5mb3JjZWQsIGNhdGVnb3JpZXMsIHJlY29yZHMsIGRvbWFpbkNhdGVnb3J5RmlsdGVyKTsgLy9hVG9vbDogQXJyYXk8SU1hdGNoLklUb29sPik6IGFueSAvKiBvYmplY3RzdHJlYW0gKiAvIHtcclxuICAgIGlmKGRlYnVnbG9nLmVuYWJsZWQpe1xyXG4gICAgICBkZWJ1Z2xvZyhcIiBtYXRjaGVkIEFuc3dlcnNcIiArIEpTT04uc3RyaW5naWZ5KG1hdGNoZWRBbnN3ZXJzLCB1bmRlZmluZWQsIDIpKTtcclxuICAgIH1cclxuICAvLyAgcGVyZmxvZyhcImZpbHRlcmluZyB0b3BSYW5rZWQgKGE9XCIgKyBtYXRjaGVkQW5zd2Vycy50dXBlbGFuc3dlcnMubGVuZ3RoICsgXCIpLi4uXCIpO1xyXG4gLy8gICB2YXIgbWF0Y2hlZEZpbHRlcmVkID0gV2hhdElzLmZpbHRlck9ubHlUb3BSYW5rZWRUdXBlbChtYXRjaGVkQW5zd2Vycy50dXBlbGFuc3dlcnMpO1xyXG4gLy8gICBpZiAoZGVidWdsb2cuZW5hYmxlZCkge1xyXG4gLy8gICAgIGRlYnVnbG9nKFwiTEFUV0MgbWF0Y2hlZCB0b3AtcmFua2VkIEFuc3dlcnNcIiArIEpTT04uc3RyaW5naWZ5KG1hdGNoZWRGaWx0ZXJlZCwgdW5kZWZpbmVkLCAyKSk7XHJcbiAvLyAgIH1cclxuICB9XHJcbn1cclxuKi8iXX0=
