'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
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
function makeAggregateFromAst(astnode, sentence, mongoMap, fixedCategories) {
    var nodeFieldList = astnode.children[0].children[0];
    var nodeFilter = astnode.children[1];
    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap);
    // TODO: be better than full unwind, use only relelvant categories!
    var unwind = mgnlq_model_1.MongoMap.unwindsForNonterminalArrays(mongoMap);
    var head = [match];
    if (unwind.length) {
        head = head.concat(unwind);
        head.push(match);
    }
    var categoryList = mQ.getCategoryList(fixedCategories, nodeFieldList, sentence);
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    var sort = mQ.makeMongoSortFromAst(categoryList, mongoMap);
    var columnsReverseMap = mQ.makeMongoColumnsFromAst(categoryList, mongoMap);
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    //   console.log(' query: ' + JSON.stringify(r)); // how to get domain?
    // test.equal(domain, 'FioriBOM',' got domain');
    var query = head.concat([group, proj, sort]);
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
        var res = makeAggregateFromAst(astnode, sentence, mongoMap, domainFixedCategories);
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

//# sourceMappingURL=mongoq.js.map

//# sourceMappingURL=mongoq.js.map
