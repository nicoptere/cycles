/***************************************************************************************


DOUGLAS PEUCKER SIMPLIFICATION


***************************************************************************************/
let xy = { x: "x", y: "y" };
export default class Simplify {
  static compute(points, tolerance, format = null) {
    if (points == null || points.length < 3) {
      return points;
    }
    //format of the point values accessors ( x:0, y:1 for arrays )
    xy = format || { x: "x", y: "y" };

    var firstPoint = 0;
    var lastPoint = points.length - 1;
    var pointIndicesToKeep = [firstPoint, lastPoint];

    //The first and the last point cannot be the same
    while (
      points[firstPoint][xy.x] == points[lastPoint][xy.x] &&
      points[firstPoint][xy.y] == points[lastPoint][xy.y]
    ) {
      lastPoint--;
    }

    this.reduce(points, firstPoint, lastPoint, tolerance, pointIndicesToKeep);

    var returnPoints = [];
    points.forEach((p, index) => {
      if (p.connexions > 2) {
        pointIndicesToKeep.push(index);
      }
    });

    pointIndicesToKeep.sort(function (a, b) {
      return a < b ? -1 : 1;
    });

    pointIndicesToKeep.forEach(function (index) {
      returnPoints.push(points[index]);
    });

    return returnPoints;
  }

  /// Douglases the peucker reduction.

  static reduce(points, firstPoint, lastPoint, tolerance, pointIndicesToKeep) {
    var maxDistance = 0;
    var indexFarthest = 0;

    for (var index = firstPoint; index < lastPoint; index++) {
      // if () {
      //   indexFarthest = index;
      //   console.log("keep", indexFarthest);
      //   continue;
      // }
      var distance = this.perpendicularDistance(
        points[firstPoint],
        points[lastPoint],
        points[index]
      );
      if (distance > maxDistance) {
        maxDistance = distance;
        indexFarthest = index;
      }
    }

    if (maxDistance > tolerance && indexFarthest != 0) {
      //Add the largest point that exceeds the tolerance
      pointIndicesToKeep.push(indexFarthest);

      // console.log("=> split", indexFarthest);
      this.reduce(
        points,
        firstPoint,
        indexFarthest,
        tolerance,
        pointIndicesToKeep
      );
      this.reduce(
        points,
        indexFarthest,
        lastPoint,
        tolerance,
        pointIndicesToKeep
      );
    }
  }

  /// The distance of a point from a line made from point1 and point2.

  static perpendicularDistance(point1, point2, point) {
    //Area = |(1/2)(x1y2 + x2y3 + x3y1 - x2y1 - x3y2 - x1y3)|   *Area of triangle
    //Base = v((x1-x2)Â²+(x1-x2)Â²)                               *Base of Triangle*
    //Area = .5*Base*H                                          *Solve for height
    //Height = Area/.5/Base

    var area = Math.abs(
      0.5 *
        (point1[xy.x] * point2[xy.y] +
          point2[xy.x] * point[xy.y] +
          point[xy.x] * point1[xy.y] -
          point2[xy.x] * point1[xy.y] -
          point[xy.x] * point2[xy.y] -
          point1[xy.x] * point[xy.y])
    );
    var bottom = Math.sqrt(
      Math.pow(point1[xy.x] - point2[xy.x], 2) +
        Math.pow(point1[xy.y] - point2[xy.y], 2)
    );
    return (area / bottom) * 2;
  }
}
