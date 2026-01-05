import { z } from "zod";

export const Route = {
  name: "ApiAdminAlbumsIdPhotosPhotoId",
  params: z.object({
    id: z.string(),
    photoId: z.string(),
  })
};

export const DELETE = {
};
