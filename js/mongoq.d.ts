/// <reference types="mongoose" />
import { IFErBase as IFErBase } from 'mgnlq_er';
import { IFModel as IFModel } from 'mgnlq_model';
import * as mongoose from 'mongoose';
export declare function makeMongoName(s: string): string;
export declare class MongoBridge {
    _model: IFModel.IModels;
    constructor(model: IFModel.IModels);
    mongoooseDomainToDomain(mgdomain: string): string;
    makeSchema(mgdomain: string): mongoose.Schema;
}
export declare var talking: Promise<{}>;
export declare class ModelHandle {
    _theModel: IFModel.IModels;
    _mgBridge: MongoBridge;
    _schemas: {
        [key: string]: mongoose.Schema;
    };
    _models: {
        [key: string]: mongoose.Model<any>;
    };
    constructor(theModel: IFModel.IModels);
    query(mgdomain: string, query: any): Promise<any>;
}
/**
 * given a Sentence, obtain the domain for it
 * @param theModel
 * @param sentence
 */
export declare function getDomainForSentence(theModel: IFModel.IModels, sentence: IFErBase.ISentence): {
    domain: string;
    collectionName: string;
};
import { IFErBase as IMatch } from 'mgnlq_er';
export interface SRes {
    sentence: IFErBase.ISentence;
    records: any[];
}
export interface QResult {
    sentence: IFErBase.ISentence;
    columns: string[];
    results: string[][];
}
export declare function fuseAndOrderResults(res: SRes[]): IFErBase.IWhatIsTupelAnswer[];
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
export declare function prepareQueries(query: string, theModel: IFModel.IModels): IPreparedQuery;
export interface IProcessedMongoAnswers extends IMatch.IProcessedSentences {
    queryresults: QResult[];
}
export declare function mergeResults(r: QResult[]): QResult[];
export declare function query(query: string, theModel: IFModel.IModels): Promise<IProcessedMongoAnswers>;
export declare type IReverseMap = {
    [key: string]: string;
};
export declare function remapRecord(rec: any, columns: string[], reverseMap: IReverseMap): string[];
export declare function remapResult(res: any, columns: string[], reverseMap: IReverseMap): string[][];
export declare function queryInternal(query: string, theModel: IFModel.IModels, handle: ModelHandle): Promise<IProcessedMongoAnswers>;
