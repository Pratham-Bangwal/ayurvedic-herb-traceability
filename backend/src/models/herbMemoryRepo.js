// Purpose: In-memory fallback repository when Mongo not available (test/demo)
// Usage: Automatically patched in tests/setup when Mongo unreachable

const store = new Map();

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function makeDoc(data) {
  return {
    ...data,
    processingEvents: data.processingEvents || [],
    ownershipTransfers: data.ownershipTransfers || [],
    createdAt: data.createdAt || new Date(),
    updatedAt: new Date(),
    async save() {
      store.set(this.batchId, this);
      return this;
    },
    toObject() {
      return clone({ ...this });
    },
  };
}

async function create(data) {
  const doc = makeDoc(data);
  store.set(doc.batchId, doc);
  return doc;
}

async function find() {
  return Array.from(store.values()).map((d) => d);
}
async function findOne(q) {
  return store.get(q.batchId);
}

module.exports = { create, find, findOne, __store: store };
