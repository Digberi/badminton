import { z } from "zod";

export const Route = {
  name: "Lng",
  params: z.object({
    lng: z.string(),
  })
};

