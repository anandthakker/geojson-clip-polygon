var kinks = require('turf-kinks')
var intersect = require('turf-intersect')
var buffer = require('turf-buffer')
var area = require('turf-area')
var envelope = require('turf-envelope')
var explode = require('turf-explode')
var inside = require('turf-inside')

/**
 * Clip a polygon feature to the given boundary polygon, copying properties
 * from the original feature and safely dealing with self-intersections.
 *
 * @param Feature<Polygon> boundary
 * @param Feature<Polygon> toClip
 * @param number options.threshold - area in m^2 below which to drop result polygon
 *
 * @returns Feature<Polygon> - the clipped feature, or null if no intersection
 */
module.exports = function clip (boundary, toClip, options) {
  options = options || {}
  if (typeof options.threshold === 'undefined') { options.threshold = 0 }

  toClip = bufferDegenerate(toClip)
  if (area(envelope(toClip)) < options.threshold) {
    return null
  }

  if (isInside(toClip, boundary)) {
    return toClip
  } else {
    return clipPolygon(boundary, toClip)
  }
}

function bufferDegenerate (feature) {
  // clean up any self-intersecting polygons with a naive polygon
  // offset (aka 'buffer') algorithm.
  var k = kinks(feature)
  if (k.intersections.features.length > 0) {
    var buffed = buffer(feature, 0)
    buffed.properties = feature.properties
    return buffed
  } else {
    return feature
  }
}

function isInside (feature, poly) {
  var points = explode(feature)
  return points.features.map(function (pt) {
    return inside(pt, poly)
  })
  .reduce(function (a, b) { return a && b }, true)
}

function clipPolygon (poly, feature) {
  var intersection = intersect(poly, feature)
  if (intersection) {
    intersection.properties = feature.properties
    return intersection
  } else {
    return null
  }
}
