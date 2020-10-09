'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMongoQuery = exports.makeMongoProjection = exports.makeMongoMatchF = exports.makeMongoExplicitSort = exports.makeMongoSortFromAst = exports.makeMongoProjectionFromAst = exports.getCategoryList = exports.makeMongoColumnsFromAst = exports.makeMongoGroupFromAst = exports.extractExplicitSortFromAst = exports.makeMongoMatchFromAst = exports.amendCategoryList = exports.isArray = exports.getNumberArg = exports.addSortExpression = exports.addObjectProp = exports.addFilterExpr = exports.addFilterToMatch = exports.makeMongoName = exports.getFactForNode = exports.getCategoryForNode = exports.getCategoryForNodePair = exports.makeMongoDistinctGroup = void 0;
const debug = require("debugf");
const _ = require("lodash");
//import * as Model from 'mgnlq_model';
const mgnlq_model_1 = require("mgnlq_model");
const debuglog = debug('ast2MQuery');
const chevrotain = require("chevrotain");
const AST = require("../ast");
const ast_1 = require("../ast");
// import * as Sentenceparser from '../sentenceparser';
var createToken = chevrotain.createToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;
;
/* construct a mongo query from an AST */
function makeMongoDistinctGroup(cols) {
    var res = { $group: { _id: {} } };
    cols.forEach(col => {
        res.$group[col] = '$' + col;
        res.$group._id[col] = '$' + col;
    });
    return res;
}
exports.makeMongoDistinctGroup = makeMongoDistinctGroup;
function getCategoryForNodePair(nodeCat, nodeFact, sentence) {
    //  either           <CAT> <FACT>
    //  or               undefined <FACT>
    //  or  More than    <number> <CAT>
    if (nodeCat && nodeCat.bearer && nodeCat.bearer.image === 'NUMBER') {
        return getCategoryForNodePair(nodeFact, nodeFact, sentence);
    }
    var startIndex = nodeCat && nodeCat.bearer && nodeCat.bearer.startOffset;
    debug('StartIndex : ' + startIndex);
    debug('StartIndex : ' + JSON.stringify(nodeCat, undefined, 2));
    if (typeof startIndex === "number" && (startIndex >= 0)) {
        return sentence[startIndex].matchedString;
    }
    if (!nodeCat || nodeCat.children.length === 0 || nodeCat.bearer === undefined) {
        var factIndex = nodeFact.bearer.startOffset;
        debug(JSON.stringify(sentence[factIndex], undefined, 2));
        return sentence[factIndex].category;
    }
    debug(' found no category ');
    return undefined;
}
exports.getCategoryForNodePair = getCategoryForNodePair;
;
function getCategoryForNode(nodeCat, sentence) {
    var startIndex = nodeCat && nodeCat.bearer && nodeCat.bearer.startOffset;
    if (nodeCat.type !== ast_1.ASTNodeType.CAT) {
        throw new Error(`Expected nodetype ${new AST.NodeType(ast_1.ASTNodeType.CAT).toString()} but was ${new AST.NodeType(nodeCat.type).toString()}`);
    }
    if (startIndex !== undefined && (startIndex >= 0)) {
        return sentence[startIndex].matchedString;
    }
    throw new Error(' no startindex' + JSON.stringify(nodeCat));
}
exports.getCategoryForNode = getCategoryForNode;
;
function getFactForNode(nodeFact, sentence) {
    var factIndex = nodeFact.bearer.startOffset;
    //console.log(JSON.stringify(sentence[factIndex], undefined, 2));
    return sentence[factIndex].matchedString; //.category;
}
exports.getFactForNode = getFactForNode;
;
function makeMongoName(s) {
    return mgnlq_model_1.MongoMap.makeMongoNameLC(s);
    //return s.replace(/[^a-zA-Z0-9]/g,'_');
}
exports.makeMongoName = makeMongoName;
function makeFilterObj(cat, filter) {
    var filterObj = {};
    filterObj[cat] = filter;
    return filterObj;
}
function addFilterToMatch(res, cat, filter) {
    if (res['$and']) {
        res['$and'].push(makeFilterObj(cat, filter));
        return res;
    }
    if (res[cat]) {
        var filters = Object.keys(res).sort().map(key => makeFilterObj(key, res[key]));
        filters.push(makeFilterObj(cat, filter));
        return { $and: filters };
    }
    res[cat] = filter;
    return res;
}
exports.addFilterToMatch = addFilterToMatch;
;
function addFilterExpr(res, expr) {
    if (res['$and']) {
        res['$and'].push(expr);
        return res;
    }
    res['$and'] = [expr];
    return res;
}
exports.addFilterExpr = addFilterExpr;
;
function addObjectProp(src, key, value) {
    src[key] = value;
    return src;
}
exports.addObjectProp = addObjectProp;
function addSortExpression(res, expr) {
    if (res['$sort']) {
        _.merge(res['$sort'], expr);
        return res;
    }
    res['$sort'] = expr;
    return res;
}
exports.addSortExpression = addSortExpression;
function getNumberArg(node, sentence) {
    var startIndex = node && node.bearer && node.bearer.startOffset;
    if (node.type !== ast_1.ASTNodeType.NUMBER) {
        throw new Error(`Expected nodetype ${new AST.NodeType(ast_1.ASTNodeType.CAT).toString()} but was ${new AST.NodeType(node.type).toString()}`);
    }
    if (startIndex !== undefined && (startIndex >= 0)) {
        //TODO treat one, two
        return parseInt(sentence[startIndex].matchedString);
    }
    throw new Error(' no startindex' + JSON.stringify(node));
}
exports.getNumberArg = getNumberArg;
;
function isArray(mongoHandleRaw, domain, category) {
    var cat = mgnlq_model_1.Model.getCategoryRec(mongoHandleRaw, domain, category);
    return _.isArray(cat.type);
}
exports.isArray = isArray;
function amendCategoryList(extractSortResult, catList) {
    var res = [];
    extractSortResult.forEach(a => {
        var name = a.categoryName;
        if (!catList.includes(name)) {
            res.push(name);
        }
    });
    res = res.concat(catList);
    return res;
}
exports.amendCategoryList = amendCategoryList;
function makeMongoMatchFromAst(node, sentence, mongoMap, domain, mongoHandleRaw) {
    debug(AST.astToText(node));
    //console.log("making mongo match " + AST.astToText(node));
    if (!node) {
        return { $match: {} };
    }
    if (node.type !== ast_1.ASTNodeType.LIST) {
        throw new Error('expected different nodetype ' + node.type);
    }
    var res = {};
    node.children.forEach(n => {
        var category = getCategoryForNodePair(n.children[0], n.children[1], sentence);
        //console.log('here is the domain ' + mongodomain);
        //console.log('here is the domain ' + Object.keys(theModel.mongoHandle.mongoMaps).join("\n"));
        //console.log(JSON.stringify(theModel.mongoHandle.mongoMaps[mongodomain], undefined,2));
        var mongocatfullpath = mongoMap[category].fullpath; // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
        debuglog(() => `here is the fullpath for ${category} is ${mongocatfullpath} `);
        var fact = (n.children.length > 1) && getFactForNode(n.children[1], sentence);
        if (n.type === ast_1.ASTNodeType.OPEqIn) {
            res = addFilterToMatch(res, mongocatfullpath, fact);
        }
        else if (n.type === ast_1.ASTNodeType.OPStartsWith) {
            res = addFilterToMatch(res, mongocatfullpath, { $regex: new RegExp(`^${fact.toLowerCase()}`, "i") });
        }
        else if (n.type === ast_1.ASTNodeType.OPEndsWith) {
            debuglog(() => '!!!!adding regex with expression ' + fact.toLowerCase());
            res = addFilterToMatch(res, mongocatfullpath, { $regex: new RegExp(`${fact.toLowerCase()}$`, "i") });
        } /* else if (n.type === NT.OPMoreThan) {
          var numberarg = getNumberArg(n.children[0], sentence);
          debuglog(() => '!!!!adding more than ' + numberarg + ' for category ' + category );
          //TODO //res = addFilterToMatch(res, mongocatfullpath, { 'count' ( mongocatfullpath ) gt numberarg , "i") });
          var argpath = '$' + mongocatfullpath;
          res = addFilterExpr( res,
            { $expr: { $gt: [ { $switch: { branches: [ { case: { $isArray : argpath }, then: { $size: argpath } }], default : 1 }}
                            , numberarg ]}} );
    
    //
    //        { $expr: { $gt: [ { $size: '$standort'},1 ]}} );
    //      ([ { $match : { $expr: { $gt: [ { $size: argpath }, numberarg ]}}}]);
    // two stage
    // use $addFields  with 3.4
    // try also $expr directly
    //       > db.demomdls.aggregate([ { $project : { standort_size : { $size: '$standort' }, standort:1, sender:1, uu : { $gt:[ { $size: '$standort' },3]} , abx : { $gt:[ "$standort", 1]}}}, { $match: { "standort_size": { $eq: { $size: '$standort'} }}}]);
    //      > db.demomdls.aggregate([ { $project : { standort_size : { $size: '$standort' }, standort:1, sender:1, uu : { $gt:[ { $size: '$standort' },3]} , abx : { $gt:[ "$standort", 1]}}}, { $match: { "standort_size": { $gt: 1 }}}]);
    //      { "_id" : ObjectId("5db88a185b66759cfc56bcd4"), "standort" : [ "Berlin", "München", "Frankfurt", "Hamburg", "Bremen" ], "sender" : "ARundfunkD", "standort_size" : 5, "uu" : true, "abx" : true }
    
    
        // exact match: db.demomdls.aggregate([ { $match: { standort : { $size : 3 }}},
    
        }*/
        else if (n.type === ast_1.ASTNodeType.OPLessThan || n.type === ast_1.ASTNodeType.OPMoreThan || n.type == ast_1.ASTNodeType.OPExactly) {
            var numberarg = getNumberArg(n.children[0], sentence);
            debuglog(() => '!!!!adding more than ' + numberarg + ' for category ' + category);
            //TODO //res = addFilterToMatch(res, mongocatfullpath, { 'count' ( mongocatfullpath ) gt numberarg , "i") });
            var argpath = '$' + mongocatfullpath;
            var extract = [{ $switch: { branches: [{ case: { $isArray: argpath }, then: { $size: argpath } }], default: 1 } },
                numberarg];
            switch (n.type) {
                case ast_1.ASTNodeType.OPLessThan:
                    res = addFilterExpr(res, { $expr: { $lt: extract } });
                    break;
                case ast_1.ASTNodeType.OPMoreThan:
                    res = addFilterExpr(res, { $expr: { $gt: extract } });
                    break;
                case ast_1.ASTNodeType.OPExactly:
                    res = addFilterExpr(res, { $expr: { $eq: extract } });
                    break;
            }
        }
        else if (n.type === ast_1.ASTNodeType.OPContains) {
            res = addFilterToMatch(res, mongocatfullpath, { $regex: new RegExp(`${fact.toLowerCase()}`, "i") });
        }
        else if (n.type === ast_1.ASTNodeType.OPGT || n.type === ast_1.ASTNodeType.OPLT
            || n.type == ast_1.ASTNodeType.OPEQ || n.type == ast_1.ASTNodeType.OPNE
            || n.type == ast_1.ASTNodeType.OPGE || n.type == ast_1.ASTNodeType.OPLE) {
            var fact = getFactForNode(n.children[1], sentence);
            var argpath = '$' + mongocatfullpath;
            var extract2 = [argpath, `${fact}`];
            // $switch: { branches: [ { case: { $isArray : argpath }, then: { $size: argpath } }], default : 1 }}
            var opstr = '$lt';
            switch (n.type) {
                case ast_1.ASTNodeType.OPLT:
                    opstr = '$lt';
                    break;
                case ast_1.ASTNodeType.OPGT:
                    opstr = '$gt';
                    break;
                case ast_1.ASTNodeType.OPEQ:
                    opstr = '$eq';
                    break;
                case ast_1.ASTNodeType.OPNE:
                    opstr = '$ne';
                    break;
                case ast_1.ASTNodeType.OPLE:
                    opstr = '$lte';
                    break;
                case ast_1.ASTNodeType.OPGE:
                    opstr = '$gte';
                    break;
            }
            if (isArray(mongoHandleRaw, domain, category)) {
                // db.demomdls.aggregate([ { $match: { standort : {  $elemMatch : { '$gte': 'M' }} }  }  ]);
                var filterobj = makeFilterObj(mongocatfullpath, { $elemMatch: makeFilterObj(opstr, `${fact}`) });
                res = addFilterExpr(res, filterobj);
            }
            else {
                var filterobj = makeFilterObj(mongocatfullpath, makeFilterObj(opstr, `${fact}`));
                res = addFilterExpr(res, filterobj);
            }
            //var numberarg = getNumberArg(n.children[0], sentence);
        }
        else if (n.type === ast_1.ASTNodeType.OPOrderBy || n.type === ast_1.ASTNodeType.OPOrderDescendingBy) {
            //var ascdesc = (n.type == NT.OPOrderDescendingBy) ? 1 : -1;
            // res = addSortExpression(res, addObjectProp( {}, mongocatfullpath, ascdesc ) );
            // TODO  this may be added in the wrong position
            //  one also has to assure the data is not projected out before
            //   throw new Error('Expected nodetype NT.OPEqIn but was ' + n.type);
            // { $sort : { sender : -1 } }`
        }
        else if (n.type === ast_1.ASTNodeType.OPNotExisting) {
            // { item : null }
            var filterobj = makeFilterObj(mongocatfullpath, null);
            res = addFilterExpr(res, filterobj);
            //  throw new Error('Expected nodetype OPExisiting not supported here  NT.OPEqIn but was ' + n.type);
        }
        else if (n.type === ast_1.ASTNodeType.OPExisting) {
            var filterobj = makeFilterObj(mongocatfullpath, { '$exists': true });
            res = addFilterExpr(res, filterobj);
            //  throw new Error('Expected nodetype OPExisiting not supported here  NT.OPEqIn but was ' + n.type);
        }
        else {
            throw new Error('Expected nodetype NT.OPEqIn but was ' + n.type);
        }
    });
    return { $match: res };
}
exports.makeMongoMatchFromAst = makeMongoMatchFromAst;
function extractExplicitSortFromAst(node, sentence, mongoMap, domain, mongoHandleRaw) {
    // return an array
    debug(AST.astToText(node));
    //console.log("making mongo match " + AST.astToText(node));
    if (!node) {
        return [];
    }
    if (node.type !== ast_1.ASTNodeType.LIST) {
        throw new Error('expected different nodetype ' + node.type);
    }
    var res = [];
    node.children.forEach(n => {
        var category = getCategoryForNodePair(n.children[0], n.children[1], sentence);
        var mongocatfullpath = mongoMap[category].fullpath; // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
        var fact = (n.children.length > 1) && getFactForNode(n.children[1], sentence);
        if (n.type === ast_1.ASTNodeType.OPOrderBy || n.type === ast_1.ASTNodeType.OPOrderDescendingBy) {
            var ascdesc = (n.type == ast_1.ASTNodeType.OPOrderDescendingBy) ? 1 : -1;
            res.push({
                categoryName: category,
                mongocatfullpath: mongocatfullpath,
                ascDesc: ascdesc
            });
        }
    });
    return res;
}
exports.extractExplicitSortFromAst = extractExplicitSortFromAst;
function makeMongoGroupFromAst(categoryList, mongoMap) {
    var res = {};
    categoryList.forEach(category => {
        var mongocatfullpath = mgnlq_model_1.MongoMap.getFirstSegment(mongoMap[category].paths); // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
        res[mongocatfullpath] = '$' + mongocatfullpath;
    });
    var r1 = { $group: Object.assign({ _id: Object.assign({}, res) }, {}) };
    var firstX = {};
    Object.keys(res).forEach(key => { firstX[key] = { $first: '$' + key }; });
    r1.$group = Object.assign(r1.$group, firstX);
    return r1;
}
exports.makeMongoGroupFromAst = makeMongoGroupFromAst;
function makeMongoColumnsFromAst(categoryList, mongoMap) {
    var res = {
        columns: [],
        reverseMap: {}
    };
    categoryList.forEach(category => {
        res.columns.push(category);
        var catmongo = mgnlq_model_1.MongoMap.getShortProjectedName(mongoMap, category);
        if (category !== catmongo) {
            res.reverseMap[catmongo] = category;
        }
    });
    return res;
}
exports.makeMongoColumnsFromAst = makeMongoColumnsFromAst;
function getCategoryList(fixedCategories, node, sentence) {
    var res = fixedCategories.slice();
    while (node.type !== ast_1.ASTNodeType.LIST)
        node = node.children[0];
    debug(AST.astToText(node));
    if (node.type !== ast_1.ASTNodeType.LIST) {
        throw new Error('expected different nodetype ' + node.type);
    }
    node.children.map(n => {
        if (n.type === ast_1.ASTNodeType.CAT) {
            var category = getCategoryForNode(n, sentence);
            if (res.indexOf(category) < fixedCategories.length) {
                res.push(category);
            }
        }
        else {
            throw new Error(`Expected nodetype ${new AST.NodeType(ast_1.ASTNodeType.CAT).toString()} but was ${new AST.NodeType(n.type).toString()}`);
        }
    });
    return res;
}
exports.getCategoryList = getCategoryList;
function makeMongoProjectionFromAst(categoryList, mongoMap) {
    var res = { _id: 0 };
    categoryList.map(category => {
        var mongocatfullpath = mongoMap[category].fullpath; //makeMongoName(cat);
        var shortName = mgnlq_model_1.MongoMap.getShortProjectedName(mongoMap, category);
        if (shortName === mongocatfullpath) {
            res[mongocatfullpath] = 1;
        }
        else {
            res[shortName] = "$" + mongocatfullpath;
        }
    });
    return { $project: res };
}
exports.makeMongoProjectionFromAst = makeMongoProjectionFromAst;
function makeMongoSortFromAst(categoryList, mongoMap) {
    var res = {};
    categoryList.forEach(category => {
        var shortName = mgnlq_model_1.MongoMap.getShortProjectedName(mongoMap, category);
        res[shortName] = 1;
    });
    return { $sort: res };
}
exports.makeMongoSortFromAst = makeMongoSortFromAst;
;
function makeMongoExplicitSort(explicitSort, categoryList, mongoMap) {
    var res = {};
    explicitSort.forEach(es => {
        var mongoCatName = es.mongocatfullpath;
        res[mongoCatName] = es.ascDesc;
    });
    categoryList.forEach(category => {
        var shortName = mgnlq_model_1.MongoMap.getShortProjectedName(mongoMap, category);
        if (res[shortName] == undefined) {
            res[shortName] = 1;
        }
    });
    return { $sort: res };
}
exports.makeMongoExplicitSort = makeMongoExplicitSort;
function makeMongoMatchF(filters) {
    var res = { $match: {} };
    //console.log('is match \n');
    filters.forEach(filter => {
        res.$match[filter.cat] = filter.value;
    });
    return res;
}
exports.makeMongoMatchF = makeMongoMatchF;
function makeMongoProjection(cols) {
    var res = { $project: { _id: 0 } };
    cols.forEach(col => {
        res.$project[col] = 1;
    });
    return res;
}
exports.makeMongoProjection = makeMongoProjection;
function makeMongoQuery(filters, resultcolumns) {
    var filter = makeMongoMatchF(filters);
    var group = makeMongoDistinctGroup(resultcolumns);
    var projection = makeMongoProjection(resultcolumns);
    return [filter, group, projection];
}
exports.makeMongoQuery = makeMongoQuery;

//# sourceMappingURL=ast2MQuery.js.map

//# sourceMappingURL=ast2MQuery.js.map
