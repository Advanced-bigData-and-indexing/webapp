import supertest from "supertest";
import createApp from "../../app";
import { client, connectClient } from "../../config/redisClient.config";
import { DataStore } from "../../utils/redis.util";

const app = createApp();
const dataStore = new DataStore();

beforeAll(async () => {
  let isDbConnected = await connectClient();

  while (!isDbConnected) {
    isDbConnected = await connectClient();
  }
});

describe("data", () => {
  beforeEach(async () => {
    await client.flushAll();
  });

  describe("get all data route", () => {
    const data = {
      planCostShares: {
        deductible: 6263517690724352,
        _org: "https://infatuated-prior.org/",
        copay: 3834923125309440,
        objectId: "dafd70bc-a743-41e7-a875-e304c9b4b739",
        objectType: "membercostshare",
      },
      linkedPlanServices: [
        {
          linkedService: {
            _org: "https://clear-cut-business.net",
            objectId: "eb123f58-ca86-487b-8b28-acd76472a613",
            objectType: "membercostshare",
            name: "Courtney Waters",
          },
          planserviceCostShares: {
            deductible: 6989823506120704,
            _org: "https://ordinary-unit.org/",
            copay: 8689826358362112,
            objectId: "b233f464-e878-41c1-9efd-0803764648f9",
            objectType: "voluptatum",
          },
          _org: "https://hospitable-tusk.org",
          objectId: "de1ecb16-cca0-4e64-82f0-93f412f84312",
          objectType: "service",
        },
      ],
      _org: "https://unsung-appeal.org/",
      objectId: "32c333a0-ecd2-47bf-8cfc-41b4094be292",
      objectType: "atque",
      planType: "membercostshare",
      creationDate: "2024-03-15T08:05:39.482Z",
    };

    describe("given the request is authorized", () => {
      const idToken =
        "eyJhbGciOiJSUzI1NiIsImtpZCI6IjA5YmNmODAyOGUwNjUzN2Q0ZDNhZTRkODRmNWM1YmFiY2YyYzBmMGEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxODAxNjE0MTQ1MzYtZXVsYzYyYTc4MGo2bDB0ZnVnNmZkYmV0dnBsajN2Y28uYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIxODAxNjE0MTQ1MzYtZXVsYzYyYTc4MGo2bDB0ZnVnNmZkYmV0dnBsajN2Y28uYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDkzOTA3NzIxNjkyMjE0ODM1OTEiLCJhdF9oYXNoIjoiQU9uTDZWdUU2dUgwX1JiSmFxc1dFQSIsImlhdCI6MTcxMDU2NjA4NCwiZXhwIjoxNzEwNTY5Njg0fQ.QLdU071RGEn83tBOHk8XWZ6chF2fJ1lHYAiC84uv9eCMd7ZNr67iN48MTSgBWCmU1MuDgnaqJt_iAFPjzP3GvUmX1teje2QTynsGb1WAaswoAV3dmMeLKrdZhChjZ0kUv8SSAu-nRm7t8YRLaaOP6xC6nF1CaCO5Ilx-525lOT9oKQDXd_xua6FVp_lIbY1QYE9qEpU7Xn0jKHobOgzwgYpgCUrwWfYqCetW3fb911KGXLMxmt2TDpIZOPpQW9gSHlq5AupJwofrN1CF7uGbHb5fdwMm3uEFK5pe9FEnEHA1x1geqrXShmhKX4yhdzdfxYZ71in7w5UFLgPRHbYFaw";
      describe("given there is no data", () => {
        it("should return a 200 response code", async () => {
          const { body } = await supertest(app)
            .get("/v1/data")
            .set("Authorization", `Basic ${idToken}`)
            .expect(200);

          expect(body.length).toEqual(0);
        });
      });

      describe("given there are entries in the database", () => {
        it("should return a 200 resoponse code and have the same number of entries in the output", async () => {
          // add a payload to redis
          const data = {
            planCostShares: {
              deductible: 6263517690724352,
              _org: "https://infatuated-prior.org/",
              copay: 3834923125309440,
              objectId: "dafd70bc-a743-41e7-a875-e304c9b4b739",
              objectType: "membercostshare",
            },
            linkedPlanServices: [
              {
                linkedService: {
                  _org: "https://clear-cut-business.net",
                  objectId: "eb123f58-ca86-487b-8b28-acd76472a613",
                  objectType: "membercostshare",
                  name: "Courtney Waters",
                },
                planserviceCostShares: {
                  deductible: 6989823506120704,
                  _org: "https://ordinary-unit.org/",
                  copay: 8689826358362112,
                  objectId: "b233f464-e878-41c1-9efd-0803764648f9",
                  objectType: "voluptatum",
                },
                _org: "https://hospitable-tusk.org",
                objectId: "de1ecb16-cca0-4e64-82f0-93f412f84312",
                objectType: "service",
              },
            ],
            _org: "https://unsung-appeal.org/",
            objectId: "32c333a0-ecd2-47bf-8cfc-41b4094be292",
            objectType: "atque",
            planType: "membercostshare",
            creationDate: "2024-03-15T08:05:39.482Z",
          };

          await dataStore.set(data, "32c333a0-ecd2-47bf-8cfc-41b4094be292");
          await dataStore.set(data, "de1ecb16-cca0-4e64-82f0-93f412f84312");

          const { body } = await supertest(app)
            .get("/v1/data")
            .set("Authorization", `Basic ${idToken}`)
            .expect(200);

          expect(body.length).toEqual(2);
        });
      });

      afterEach(async () => {
        await client.flushAll();
      });
    });

    describe("given the request is unauthorized", () => {
      describe("without passing in an auth token", () => {
        it("should return a 401 response", async () => {
          const { body } = await supertest(app)
            .get("/v1/data")
            .set("Authorization", `Basic `)
            .expect(401);
        });
      });

      describe("passing in an invalid token / expired", () => {
        it("should return a 401 response", async () => {
          const { body } = await supertest(app)
            .get("/v1/data")
            .set("Authorization", `Basic invalidToken`)
            .expect(401);
        });
      });
    });
  });

  describe("post data end point", () => {
    beforeEach(async () => {
      await client.flushAll();
    });

    describe("without authentication" , () => {
        describe("without passing in an auth token", () => {
            it.todo("should return a 401 response");
          });
    
          describe("passing in an invalid token / expired", () => {
            it.todo("should return a 401 response");
          });
    });

    describe("given the requests are authenticated", () => {

        describe("given the input data is not of the given schema", () => {
            const sampleData = {
                planCostShares: {
                  deductible: 6263517690724352,
                  _org: "https://infatuated-prior.org/",
                  copay: 3834923125309440,
                  objectId: "dafd70bc-a743-41e7-a875-e304c9b4b739",
                  objectType: "membercostshare",
                },
                linkedPlanServices: [
                  {
                    linkedService: {
                      _org: "https://clear-cut-business.net",
                      objectId: "eb123f58-ca86-487b-8b28-acd76472a613",
                    },
                    planserviceCostShares: {
                      deductible: 6989823506120704,
                      _org: "https://ordinary-unit.org/",
                      copay: 125,
                      objectId: "b233f464-e878-41c1-9efd-0803764648f9",
                      objectType: "voluptatum",
                    },
                    _org: "https://hospitable-tusk.org",
                    objectType: "service",
                  },
                ],
                _org: "https://unsung-appeal.org/",
                objectId: "32c333a0-ecd2-47bf-8cfc-41b4094be292",
                objectType: "atque",
                planType: "membercostshare",
                creationDate: "2024-03-15T08:05:39.482Z",
              };            
          it.todo("should return a 400 response code");
        });
        describe("given the data follows the schema", () => {
    
            describe("given there is no key with the same id already present", () => {
              it.todo("should return a 201 response code");
            });
            describe("given there is an object with the same id already present in the db", () => {
              it.todo("should return a 400 response code");
            });
        })
    })

  });
});

afterAll(async () => {
  await client.flushAll();
  await client.disconnect();
});
