/* Copyright (C) 2016 NooBaa */
'use strict';

/**
 * http://docs.aws.amazon.com/AmazonS3/latest/API/RESTBucketPUT.html
 */
function put_bucket(req, res) {
    return req.rpc_client.bucket.create_bucket({
            name: req.params.bucket
        })
        .then(() => {
            res.setHeader('Location', '/' + req.params.bucket);
        })
        .return();
}

module.exports = {
    handler: put_bucket,
    body: {
        type: 'xml',
        // body is optional since it may contain region name (location constraint)
        // or use the default US East region when not included
        optional: true,
    },
    reply: {
        type: 'empty',
    },
};