import { z } from "zod";

export const Route = {
  name: "LngSentryExamplePage",
  params: z.object({
    lng: z.string(),
  })
};

