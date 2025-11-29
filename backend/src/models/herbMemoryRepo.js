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
  // Ensure id and batchId are set
  const now = Date.now();
  if (!data.id) data.id = `herb-${now}-${Math.floor(Math.random() * 1000)}`;
  if (!data.batchId) data.batchId = data.id;
  const doc = makeDoc(data);
  // Store by both batchId and id for robust retrieval
  store.set(doc.batchId, doc);
  store.set(doc.id, doc);
  // If __raw flag is set, return direct reference (for unit tests)
  if (data.__raw) {
    return doc;
  }
  // Otherwise, return wrapped object for controller compatibility
  return { success: true, data: { ...doc, id: data.id, batchId: data.batchId } };
}

async function find() {
  // Only return unique docs by batchId
  const seen = new Set();
  return Array.from(store.values()).filter((d) => {
    if (seen.has(d.batchId)) return false;
    seen.add(d.batchId);
    return true;
  });
}
async function findOne(q) {
  // Try batchId, then id
  if (q.batchId) {
    const direct = store.get(q.batchId);
    if (direct) return direct;
  }
  if (q.id) {
    const byId = store.get(q.id);
    if (byId) return byId;
  }
  // Fallback: if only a string was passed
  if (typeof q === 'string') {
    return store.get(q) || null;
  }
  return null;
}

module.exports = { create, find, findOne, __store: store };
