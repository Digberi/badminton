import {
  OpenAPIRegistry,
  OpenApiGeneratorV3
} from "@asteasolutions/zod-to-openapi";
import * as yaml from "yaml";
import * as fs from "fs";

import * as ApiSentryExampleApi from "../../src/app/api/sentry-example-api/route.info";

import * as ApiPhotos from "../../src/app/api/photos/route.info";

import * as ApiAdminPhotos from "../../src/app/api/admin/photos/route.info";

import * as ApiAdminAlbums from "../../src/app/api/admin/albums/route.info";

import * as ApiAdminPhotosCreatePresigned from "../../src/app/api/admin/photos/create-presigned/route.info";

import * as ApiAdminPhotosConfirm from "../../src/app/api/admin/photos/confirm/route.info";

import * as ApiAdminPhotosId from "../../src/app/api/admin/photos/[id]/route.info";

import * as ApiAdminAlbumsId from "../../src/app/api/admin/albums/[id]/route.info";

import * as ApiAdminAlbumsIdPhotos from "../../src/app/api/admin/albums/[id]/photos/route.info";

import * as ApiAdminAlbumsIdCover from "../../src/app/api/admin/albums/[id]/cover/route.info";

import * as ApiAdminAlbumsIdPhotosPhotoId from "../../src/app/api/admin/albums/[id]/photos/[photoId]/route.info";


const registry = new OpenAPIRegistry();

registry.registerPath({
  method: "get",
  path: "/api/sentry-example-api",
  summary: "",
  request: {
  params: ApiSentryExampleApi.Route.params,
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiSentryExampleApi.GET.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "get",
  path: "/api/photos",
  summary: "",
  request: {
  params: ApiPhotos.Route.params,
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiPhotos.GET.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "get",
  path: "/api/admin/photos",
  summary: "",
  request: {
  params: ApiAdminPhotos.Route.params,
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiAdminPhotos.GET.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "get",
  path: "/api/admin/albums",
  summary: "",
  request: {
  params: ApiAdminAlbums.Route.params,
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiAdminAlbums.GET.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "post",
  path: "/api/admin/albums",
  summary: "",
  request: {
  params: ApiAdminAlbums.Route.params,
  body: {
      required: true,
      content: {
        "application/json": {
          schema: ApiAdminAlbums.POST.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiAdminAlbums.POST.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "post",
  path: "/api/admin/photos/create-presigned",
  summary: "",
  request: {
  params: ApiAdminPhotosCreatePresigned.Route.params,
  body: {
      required: true,
      content: {
        "application/json": {
          schema: ApiAdminPhotosCreatePresigned.POST.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiAdminPhotosCreatePresigned.POST.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "post",
  path: "/api/admin/photos/confirm",
  summary: "",
  request: {
  params: ApiAdminPhotosConfirm.Route.params,
  body: {
      required: true,
      content: {
        "application/json": {
          schema: ApiAdminPhotosConfirm.POST.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiAdminPhotosConfirm.POST.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "delete",
  path: "/api/admin/photos/{id}",
  summary: "",
  request: {
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiAdminPhotosId.DELETE.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "delete",
  path: "/api/admin/albums/{id}",
  summary: "",
  request: {
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiAdminAlbumsId.DELETE.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "put",
  path: "/api/admin/albums/{id}",
  summary: "",
  request: {
  params: ApiAdminAlbumsId.Route.params,
  body: {
      required: true,
      content: {
        "application/json": {
          schema: ApiAdminAlbumsId.PUT.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiAdminAlbumsId.PUT.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "get",
  path: "/api/admin/albums/{id}/photos",
  summary: "",
  request: {
  params: ApiAdminAlbumsIdPhotos.Route.params,
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiAdminAlbumsIdPhotos.GET.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "post",
  path: "/api/admin/albums/{id}/photos",
  summary: "",
  request: {
  params: ApiAdminAlbumsIdPhotos.Route.params,
  body: {
      required: true,
      content: {
        "application/json": {
          schema: ApiAdminAlbumsIdPhotos.POST.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiAdminAlbumsIdPhotos.POST.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "put",
  path: "/api/admin/albums/{id}/cover",
  summary: "",
  request: {
  params: ApiAdminAlbumsIdCover.Route.params,
  body: {
      required: true,
      content: {
        "application/json": {
          schema: ApiAdminAlbumsIdCover.PUT.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiAdminAlbumsIdCover.PUT.result,
        },
      },
    },
  },
});
registry.registerPath({
  method: "delete",
  path: "/api/admin/albums/{id]/photos/[photoId}",
  summary: "",
  request: {
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: ApiAdminAlbumsIdPhotosPhotoId.DELETE.result,
        },
      },
    },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);
const docs = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
    description: "This is the API"
  },
  servers: [{ url: "v1" }]
});

fs.writeFileSync(`./openapi-docs.yml`, yaml.stringify(docs), {
  encoding: "utf-8"
});
