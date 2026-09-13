window.ShelfExamples = [
 {title:'Fetch with a timeout',language:'JavaScript',description:'Abort a request when it takes too long. A small wrapper for everyday API calls.',tags:['fetch','async','utilities'],favorite:true,code:`async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}\`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}`},
 {title:'Debounce an input',language:'JavaScript',description:'Wait for a pause before calling a function.',tags:['events','utilities'],favorite:false,code:`function debounce(fn, delay = 250) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}`},
 {title:'Validate an email address',language:'PHP',description:'Use the built-in validation filter; check delivery separately.',tags:['validation','forms'],favorite:true,code:`<?php
$email = trim($_POST['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo 'Please enter a valid email.';
    exit;
}

// Continue with your application logic.`},
 {title:'Read a file asynchronously',language:'C#',description:'Read UTF-8 text without blocking the calling thread.',tags:['files','async'],favorite:false,code:`using System.IO;
using System.Threading;
using System.Threading.Tasks;

static async Task<string> ReadTextAsync(
    string path,
    CancellationToken cancellationToken = default)
{
    return await File.ReadAllTextAsync(path, cancellationToken);
}`},
 {title:'Responsive card grid',language:'CSS',description:'Cards that reflow to fit the available space.',tags:['layout','responsive'],favorite:true,code:`.card-grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 1.25rem;
}

.card {
  min-width: 0;
  border-radius: 12px;
}`},
 {title:'Count orders by customer',language:'SQL',description:'A simple aggregation with a clear column alias.',tags:['queries','reporting'],favorite:false,code:`SELECT
  customer_id,
  COUNT(*) AS order_count
FROM orders
GROUP BY customer_id
ORDER BY order_count DESC;`}
].map((s,i)=>({...s,id:'example-'+(i+1),createdAt:'2026-09-13T09:00:00.000Z',updatedAt:new Date(Date.UTC(2026,8,13,9,0,6-i)).toISOString()}));
