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

// ---- 5. Subtopics for the remaining topics ----
function gridLayout(labels) {
  const layout = {};
  labels.forEach((label, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    layout[label] = [100 + col * 300, 100 + row * 200];
  });
  return layout;
}

async function addSubtopics(topicLabel, subtopicLabels) {
  console.log(`\nCreating ${topicLabel} subtopics...`);
  const boardId = topics[topicLabel].childBoardId;
  const layout = gridLayout(subtopicLabels);
  const created = {};
  for (const [label, [x, y]] of Object.entries(layout)) {
    created[label] = await createNode(boardId, label, x, y);
  }
  console.log(`  linking ${topicLabel} subtopics to parent...`);
  for (const label of subtopicLabels) {
    await createEdge(boardId, created[label].id, topics[topicLabel].id, `${label} -> ${topicLabel}`);
  }
  return created;
}

const subtopicsByTopic = {
  "Spring": [
    "Dependency Injection",
    "Bean Lifecycle",
    "Aspect-Oriented Programming",
    "Spring MVC",
    "ApplicationContext",
  ],
  "Spring Boot": [
    "Auto-Configuration",
    "Starters",
    "Actuator",
    "Profiles",
    "Externalized Configuration",
  ],
  "Spring Security": [
    "Authentication Flow",
    "Authorization (RBAC)",
    "JWT Filters",
    "CORS & CSRF",
    "OAuth2 / OIDC",
  ],
  "Design Patterns": [
    "Singleton",
    "Factory",
    "Builder",
    "Observer",
    "Strategy",
    "Decorator",
  ],
  "Collections": [
    "List Implementations",
    "Set Implementations",
    "Map Implementations",
    "Queue & Deque",
    "Iterators",
    "Collectors",
  ],
  "Data Structures": [
    "Arrays",
    "Linked Lists",
    "Trees",
    "Graphs",
    "Hash Tables",
    "Heaps",
  ],
  "Functional Programming": [
    "Lambda Expressions",
    "Method References",
    "Functional Interfaces",
    "Stream Pipeline",
    "Optional",
  ],
  "Maven": [
    "POM Structure",
    "Dependency Scopes",
    "Lifecycle Phases",
    "Multi-Module Projects",
    "Plugins",
  ],
  "Git": [
    "Branching Strategies",
    "Merge vs Rebase",
    "Git Internals",
    "Conflict Resolution",
    "Hooks",
  ],
  "Authentication/Authorization": [
    "OAuth2",
    "JWT",
    "SAML",
    "RBAC vs ABAC",
    "Session vs Token-Based",
  ],
  "CI/CD": [
    "Pipeline Stages",
    "Build Automation",
    "Automated Testing Gates",
    "Deployment Strategies",
    "Artifact Management",
  ],
  "Docker": [
    "Images vs Containers",
    "Dockerfile Best Practices",
    "Volumes & Networking",
    "Multi-Stage Builds",
    "Docker Compose",
  ],
  "Kubernetes": [
    "Pods & Deployments",
    "Services & Ingress",
    "ConfigMaps & Secrets",
    "Horizontal Pod Autoscaling",
    "Helm",
  ],
  "RabbitMQ": [
    "Exchanges & Queues",
    "Routing Types",
    "Message Acknowledgement",
    "Dead Letter Queues",
    "Clustering",
  ],
  "Jira": [
    "Issue Types & Workflows",
    "Sprint Planning",
    "Scrum & Kanban Boards",
    "Reporting & Dashboards",
  ],
  "Agile": [
    "Scrum Ceremonies",
    "Kanban Principles",
    "User Stories & Story Points",
    "Retrospectives",
  ],
  "Kafka": [
    "Topics & Partitions",
    "Producers & Consumers",
    "Consumer Groups",
    "Offset Management",
    "Kafka Streams",
  ],
  "Redis": [
    "Data Types",
    "Caching Strategies",
    "Pub/Sub",
    "Persistence (RDB/AOF)",
    "Redis Cluster",
  ],
  "AWS": [
    "EC2 & Auto Scaling",
    "S3",
    "Lambda",
    "RDS",
    "IAM",
  ],
  "AI": [
    "Machine Learning Basics",
    "Neural Networks",
    "LLMs & Prompt Engineering",
    "Model Evaluation",
  ],
  "Spark": [
    "RDDs vs DataFrames",
    "Spark SQL",
    "Partitioning & Shuffling",
    "Spark Streaming",
  ],
  "Flink": [
    "Stream Processing Model",
    "Windowing",
    "State Management",
    "Checkpointing",
  ],
  "Airflow": [
    "DAGs",
    "Operators & Sensors",
    "Scheduling",
    "XComs",
  ],
};

const newSubtopics = [];
for (const [topicLabel, labels] of Object.entries(subtopicsByTopic)) {
  const created = await addSubtopics(topicLabel, labels);
  newSubtopics.push(...Object.values(created));
}

// ---- 5b. randomly mark a portion of all subtopics as done ----
console.log("\nMarking random subtopics as done...");
const allSubtopics = [...Object.values(javaSubtopics), ...Object.values(microservicesSubtopics), ...newSubtopics];
const shuffled = [...allSubtopics].sort(() => Math.random() - 0.5);
const doneCount = Math.round(allSubtopics.length * 0.3);
for (const node of shuffled.slice(0, doneCount)) {
  await api("PATCH", `/nodes/${node.id}`, { completed: true });
  console.log(`  marked "${node.label}" as done`);
}

// ---- 6. Summary note blocks for a couple of subtopics ----
// NOTE: subtopic nodes (any node inside a non-root board) never show the "Details" textarea in
// the UI - that affordance only renders for top-level topics on the root board (see
// TopicNode.tsx: the Details button and detailsContent field only apply when !isSubtopicBoard).
// Subtopics surface free text through note blocks on their own "Open subtopic" board instead, so
// summaries for subtopics must be written as note blocks, not via PATCH /nodes/{id}/details.
console.log("\nWriting summary note blocks...");

async function addNoteBlock(nodeId, { color, x, y, width, height, html }) {
  const noteBlock = await api("POST", `/nodes/${nodeId}/note-blocks`, {
    color,
    positionX: x,
    positionY: y,
  });
  await api("PATCH", `/note-blocks/${noteBlock.id}`, { content: html, width, height });
}

await addNoteBlock(javaSubtopics["Collections"].id, {
  color: "yellow",
  x: 500,
  y: 40,
  width: 480,
  height: 460,
  html: `<h2>Java Collections Framework</h2>
<p>Ready-made data structures: <strong>List</strong>, <strong>Set</strong>, <strong>Queue</strong>, and <strong>Map</strong>.</p>
<h3>Key implementations</h3>
<ul>
<li><strong>ArrayList</strong>: resizable array, O(1) random access, O(n) insert/remove in the middle.</li>
<li><strong>LinkedList</strong>: doubly-linked list, O(1) insert/remove at the ends, O(n) random access.</li>
<li><strong>HashSet / HashMap</strong>: hash table backed, O(1) average case, no ordering guarantee.</li>
<li><strong>TreeSet / TreeMap</strong>: red-black tree backed, O(log n), sorted order.</li>
<li><strong>PriorityQueue</strong>: binary heap, always retrieves the smallest (or largest) element first.</li>
</ul>
<h3>Common interview angles</h3>
<ul>
<li>ArrayList vs LinkedList tradeoffs.</li>
<li>HashMap internals: buckets, hashCode/equals contract, treeification of buckets (Java 8+).</li>
<li>fail-fast vs fail-safe iterators (ConcurrentModificationException).</li>
<li>Comparable vs Comparator.</li>
</ul>
<h3>Capacity &amp; performance tuning</h3>
<ul>
<li>ArrayList grows by 50% when full; pre-size with an initial capacity when the final size is known to avoid repeated copies.</li>
<li>HashMap default load factor is 0.75; resizing rehashes every entry, so pre-size for large known datasets.</li>
<li>LinkedHashMap preserves insertion order (or access order, useful for building an LRU cache).</li>
<li>Collections.unmodifiableList/Map vs List.of/Map.of - immutability guarantees and where each is enforced (view wrapper vs truly immutable).</li>
</ul>
<h3>Concurrency-safe collections</h3>
<ul>
<li>Collections.synchronizedList/Map - coarse-grained locking, wraps an existing collection.</li>
<li>ConcurrentHashMap - segment/bucket-level locking, no full-map locks on reads.</li>
<li>CopyOnWriteArrayList - snapshot iteration, best for read-heavy/rarely-mutated lists.</li>
</ul>
<h3>Java version notes</h3>
<ul>
<li>Java 8: default methods on Collection/Map (forEach, computeIfAbsent, merge), Stream integration.</li>
<li>Java 9: List.of/Set.of/Map.of factory methods for compact immutable collections.</li>
<li>Java 10+: var for local collection declarations, minor API additions (List.copyOf, toUnmodifiableList collector).</li>
</ul>
<p>See the attached diagram for the interface/implementation hierarchy.</p>`,
});
console.log("  Collections summary note block added");

await addNoteBlock(javaSubtopics["Threads"].id, {
  color: "green",
  x: 40,
  y: 40,
  width: 480,
  height: 460,
  html: `<h2>Java Concurrency Basics</h2>
<h3>Creating threads</h3>
<ul>
<li>Extend Thread, or implement Runnable (preferred - leaves the class free to extend something else).</li>
<li>Prefer ExecutorService / thread pools over managing raw Thread objects directly.</li>
</ul>
<p>Thread lifecycle: NEW -&gt; RUNNABLE -&gt; (BLOCKED / WAITING / TIMED_WAITING) -&gt; TERMINATED.</p>
<h3>Synchronization</h3>
<ul>
<li>synchronized (method or block) - intrinsic lock / monitor.</li>
<li>java.util.concurrent.locks.ReentrantLock - explicit lock, supports tryLock/fairness.</li>
<li>volatile - guarantees visibility only, not atomicity.</li>
<li>Atomic classes (AtomicInteger, AtomicLong, ...) - lock-free, CAS-based updates.</li>
</ul>
<h3>Common interview topics</h3>
<ul>
<li>Deadlock, livelock, and starvation - causes and how to avoid them.</li>
<li>wait()/notify()/notifyAll() vs Condition.</li>
<li>Executors.newFixedThreadPool vs newCachedThreadPool vs newSingleThreadExecutor.</li>
<li>CompletableFuture for composing async work.</li>
<li>Producer-consumer pattern with BlockingQueue.</li>
</ul>`,
});
console.log("  Threads summary note block added");

await addNoteBlock(microservicesSubtopics["Event-Driven Architecture"].id, {
  color: "blue",
  x: 40,
  y: 40,
  width: 520,
  height: 480,
  html: `<h2>Event-Driven Architecture</h2>
<p>Decouples microservices by having them communicate through events rather than direct synchronous calls.</p>
<h3>Core concepts</h3>
<ul>
<li>Producers publish events (facts about something that happened) to a broker; they don't know who consumes them.</li>
<li>Consumers subscribe to the events they care about and react independently.</li>
<li>Broker (Kafka, RabbitMQ, SNS/SQS, ...) handles delivery, buffering, and often ordering/retries.</li>
</ul>
<h3>Common patterns</h3>
<ul>
<li>Event notification: a small event ("OrderPlaced") tells consumers to go fetch details if needed.</li>
<li>Event-carried state transfer: the event carries the full payload, so consumers don't need to call back.</li>
<li>Event sourcing: the sequence of events IS the source of truth; state is derived by replaying them.</li>
<li>CQRS: separate write model (commands/events) from read model (optimized query views), often paired with event sourcing.</li>
<li>Saga pattern: a chain of local transactions coordinated via events to implement a distributed transaction, with compensating events for rollback.</li>
</ul>
<h3>Tradeoffs vs request/response</h3>
<ul>
<li>Pros: loose coupling, independent scaling, natural audit trail, resilience to consumer downtime (with a durable broker).</li>
<li>Cons: eventual consistency, harder to trace a single request across services, duplicate/out-of-order delivery must be handled (idempotent consumers), schema evolution needs care (versioned events, a schema registry).</li>
</ul>
<h3>Common interview topics</h3>
<ul>
<li>At-least-once vs exactly-once delivery, and why idempotency matters more than "exactly-once" in practice.</li>
<li>Outbox pattern - writing the DB change and the event atomically to avoid dual-write inconsistency.</li>
<li>Choosing Kafka (log-based, replay, high throughput) vs RabbitMQ (flexible routing, per-message ack) for a given use case.</li>
</ul>`,
});
console.log("  Event-Driven Architecture summary note block added");

// ---- 7. Image attachment: Collections class hierarchy diagram as a note block (top-left, next to the summary note) ----
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
