var clip = require('../')
var test = require('tape')
var glob = require('glob')
var fs = require('fs')

var UPDATE = process.env.UPDATE

/*
 * Copied from turf-intersect tests.
 * Copyright (c) 2013 Morgan Herlocker
 * https://github.com/Turfjs/turf-intersect/blob/master/test/test.js
 */
test('basic', function (t) {
  glob.sync(__dirname + '/fixtures/in/*.json').forEach(function (input) {
    var features = JSON.parse(fs.readFileSync(input))
    var output = clip(features[0], features[1])
    if (UPDATE) {
      fs.writeFileSync(input.replace('/in/', '/out/'), JSON.stringify(output))
    }
    t.deepEqual(output, JSON.parse(fs.readFileSync(input.replace('/in/', '/out/'))), input)
  })
  t.end()
})
