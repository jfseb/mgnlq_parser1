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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFDO0lBQ0YsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBZSxTQUFTLENBQUMsQ0FBQztJQUM3QyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUF5QixJQUFJLENBQUMsRUFBRTtRQUM1QyxRQUFRLENBQUMsaUNBQWlDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakYsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLENBQUMsc0JBQXNCO1FBQy9DLE9BQU8sWUFBWSxDQUFDO1FBQ3BCOzs7Ozs7Ozs7Ozs7VUFZRTtRQUNILGVBQWU7SUFFaEIsQ0FBQyxDQUNBLENBQUM7SUFDRixPQUFPLENBQUMsQ0FBQztBQUNYLENBQUM7QUE1RUQsc0NBNEVDIiwiZmlsZSI6Im1vbmdvcS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xyXG4vKipcclxuICogQGZpbGVcclxuICogQG1vZHVsZSBqZnNlYi5tZ25scV9wYXJzZXIxLm1vbmdvcVxyXG4gKiBAY29weXJpZ2h0IChjKSAyMDE2LTIxMDkgR2VyZCBGb3JzdG1hbm5cclxuICpcclxuICogZGF0YWJhc2UgY29ubmVjdGl2aXR5IGFuZCBxdWVyeWluZ1xyXG4gKi9cclxuXHJcblxyXG5pbXBvcnQgeyBTZW50ZW5jZSBhcyBTZW50ZW5jZSwgSUZFckJhc2UgYXMgSUZFckJhc2UgfSBmcm9tICcuL21hdGNoL2VyX2luZGV4JztcclxuaW1wb3J0IHsgSUZNb2RlbCBhcyBJRk1vZGVsLCBNb2RlbCBhcyBNb2RlbCwgTW9uZ29NYXAgYXMgTW9uZ29NYXAgfSBmcm9tICdtZ25scV9tb2RlbCc7XHJcblxyXG5pbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Z2YnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XHJcblxyXG5jb25zdCBkZWJ1Z2xvZyA9IGRlYnVnKCdtb25nb3EnKTtcclxuXHJcbmltcG9ydCAqIGFzIGNoZXZyb3RhaW4gZnJvbSAnY2hldnJvdGFpbic7XHJcbmltcG9ydCAqIGFzIEFTVCBmcm9tICcuL2FzdCc7XHJcblxyXG5pbXBvcnQgeyBBU1ROb2RlVHlwZSBhcyBOVCB9IGZyb20gJy4vYXN0JztcclxuXHJcbnZhciBjcmVhdGVUb2tlbiA9IGNoZXZyb3RhaW4uY3JlYXRlVG9rZW47XHJcbnZhciBMZXhlciA9IGNoZXZyb3RhaW4uTGV4ZXI7XHJcbnZhciBQYXJzZXIgPSBjaGV2cm90YWluLlBhcnNlcjtcclxuXHJcblxyXG5cclxuXHJcblxyXG5pbXBvcnQgKiBhcyBtb25nb29zZSBmcm9tICdtb25nb29zZSc7XHJcblxyXG5pbXBvcnQgKiBhcyBwcm9jZXNzIGZyb20gJ3Byb2Nlc3MnO1xyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gSlNPTlN0cmluZ2lmeShvYmo6IGFueSk6IHN0cmluZyB7XHJcbiAgZnVuY3Rpb24gY3VzdG9tU2VyKGtleSwgdmFsdWUpIHtcclxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cClcclxuICAgICAgcmV0dXJuICh2YWx1ZS50b1N0cmluZygpKTtcclxuICAgIGVsc2VcclxuICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gIH1cclxuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob2JqLCBjdXN0b21TZXIsIDIpO1xyXG59XHJcblxyXG5wcm9jZXNzLm9uKFxyXG5cclxuICBcInVuaGFuZGxlZFJlamVjdGlvblwiLFxyXG5cclxuICBmdW5jdGlvbiBoYW5kbGVXYXJuaW5nKHJlYXNvbiwgcHJvbWlzZSkge1xyXG4gICAgY29uc29sZS5sb2coXCJbUFJPQ0VTU10gVW5oYW5kbGVkIFByb21pc2UgUmVqZWN0aW9uXCIpO1xyXG4gICAgY29uc29sZS5sb2coXCItIC0gLSAtIC0gLSAtIC0gLSAtIC0gLSAtIC0gLSAtIC0gLSAtXCIpO1xyXG4gICAgY29uc29sZS5sb2cocmVhc29uKTtcclxuICAgIGNvbnNvbGUubG9nKCcnKTtcclxuICB9XHJcblxyXG4pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb05hbWUoczogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gcy5yZXBsYWNlKC9bXmEtekEtWjAtOV0vZywgJ18nKTtcclxufVxyXG5cclxuLy92YXIgbW9uZ29kYiA9IHByb2Nlc3MuZW52LkFCT1RfTU9OR09EQiB8fCBcInRlc3Rtb2RlbFwiO1xyXG5cclxuXHJcbig8YW55Pm1vbmdvb3NlKS5Qcm9taXNlID0gZ2xvYmFsLlByb21pc2U7XHJcblxyXG52YXIgZGIgPSBtb25nb29zZS5jb25uZWN0aW9uO1xyXG5cclxuZXhwb3J0IGNsYXNzIE1vbmdvQnJpZGdlIHtcclxuICBfbW9kZWw6IElGTW9kZWwuSU1vZGVscztcclxuICBjb25zdHJ1Y3Rvcihtb2RlbDogSUZNb2RlbC5JTW9kZWxzKSB7XHJcbiAgICB0aGlzLl9tb2RlbCA9IG1vZGVsO1xyXG4gIH1cclxuICBtb25nb29vc2VEb21haW5Ub0RvbWFpbihtZ2RvbWFpbjogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHZhciBkb21haW4gPSB1bmRlZmluZWQ7XHJcbiAgICBkZWJ1Zygnc2VhcmNoaW5nIGZvciAuLi4uLi4uLi4uLi4uIyMgJyArIG1nZG9tYWluKTtcclxuICAgIHRoaXMuX21vZGVsLmRvbWFpbnMuZXZlcnkoZCA9PiB7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwiaGVyZSB3ZSBnbyBcIiAgKyBtZ2RvbWFpbiArIFwiIFwiICsgbWFrZU1vbmdvTmFtZShkKSk7XHJcbiAgICAgIGRlYnVnKFwiaGVyZSB3ZSBnbyBcIiArIG1nZG9tYWluICsgXCIgXCIgKyBtYWtlTW9uZ29OYW1lKGQpKTtcclxuICAgICAgaWYgKG1ha2VNb25nb05hbWUoZCkgPT09IG1ha2VNb25nb05hbWUobWdkb21haW4pKSB7XHJcbiAgICAgICAgZG9tYWluID0gZDtcclxuICAgICAgICBkZWJ1ZygnZ290IG9uZSAnICsgZCk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGRvbWFpbjtcclxuICB9XHJcblxyXG4gIC8qXHJcbiAgICBtYWtlU2NoZW1hKG1nZG9tYWluIDogc3RyaW5nKSAgOiBtb25nb29zZS5TY2hlbWEge1xyXG4gICAgICBkZWJ1ZygnbWFrZVNjaGVtYSBmb3IgJyArIG1nZG9tYWluKTtcclxuICAgICAvLyBjb25zb2xlLmxvZygnbWFrZXNjaGVtYSAnICsgbWdkb21haW4pO1xyXG4gICAgICB2YXIgZG9tYWluID0gdGhpcy5tb25nb29vc2VEb21haW5Ub0RvbWFpbihtZ2RvbWFpbik7XHJcbiAgICAgIGRlYnVnbG9nKCgpPT4gJyBkb21haW4gJyArIGRvbWFpbik7XHJcbiAgICAgIGRlYnVnbG9nKCgpPT4gYCBhbGwgZG9tYWlucyBgICsgdGhpcy5fbW9kZWwuZG9tYWlucy5qb2luKFwiOyBcIikpO1xyXG4gICAgICB2YXIgY2F0cyA9IE1vZGVsLmdldENhdGVnb3JpZXNGb3JEb21haW4odGhpcy5fbW9kZWwsIGRvbWFpbik7XHJcbiAgICAgIHZhciByZXMgPSB7fTtcclxuICAgICAgY2F0cy5mb3JFYWNoKGNhdCA9PiB7XHJcbiAgICAgICAgcmVzW21ha2VNb25nb05hbWUoY2F0KV0gPSB7IHR5cGUgOiBTdHJpbmd9O1xyXG4gICAgICB9KVxyXG4gICAgICByZXR1cm4gbmV3IG1vbmdvb3NlLlNjaGVtYShyZXMpO1xyXG4gICAgfVxyXG4gICAgKi9cclxufVxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBNb2RlbEhhbmRsZSB7XHJcbiAgX3RoZU1vZGVsOiBJRk1vZGVsLklNb2RlbHM7XHJcbiAgX21nQnJpZGdlOiBNb25nb0JyaWRnZTtcclxuICBfbW9uZ29vc2U6IG1vbmdvb3NlLk1vbmdvb3NlO1xyXG4gIGNvbnN0cnVjdG9yKHRoZU1vZGVsOiBJRk1vZGVsLklNb2RlbHMpIHtcclxuICAgIHRoaXMuX3RoZU1vZGVsID0gdGhlTW9kZWw7XHJcbiAgICB0aGlzLl9tb25nb29zZSA9IHRoaXMuX3RoZU1vZGVsLm1vbmdvSGFuZGxlICYmIHRoaXMuX3RoZU1vZGVsLm1vbmdvSGFuZGxlLm1vbmdvb3NlO1xyXG4gICAgdGhpcy5fbWdCcmlkZ2UgPSBuZXcgTW9uZ29CcmlkZ2UodGhlTW9kZWwpO1xyXG4gIH1cclxuICBxdWVyeShkb21haW46IHN0cmluZywgcXVlcnk6IGFueSk6IFByb21pc2U8YW55PiB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICB2YXIgbWdtb2RlbG5hbWUgPSBNb2RlbC5nZXRNb25nb29zZU1vZGVsTmFtZUZvckRvbWFpbih0aGlzLl90aGVNb2RlbCwgZG9tYWluKTsgNFxyXG4gICAgZGVidWdsb2coJ3F1ZXJ5ICcgKyBkb21haW4gKyAnID4+JyArIG1nbW9kZWxuYW1lICsgJyAnICsgSlNPTi5zdHJpbmdpZnkocXVlcnksIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgcmV0dXJuIGdldERCQ29ubmVjdGlvbih0aGlzLl9tb25nb29zZSkudGhlbigobW9uZ29vc2UpID0+IHtcclxuXHJcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKDEpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgZGVidWdsb2coJ2NvbnN0cnVjdGluZyBtb2RlbCBmb3IgJyArIG1nbW9kZWxuYW1lKTtcclxuICAgICAgICAgIGlmICh0aGF0Ll90aGVNb2RlbC5tb25nb0hhbmRsZS5tb25nb29zZS5tb2RlbE5hbWVzKCkuaW5kZXhPZihtZ21vZGVsbmFtZSkgPCAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgICR7ZG9tYWlufSAvICR7bWdtb2RlbG5hbWV9IGlzIG5vdCBhIHByZXNlbnQgbW9kZWwgYCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB2YXIgbW9kZWwgPSB0aGF0Ll90aGVNb2RlbC5tb25nb0hhbmRsZS5tb25nb29zZS5tb2RlbChtZ21vZGVsbmFtZSk7XHJcbiAgICAgICAgICAvL1xyXG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ3RyeTEnKTtcclxuICAgICAgICAgIC8vICB0aGF0Ll9tb2RlbHNbbWdkb21haW5dID0gbW9uZ29vc2UubW9kZWwobWdkb21haW4pO1xyXG4gICAgICAgICAgLy8gIGNvbnNvbGUubG9nKCd0cnkyJyk7XHJcbiAgICAgICAgICAvLyAgdGhhdC5fc2NoZW1hc1ttZ2RvbWFpbl0gPSBtb25nb29zZS5tb2RlbChtZ2RvbWFpbikuc2NoZW1hO1xyXG4gICAgICAgICAgLy99XHJcbiAgICAgICAgICAvKlxyXG4gICAgICAgICAgICBpZighdGhhdC5fbW9kZWxzW21nZG9tYWluXSkge1xyXG4gICAgICAgICAgICAgIHRoYXQuX3NjaGVtYXNbbWdkb21haW5dID0gdGhhdC5fbWdCcmlkZ2UubWFrZVNjaGVtYShtZ2RvbWFpbik7XHJcbiAgICAgICAgICAgICAgdGhhdC5fbW9uZ29vc2UubW9kZWxOYW1lcygpO1xyXG4gICAgICAgICAgICAgIHRoYXQuX21vZGVsc1ttZ2RvbWFpbl0gPSBtb25nb29zZS5tb2RlbChtZ2RvbWFpbix0aGF0Ll9zY2hlbWFzW21nZG9tYWluXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAqL1xyXG4gICAgICAgICAgLy8gIGNvbnNvbGUubG9nKCdydW5uaW5nIHN0dWZmJylcclxuICAgICAgICAgIC8vIGRiLmZpb3JpYm9tcy5hZ2dyZWdhdGUoWyB7ICRtYXRjaCA6IHt9fSwgeyAkZ3JvdXA6IHsgX2lkIDogeyBhIDogJyRCU1BOYW1lJywgYiA6ICckQXBwS2V5JyB9ICwgQlNQTmFtZSA6IHsgJGZpcnN0IDogJyRCU1BOYW1lJ30gLCBBcHBLZXkgOiB7ICRmaXJzdCA6ICckQXBwS2V5JyB9fX0seyAkcHJvamVjdDogeyBfaWQgOiAwLCBCU1BOYW1lIDogMSB9fV0sIHsgY3Vyc29yIDogeyAgYmF0Y2hTaXplIDogMH19KTtcclxuICAgICAgICAgIC8vdmFyIG1vZGVsID0gdGhhdC5fbW9kZWxzW21nZG9tYWluXTtcclxuICAgICAgICAgIC8vICBjb25zb2xlLmxvZygnaGVyZSBtb2RlbCAnICsgbW9kZWwpO1xyXG4gICAgICAgICAgLy8gIG1vZGVsLmNvbGxlY3Rpb24uY291bnQoe30sIGZ1bmN0aW9uKGVycixudW1iZXIpIHtcclxuICAgICAgICAgIC8vICBjb25zb2xlLmxvZyhcImNvdW50ZWQgXCIgKyBudW1iZXIgKyBcIiBtZW1iZXJzIGluIGNvbGxlY3Rpb25cIik7XHJcbiAgICAgICAgICAvLyAgfSk7XHJcbiAgICAgICAgICAvLyAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHF1ZXJ5LCB1bmRlZmluZWQsMikpO1xyXG4gICAgICAgICAgLyogIG1vZGVsLmNvbGxlY3Rpb24uY291bnQoe30sIGZ1bmN0aW9uKGEpIHtcclxuICAgICAgICAgICAgICBkZWJ1Z2xvZygnbGV0cyBjb3VudCcgKyBhKTsgfSk7XHJcbiAgICAgICAgICAgICovXHJcbiAgICAgICAgICBkZWJ1Z2xvZygoKSA9PiAnaGVyZSBtb2RlbCAnICsgT2JqZWN0LmtleXMobW9kZWwpKTtcclxuICAgICAgICAgIHZhciByZXNxID0gbW9kZWwuYWdncmVnYXRlKHF1ZXJ5KS50aGVuKChyZXMpID0+IHtcclxuICAgICAgICAgICAgLy8gICBjb25zb2xlLmxvZyhcImhlcmUgdGhlIHJlc3VsdFwiICsgSlNPTi5zdHJpbmdpZnkocmVzKSk7XHJcbiAgICAgICAgICAgIHJlc29sdmUocmVzKTtcclxuICAgICAgICAgICAgLy9kYi5jbG9zZSgpO1xyXG4gICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XHJcbiAgICAgICAgICAgIGRiLmNsb3NlKCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaW5jSGFzaChoc2gsIGtleSkge1xyXG4gIGhzaFtrZXldID0gKGhzaFtrZXldIHx8IDApICsgMTtcclxufVxyXG5cclxuLypcclxuZXhwb3J0IGZ1bmN0aW9uIGdldERvbWFpbkZvclNlbnRlbmNlMih0aGVNb2RlbDogSUZNb2RlbC5JTW9kZWxzLCBzZW50ZW5jZSA6IElGRXJCYXNlLklTZW50ZW5jZSkgOiB7XHJcbiAgZG9tYWluOiBzdHJpbmcsXHJcbiAgICBjb2xsZWN0aW9uTmFtZTogc3RyaW5nLFxyXG4gICAgbW9kZWxOYW1lOiBzdHJpbmdcclxuICB9XHJcbntcclxuICAvLyB0aGlzIGlzIHNsb3BweSBhbmQgYmFkXHJcbiAgdmFyIHJlcyA9IHt9O1xyXG4gIHZhciBvID0gMHhGRkZGRkZGO1xyXG4gIHNlbnRlbmNlLmZvckVhY2godyA9PiB7XHJcbiAgICBpZiAody5ydWxlLndvcmRUeXBlID09PSBJRk1vZGVsLldPUkRUWVBFLkNBVEVHT1JZKSB7XHJcbiAgICAgIG8gPSBvICYgdy5ydWxlLmJpdFNlbnRlbmNlQW5kO1xyXG4gICAgfVxyXG4gICAgaWYgKHcucnVsZS53b3JkVHlwZSA9PT0gSUZNb2RlbC5XT1JEVFlQRS5GQUNUKSB7XHJcbiAgICAgIG8gPSBvICYgdy5ydWxlLmJpdFNlbnRlbmNlQW5kO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHZhciBkb21haW5zID0gTW9kZWwuZ2V0RG9tYWluc0ZvckJpdEZpZWxkKHRoZU1vZGVsLCBvKTtcclxuICBpZiAoZG9tYWlucy5sZW5ndGggIT09IDEpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignbW9yZSB0aGFuIG9uZSBkb21haW46IFwiJyArIGRvbWFpbnMuam9pbignXCIsIFwiJykgKyAnXCInKTtcclxuICB9XHJcbiAgaWYgKCFkb21haW5zWzBdKSB7XHJcbiAgICBjb25zb2xlLmxvZygncXVlcnkgd2l0aG91dCBhIGRvbWFpbiA6ICcgKyBTZW50ZW5jZS5kdW1wTmljZUFycihbc2VudGVuY2VdKSk7XHJcbiAgfVxyXG4gIHJldHVybiB7XHJcbiAgICBkb21haW46IGRvbWFpbnNbMF0sXHJcbiAgICBjb2xsZWN0aW9uTmFtZTogTW9kZWwuZ2V0TW9uZ29Db2xsZWN0aW9uTmFtZUZvckRvbWFpbih0aGVNb2RlbCwgZG9tYWluc1swXSksXHJcbiAgICBtb2RlbE5hbWU6IE1vZGVsLmdldE1vZGVsTmFtZUZvckRvbWFpbih0aGVNb2RlbC5tb25nb0hhbmRsZSwgZG9tYWluc1swXSlcclxuICB9XHJcbn07XHJcblxyXG4qL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERvbWFpbkZvclNlbnRlbmNlU2FmZSh0aGVNb2RlbDogSUZNb2RlbC5JTW9kZWxzLCBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlKSA6IHN0cmluZyB7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiBnZXREb21haW5JbmZvRm9yU2VudGVuY2UodGhlTW9kZWwsc2VudGVuY2UpLmRvbWFpbjtcclxuICB9IGNhdGNoKGUpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogZ2l2ZW4gYSBTZW50ZW5jZSwgb2J0YWluIHRoZSBkb21haW4gZm9yIGl0XHJcbiAqIEBwYXJhbSB0aGVNb2RlbFxyXG4gKiBAcGFyYW0gc2VudGVuY2VcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREb21haW5JbmZvRm9yU2VudGVuY2UodGhlTW9kZWw6IElGTW9kZWwuSU1vZGVscywgc2VudGVuY2U6IElGRXJCYXNlLklTZW50ZW5jZSk6IHtcclxuICBkb21haW46IHN0cmluZyxcclxuICBjb2xsZWN0aW9uTmFtZTogc3RyaW5nLFxyXG4gIG1vZGVsTmFtZTogc3RyaW5nXHJcbn0ge1xyXG4gIC8vIHRoaXMgaXMgc2xvcHB5IGFuZCBiYWRcclxuICB2YXIgcmVzID0ge307XHJcbiAgdmFyIG8gPSAweEZGRkZGRkY7XHJcbiAgc2VudGVuY2UuZm9yRWFjaCh3ID0+IHtcclxuICAgIGlmICh3LnJ1bGUud29yZFR5cGUgPT09IElGTW9kZWwuV09SRFRZUEUuQ0FURUdPUlkpIHtcclxuICAgICAgbyA9IG8gJiB3LnJ1bGUuYml0U2VudGVuY2VBbmQ7XHJcbiAgICAgIE1vZGVsLmdldERvbWFpbnNGb3JDYXRlZ29yeSh0aGVNb2RlbCwgdy5tYXRjaGVkU3RyaW5nKS5mb3JFYWNoKGQgPT4ge1xyXG4gICAgICAgIGluY0hhc2gocmVzLCBkKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAody5ydWxlLndvcmRUeXBlID09PSBJRk1vZGVsLldPUkRUWVBFLkZBQ1QpIHtcclxuICAgICAgbyA9IG8gJiB3LnJ1bGUuYml0U2VudGVuY2VBbmQ7XHJcbiAgICAgIC8vICAgY29uc29sZS5sb2coYCR7dy5ydWxlLmJpdGluZGV4fSAke3cuYml0aW5kZXh9ICR7dy5ydWxlLmJpdFNlbnRlbmNlQW5kfSAke299IGApO1xyXG4gICAgICBNb2RlbC5nZXREb21haW5zRm9yQ2F0ZWdvcnkodGhlTW9kZWwsIHcuY2F0ZWdvcnkpLmZvckVhY2goZCA9PiB7XHJcbiAgICAgICAgaW5jSGFzaChyZXMsIGQpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9KTtcclxuICB2YXIgZG9tYWlucyA9IE1vZGVsLmdldERvbWFpbnNGb3JCaXRGaWVsZCh0aGVNb2RlbCwgbyk7XHJcbiAgaWYgKGRvbWFpbnMubGVuZ3RoICE9PSAxKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ21vcmUgdGhhbiBvbmUgZG9tYWluOiBcIicgKyBkb21haW5zLmpvaW4oJ1wiLCBcIicpICsgJ1wiJyk7XHJcbiAgfVxyXG4gIGlmICghZG9tYWluc1swXSkge1xyXG4gICAgY29uc29sZS5sb2coJ3F1ZXJ5IHdpdGhvdXQgYSBkb21haW4gOiAnICsgU2VudGVuY2UuZHVtcE5pY2VBcnIoW3NlbnRlbmNlXSkpO1xyXG4gIH1cclxuICByZXR1cm4ge1xyXG4gICAgZG9tYWluOiBkb21haW5zWzBdLFxyXG4gICAgY29sbGVjdGlvbk5hbWU6IE1vZGVsLmdldE1vbmdvQ29sbGVjdGlvbk5hbWVGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbnNbMF0pLFxyXG4gICAgbW9kZWxOYW1lOiBNb2RlbC5nZXRNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwubW9uZ29IYW5kbGUsIGRvbWFpbnNbMF0pXHJcbiAgfVxyXG59O1xyXG5cclxuLy9pbXBvcnQgeyBJRkVyQmFzZSBhcyBJTWF0Y2gsIEVyRXJyb3IgYXMgRXJFcnJvciB9IGZyb20gJy4vbWF0Y2gvaW5kZXgnO1xyXG5cclxuaW1wb3J0ICogYXMgbVEgZnJvbSAnLi9hc3QycXVlcnkvYXN0Mk1RdWVyeSc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNSZXMge1xyXG4gIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UsXHJcbiAgcmVjb3JkczogYW55W11cclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUVJlc3VsdCB7XHJcbiAgZG9tYWluOiBzdHJpbmcsXHJcbiAgc2VudGVuY2U6IElGRXJCYXNlLklTZW50ZW5jZSxcclxuICBjb2x1bW5zOiBzdHJpbmdbXSxcclxuICByZXN1bHRzOiBzdHJpbmdbXVtdXHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElSZXN1bHRSZWNvcmQgIHsgW2tleTogc3RyaW5nXSA6IE51bWJlciB8IHN0cmluZyB9O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUXVlcnlSZXN1bHQge1xyXG4gIGRvbWFpbjogc3RyaW5nLFxyXG4gIGF1eCA6IHtcclxuICAgIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UsXHJcbiAgICB0b2tlbnMgOiBzdHJpbmdbXSxcclxuICAgIGFzdG5vZGU/IDogQVNULkFTVE5vZGVcclxuICB9XHJcbiAgZXJyb3JzIDogYW55LCAgLy8gdW5kZWZpbmVkIGZvciBvayByZXN1bHRcclxuICAvKipcclxuICAgKiBDb2x1bW5zIHJlbGV2YW50IGZvciBvdXRwdXQsIGluIFwicXVlcnlcIiAvIFwic2VudGVuY2VcIiBvcmRlclxyXG4gICAqL1xyXG4gIGNvbHVtbnM6IHN0cmluZ1tdLCAvLyBjb2x1bW5zIHJlbGV2YW50IGZvciBvdXRwdXRcclxuICBhdXhjb2x1bW5zPyAgOiBzdHJpbmdbXSwgIC8vIGNvbnRhaW5zIGFkZGl0aW9uYWwgY29sdW1ucywgdXN1YWxseSBub3QgcHJlc2VudCFcclxuICByZXN1bHRzOiBJUmVzdWx0UmVjb3JkW11cclxufTtcclxuXHJcblxyXG5cclxuZnVuY3Rpb24gZ2V0REJDb25uZWN0aW9uKG1vbmdvb3NlSG5kbDogbW9uZ29vc2UuTW9uZ29vc2UpOiBQcm9taXNlPG1vbmdvb3NlLkNvbm5lY3Rpb24+IHtcclxuICBpZiAobW9uZ29vc2VIbmRsKSB7XHJcbiAgICBkZWJ1Z2xvZygnYXNzdW1pbmcgcHJlc2VudCBoYW5kbGUnKTtcclxuICAgIC8vIHdlIGFzc3VtZSB3ZSBhcmUgY29ubmVjdGVkXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vbmdvb3NlSG5kbC5jb25uZWN0aW9uKTtcclxuICB9XHJcbiAgdGhyb3cgRXJyb3IoJ2hvdyBpcyB0aGlzIGdvbm5hIHdvcmsnKTtcclxufVxyXG5cclxuaW1wb3J0ICogYXMgU2VudGVuY2VQYXJzZXIgZnJvbSAnLi9zZW50ZW5jZXBhcnNlcic7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElRdWVyeSB7XHJcbiAgZG9tYWluOiBzdHJpbmcsXHJcbiAgY29sdW1uczogc3RyaW5nW10sXHJcbiAgYXV4Y29sdW1ucz8gOiBzdHJpbmdbXSxcclxuICByZXZlcnNlTWFwOiBJUmV2ZXJzZU1hcCxcclxuICBxdWVyeTogYW55XHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElQcmVwYXJlZFF1ZXJ5IGV4dGVuZHMgU2VudGVuY2VQYXJzZXIuSVBhcnNlZFNlbnRlbmNlcyB7XHJcbiAgcXVlcmllczogSVF1ZXJ5W11cclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlQWdncmVnYXRlRnJvbUFzdChhc3Rub2RlOiBBU1QuQVNUTm9kZSwgc2VudGVuY2U6IElGTW9kZWwuSVdvcmRbXSxcclxuICBtb2RlbHMgOiBJRk1vZGVsLklNb2RlbHMsXHJcbiAgY29sbGVjdGlvbk5hbWUgOiBzdHJpbmcsIGZpeGVkQ2F0ZWdvcmllcykge1xyXG4gIHZhciBub2RlRmllbGRMaXN0ID0gYXN0bm9kZS5jaGlsZHJlblswXS5jaGlsZHJlblswXTtcclxuICB2YXIgbm9kZUZpbHRlciA9IGFzdG5vZGUuY2hpbGRyZW5bMV07XHJcbiAgdmFyIG1vbmdvTWFwID0gdW5kZWZpbmVkIGFzIElGTW9kZWwuQ2F0TW9uZ29NYXA7XHJcbiAgbW9uZ29NYXAgPSBtb2RlbHMubW9uZ29IYW5kbGUubW9uZ29NYXBzW2NvbGxlY3Rpb25OYW1lXTtcclxuICB2YXIgbW9kZWxIYW5kbGVSYXcgPSBtb2RlbHMubW9uZ29IYW5kbGU7XHJcbiAgLy8gdG9kbzogZGV0ZWN0IGFueSBleHBsaWNpdCBzb3J0c1xyXG4gIC8vIHsgc29ydENhcnRlZ29yeUxpc3QgOiBbXCJjYXQxXCJdLFxyXG4gIC8vICBbIHtjYXQxIDogMX0gLHsgY2F0MiA6IC0xfSBdXHJcbiAgLy9cclxuICAvLyB0aGVuIGlmZiBleHBsaWNpdCBzb3J0LFxyXG4gIC8vIHByb2plY3Qgb3V0IGNhdCtzb3J0Q2FydCwgdGhlIHRoZW4gc29ydCBieSBpdCwgb25seSB0aGVuIHByb2plY3Qgb3V0IGRlc2lyZWRjYXRcclxuICAvL1xyXG4gIC8vfS8vXHJcbiAgdmFyIGV4cGxpY2l0U29ydCA9IG1RLmV4dHJhY3RFeHBsaWNpdFNvcnRGcm9tQXN0KCBub2RlRmlsdGVyLCBzZW50ZW5jZSwgbW9uZ29NYXAsIGNvbGxlY3Rpb25OYW1lLCBtb2RlbEhhbmRsZVJhdyApO1xyXG5cclxuICB2YXIgbWF0Y2ggPSBtUS5tYWtlTW9uZ29NYXRjaEZyb21Bc3Qobm9kZUZpbHRlciwgc2VudGVuY2UsICBtb25nb01hcCwgY29sbGVjdGlvbk5hbWUsIG1vZGVsSGFuZGxlUmF3KTtcclxuICAvLyBUT0RPOiBiZSBiZXR0ZXIgdGhhbiBmdWxsIHVud2luZCwgdXNlIG9ubHkgcmVsZWx2YW50IGNhdGVnb3JpZXMhXHJcbiAgdmFyIHVud2luZCA9IE1vbmdvTWFwLnVud2luZHNGb3JOb250ZXJtaW5hbEFycmF5cyhtb25nb01hcCk7XHJcbiAgdmFyIGhlYWQgPSBbbWF0Y2hdIGFzIGFueVtdO1xyXG4gIGlmICh1bndpbmQubGVuZ3RoKSB7XHJcbiAgICBoZWFkID0gaGVhZC5jb25jYXQodW53aW5kKTtcclxuICAgIGhlYWQucHVzaChtYXRjaCk7XHJcbiAgfVxyXG4gIHZhciBjYXRlZ29yeUxpc3QgPSBtUS5nZXRDYXRlZ29yeUxpc3QoZml4ZWRDYXRlZ29yaWVzLCBub2RlRmllbGRMaXN0LCBzZW50ZW5jZSk7XHJcbiAgdmFyIGNhdGVnb3J5TGlzdFBsdXNFeHBsaWNpdFNvcnQgPSBtUS5hbWVuZENhdGVnb3J5TGlzdChleHBsaWNpdFNvcnQsIGNhdGVnb3J5TGlzdCk7XHJcbiAgdmFyIHByb2ogPSBtUS5tYWtlTW9uZ29Qcm9qZWN0aW9uRnJvbUFzdChjYXRlZ29yeUxpc3QsIG1vbmdvTWFwKTtcclxuICB2YXIgc29ydCA9IG1RLm1ha2VNb25nb1NvcnRGcm9tQXN0KGNhdGVnb3J5TGlzdCwgbW9uZ29NYXApO1xyXG4gIHZhciBncm91cCA9IG1RLm1ha2VNb25nb0dyb3VwRnJvbUFzdChjYXRlZ29yeUxpc3QsIG1vbmdvTWFwKTtcclxuICB2YXIgY29sdW1uc1JldmVyc2VNYXAgPSBtUS5tYWtlTW9uZ29Db2x1bW5zRnJvbUFzdChjYXRlZ29yeUxpc3QsIG1vbmdvTWFwKTtcclxuXHJcbiAgY29uc29sZS5sb2coXCIgY2F0UGx1cyBcIiArIEpTT04uc3RyaW5naWZ5KGNhdGVnb3J5TGlzdFBsdXNFeHBsaWNpdFNvcnQpKTtcclxuICB2YXIgcHJvakV4cGxpY2l0ID0gbVEubWFrZU1vbmdvUHJvamVjdGlvbkZyb21Bc3QoY2F0ZWdvcnlMaXN0UGx1c0V4cGxpY2l0U29ydCwgbW9uZ29NYXApO1xyXG4gIHZhciBzb3J0RXhwbGljaXQgPSBtUS5tYWtlTW9uZ29FeHBsaWNpdFNvcnQoZXhwbGljaXRTb3J0LCBjYXRlZ29yeUxpc3QsIG1vbmdvTWFwKTtcclxuICB2YXIgZ3JvdXBFeHBsaWNpdCA9IG1RLm1ha2VNb25nb0dyb3VwRnJvbUFzdChjYXRlZ29yeUxpc3RQbHVzRXhwbGljaXRTb3J0LCBtb25nb01hcCk7XHJcbiAgLy8gICBjb25zb2xlLmxvZygnIHF1ZXJ5OiAnICsgSlNPTi5zdHJpbmdpZnkocikpOyAvLyBob3cgdG8gZ2V0IGRvbWFpbj9cclxuICAvLyB0ZXN0LmVxdWFsKGRvbWFpbiwgJ0Zpb3JpQk9NJywnIGdvdCBkb21haW4nKTtcclxuICBjb25zb2xlLmxvZyhcIiBleHBsaWNpdFNvcnRcIiArIEpTT04uc3RyaW5naWZ5KGV4cGxpY2l0U29ydCkpO1xyXG4gIHZhciBxdWVyeSA9ICggZXhwbGljaXRTb3J0Lmxlbmd0aCA+IDApID9cclxuICAgICAgICBoZWFkLmNvbmNhdChbc29ydEV4cGxpY2l0LCBncm91cEV4cGxpY2l0LCBwcm9qRXhwbGljaXQsIHNvcnRFeHBsaWNpdCwgcHJvaiBdKVxyXG4gICAgICA6IGhlYWQuY29uY2F0KFtncm91cCwgcHJvaiwgc29ydF0pO1xyXG4gIHJldHVybiB7IHF1ZXJ5OiBxdWVyeSwgY29sdW1uc1JldmVyc2VNYXA6IGNvbHVtbnNSZXZlcnNlTWFwIH07XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbnNGaXhlZENhdGVnb3JpZXModGhlTW9kZWw6IElGTW9kZWwuSU1vZGVscywgZG9tYWluOiBzdHJpbmcsIGZpeGVkQ2F0ZWdvcmllczogc3RyaW5nW10pOiBib29sZWFuIHtcclxuICBpZiAoZml4ZWRDYXRlZ29yaWVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG4gIHZhciBjYXRzID0gTW9kZWwuZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCwgZG9tYWluKTtcclxuICByZXR1cm4gXy5pbnRlcnNlY3Rpb24oY2F0cywgZml4ZWRDYXRlZ29yaWVzKS5sZW5ndGggPT09IGZpeGVkQ2F0ZWdvcmllcy5sZW5ndGg7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhdWdtZW50Q2F0ZWdvcmllc1dpdGhVUkkoZml4ZWRDYXRlZ29yaWVzIDogc3RyaW5nW10sIHRoZU1vZGVsIDogSUZNb2RlbC5JTW9kZWxzLCBkb21haW4gOiBzdHJpbmcpIDogc3RyaW5nW10ge1xyXG4gIHZhciB1cmlzID0gTW9kZWwuZ2V0U2hvd1VSSUNhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbik7XHJcbiAgdmFyIHJhbmtzID0gTW9kZWwuZ2V0U2hvd1VSSVJhbmtDYXRlZ29yaWVzRm9yRG9tYWluKHRoZU1vZGVsLCBkb21haW4pO1xyXG4gIHJldHVybiBfLnVuaW9uKHVyaXMsIHJhbmtzLCBmaXhlZENhdGVnb3JpZXMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJlcGFyZVF1ZXJpZXMocXVlcnk6IHN0cmluZywgdGhlTW9kZWw6IElGTW9kZWwuSU1vZGVscywgZml4ZWRDYXRlZ29yaWVzOiBzdHJpbmdbXSwgb3B0aW9ucz8gOiBJUXVlcnlPcHRpb25zKTogSVByZXBhcmVkUXVlcnkge1xyXG4gIGRlYnVnbG9nKGBoZXJlIHF1ZXJ5OiAke3F1ZXJ5fWApO1xyXG4gIHZhciByID0gU2VudGVuY2VQYXJzZXIucGFyc2VTZW50ZW5jZVRvQXN0cyhxdWVyeSwgdGhlTW9kZWwsIHt9KTsgLy8gd29yZHMpO1xyXG4gIHZhciByZXMgPSBPYmplY3QuYXNzaWduKHt9LCByKSBhcyBJUHJlcGFyZWRRdWVyeTtcclxuICBkZWJ1Z2xvZyggKCk9PiAnIHBhcnNlZCAnICsgSlNPTi5zdHJpbmdpZnkocikpO1xyXG4gIHIuZG9tYWlucyA9IFtdO1xyXG4gIHJlcy5xdWVyaWVzID0gcmVzLmFzdHMubWFwKChhc3Rub2RlLCBpbmRleCkgPT4ge1xyXG4gICAgdmFyIHNlbnRlbmNlID0gci5zZW50ZW5jZXNbaW5kZXhdO1xyXG4gICAgZGVidWdsb2coKCkgPT4gYHJldHVybiAgYXN0IFske2luZGV4fV06YCArIEFTVC5hc3RUb1RleHQoYXN0bm9kZSkpO1xyXG4gICAgaWYgKCFhc3Rub2RlKSB7XHJcbiAgICAgIGRlYnVnbG9nKCgpID0+IEpTT04uc3RyaW5naWZ5KGAgZW1wdHkgbm9kZSBmb3IgJHtpbmRleH0gYCArIEpTT04uc3RyaW5naWZ5KHIuZXJyb3JzW2luZGV4XSwgdW5kZWZpbmVkLCAyKSkpO1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgdmFyIGRvbWFpblBpY2sgPSBnZXREb21haW5JbmZvRm9yU2VudGVuY2UodGhlTW9kZWwsIHNlbnRlbmNlKTtcclxuICAgIGRlYnVnbG9nKCgpID0+ICcgZG9tYWluUGljazogJyArIEpTT04uc3RyaW5naWZ5KGRvbWFpblBpY2ssIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgdmFyIGRvbWFpbkZpeGVkQ2F0ZWdvcmllcyA6IHN0cmluZ1tdID0gW107XHJcbiAgICBpZihvcHRpb25zICYmIG9wdGlvbnMuc2hvd1VSSSkge1xyXG4gICAgICBkb21haW5GaXhlZENhdGVnb3JpZXMgPSBhdWdtZW50Q2F0ZWdvcmllc1dpdGhVUkkoZml4ZWRDYXRlZ29yaWVzLCB0aGVNb2RlbCwgZG9tYWluUGljay5kb21haW4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZG9tYWluRml4ZWRDYXRlZ29yaWVzID0gZml4ZWRDYXRlZ29yaWVzO1xyXG4gICAgfVxyXG4gICAgdmFyIG1vbmdvTWFwID0gdGhlTW9kZWwubW9uZ29IYW5kbGUubW9uZ29NYXBzW2RvbWFpblBpY2suY29sbGVjdGlvbk5hbWVdO1xyXG4gICAgaWYgKCFjb250YWluc0ZpeGVkQ2F0ZWdvcmllcyh0aGVNb2RlbCwgZG9tYWluUGljay5kb21haW4sIGRvbWFpbkZpeGVkQ2F0ZWdvcmllcykpIHtcclxuICAgICAgZGVidWdsb2coKCkgPT4gSlNPTi5zdHJpbmdpZnkoYCBmaXhlZCBmaWVsZHMgbm90IHByZXNlbnQgaW4gZG9tYWluICR7ZG9tYWluUGljay5kb21haW59IGdpdmVuIGZpZWxkcyAke2RvbWFpbkZpeGVkQ2F0ZWdvcmllcy5qb2luKFwiO1wiKX0gZm9yICR7aW5kZXh9IGApKTtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIHZhciByZXMgPSBtYWtlQWdncmVnYXRlRnJvbUFzdChhc3Rub2RlLCBzZW50ZW5jZSx0aGVNb2RlbCwgZG9tYWluUGljay5jb2xsZWN0aW9uTmFtZSwgZG9tYWluRml4ZWRDYXRlZ29yaWVzKTtcclxuICAgIHZhciBxdWVyeSA9IHJlcy5xdWVyeTtcclxuICAgIHZhciBjb2x1bW5zUmV2ZXJzZU1hcCA9IHJlcy5jb2x1bW5zUmV2ZXJzZU1hcDtcclxuICAgIC8qXHJcbiAgICAgICAgdmFyIG5vZGVGaWVsZExpc3QgPSBhc3Rub2RlLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdO1xyXG4gICAgICAgIHZhciBub2RlRmlsdGVyID0gYXN0bm9kZS5jaGlsZHJlblsxXTtcclxuICAgICAgICB2YXIgbWF0Y2ggPSBtUS5tYWtlTW9uZ29NYXRjaEZyb21Bc3Qobm9kZUZpbHRlciwgc2VudGVuY2UsIG1vbmdvTWFwKTtcclxuXHJcbiAgICAvLyBUT0RPOiBiZSBiZXR0ZXIgdGhhbiBmdWxsIHVud2luZCwgdXNlIG9ubHkgcmVsZWx2YW50IGNhdGVnb3JpZXMhXHJcbiAgICAgICAgICB2YXIgTW9uZ29tTWFwID0gTW9uZ29NYXAudW53aW5kc0Zvck5vbnRlcm1pbmFsQXJyYXlzKG1vbmdvTWFwKTtcclxuXHJcbiAgICAgICAgdmFyIHByb2ogPSBtUS5tYWtlTW9uZ29Qcm9qZWN0aW9uRnJvbUFzdChub2RlRmllbGRMaXN0LCBzZW50ZW5jZSwgbW9uZ29NYXApO1xyXG4gICAgICAgIHZhciBjb2x1bW5zUmV2ZXJzZU1hcD0gbVEubWFrZU1vbmdvQ29sdW1uc0Zyb21Bc3Qobm9kZUZpZWxkTGlzdCwgc2VudGVuY2UsIG1vbmdvTWFwKTtcclxuICAgICAgICB2YXIgZ3JvdXAgPSBtUS5tYWtlTW9uZ29Hcm91cEZyb21Bc3Qobm9kZUZpZWxkTGlzdCwgc2VudGVuY2UsIG1vbmdvTWFwKTtcclxuICAgICAgICAvLyAgIGNvbnNvbGUubG9nKCcgcXVlcnk6ICcgKyBKU09OLnN0cmluZ2lmeShyKSk7IC8vIGhvdyB0byBnZXQgZG9tYWluP1xyXG4gICAgICAgLy8gdGVzdC5lcXVhbChkb21haW4sICdGaW9yaUJPTScsJyBnb3QgZG9tYWluJyk7XHJcbiAgICAgICAgdmFyIHF1ZXJ5ID0gWyBtYXRjaCwgZ3JvdXAsIHByb2ogXTtcclxuICAgICAgKi9cclxuICAgIHIuZG9tYWluc1tpbmRleF0gPSBkb21haW5QaWNrLmRvbWFpbjtcclxuICAgIGRlYnVnbG9nKCgpID0+IGAgbW9uZ28gcXVlcnkgZm9yIGNvbGxlY3Rpb24gJHtkb21haW5QaWNrLmNvbGxlY3Rpb25OYW1lfSA6IGAgKyBKU09OU3RyaW5naWZ5KHF1ZXJ5KSk7XHJcbiAgICBkZWJ1Z2xvZygoKSA9PiBgIGNvbHVtbm1hcCBgICsgSlNPTi5zdHJpbmdpZnkoY29sdW1uc1JldmVyc2VNYXAsIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZG9tYWluOiBkb21haW5QaWNrLmRvbWFpbixcclxuICAgICAgY29sbGVjdGlvbk5hbWU6IGRvbWFpblBpY2suY29sbGVjdGlvbk5hbWUsXHJcbiAgICAgIGNvbHVtbnM6IGNvbHVtbnNSZXZlcnNlTWFwLmNvbHVtbnMsXHJcbiAgICAgIGF1eGNvbHVtbnMgOiBbXSwgLy8gPyAvLyBUT0RPICBhbGxjb2x1bW5zXHJcbiAgICAgIHJldmVyc2VNYXA6IGNvbHVtbnNSZXZlcnNlTWFwLnJldmVyc2VNYXAsXHJcbiAgICAgIHF1ZXJ5OiBxdWVyeVxyXG4gICAgfTtcclxuICB9KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBJUHJvY2Vzc2VkTW9uZ29BbnN3ZXJzID0gSVF1ZXJ5UmVzdWx0W107XHJcbi8vZXh0ZW5kcyBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyB7XHJcbi8vICBxdWVyeXJlc3VsdHM6IFFSZXN1bHRbXVxyXG4vL31cclxuXHJcbi8qIHJlc3VsdCBmb3JtYXQgcmVkZXNpZ24gKi9cclxuLyogMSkgYWJpbGl0eSB0byB0cmFuc3BvcnQgdGhlIEFTVCAqL1xyXG4vKiAyKSBhYmlsaXR5IHRvIHRyYW5zcG9ydCBhdXhpbGlhcnkgaW5mb3JtYXRpb24gICggZS5nLiBfdXJsICkgICovXHJcbi8qIDMpIHJlc3VsdCBvYmplY3RzICBtYXAgW3sgIHByb3AgOiB2YWx1ZSB9XSBhcyB0aGlzIGlzIG1vcmUgbmF0dXJhbCAsIG5vdCBzdHJpbmdbXVtdICovXHJcbi8qIHNpbmdsZSBhcnJheSBvZiBcImFsdGVybmF0aW5nIG9wdGlvbnNcIiAqL1xyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcXVlcnlXaXRoQXV4Q2F0ZWdvcmllcyhxdWVyeTogc3RyaW5nLCB0aGVNb2RlbDogSUZNb2RlbC5JTW9kZWxzLCBhdXhpbGlhcnlfY2F0ZWdvcmllcyA6IHN0cmluZ1tdKTogUHJvbWlzZTxJUHJvY2Vzc2VkTW9uZ29BbnN3ZXJzPiB7XHJcbiAgdmFyIGhhbmRsZSA9IG5ldyBNb2RlbEhhbmRsZSh0aGVNb2RlbCk7XHJcbiAgcmV0dXJuIHF1ZXJ5SW50ZXJuYWwocXVlcnksIHRoZU1vZGVsLCBoYW5kbGUsIGF1eGlsaWFyeV9jYXRlZ29yaWVzKTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBxdWVyeVdpdGhVUkkocXVlcnk6IHN0cmluZywgdGhlTW9kZWw6IElGTW9kZWwuSU1vZGVscywgYXV4aWxpYXJ5X2NhdGVnb3JpZXMgOiBzdHJpbmdbXSk6IFByb21pc2U8SVByb2Nlc3NlZE1vbmdvQW5zd2Vycz4ge1xyXG4gIHZhciBoYW5kbGUgPSBuZXcgTW9kZWxIYW5kbGUodGhlTW9kZWwpO1xyXG4gIHJldHVybiBxdWVyeUludGVybmFsKHF1ZXJ5LCB0aGVNb2RlbCwgaGFuZGxlLCBbXSwgeyBzaG93VVJJIDogdHJ1ZSB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5KHF1ZXJ5OiBzdHJpbmcsIHRoZU1vZGVsOiBJRk1vZGVsLklNb2RlbHMpOiBQcm9taXNlPElQcm9jZXNzZWRNb25nb0Fuc3dlcnM+IHtcclxuICB2YXIgaGFuZGxlID0gbmV3IE1vZGVsSGFuZGxlKHRoZU1vZGVsKTtcclxuICByZXR1cm4gcXVlcnlJbnRlcm5hbChxdWVyeSwgdGhlTW9kZWwsIGhhbmRsZSwgW10pO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBJUmV2ZXJzZU1hcCA9IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVtYXBSZWNvcmQocmVjLCBjb2x1bW5zOiBzdHJpbmdbXSwgcmV2ZXJzZU1hcDogSVJldmVyc2VNYXApOiBJUmVzdWx0UmVjb3JkIHtcclxuICB2YXIgciA9IHt9O1xyXG4gIE9iamVjdC5rZXlzKHJlYykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgdmFyIHRhcmdldEtleSA9IHJldmVyc2VNYXBba2V5XSB8fCBrZXk7XHJcbiAgICByW3RhcmdldEtleV0gPSByZWNba2V5XTtcclxuICB9KTtcclxuICByZXR1cm4gcjsgLy8gY29sdW1ucy5tYXAoYyA9PiByW2NdKTtcclxufTtcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdFJlc3VsdFRvQXJyYXkoIHJlczogSVF1ZXJ5UmVzdWx0ICkgOiAoc3RyaW5nfCBOdW1iZXIpW11bXSB7XHJcbiAgZGVidWdsb2coJyBmdWxsIDonICsgSlNPTi5zdHJpbmdpZnkocmVzKSk7XHJcbiAgcmV0dXJuIHJlcy5yZXN1bHRzLm1hcCggcmVjID0+XHJcbiAgICByZXMuY29sdW1ucy5tYXAoYyA9PiByZWNbY10pXHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlbWFwUmVzdWx0KHJlcywgY29sdW1uczogc3RyaW5nW10sIHJldmVyc2VNYXA6IElSZXZlcnNlTWFwKTogSVJlc3VsdFJlY29yZFtdIHtcclxuICByZXR1cm4gcmVzLm1hcChyZWNvcmQgPT4gcmVtYXBSZWNvcmQocmVjb3JkLCBjb2x1bW5zLCByZXZlcnNlTWFwKSApO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElRdWVyeU9wdGlvbnMge1xyXG4gIHNob3dVUkkgOiBib29sZWFuXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcXVlcnlJbnRlcm5hbChxdWVyeXN0cmluZzogc3RyaW5nLCB0aGVNb2RlbDogSUZNb2RlbC5JTW9kZWxzLCBoYW5kbGU6IE1vZGVsSGFuZGxlLCBmaXhlZEZpZWxkczogc3RyaW5nW10sIG9wdGlvbnM/IDpJUXVlcnlPcHRpb25zICk6XHJcbiAgUHJvbWlzZTxJUHJvY2Vzc2VkTW9uZ29BbnN3ZXJzPiB7XHJcbiAgZml4ZWRGaWVsZHMgPSBmaXhlZEZpZWxkcyB8fCBbXTtcclxuICB2YXIgciA9IHByZXBhcmVRdWVyaWVzKHF1ZXJ5c3RyaW5nLCB0aGVNb2RlbCwgZml4ZWRGaWVsZHMsIG9wdGlvbnMpO1xyXG4gIGRlYnVnbG9nKCgpPT4gJ2hlcmUgcHJlcGFyZWQgcXVlcmllczogJyArIEpTT04uc3RyaW5naWZ5KHIpKTtcclxuICBpZihyLnF1ZXJpZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlPElQcm9jZXNzZWRNb25nb0Fuc3dlcnM+KFxyXG4gICAgICBbe1xyXG4gICAgICAgIGRvbWFpbiA6IHVuZGVmaW5lZCxcclxuICAgICAgICBhdXggOiB7IHNlbnRlbmNlIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgdG9rZW5zIDogci50b2tlbnMgfSxcclxuICAgICAgICBlcnJvcnMgOiByLmVycm9ycyxcclxuICAgICAgICBjb2x1bW5zIDogW10sXHJcbiAgICAgICAgYXV4Y29sdW1ucyA6IFtdLFxyXG4gICAgICAgIHJlc3VsdHMgOiBbXVxyXG4gICAgICB9XVxyXG4gICAgKTtcclxuICB9O1xyXG4gIHZhciBhUHJvbWlzZXMgPSByLnF1ZXJpZXMubWFwKChxdWVyeSwgaW5kZXgpID0+IHtcclxuICAgIGRlYnVnbG9nKCgpID0+IGBxdWVyeSAke2luZGV4fSBwcmVwYXJlZCBmb3IgZG9tYWluIGAgKyAocXVlcnkgJiYgcXVlcnkuZG9tYWluKSk7XHJcbiAgICBkZWJ1Z2xvZygoKSA9PiBgcXVlcnkgJHtpbmRleH0gcHJlcGFyZWQgZm9yIGRvbWFpbiBgICsgKHF1ZXJ5ICYmIHF1ZXJ5LmRvbWFpbiAmJiBnZXREb21haW5Gb3JTZW50ZW5jZVNhZmUodGhlTW9kZWwsci5zZW50ZW5jZXNbaW5kZXhdKSkpO1xyXG5cclxuICAgIGlmIChxdWVyeSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgLy8gVE9ETyBtYXkgbm90IGFsd2F5cyBiZSBwb3NzaWJsZVxyXG4gICAgICAgIGRvbWFpbiA6IGdldERvbWFpbkZvclNlbnRlbmNlU2FmZSh0aGVNb2RlbCxyLnNlbnRlbmNlc1tpbmRleF0pLFxyXG4gICAgICAgIGF1eCA6IHtcclxuICAgICAgICAgIHNlbnRlbmNlOiByLnNlbnRlbmNlc1tpbmRleF0sXHJcbiAgICAgICAgICB0b2tlbnMgOiByLnRva2Vuc1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXJyb3JzIDogci5lcnJvcnNbaW5kZXhdLFxyXG4gICAgICAgIGNvbHVtbnM6IFtdLFxyXG4gICAgICAgIGF1eGNvbHVtbnM6IFtdLFxyXG4gICAgICAgIHJlc3VsdHM6IFtdXHJcbiAgICAgIH0gLy9hcyBJUXVlcnlSZXN1bHRcclxuICAgIH1cclxuICAgIHJldHVybiBoYW5kbGUucXVlcnkocXVlcnkuZG9tYWluLCBxdWVyeS5xdWVyeSkudGhlbihyZXMgPT4ge1xyXG4gICAgICAvL2NvbnNvbGUubG9nKCdkYiByZXR1cm5lZCcgKyByZXMpO1xyXG4gICAgICB2YXIgcmVzQ2xlYW4gPSByZW1hcFJlc3VsdChyZXMsIHIucXVlcmllc1tpbmRleF0uY29sdW1ucywgcXVlcnkucmV2ZXJzZU1hcCk7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgZG9tYWluIDogcXVlcnkuZG9tYWluLFxyXG4gICAgICAgIGF1eCA6IHtcclxuICAgICAgICAgIHNlbnRlbmNlOiByLnNlbnRlbmNlc1tpbmRleF0sXHJcbiAgICAgICAgICB0b2tlbnMgOiByLnRva2Vuc1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXJyb3JzIDogci5lcnJvcnNbaW5kZXhdLFxyXG4gICAgICAgIGNvbHVtbnM6IHIucXVlcmllc1tpbmRleF0uY29sdW1ucyxcclxuICAgICAgICBhdXhjb2x1bW5zIDogci5xdWVyaWVzW2luZGV4XS5hdXhjb2x1bW5zLFxyXG4gICAgICAgIHJlc3VsdHM6IHJlc0NsZWFuXHJcbiAgICAgIH0gYXMgSVF1ZXJ5UmVzdWx0XHJcbiAgICB9KVxyXG4gIH1cclxuICApO1xyXG4gIHZhciB1ID0gUHJvbWlzZS5hbGw8SVF1ZXJ5UmVzdWx0PihhUHJvbWlzZXMpO1xyXG4gIHZhciBrID0gdS50aGVuPElQcm9jZXNzZWRNb25nb0Fuc3dlcnM+KGFSZXMgPT4ge1xyXG4gICAgZGVidWdsb2coXCIqKipoZXJlIHJlc3VsdHMgb2YgYWxsIHF1ZXJpZXMgXCIgKyBKU09OLnN0cmluZ2lmeShhUmVzLCB1bmRlZmluZWQsIDIpKTtcclxuICAgIHZhciBxdWVyeXJlc3VsdHMgPSBhUmVzOyAvLyBtZXJnZVJlc3VsdHMoYVJlcyk7XHJcbiAgICByZXR1cm4gcXVlcnlyZXN1bHRzO1xyXG4gICAgLypcclxuICAgIHZhciByZXMyID0ge1xyXG4gICAgICBkb21haW5cclxuXHJcbiAgICB9IGFzIElQcm9jZXNzZWRNb25nb0Fuc3dlcnM7XHJcblxyXG4gICAgLypcclxuICAgIHZhciByZXMyID0ge1xyXG4gICAgICBxdWVyeXJlc3VsdHM6IHF1ZXJ5cmVzdWx0cyxcclxuICAgICAgZXJyb3JzOiByLmVycm9ycywgLy8gW0VyRXJyb3IubWFrZUVycm9yX0VNUFRZX0lOUFVUKCldICxcclxuICAgICAgdG9rZW5zOiByLnRva2VucyxcclxuICAgIH0gYXMgSVByb2Nlc3NlZE1vbmdvQW5zd2VycztcclxuICAgICovXHJcbiAgIC8vIHJldHVybiByZXMyO1xyXG5cclxuICB9XHJcbiAgKTtcclxuICByZXR1cm4gaztcclxufVxyXG5cclxuXHJcbi8qXHJcblxyXG5cclxuICAgICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVdoYXRJc1R1cGVsQW5zd2VyIHtcclxuICAgICAgICAgICAgICBzZW50ZW5jZTogSVNlbnRlbmNlO1xyXG4gICAgICAgICAgICAgIHJlY29yZDogSVJlY29yZDtcclxuICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBzdHJpbmdbXTtcclxuICAgICAgICAgICAgICByZXN1bHQ6IHN0cmluZ1tdO1xyXG4gICAgICAgICAgICAgIF9yYW5raW5nOiBudW1iZXI7XHJcbiAgICAgICAgICB9XHJcblxyXG5cclxuXHJcblxyXG5cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgLy8gIGxvZ1BlcmYoJ2xpc3RBbGxXaXRoQ29udGV4dCcpO1xyXG4gIC8vICBwZXJmbG9nKFwidG90YWxMaXN0QWxsV2l0aENvbnRleHRcIik7XHJcbiAgICB2YXIgYVNlbnRlbmNlc1JlaW5mb3JjZWQgPSBhbmFseXplQ29udGV4dFN0cmluZyhjb250ZXh0UXVlcnlTdHJpbmcsIGFSdWxlcyk7XHJcbiAgLy8gIHBlcmZsb2coXCJMQVRXQyBtYXRjaGluZyByZWNvcmRzIChzPVwiICsgYVNlbnRlbmNlc1JlaW5mb3JjZWQuc2VudGVuY2VzLmxlbmd0aCArIFwiKS4uLlwiKTtcclxuICAgIHZhciBtYXRjaGVkQW5zd2VycyA9IFdoYXRJcy5tYXRjaFJlY29yZHNRdWlja011bHRpcGxlQ2F0ZWdvcmllcyhhU2VudGVuY2VzUmVpbmZvcmNlZCwgY2F0ZWdvcmllcywgcmVjb3JkcywgZG9tYWluQ2F0ZWdvcnlGaWx0ZXIpOyAvL2FUb29sOiBBcnJheTxJTWF0Y2guSVRvb2w+KTogYW55IC8qIG9iamVjdHN0cmVhbSAqIC8ge1xyXG4gICAgaWYoZGVidWdsb2cuZW5hYmxlZCl7XHJcbiAgICAgIGRlYnVnbG9nKFwiIG1hdGNoZWQgQW5zd2Vyc1wiICsgSlNPTi5zdHJpbmdpZnkobWF0Y2hlZEFuc3dlcnMsIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgfVxyXG4gIC8vICBwZXJmbG9nKFwiZmlsdGVyaW5nIHRvcFJhbmtlZCAoYT1cIiArIG1hdGNoZWRBbnN3ZXJzLnR1cGVsYW5zd2Vycy5sZW5ndGggKyBcIikuLi5cIik7XHJcbiAvLyAgIHZhciBtYXRjaGVkRmlsdGVyZWQgPSBXaGF0SXMuZmlsdGVyT25seVRvcFJhbmtlZFR1cGVsKG1hdGNoZWRBbnN3ZXJzLnR1cGVsYW5zd2Vycyk7XHJcbiAvLyAgIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XHJcbiAvLyAgICAgZGVidWdsb2coXCJMQVRXQyBtYXRjaGVkIHRvcC1yYW5rZWQgQW5zd2Vyc1wiICsgSlNPTi5zdHJpbmdpZnkobWF0Y2hlZEZpbHRlcmVkLCB1bmRlZmluZWQsIDIpKTtcclxuIC8vICAgfVxyXG4gIH1cclxufVxyXG4qLyJdfQ==
