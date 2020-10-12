'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMongoQuery = exports.makeMongoProjection = exports.makeMongoMatchF = exports.makeMongoExplicitSort = exports.makeMongoSortFromAst = exports.makeMongoProjectionFromAst = exports.getCategoryList = exports.makeMongoColumnsFromAst = exports.makeMongoGroupFromAst = exports.extractExplicitSortFromAst = exports.makeMongoMatchFromAst = exports.amendCategoryList = exports.coerceFactLiteralToType = exports.isNumericTypeOrHasNumericType = exports.isArray = exports.getNumberArg = exports.addSortExpression = exports.addObjectProp = exports.addFilterExpr = exports.addFilterToMatch = exports.makeMongoName = exports.getFactForNode = exports.getCategoryForNode = exports.getCategoryForNodePair = exports.makeMongoDistinctGroup = void 0;
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
function isNumericTypeOrHasNumericType(mongoHandleRaw, domain, category) {
    var cat = mgnlq_model_1.Model.getCategoryRec(mongoHandleRaw, domain, category);
    console.log("category " + category + "  -> " + JSON.stringify(cat));
    return (cat.type == "Number" /* Number */) || (_.isArray(cat.type) && cat.type.indexOf("Number" /* Number */) >= 0);
}
exports.isNumericTypeOrHasNumericType = isNumericTypeOrHasNumericType;
function coerceFactLiteralToType(isNumeric, fact) {
    if (isNumeric) {
        try {
            var r = parseInt(fact);
            if (Number.isNaN(r)) {
                return fact;
            }
            return r;
        }
        catch (e) { }
    }
    return fact;
}
exports.coerceFactLiteralToType = coerceFactLiteralToType;
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
        var catIsNumeric = isNumericTypeOrHasNumericType(mongoHandleRaw, domain, category);
        var factCoerced = coerceFactLiteralToType(catIsNumeric, fact);
        if (n.type === ast_1.ASTNodeType.OPEqIn) {
            res = addFilterToMatch(res, mongocatfullpath, factCoerced);
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
            // flavours: 
            // less_than 3 CAT    ( a count measure )
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
            var factCoerced = coerceFactLiteralToType(catIsNumeric, fact);
            var argpath = '$' + mongocatfullpath;
            var extract2 = [argpath, factCoerced];
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
                var filterobj = makeFilterObj(mongocatfullpath, { $elemMatch: makeFilterObj(opstr, factCoerced) });
                res = addFilterExpr(res, filterobj);
            }
            else {
                var filterobj = makeFilterObj(mongocatfullpath, makeFilterObj(opstr, factCoerced));
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hc3QycXVlcnkvYXN0Mk1RdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUE7OztBQVVaLGdDQUFnQztBQUNoQyw0QkFBNEI7QUFFNUIsdUNBQXVDO0FBQ3ZDLDZDQUEyRTtBQUUzRSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFckMseUNBQXlDO0FBQ3pDLDhCQUE4QjtBQUU5QixnQ0FBMkM7QUFHM0MsdURBQXVEO0FBRXZELElBQUksV0FBVyxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUM7QUFDekMsSUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztBQUM3QixJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBSzlCLENBQUM7QUFFRix5Q0FBeUM7QUFFekMsU0FBZ0Isc0JBQXNCLENBQUMsSUFBYztJQUNuRCxJQUFJLEdBQUcsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDakIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQzVCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDbEMsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFQRCx3REFPQztBQUVELFNBQWdCLHNCQUFzQixDQUFDLE9BQW9CLEVBQUUsUUFBcUIsRUFBRSxRQUE0QjtJQUU5RyxpQ0FBaUM7SUFDakMscUNBQXFDO0lBQ3JDLG1DQUFtQztJQUNuQyxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRTtR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QUFNLENBQUMsS0FBSyxDQUFDO0lBQ3hDLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBUEQsMENBT0M7QUFFRCxTQUFnQixtQkFBbUIsQ0FBQyxJQUFjO0lBQ2hELElBQUksR0FBRyxHQUFHLEVBQUUsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDbkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNqQixHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN4QixDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQU5ELGtEQU1DO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLE9BQWtCLEVBQUUsYUFBdUI7SUFDeEUsSUFBSSxNQUFNLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3RDLElBQUksS0FBSyxHQUFHLHNCQUFzQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ2xELElBQUksVUFBVSxHQUFHLG1CQUFtQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3BELE9BQU8sQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBRXJDLENBQUM7QUFORCx3Q0FNQyIsImZpbGUiOiJhc3QycXVlcnkvYXN0Mk1RdWVyeS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xyXG5cclxuLy8gYmFzZWQgb246IGh0dHA6Ly9lbi53aWtpYm9va3Mub3JnL3dpa2kvQWxnb3JpdGhtX2ltcGxlbWVudGF0aW9uL1N0cmluZ3MvTGV2ZW5zaHRlaW5fZGlzdGFuY2VcclxuLy8gYW5kOiAgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9EYW1lcmF1JUUyJTgwJTkzTGV2ZW5zaHRlaW5fZGlzdGFuY2VcclxuXHJcbmltcG9ydCAqIGFzIG1vbmdvb3NlIGZyb20gJ21vbmdvb3NlJztcclxuLy9pbXBvcnQgKiBhcyBtMnMgZnJvbSAnLi9tb2RlbDJzY2hlbWEuanMnO1xyXG5cclxuaW1wb3J0IHsgU2VudGVuY2UgYXMgU2VudGVuY2UsIElGRXJCYXNlIGFzIElGRXJCYXNlIH0gZnJvbSAnLi4vbWF0Y2gvZXJfaW5kZXgnO1xyXG5cclxuaW1wb3J0ICogYXMgZGVidWcgZnJvbSAnZGVidWdmJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5cclxuLy9pbXBvcnQgKiBhcyBNb2RlbCBmcm9tICdtZ25scV9tb2RlbCc7XHJcbmltcG9ydCB7IElGTW9kZWwgYXMgSUZNb2RlbCwgTW9uZ29NYXAsIE1vZGVsIGFzIE1vZGVsIH0gZnJvbSAnbWdubHFfbW9kZWwnO1xyXG5cclxuY29uc3QgZGVidWdsb2cgPSBkZWJ1ZygnYXN0Mk1RdWVyeScpO1xyXG5cclxuaW1wb3J0ICogYXMgY2hldnJvdGFpbiBmcm9tICdjaGV2cm90YWluJztcclxuaW1wb3J0ICogYXMgQVNUIGZyb20gJy4uL2FzdCc7XHJcblxyXG5pbXBvcnQgeyBBU1ROb2RlVHlwZSBhcyBOVCB9IGZyb20gJy4uL2FzdCc7XHJcbmltcG9ydCB7IElNb25nb29zZUJhc2VUeXBlIH0gZnJvbSAnbWdubHFfbW9kZWwvanMvbWF0Y2gvaWZtYXRjaCc7XHJcblxyXG4vLyBpbXBvcnQgKiBhcyBTZW50ZW5jZXBhcnNlciBmcm9tICcuLi9zZW50ZW5jZXBhcnNlcic7XHJcblxyXG52YXIgY3JlYXRlVG9rZW4gPSBjaGV2cm90YWluLmNyZWF0ZVRva2VuO1xyXG52YXIgTGV4ZXIgPSBjaGV2cm90YWluLkxleGVyO1xyXG52YXIgUGFyc2VyID0gY2hldnJvdGFpbi5QYXJzZXI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElGaWx0ZXIge1xyXG4gIGNhdDogc3RyaW5nLFxyXG4gIHZhbHVlOiBzdHJpbmdcclxufTtcclxuXHJcbi8qIGNvbnN0cnVjdCBhIG1vbmdvIHF1ZXJ5IGZyb20gYW4gQVNUICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvRGlzdGluY3RHcm91cChjb2xzOiBzdHJpbmdbXSk6IGFueSB7XHJcbiAgdmFyIHJlcyA9IHsgJGdyb3VwOiB7IF9pZDoge30gfSB9O1xyXG4gIGNvbHMuZm9yRWFjaChjb2wgPT4ge1xyXG4gICAgcmVzLiRncm91cFtjb2xdID0gJyQnICsgY29sO1xyXG4gICAgcmVzLiRncm91cC5faWRbY29sXSA9ICckJyArIGNvbDtcclxuICB9KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2F0ZWdvcnlGb3JOb2RlUGFpcihub2RlQ2F0OiBBU1QuQVNUTm9kZSwgbm9kZUZhY3Q6IEFTVC5BU1ROb2RlLCBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlKSB7XHJcblxyXG4gIC8vICBlaXRoZXIgICAgICAgICAgIDxDQVQ+IDxGQUNUPlxyXG4gIC8vICBvciAgICAgICAgICAgICAgIHVuZGVmaW5lZCA8RkFDVD5cclxuICAvLyAgb3IgIE1vcmUgdGhhbiAgICA8bnVtYmVyPiA8Q0FUPlxyXG4gIGlmIChub2RlQ2F0ICYmIG5vZGVDYXQuYmVhcmVyICYmIG5vZGVDYXQuYmVhcmVyLmltYWdlID09PSAnTlVNQkVSJykge1xyXG4gICAgcmV0dXJuIGdldENhdGVnb3J5Rm9yTm9kZVBhaXIobm9kZUZhY3QsIG5vZGVGYWN0LCBzZW50ZW5jZSk7XHJcbiAgfVxyXG4gIHZhciBzdGFydEluZGV4ID0gbm9kZUNhdCAmJiBub2RlQ2F0LmJlYXJlciAmJiBub2RlQ2F0LmJlYXJlci5zdGFydE9mZnNldDtcclxuICBkZWJ1ZygnU3RhcnRJbmRleCA6ICcgKyBzdGFydEluZGV4KTtcclxuICBkZWJ1ZygnU3RhcnRJbmRleCA6ICcgKyBKU09OLnN0cmluZ2lmeShub2RlQ2F0LCB1bmRlZmluZWQsIDIpKTtcclxuICBpZiAodHlwZW9mIHN0YXJ0SW5kZXggPT09IFwibnVtYmVyXCIgJiYgKHN0YXJ0SW5kZXggPj0gMCkpIHtcclxuICAgIHJldHVybiBzZW50ZW5jZVtzdGFydEluZGV4XS5tYXRjaGVkU3RyaW5nO1xyXG4gIH1cclxuICBpZiAoIW5vZGVDYXQgfHwgbm9kZUNhdC5jaGlsZHJlbi5sZW5ndGggPT09IDAgfHwgbm9kZUNhdC5iZWFyZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgdmFyIGZhY3RJbmRleCA9IG5vZGVGYWN0LmJlYXJlci5zdGFydE9mZnNldDtcclxuICAgIGRlYnVnKEpTT04uc3RyaW5naWZ5KHNlbnRlbmNlW2ZhY3RJbmRleF0sIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgcmV0dXJuIHNlbnRlbmNlW2ZhY3RJbmRleF0uY2F0ZWdvcnk7XHJcbiAgfVxyXG4gIGRlYnVnKCcgZm91bmQgbm8gY2F0ZWdvcnkgJyk7XHJcbiAgcmV0dXJuIHVuZGVmaW5lZDtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXRlZ29yeUZvck5vZGUobm9kZUNhdDogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UpIHtcclxuICB2YXIgc3RhcnRJbmRleCA9IG5vZGVDYXQgJiYgbm9kZUNhdC5iZWFyZXIgJiYgbm9kZUNhdC5iZWFyZXIuc3RhcnRPZmZzZXQ7XHJcbiAgaWYgKG5vZGVDYXQudHlwZSAhPT0gTlQuQ0FUKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIG5vZGV0eXBlICR7bmV3IEFTVC5Ob2RlVHlwZShOVC5DQVQpLnRvU3RyaW5nKCl9IGJ1dCB3YXMgJHtuZXcgQVNULk5vZGVUeXBlKG5vZGVDYXQudHlwZSkudG9TdHJpbmcoKX1gKTtcclxuICB9XHJcbiAgaWYgKHN0YXJ0SW5kZXggIT09IHVuZGVmaW5lZCAmJiAoc3RhcnRJbmRleCA+PSAwKSkge1xyXG4gICAgcmV0dXJuIHNlbnRlbmNlW3N0YXJ0SW5kZXhdLm1hdGNoZWRTdHJpbmc7XHJcbiAgfVxyXG4gIHRocm93IG5ldyBFcnJvcignIG5vIHN0YXJ0aW5kZXgnICsgSlNPTi5zdHJpbmdpZnkobm9kZUNhdCkpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEZhY3RGb3JOb2RlKG5vZGVGYWN0OiBBU1QuQVNUTm9kZSwgc2VudGVuY2U6IElGRXJCYXNlLklTZW50ZW5jZSkge1xyXG4gIHZhciBmYWN0SW5kZXggPSBub2RlRmFjdC5iZWFyZXIuc3RhcnRPZmZzZXQ7XHJcbiAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShzZW50ZW5jZVtmYWN0SW5kZXhdLCB1bmRlZmluZWQsIDIpKTtcclxuICByZXR1cm4gc2VudGVuY2VbZmFjdEluZGV4XS5tYXRjaGVkU3RyaW5nOyAvLy5jYXRlZ29yeTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW9uZ29OYW1lKHM6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIE1vbmdvTWFwLm1ha2VNb25nb05hbWVMQyhzKTtcclxuICAvL3JldHVybiBzLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCdfJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VGaWx0ZXJPYmooY2F0LCBmaWx0ZXIpIHtcclxuICB2YXIgZmlsdGVyT2JqID0ge307XHJcbiAgZmlsdGVyT2JqW2NhdF0gPSBmaWx0ZXI7XHJcbiAgcmV0dXJuIGZpbHRlck9iajtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZEZpbHRlclRvTWF0Y2gocmVzLCBjYXQsIGZpbHRlcikge1xyXG4gIGlmIChyZXNbJyRhbmQnXSkge1xyXG4gICAgcmVzWyckYW5kJ10ucHVzaChtYWtlRmlsdGVyT2JqKGNhdCwgZmlsdGVyKSk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG4gIH1cclxuICBpZiAocmVzW2NhdF0pIHtcclxuICAgIHZhciBmaWx0ZXJzID0gT2JqZWN0LmtleXMocmVzKS5zb3J0KCkubWFwKGtleSA9PiBtYWtlRmlsdGVyT2JqKGtleSwgcmVzW2tleV0pKTtcclxuICAgIGZpbHRlcnMucHVzaChtYWtlRmlsdGVyT2JqKGNhdCwgZmlsdGVyKSk7XHJcbiAgICByZXR1cm4geyAkYW5kOiBmaWx0ZXJzIH07XHJcbiAgfVxyXG4gIHJlc1tjYXRdID0gZmlsdGVyO1xyXG4gIHJldHVybiByZXM7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWRkRmlsdGVyRXhwcihyZXMsIGV4cHI6IGFueSkge1xyXG4gIGlmIChyZXNbJyRhbmQnXSkge1xyXG4gICAgcmVzWyckYW5kJ10ucHVzaChleHByKTtcclxuICAgIHJldHVybiByZXM7XHJcbiAgfVxyXG4gIHJlc1snJGFuZCddID0gW2V4cHJdO1xyXG4gIHJldHVybiByZXM7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWRkT2JqZWN0UHJvcChzcmMsIGtleTogc3RyaW5nLCB2YWx1ZTogYW55KTogYW55IHtcclxuICBzcmNba2V5XSA9IHZhbHVlO1xyXG4gIHJldHVybiBzcmM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGRTb3J0RXhwcmVzc2lvbihyZXMsIGV4cHI6IGFueSkge1xyXG4gIGlmIChyZXNbJyRzb3J0J10pIHtcclxuICAgIF8ubWVyZ2UocmVzWyckc29ydCddLCBleHByKTtcclxuICAgIHJldHVybiByZXM7XHJcbiAgfVxyXG4gIHJlc1snJHNvcnQnXSA9IGV4cHI7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE51bWJlckFyZyhub2RlOiBBU1QuQVNUTm9kZSwgc2VudGVuY2U6IElGRXJCYXNlLklTZW50ZW5jZSk6IG51bWJlciB7IC8vICEhIHJldHVybnMgYSBudW1iZXIgXHJcbiAgdmFyIHN0YXJ0SW5kZXggPSBub2RlICYmIG5vZGUuYmVhcmVyICYmIG5vZGUuYmVhcmVyLnN0YXJ0T2Zmc2V0O1xyXG4gIGlmIChub2RlLnR5cGUgIT09IE5ULk5VTUJFUikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBub2RldHlwZSAke25ldyBBU1QuTm9kZVR5cGUoTlQuQ0FUKS50b1N0cmluZygpfSBidXQgd2FzICR7bmV3IEFTVC5Ob2RlVHlwZShub2RlLnR5cGUpLnRvU3RyaW5nKCl9YCk7XHJcbiAgfVxyXG4gIGlmIChzdGFydEluZGV4ICE9PSB1bmRlZmluZWQgJiYgKHN0YXJ0SW5kZXggPj0gMCkpIHtcclxuICAgIC8vVE9ETyB0cmVhdCBvbmUsIHR3b1xyXG4gICAgcmV0dXJuIHBhcnNlSW50KHNlbnRlbmNlW3N0YXJ0SW5kZXhdLm1hdGNoZWRTdHJpbmcpO1xyXG4gIH1cclxuICB0aHJvdyBuZXcgRXJyb3IoJyBubyBzdGFydGluZGV4JyArIEpTT04uc3RyaW5naWZ5KG5vZGUpKTtcclxufTtcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNBcnJheShtb25nb0hhbmRsZVJhdzogSUZNb2RlbC5JTW9kZWxIYW5kbGVSYXcsIGRvbWFpbjogc3RyaW5nLCBjYXRlZ29yeTogc3RyaW5nKSB7XHJcbiAgdmFyIGNhdCA9IE1vZGVsLmdldENhdGVnb3J5UmVjKG1vbmdvSGFuZGxlUmF3LCBkb21haW4sIGNhdGVnb3J5KTtcclxuICByZXR1cm4gXy5pc0FycmF5KGNhdC50eXBlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVtZXJpY1R5cGVPckhhc051bWVyaWNUeXBlKG1vbmdvSGFuZGxlUmF3OiBJRk1vZGVsLklNb2RlbEhhbmRsZVJhdywgZG9tYWluOiBzdHJpbmcsIGNhdGVnb3J5OiBzdHJpbmcpIHtcclxuICB2YXIgY2F0ID0gTW9kZWwuZ2V0Q2F0ZWdvcnlSZWMobW9uZ29IYW5kbGVSYXcsIGRvbWFpbiwgY2F0ZWdvcnkpO1xyXG4gIGNvbnNvbGUubG9nKFwiY2F0ZWdvcnkgXCIgKyBjYXRlZ29yeSArIFwiICAtPiBcIiArIEpTT04uc3RyaW5naWZ5KGNhdCkpO1xyXG4gIHJldHVybiAoY2F0LnR5cGUgPT0gSU1vbmdvb3NlQmFzZVR5cGUuTnVtYmVyKSB8fCAoXy5pc0FycmF5KGNhdC50eXBlKSAmJiBjYXQudHlwZS5pbmRleE9mKElNb25nb29zZUJhc2VUeXBlLk51bWJlcikgPj0gMClcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvZXJjZUZhY3RMaXRlcmFsVG9UeXBlKGlzTnVtZXJpYzogYm9vbGVhbiwgZmFjdDogc3RyaW5nKTogbnVtYmVyIHwgc3RyaW5nIHtcclxuICBpZiAoaXNOdW1lcmljKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICB2YXIgciA9IHBhcnNlSW50KGZhY3QpO1xyXG4gICAgICBpZiAoTnVtYmVyLmlzTmFOKHIpKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhY3Q7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHI7XHJcbiAgICB9IGNhdGNoIChlKSB7IH1cclxuICB9XHJcbiAgcmV0dXJuIGZhY3Q7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhbWVuZENhdGVnb3J5TGlzdChleHRyYWN0U29ydFJlc3VsdDogYW55W10sIGNhdExpc3Q6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xyXG4gIHZhciByZXMgPSBbXTtcclxuICBleHRyYWN0U29ydFJlc3VsdC5mb3JFYWNoKGEgPT4ge1xyXG4gICAgdmFyIG5hbWUgPSBhLmNhdGVnb3J5TmFtZTtcclxuICAgIGlmICghY2F0TGlzdC5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICByZXMucHVzaChuYW1lKTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXMgPSByZXMuY29uY2F0KGNhdExpc3QpO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW9uZ29NYXRjaEZyb21Bc3Qobm9kZTogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UsIG1vbmdvTWFwOiBJRk1vZGVsLkNhdE1vbmdvTWFwLCBkb21haW46IHN0cmluZywgbW9uZ29IYW5kbGVSYXc6IElGTW9kZWwuSU1vZGVsSGFuZGxlUmF3KSB7XHJcbiAgZGVidWcoQVNULmFzdFRvVGV4dChub2RlKSk7XHJcbiAgLy9jb25zb2xlLmxvZyhcIm1ha2luZyBtb25nbyBtYXRjaCBcIiArIEFTVC5hc3RUb1RleHQobm9kZSkpO1xyXG4gIGlmICghbm9kZSkge1xyXG4gICAgcmV0dXJuIHsgJG1hdGNoOiB7fSB9O1xyXG4gIH1cclxuICBpZiAobm9kZS50eXBlICE9PSBOVC5MSVNUKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2V4cGVjdGVkIGRpZmZlcmVudCBub2RldHlwZSAnICsgbm9kZS50eXBlKTtcclxuICB9XHJcbiAgdmFyIHJlcyA9IHt9O1xyXG4gIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChuID0+IHtcclxuICAgIHZhciBjYXRlZ29yeSA9IGdldENhdGVnb3J5Rm9yTm9kZVBhaXIobi5jaGlsZHJlblswXSwgbi5jaGlsZHJlblsxXSwgc2VudGVuY2UpO1xyXG4gICAgLy9jb25zb2xlLmxvZygnaGVyZSBpcyB0aGUgZG9tYWluICcgKyBtb25nb2RvbWFpbik7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdoZXJlIGlzIHRoZSBkb21haW4gJyArIE9iamVjdC5rZXlzKHRoZU1vZGVsLm1vbmdvSGFuZGxlLm1vbmdvTWFwcykuam9pbihcIlxcblwiKSk7XHJcblxyXG4gICAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGVNb2RlbC5tb25nb0hhbmRsZS5tb25nb01hcHNbbW9uZ29kb21haW5dLCB1bmRlZmluZWQsMikpO1xyXG4gICAgdmFyIG1vbmdvY2F0ZnVsbHBhdGggPSBtb25nb01hcFtjYXRlZ29yeV0uZnVsbHBhdGg7IC8vIE1vZGVsLmdldE1vbmdvb3NlUGF0aCh0aGVNb2RlbCwgY2F0ZWdvcnkpOyAvL21ha2VNb25nb05hbWUoY2F0KTtcclxuICAgIGRlYnVnbG9nKCgpID0+IGBoZXJlIGlzIHRoZSBmdWxscGF0aCBmb3IgJHtjYXRlZ29yeX0gaXMgJHttb25nb2NhdGZ1bGxwYXRofSBgKTtcclxuICAgIHZhciBmYWN0ID0gKG4uY2hpbGRyZW4ubGVuZ3RoID4gMSkgJiYgZ2V0RmFjdEZvck5vZGUobi5jaGlsZHJlblsxXSwgc2VudGVuY2UpO1xyXG4gICAgdmFyIGNhdElzTnVtZXJpYyA9IGlzTnVtZXJpY1R5cGVPckhhc051bWVyaWNUeXBlKG1vbmdvSGFuZGxlUmF3LCBkb21haW4sIGNhdGVnb3J5KTtcclxuICAgIHZhciBmYWN0Q29lcmNlZCA9IGNvZXJjZUZhY3RMaXRlcmFsVG9UeXBlKGNhdElzTnVtZXJpYywgZmFjdCk7XHJcbiAgICBpZiAobi50eXBlID09PSBOVC5PUEVxSW4pIHtcclxuICAgICAgcmVzID0gYWRkRmlsdGVyVG9NYXRjaChyZXMsIG1vbmdvY2F0ZnVsbHBhdGgsIGZhY3RDb2VyY2VkKTtcclxuICAgIH0gZWxzZSBpZiAobi50eXBlID09PSBOVC5PUFN0YXJ0c1dpdGgpIHtcclxuICAgICAgcmVzID0gYWRkRmlsdGVyVG9NYXRjaChyZXMsIG1vbmdvY2F0ZnVsbHBhdGgsIHsgJHJlZ2V4OiBuZXcgUmVnRXhwKGBeJHtmYWN0LnRvTG93ZXJDYXNlKCl9YCwgXCJpXCIpIH0pO1xyXG4gICAgfSBlbHNlIGlmIChuLnR5cGUgPT09IE5ULk9QRW5kc1dpdGgpIHtcclxuICAgICAgZGVidWdsb2coKCkgPT4gJyEhISFhZGRpbmcgcmVnZXggd2l0aCBleHByZXNzaW9uICcgKyBmYWN0LnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICByZXMgPSBhZGRGaWx0ZXJUb01hdGNoKHJlcywgbW9uZ29jYXRmdWxscGF0aCwgeyAkcmVnZXg6IG5ldyBSZWdFeHAoYCR7ZmFjdC50b0xvd2VyQ2FzZSgpfSRgLCBcImlcIikgfSk7XHJcbiAgICB9LyogZWxzZSBpZiAobi50eXBlID09PSBOVC5PUE1vcmVUaGFuKSB7XHJcbiAgICAgIHZhciBudW1iZXJhcmcgPSBnZXROdW1iZXJBcmcobi5jaGlsZHJlblswXSwgc2VudGVuY2UpO1xyXG4gICAgICBkZWJ1Z2xvZygoKSA9PiAnISEhIWFkZGluZyBtb3JlIHRoYW4gJyArIG51bWJlcmFyZyArICcgZm9yIGNhdGVnb3J5ICcgKyBjYXRlZ29yeSApO1xyXG4gICAgICAvL1RPRE8gLy9yZXMgPSBhZGRGaWx0ZXJUb01hdGNoKHJlcywgbW9uZ29jYXRmdWxscGF0aCwgeyAnY291bnQnICggbW9uZ29jYXRmdWxscGF0aCApIGd0IG51bWJlcmFyZyAsIFwiaVwiKSB9KTtcclxuICAgICAgdmFyIGFyZ3BhdGggPSAnJCcgKyBtb25nb2NhdGZ1bGxwYXRoO1xyXG4gICAgICByZXMgPSBhZGRGaWx0ZXJFeHByKCByZXMsXHJcbiAgICAgICAgeyAkZXhwcjogeyAkZ3Q6IFsgeyAkc3dpdGNoOiB7IGJyYW5jaGVzOiBbIHsgY2FzZTogeyAkaXNBcnJheSA6IGFyZ3BhdGggfSwgdGhlbjogeyAkc2l6ZTogYXJncGF0aCB9IH1dLCBkZWZhdWx0IDogMSB9fVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAsIG51bWJlcmFyZyBdfX0gKTtcclxuXHJcbi8vXHJcbi8vICAgICAgICB7ICRleHByOiB7ICRndDogWyB7ICRzaXplOiAnJHN0YW5kb3J0J30sMSBdfX0gKTtcclxuLy8gICAgICAoWyB7ICRtYXRjaCA6IHsgJGV4cHI6IHsgJGd0OiBbIHsgJHNpemU6IGFyZ3BhdGggfSwgbnVtYmVyYXJnIF19fX1dKTtcclxuLy8gdHdvIHN0YWdlXHJcbi8vIHVzZSAkYWRkRmllbGRzICB3aXRoIDMuNFxyXG4vLyB0cnkgYWxzbyAkZXhwciBkaXJlY3RseVxyXG4vLyAgICAgICA+IGRiLmRlbW9tZGxzLmFnZ3JlZ2F0ZShbIHsgJHByb2plY3QgOiB7IHN0YW5kb3J0X3NpemUgOiB7ICRzaXplOiAnJHN0YW5kb3J0JyB9LCBzdGFuZG9ydDoxLCBzZW5kZXI6MSwgdXUgOiB7ICRndDpbIHsgJHNpemU6ICckc3RhbmRvcnQnIH0sM119ICwgYWJ4IDogeyAkZ3Q6WyBcIiRzdGFuZG9ydFwiLCAxXX19fSwgeyAkbWF0Y2g6IHsgXCJzdGFuZG9ydF9zaXplXCI6IHsgJGVxOiB7ICRzaXplOiAnJHN0YW5kb3J0J30gfX19XSk7XHJcbi8vICAgICAgPiBkYi5kZW1vbWRscy5hZ2dyZWdhdGUoWyB7ICRwcm9qZWN0IDogeyBzdGFuZG9ydF9zaXplIDogeyAkc2l6ZTogJyRzdGFuZG9ydCcgfSwgc3RhbmRvcnQ6MSwgc2VuZGVyOjEsIHV1IDogeyAkZ3Q6WyB7ICRzaXplOiAnJHN0YW5kb3J0JyB9LDNdfSAsIGFieCA6IHsgJGd0OlsgXCIkc3RhbmRvcnRcIiwgMV19fX0sIHsgJG1hdGNoOiB7IFwic3RhbmRvcnRfc2l6ZVwiOiB7ICRndDogMSB9fX1dKTtcclxuLy8gICAgICB7IFwiX2lkXCIgOiBPYmplY3RJZChcIjVkYjg4YTE4NWI2Njc1OWNmYzU2YmNkNFwiKSwgXCJzdGFuZG9ydFwiIDogWyBcIkJlcmxpblwiLCBcIk3DvG5jaGVuXCIsIFwiRnJhbmtmdXJ0XCIsIFwiSGFtYnVyZ1wiLCBcIkJyZW1lblwiIF0sIFwic2VuZGVyXCIgOiBcIkFSdW5kZnVua0RcIiwgXCJzdGFuZG9ydF9zaXplXCIgOiA1LCBcInV1XCIgOiB0cnVlLCBcImFieFwiIDogdHJ1ZSB9XHJcblxyXG5cclxuICAgIC8vIGV4YWN0IG1hdGNoOiBkYi5kZW1vbWRscy5hZ2dyZWdhdGUoWyB7ICRtYXRjaDogeyBzdGFuZG9ydCA6IHsgJHNpemUgOiAzIH19fSxcclxuXHJcbiAgICB9Ki9cclxuICAgIGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BMZXNzVGhhbiB8fCBuLnR5cGUgPT09IE5ULk9QTW9yZVRoYW4gfHwgbi50eXBlID09IE5ULk9QRXhhY3RseSkge1xyXG4gICAgICAvLyBmbGF2b3VyczogXHJcbiAgICAgIC8vIGxlc3NfdGhhbiAzIENBVCAgICAoIGEgY291bnQgbWVhc3VyZSApXHJcbiAgICAgIHZhciBudW1iZXJhcmcgPSBnZXROdW1iZXJBcmcobi5jaGlsZHJlblswXSwgc2VudGVuY2UpO1xyXG4gICAgICBkZWJ1Z2xvZygoKSA9PiAnISEhIWFkZGluZyBtb3JlIHRoYW4gJyArIG51bWJlcmFyZyArICcgZm9yIGNhdGVnb3J5ICcgKyBjYXRlZ29yeSk7XHJcbiAgICAgIC8vVE9ETyAvL3JlcyA9IGFkZEZpbHRlclRvTWF0Y2gocmVzLCBtb25nb2NhdGZ1bGxwYXRoLCB7ICdjb3VudCcgKCBtb25nb2NhdGZ1bGxwYXRoICkgZ3QgbnVtYmVyYXJnICwgXCJpXCIpIH0pO1xyXG4gICAgICB2YXIgYXJncGF0aCA9ICckJyArIG1vbmdvY2F0ZnVsbHBhdGg7XHJcbiAgICAgIHZhciBleHRyYWN0ID0gW3sgJHN3aXRjaDogeyBicmFuY2hlczogW3sgY2FzZTogeyAkaXNBcnJheTogYXJncGF0aCB9LCB0aGVuOiB7ICRzaXplOiBhcmdwYXRoIH0gfV0sIGRlZmF1bHQ6IDEgfSB9XHJcbiAgICAgICAgLCBudW1iZXJhcmddO1xyXG4gICAgICBzd2l0Y2ggKG4udHlwZSkge1xyXG4gICAgICAgIGNhc2UgTlQuT1BMZXNzVGhhbjogcmVzID0gYWRkRmlsdGVyRXhwcihyZXMsIHsgJGV4cHI6IHsgJGx0OiBleHRyYWN0IH0gfSk7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTlQuT1BNb3JlVGhhbjogcmVzID0gYWRkRmlsdGVyRXhwcihyZXMsIHsgJGV4cHI6IHsgJGd0OiBleHRyYWN0IH0gfSk7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTlQuT1BFeGFjdGx5OiByZXMgPSBhZGRGaWx0ZXJFeHByKHJlcywgeyAkZXhwcjogeyAkZXE6IGV4dHJhY3QgfSB9KTsgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BDb250YWlucykge1xyXG4gICAgICByZXMgPSBhZGRGaWx0ZXJUb01hdGNoKHJlcywgbW9uZ29jYXRmdWxscGF0aCwgeyAkcmVnZXg6IG5ldyBSZWdFeHAoYCR7ZmFjdC50b0xvd2VyQ2FzZSgpfWAsIFwiaVwiKSB9KTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BHVCB8fCBuLnR5cGUgPT09IE5ULk9QTFRcclxuICAgICAgfHwgbi50eXBlID09IE5ULk9QRVEgfHwgbi50eXBlID09IE5ULk9QTkVcclxuICAgICAgfHwgbi50eXBlID09IE5ULk9QR0UgfHwgbi50eXBlID09IE5ULk9QTEUpIHtcclxuICAgICAgdmFyIGZhY3QgPSBnZXRGYWN0Rm9yTm9kZShuLmNoaWxkcmVuWzFdLCBzZW50ZW5jZSk7XHJcbiAgICAgIHZhciBmYWN0Q29lcmNlZCA9IGNvZXJjZUZhY3RMaXRlcmFsVG9UeXBlKGNhdElzTnVtZXJpYywgZmFjdCk7XHJcbiAgICAgIHZhciBhcmdwYXRoID0gJyQnICsgbW9uZ29jYXRmdWxscGF0aDtcclxuICAgICAgdmFyIGV4dHJhY3QyID0gW2FyZ3BhdGgsIGZhY3RDb2VyY2VkXTtcclxuICAgICAgLy8gJHN3aXRjaDogeyBicmFuY2hlczogWyB7IGNhc2U6IHsgJGlzQXJyYXkgOiBhcmdwYXRoIH0sIHRoZW46IHsgJHNpemU6IGFyZ3BhdGggfSB9XSwgZGVmYXVsdCA6IDEgfX1cclxuXHJcbiAgICAgIHZhciBvcHN0ciA9ICckbHQnO1xyXG4gICAgICBzd2l0Y2ggKG4udHlwZSkge1xyXG4gICAgICAgIGNhc2UgTlQuT1BMVDogb3BzdHIgPSAnJGx0JzsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBOVC5PUEdUOiBvcHN0ciA9ICckZ3QnOyBicmVhaztcclxuICAgICAgICBjYXNlIE5ULk9QRVE6IG9wc3RyID0gJyRlcSc7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTlQuT1BORTogb3BzdHIgPSAnJG5lJzsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBOVC5PUExFOiBvcHN0ciA9ICckbHRlJzsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBOVC5PUEdFOiBvcHN0ciA9ICckZ3RlJzsgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChpc0FycmF5KG1vbmdvSGFuZGxlUmF3LCBkb21haW4sIGNhdGVnb3J5KSkge1xyXG4gICAgICAgIC8vIGRiLmRlbW9tZGxzLmFnZ3JlZ2F0ZShbIHsgJG1hdGNoOiB7IHN0YW5kb3J0IDogeyAgJGVsZW1NYXRjaCA6IHsgJyRndGUnOiAnTScgfX0gfSAgfSAgXSk7XHJcbiAgICAgICAgdmFyIGZpbHRlcm9iaiA9IG1ha2VGaWx0ZXJPYmoobW9uZ29jYXRmdWxscGF0aCwgeyAkZWxlbU1hdGNoOiBtYWtlRmlsdGVyT2JqKG9wc3RyLCBmYWN0Q29lcmNlZCkgfSk7XHJcbiAgICAgICAgcmVzID0gYWRkRmlsdGVyRXhwcihyZXMsIGZpbHRlcm9iaik7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdmFyIGZpbHRlcm9iaiA9IG1ha2VGaWx0ZXJPYmoobW9uZ29jYXRmdWxscGF0aCwgbWFrZUZpbHRlck9iaihvcHN0ciwgZmFjdENvZXJjZWQpKTtcclxuICAgICAgICByZXMgPSBhZGRGaWx0ZXJFeHByKHJlcywgZmlsdGVyb2JqKTtcclxuICAgICAgfVxyXG4gICAgICAvL3ZhciBudW1iZXJhcmcgPSBnZXROdW1iZXJBcmcobi5jaGlsZHJlblswXSwgc2VudGVuY2UpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAobi50eXBlID09PSBOVC5PUE9yZGVyQnkgfHwgbi50eXBlID09PSBOVC5PUE9yZGVyRGVzY2VuZGluZ0J5KSB7XHJcbiAgICAgIC8vdmFyIGFzY2Rlc2MgPSAobi50eXBlID09IE5ULk9QT3JkZXJEZXNjZW5kaW5nQnkpID8gMSA6IC0xO1xyXG4gICAgICAvLyByZXMgPSBhZGRTb3J0RXhwcmVzc2lvbihyZXMsIGFkZE9iamVjdFByb3AoIHt9LCBtb25nb2NhdGZ1bGxwYXRoLCBhc2NkZXNjICkgKTtcclxuICAgICAgLy8gVE9ETyAgdGhpcyBtYXkgYmUgYWRkZWQgaW4gdGhlIHdyb25nIHBvc2l0aW9uXHJcbiAgICAgIC8vICBvbmUgYWxzbyBoYXMgdG8gYXNzdXJlIHRoZSBkYXRhIGlzIG5vdCBwcm9qZWN0ZWQgb3V0IGJlZm9yZVxyXG4gICAgICAvLyAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgbm9kZXR5cGUgTlQuT1BFcUluIGJ1dCB3YXMgJyArIG4udHlwZSk7XHJcbiAgICAgIC8vIHsgJHNvcnQgOiB7IHNlbmRlciA6IC0xIH0gfWBcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BOb3RFeGlzdGluZykge1xyXG4gICAgICAvLyB7IGl0ZW0gOiBudWxsIH1cclxuICAgICAgdmFyIGZpbHRlcm9iaiA9IG1ha2VGaWx0ZXJPYmoobW9uZ29jYXRmdWxscGF0aCwgbnVsbCk7XHJcbiAgICAgIHJlcyA9IGFkZEZpbHRlckV4cHIocmVzLCBmaWx0ZXJvYmopO1xyXG4gICAgICAvLyAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBub2RldHlwZSBPUEV4aXNpdGluZyBub3Qgc3VwcG9ydGVkIGhlcmUgIE5ULk9QRXFJbiBidXQgd2FzICcgKyBuLnR5cGUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAobi50eXBlID09PSBOVC5PUEV4aXN0aW5nKSB7XHJcbiAgICAgIHZhciBmaWx0ZXJvYmogPSBtYWtlRmlsdGVyT2JqKG1vbmdvY2F0ZnVsbHBhdGgsIHsgJyRleGlzdHMnOiB0cnVlIH0pO1xyXG4gICAgICByZXMgPSBhZGRGaWx0ZXJFeHByKHJlcywgZmlsdGVyb2JqKTtcclxuICAgICAgLy8gIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgbm9kZXR5cGUgT1BFeGlzaXRpbmcgbm90IHN1cHBvcnRlZCBoZXJlICBOVC5PUEVxSW4gYnV0IHdhcyAnICsgbi50eXBlKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIG5vZGV0eXBlIE5ULk9QRXFJbiBidXQgd2FzICcgKyBuLnR5cGUpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiB7ICRtYXRjaDogcmVzIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0RXhwbGljaXRTb3J0RnJvbUFzdChub2RlOiBBU1QuQVNUTm9kZSwgc2VudGVuY2U6IElGRXJCYXNlLklTZW50ZW5jZSwgbW9uZ29NYXA6IElGTW9kZWwuQ2F0TW9uZ29NYXAsIGRvbWFpbjogc3RyaW5nLCBtb25nb0hhbmRsZVJhdzogSUZNb2RlbC5JTW9kZWxIYW5kbGVSYXcpOiBFeHBsaWNpdFNvcnRbXSB7XHJcbiAgLy8gcmV0dXJuIGFuIGFycmF5XHJcbiAgZGVidWcoQVNULmFzdFRvVGV4dChub2RlKSk7XHJcbiAgLy9jb25zb2xlLmxvZyhcIm1ha2luZyBtb25nbyBtYXRjaCBcIiArIEFTVC5hc3RUb1RleHQobm9kZSkpO1xyXG4gIGlmICghbm9kZSkge1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuICBpZiAobm9kZS50eXBlICE9PSBOVC5MSVNUKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2V4cGVjdGVkIGRpZmZlcmVudCBub2RldHlwZSAnICsgbm9kZS50eXBlKTtcclxuICB9XHJcbiAgdmFyIHJlcyA9IFtdIGFzIEV4cGxpY2l0U29ydFtdO1xyXG4gIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChuID0+IHtcclxuICAgIHZhciBjYXRlZ29yeSA9IGdldENhdGVnb3J5Rm9yTm9kZVBhaXIobi5jaGlsZHJlblswXSwgbi5jaGlsZHJlblsxXSwgc2VudGVuY2UpO1xyXG4gICAgdmFyIG1vbmdvY2F0ZnVsbHBhdGggPSBtb25nb01hcFtjYXRlZ29yeV0uZnVsbHBhdGg7IC8vIE1vZGVsLmdldE1vbmdvb3NlUGF0aCh0aGVNb2RlbCwgY2F0ZWdvcnkpOyAvL21ha2VNb25nb05hbWUoY2F0KTtcclxuICAgIHZhciBmYWN0ID0gKG4uY2hpbGRyZW4ubGVuZ3RoID4gMSkgJiYgZ2V0RmFjdEZvck5vZGUobi5jaGlsZHJlblsxXSwgc2VudGVuY2UpO1xyXG4gICAgaWYgKG4udHlwZSA9PT0gTlQuT1BPcmRlckJ5IHx8IG4udHlwZSA9PT0gTlQuT1BPcmRlckRlc2NlbmRpbmdCeSkge1xyXG4gICAgICB2YXIgYXNjZGVzYyA9IChuLnR5cGUgPT0gTlQuT1BPcmRlckRlc2NlbmRpbmdCeSkgPyAxIDogLTE7XHJcbiAgICAgIHJlcy5wdXNoKHtcclxuICAgICAgICBjYXRlZ29yeU5hbWU6IGNhdGVnb3J5LFxyXG4gICAgICAgIG1vbmdvY2F0ZnVsbHBhdGg6IG1vbmdvY2F0ZnVsbHBhdGgsXHJcbiAgICAgICAgYXNjRGVzYzogYXNjZGVzY1xyXG4gICAgICB9IGFzIEV4cGxpY2l0U29ydCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb0dyb3VwRnJvbUFzdChjYXRlZ29yeUxpc3Q6IHN0cmluZ1tdLCBtb25nb01hcDogSUZNb2RlbC5DYXRNb25nb01hcCkge1xyXG4gIHZhciByZXMgPSB7fTtcclxuICBjYXRlZ29yeUxpc3QuZm9yRWFjaChjYXRlZ29yeSA9PiB7XHJcbiAgICB2YXIgbW9uZ29jYXRmdWxscGF0aCA9IE1vbmdvTWFwLmdldEZpcnN0U2VnbWVudChtb25nb01hcFtjYXRlZ29yeV0ucGF0aHMpOyAvLyBNb2RlbC5nZXRNb25nb29zZVBhdGgodGhlTW9kZWwsIGNhdGVnb3J5KTsgLy9tYWtlTW9uZ29OYW1lKGNhdCk7XHJcbiAgICByZXNbbW9uZ29jYXRmdWxscGF0aF0gPSAnJCcgKyBtb25nb2NhdGZ1bGxwYXRoO1xyXG4gIH0pO1xyXG4gIHZhciByMSA9IHsgJGdyb3VwOiBPYmplY3QuYXNzaWduKHsgX2lkOiBPYmplY3QuYXNzaWduKHt9LCByZXMpIH0sIHt9KSB9O1xyXG4gIHZhciBmaXJzdFggPSB7fTtcclxuICBPYmplY3Qua2V5cyhyZXMpLmZvckVhY2goa2V5ID0+IHsgZmlyc3RYW2tleV0gPSB7ICRmaXJzdDogJyQnICsga2V5IH0gfSk7XHJcbiAgcjEuJGdyb3VwID0gT2JqZWN0LmFzc2lnbihyMS4kZ3JvdXAsIGZpcnN0WCk7XHJcbiAgcmV0dXJuIHIxO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvQ29sdW1uc0Zyb21Bc3QoY2F0ZWdvcnlMaXN0OiBzdHJpbmdbXSwgbW9uZ29NYXA6IElGTW9kZWwuQ2F0TW9uZ29NYXApXHJcbiAgOiB7IGNvbHVtbnM6IHN0cmluZ1tdLCByZXZlcnNlTWFwOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9IH0ge1xyXG4gIHZhciByZXMgPSB7XHJcbiAgICBjb2x1bW5zOiBbXSxcclxuICAgIHJldmVyc2VNYXA6IHt9XHJcbiAgfTtcclxuICBjYXRlZ29yeUxpc3QuZm9yRWFjaChjYXRlZ29yeSA9PiB7XHJcbiAgICByZXMuY29sdW1ucy5wdXNoKGNhdGVnb3J5KTtcclxuICAgIHZhciBjYXRtb25nbyA9IE1vbmdvTWFwLmdldFNob3J0UHJvamVjdGVkTmFtZShtb25nb01hcCwgY2F0ZWdvcnkpO1xyXG4gICAgaWYgKGNhdGVnb3J5ICE9PSBjYXRtb25nbykge1xyXG4gICAgICByZXMucmV2ZXJzZU1hcFtjYXRtb25nb10gPSBjYXRlZ29yeTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2F0ZWdvcnlMaXN0KGZpeGVkQ2F0ZWdvcmllczogc3RyaW5nW10sIG5vZGU6IEFTVC5BU1ROb2RlLCBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlKTogc3RyaW5nW10ge1xyXG4gIHZhciByZXMgPSBmaXhlZENhdGVnb3JpZXMuc2xpY2UoKTtcclxuICB3aGlsZSAobm9kZS50eXBlICE9PSBOVC5MSVNUKVxyXG4gICAgbm9kZSA9IG5vZGUuY2hpbGRyZW5bMF07XHJcbiAgZGVidWcoQVNULmFzdFRvVGV4dChub2RlKSk7XHJcbiAgaWYgKG5vZGUudHlwZSAhPT0gTlQuTElTVCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdleHBlY3RlZCBkaWZmZXJlbnQgbm9kZXR5cGUgJyArIG5vZGUudHlwZSk7XHJcbiAgfVxyXG4gIG5vZGUuY2hpbGRyZW4ubWFwKG4gPT4ge1xyXG4gICAgaWYgKG4udHlwZSA9PT0gTlQuQ0FUKSB7XHJcbiAgICAgIHZhciBjYXRlZ29yeSA9IGdldENhdGVnb3J5Rm9yTm9kZShuLCBzZW50ZW5jZSk7XHJcbiAgICAgIGlmIChyZXMuaW5kZXhPZihjYXRlZ29yeSkgPCBmaXhlZENhdGVnb3JpZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgcmVzLnB1c2goY2F0ZWdvcnkpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIG5vZGV0eXBlICR7bmV3IEFTVC5Ob2RlVHlwZShOVC5DQVQpLnRvU3RyaW5nKCl9IGJ1dCB3YXMgJHtuZXcgQVNULk5vZGVUeXBlKG4udHlwZSkudG9TdHJpbmcoKX1gKTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvUHJvamVjdGlvbkZyb21Bc3QoY2F0ZWdvcnlMaXN0OiBzdHJpbmdbXSwgbW9uZ29NYXA6IElGTW9kZWwuQ2F0TW9uZ29NYXApIHtcclxuICB2YXIgcmVzID0geyBfaWQ6IDAgfTtcclxuICBjYXRlZ29yeUxpc3QubWFwKGNhdGVnb3J5ID0+IHtcclxuICAgIHZhciBtb25nb2NhdGZ1bGxwYXRoID0gbW9uZ29NYXBbY2F0ZWdvcnldLmZ1bGxwYXRoOyAvL21ha2VNb25nb05hbWUoY2F0KTtcclxuICAgIHZhciBzaG9ydE5hbWUgPSBNb25nb01hcC5nZXRTaG9ydFByb2plY3RlZE5hbWUobW9uZ29NYXAsIGNhdGVnb3J5KTtcclxuICAgIGlmIChzaG9ydE5hbWUgPT09IG1vbmdvY2F0ZnVsbHBhdGgpIHtcclxuICAgICAgcmVzW21vbmdvY2F0ZnVsbHBhdGhdID0gMTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJlc1tzaG9ydE5hbWVdID0gXCIkXCIgKyBtb25nb2NhdGZ1bGxwYXRoO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiB7ICRwcm9qZWN0OiByZXMgfTtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvU29ydEZyb21Bc3QoY2F0ZWdvcnlMaXN0OiBzdHJpbmdbXSwgbW9uZ29NYXA6IElGTW9kZWwuQ2F0TW9uZ29NYXApIHtcclxuICB2YXIgcmVzID0ge307XHJcbiAgY2F0ZWdvcnlMaXN0LmZvckVhY2goY2F0ZWdvcnkgPT4ge1xyXG4gICAgdmFyIHNob3J0TmFtZSA9IE1vbmdvTWFwLmdldFNob3J0UHJvamVjdGVkTmFtZShtb25nb01hcCwgY2F0ZWdvcnkpO1xyXG4gICAgcmVzW3Nob3J0TmFtZV0gPSAxO1xyXG4gIH0pO1xyXG4gIHJldHVybiB7ICRzb3J0OiByZXMgfTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFeHBsaWNpdFNvcnQge1xyXG4gIGNhdGVnb3J5TmFtZTogc3RyaW5nLFxyXG4gIGFzY0Rlc2M6IG51bWJlcixcclxuICBtb25nb2NhdGZ1bGxwYXRoOiBzdHJpbmdcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW9uZ29FeHBsaWNpdFNvcnQoZXhwbGljaXRTb3J0OiBFeHBsaWNpdFNvcnRbXSwgY2F0ZWdvcnlMaXN0OiBzdHJpbmdbXSwgbW9uZ29NYXA6IElGTW9kZWwuQ2F0TW9uZ29NYXApIHtcclxuICB2YXIgcmVzID0ge307XHJcbiAgZXhwbGljaXRTb3J0LmZvckVhY2goZXMgPT4ge1xyXG4gICAgdmFyIG1vbmdvQ2F0TmFtZSA9IGVzLm1vbmdvY2F0ZnVsbHBhdGg7XHJcbiAgICByZXNbbW9uZ29DYXROYW1lXSA9IGVzLmFzY0Rlc2M7XHJcbiAgfSk7XHJcbiAgY2F0ZWdvcnlMaXN0LmZvckVhY2goY2F0ZWdvcnkgPT4ge1xyXG4gICAgdmFyIHNob3J0TmFtZSA9IE1vbmdvTWFwLmdldFNob3J0UHJvamVjdGVkTmFtZShtb25nb01hcCwgY2F0ZWdvcnkpO1xyXG4gICAgaWYgKHJlc1tzaG9ydE5hbWVdID09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXNbc2hvcnROYW1lXSA9IDE7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHsgJHNvcnQ6IHJlcyB9O1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW9uZ29NYXRjaEYoZmlsdGVyczogSUZpbHRlcltdKSB7XHJcbiAgdmFyIHJlcyA9IHsgJG1hdGNoOiB7fSB9O1xyXG4gIC8vY29uc29sZS5sb2coJ2lzIG1hdGNoIFxcbicpO1xyXG4gIGZpbHRlcnMuZm9yRWFjaChmaWx0ZXIgPT4ge1xyXG4gICAgcmVzLiRtYXRjaFtmaWx0ZXIuY2F0XSA9IGZpbHRlci52YWx1ZTtcclxuICB9KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvUHJvamVjdGlvbihjb2xzOiBzdHJpbmdbXSk6IGFueSB7XHJcbiAgdmFyIHJlcyA9IHsgJHByb2plY3Q6IHsgX2lkOiAwIH0gfTtcclxuICBjb2xzLmZvckVhY2goY29sID0+IHtcclxuICAgIHJlcy4kcHJvamVjdFtjb2xdID0gMTtcclxuICB9KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvUXVlcnkoZmlsdGVyczogSUZpbHRlcltdLCByZXN1bHRjb2x1bW5zOiBzdHJpbmdbXSk6IGFueSB7XHJcbiAgdmFyIGZpbHRlciA9IG1ha2VNb25nb01hdGNoRihmaWx0ZXJzKTtcclxuICB2YXIgZ3JvdXAgPSBtYWtlTW9uZ29EaXN0aW5jdEdyb3VwKHJlc3VsdGNvbHVtbnMpO1xyXG4gIHZhciBwcm9qZWN0aW9uID0gbWFrZU1vbmdvUHJvamVjdGlvbihyZXN1bHRjb2x1bW5zKTtcclxuICByZXR1cm4gW2ZpbHRlciwgZ3JvdXAsIHByb2plY3Rpb25dO1xyXG5cclxufVxyXG5cclxuXHJcbiJdfQ==
