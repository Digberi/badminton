import { z } from "zod";

export const Route = {
  name: "ApiAdminAlbumsIdCover",
  params: z.object({
    id: z.string(),
  })
};

