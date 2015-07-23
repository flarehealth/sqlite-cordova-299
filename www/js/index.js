/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
  // Application Constructor
  initialize: function() {
    this.remote = new FakeRemoteDatabase();
    this.local = new LocalDatabase();

    if (window.cordova) {
      document.addEventListener('deviceready', this.setToReady.bind(this));
    } else {
      setTimeout(this.setToReady.bind(this), 500);
    }
    document.getElementById('start').addEventListener('click', this.start.bind(this));
    document.getElementById('start-over').addEventListener('click', this.startOver.bind(this));
  },

  setToReady: function () {
    this._switchToCard('ready');
  },

  start: function () {
    if (this.started) { return; }
    this._switchToCard('running');
    this.runAll();
  },

  startOver: function () {
    window.location.reload();
  },

  runAll: function () {
    var self = this;

    self._appendStep("Preparing fake remote database…");
    self.remote.prepare().then(function () {
      self._replaceLastStep('Fake remote database prepared');

      self._appendStep('Preparing local database…');
      return self.local.prepare();
    }).then(function () {
      self._replaceLastStep('Local database prepared');

      self._appendStep('Replicating "remote" to local…');
      return self.local.replicateFrom(self.remote.db);
    }).then(function () {
      self._replaceLastStep('Replicated from "remote" to local');

      self._appendStep('Building indexes…');
      return self._buildAllIndexes();
    }).then(function () {
      var runningCard = document.getElementById('card-running');
      runningCard.getElementsByTagName('h1')[0].innerHTML = 'Complete';
      runningCard.className = runningCard.className + ' complete';
    });
  },

  _switchToCard: function (name) {
    var body = document.getElementsByTagName('body')[0];
    body.className = 'card-' + name;
  },

  _appendStep: function (content) {
    var steps = document.getElementById('steps'),
        newStepItem = document.createElement('li');
    newStepItem.appendChild(document.createTextNode(content));
    steps.appendChild(newStepItem);
    console.log('New step:', content);
  },

  _replaceLastStep: function (content) {
    var steps = document.getElementById('steps'),
        stepCount = steps.childNodes.length,
        lastStep = steps.childNodes[stepCount - 1];
    lastStep.innerHTML = content;
    console.log('Step update:', content);
  },

  _buildAllIndexes: function (startFrom) {
    var self = this,
        indexCount = self.local.indexes.length,
        indexesComplete = startFrom || 0,
        nextIndexId;
    if (indexesComplete < indexCount) {
      nextIndexId = self.local.indexes[indexesComplete]._id;
      self._replaceLastStep("Built " + indexesComplete + " / " + indexCount + ". Building " + nextIndexId + "…");
      return self.local.buildIndex(nextIndexId).then(function () {
        indexesComplete++;
        return self._buildAllIndexes(indexesComplete);
      }, function (error) {
        console.error("Building index", nextIndexId, 'failed:', error);
      });
    } else {
      self._replaceLastStep("Built all " + indexesComplete + " indexes");
      return Promise.resolve();
    }
  }
};

app.initialize();

window.App = app;
