import { z } from "zod"

export const DataSchemaIdField = "objectId";

const enumOptions  = ["membercostshare", "service", "planservice"];

export const DataSchema = z.object({
  planCostShares: z.object({
    deductible: z.number(),
    _org: z.string().url(),
    copay: z.number(),
    objectId: z.string().uuid(),
    objectType: z.enum(["membercostshare", ...enumOptions])
  }),
  linkedPlanServices: z.array(
    z.object({
      linkedService: z.object({
        _org: z.string().url(),
        objectId: z.string().uuid(),
        objectType: z.enum(["service", ...enumOptions]),
        name: z.string()
      }),
      planserviceCostShares: z.object({
        deductible: z.number(),
        _org: z.string().url(),
        copay: z.number(),
        objectId: z.string().uuid(),
        objectType: z.string()
      }),
      _org: z.string().url(),
      objectId: z.string().uuid(),
      objectType: z.enum(["planservice", ...enumOptions])
    })
  ),
  _org: z.string().url(),
  objectId: z.string().uuid(),
  objectType: z.string(),
  planType: z.enum(["planservice", ...enumOptions]),
  creationDate: z.string().datetime()
});
