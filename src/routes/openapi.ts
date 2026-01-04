import {
  OpenAPIRegistry,
  OpenApiGeneratorV3
} from "@asteasolutions/zod-to-openapi";
import * as yaml from "yaml";
import * as fs from "fs";

import * as ApiSentryExampleApi from "../../src/app/api/sentry-example-api/route.info";

import * as ApiPhotos from "../../src/app/api/photos/route.info";

import * as ApiAdminPhotos from "../../src/app/api/admin/photos/route.info";

import * as ApiAdminPhotosCreatePresigned from "../../src/app/api/admin/photos/create-presigned/route.info";

import * as ApiAdminPhotosConfirm from "../../src/app/api/admin/photos/confirm/route.info";

import * as ApiAdminPhotosId from "../../src/app/api/admin/photos/[id]/route.info";


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
