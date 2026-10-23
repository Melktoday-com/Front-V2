import autocannon from 'autocannon';

const PORT = process.env.PORT || 3005;
const BASE_URL = `http://localhost:${PORT}`;

async function runAutocannon(title, opts) {
  console.log(`\n--- Running: ${title} (Concurrency: ${opts.connections}, Duration: ${opts.duration || 5}s) ---`);
  
  let counter = 0;
  const result = await autocannon({
    ...opts,
    url: opts.url,
    requests: [
      {
        method: 'GET',
        setupRequest: (req) => {
          counter = (counter + 1) % 500;
          req.headers = {
            ...req.headers,
            'x-forwarded-for': `10.0.${Math.floor(counter / 250)}.${(counter % 250) + 1}`,
          };
          return req;
        },
      },
    ],
  });

  const p50 = result.latency.p50;
  const p95 = result.latency.p95;
  const p99 = result.latency.p99;
  const rps = result.requests.average;
  const errors = result.errors;
  const non2xx = result.non2xx;

  console.log(`Throughput: ${rps.toFixed(1)} req/sec`);
  console.log(`Latency p50: ${p50}ms, p95: ${p95}ms, p99: ${p99}ms`);
  console.log(`Errors: ${errors}, Non-2xx: ${non2xx}`);

  return { title, rps: Number(rps.toFixed(1)), p50, p95, p99, errors, non2xx };
}

async function main() {
  console.log(`Benchmarking Tile Endpoint at ${BASE_URL}...`);

  // 1. Cold MISS (fetch uncached tile)
  const coldTile = `${BASE_URL}/api/tiles/12/2634/1638.png`;
  const t0 = performance.now();
  const coldRes = await fetch(coldTile);
  const coldLat = (performance.now() - t0).toFixed(1);
  const coldCacheHeader = coldRes.headers.get('x-tile-cache');
  console.log(`Cold response: status=${coldRes.status}, cache=${coldCacheHeader}, latency=${coldLat}ms`);

  // 2. Hot HIT-MEM (fetch same tile again)
  const t1 = performance.now();
  const hotRes = await fetch(coldTile);
  const hotLat = (performance.now() - t1).toFixed(1);
  const hotCacheHeader = hotRes.headers.get('x-tile-cache');
  console.log(`Hot memory response: status=${hotRes.status}, cache=${hotCacheHeader}, latency=${hotLat}ms`);

  // 3. Autocannon load tests at concurrency 10, 50, 200
  const results = [];
  results.push(await runAutocannon('HOT MEMORY (c=10)', {
    url: coldTile,
    connections: 10,
    duration: 5,
  }));

  results.push(await runAutocannon('HOT MEMORY (c=50)', {
    url: coldTile,
    connections: 50,
    duration: 5,
  }));

  results.push(await runAutocannon('HOT MEMORY (c=200)', {
    url: coldTile,
    connections: 200,
    duration: 5,
  }));

  console.log('\n=== Summary of Endpoint Benchmarks ===');
  console.table(results);
}

main().catch(console.error);
