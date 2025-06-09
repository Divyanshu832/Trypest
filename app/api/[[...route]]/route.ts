import { Context, Hono } from "hono";
import { handle } from "hono/vercel";
import { AuthConfig, initAuthConfig } from "@hono/auth-js";
import users from "./users";
import series from "./series";
import order from "./order";
import orderseries from "./orderseries";
import bankacc from "./bankacc";
import expensecat from "./expensecat";
import transaction from "./transaction";
import auditlog from "./auditlog";
import suborder from "./suborder";
// Revert to "edge" if planning on running on the edge
export const runtime = "nodejs";

function getAuthConfig(c: Context): AuthConfig {
  //@ts-ignore
  return {
    // ...authConfig,
    
  };
}

const app = new Hono().basePath("/api")


app.use("*", initAuthConfig(getAuthConfig));

const route = app.route("/users", users)
                 .route("/series", series)
                 .route("/order", order)
                 .route("/orderseries", orderseries)
                 .route("/bank", bankacc)
                 .route("/expensecat", expensecat)
                 .route("/transaction", transaction)
                 .route("/auditlog", auditlog)
                 .route("/suborder", suborder);
                  
export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);

export type AppType = typeof route;
