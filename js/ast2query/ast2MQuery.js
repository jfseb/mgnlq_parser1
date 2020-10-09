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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0Mk1RdWVyeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hc3QycXVlcnkvYXN0Mk1RdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUE7OztBQVVaLGdDQUFnQztBQUNoQyw0QkFBNEI7QUFFNUIsdUNBQXVDO0FBQ3ZDLDZDQUEyRTtBQUUzRSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFckMseUNBQXlDO0FBQ3pDLDhCQUE4QjtBQUU5QixnQ0FBMkM7QUFFM0MsdURBQXVEO0FBRXZELElBQUksV0FBVyxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUM7QUFDekMsSUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztBQUM3QixJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBSzlCLENBQUM7QUFFRix5Q0FBeUM7QUFFekMsU0FBZ0Isc0JBQXNCLENBQUMsSUFBYztJQUNuRCxJQUFJLEdBQUcsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDakIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQzVCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDbEMsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFQRCx3REFPQztBQUVELFNBQWdCLHNCQUFzQixDQUFDLE9BQXFCLEVBQUUsUUFBcUIsRUFBRSxRQUE0QjtJQUUvRyxpQ0FBaUM7SUFDakMscUNBQXFDO0lBQ3JDLG1DQUFtQztJQUNuQyxJQUFLLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJ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