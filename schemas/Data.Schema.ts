import { z, ZodSchema } from "zod"

export const DataSchemaIdField = "objectId";

export const DataSchema = z.object({
  planCostShares: z.object({
    deductible: z.number(),
    _org: z.string(),
    copay: z.number(),
    objectId: z.string(),
    objectType: z.string()
  }),
  linkedPlanServices: z.array(
    z.object({
      linkedService: z.object({
        _org: z.string(),
        objectId: z.string(),
        objectType: z.string(),
        name: z.string()
      }),
      planserviceCostShares: z.object({
        deductible: z.number(),
        _org: z.string(),
        copay: z.number(),
        objectId: z.string(),
        objectType: z.string()
      }),
      _org: z.string(),
      objectId: z.string(),
      objectType: z.string()
    })
  ),
  _org: z.string(),
  objectId: z.string(),
  objectType: z.string(),
  planType: z.string(),
  creationDate: z.string()
});
