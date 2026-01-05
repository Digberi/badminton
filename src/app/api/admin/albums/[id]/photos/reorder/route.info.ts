import { z } from "zod";

export const Route = {
  name: "ApiAdminAlbumsIdPhotosReorder",
  params: z.object({
    id: z.string(),
  })
};

