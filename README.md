# mgnlq_parser1 [![Build Status](https://travis-ci.org/jfseb/mgnlq_parser1.svg?branch=master)](https://travis-ci.org/jfseb/mgnlq_parser1)[![Coverage Status](https://coveralls.io/repos/github/jfseb/mgnlq_parser1/badge.svg)](https://coveralls.io/github/jfseb/mgnlq_parser1)

Parse sentences into actions or queries

Parser for queries  List all CAT CAT where CAT FACT = XX in DOM


```javascript
npm i

gulp
```



# scratch

Filtering elements in an array


https://stackoverflow.com/questions/3985214/retrieve-only-the-queried-element-in-an-object-array-in-mongodb-collection


db.test.aggregate([
    // Get just the docs that contain a shapes element where color is 'red'
    {$match: {'shapes.color': 'red'}},
    {$project: {
        shapes: {$filter: {
            input: '$shapes',
            as: 'shape',
            cond: {$eq: ['$$shape.color', 'red']}
        }},
        _id: 0
    }}
])


db.coll.aggregate(
    [
        { "$match": { "_id": "123456" } },
        { "$project": {
            "detailLine": {
                "$map": {
                    "input": "$detailLine",
                    "as": "dline",
                    "in": {
                        "amount": "$$dline.value.detailLineCharges.allowedAmount.amount",
                        "reasonCode": "$$dline.value.detailLineCharges.allowedAmount.reasonCode"
                    }
                }
           }
        }}
    ]
)




# history

* 0.0.3  showURI, auxiliary categories
* 0.0.4  change in output format