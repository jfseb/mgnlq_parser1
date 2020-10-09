"use strict";
/**
 * @file charsequence
 * @module jfseb.mnglq_er.charsequence
 * @copyright (c) Gerd Forstmann
 *
 * Char sequence specific comparisons
 *
 * Very simple comparisons based on plain strings
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharSequence = void 0;
// <reference path="../../lib/node-4.d.ts" />
// import * as debug from 'debug';
// import * as utils from '../utils/utils';
const Algol = require("./algol");
//import * as IMatch from './iferbase';
// <reference path="../../lib/node-4.d.ts" />
const distance = require("abot_stringdist");
exports.CharSequence = {
    isSameOrPlural: function (a, b) {
        if (Math.abs(a.length - b.length) > 1)
            return false;
        if (a == b)
            return true;
        if (a.length > b.length)
            return exports.CharSequence.isSameOrPlural(b, a);
        if (b.length > 3 && b.substr(0, b.length - 1) == a) {
            return true;
        }
        return false;
    },
    isVeryClose: function (a, b) {
        return distance.calcDistance(a, b) > Algol.Cutoff_rangeCloseMatch;
    },
    isSameOrPluralOrVeryClose: function (a, b) {
        var al = a.toLowerCase();
        var bl = b.toLowerCase();
        return exports.CharSequence.isSameOrPlural(al, bl)
            || exports.CharSequence.isVeryClose(al, bl);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcnNlcXVlbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hdGNoL2NoYXJzZXF1ZW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7OztHQVNHOzs7QUFFSCw2Q0FBNkM7QUFFN0Msa0NBQWtDO0FBRWxDLDJDQUEyQztBQUUzQyxpQ0FBaUM7QUFDakMsdUNBQXVDO0FBQ3ZDLDZDQUE2QztBQUM3Qyw0Q0FBNEM7QUFFL0IsUUFBQSxZQUFZLEdBQUc7SUFDMUIsY0FBYyxFQUFHLFVBQVUsQ0FBVSxFQUFFLENBQVU7UUFDL0MsSUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBRSxHQUFJLENBQUM7WUFDdEMsT0FBTyxLQUFLLENBQUM7UUFDZixJQUFLLENBQUMsSUFBSSxDQUFDO1lBQ1QsT0FBTyxJQUFJLENBQUM7UUFDZCxJQUFLLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU07WUFDdEIsT0FBTyxvQkFBWSxDQUFDLGNBQWMsQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7UUFDN0MsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRSxJQUFJLENBQUMsRUFDbkQ7WUFDRSxPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBQ0QsV0FBVyxFQUFHLFVBQVMsQ0FBUyxFQUFFLENBQVM7UUFDekMsT0FBTyxRQUFRLENBQUMsWUFBWSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsR0FBRyxLQUFLLENBQUMsc0JBQXNCLENBQUU7SUFDdkUsQ0FBQztJQUNELHlCQUF5QixFQUFHLFVBQVMsQ0FBVSxFQUFFLENBQVU7UUFDekQsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3pCLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN6QixPQUFRLG9CQUFZLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUM7ZUFDbEMsb0JBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7Q0FDRixDQUFDIn0=