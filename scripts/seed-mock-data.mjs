// Seeds demo mock data (topics, subtopics, edges, details, one diagram image) onto the root
// board via the running backend's REST API. Safe to re-run: it first clears every existing
// top-level node on the root board (cascades subtopics/edges/notes), then rebuilds from scratch.
//
// Usage: node scripts/seed-mock-data.mjs   (backend must be running on localhost:8080)

import { readFileSync } from "node:fs";

const BASE = "http://localhost:8080/api/v1";

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function createNode(boardId, label, x, y) {
  const node = await api("POST", `/boards/${boardId}/nodes`, {
    type: "TOPIC",
    label,
    positionX: x,
    positionY: y,
  });
  console.log(`  node "${label}" -> ${node.id} (childBoard ${node.childBoardId})`);
  return node;
}

async function createEdge(boardId, sourceId, targetId, tag) {
  try {
    await api("POST", `/boards/${boardId}/edges`, {
      sourceNodeId: sourceId,
      targetNodeId: targetId,
    });
  } catch (e) {
    console.log(`  edge skip (${tag}): ${e.message}`);
  }
}

// ---- 0. reset: clear every existing top-level node on the root board ----
const { boardId: rootBoardId } = await api("GET", "/boards/root");
console.log("root board:", rootBoardId);

const existing = await api("GET", `/boards/${rootBoardId}`);
if (existing.nodes.length > 0) {
  console.log(`\nClearing ${existing.nodes.length} existing top-level node(s)...`);
  for (const n of existing.nodes) {
    await api("DELETE", `/nodes/${n.id}`);
    console.log(`  deleted ${n.type} "${n.label ?? ""}" (${n.id})`);
  }
}

// ---- 1. top-level topics with layout positions ----
const topicLayout = {
  "Java": [520, 0],
  "Spring": [1040, 0],
  "Design Patterns": [260, 0],

  "Collections": [260, 200],
  "Data Structures": [520, 200],
  "Functional Programming": [780, 200],
  "Spring Boot": [1040, 200],
  "Spring Security": [1300, 200],

  "Maven": [260, 400],
  "Git": [520, 400],
  "Microservices": [1040, 400],
  "Authentication/Authorization": [1300, 400],

  "CI/CD": [390, 600],
  "Docker": [910, 600],
  "Kubernetes": [1170, 600],
  "RabbitMQ": [1430, 600],

  "Jira": [260, 800],
  "Agile": [520, 800],
  "Kafka": [910, 800],
  "Redis": [1170, 800],
  "AWS": [1430, 800],

  "AI": [780, 1000],
  "Spark": [1040, 1000],
  "Flink": [1300, 1000],
  "Airflow": [1560, 1000],
};

console.log("\nCreating topic nodes...");
const topics = {};
for (const [label, [x, y]] of Object.entries(topicLayout)) {
  topics[label] = await createNode(rootBoardId, label, x, y);
}

// ---- 2. relationships between topics ----
const topicEdges = [
  ["Java", "Spring"],
  ["Java", "Collections"],
  ["Java", "Data Structures"],
  ["Java", "Functional Programming"],
  ["Java", "Design Patterns"],
  ["Java", "Maven"],
  ["Data Structures", "Collections"],

  ["Spring", "Spring Boot"],
  ["Spring Boot", "Spring Security"],
  ["Spring Boot", "Microservices"],
  ["Spring Security", "Authentication/Authorization"],
  ["Design Patterns", "Spring Boot"],

  ["Microservices", "Docker"],
  ["Microservices", "Kubernetes"],
  ["Microservices", "Kafka"],
  ["Microservices", "RabbitMQ"],
  ["Microservices", "Redis"],
  ["Microservices", "AWS"],
  ["Docker", "Kubernetes"],
  ["Kubernetes", "AWS"],

  ["Git", "CI/CD"],
  ["Maven", "CI/CD"],
  ["CI/CD", "Agile"],
  ["Agile", "Jira"],

  ["Kafka", "Flink"],
  ["Flink", "Spark"],
  ["Spark", "AI"],
  ["Spark", "Airflow"],
  ["Airflow", "AWS"],
];

console.log("\nCreating topic edges...");
for (const [a, b] of topicEdges) {
  await createEdge(rootBoardId, topics[a].id, topics[b].id, `${a} -> ${b}`);
}

// ---- 3. Java subtopics ----
console.log("\nCreating Java subtopics...");
const javaBoardId = topics["Java"].childBoardId;
const javaSubtopicLayout = {
  "JVM": [100, 100],
  "Collections": [400, 100],
  "Threads": [700, 100],
  "Generics": [100, 300],
  "Streams (Lambda & Stream API)": [400, 300],
  "Exception Handling": [700, 300],
};
const javaSubtopics = {};
for (const [label, [x, y]] of Object.entries(javaSubtopicLayout)) {
  javaSubtopics[label] = await createNode(javaBoardId, label, x, y);
}
console.log("  linking Java subtopics to parent...");
for (const label of Object.keys(javaSubtopicLayout)) {
  await createEdge(javaBoardId, javaSubtopics[label].id, topics["Java"].id, `${label} -> Java`);
}

// ---- 4. Microservices subtopics ----
console.log("\nCreating Microservices subtopics...");
const microservicesBoardId = topics["Microservices"].childBoardId;
const microservicesSubtopicLayout = {
  "Service Discovery": [100, 100],
  "API Gateway": [400, 100],
  "Circuit Breaker": [700, 100],
  "Load Balancing": [100, 300],
  "Event-Driven Architecture": [400, 300],
};
const microservicesSubtopics = {};
for (const [label, [x, y]] of Object.entries(microservicesSubtopicLayout)) {
  microservicesSubtopics[label] = await createNode(microservicesBoardId, label, x, y);
}
console.log("  linking Microservices subtopics to parent...");
for (const label of Object.keys(microservicesSubtopicLayout)) {
  await createEdge(
    microservicesBoardId,
    microservicesSubtopics[label].id,
    topics["Microservices"].id,
    `${label} -> Microservices`,
  );
}

// ---- 5. Details content for a couple of subtopics ----
console.log("\nWriting details content...");

const collectionsDetails = `Java Collections Framework provides ready-made data structures: List, Set, Queue, and Map.

Key implementations:
- ArrayList: resizable array, O(1) random access, O(n) insert/remove in the middle.
- LinkedList: doubly-linked list, O(1) insert/remove at the ends, O(n) random access.
- HashSet / HashMap: hash table backed, O(1) average case, no ordering guarantee.
- TreeSet / TreeMap: red-black tree backed, O(log n), sorted order.
- PriorityQueue: binary heap, always retrieves the smallest (or largest) element first.

Common interview angles:
- ArrayList vs LinkedList tradeoffs.
- HashMap internals: buckets, hashCode/equals contract, treeification of buckets (Java 8+).
- fail-fast vs fail-safe iterators (ConcurrentModificationException).
- Comparable vs Comparator.

See the attached diagram for the interface/implementation hierarchy.`;

const threadsDetails = `Java concurrency basics for interviews.

Creating threads:
- Extend Thread, or implement Runnable (preferred - leaves the class free to extend something else).
- Prefer ExecutorService / thread pools over managing raw Thread objects directly.

Thread lifecycle: NEW -> RUNNABLE -> (BLOCKED / WAITING / TIMED_WAITING) -> TERMINATED.

Synchronization:
- synchronized (method or block) - intrinsic lock / monitor.
- java.util.concurrent.locks.ReentrantLock - explicit lock, supports tryLock/fairness.
- volatile - guarantees visibility only, not atomicity.
- Atomic classes (AtomicInteger, AtomicLong, ...) - lock-free, CAS-based updates.

Common interview topics:
- Deadlock, livelock, and starvation - causes and how to avoid them.
- wait()/notify()/notifyAll() vs Condition.
- Executors.newFixedThreadPool vs newCachedThreadPool vs newSingleThreadExecutor.
- CompletableFuture for composing async work.
- Producer-consumer pattern with BlockingQueue.`;

await api("PATCH", `/nodes/${javaSubtopics["Collections"].id}/details`, {
  detailsContent: collectionsDetails,
});
console.log("  Collections details set");

await api("PATCH", `/nodes/${javaSubtopics["Threads"].id}/details`, {
  detailsContent: threadsDetails,
});
console.log("  Threads details set");

// ---- 6. Image attachment: Collections class hierarchy diagram as a note block ----
console.log("\nAttaching Collections hierarchy diagram...");
const pngBase64 = readFileSync(
  new URL("./assets/collections-hierarchy.png", import.meta.url),
).toString("base64");
const noteBlock = await api("POST", `/nodes/${javaSubtopics["Collections"].id}/note-blocks`, {
  color: "blue",
  positionX: 40,
  positionY: 40,
});
await api("PATCH", `/note-blocks/${noteBlock.id}`, {
  content: `<h2>Java Collections Framework</h2><img src="data:image/png;base64,${pngBase64}"><p>Interfaces (blue) vs implementation classes (green) vs the separate Map hierarchy (amber).</p>`,
  width: 420,
  height: 340,
});
console.log("  note block image attached to Collections");

console.log("\nDone. Re-run this script anytime to reset and reseed the demo data.");
