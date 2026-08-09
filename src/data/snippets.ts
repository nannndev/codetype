import type { Snippet } from '../types';

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

export function getRandomSnippet(language?: string): Snippet {
  const pool =
    !language || language === 'All'
      ? SNIPPETS
      : SNIPPETS.filter((s) => s.language === language);
  const idx = Math.floor(Math.random() * pool.length);
  const snippet = pool[idx];
  return { ...snippet, filename: pickFilename(snippet) };
}
