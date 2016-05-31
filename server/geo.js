var db = require('./db')
var mectoDB = db('mecto')

var SEARCH_RADIUS = 1000

function save(lat, lon, userInfo, callback) {
  mectoDB.save(userInfo.id, {
    name: userInfo.name,
    email: userInfo.email,
    avatarIndex: userInfo.avatarIndex,
    address: userInfo.address,
    network: userInfo.network,
    timestamp: new Date().getTime(),
    geometry: {
      coordinates: [lon, lat],
      type: 'Point'
    }
  }, function(err) {
    if (err) return callback(err);
    callback()
  });
}

function remove(doc) {
  mectoDB.remove(doc._id, doc._rev, function(err) {
    if (err) console.error('FATAL: failed to delete mecto doc')
  });
}

function getIdsOlderThan(age, callback) {
  var now = new Date().getTime();
  query = {
    selector: {
      _id: { $gt: 0 },
      timestamp: { $lt: now - age }
    },
    fields: [ '_id', '_rev' ],
    limit: 100
  };
  mectoDB.connection.request({method: 'POST', path: '/mecto/_find', body: query}, function(err, result) {
    if (err) return callback(err);
    callback(null, result.docs);
  });
}

function search(lat, lon, userInfo, callback) {
  if (userInfo.network !== 'bitcoin' && userInfo.network !== 'litecoin') {
    return callback({error: 'unsupported_network'})
  }

  var path = '/mecto/_design/geoDoc/_geo/' + userInfo.network + 'GeoIndex';
  var query = {
    lat: lat,
    lon: lon,
    radius: SEARCH_RADIUS,
    limit: 10,
    relation: 'contains',
    include_docs: true
  };

  mectoDB.connection.request({method: 'GET', path: path, query: query}, function(err, results) {
    if (err) return callback(err);
    callback(null, results.map(function(item) {
      return {
        address: item.address,
        name: item.name,
        email: item.email,
        avatarIndex: item.avatarIndex
      }
    }));
  });
}

module.exports = {
  SEARCH_RADIUS: SEARCH_RADIUS,
  save: save,
  search: search,
  remove: remove,
  getIdsOlderThan: getIdsOlderThan
}
