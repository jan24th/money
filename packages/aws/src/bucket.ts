import type { S3Handler } from "aws-lambda";
import { bucketMiddleware } from "../lambda/S3.ts";
import { z } from "zod";
import converter from "json-2-csv";
import { BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import dayjs from "dayjs";
import { CategoryType, zid } from "types";

const dbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
export const _import: S3Handler = bucketMiddleware(async ({ readFile, parseEvent }) => {
  const { key } = parseEvent();
  const matchers = key.match(/^(.*)\.import\.csv$/);
  if (matchers) {
    const db = matchers[1] as "account" | "category" | "bill";
    const csv = await readFile();
    switch (db) {
      case "bill": {
        const schema = z.object({
          id: z.string().uuid(),
          desc: z.string().optional().default(""),
          value: z.number(),
          account: zid(),
          category: zid(),
          date: z.number().refine((v) => dayjs(v).isValid()),
          active: z.number().refine((v) => [0, 1].includes(v)),
        });
        const items = converter
          .csv2json(csv.split("\n").filter(Boolean).join("\n"))
          .map((i) => schema.safeParse(i))
          .filter((i) => i.success)
          .map((i) => i.data);
        while (items.length) {
          const Items = items.splice(0, 25);
          await dbClient.send(
            new BatchWriteCommand({
              RequestItems: {
                [Resource.billDB.name]: Items.map((Item) => ({
                  PutRequest: { Item },
                })),
              },
            }),
          );
        }
        return;
      }
      case "account": {
        const schema = z.object({
          id: zid(),
          name: z.string().min(1),
          value: z.number(),
        });
        const items = converter
          .csv2json(csv.split("\n").filter(Boolean).join("\n"))
          .map((i) => schema.safeParse(i))
          .filter((i) => i.success)
          .map((i) => i.data);
        while (items.length) {
          const Items = items.splice(0, 25);
          await dbClient.send(
            new BatchWriteCommand({
              RequestItems: {
                [Resource.accountDB.name]: Items.map((Item) => ({
                  PutRequest: { Item },
                })),
              },
            }),
          );
        }
        return;
      }
      case "category": {
        const schema = z.object({
          id: zid(),
          value: z.string().min(1),
          type: z.enum([CategoryType.INCOME, CategoryType.EXPENSES]),
        });
        const items = converter
          .csv2json(csv.split("\n").filter(Boolean).join("\n"))
          .map((i) => schema.safeParse(i))
          .filter((i) => i.success)
          .map((i) => i.data);
        while (items.length) {
          const Items = items.splice(0, 25);
          await dbClient.send(
            new BatchWriteCommand({
              RequestItems: {
                [Resource.categoryDB.name]: Items.map((Item) => ({
                  PutRequest: { Item },
                })),
              },
            }),
          );
        }
        return;
      }
    }
  }
});