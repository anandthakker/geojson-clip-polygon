var intersect = require('turf-intersect')
var buffer = require('turf-buffer')
var area = require('turf-area')
var extent = require('turf-extent')
var envelope = require('turf-envelope')
var explode = require('turf-explode')
var inside = require('turf-inside')

/**
 * Clip a polygon feature to the given boundary polygon, copying properties
 * from the original feature and safely dealing with self-intersections.
 *
 * @param {Feature<Polygon>} boundary
 * @param {Feature<Polygon>} toClip
 * @param {number} options.threshold - area in m^2 below which to drop result polygon
 *
 * @returns Feature<Polygon> - the clipped feature, or null if no intersection
 */
module.exports = function clip (boundary, toClip, options) {
  options = options || {}
  var threshold = options.threshold
  if (typeof threshold === 'undefined') { threshold = 0 }

  // filter out zero-area rings that can be caused by tile slicing
  var rings = toClip.geometry.coordinates.slice(1)
  rings = rings.filter(function (ring) {
    return area(envelope({
      type: 'LineString',
      coordinates: ring
    })) > threshold
  })
  toClip.geometry.coordinates = [toClip.geometry.coordinates[0]].concat(rings)

  // drop polygons with bboxes below the given area threshold
  if (area(envelope(toClip)) <= threshold) {
    return null
  }

  if (isInside(toClip, boundary)) {
    return toClip
  }

  if (isInside(boundary, toClip)) {
    return {
      type: 'Feature',
      properties: toClip.properties,
      geometry: boundary.geometry
    }
  }

  if (isOutside(toClip, boundary)) {
    return null
  }

  toClip = bufferDegenerate(toClip)
  return clipPolygon(boundary, toClip)
}

function bufferDegenerate (feature) {
  var buffed = buffer(feature, 0)
  buffed.properties = feature.properties
  return buffed
}

// no false positives, some false negatives
function isOutside (feature, poly) {
  var a = feature.bbox = feature.bbox || extent(feature)
  var b = poly.bbox = poly.bbox || extent(poly)
  return a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]
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
