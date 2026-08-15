import type { Snippet, SnippetLength } from '../types';
import { SNIPPET_LENGTH_SPEC } from '../utils/ranking.js';

export const SNIPPETS: Snippet[] = [
  // TypeScript
  {
    id: 'ts-1',
    language: 'TypeScript',
    code: `interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error('User not found');
  return res.json();
}`,
  },
  {
    id: 'ts-2',
    language: 'TypeScript',
    code: `type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function safeDivide(a: number, b: number): Result<number> {
  if (b === 0) return { ok: false, error: 'Division by zero' };
  return { ok: true, value: a / b };
}`,
  },
  {
    id: 'ts-3',
    language: 'TypeScript',
    code: `type EventMap = {
  connect: { sessionId: string };
  message: { body: string; at: number };
  close: { code: number };
};

class Emitter<M extends Record<string, unknown>> {
  private handlers = new Map<keyof M, Set<(payload: never) => void>>();

  on<K extends keyof M>(event: K, handler: (payload: M[K]) => void): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as (payload: never) => void);
    this.handlers.set(event, set);
    return () => set.delete(handler as (payload: never) => void);
  }

  emit<K extends keyof M>(event: K, payload: M[K]): void {
    for (const handler of this.handlers.get(event) ?? []) {
      (handler as (value: M[K]) => void)(payload);
    }
  }
}`,
  },
  {
    id: 'ts-4',
    language: 'TypeScript',
    code: `export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  take(key: string, now = Date.now()): boolean {
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((time) => time > cutoff);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }

    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}`,
  },
  // React
  {
    id: 'react-1',
    language: 'React',
    code: `function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}`,
  },
  {
    id: 'react-2',
    language: 'React',
    code: `function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}`,
  },
  {
    id: 'react-3',
    language: 'React',
    code: `const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('theme') as Theme) ?? 'system'
  );

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}`,
  },
  {
    id: 'react-4',
    language: 'React',
    code: `export function VirtualList({ items, rowHeight, height }: VirtualListProps) {
  const [scrollTop, setScrollTop] = useState(0);

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 3);
  const visible = Math.ceil(height / rowHeight) + 6;
  const slice = items.slice(start, start + visible);

  return (
    <div
      style={{ height, overflowY: 'auto' }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * rowHeight, position: 'relative' }}>
        {slice.map((item, index) => (
          <div
            key={item.id}
            style={{ position: 'absolute', top: (start + index) * rowHeight }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}`,
  },
  // Rust
  {
    id: 'rust-1',
    language: 'Rust',
    code: `fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn main() {
    for i in 0..10 {
        println!("fib({}) = {}", i, fibonacci(i));
    }
}`,
  },
  {
    id: 'rust-2',
    language: 'Rust',
    code: `struct Rectangle {
    width: f64,
    height: f64,
}

impl Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
}`,
  },
  {
    id: 'rust-3',
    language: 'Rust',
    code: `use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct Cache {
    entries: Arc<Mutex<HashMap<String, String>>>,
}

impl Cache {
    pub fn new() -> Self {
        Self { entries: Arc::new(Mutex::new(HashMap::new())) }
    }

    pub fn get_or_insert_with<F>(&self, key: &str, build: F) -> String
    where
        F: FnOnce() -> String,
    {
        let mut guard = self.entries.lock().unwrap();
        guard.entry(key.to_owned()).or_insert_with(build).clone()
    }
}`,
  },
  {
    id: 'rust-4',
    language: 'Rust',
    code: `#[derive(Debug)]
enum ParseError {
    Empty,
    Invalid(String),
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ParseError::Empty => write!(f, "input was empty"),
            ParseError::Invalid(token) => write!(f, "invalid token: {token}"),
        }
    }
}

fn parse_ports(input: &str) -> Result<Vec<u16>, ParseError> {
    if input.trim().is_empty() {
        return Err(ParseError::Empty);
    }

    input
        .split(',')
        .map(|part| part.trim().parse().map_err(|_| ParseError::Invalid(part.into())))
        .collect()
}`,
  },
  // Python
  {
    id: 'py-1',
    language: 'Python',
    code: `class BinaryTree:
    def __init__(self, value: int):
        self.value = value
        self.left = None
        self.right = None

    def insert(self, value: int):
        if value < self.value:
            if self.left is None:
                self.left = BinaryTree(value)
            else:
                self.left.insert(value)
        else:
            if self.right is None:
                self.right = BinaryTree(value)
            else:
                self.right.insert(value)`,
  },
  {
    id: 'py-2',
    language: 'Python',
    code: `from collections import defaultdict

def group_by(items: list, key_fn):
    groups = defaultdict(list)
    for item in items:
        groups[key_fn(item)].append(item)
    return dict(groups)`,
  },
  {
    id: 'py-3',
    language: 'Python',
    code: `import asyncio
from dataclasses import dataclass, field


@dataclass(slots=True)
class Job:
    name: str
    retries: int = 3
    tags: set[str] = field(default_factory=set)


async def run_all(jobs: list[Job], concurrency: int = 5) -> list[str]:
    semaphore = asyncio.Semaphore(concurrency)

    async def run(job: Job) -> str:
        async with semaphore:
            for attempt in range(job.retries):
                try:
                    return await execute(job)
                except TimeoutError:
                    await asyncio.sleep(2 ** attempt)
            raise RuntimeError(f"{job.name} failed")

    return await asyncio.gather(*(run(job) for job in jobs))`,
  },
  {
    id: 'py-4',
    language: 'Python',
    code: `from contextlib import contextmanager
from functools import wraps
import time


@contextmanager
def timed(label: str):
    start = time.perf_counter()
    try:
        yield
    finally:
        print(f"{label}: {time.perf_counter() - start:.3f}s")


def retry(times: int = 3, delay: float = 0.5):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(times):
                try:
                    return func(*args, **kwargs)
                except Exception:
                    if attempt == times - 1:
                        raise
                    time.sleep(delay * (attempt + 1))
        return wrapper
    return decorator`,
  },
  // Go
  {
    id: 'go-1',
    language: 'Go',
    code: `func (s *Server) HandleRequest(w http.ResponseWriter, r *http.Request) {
    defer r.Body.Close()

    var payload map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
        http.Error(w, "bad request", http.StatusBadRequest)
        return
    }

    s.mu.Lock()
    defer s.mu.Unlock()
    s.store[r.URL.Path] = payload
}`,
  },
  {
    id: 'go-2',
    language: 'Go',
    code: `func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        results <- processJob(j)
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)

    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }
}`,
  },
  {
    id: 'go-3',
    language: 'Go',
    code: `type Cache struct {
    mu      sync.RWMutex
    entries map[string]entry
    ttl     time.Duration
}

type entry struct {
    value     string
    expiresAt time.Time
}

func (c *Cache) Get(key string) (string, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()

    e, ok := c.entries[key]
    if !ok || time.Now().After(e.expiresAt) {
        return "", false
    }
    return e.value, true
}

func (c *Cache) Set(key, value string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.entries[key] = entry{value: value, expiresAt: time.Now().Add(c.ttl)}
}`,
  },
  {
    id: 'go-4',
    language: 'Go',
    code: `func FetchAll(ctx context.Context, urls []string) ([]byte, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    group, ctx := errgroup.WithContext(ctx)
    results := make([][]byte, len(urls))

    for i, url := range urls {
        i, url := i, url
        group.Go(func() error {
            req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
            if err != nil {
                return fmt.Errorf("build request: %w", err)
            }

            resp, err := http.DefaultClient.Do(req)
            if err != nil {
                return err
            }
            defer resp.Body.Close()

            results[i], err = io.ReadAll(resp.Body)
            return err
        })
    }

    return bytes.Join(results, nil), group.Wait()
}`,
  },
  // JavaScript
  {
    id: 'js-1',
    language: 'JavaScript',
    code: `function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}`,
  },
  {
    id: 'js-2',
    language: 'JavaScript',
    code: `const pipeline = (...fns) => (input) =>
  fns.reduce((acc, fn) => fn(acc), input);

const add = (a) => (b) => a + b;
const multiply = (a) => (b) => a * b;

const transform = pipeline(add(3), multiply(2));
console.log(transform(5)); // 16`,
  },
  {
    id: 'js-3',
    language: 'JavaScript',
    code: `export async function fetchWithRetry(url, options = {}, retries = 3) {
  const { timeout = 8000, ...init } = options;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (response.status >= 500) throw new Error(\`Server error \${response.status}\`);
      return response;
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 200));
    } finally {
      clearTimeout(timer);
    }
  }
}`,
  },
  {
    id: 'js-4',
    language: 'JavaScript',
    code: `class EventBus {
  #listeners = new Map();

  on(event, handler) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.#listeners.get(event)?.delete(handler);
  }

  emit(event, ...args) {
    for (const handler of this.#listeners.get(event) ?? []) {
      try {
        handler(...args);
      } catch (error) {
        console.error(\`handler for "\${event}" threw\`, error);
      }
    }
  }
}`,
  },
  // C
  {
    id: 'c-1',
    language: 'C',
    code: `typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* reverse(Node* head) {
    Node* prev = NULL;
    Node* current = head;
    Node* next = NULL;

    while (current != NULL) {
        next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }
    return prev;
}`,
  },
  {
    id: 'c-2',
    language: 'C',
    code: `#include <stdlib.h>
#include <string.h>

typedef struct {
    char **items;
    size_t length;
    size_t capacity;
} Vector;

int vector_push(Vector *vec, const char *value) {
    if (vec->length == vec->capacity) {
        size_t next = vec->capacity ? vec->capacity * 2 : 8;
        char **grown = realloc(vec->items, next * sizeof(char *));
        if (grown == NULL) return -1;
        vec->items = grown;
        vec->capacity = next;
    }

    vec->items[vec->length] = strdup(value);
    if (vec->items[vec->length] == NULL) return -1;
    vec->length++;
    return 0;
}`,
  },
  {
    id: 'c-3',
    language: 'C',
    code: `static unsigned long hash_key(const char *key) {
    unsigned long hash = 5381;
    int c;

    while ((c = *key++)) {
        hash = ((hash << 5) + hash) + c;
    }
    return hash;
}

Entry *map_get(HashMap *map, const char *key) {
    size_t index = hash_key(key) % map->bucket_count;

    for (Entry *entry = map->buckets[index]; entry; entry = entry->next) {
        if (strcmp(entry->key, key) == 0) {
            return entry;
        }
    }
    return NULL;
}`,
  },
  // Swift
  {
    id: 'swift-1',
    language: 'Swift',
    code: `protocol Loadable {
    associatedtype Data
    func load() async throws -> Data
}

struct RemoteFeed: Loadable {
    let url: URL

    func load() async throws -> [Post] {
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode([Post].self, from: data)
    }
}`,
  },
  {
    id: 'swift-2',
    language: 'Swift',
    code: `actor ImageCache {
    private var storage: [URL: UIImage] = [:]
    private var tasks: [URL: Task<UIImage, Error>] = [:]

    func image(for url: URL) async throws -> UIImage {
        if let cached = storage[url] {
            return cached
        }

        if let running = tasks[url] {
            return try await running.value
        }

        let task = Task<UIImage, Error> {
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let image = UIImage(data: data) else {
                throw CacheError.decodingFailed
            }
            return image
        }

        tasks[url] = task
        let image = try await task.value
        storage[url] = image
        tasks[url] = nil
        return image
    }
}`,
  },
  {
    id: 'swift-3',
    language: 'Swift',
    code: `extension Sequence {
    func grouped<Key: Hashable>(
        by keyForValue: (Element) throws -> Key
    ) rethrows -> [Key: [Element]] {
        var result: [Key: [Element]] = [:]
        for element in self {
            result[try keyForValue(element), default: []].append(element)
        }
        return result
    }

    func sorted<Value: Comparable>(
        by keyPath: KeyPath<Element, Value>
    ) -> [Element] {
        sorted { $0[keyPath: keyPath] < $1[keyPath: keyPath] }
    }
}`,
  },
  // Kotlin
  {
    id: 'kt-1',
    language: 'Kotlin',
    code: `sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
}

fun fetchData(id: String): Result<User> = try {
    val user = api.getUser(id)
    Result.Success(user)
} catch (e: Exception) {
    Result.Error(e.message ?: "Unknown error")
}`,
  },
  {
    id: 'kt-2',
    language: 'Kotlin',
    code: `class UserViewModel(
    private val repository: UserRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun load(userId: String) {
        viewModelScope.launch {
            _state.value = UiState.Loading
            runCatching { repository.findById(userId) }
                .onSuccess { _state.value = UiState.Ready(it) }
                .onFailure { _state.value = UiState.Failed(it.message.orEmpty()) }
        }
    }
}`,
  },
  {
    id: 'kt-3',
    language: 'Kotlin',
    code: `fun <T> Flow<T>.throttleLatest(windowMillis: Long): Flow<T> = channelFlow {
    var last: T? = null
    var job: Job? = null

    collect { value ->
        last = value
        if (job?.isActive != true) {
            job = launch {
                delay(windowMillis)
                last?.let { send(it) }
            }
        }
    }
}

suspend fun retryWithBackoff(times: Int, block: suspend () -> Unit) {
    repeat(times - 1) { attempt ->
        try {
            return block()
        } catch (e: IOException) {
            delay(1000L * (1 shl attempt))
        }
    }
    block()
}`,
  },
  // Zig
  {
    id: 'zig-1',
    language: 'Zig',
    code: `const std = @import("std");

pub fn main() !void {
    const allocator = std.heap.page_allocator;
    var list = std.ArrayList(u8).init(allocator);
    defer list.deinit();

    try list.appendSlice("hello world");
    std.debug.print("{s}\\n", .{list.items});
}`,
  },
  {
    id: 'zig-2',
    language: 'Zig',
    code: `const std = @import("std");
const Allocator = std.mem.Allocator;
const mem = std.mem;
const fmt = std.fmt;

const ParseError = error{ Empty, Overflow };

fn parseAll(allocator: Allocator, input: []const u8) ![]u32 {
    var values = std.ArrayList(u32).init(allocator);
    errdefer values.deinit();

    var it = mem.splitScalar(u8, input, ',');
    while (it.next()) |part| {
        const trimmed = mem.trim(u8, part, " ");
        if (trimmed.len == 0) return ParseError.Empty;
        try values.append(try fmt.parseInt(u32, trimmed, 10));
    }

    return values.toOwnedSlice();
}`,
  },
  {
    id: 'zig-3',
    language: 'Zig',
    code: `pub fn Stack(comptime T: type) type {
    return struct {
        const Self = @This();

        items: std.ArrayList(T),

        pub fn init(allocator: std.mem.Allocator) Self {
            return .{ .items = std.ArrayList(T).init(allocator) };
        }

        pub fn deinit(self: *Self) void {
            self.items.deinit();
        }

        pub fn push(self: *Self, value: T) !void {
            try self.items.append(value);
        }

        pub fn pop(self: *Self) ?T {
            return self.items.popOrNull();
        }
    };
}`,
  },
  // SQL
  {
    id: 'sql-1',
    language: 'SQL',
    code: `WITH ranked AS (
  SELECT
    user_id,
    score,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM submissions
)
SELECT user_id, score
FROM ranked
WHERE rn = 1
ORDER BY score DESC
LIMIT 10;`,
  },
  {
    id: 'sql-2',
    language: 'SQL',
    code: `CREATE TABLE orders (
  id           BIGSERIAL PRIMARY KEY,
  customer_id  BIGINT NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  total_cents  INTEGER NOT NULL CHECK (total_cents >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX orders_customer_created_idx
  ON orders (customer_id, created_at DESC)
  WHERE status <> 'cancelled';`,
  },
  {
    id: 'sql-3',
    language: 'SQL',
    code: `SELECT
  c.id,
  c.name,
  COUNT(o.id) AS order_count,
  COALESCE(SUM(o.total_cents), 0) / 100.0 AS lifetime_value
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.id
  AND o.created_at >= now() - INTERVAL '12 months'
GROUP BY c.id, c.name
HAVING COUNT(o.id) > 0
ORDER BY lifetime_value DESC;`,
  },
  // Docker
  {
    id: 'docker-1',
    language: 'Dockerfile',
    code: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]`,
  },
  {
    id: 'docker-2',
    language: 'Dockerfile',
    code: `FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/server ./cmd/server

FROM gcr.io/distroless/static:nonroot
COPY --from=build /out/server /server
USER nonroot:nonroot
ENTRYPOINT ["/server"]`,
  },
  {
    id: 'docker-3',
    language: 'Dockerfile',
    code: `FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

RUN apt-get update \\
    && apt-get install -y --no-install-recommends build-essential \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
HEALTHCHECK CMD curl -f http://localhost:8000/health || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]`,
  },
  // YAML
  {
    id: 'yaml-1',
    language: 'YAML',
    code: `services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
    depends_on:
      - db

  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:`,
  },
  {
    id: 'yaml-2',
    language: 'YAML',
    code: `name: ci

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test -- --run`,
  },
  {
    id: 'yaml-3',
    language: 'YAML',
    code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: registry.example.com/api:1.4.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi`,
  },
  // Bash
  {
    id: 'bash-1',
    language: 'Bash',
    code: `#!/bin/bash
set -euo pipefail

for dir in packages/*/; do
  echo "Building $dir"
  (cd "$dir" && npm run build) || exit 1
done

echo "All packages built successfully"`,
  },
  {
    id: 'bash-2',
    language: 'Bash',
    code: `#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: $0 -e <env> [-d]" >&2
  exit 1
}

dry_run=0
while getopts ":e:d" opt; do
  case "$opt" in
    e) target="$OPTARG" ;;
    d) dry_run=1 ;;
    *) usage ;;
  esac
done

: "\${target:?missing -e}"

if [[ "$dry_run" -eq 1 ]]; then
  echo "would deploy to $target"
else
  ./scripts/deploy.sh "$target"
fi`,
  },
  {
    id: 'bash-3',
    language: 'Bash',
    code: `#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\\n\\t'

backup_dir="/var/backups/$(date +%Y-%m-%d)"
mkdir -p "$backup_dir"

trap 'rm -rf "$tmp"' EXIT
tmp="$(mktemp -d)"

pg_dump --no-owner "$DATABASE_URL" > "$tmp/dump.sql"
gzip -9 "$tmp/dump.sql"
mv "$tmp/dump.sql.gz" "$backup_dir/"

find /var/backups -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +`,
  },
  // CSS
  {
    id: 'css-1',
    language: 'CSS',
    code: `.card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
}`,
  },
  {
    id: 'css-2',
    language: 'CSS',
    code: `:root {
  --surface: hsl(220 14% 96%);
  --text: hsl(220 30% 12%);
  --accent: hsl(258 90% 62%);
  --radius: 0.75rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --surface: hsl(222 24% 10%);
    --text: hsl(210 20% 92%);
  }
}

.layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: clamp(0.75rem, 2vw, 1.5rem);
  background: var(--surface);
  color: var(--text);
}`,
  },
  {
    id: 'css-3',
    language: 'CSS',
    code: `@keyframes shimmer {
  from {
    background-position: -200% 0;
  }
  to {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}`,
  },
  // GraphQL
  {
    id: 'gql-1',
    language: 'GraphQL',
    code: `query GetUserPosts($userId: ID!, $limit: Int = 10) {
  user(id: $userId) {
    name
    avatar
    posts(first: $limit) {
      edges {
        node {
          id
          title
          createdAt
        }
      }
    }
  }
}`,
  },
  {
    id: 'gql-2',
    language: 'GraphQL',
    code: `type Order implements Node {
  id: ID!
  status: OrderStatus!
  total: Money!
  items: [OrderItem!]!
  placedAt: DateTime!
}

enum OrderStatus {
  PENDING
  SHIPPED
  DELIVERED
  CANCELLED
}

input CreateOrderInput {
  customerId: ID!
  items: [OrderItemInput!]!
}

type Mutation {
  createOrder(input: CreateOrderInput!): Order!
  cancelOrder(id: ID!, reason: String): Order!
}`,
  },
  {
    id: 'gql-3',
    language: 'GraphQL',
    code: `fragment OrderSummary on Order {
  id
  status
  total {
    amount
    currency
  }
}

query Dashboard($after: String) {
  viewer {
    name
    orders(first: 20, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ...OrderSummary
      }
    }
  }
}`,
  },
  // Terraform
  {
    id: 'tf-1',
    language: 'Terraform',
    code: `resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name        = "web-server"
    Environment = "production"
  }
}

output "instance_ip" {
  value = aws_instance.web.public_ip
}`,
  },
  {
    id: 'tf-2',
    language: 'Terraform',
    code: `variable "environment" {
  type        = string
  description = "Deployment environment"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

resource "aws_s3_bucket" "assets" {
  bucket = "acme-assets-\${var.environment}"
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = var.environment == "production" ? "Enabled" : "Suspended"
  }
}`,
  },
  {
    id: 'tf-3',
    language: 'Terraform',
    code: `terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  common_tags = {
    Project   = "codetype"
    ManagedBy = "terraform"
  }
}

module "network" {
  source = "./modules/network"

  cidr_block         = "10.0.0.0/16"
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 3)
  tags               = local.common_tags
}`,
  },
  // Elixir
  {
    id: 'ex-1',
    language: 'Elixir',
    code: `defmodule Calculator do
  def evaluate({:add, a, b}), do: a + b
  def evaluate({:sub, a, b}), do: a - b
  def evaluate({:mul, a, b}), do: a * b
  def evaluate({:div, _, 0}), do: {:error, :division_by_zero}
  def evaluate({:div, a, b}), do: a / b
end`,
  },
  {
    id: 'ex-2',
    language: 'Elixir',
    code: `defmodule Store.Cart do
  use GenServer

  def start_link(opts) do
    GenServer.start_link(__MODULE__, %{}, name: Keyword.get(opts, :name, __MODULE__))
  end

  def add(server, item), do: GenServer.cast(server, {:add, item})
  def total(server), do: GenServer.call(server, :total)

  @impl true
  def init(state), do: {:ok, state}

  @impl true
  def handle_cast({:add, item}, state) do
    {:noreply, Map.update(state, item.sku, item.price, &(&1 + item.price))}
  end

  @impl true
  def handle_call(:total, _from, state) do
    {:reply, state |> Map.values() |> Enum.sum(), state}
  end
end`,
  },
  {
    id: 'ex-3',
    language: 'Elixir',
    code: `defmodule Accounts do
  def register(attrs) do
    with {:ok, params} <- validate(attrs),
         {:ok, user} <- Repo.insert(User.changeset(%User{}, params)),
         :ok <- Mailer.deliver_welcome(user) do
      {:ok, user}
    else
      {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
      {:error, reason} -> {:error, reason}
    end
  end

  defp validate(%{"email" => email} = attrs) when is_binary(email) do
    {:ok, Map.take(attrs, ~w(email name password))}
  end

  defp validate(_attrs), do: {:error, :missing_email}
end`,
  },
  // Lua
  {
    id: 'lua-1',
    language: 'Lua',
    code: `local M = {}

function M.split(str, sep)
  local result = {}
  for match in (str .. sep):gmatch("(.-)" .. sep) do
    table.insert(result, match)
  end
  return result
end

return M`,
  },
  {
    id: 'lua-2',
    language: 'Lua',
    code: `local Queue = {}
Queue.__index = Queue

function Queue.new()
  return setmetatable({ first = 1, last = 0, items = {} }, Queue)
end

function Queue:push(value)
  self.last = self.last + 1
  self.items[self.last] = value
end

function Queue:pop()
  if self.first > self.last then
    return nil
  end

  local value = self.items[self.first]
  self.items[self.first] = nil
  self.first = self.first + 1
  return value
end

return Queue`,
  },
  {
    id: 'lua-3',
    language: 'Lua',
    code: `local uv = vim.loop
local M = { _cache = {} }

function M.setup(opts)
  opts = vim.tbl_deep_extend("force", { timeout = 500, enabled = true }, opts or {})

  if not opts.enabled then
    return
  end

  vim.api.nvim_create_autocmd("BufWritePre", {
    group = vim.api.nvim_create_augroup("Format", { clear = true }),
    callback = function(args)
      vim.lsp.buf.format({ bufnr = args.buf, timeout_ms = opts.timeout })
    end,
  })
end

function M.elapsed(label)
  local start = uv.hrtime()
  return function()
    M._cache[label] = (uv.hrtime() - start) / 1e6
  end
end

return setmetatable(M, { __index = M._cache })`,
  },
  // PHP
  {
    id: 'php-1',
    language: 'PHP',
    code: `final class UserService
{
    public function __construct(
        private UserRepository $users,
    ) {}

    public function findOrFail(int $id): User
    {
        return $this->users->find($id)
            ?? throw new RuntimeException('User not found');
    }
}`,
  },
  {
    id: 'php-2',
    language: 'PHP',
    code: `final class Collection implements IteratorAggregate
{
    public function __construct(private array $items = []) {}

    public function filter(callable $callback): static
    {
        return new static(array_values(array_filter($this->items, $callback)));
    }

    public function map(callable $callback): static
    {
        return new static(array_map($callback, $this->items));
    }

    public function reduce(callable $callback, mixed $initial = null): mixed
    {
        return array_reduce($this->items, $callback, $initial);
    }

    public function getIterator(): ArrayIterator
    {
        return new ArrayIterator($this->items);
    }
}`,
  },
  {
    id: 'php-3',
    language: 'PHP',
    code: `#[Route('/orders', methods: ['POST'])]
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'customer_id' => ['required', 'integer', 'exists:customers,id'],
        'items' => ['required', 'array', 'min:1'],
        'items.*.sku' => ['required', 'string'],
    ]);

    $order = DB::transaction(function () use ($validated) {
        $order = Order::create(['customer_id' => $validated['customer_id']]);
        $order->items()->createMany($validated['items']);
        return $order->fresh('items');
    });

    return response()->json($order, Response::HTTP_CREATED);
}`,
  },
  {
    id: 'php-4',
    language: 'PHP',
    code: `trait HasTimestamps
{
    protected bool $timestamps = true;

    public function touch(?string $attribute = null): bool
    {
        if (! $this->timestamps) {
            return false;
        }

        $time = $this->freshTimestamp();

        if ($attribute !== null) {
            $this->setAttribute($attribute, $time);
        }

        $this->setAttribute(static::UPDATED_AT, $time);

        return $this->save();
    }
}`,
  },
  // Dart
  {
    id: 'dart-1',
    language: 'Dart',
    code: `Future<List<User>> fetchUsers(ApiClient client) async {
  final response = await client.get('/users');
  final items = response.data as List<dynamic>;

  return items
      .map((item) => User.fromJson(item as Map<String, dynamic>))
      .toList();
}`,
  },
  {
    id: 'dart-2',
    language: 'Dart',
    code: `sealed class Result<T> {
  const Result();
}

class Success<T> extends Result<T> {
  const Success(this.value);
  final T value;
}

class Failure<T> extends Result<T> {
  const Failure(this.error);
  final Object error;
}

extension ResultX<T> on Result<T> {
  R fold<R>({
    required R Function(T value) onSuccess,
    required R Function(Object error) onFailure,
  }) =>
      switch (this) {
        Success(:final value) => onSuccess(value),
        Failure(:final error) => onFailure(error),
      };
}`,
  },
  {
    id: 'dart-3',
    language: 'Dart',
    code: `class Debouncer {
  Debouncer({required this.duration});

  final Duration duration;
  Timer? _timer;

  void run(void Function() action) {
    _timer?.cancel();
    _timer = Timer(duration, action);
  }

  void dispose() {
    _timer?.cancel();
    _timer = null;
  }
}

Stream<int> countdown(int from) async* {
  for (var i = from; i >= 0; i--) {
    yield i;
    await Future<void>.delayed(const Duration(seconds: 1));
  }
}`,
  },
  // Flutter (Dart framework code)
  {
    id: 'flutter-1',
    language: 'Flutter',
    code: `class CounterCard extends StatelessWidget {
  const CounterCard({super.key, required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text('Count: $count'),
      ),
    );
  }
}`,
  },
  {
    id: 'flutter-2',
    language: 'Flutter',
    code: `class UserList extends StatelessWidget {
  const UserList({super.key, required this.future});

  final Future<List<User>> future;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<User>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(child: Text('Failed: \${snapshot.error}'));
        }

        final users = snapshot.data ?? const [];
        return ListView.separated(
          itemCount: users.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, index) => ListTile(title: Text(users[index].name)),
        );
      },
    );
  }
}`,
  },
  {
    id: 'flutter-3',
    language: 'Flutter',
    code: `class FadeIn extends StatefulWidget {
  const FadeIn({super.key, required this.child});

  final Widget child;

  @override
  State<FadeIn> createState() => _FadeInState();
}

class _FadeInState extends State<FadeIn> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 300),
  )..forward();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: CurvedAnimation(parent: _controller, curve: Curves.easeOut),
      child: widget.child,
    );
  }
}`,
  },
];

function pickFilename(snippet: Snippet): string {
  const ext = LANGUAGE_EXTS[snippet.language] ?? 'txt';
  return `${snippet.id}.${ext}`;
}

const LANGUAGE_EXTS: Record<string, string> = {
  TypeScript: 'ts',
  React: 'tsx',
  Rust: 'rs',
  Python: 'py',
  Go: 'go',
  JavaScript: 'js',
  C: 'c',
  Swift: 'swift',
  Kotlin: 'kt',
  Zig: 'zig',
  SQL: 'sql',
  Dockerfile: 'dockerfile',
  YAML: 'yml',
  Bash: 'sh',
  CSS: 'css',
  GraphQL: 'graphql',
  Terraform: 'tf',
  Elixir: 'ex',
  Lua: 'lua',
  PHP: 'php',
  Dart: 'dart',
  Flutter: 'dart',
};

export function getLanguages(): string[] {
  const langs = new Set(SNIPPETS.map((s) => s.language));
  return ['All', ...Array.from(langs).sort()];
}

export function getRandomSnippet(language?: string, length?: SnippetLength): Snippet {
  const pool =
    !language || language === 'All'
      ? SNIPPETS
      : SNIPPETS.filter((s) => s.language === language);
  const idx = Math.floor(Math.random() * pool.length);
  const snippet = pool[idx];
  if (!length) return { ...snippet, filename: pickFilename(snippet) };

  // Rotate so the requested length is built from a random starting point in the pool.
  const rotated = [...pool.slice(idx), ...pool.slice(0, idx)];
  return buildSnippetOfLength(rotated, length);
}

/** Cut at a line boundary when one is available, so a snippet never ends mid-statement. */
function trimToLimit(code: string, limit: number): string {
  if (code.length <= limit) return code;
  const cutAt = code.lastIndexOf('\n', limit);
  const sliced = cutAt > limit / 3 ? code.slice(0, cutAt) : code.slice(0, limit);
  return sliced.trimEnd();
}

/**
 * The static pool holds only short blocks, so a "medium" or "long" run is
 * assembled by joining same-language blocks until it fits SNIPPET_LENGTH_SPEC.
 * Mirrors `prepareSnippet` in useSnippets so a duel and a solo run of the same
 * length are comparable. Never mixes languages — a run is one language.
 */
function buildSnippetOfLength(pool: Snippet[], length: SnippetLength): Snippet {
  const spec = SNIPPET_LENGTH_SPEC[length];
  const first = pool[0];
  const candidates = pool.filter((s) => s.language === first.language);

  const parts: string[] = [];
  let totalLength = 0;

  for (const candidate of candidates) {
    if (parts.length >= spec.targetBlocks && totalLength >= spec.minChars) break;
    const separator = parts.length > 0 ? 2 : 0;
    const remaining = spec.maxChars - totalLength - separator;
    if (remaining < 60) break;
    const code = trimToLimit(candidate.code.trim(), remaining);
    if (!code) continue;
    parts.push(code);
    totalLength += code.length + separator;
  }

  if (parts.length === 0) {
    return { ...first, code: trimToLimit(first.code.trim(), spec.maxChars), filename: pickFilename(first) };
  }

  const singleBlock = parts.length === 1;
  return {
    ...first,
    id: singleBlock ? first.id : `${first.id}-${length}-${parts.length}`,
    code: parts.join('\n\n'),
    filename: pickFilename(first),
    // Only a single, untrimmed block can honestly claim one file as its origin.
    source: singleBlock && parts[0] === first.code.trim() ? first.source : undefined,
  };
}

/**
 * The longest run the static pool can build for a language. The duel lobby uses
 * this to avoid offering a length it cannot actually deliver.
 */
export function maxSnippetCharsForLanguage(language?: string): number {
  const pool =
    !language || language === 'All'
      ? SNIPPETS
      : SNIPPETS.filter((s) => s.language === language);
  if (pool.length === 0) return 0;

  const totals = new Map<string, number>();
  for (const snippet of pool) {
    const separator = totals.has(snippet.language) ? 2 : 0;
    totals.set(snippet.language, (totals.get(snippet.language) ?? 0) + snippet.code.trim().length + separator);
  }
  // 'All' picks one language at random, so the guarantee is the weakest language.
  return Math.min(...totals.values());
}
