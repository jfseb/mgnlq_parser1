'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
const mgnlq_er_1 = require("mgnlq_er");
const mgnlq_model_1 = require("mgnlq_model");
const debug = require("debugf");
const debuglog = debug('mongoq');
const chevrotain = require("chevrotain");
const AST = require("./ast");
var createToken = chevrotain.createToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;
const mongoose = require("mongoose");
const process = require("process");
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
var mongodb = process.env.ABOT_MONGODB || "testmodel";
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
    makeSchema(mgdomain) {
        debug('makeSchema for ' + mgdomain);
        // console.log('makeschema ' + mgdomain);
        var domain = this.mongoooseDomainToDomain(mgdomain);
        debuglog(() => ' domain ' + domain);
        debuglog(() => ` all domains ` + this._model.domains.join("; "));
        var cats = mgnlq_model_1.Model.getCategoriesForDomain(this._model, domain);
        var res = {};
        cats.forEach(cat => {
            res[makeMongoName(cat)] = { type: String };
        });
        return new mongoose.Schema(res);
    }
}
exports.MongoBridge = MongoBridge;
/*
export var talking = new Promise(function(resolve, reject) {
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function () {
    // we're connected!
    debug('here model names : ' + db.modelNames());
    resolve();
    debug('now model names : ' + db.modelNames());
    debug('done');
  });
});

talking.catch((err) => {
  console.log(err);
});
*/
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
        debuglog('query ' + domain + ' >>' + JSON.stringify(query, undefined, 2));
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
/**
 * given a Sentence, obtain the domain for it
 * @param theModel
 * @param sentence
 */
function getDomainForSentence(theModel, sentence) {
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
        console.log('query without a domain : ' + mgnlq_er_1.Sentence.dumpNiceArr([sentence]));
    }
    return {
        domain: domains[0],
        collectionName: makeMongoName(domains[0])
    };
}
exports.getDomainForSentence = getDomainForSentence;
;
const mQ = require("./ast2MQuery");
;
;
function fuseAndOrderResults(res) {
    var all = [];
    debug(JSON.stringify(res));
    res.forEach(res1 => {
        res1.records.forEach(rec => {
            var r2 = undefined;
            r2 = {
                record: rec,
                sentence: res1.sentence,
                categories: Object.keys(rec),
                result: Object.keys(rec).map(key => rec[key]),
                _ranking: 1
            };
            all.push(r2);
        });
    });
    return all;
}
exports.fuseAndOrderResults = fuseAndOrderResults;
/*
sentence: ISentence;
  record: IRecord;
  categories: string[];
  result: string[];
  _ranking: number;
*/
var mongoConnPromise = undefined;
function getDBConnection(mongooseHndl) {
    if (mongooseHndl) {
        debuglog('assuming present handle');
        // we assume we are connected
        return Promise.resolve(mongooseHndl.connection);
    }
    if (!mongoConnPromise) {
        mongoConnPromise = new Promise(function (resolve, reject) {
            mongoose.connect('mongodb://localhost/' + mongodb).then(() => {
                resolve(mongoose.connection);
            });
        });
    }
    return mongoConnPromise;
}
const SentenceParser = require("./sentenceparser");
;
;
function prepareQueries(query, theModel) {
    debuglog(`here query: ${query}`);
    var r = SentenceParser.parseSentenceToAsts(query, theModel, {}); // words);
    var res = Object.assign({}, r);
    r.domains = [];
    res.queries = res.asts.map((astnode, index) => {
        var sentence = r.sentences[index];
        debuglog(() => `return  ast [${index}]:` + AST.astToText(astnode));
        if (!astnode) {
            debuglog(() => JSON.stringify(` empty node for ${index} ` + JSON.stringify(r.errors[index], undefined, 2)));
            return undefined;
        }
        var nodeFieldList = astnode.children[0].children[0];
        var nodeFilter = astnode.children[1];
        var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, theModel);
        var proj = mQ.makeMongoProjectionFromAst(nodeFieldList, sentence, theModel);
        var columnsReverseMap = mQ.makeMongoColumnsFromAst(nodeFieldList, sentence, theModel);
        var group = mQ.makeMongoGroupFromAst(nodeFieldList, sentence, theModel);
        //   console.log(' query: ' + JSON.stringify(r)); // how to get domain?
        var domainPick = getDomainForSentence(theModel, sentence);
        r.domains[index] = domainPick.domain;
        // test.equal(domain, 'FioriBOM',' got domain');
        var query = [match, group, proj];
        debuglog(` mongo query for collection ${domainPick.collectionName} : ` + JSON.stringify(query, undefined, 2));
        return {
            domain: domainPick.domain,
            collectionName: domainPick.collectionName,
            columns: columnsReverseMap.columns,
            reverseMap: columnsReverseMap.reverseMap,
            query: query
        };
    });
    return res;
}
exports.prepareQueries = prepareQueries;
function mergeResults(r) {
    return r;
}
exports.mergeResults = mergeResults;
function query(query, theModel) {
    var handle = new ModelHandle(theModel);
    return queryInternal(query, theModel, handle);
}
exports.query = query;
function remapRecord(rec, columns, reverseMap) {
    var r = {};
    Object.keys(rec).forEach(key => {
        var targetKey = reverseMap[key] || key;
        r[targetKey] = rec[key];
    });
    return columns.map(c => r[c]);
}
exports.remapRecord = remapRecord;
;
function remapResult(res, columns, reverseMap) {
    return res.map(record => remapRecord(record, columns, reverseMap));
}
exports.remapResult = remapResult;
function queryInternal(querystring, theModel, handle) {
    var r = prepareQueries(querystring, theModel);
    var aPromises = r.queries.map((query, index) => {
        debuglog(() => `query ${index} prepared for domain ` + (query && query.domain));
        if (query === undefined) {
            return {
                sentence: r.sentences[index],
                columns: [],
                results: []
            };
        }
        return handle.query(query.domain, query.query).then(res => {
            //console.log('db returned' + res);
            var resClean = remapResult(res, r.queries[index].columns, query.reverseMap);
            return {
                sentence: r.sentences[index],
                columns: r.queries[index].columns,
                results: resClean
            };
        });
    });
    var u = Promise.all(aPromises);
    var k = u.then(aRes => {
        //   console.log("***here results of all queries " + JSON.stringify(aRes, undefined, 2));
        var queryresults = mergeResults(aRes);
        var res2 = {
            queryresults: queryresults,
            errors: r.errors,
            tokens: r.tokens,
        };
        return res2;
    });
    return k;
}
exports.queryInternal = queryInternal;

//# sourceMappingURL=mongoq.js.map
