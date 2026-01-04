import { z } from "zod";

export const Route = {
  name: "ApiSentryExampleApi",
  params: z.object({
  })
};

export const GET = {
  result: z.object({}),
};
