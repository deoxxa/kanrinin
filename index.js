var events = require("events");

var TenantManager = module.exports = function TenantManager(options) {
  events.EventEmitter.call(this);

  options = options || {};

  this._createTenant = options.createTenant;
  this._destroyTenant = options.destroyTenant;

  this._tenants = {};
};
TenantManager.prototype = Object.create(events.EventEmitter.prototype, {constructor: {value: TenantManager}});

TenantManager.prototype.add = function add(doc, options, cb) {
  if (typeof options === "function") {
    cb = options;
    options = null;
  }

  options = options || {};

  var self = this;

  this._createTenant(doc, function(err, tenant) {
    if (err) {
      if (cb) {
        return cb(err);
      }

      return self.emit("error", err);
    }

    self._tenants[doc.id] = tenant;

    if (!options.silent) {
      setImmediate(function() {
        return self.emit("add", tenant);
      });
    }

    if (cb) {
      return cb(null, tenant);
    }
  });
};

TenantManager.prototype.change = function change(doc, options, cb) {
  if (typeof options === "function") {
    cb = options;
    options = null;
  }

  options = options || {};

  var self = this;

  return this.remove(doc, {silent: true}, function(err) {
    if (err) {
      if (cb) {
        return cb(err);
      }

      return self.emit("error", err);
    }

    return self.add(doc, {silent: true}, function(err, tenant) {
      if (err) {
        if (cb) {
          return cb(err);
        }

        return self.emit("error", err);
      }

      if (!options.silent) {
        setImmediate(function() {
          return self.emit("change", tenant);
        });
      }

      if (cb) {
        return cb(null, tenant);
      }
    });
  });
};

TenantManager.prototype.remove = function remove(doc, options, cb) {
  if (typeof options === "function") {
    cb = options;
    options = null;
  }

  options = options || {};

  if (!this._tenants[doc.id]) {
    if (cb) {
      return cb();
    }

    return;
  }

  var self = this;

  var tenant = this._tenants[doc.id];

  this._destroyTenant(tenant, function(err) {
    if (err) {
      if (cb) {
        return cb(err);
      }

      return self.emit("error", err);
    }

    if (!options.silent) {
      setImmediate(function() {
        return self.emit("remove", tenant);
      });
    }

    if (cb) {
      return cb();
    }
  });
};
