import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`Mini ERP + CRM backend listening on http://localhost:${port}`);
});
