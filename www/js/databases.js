function _connectToPouchDb(databaseName) {
  return new PouchDB(databaseName, { adapter: 'websql', location: 2 });
}

function _logPouchError(message, error) {
  console.error(message, error.status, error.name, error.message, error.reason);
}

var FakeRemoteDatabase = function () { };
FakeRemoteDatabase.prototype.prepare = function () {
  var connectAndLoad = function () {
    this.db = _connectToPouchDb('fake_remote');
    console.log('Bulk loading ', FAKE_REMOTE_DATA.length, ' records');
    return this.db.bulkDocs(FAKE_REMOTE_DATA).then(function () {
      console.log('Bulk loading into "remote" database complete');
    }, function (error) {
      _logPouchError('Bulk loading failed', error);
    });
  }.bind(this);

  var connectAndLoadAfterError = function (error) {
    _logPouchError('cleaning up the old remote database failed:', error);
    connectAndLoad();
  }.bind(this);

  return _connectToPouchDb('fake_remote').destroy().
    then(connectAndLoad, connectAndLoadAfterError); // some connect errors don't matter
};

var LocalDatabase = function () { };

LocalDatabase.prototype.indexes = [
  {
    _id: '_design/by_national_id',
    views: {
      by_national_id: {
        map: function (doc) {
          emit(doc.national_id);
        }.toString()
      }
    }
  },
  {
    _id: '_design/by_given_name',
    views: {
      by_given_name: {
        map: function (doc) {
          emit(doc.given_name);
        }.toString()
      }
    }
  },
  {
    _id: '_design/by_surname',
    views: {
      by_surname: {
        map: function (doc) {
          emit(doc.surname);
        }.toString()
      }
    }
  },
  {
    _id: '_design/by_city',
    views: {
      by_city: {
        map: function (doc) {
          emit(doc.city);
        }.toString()
      }
    }
  },
  {
    _id: '_design/city_surnames',
    views: {
      city_surnames: {
        map: function (doc) {
          emit(doc.city, doc.surname);
        }.toString()
      }
    }
  },
  {
    _id: '_design/surname_cities',
    views: {
      surname_cities: {
        map: function (doc) {
          emit(doc.surname, doc.city);
        }.toString()
      }
    }
  },
  {
    _id: '_design/city_counts',
    views: {
      city_counts: {
        map: function (doc) {
          emit(doc.city, 1);
        }.toString(),
        reduce: '_sum'
      }
    }
  },
  {
    _id: '_design/all_the_fields',
    views: {
      all_the_fields: {
        map: function (doc) {
          emit([doc.city, doc.surname, doc.given_name], doc.national_id);
        }.toString()
      }
    }
  }
];

LocalDatabase.prototype.prepare = function () {
  var connect = function () {
    this.db = _connectToPouchDb('local');
  }.bind(this);

  var connectAfterError = function (error) {
    _logPouchError('cleaning up the old local database failed:', error);
    connect();
  }.bind(this);

  var defineIndexes = function () {
    var definitionPromises = this.indexes.map(function (designDoc) {
      return this.db.put(designDoc).then(function () {
        console.log('Defined index', designDoc._id);
      }, function (error) {
        _logPouchError('Failed to define index ' + designDoc._id, error);
      });
    }.bind(this));

    return Promise.all(definitionPromises);
  }.bind(this);

  return _connectToPouchDb('local').destroy().
    then(connect, connectAfterError). // some connect errors don't matter
    then(defineIndexes);
};

LocalDatabase.prototype.replicateFrom = function (sourcePouchDB) {
  return this.db.replicate.from(sourcePouchDB);
};

LocalDatabase.prototype.buildIndex = function (designDocId) {
  var viewName = designDocId.replace('_design/', '');

  // Query which returns no values but prompts PouchDB to rebuild the database
  return this.db.query(viewName, { limit: 0 });
};

window.FakeRemoteDatabase = FakeRemoteDatabase;
window.LocalDatabase = LocalDatabase;
