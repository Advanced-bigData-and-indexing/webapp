# How do I store data in Redis for my use case ?

To store complex JSON objects in Redis while maintaining parent-child relationships, you can use hashes for objects and sets or lists for arrays. Redis doesn't directly support nested objects, so you need to flatten the structure and establish relationships using keys.

Refer [Sample JSON](../../schemas/Data.Schema.json) for seeing how the object looks. 

Here's a step-by-step guide on how to achieve this, referencing the provided JSON object and the Redis keys from your image:

1. **Identify Top-Level Object**:
   Your JSON has a top-level object that represents a "plan" with an `objectId`.

2. **Use Hashes for Objects**:
   Store each JSON object in a Redis hash, with the object's `objectId` as part of the key for easy retrieval and association. For instance:

   ```
   HSET plan:12xvxc345ssdsds-508 field1 value1 field2 value2 ...
   ```

   Here, `field1`, `field2`, etc., represent the keys within the JSON object, and `value1`, `value2`, etc., are their corresponding values.

3. **Linking Child Objects**:
   For each linked object, store it in a separate hash using its `objectId`:

   ```
   HSET planservice:27283xvx9asdff-504 field1 value1 field2 value2 ...
   ```

4. **Storing Arrays**:
   Arrays, such as `linkedPlanServices`, can be represented as Redis lists or sets. Since the order is not specified as important, you could use a set for this example. Add the `objectId` of each "planservice" to the set:

   ```
   SADD plan:12xvxc345ssdsds-508:linkedPlanServices 27283xvx9asdff-504 27283xvx9sdf-507
   ```

5. **Storing Nested Objects within Arrays**:
   Each `linkedService` and `planserviceCostShares` is stored as a separate hash, similar to the top-level plan object:

   ```
   HSET service:1234520xvc30asdf-502 field1 value1 ...
   HSET membercostshare:1234512xvc1314asdfs-503 field1 value1 ...
   ```

6. **Referencing Parent in Child Objects**:
   In each child object, include a reference back to the parent object. You can store this in the hash or as a separate key-value pair:

   ```
   HSET planservice:27283xvx9asdff-504 parent 12xvxc345ssdsds-508
   ```

7. **Node.js Integration**:
   In your Node.js application, you will parse the JSON object and generate these Redis commands to store the data appropriately. Here’s a very simplified pseudocode snippet on how to do this:

    ```javascript
    const redis = require('redis');
    const client = redis.createClient();

    // Function to store a plan object
    function storePlan(planObject) {
    const planId = `plan:${planObject.objectId}`;
    client.hset(planId, 'planType', planObject.planType, 'creationDate', planObject.creationDate);
    
    // Store the main plan cost shares
    const planCostSharesId = `membercostshare:${planObject.planCostShares.objectId}`;
    client.hset(planCostSharesId, ...Object.entries(planObject.planCostShares));
    
    // Store linked plan services
    planObject.linkedPlanServices.forEach(service => {
        const planserviceId = `planservice:${service.objectId}`;
        client.sadd(`${planId}:linkedPlanServices`, service.objectId);
        client.hset(planserviceId, ...Object.entries(service));

        // Store nested objects like linkedService and planserviceCostShares
        const linkedServiceId = `service:${service.linkedService.objectId}`;
        client.hset(linkedServiceId, ...Object.entries(service.linkedService));

        const serviceCostSharesId = `membercostshare:${service.planserviceCostShares.objectId}`;
        client.hset(serviceCostSharesId, ...Object.entries(service.planserviceCostShares));
    });
    }

    // Usage
    storePlan(yourJsonPlanObject);
    ```

    **Note**: The `...Object.entries(object)` part is pseudocode for the purpose of illustration. You would need to properly iterate over each property of your objects and use `hset` correctly for each field-value pair.

By following these steps, you should be able to take the JSON object provided to your Node.js API, parse it, and store it in Redis in a structured way that preserves the relationships between objects.
