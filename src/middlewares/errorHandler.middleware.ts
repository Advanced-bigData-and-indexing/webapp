
// setting up cache controll for the healthz end point
export const cacheControl = (req:any, res:any, next:any) => {
  // console.log("In cache middleware");
  if (req.path === "/healthz" ) {
    res.setHeader("cache-control", "no-cache");
    res.setHeader("max", "1");
    res.setHeader("timeout", "1");
    next();
  } else {
    next();
  }

}


// setting up method not allowed end point for certain routes
export const methodNotAllowed = (req: any, res: any, next: any) => {
  // console.log("In method not allowed middleware");
  if (req.path === "/healthz" && req.method !== "GET") {
    res.status(405).end();
  } else {
    next();
  }
}

export const badRequestHandler = (req: any, res: any, next: any) => {
  // console.log("In bad request handler middleware");
  // checking if both the payload is absent
  // and if there are no query params
  if (
    req.path === "/healthz" &&
    req.method === "GET" &&
    (req.headers["content-type"] ||
    Object.keys(req.query).length !== 0)
  ) {
    res.status(400).end();
  } else {
    next();
  }
}
