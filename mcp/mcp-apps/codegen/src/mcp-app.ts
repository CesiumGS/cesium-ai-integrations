/* eslint-disable @typescript-eslint/no-explicit-any */

import { App } from "@modelcontextprotocol/ext-apps";

const iframe = document.getElementById("iframe")!;
const app = new App({ name: "Codegen App", version: "1.0.0" });

app.connect();

app.ontoolresult = (result: any) => {
  const src = result.content?.find((c: any) => c.type === "text")?.text;
  iframe.setAttribute("src", src);
};
