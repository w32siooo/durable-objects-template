// Worker

export default {
  async fetch(request, env) {
    return await handleRequest(request, env);
  },
};

async function handleRequest(request, env) {
  let id = env.COUNTER.idFromName("A");
  let obj = env.COUNTER.get(id);
  let resp = await obj.fetch(request.url);
  let count = await resp.text();

  return new Response("Durable Object 'A' count: " + count);
}

// Durable Object

export class Counter {
  constructor(state, env) {
    this.state = state;
  }

  async initialize() {
    // First we get the stored value from state storage. It goes into the stored variable.
    let stored = await this.state.storage.get("value");
    //If there is something in stored, it goes into this.value. Otherwise we put in 0.
    this.value = stored || 0;
  }

  // Handle HTTP requests from clients.
  async fetch(request) {
    // Make sure we're fully initialized from storage.
    if (!this.initializePromise) {
      this.initializePromise = this.initialize().catch((err) => {
        // If anything throws during initialization then we need to be
        // sure sure that a future request will retry initialize().
        // Note that the concurrency involved in resetting this shared
        // promise on an error can be tricky to get right -- we don't
        // recommend customizing it.
        this.initializePromise = undefined;
        throw err;
      });
    }
    await this.initializePromise;

    // Apply requested action.
    let url = new URL(request.url);
    //Here we put the this.value (from storage) into currentValue

    let currentValue = this.value;
    if (url.pathname == "/") {
    } else if (url.pathname == "/favicon.ico") {
    } else {
      currentValue = currentValue + " " + url.pathname;
      this.value = currentValue;
      await this.state.storage.put("value", this.value);
    }

    // Return `currentValue`. Note that `this.value` may have been
    // incremented or decremented by a concurrent request when we
    // yielded the event loop to `await` the `storage.put` above!
    // That's why we stored the counter value created by this
    // request in `currentValue` before we used `await`.
    return new Response(currentValue);
  }
}
