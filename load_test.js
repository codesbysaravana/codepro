const API_URL = 'http://localhost:2358/submissions'; // Adjust port if your Judge0 is running on a different port
const CONCURRENT_REQUESTS = 10; // Number of concurrent requests to send at a time
const TOTAL_REQUESTS = 50; 
const payload = {
  source_code: "cHJpbnQoIkhlbGxvIGZyb20gSnVkZ2UwIExvYWQgVGVzdCEiKQ==",
  language_id: 71, // Python 3
};

async function sendRequest(id) {
  const startTime = Date.now();
  try {
    // Using wait=true so Judge0 returns the execution result directly in the response
    const response = await fetch(`${API_URL}?base64_encoded=true&wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    
    if (response.ok && data.status && data.status.id === 3) {
      console.log(`[Request ${id}] Success in ${duration}ms`);
      return { success: true, duration };
    } else {
      console.log(`[Request ${id}] Failed in ${duration}ms: ${JSON.stringify(data.status || data)}`);
      return { success: false, duration };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Request ${id}] Error in ${duration}ms:`, error.message);
    return { success: false, duration };
  }
}

async function runLoadTest() {
  console.log(`Starting load test...`);
  console.log(`Target: ${API_URL}`);
  console.log(`Concurrency: ${CONCURRENT_REQUESTS}`);
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`--------------------------------------------------`);

  const startTime = Date.now();
  let completedRequests = 0;
  let successfulRequests = 0;
  let totalDuration = 0;

  // Process requests in batches of CONCURRENT_REQUESTS
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    const batchSize = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - i);
    const promises = [];
    
    for (let j = 0; j < batchSize; j++) {
      promises.push(sendRequest(i + j + 1));
    }
    
    const results = await Promise.all(promises);
    
    for (const result of results) {
      completedRequests++;
      totalDuration += result.duration;
      if (result.success) {
        successfulRequests++;
      }
    }
  }

  const testDuration = Date.now() - startTime;
  
  console.log(`--------------------------------------------------`);
  console.log(`Load test completed!`);
  console.log(`Total Time: ${testDuration}ms`);
  console.log(`Total Requests: ${completedRequests}`);
  console.log(`Successful Requests: ${successfulRequests}`);
  console.log(`Failed Requests: ${completedRequests - successfulRequests}`);
  console.log(`Average Request Time: ${Math.round(totalDuration / completedRequests)}ms`);
  console.log(`Requests per second (Throughput): ${(completedRequests / (testDuration / 1000)).toFixed(2)} req/sec`);
}

runLoadTest();
