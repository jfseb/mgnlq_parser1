import * as IMatch from './iferbase';
import { IFModel as IFModel } from 'mgnlq_model';
export declare const oKeyOrder: Array<String>;
export declare function cmpMRule(a: IFModel.mRule, b: IFModel.mRule): number;
export declare function getIntMRulesSample(): Array<IFModel.mRule>;
export declare function getMRulesSample(): IMatch.SplitRules;
export declare function assureLowerCaseWord(mRules: Array<IFModel.mRule>): IFModel.mRule[];
