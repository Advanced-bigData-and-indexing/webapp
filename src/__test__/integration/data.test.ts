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

const data = {
  planCostShares: {
    deductible: 2607915133304832,
    _org: "https://costly-mobster.info",
    copay: 263943920549888,
    objectId: "b2869d15-0d88-4f45-88fe-ad44a40fadcd",
    objectType: "membercostshare",
  },
  linkedPlanServices: [
    {
      linkedService: {
        _org: "https://which-commitment.info",
        objectId: "25890172-6609-4d10-9490-485cc95e3f87",
        objectType: "service",
        name: "Cameron Larson",
      },
      planserviceCostShares: {
        deductible: 5722715228995584,
        _org: "https://fortunate-nightgown.name/",
        copay: 244564602388480,
        objectId: "a5cbb74e-41a1-49b1-aa46-3b9b5ad9cf6f",
        objectType: "officiis",
      },
      _org: "https://parched-suitcase.com",
      objectId: "262afedd-b10b-4a59-9fd9-b46d18c42963",
      objectType: "planservice",
    },
    {
      linkedService: {
        _org: "https://well-informed-standpoint.net",
        objectId: "efcbea2a-5a40-47a9-a925-e0d2327c1128",
        objectType: "service",
        name: "Leslie O'Kon PhD",
      },
      planserviceCostShares: {
        deductible: 5623141017583616,
        _org: "https://international-swell.net",
        copay: 5382212216160256,
        objectId: "b25ec6bf-6763-4d74-a548-7dd3153ed8b4",
        objectType: "curtus",
      },
      _org: "https://woozy-edger.name/",
      objectId: "2d36c0e7-7372-4894-b084-93f33d5cef42",
      objectType: "planservice",
    },
    {
      linkedService: {
        _org: "https://limited-nutrient.biz",
        objectId: "c5777bc5-c176-4ebf-b95b-4c0a14c10e5f",
        objectType: "service",
        name: "Ryan Bradtke",
      },
      planserviceCostShares: {
        deductible: 6823552307167232,
        _org: "https://milky-lecture.name/",
        copay: 1315551915802624,
        objectId: "bbf12f98-1b62-4c97-bb57-63a353fd6178",
        objectType: "socius",
      },
      _org: "https://alive-carol.biz/",
      objectId: "cd590755-2eee-48c9-8cf6-6b84d34ad9a4",
      objectType: "membercostshare",
    },
    {
      linkedService: {
        _org: "https://vivacious-steel.info/",
        objectId: "b8ab498e-d551-4ea9-bb63-9bec6ef6d151",
        objectType: "planservice",
        name: "Lillian Thiel",
      },
      planserviceCostShares: {
        deductible: 1967800321048576,
        _org: "https://equatorial-cream.biz/",
        copay: 2239980271304704,
        objectId: "77c94d23-eed0-4f01-b62e-d846b11dc069",
        objectType: "thalassinus",
      },
      _org: "https://pesky-peer.info/",
      objectId: "aed52740-7717-4892-9665-8a939c7c1fcd",
      objectType: "membercostshare",
    },
    {
      linkedService: {
        _org: "https://buoyant-manager.net/",
        objectId: "a14793da-6b56-4793-8ece-bfab28203fee",
        objectType: "service",
        name: "Sophia Haley",
      },
      planserviceCostShares: {
        deductible: 1662432497893376,
        _org: "https://tricky-loyalty.info/",
        copay: 1511494940360704,
        objectId: "d98c265a-927b-4b59-9c20-97004843095e",
        objectType: "utpote",
      },
      _org: "https://rich-beast.org",
      objectId: "9d13d18b-6367-40ad-af75-6c332d616167",
      objectType: "planservice",
    },
  ],
  _org: "https://loose-writing.info/",
  objectId: "243ee6d4-b1a3-4c3b-baf7-9bba1ad29932",
  objectType: "tersus",
  planType: "service",
  creationDate: "2024-03-15T16:58:27.629Z",
};
const dataETag = "18c3be0d9cc07364bbb0fadab10bcb30";

const invalidData = {
  _org: "https://loose-writing.info/",
  objectId: "243ee6d4-b1a3-4c3b-baf7-9bba1ad29932",
  objectType: "tersus",
  planType: "service",
};

describe("data", () => {
  beforeEach(async () => {
    await client.flushAll();
  });

  const idToken =
    "eyJhbGciOiJSUzI1NiIsImtpZCI6IjA5YmNmODAyOGUwNjUzN2Q0ZDNhZTRkODRmNWM1YmFiY2YyYzBmMGEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxODAxNjE0MTQ1MzYtZXVsYzYyYTc4MGo2bDB0ZnVnNmZkYmV0dnBsajN2Y28uYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIxODAxNjE0MTQ1MzYtZXVsYzYyYTc4MGo2bDB0ZnVnNmZkYmV0dnBsajN2Y28uYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDkzOTA3NzIxNjkyMjE0ODM1OTEiLCJhdF9oYXNoIjoiRzdjcHpwajVpZmQ0NV8yU0pmeDdWQSIsImlhdCI6MTcxMDYwMDU2NCwiZXhwIjoxNzEwNjA0MTY0fQ.b1z5OhrxsK9zdsw9NvNjIWUtvsvixd8Pnvyba3iG1aU45BH5elB6aqETr5UyrJjL9XaFeFV0Bh-HtWQ9vaBbTjH9bB_WUBN5ckVAUj4aw92eUmo52FWxpR9t9hHWsIEpEJksgdwc11VoubZ0lcSL7IvuSJCiAjwpBU05h5CKzg_8y-6Muw6OKW-HS9o0Uy9OBaNrjoPNuQLTG39KJg8djYZFrU_KI7mvvL2xFNJUC-phXM7M96SdTSMx3PkXKUxaUAYrvhwe4v2Sa9JnaKxNECRPgo6-CG3IFBrd4ynYFlunIAWqGryhS_r5H3ur4gpTCwFcBfWr8sTPTU5XxwL6Mg";

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

  describe("post data route", () => {
    beforeEach(async () => {
      await client.flushAll();
    });

    describe("without authentication", () => {
      describe("without passing in an auth token", () => {
        it("should return a 401 response", async () => {
          const { body, headers } = await supertest(app)
            .post(`/v1/data`)
            .send(data)
            .expect(401);
        });
      });

      describe("passing in an invalid token / expired", () => {
        it("should return a 401 response", async () => {
          const { body, headers } = await supertest(app)
            .post(`/v1/data`)
            .set("Authorization", `Basic ${idToken}efg`)
            .send(invalidData)
            .expect(401);
        });
      });
    });

    describe("given the requests are authenticated", () => {
      beforeEach(async () => {
        await client.flushAll();
      });
      describe("given the input data is not of the given schema", () => {
        it("should return a 400 response code", async () => {
          const { body, headers } = await supertest(app)
            .post(`/v1/data`)
            .set("Authorization", `Basic ${idToken}`)
            .send(invalidData)
            .expect(400);
        });
      });
      describe("given the data follows the schema", () => {
        beforeEach(async () => {
          await client.flushAll();
        });
        describe("given there is no key with the same id already present", () => {
          it("should return a 201 response code", async () => {
            const { body, headers } = await supertest(app)
              .post(`/v1/data`)
              .set("Authorization", `Basic ${idToken}`)
              .send(data)
              .expect(201);

            console.log("headers after post request ", headers);
            expect(headers.etag).toBeDefined();
          });
        });
        describe("given there is an object with the same id already present in the db", () => {
          it("should return a 400 response code", async () => {
            await dataStore.set(data, data.objectId);

            const { body, headers } = await supertest(app)
              .post(`/v1/data`)
              .set("Authorization", `Basic ${idToken}`)
              .send(data)
              .expect(400);
          });
        });
      });
    });
  });

  describe("patch data route", () => {
    const patchData = {
      planCostShares: {
        deductible: 2607915133304832,
        _org: "https://costly-mobster.info",
        copay: 263943920549888,
        objectId: "b2869d15-0d88-4f45-88fe-ad44a40fadcd",
        objectType: "membercostshare",
      },
      linkedPlanServices: [
        {
          linkedService: {
            _org: "https://which-commitment.info",
            objectId: "25890172-6609-4d10-9490-485cc95e3f87",
            objectType: "service",
            name: "Cameron Larson",
          },
          planserviceCostShares: {
            deductible: 5722715228995584,
            _org: "https://fortunate-nightgown.name/",
            copay: 244564602388480,
            objectId: "a5cbb74e-41a1-49b1-aa46-3b9b5ad9cf6f",
            objectType: "officiis",
          },
          _org: "https://parched-suitcase.com",
          objectId: "262afedd-b10b-4a59-9fd9-b46d18c42964",
          objectType: "planservice",
        },
      ],
      _org: "https://loose-writing.info/",
      objectId: "243ee6d4-b1a3-4c3b-baf7-9bba1ad29932",
      objectType: "tersus",
      planType: "service",
      creationDate: "2024-03-15T16:58:27.629Z",
    };
    describe("given auth is provided and valid", () => {
      describe("given if-none-match header is not passed in ", () => {
        it("should return a 400 error", async () => {
          const { body } = await supertest(app)
            .patch(`/v1/data/${data.objectId}`)
            .set("Authorization", `Basic ${idToken}`)
            .expect(400);
        });
      });

      describe("given if-none-match header is passed in ", () => {
        beforeEach(async () => {
          await client.flushAll();
        });

        describe("data passed in is not of given schema", () => {
          it("should return a 400 response code", async () => {
            const { body } = await supertest(app)
              .patch(`/v1/data/${data.objectId}`)
              .set("Authorization", `Basic ${idToken}`)
              .set("If-None-Match", dataETag)
              .send(invalidData)
              .expect(400);
          });
        });

        describe("given data passed in is valid", () => {
          describe("given key is already present in the db", () => {
            beforeEach(async () => {
              await client.flushAll();
            });

            describe("given payload is same as exisitng data", () => {
              it("should return 304 response code", async () => {
                await dataStore.set(data, data.objectId);

                const { body } = await supertest(app)
                  .patch(`/v1/data/${data.objectId}`)
                  .set("Authorization", `Basic ${idToken}`)
                  .set("If-None-Match", dataETag)
                  .send(data)
                  .expect(304);
              });
            });

            describe("given payload is different from the exisintg key in db", () => {
              beforeEach(async () => {
                await client.flushAll();
              });

              it("should return a 201 response code", async () => {
                await dataStore.set(data, data.objectId);

                const { body, headers } = await supertest(app)
                  .patch(`/v1/data/${data.objectId}`)
                  .set("Authorization", `Basic ${idToken}`)
                  .set("If-None-Match", "new ETag")
                  .send(patchData)
                  .expect(201);

                  expect(headers.etag).toBeDefined();
                  
              });
              it("should have the updated data in the get call after patching", async () => {
                await dataStore.set(data, data.objectId);

                await supertest(app)
                  .patch(`/v1/data/${data.objectId}`)
                  .set("Authorization", `Basic ${idToken}`)
                  .set("If-None-Match", "new ETag")
                  .send(patchData)
                  .expect(201);

                // get data after patch
                const updatedData = JSON.parse(
                  (await dataStore.getById(data.objectId)).data
                );

                // expect updated data to have this new entry in the linkedPlanServices array
                expect(data.linkedPlanServices.length).not.toEqual(
                  updatedData.linkedPlanServices.length
                );
              });
            });
          });

          describe("given key is not present in the db", () => {
            it("shuold return a 400 response code", async () => {
              await supertest(app)
                .patch(`/v1/data/${data.objectId}`)
                .set("Authorization", `Basic ${idToken}`)
                .set("If-None-Match", "new ETag")
                .send(patchData)
                .expect(400);
            });
          });
        });
      });
    });

    describe("given auth is invalid", () => {
      describe("given no auth is provided", () => {});

      describe("given invalid auth is provided", () => {});
    });
  });

  describe("delete data route", () => {
    describe("auth is provided and valid", () => {
      beforeEach(async () => {
        await client.flushAll();
      });
      describe("If-None-Match header is not provided", () => {
        it("should respond with a 400 response code", async () => {
          // add the data to db
          await dataStore.set(data, data.objectId);
          // perform the delete task and check response
          const { body } = await supertest(app)
            .delete(`/v1/data/${data.objectId}`)
            .set("Authorization", `Basic ${idToken}`)
            .expect(400);

          expect(body).toEqual({});
        });
      });
      describe("given if-none-match header is provided", () => {
        beforeEach(async () => {
          await client.flushAll();
        });
        describe("given this key is not present", () => {
          it("should return a 400 response code", async () => {
            // perform the delete task and check response
            const { body } = await supertest(app)
              .delete(`/v1/data/${data.objectId}`)
              .set("Authorization", `Basic ${idToken}`)
              .set("If-None-Match", dataETag)
              .expect(400);

            expect(body).toEqual({});
          });
        });

        describe("given key is already present", () => {
          it("should return a 204 response code with no payload in response body", async () => {
            // add the data to db
            await dataStore.set(data, data.objectId);

            // perform the delete task and check response
            const { body } = await supertest(app)
              .delete(`/v1/data/${data.objectId}`)
              .set("Authorization", `Basic ${idToken}`)
              .set("If-None-Match", dataETag)
              .expect(204);

            expect(body).toEqual({});
          });

          describe("none match header is the same as in the db", () => {
            it("should return a 428 response code", async () => {
              // add the data to db
              await dataStore.set(data, data.objectId);

              const dataInDb = await dataStore.getById(data.objectId);

              let eTag = "differentETag";
              // perform the delete task and check response
              const { body } = await supertest(app)
                .delete(`/v1/data/${data.objectId}`)
                .set("Authorization", `Basic ${idToken}`)
                .set("If-None-Match", eTag)
                .expect(428);
              expect(body).toEqual({});
            });
          });
        });
      });
    });

    describe("invalid auth", () => {
      beforeEach(async () => {
        await client.flushAll();
      });
      describe("given there is no auth", () => {
        it("should return a 401 response code", async () => {
          // add the data to db
          await dataStore.set(data, data.objectId);

          const { body } = await supertest(app)
            .delete(`/v1/data/${data.objectId}`)
            .set("If-None-Match", "")
            .expect(401);
        });
      });

      describe("invalid auth token is passed", () => {
        it("should return a 401 response code", async () => {
          // add the data to db
          await dataStore.set(data, data.objectId);

          const { body } = await supertest(app)
            .delete(`/v1/data/${data.objectId}`)
            .set("Authorization", `Basic ${idToken}efg`)
            .set("If-None-Match", "")
            .expect(401);
        });
      });
    });
  });
});

afterAll(async () => {
  await client.flushAll();
  await client.disconnect();
});
