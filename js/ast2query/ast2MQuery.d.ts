import { IFErBase as IFErBase } from '../match/er_index';
import { IFModel as IFModel } from 'mgnlq_model';
import * as AST from '../ast';
export interface IFilter {
    cat: string;
    value: string;
}
export declare function makeMongoDistinctGroup(cols: string[]): any;
export declare function getCategoryForNodePair(nodeCat: AST.ASTNode, nodeFact: AST.ASTNode, sentence: IFErBase.ISentence): any;
export declare function getCategoryForNode(nodeCat: AST.ASTNode, sentence: IFErBase.ISentence): string;
export declare function getFactForNode(nodeFact: AST.ASTNode, sentence: IFErBase.ISentence): string;
export declare function makeMongoName(s: string): string;
export declare function addFilterToMatch(res: any, cat: any, filter: any): any;
export declare function addFilterExpr(res: any, expr: any): any;
export declare function addObjectProp(src: any, key: string, value: any): any;
export declare function addSortExpression(res: any, expr: any): any;
export declare function getNumberArg(node: AST.ASTNode, sentence: IFErBase.ISentence): number;
export declare function isArray(mongoHandleRaw: IFModel.IModelHandleRaw, domain: string, category: string): boolean;
export declare function isNumericTypeOrHasNumericType(mongoHandleRaw: IFModel.IModelHandleRaw, domain: string, category: string): boolean;
export declare function coerceFactLiteralToType(isNumeric: boolean, fact: string): number | string;
export declare function amendCategoryList(extractSortResult: any[], catList: string[]): string[];
export declare function makeMongoMatchFromAst(node: AST.ASTNode, sentence: IFErBase.ISentence, mongoMap: IFModel.CatMongoMap, domain: string, mongoHandleRaw: IFModel.IModelHandleRaw): {
    $match: {};
};
export declare function extractExplicitSortFromAst(node: AST.ASTNode, sentence: IFErBase.ISentence, mongoMap: IFModel.CatMongoMap, domain: string, mongoHandleRaw: IFModel.IModelHandleRaw): ExplicitSort[];
export declare function makeMongoGroupFromAst(categoryList: string[], mongoMap: IFModel.CatMongoMap): {
    $group: {
        _id: {};
    };
};
export declare function makeMongoColumnsFromAst(categoryList: string[], mongoMap: IFModel.CatMongoMap): {
    columns: string[];
    reverseMap: {
        [key: string]: string;
    };
};
export declare function getCategoryList(fixedCategories: string[], node: AST.ASTNode, sentence: IFErBase.ISentence): string[];
export declare function makeMongoProjectionFromAst(categoryList: string[], mongoMap: IFModel.CatMongoMap): {
    $project: {
        _id: number;
    };
};
export declare function makeMongoSortFromAst(categoryList: string[], mongoMap: IFModel.CatMongoMap): {
    $sort: {};
};
export interface ExplicitSort {
    categoryName: string;
    ascDesc: number;
    mongocatfullpath: string;
}
export declare function makeMongoExplicitSort(explicitSort: ExplicitSort[], categoryList: string[], mongoMap: IFModel.CatMongoMap): {
    $sort: {};
};
export declare function makeMongoMatchF(filters: IFilter[]): {
    $match: {};
};
export declare function makeMongoProjection(cols: string[]): any;
export declare function makeMongoQuery(filters: IFilter[], resultcolumns: string[]): any;
