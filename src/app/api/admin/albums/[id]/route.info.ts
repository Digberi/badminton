import { z } from "zod";

export const Route = {
  name: "ApiAdminAlbumsId",
  params: z.object({
    id: z.string(),
  })
};

export const DELETE = {
};
