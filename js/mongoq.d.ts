/// <reference types="mongoose" />
import { IFErBase as IFErBase } from 'mgnlq_er';
import { IFModel as IFModel } from 'mgnlq_model';
import * as AST from './ast';
import * as mongoose from 'mongoose';
export declare function JSONStringify(obj: any): string;
export declare function makeMongoName(s: string): string;
export declare class MongoBridge {
    _model: IFModel.IModels;
    constructor(model: IFModel.IModels);
    mongoooseDomainToDomain(mgdomain: string): string;
}
export declare class ModelHandle {
    _theModel: IFModel.IModels;
    _mgBridge: MongoBridge;
    _mongoose: mongoose.Mongoose;
    constructor(theModel: IFModel.IModels);
    query(domain: string, query: any): Promise<any>;
}
/**
 * given a Sentence, obtain the domain for it
 * @param theModel
 * @param sentence
 */
export declare function getDomainForSentence(theModel: IFModel.IModels, sentence: IFErBase.ISentence): {
    domain: string;
    collectionName: string;
    modelName: string;
};
import { IFErBase as IMatch } from 'mgnlq_er';
export interface SRes {
    sentence: IFErBase.ISentence;
    records: any[];
}
export interface QResult {
    domain: string;
    sentence: IFErBase.ISentence;
    columns: string[];
    results: string[][];
}
import * as SentenceParser from './sentenceparser';
export interface IQuery {
    domain: string;
    columns: string[];
    reverseMap: IReverseMap;
    query: any;
}
export interface IPreparedQuery extends SentenceParser.IParsedSentences {
    queries: IQuery[];
}
export declare function makeAggregateFromAst(astnode: AST.ASTNode, sentence: IFModel.IWord[], mongoMap: IFModel.CatMongoMap, fixedCategories: any): {
    query: any[];
    columnsReverseMap: {
        columns: string[];
        reverseMap: {
            [key: string]: string;
        };
    };
};
export declare function containsFixedCategories(theModel: IFModel.IModels, domain: string, fixedCategories: string[]): boolean;
export declare function augmentCategoriesWithURI(fixedCategories: string[], theModel: IFModel.IModels, domain: string): string[];
export declare function prepareQueries(query: string, theModel: IFModel.IModels, fixedCategories: string[], options?: IQueryOptions): IPreparedQuery;
export interface IProcessedMongoAnswers extends IMatch.IProcessedSentences {
    queryresults: QResult[];
}
export declare function mergeResults(r: QResult[]): QResult[];
export declare function queryWithAuxCategories(query: string, theModel: IFModel.IModels, auxiliary_categories: string[]): Promise<IProcessedMongoAnswers>;
export declare function queryWithURI(query: string, theModel: IFModel.IModels, auxiliary_categories: string[]): Promise<IProcessedMongoAnswers>;
export declare function query(query: string, theModel: IFModel.IModels): Promise<IProcessedMongoAnswers>;
export declare type IReverseMap = {
    [key: string]: string;
};
export declare function remapRecord(rec: any, columns: string[], reverseMap: IReverseMap): string[];
export declare function remapResult(res: any, columns: string[], reverseMap: IReverseMap): string[][];
export interface IQueryOptions {
    showURI: boolean;
}
export declare function queryInternal(querystring: string, theModel: IFModel.IModels, handle: ModelHandle, fixedFields: string[], options?: IQueryOptions): Promise<IProcessedMongoAnswers>;
